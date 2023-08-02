const { Schema, model } = require('mongoose');

const UploadSchema = Schema(
	{
		upload_date: { type: Date, default: Date.now() },
		original_filename: { type: String },
		new_filename: { type: String },
		user_id: { type: Schema.Types.ObjectId, ref: 'user' },
		agency_id: { type: Schema.Types.ObjectId, ref: 'agency' },
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

UploadSchema.virtual('id').get(() => this._id);

module.exports = model('upload', UploadSchema);
