const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = require("../config/cloudinary"); // Cloudinary setup
const upload = multer({ storage });
const Post = require("../models/Post");
const User = require("../models/User");

// Create a new post
router.post("/create", upload.single("media"), async (req, res) => {
  try {
    const { caption, userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newPost = new Post({
      user: userId,
      caption,
      media: req.file.path, // Cloudinary URL
    });

    const savedPost = await newPost.save();

    // Update the user's post array
    user.posts.push(savedPost._id);
    await user.save();

    res.status(201).json({ message: "Post created successfully", post: savedPost });
  } catch (error) {
    console.error("Post Creation Error:", error);
    res.status(500).json({ message: "Error creating post" });
  }
});





module.exports = router;
