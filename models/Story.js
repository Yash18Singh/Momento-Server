const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  media: { type: String, required: true }, // Cloudinary URL
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, expires: 86400, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // Auto-delete after 24 hours
});

module.exports = mongoose.model('Story', StorySchema);
