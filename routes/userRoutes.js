const express = require("express");
const router = express.Router();
const multer = require('multer');
const User = require("../models/User");
const Post = require("../models/Post");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

// Get full user profile with all details
router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("friends", "username profilePicture") // Populate friends (only username & profilePicture)
      .lean(); // Convert Mongoose document to plain object

    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch posts separately, sorted by latest
    const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      ...user,
      posts,
      friendCount: user.friends ? user.friends.length : 0,
    });
  } catch (error) {
    console.error("Fetch Profile Error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Fetch all posts uploaded by a user
router.get("/posts/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ user: req.params.userId }) // Find posts where user matches
      .populate({ path: "user", select: "name username profilePic" }) // Populate user details
      .populate({ path: "likes", select: "name username profilePic" }) // Populate likes with user info
      .populate({
        path: "comments",
        populate: { path: "user", select: "name username profilePic" } // Populate comments
      })
      .select("-__v") // Exclude Mongoose metadata
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json(posts);
  } catch (error) {
    console.error("Fetch User Posts Error:", error);
    res.status(500).json({ message: "Error fetching user's posts" });
  }
});


// Update profile picture
router.put('/updateProfilePic/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profilePic } = req.body;

    const user = await User.findByIdAndUpdate(userId, { profilePic }, { new: true });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Profile picture updated successfully', user });
  } catch (error) {
    console.error('Profile Picture Update Error:', error);
    res.status(500).json({ message: 'Error updating profile picture' });
  }
});

router.put("/updateUser/:userId", async (req, res) => {
  const { userId } = req.params;
  const { username, name, email, bio, currentPassword, newPassword } = req.body;

  try {
      let user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Check if the current password matches
      if (user.password !== currentPassword) {
          return res.status(400).json({ error: "Incorrect current password" });
      }

      // Check if the email or username already exists
      const existingUser = await User.findOne({
          $or: [{ email }, { username }],
          _id: { $ne: userId }, // Exclude current user from uniqueness check
      });

      if (existingUser) {
          return res.status(400).json({ error: "Username or Email already taken" });
      }

      // Update user details
      user.username = username;
      user.name = name;
      user.email = email;
      user.bio = bio;

      // Update password if provided
      if (newPassword) {
          user.password = newPassword;
      }

      await user.save();
      res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});


router.get('/allUsers', async (req, res) => {
  try {
      const users = await User.find().select("_id name username profilePic");
      res.json(users);
  } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
  }
});


module.exports = router;
