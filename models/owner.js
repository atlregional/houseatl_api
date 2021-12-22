const { Schema, model } = require('mongoose');

const OwnerSchema = Schema({
	id: { type: String },
	name: { type: String },
	user_id: { type: String },
	created_on: { type: Date, default: Date.now() },
	updated_on: { type: Date, default: Date.now() }
});

module.exports = model('owner', OwnerSchema);
