const { User, Session } = require("../models");

class UserController {
  // Register new user
  static async signUp(req, res, next) {
    try {
      // Destructuring payload from client
      const { full_name, email, password, phone_number } = req.body;

      // Create and get user
      const data = (
        await User.create({
          full_name,
          email,
          password,
          phone_number,
          role,
        })
      ).get({ plain: true });

      // Send response
      if (data) res.status(201).json({ message: "user created successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Function ton generate tokens
  static generateTokens = async (user) => {
    try {
      // Get today's date without the time
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get tomorrow's date without the time
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const access_token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACESS_TOKEN_EXPIRES }
      );

      const refresh_token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRES,
        }
      );

      // Sore session to db
      await Session.create({ userId: user.id, token: refresh_token });

      return { access_token, refresh_token };
    } catch (error) {
      throw new Error("Error generating tokens");
    }
  };

  // Login funtion
  static async signIn(req, res, next) {
    try {
      // Destructuring payload
      const { email, password } = req.body;

      // Validate body
      if (!password || !email) throw { name: "empty" };

      const user = await User.findOne({ where: { email } });

      // Check if the user exists
      if (!user) throw { name: "Not_Valid" };

      // Compare the password
      const isValid = compareThePass(password, user.password);
      if (!isValid) throw { name: "Not_Valid" };

      // Generate access token & refresh token
      const { access_token, refresh_token } =
        await UserController.generateTokens(user);

      // Store to cookies
      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      // Send response
      return res.status(200).json({
        access_token,
        user: {
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
