var express = require("express");
var bodyParser = require("body-parser");
var pg = require("pg");
var mailer = require("./mailer.js");
var app = express();
var conString = process.env["DATABASE_URL"];
var port = process.env["PORT"];
var db;
var cron = require('cron');

var cronJob = cron.job("0 */10 * * * *", function(){
    // perform operation e.g. GET request http.get() etc.
    console.info('cron job completed');
    mailer.queueMail();
}); 
cronJob.start();

// Connect to postgres, then make the client available to the global scope
pg.connect(conString, function(err, client) {
	if (err) {
	  	console.log(err);
	} else {
		db = client;
		mailer.db = db;
		mailer.getEmailTemplates(mailer.addToEmailArray);
	}
});

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
	if (mailer.validateEmail(req.body.email)) {
		db.query("INSERT INTO users (email, last_email_sent) VALUES ($1, $2)", [req.body.email, null], function(err, result) {
	      if (err) {
	        if (err.code == "23502") {
	          err.explanation = "Didn't get all of the parameters in the request body. Send email and last_email_sent in the request body."
	        }
	        res.status(500).send(err);
	      } 
	      else {
		      console.log(result);
		      mailer.sendNewUsersInitialMessage();
		      res.send("Thanks " + req.body.email + " for your motherf*ckin email!");
	      }
    	});
	}
	else {
		res.send(req.body.email + " ain't a valid motherf*ckin email!");
	}
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

app.listen(port);