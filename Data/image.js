const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    url: {
        type: String, // Cloudinary secure_url
        required: true
    },
    publicId: {
        type: String, // Critical for Cloudinary transformations & deletions
        required: true
    },
    size: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);