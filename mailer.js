var mandrill = require("mandrill-api/mandrill");
var fs = require("fs");
var mandrill_client = new mandrill.Mandrill("oJi08iNh9ECpkK-kN6q94w");
var mailer = {};
var emailTemplates = [];

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
				mailer.db.query("UPDATE users SET sequence = 'Q2' WHERE sequence = 'S1' AND email = ($1);", [result.rows[i].email]);
			}
		}
	});
	mailer.db.query("SELECT email FROM users WHERE sequence = 'S2' AND last_email_sent <= now() - interval '7 days';", function(err, result) {
		if (err) {
			console.log(err);
		} else {
			for (var j = 0; j < result.rows.length; j++) {
				console.log(result.rows[j]);
				mailer.db.query("UPDATE users SET sequence = 'Q3' WHERE sequence='S2' AND email = ($1);", [result.rows[j].email]);
			}
		}
	});
	mailer.sendQueuedMail();
}

mailer.sendQueuedMail = function (){
	mailer.sendSecondMessage();
	mailer.sendThirdMessage();
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
	var actualHTML = mailer.checkingSequence("Q1");
	var message = {
    "from_email": "donnie@tradecrafted.com",
    "from_name": "Donnie",
    "to": users,
    "subject": "Heard You Like to Party",
    "html" : actualHTML.toString()
    }
	mailer.sendEmail(message);
}

// Assemble second email
mailer.secondEmail = function (users) {
	var actualHTML = mailer.checkingSequence("Q2");
	var message = {
    "from_email": "donnie@tradecrafted.com",
    "from_name": "Donnie",
    "to": users,
    "subject": "We Miss You!",
    "html" : actualHTML.toString()
    }
	mailer.sendEmail(message);
}

// Assemble third email
mailer.thirdEmail = function (users) {
	var actualHTML = mailer.checkingSequence("Q3");
	var message = {
    "from_email": "donnie@tradecrafted.com",
    "from_name": "Donnie",
    "to": users,
    "subject": "You're Climbing the Charts",
    "html" : actualHTML.toString()
    }
	mailer.sendEmail(message);
}

// write function that reads 3 files using fs.readfile. needs to do it asynchronously
mailer.getEmailTemplates = function (dog) {
	var tempArray = [];
	var count = 0;
	fs.readFile("./email_templates/email_1.html", function (err, result) {
		if (err) {
			console.log(err);
		} else {
			tempArray[0] = result;
			count++;
			if (count == 3) {
				dog(tempArray);
			}
		}
	})
	fs.readFile("./email_templates/email_2.html", function (err, result) {
		if (err) {
			console.log(err);
		} else {
			tempArray[1] = result;
			count++;
			if (count == 3) {
				dog(tempArray);
			}
		}
	})
	fs.readFile("./email_templates/email_3.html", function (err, result) {
		if (err) {
			console.log(err);
		} else {
			tempArray[2] = result;
			count++;
			if (count == 3) {
				dog(tempArray);
			}
		}
	})
}

mailer.addToEmailArray = function (emailsArray) {
	mailer.emailTemplates = emailsArray;
}

mailer.checkingSequence = function (dog) {
	if (dog == "Q1") {
		return mailer.emailTemplates[0];
	} else if (dog == "Q2") {
		return mailer.emailTemplates[1];
	} else if (dog == "Q3") {
		return mailer.emailTemplates[2];
	}
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