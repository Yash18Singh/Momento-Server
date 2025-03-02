const express = require('express');
const Comment = require('../models/Comment.js');
const Post = require('../models/Post');

const router = express.Router();

//Add a comment to a post
router.post('/add/:postId/:userId', async(req, res) => {
    const {text} = req.body;
    const {postId, userId} = req.params;

    if(!text){
        return res.status(400).json({message: "Comment text is required"});
    }

    try {
        const newComment = new Comment({
            post: postId,
            user: userId,
            text
        });

        await newComment.save();

        res.status(201).json({message: "Comment added successfully", comment: newComment});

    } catch (error) {
        res.status(500).json({message: "Server error", error});
    }
});

// Delete a comment (Only post owner or the comment author can delete)
router.delete('/delete/:commentId/:userId', async (req, res) => {
    const { commentId, userId } = req.params;

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const post = await Post.findById(comment.post);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the user is either the post owner or the comment author
        if (comment.user.toString() === userId || post.user.toString() === userId) {
            await Comment.findByIdAndDelete(commentId);
            return res.status(200).json({ message: "Comment deleted successfully" });
        } else {
            return res.status(403).json({ message: "You are not authorized to delete this comment" });
        }

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});


//get all comments for a specific post
router.get('/:postId', async(req,res) => {
    try {
        const comments = await Comment.find({post: req.params.postId})
        .populate("user", "username profilePic")
        .sort({createdAt : -1});

        res.status(200).json(comments);

    } catch (error) {
        res.status(500).json({message: "Server error", error});
    }
});

module.exports = router;