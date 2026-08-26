const multer = require("../middleware/multer") ;
const uplaodController = require("../Controllers/uploadController") ;
const express = require("express") ;
const router = express.Router() ;
const path = require("path") ;
const getGalleryController = require("../Controllers/getGalleryController") ;

router.get ('/' , getGalleryController ) ;

router.post ('/' , multer.single('image') , uplaodController ) ;


module.exports = router ;