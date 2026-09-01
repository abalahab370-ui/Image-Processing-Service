const cloudinary = require('cloudinary').v2;
const Image = require('../Data/image');

const deleteImageController = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the image and confirm ownership
        const imageRecord = await Image.findOne({ _id: id, userId: req.userId });
        if (!imageRecord) {
            return res.status(404).json({ message: 'Image not found or unauthorized' });
        }

        // 2. Remove asset from Cloudinary using stored publicId
        if (imageRecord.publicId) {
            await cloudinary.uploader.destroy(imageRecord.publicId);
        }

        // 3. Remove document record from MongoDB
        await Image.deleteOne({ _id: id });

        return res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete Image Error:', error);
        return res.status(500).json({ message: 'Failed to delete image' });
    }
};

module.exports = deleteImageController;