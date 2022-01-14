const { Schema, model } = require('mongoose');

const OwnerSchema = Schema(
	{
		name: { type: String },
		user_id: { type: Schema.Types.ObjectId, ref: 'user' },
		uploads: [{ type: Schema.Types.ObjectId, ref: 'upload' }],
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

OwnerSchema.virtual('id').get(() => this._id);

module.exports = model('owner', OwnerSchema);
