const jwt = require("jsonwebtoken");
const Posts = require("../model/posts");
const User = require("../model/user");

/*secret token untuk json web token, hasil token yang di encode dengan base64 akan
diberikan ke client yang melakukan login*/
const JWT_SECRET =
  "$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti";

module.exports = async (req, res, next) => {
  const token = req.header('auth-token');
  const { postid: post_id } = req.params;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const _id = user.id;

    const relatedPost = await Posts.findOne({ _id: post_id }).lean();
    const postRunding = relatedPost.runding_id?.toString() || '' ;
    const findUser = await User.findOne({ _id }).lean();
    const adminKelas = findUser.adminkelas?.toString() || '' ;
    const pesertaKelas = findUser.pesertakelas?.toString() || '' ;

    const newAdmin = adminKelas.split(",");
    const newPeserta = pesertaKelas.split(",");

    const foundAdmin = newAdmin.find((str) => str === postRunding)
    const foundPeserta = newPeserta.find((str) => str === postRunding)

    if (foundAdmin || foundPeserta) {
      next();
    } else {
      res.status(403);
      return res.json({ status: "error", mesage: "you are not a member of this post's group, please join first", member: false, data: {} });
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
