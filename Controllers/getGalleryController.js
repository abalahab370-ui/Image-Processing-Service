const Image = require('../Data/image');

const getGalleryController = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        // Querying MongoDB using your req.userId
        const images = await Image.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedImages = images.map(img => ({
            id: img._id,
            filename: img.filename,
            size: img.size,
            url: img.url
        }));

        return res.status(200).json({ images: formattedImages });
    } catch (error) {
        console.error('Fetch Gallery Error:', error);
        return res.status(500).json({ message: 'Failed to fetch gallery' });
    }
};

module.exports = getGalleryController;