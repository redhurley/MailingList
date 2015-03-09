var mandrill = require("mandrill-api/mandrill");
var mandrill_client = new mandrill.Mandrill("oJi08iNh9ECpkK-kN6q94w");
var mailer = {};

mailer.validateEmail = function (email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

mailer.sendQueuedMail = function (){
	mailer.sendNewUsersInitialMessage();
	// other mails
	mailer.sendSecondMessage();
}

mailer.sendNewUsersInitialMessage = function () {
	// Query for new users
	mailer.db.query("SELECT email FROM users WHERE last_email_sent IS NULL;", function(err, result) {
	    if (err) {
	    	console.log(err);
	    } else {
	    	mailer.db.query("UPDATE users SET last_email_sent=now();")
	      	mailer.firstEmail(result.rows);
	    }
	})
}

// Assemble a new email
mailer.firstEmail = function (users) {
	var message = {
    "from_email": "donnie@tradecrafted.com",
    "from_name": "Donnie",
    "to": users,
    "subject": "Heard You Like to Party",
    "text": "Nobody parties, but me. Automatically sent via Mandrill API."
    }
	console.log("Sent motherf*ckin' email!")
	mailer.sendEmail(message);
	mailer.db.query("INSERT INTO email_schedule (sender_email, email_body, email_subject, email_sequence, email_interval) VALUES ('donnie@tradecrafted.com', NULL, NULL, 1, '1 day');")
}

mailer.sendSecondMessage = function () {
	// Query for users who haven't been sent an email in the past 24h and is the second step in the sequence
	mailer.db.query("SELECT email FROM users WHERE last_email_sent BETWEEN NOW() - INTERVAL '7 day' AND  NOW() - INTERVAL '1 day';", function(err, result) {
		if (err) {
			console.log(err);
		} else {
			mailer.db.query("UPDATE users SET last_email_sent=now();") 
	      	mailer.secondEmail(result.rows);
		}
	})
}

// Assemble second email
mailer.secondEmail = function (users) {
	var message = {
    "from_email": "donnie@tradecrafted.com",
    "from_name": "Donnie",
    "to": users,
    "subject": "We Miss You!",
    "text": "We noticed you haven't partied in the last 24 hours. Well let's fix that. http://youtu.be/UADikS_P7tM. Automatically sent via Mandrill API."
    }
    console.log("Sent motherf*ckin' email!")
	mailer.sendEmail(message);
}

// Send the email to new users using mandrill
mailer.sendEmail = function (message) {
	mandrill_client.messages.send({"message": message, "async": true }, function(response) {
	    console.log(response);
	}, function(e) {
	    // Mandrill returns the error as an object with name and message keys
	    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	});
}

module.exports = mailer;