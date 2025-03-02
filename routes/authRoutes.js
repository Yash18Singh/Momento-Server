const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();


//SIGNUP ROUTE
router.post('/signup', async (req, res) => {
    try {
        console.log("Incoming Signup Request:", req.body); // Log request body
        const { name, email, username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email or Username already exists" });
        }

        // Create a new user
        const newUser = new User({ name, email, username, password });
        await newUser.save();

        // Generate a JWT token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || "default_secret");

        // Send Response
        res.status(201).json({ message: "Signup successful", token });

    } catch (error) {
        console.error("Signup Error:", error); // Log full error details
        res.status(500).json({ message: "ERROR IN SIGNUP", error: error.message });
    }
});



//LOGIN ROUTE
router.post('/login', async(req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message: "User not found. Please Signup first!"});
        }

        if(user.password !== password){
            return res.status(401).json({message:"Please check your password"});
        }
        
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET);

        res.status(200).json({message:"Login Successful", token});

    } catch (error) {
        res.status(500).json({mesage: "ERROR IN LOGIN :", error});
    }
})




module.exports = router;