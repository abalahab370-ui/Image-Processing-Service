//well this project is about image processing have fun wasting your time in reviewing my shi code !
//first this project gonna be like a blogger project that we did but u will post images and get images , not text ! 
//this means we have to build the login , regist system with jwt as always !
//hmmm should i build it again or just copy it from past projects ?
//ithink i will just copy it from my past project i dont wanna start coding every think from scratch cuz its not the goal of this project !

require("dotenv").config() ;
const express = require("express") ;
const app = express() ;
const cors = require("cors") ;
const PORT = process.env.PORT || 5500 ;
const path = require("path") ;
const corsOptions = require("./config/corsOptions") ;
const cookieParser = require("cookie-parser") ;
const mongoose  = require("mongoose") ;
const connectDB = require("./config/dbconnect") ;
const verfieJWT = require("./Controllers/verfieJWT") ; 
const rateLimiter = require("./Controllers/rateLimiter.Js")

//Connecting to The DataBase : 
connectDB() ;

//Starting with building schema of the project  : 
//1- Staring with puting same Neccesary middleware !

app.use(express.urlencoded({extended : false}));
app.use(express.static(path.join(__dirname , "Public"))); // Coming Back to it Later !
app.use(express.json());

//middleware for cookies :
app.use(cookieParser()) ;

app.use(cors(corsOptions));

//Custom Middleware To log each req coming to the Server :
app.use( (req ,res,next) => {
      console.log(`${req.method} ${req.path} ${req.headers.origin}`);
      next();
})

app.use(rateLimiter) ;

app.use('/api' , require("./routing/login") ) ;

app.use('/api/regist' , require("./routing/regist") ) ;

app.use( '/api/refresh' , require("./routing/refresh"))

app.use( '/api/logout' , require("./routing/logout"));

//time for verfieJWT =-= !(refresh and verfie u will burnout ah coding life =*=)
app.use(verfieJWT);



mongoose.connection.once("open" , () => {

      app.listen( PORT , 
            () => {
                  console.log('Connected to MongoDB') ;
                  console.log(`Server is listining in Port ${PORT}`)
            }
      );

})