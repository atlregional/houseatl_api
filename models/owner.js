const { Schema, model } = require('mongoose');

const OwnerSchema = Schema({
	id: { type: String },
	name: { type: String },
	user_id: { type: String }
});

module.exports = model('owner', OwnerSchema);
