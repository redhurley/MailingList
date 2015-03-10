var mandrill = require("mandrill-api/mandrill");
var mandrill_client = new mandrill.Mandrill("oJi08iNh9ECpkK-kN6q94w");
var mailer = {};

mailer.validateEmail = function (email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

mailer.queueMail = function (){
	mailer.db.query("SELECT email FROM users WHERE last_email_sent <= now() - interval '1 day';", function(err, result) {
		if (err) {
			console.log(err);
		} else {
			console.log(result);
			for (var i = 0; i < result.rows.length; i++) {
				console.log(result.rows[i]);
				mailer.db.query("UPDATE users SET sequence = 'Q2' WHERE email = ($1);", [result.rows[i].email]);
			}
		}
	});
	mailer.db.query("SELECT email FROM users WHERE last_email_sent <= now() - interval '7 day';", function(err, result) {
		if (err) {
			console.log(err);
		} else {
			for (var j = 0; j < result.rows.length; j++) {
				console.log(result.rows[j]);
				mailer.db.query("UPDATE users SET sequence = 'Q3' WHERE email = ($1);", [result.rows[j].email]);
			}
		}
	});
	mailer.sendQueuedMail();
}

mailer.sendQueuedMail = function (){
	// Query for users who haven't been sent an email in the past 24h and are in the second step in the sequence
	mailer.db.query("SELECT email FROM users WHERE sequence = 'Q2';", function(err, result) {
		if (err) {
			console.log(err);
		} else {
	      	mailer.sendSecondMessage();
		}
	})
	mailer.db.query("SELECT email FROM users WHERE sequence = 'Q3';", function(err, result) {
		if (err) {
			console.log(err);
		} else {
	      	mailer.sendThirdMessage();
		}
	})
	// mailer.sendSecondMessage();
	// mailer.sendThirdMessage();
}

mailer.sendNewUsersInitialMessage = function () {
	// Query for new users
	mailer.db.query("SELECT email FROM users WHERE sequence IS NULL;", function(err, result) {
	    if (err) {
	    	console.log(err);
	    } else {
	    	mailer.db.query("UPDATE users SET sequence='Q1' WHERE sequence IS NULL;");
	      	mailer.firstEmail(result.rows);
	      	mailer.db.query("UPDATE users SET last_email_sent=now(), sequence='S1' WHERE sequence='Q1';");
	    }
	})
}

mailer.sendSecondMessage = function () {
	mailer.db.query("SELECT email FROM users WHERE sequence = 'Q2';", function(err, result) {
	    if (err) {
	    	console.log(err);
	    } else {
	      	mailer.secondEmail(result.rows);
	      	mailer.db.query("UPDATE users SET last_email_sent = now(), sequence='S2' WHERE sequence = 'Q2';");
	    }
	});
}


mailer.sendThirdMessage = function () {
	mailer.db.query("SELECT email FROM users WHERE sequence = 'Q3';", function(err, result) {
	    if (err) {
	    	console.log(err);
	    } else {
	      	mailer.thirdEmail(result.rows);
	      	mailer.db.query("UPDATE users SET last_email_sent = now(), sequence='S3' WHERE sequence = 'Q3';");
	    }
	});
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
    console.log("Sent 2nd motherf*ckin' email!")
	mailer.sendEmail(message);
}

// Assemble third email
mailer.thirdEmail = function (users) {
	var message = {
    "from_email": "donnie@tradecrafted.com",
    "from_name": "Donnie",
    "to": users,
    "subject": "You're Climbing the Charts",
    "text": "Party on Garth. You've been partying a lot, so keep it up. https://www.youtube.com/watch?v=cl-HrOYKAFs. Automatically sent via Mandrill API."
    }
    console.log("Sent 3rd motherf*ckin' email!")
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