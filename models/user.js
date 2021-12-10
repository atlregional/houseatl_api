const { Schema, model } = require('mongoose');

const UserSchema = Schema({
	id: { type: String },
	username: { type: String },
	firstname: { type: String },
	lastname: { type: String },
	email: { type: String },
	password: { type: String },
	role: { type: String },
	agency_id: { type: String },
	active: { type: Boolean },
	organization: { type: String }
});

module.exports = model('user', UserSchema);
