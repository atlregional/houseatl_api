const { Schema, model } = require('mongoose');

const UploadSchema = Schema({
	id: { type: String },
	upload_date: { type: Date },
	original_filename: { type: Date },
	new_filename: { type: String },
	email: { type: String },
	user_id: { type: String },
	agency_id: { type: String },
	created_on: { type: Date, default: Date.now() },
	updated_on: { type: Date, default: Date.now() }
});

module.exports = model('upload', UploadSchema);
