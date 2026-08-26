const express = require("express") ;
const router = express.Router() ;
const logoutHandler = require("../Controllers/logoutHandler") ;

router.delete( '/' , logoutHandler ) ;

module.exports = router ;