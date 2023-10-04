const mongoose = require("mongoose");

//skema data dari database mongodb (dibutuhkan untuk melakukan crud dengan mongoose)
const CommentSchema = new mongoose.Schema(
  {
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: "PostsSchema" },
    runding_id: { type: mongoose.Schema.Types.ObjectId, ref: "RundingSchema" },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserSchema" }],
    author_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserSchema" }],
    author_username: [{ type: String }],
  },
  { collection: "comments", timestamps: true }
);

const Comment = mongoose.model("CommentSchema", CommentSchema);

module.exports = Comment;
