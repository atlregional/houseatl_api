const { Schema, model } = require('mongoose');

const UploadSchema = Schema({
	id: { type: String },
	upload_date: { type: String },
	original_filename: { type: String },
	new_filename: { type: String },
	email: { type: String },
	user_id: { type: String },
	agency_id: { type: String }
});

module.exports = model('upload', UploadSchema);
