const multer = require("../middleware/multer") ;
const uplaodController = require("../Controllers/uploadController") ;
const express = require("express") ;
const router = express.Router() ;
const path = require("path") ;


router.post ('/' , multer.single('image') , uplaodController ) ;

module.exports = router ;