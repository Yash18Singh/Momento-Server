const mongoose = require("mongoose");

require('./Comment.js')

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  caption: { type: String, default: "" }, // Caption for the post
  media: { type: String, required: true }, // Image/Video URL
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of users who liked
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // Post comments
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);