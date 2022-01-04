const { Schema, model, SchemaTypes } = require('mongoose');

const ResidentSchema = Schema({
	id: { type: String },
	type: { type: String },
	subsidy_id: { type: String },
	user_id: { type: String },
	created_on: { type: Date, default: Date.now() },
	updated_on: { type: Date, default: Date.now() }
});

module.exports = model('resident', ResidentSchema);
