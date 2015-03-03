CREATE DATABASE emails;

CREATE TABLE subscribers (
	id serial NOT NULL PRIMARY KEY,
	email varchar(255),
	created timestamp NOT NULL DEFAULT clock_timestamp(),
	last_email_sent timestamp
);