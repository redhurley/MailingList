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

app.get("/", function(request, response) {
	// We get access here to the request, so we can find out more information about what the requester wants.

	// We also get access to the response object, which is the object that allows us to send a string (or other things) back to the requester.
	response.send("<h1>Hello World!</h1>");
});

//Respond to POST requests
app.post("/submit", function(request,response,next) {
	db.query("INSERT INTO users (email, last_email_sent) VALUES ($1, $2)", [request.body.email, null], function(err, result) {
      if (err) {
        if (err.code == "23502") {
          err.explanation = "Didn't get all of the parameters in the request body. Send email and last_email_sent in the request body."
        }
        response.status(500).send(err);
      } else {
      console.log(result);
      response.send("Thanks " + request.body.email + " for your motherf*ckin email!");
      }
    });
});

// Connect to postgres, then make the client available to the global scope
pg.connect(conString, function(err, client) {
	db = client;
});

// Get all user emails
app.get("/users", function (req, res) {
  console.log(db);
  db.query("SELECT email FROM users", function(err, result) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(result.rows);
    }
  });
});

app.listen(port);