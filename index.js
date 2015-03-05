var express = require("express");
var bodyParser = require("body-parser");
var pg = require("pg");
var app = express();
var conString = process.env["DATABASE_URL"];
var port = process.env["PORT"];
var db;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// logging middleware
app.use(function(req,res,next) {
	console.log("Request at ", req.path);
	next();
});

app.use(express.static(__dirname + '/views'));
// create static directory for static assets
app.use(express.static(__dirname + '/static'));
// Set up response.render() to be able to read and render views that are written in EJS
app.set("view engine", "ejs");

app.get("/", function(req, res) {
	// We get access here to the request, so we can find out more information about what the requester wants.

	// We also get access to the response object, which is the object that allows us to send a string (or other things) back to the requester.
	res.send("<h1>Hello World!</h1>");
});

//Respond to POST requests
app.post("/submit", function(req,res,next) {
	if (validateEmail(request.body.email)) {
		db.query("INSERT INTO users (email, last_email_sent) VALUES ($1, $2)", [req.body.email, null], function(err, result) {
	      if (err) {
	        if (err.code == "23502") {
	          err.explanation = "Didn't get all of the parameters in the request body. Send email and last_email_sent in the request body."
	        }
	        res.status(500).send(err);
	      } 
	      else {
		      console.log(result);
		      res.send("Thanks " + req.body.email + " for your motherf*ckin email!");
	      }
    	});
	}
	else {
		res.send(req.body.email + " ain't a valid motherf*ckin email!");
	}
});

// Connect to postgres, then make the client available to the global scope
pg.connect(conString, function(err, client) {
	db = client;
});

// Get all user emails
app.get("/users", function (req, res) {
  console.log(db);
  db.query("SELECT * FROM users", function(err, result) {
    if (err) {
      res.status(500).send(err);
    } else {
      // Embed users in our HTML
	  res.render("userlist", {"users" : result.rows});
    }
  });	
});

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

app.listen(port);