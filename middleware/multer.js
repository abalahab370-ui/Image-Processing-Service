//So basiclly we have to controlle the images that we r reciving cuz express cant handle them so at this point we need multer package , so it has three arg :
//first the storage location like in memory or in harddick of the server !
//second we check for filefiter if it match the extention in the file name matches the permisable onces ! , note after setting it u use cb arg cuz filefilter is a function with (req , file , cb) if all good go with cb(null , true) else cb(new Error ('.failed to upload it has something woring...') , false) means if the file is ready to go or not !
//third we is the file size limit !

const multer = require('multer');
const path = require('path');

// Store uploaded files in server memory (RAM) as Buffer objects
const storage = multer.memoryStorage();

// Format validation remains identical to keep security tight
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|avif/;
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExt && isValidMime) {
        cb(null, true);
    } else {
        cb(new Error('Invalid image format. Allowed: JPG, PNG, WEBP, AVIF'), false);
    }
};

module.exports = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});