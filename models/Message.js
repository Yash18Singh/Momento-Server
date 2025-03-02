const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, default: "" },
    media: { type: String, default: null }, // Image URL
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
