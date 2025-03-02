const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const FriendRequest = require("../models/FriendRequest.js");
const Post = require('../models/Post.js')

//SEND REQUEST
router.post('/send-request', async(req, res) => {
    try {
        const {senderId, receiverId} = req.body;
        console.log("Received request body:", req.body); // Debugging

        if(!senderId || !receiverId){
            return res.status(400).json({message: "Missing sender or receiver ID"});
        }

        //check if already friends
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if(sender.friends.includes(receiverId)){
            return res.status(400).json({message: "Already friends"});
        }

        //check if a pending request already exists
        const existingRequest = await FriendRequest.findOne({sender: senderId, receiver: receiverId, status:"pending"});
        if(existingRequest){
            return res.status(400).json({message:"Friend request already sent"});
        }

        //Create new friend request
        const friendRequest = new FriendRequest({sender: senderId, receiver: receiverId});
        await friendRequest.save();

        res.status(201).json({message: "Friend request sent", request: friendRequest});

    } catch (error) {
        res.status(500).json({message: "Error sending request", error: error.message});
    }
});

//ACCEPT REQUEST
router.post('/accept-request', async(req, res) => {
    try {
        const {requestId} = req.body;

        const friendRequest = await FriendRequest.findById(requestId);
        if(!friendRequest){
            return res.status(404).json({message: "Friend request not found"});
        }

        //Update friend list
        const sender = await User.findById(friendRequest.sender);
        const receiver = await User.findById(friendRequest.receiver);

        sender.friends.push(friendRequest.receiver);
        receiver.friends.push(friendRequest.sender);

        await sender.save();
        await receiver.save();

        //Update request status
        friendRequest.status = "accepted";
        await friendRequest.save();

        res.status(200).json({message: "Friend request accepted", sender, receiver});

    } catch (error) {
        res.status(500).json({message: "Error accepting request", error: error.message});
    }
});


//REJECT REQUEST
router.post('/reject-request/:userId/:senderId', async (req, res) => {
  try {
      const { userId, senderId } = req.params;

      const friendRequest = await FriendRequest.findOneAndDelete({
          sender: senderId,
          receiver: userId
      });

      if (!friendRequest) {
          return res.status(404).json({ message: "Friend request not found" });
      }

      res.status(200).json({ message: "Friend request rejected and deleted" });

  } catch (error) {
      res.status(500).json({ message: "Error rejecting request", error: error.message });
  }
});




// GET PENDING FRIEND REQUESTS FOR A USER
router.get('/pending-requests/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find all pending requests where the user is the receiver
        const requests = await FriendRequest.find({ receiver: userId, status: "pending" })
            .populate("sender", "name profilePic"); // Fetch sender details

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching friend requests", error: error.message });
    }
});


//check status
router.get("/check-status/:userId1/:userId2", async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;
  
      console.log("Checking status for:", { userId1, userId2 }); // Debugging
  
      // Fetch both users
      const user1 = await User.findById(userId1);
      const user2 = await User.findById(userId2);
  
      if (!user1 || !user2) {
        return res.status(404).json({ message: "One or both users not found" });
      }
  
      // Check if they are friends
      if (user1.friends.includes(userId2) && user2.friends.includes(userId1)) {
       // console.log("Users are friends:", { userId1, userId2 }); // Debugging
        return res.status(200).json({ status: "friends" });
      }
  
      // Check for pending friend requests
      const request = await FriendRequest.findOne({
        $or: [
          { sender: userId1, receiver: userId2 },
          { sender: userId2, receiver: userId1 },
        ],
      });
  
      if (!request) {
        console.log("No friend request found:", { userId1, userId2 }); // Debugging
        return res.status(200).json({ status: "none" }); // No relationship exists
      }
  
      if (request.status === "accepted") {
        console.log("Friend request accepted:", { userId1, userId2 }); // Debugging
        return res.status(200).json({ status: "friends" });
      }
  
      if (request.sender.toString() === userId1) {
        console.log("Friend request sent by user1:", { userId1, userId2 }); // Debugging
        return res.status(200).json({ status: "sent" });
      } else {
        console.log("Friend request pending for user1:", { userId1, userId2 }); // Debugging
        return res.status(200).json({ status: "pending" });
      }
    } catch (error) {
      console.error("Error checking friend request status:", error); // Debugging
      res.status(500).json({ message: "Error checking friend request status", error: error.message });
    }
  });


//FETCH FRIEND LIST
router.get("/list/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).populate("friends", "name username profilePic");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ friends: user.friends });
    } catch (error) {
        res.status(500).json({ message: "Error fetching friends list", error: error.message });
    }
});


// FETCH FRIENDS' POSTS + USER'S POSTS
router.get("/posts/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user's friends
        const user = await User.findById(userId).populate("friends");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get friends' IDs + user's own ID
        const friendIds = user.friends.map((friend) => friend._id);
        const userAndFriendsIds = [...friendIds, userId]; // ✅ Include user's ID

        // Fetch posts of user + friends, sorted by latest
        const posts = await Post.find({ user: { $in: userAndFriendsIds } })
            .populate("user", "name username profilePic") // Get user details for each post
            .sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


//fetch friends for messages
router.get('/message-list/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user and populate friends list
        const user = await User.findById(userId).populate("friends", "name username profilePic");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Send the friends list
        res.status(200).json(user.friends);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});


router.post("/unfriend/:userId/:friendId", async (req, res) => {
    try {
      const { userId, friendId } = req.params;
  
      console.log("Unfriending:", { userId, friendId }); // Debugging
  
      // Find both users
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);
  
      if (!user || !friend) {
        return res.status(404).json({ message: "One or both users not found" });
      }
  
      // Remove friendId from user's friends list
      user.friends = user.friends.filter((id) => id.toString() !== friendId);
      await user.save();
  
      // Remove userId from friend's friends list
      friend.friends = friend.friends.filter((id) => id.toString() !== userId);
      await friend.save();
  
      // Delete the FriendRequest document (if it exists)
      await FriendRequest.deleteMany({
        $or: [
          { sender: userId, receiver: friendId },
          { sender: friendId, receiver: userId },
        ],
      });
  
      console.log("Unfriended successfully:", { user: user._id, friend: friend._id }); // Debugging
      res.status(200).json({ message: "Successfully unfriended." });
    } catch (error) {
      console.error("Error unfriending:", error); // Debugging
      res.status(500).json({ message: "Server error." });
    }
  });




module.exports = router;