const jwt = require("jsonwebtoken");
const User = require("../model/user");

/*secret token untuk json web token, hasil token yang di encode dengan base64 akan
diberikan ke client yang melakukan login*/
const JWT_SECRET =
  "$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti";

module.exports = async (authToken) => {
  const token = authToken;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const username = user.username;

    const findUser = await User.findOne({ username }).lean();

    if (!findUser) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    if (error.message === "jwt malformed" || "invalid token") {
      console.log("Socket user access : token is error");
      return false;
    } else {
      console.log("Socket user access : error");
      return false;
    }
  }
};
