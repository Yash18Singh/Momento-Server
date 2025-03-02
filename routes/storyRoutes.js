const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const User = require('../models/User')

// Upload a Story
router.post('/add/:userId', async (req, res) => {
    try {
        const { media } = req.body;
        const { userId } = req.params;

        if (!media) return res.status(400).json({ message: "Media is required" });

        const newStory = new Story({ user: userId, media });
        await newStory.save();

        res.status(201).json({ message: "Story added successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.get('/get/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Find the user and their friends
      const user = await User.findById(userId).populate("friends");
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Get an array of friends' IDs + user's own ID
      const friendIds = user.friends.map(friend => friend._id);
      const userAndFriendsIds = [...friendIds, userId]; // ✅ Include user's ID
  
      // Fetch stories of the user + friends that haven't expired
      const stories = await Story.find({
        user: { $in: userAndFriendsIds },
        expiresAt: { $gt: new Date() } // Story should not be expired
      }).populate('user', 'name username profilePic');
  
      // Group stories by user
      const groupedStories = stories.reduce((acc, story) => {
        const userId = story.user._id.toString();
        if (!acc[userId]) {
          acc[userId] = {
            user: story.user,
            stories: [],
          };
        }
        acc[userId].stories.push(story);
        return acc;
      }, {});
  
      // Convert grouped stories to an array
      const result = Object.values(groupedStories);
  
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  });


// Delete a Story
router.delete('/delete/:storyId/:userId', async (req, res) => {
    try {
        const { storyId, userId } = req.params;

        const story = await Story.findById(storyId);
        if (!story) return res.status(404).json({ message: "Story not found" });

        if (story.user.toString() !== userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await story.deleteOne();
        res.status(200).json({ message: "Story deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

module.exports = router;
