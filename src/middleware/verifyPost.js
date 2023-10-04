const jwt = require("jsonwebtoken");
const Posts = require("../model/posts");

/*secret token untuk json web token, hasil token yang di encode dengan base64 akan
diberikan ke client yang melakukan login*/
const JWT_SECRET =
  "$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti";

module.exports = async (req, res, next) => {
  const token = req.header('auth-token');
  const { postid: post_id } = req.params;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const author = user.id;

    const foundPost = await Posts.find({ author, _id: post_id}).lean();

    if (foundPost.length != 0) {
      next();
    } else {
      res.status(403);
      return res.json({ status: "error", mesage: "you are not creator of post", author: false, data: {} });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "jwt malformed" || "invalid token") {
      res.status(400);
      res.json({ status: "error", message: "Invalid token" });
    } else {
      res.status(500);
      res.json({ status: "error", message: "Server error" });
    }
  }
};
