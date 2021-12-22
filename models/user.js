const { Schema, model } = require('mongoose');

const UserSchema = Schema({
	id: { type: String },
	username: { type: String },
	firstname: { type: String },
	lastname: { type: String },
	email: { type: String },
	password: { type: String },
	role: { type: String },
	activation_token: { type: String },
	active: { type: Boolean },
	agency_id: { type: String },
	organization: { type: String },
	data: { type: String },
	created_on: { type: Date, default: Date.now() },
	updated_on: { type: Date, default: Date.now() }
});

module.exports = model('user', UserSchema);
