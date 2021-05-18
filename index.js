const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const randomstring = require("randomstring");

//load the schema 
const link = require("./schema.js"); 

//for the form data
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

//Load env variables
require('dotenv').config()
port = process.env.PORT || 8080
//Error handler middleware
app.use((error, req, res, next) => {
  console.log(error);
  const message = error.message;
  let statusCode;
  if (error.statusCode) {
    const statusCode = error.statusCode;
  } else {
    statusCode = 500;
  }
  
  res.status(statusCode).json({
    message: message,
  });
});

app.post("/", async (request, response) => {
  //Filter new requests here
  // if entered url is not of the form url
  if (!(/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i.test(request.body.longlink))){
    response.send("<a href='/'>Home</a><h1>Not a valid URL!</h1>");
    return;
   }

   // assign random chars if special is not alphanumeric
  let title;
  if (request.body.special != "" && /^[a-z0-9]+$/i.test(request.body.special)){
    title = request.body.special;
  }else{
    title = randomstring.generate(7);
  }

  // if the special link already exists stop and report to user
  let sent = false;
    await link.find({ title: title}, function (err, docs) {
    if (err){
       console.log(err);
       sent = true;
       response.send("<a href='/'>Home</a><br>Something went wrong.");
       return;
    }
    else if (docs.length != 0){
      sent = true;
      response.send("<a href='/'>Home</a><h1>Already in use! Try something else!</h1>");
      return;
    }
  });

  // prepare data for saving
  const newlink = new link({
    "title":title,
    "content": request.body.longlink,
  });
  
  // save the link to db
  try {
    if (!sent){
      await newlink.save();
      response.send("<a href='/'>Home</a><h1>Here is your short URL!</h1><br><a href="+newlink.title+">Click Here!</a><br>Valid for 1 day!");
    }
  } catch (error) {
    if (!sent)
      response.status(500).send("SERVER error");
  }
});

// return index.html
app.get("/", async (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// lookup db and redirect if possible
app.get("/:word", async (req, res) => {
  
  link.find({ title: req.params.word}, function (err, docs) {
    if (err){
       console.log(err);
       res.send("<a href='/'>Home</a><br>No URL associated with that link.");
    }
    else{
      if (docs==[]){
        res.send("<a href='/'>Home</a><br>No URL associated with that link.");
      }else{
        // Redirect 
       try{
        url = docs[0].content;
        if (url.startsWith("http")){
        res.status(301).redirect(docs[0].content);
      }else{
        res.status(301).redirect('//'+docs[0].content);
      }
      }catch (e){
        res.send("ERROR")
      }
      }
    }
  });


});



//Load and connect to mongoose database
const Url =  "mongodb+srv://"+process.env.DBUSER+":"+process.env.PASS+"@cluster0.cqxay.gcp.mongodb.net/"+process.env.DB+"?retryWrites=true&w=majority";

mongoose.connect(Url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
	autoIndex: false,
  })
  .then(() => {
    console.log("Connected to the database sucessfully");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(port, () => {
  console.log("Server is running...");
});