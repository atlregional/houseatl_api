const { Schema, model, SchemaTypes } = require('mongoose');

const ResidentSchema = Schema({
	id: { type: String },
	type: { type: String },
	race: { type: String },
	subsidy_id: { type: String },
	user_id: { type: String }
});

module.exports = model('resident', ResidentSchema);
