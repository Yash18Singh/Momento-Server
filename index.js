require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require("http");
const socketIo = require("socket.io");

const authRoutes = require('./routes/authRoutes.js');
const uploadRoutes = require('./routes/uploadRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const friendRoutes = require('./routes/friendRoutes.js');
const postRoutes = require('./routes/postRoutes.js');
const commentRoutes = require('./routes/commentRoutes.js');
const storyRoutes = require('./routes/storyRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js')

const Message = require("./models/Message"); // Import your Message Schema

const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://10.0.2.2:5000",
        credentials: true
    }
});

app.use(express.json());
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("CONNECTED TO MONGODB"))
    .catch((err) => console.log("ERROR CONNECTING WITH MONGODB ", err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log("SERVER IS RUNNING ON THE PORT :", PORT);
});



io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("sendMessage", async ({ sender, receiver, text, media }) => {
        let mediaUrl = null;

        if (media) {
            try {
                console.log("Uploading media to Cloudinary:", media); // Debugging
                const uploadRes = await cloudinary.uploader.upload(media, {
                    folder: "chat_media",
                });
                mediaUrl = uploadRes.secure_url;
                console.log("Media uploaded successfully:", mediaUrl); // Debugging
            } catch (error) {
                console.error("Error uploading media to Cloudinary:", error); // Debugging
                socket.emit("uploadError", { message: "Failed to upload media" });
                return;
            }
        }

        try {
            const message = new Message({ sender, receiver, text, media: mediaUrl });
            await message.save();
            io.emit("newMessage", message);
        } catch (error) {
            console.error("Error saving message to database:", error); // Debugging
            socket.emit("saveError", { message: "Failed to save message" });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});


// ROUTES
app.use('/auth', authRoutes);
app.use('/post', uploadRoutes);
app.use('/user', userRoutes);
app.use('/friends', friendRoutes);
app.use('/uploadedPosts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/story', storyRoutes);
app.use('/chat', chatRoutes)
