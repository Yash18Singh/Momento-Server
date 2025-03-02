const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User receiving the notification
  type: { type: String, enum: ["like", "comment", "friend_request", "message"], required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User who triggered the notification
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // Related post (if applicable)
  message: { type: String }, // Custom message
  seen: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
