const jwt = require("jsonwebtoken");
const User = require("../model/user");

/*secret token untuk json web token, hasil token yang di encode dengan base64 akan
diberikan ke client yang melakukan login*/
const JWT_SECRET =
  "$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti";

module.exports = async (req, res, next) => {
  const token = req.header('auth-token');

  try {
    if (!token){
      res.status(401);
      return res.json({ status: "error", message: "No auth-token in request" });
    }

    const user = jwt.verify(token, JWT_SECRET);
    const username = user.username;

    const findUser = await User.findOne({ username }).lean();

    if (!findUser) {
      res.status(401)
      return res.json({ status: "error", message: "Invalid username/password" });
    } else {
      req.userloggedIn = { id: findUser._id, username: findUser.username };
      next();
    }
  } catch (error) {
    if (error.message === "jwt malformed" || "invalid token") {
      res.status(400);
      res.json({ status: "error", message: "Invalid token" });
      console.log(token + "has accessed the database (not a user)");
    } else {
      res.status(500);
      res.json({ status: "error", message: "Server error" });
    }
  }
};
