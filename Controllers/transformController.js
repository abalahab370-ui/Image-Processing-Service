const cloudinary = require('cloudinary').v2;
const Image = require('../Data/image');

const transformController = async (req, res) => {
    try {
        // 1. Fetch image record strictly belonging to the logged-in user
        const imageRecord = await Image.findOne({ 
            _id: req.params.id, 
            userId: req.userId 
        });

        if (!imageRecord) {
            return res.status(404).json({ message: 'Image record not found.' });
        }

        // 2. Extract options sent by handleApplyTransformations in main.js
        const { resize, rotate, format, quality, filters } = req.body.transformations || {};

        // 3. Build Cloudinary transformation options array
        const transformationSteps = [];

        // Resize logic (Width & Height)
        if (resize && (resize.width || resize.height)) {
            const cropMode = (resize.width && resize.height) ? 'fill' : 'scale';
            transformationSteps.push({
                width: resize.width ? parseInt(resize.width) : undefined,
                height: resize.height ? parseInt(resize.height) : undefined,
                crop: cropMode
            });
        }

        // Rotate
        if (rotate && parseInt(rotate) !== 0) {
            transformationSteps.push({ angle: parseInt(rotate) });
        }

        // Quality Compression
        if (quality) {
            transformationSteps.push({ quality: parseInt(quality) });
        }

        // Filters (Grayscale / Sepia)
        if (filters?.grayscale) {
            transformationSteps.push({ effect: 'grayscale' });
        } else if (filters?.sepia) {
            transformationSteps.push({ effect: 'sepia' });
        }

        // 4. Generate transformed URL
        const targetFormat = format ? format.toLowerCase() : imageRecord.format;
        
        const transformedUrl = cloudinary.url(imageRecord.publicId, {
            transformation: transformationSteps,
            format: targetFormat,
            secure: true
        });

        // 5. Calculate estimated processed size for UI metrics
        // (Quality factor approximation for frontend size reduction display)
        const qualityFactor = quality ? (parseInt(quality) / 100) : 1;
        const estimatedSize = Math.round(imageRecord.size * qualityFactor);

        return res.status(200).json({
            url: transformedUrl,
            size: estimatedSize
        });

    } catch (error) {
        console.error('Transform Error:', error);
        return res.status(500).json({ message: 'Transformation failed', error: error.message });
    }
};

module.exports = transformController;