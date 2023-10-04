const jwt = require("jsonwebtoken");
const Comment = require("../model/comment");

/*secret token untuk json web token, hasil token yang di encode dengan base64 akan
diberikan ke client yang melakukan login*/
const JWT_SECRET =
  "$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti";

module.exports = async (req, res, next) => {
  const token = req.header('auth-token');
  const { commentid: comment_id } = req.params;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userid = user.id;

    const relatedComment = await Comment.findOne({ _id: comment_id }).lean();
    const commentLikes = relatedComment.likes?.toString() || '' ;
    const likeArray = commentLikes.split(",") || commentLikes;

    const foundLike = likeArray.find((str) => str === userid)

    if (!foundLike) {
      next();
    } else {
      return res.json({ status: "redundant", mesage: "You have liked this comment/reply already" });
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
