const { Schema, model } = require('mongoose');

const AgencySchema = Schema({
	id: { type: String },
	name: { type: String },
	created_on: { type: Date, default: Date.now() },
	updated_on: { type: Date, default: Date.now() }
});

module.exports = model('agency', AgencySchema);
