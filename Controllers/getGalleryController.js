const Image = require('../Data/image');

const getGalleryController = async (req, res) => {
    try {
        
        // In getGalleryController.js:
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;

        let query = Image.find({ userId: req.userId }).sort({ createdAt: -1 });

        // Only apply pagination if page & limit are explicitly provided in the URL
        if (page && limit) {
            const skip = (page - 1) * limit;
            query = query.skip(skip).limit(limit);
            // Step B: Calculate how many database items to skip
            // Page 1: (1 - 1) * 6 = 0  -> Skip 0 items, get items 1-6
            // Page 2: (2 - 1) * 6 = 6  -> Skip 6 items, get items 7-12
        }

        const images = await query;

        // Step D: Format response payload for frontend simplicity
        const formattedImages = images.map(img => ({
            id: img._id,
            filename: img.filename,
            size: img.size,
            url: img.url
        }));

        // Step E: Send formatted array back as HTTP 200 OK
        return res.status(200).json({ images: formattedImages });

    } catch (error) {
        console.error('Fetch Gallery Error:', error);
        return res.status(500).json({ message: 'Failed to fetch gallery' });
    }
};

module.exports = getGalleryController;