const { Schema, model } = require('mongoose');

const AgencySchema = Schema({
	id: { type: String },
	name: { type: String }
});

module.exports = model('agency', AgencySchema);
