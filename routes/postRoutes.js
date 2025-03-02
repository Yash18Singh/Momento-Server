const express = require('express');
const Post = require('../models/Post');
const router = express.Router();

// Like/Unlike Post
router.post('/like/:postId/:userId', async (req, res) => {
    try {
        const { postId, userId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.likes.includes(userId)) {
            // If already liked, unlike it
            post.likes = post.likes.filter(id => id !== userId);
            await post.save();
            return res.json({ message: "Unliked post", likes: post.likes.length });
        } else {
            // If not liked, add like
            post.likes.push(userId);
            await post.save();
            return res.json({ message: "Liked post", likes: post.likes.length });
        }
    } catch (error) {
        console.error("ERROR LIKING POST:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.get('/check-likes/:postId/:userId', async (req, res) => {
    try {
        const { postId, userId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const isLiked = post.likes.includes(userId);
        res.json({ 
            postId: post._id,
            likeCount: post.likes.length, 
            isLiked 
        });

    } catch (error) {
        console.error("ERROR FETCHING POST:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete('/delete/:postId', async (req, res) => {
    try {
      const { postId } = req.params;
  
      // Delete post from database
      await Post.findByIdAndDelete(postId);
  
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting post", error });
    }
  });
  

module.exports = router;
