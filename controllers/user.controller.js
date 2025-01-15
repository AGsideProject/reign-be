const { User, Session } = require("../models");
const { hashThePassword, compareThePass } = require("../helpers/encryption");
const {
  payloadToToken,
  payloadToRefreshToken,
  verifyRefreshToken,
} = require("../helpers/token-generator");

class UserController {
  // get all users
  static async getAllUsers(_req, res, next) {
    try {
      const users = await User.findAll({
        attributes: [
          "id",
          "full_name",
          "email",
          "phone_number",
          "role",
          "createdAt",
          "updatedAt",
        ],
      });

      return res.status(200).json({
        message: "success",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  // Register new user
  static async signUp(req, res, next) {
    try {
      const {
        full_name,
        email,
        password,
        phone_number,
        role = "staff",
      } = req.body;

      // Check if the email is already in use
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser)
        return res.status(400).json({ message: "Email already in use" });

      // Create and get user
      await User.create({
        full_name,
        email,
        password,
        phone_number,
        role,
      });

      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Function to generate tokens
  static generateTokens = async (user) => {
    try {
      // Payload for tokens
      const payload = { id: user.id, email: user.email };

      // Generate access token and refresh token using helper functions
      const access_token = payloadToToken(payload);

      const refresh_token = payloadToRefreshToken(payload);

      // Store session to DB
      await Session.create({ userId: user.id, token: refresh_token });

      return { access_token, refresh_token };
    } catch (error) {
      throw new Error("Error generating tokens");
    }
  };

  // Login function
  static async signIn(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res
          .status(400)
          .json({ message: "Email and password are required" });

      const user = await User.findOne({ where: { email }, raw: true });

      if (!user) return res.status(404).json({ message: "User not found" });

      const isValid = compareThePass(password, user.password);
      if (!isValid)
        return res.status(401).json({ message: "Invalid credentials" });

      const { access_token, refresh_token } =
        await UserController.generateTokens(user);

      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      return res.status(200).json({
        access_token,
        user: { full_name: user.full_name, email: user.email, role: user.role },
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh token function
  static async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.cookies;

      if (!refresh_token)
        return res.status(401).json({ message: "Refresh token is required" });

      // Verify the refresh token using helper function
      const decoded = verifyRefreshToken(refresh_token);
      const user = await User.findByPk(decoded.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      // Generate new tokens
      const { access_token, refresh_token: newRefreshToken } =
        await UserController.generateTokens(user);

      // Store new refresh token in cookies
      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      return res.status(200).json({ access_token });
    } catch (error) {
      next(error);
    }
  }

  // Logout function
  static async logout(req, res, next) {
    try {
      const { refresh_token } = req.cookies;

      if (!refresh_token)
        return res.status(400).json({ message: "No refresh token provided" });

      await Session.destroy({ where: { token: refresh_token } });

      res.clearCookie("refresh_token");

      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Update user
  static async updateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { full_name, email, phone_number, role, password } = req.body;

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.full_name = full_name || user.full_name;
      user.email = email || user.email;
      user.phone_number = phone_number || user.phone_number;
      user.role = role || user.role;

      if (password) {
        user.password = hashThePassword(password);
      }

      await user.save();

      return res
        .status(200)
        .json({ message: "User updated successfully", user });
    } catch (error) {
      next(error);
    }
  }

  // Delete user
  static async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await user.destroy();

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
