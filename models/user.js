const { Schema, model } = require('mongoose');

const UserSchema = Schema(
	{
		username: { type: String },
		firstname: { type: String },
		lastname: { type: String },
		email: { type: String },
		role: { type: String },
		activation_token: { type: String },
		active: { type: Boolean },
		agency_id: { type: String },
		organization: { type: String },
		data: { type: String },
		uploads: [{ type: Schema.Types.ObjectId, ref: 'upload' }],
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

UserSchema.virtual('id').get(() => this._id);

module.exports = model('user', UserSchema);
