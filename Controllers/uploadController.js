const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your .env credentials
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

        // 1. Grab options from request body (or use defaults)
        const targetFormat = req.body.format || 'webp';
        const targetWidth = req.body.width ? parseInt(req.body.width) : 800;

        // 2. Stream RAM buffer to Cloudinary with transformations built-in
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'devspace_uploads',
                    width: targetWidth,
                    crop: 'limit',              // Resizes proportionately without stretching
                    format: targetFormat,        // Auto-converts to webp, png, etc.
                    quality: 'auto'              // Smart compression handled by Cloudinary
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            
            // Send the raw Multer buffer
            stream.end(req.file.buffer);
        });

        // 3. Return the transformed Cloudinary URL to the frontend
        return res.status(200).json({
            url: uploadResult.secure_url,
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