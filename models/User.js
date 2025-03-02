const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Ensure password is NOT unique
  profilePic: { type: String, default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" },
  bio: { type: String, default: "" },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
