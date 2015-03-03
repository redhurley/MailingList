var express = require("express");
var bodyParser = require('body-parser');
var app = express();
var port = process.env["PORT"];

app.use(express.static(__dirname + '/views'));
// create static directory for static assets
app.use(express.static(__dirname + '/static'));

//logging middleware
app.use(function(req,res,next) {
	console.log("Request at ", req.path);
	next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", function(request, response) {
	// We get access here to the request, so we can find out more information about what the requester wants.

	// We also get access to the response object, which is the object that allows us to send a string (or other things) back to the requester.
	response.send("<h1>Hello World!</h1>");
});

//Respond to POST requests
app.post("/submit", function(request,response,next) {
	console.log(request.body);
	response.end("Thanks " + request.body.email + " for your motherf*ckin email!");
});



app.listen(port);

