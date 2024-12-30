const errorHandler = async (err, _req, res, _next) => {
  console.log("error:", err);
  switch (err.name) {
    case "SequelizeValidationError":
      res.status(400).json({ message: err.errors.map((e) => e.message) });
      break;
    case "SequelizeUniqueConstraintError":
      res.status(400).json({ message: err.errors.map((e) => e.message) });
      break;
    case "JsonWebTokenError":
      res.status(401).json({ message: "Invalid Token" });
      break;
    case "empty_token":
      res.status(401).json({ message: "token_is_required" });
      break;
    case "Not_Valid":
      res.status(401).json({ message: "Email or password is invalid" });
      break;
    case "TokenExpiredError":
      res.status(401).json({ message: "Token is expired" });
      break;
    case "token_expired":
      res.status(400).json({ message: "Link verification is expired" });
      break;
    case "empty":
      res.status(400).json({ message: "Required Email or Password" });
      break;
    case "Forbidden":
      res.status(403).json({ message: "Not_Authorize" });
      break;
    case "not_verified":
      res.status(403).json({ message: "Please verify your account first" });
      break;
    case "Not_Found":
      res.status(404).json({ message: "User Not Found" });
      break;
    case "Not Found":
      res.status(404).json({ message: "Data Not Found" });
      break;
    default:
      res.status(500).json({ message: "Internal Server Error" });
      break;
  }
};

module.exports = errorHandler;
