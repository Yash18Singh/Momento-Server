const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// Send a message
router.post("/send", async (req, res) => {
    try {
        const { sender, receiver, text, media } = req.body;
        let mediaUrl = null;

        if (media) {
            const uploadRes = await cloudinary.uploader.upload(media, {
                folder: "chat_media",
            });
            mediaUrl = uploadRes.secure_url;
        }

        const message = new Message({ sender, receiver, text, media: mediaUrl });
        await message.save();

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Fetch chat history
router.get("/history/:userId/:friendId", async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId },
            ],
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});


//Clear Chat
router.delete('/delete/:userId/:friendId', async (req, res) => {
    try {
        const { userId, friendId } = req.params;

        if (!userId || !friendId) {
            return res.status(400).json({ message: "User ID and Friend ID are required" });
        }

        await Message.deleteMany({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        });

        res.status(204).send(); // 204 No Content, since we deleted messages

    } catch (error) {
        res.status(500).json({ message: "Error deleting chat", error: error.message });
    }
});


module.exports = router;