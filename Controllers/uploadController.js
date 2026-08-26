const cloudinary = require('cloudinary').v2;
const Image = require('../Data/image');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }

        const targetFormat = req.body.format || 'webp';
        const targetWidth = req.body.width ? parseInt(req.body.width) : 800;

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'devspace_uploads',
                    width: targetWidth,
                    crop: 'limit',
                    format: targetFormat,
                    quality: 'auto'
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            
            stream.end(req.file.buffer);
        });

        // Inside uploadController.js:
        const userId = req.userId || req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: User ID missing from token' });
        }

        // Save metadata to MongoDB using your req.userId
        const newImage = await Image.create({
            userId: userId,
            filename: req.file.originalname,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            size: uploadResult.bytes,
            format: uploadResult.format
        });

        return res.status(200).json({
            id: newImage._id,
            filename: newImage.filename,
            url: newImage.url,
            originalSize: req.file.size,
            processedSize: uploadResult.bytes,
            format: uploadResult.format
        });

    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        return res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};

module.exports = uploadController;