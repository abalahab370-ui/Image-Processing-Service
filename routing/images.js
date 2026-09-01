const multer = require("../middleware/multer") ;
const uplaodController = require("../Controllers/uploadController") ;
const express = require("express") ;
const router = express.Router() ;
const path = require("path") ;
const getGalleryController = require("../Controllers/getGalleryController") ;
const transformController = require("../Controllers/transformController") ;

router.get ('/' , getGalleryController ) ;

router.post ('/' , multer.single('image') , uplaodController ) ;

router.post ( '/:id/transform' , transformController ) ;

module.exports = router ;