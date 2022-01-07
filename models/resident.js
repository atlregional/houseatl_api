const { Schema, model } = require('mongoose');

const ResidentSchema = Schema(
	{
		type: { type: String },
		subsidy_id: { type: Schema.Types.ObjectId, ref: 'subsidy' },
		user_id: { type: Schema.Types.ObjectId, ref: 'user' },
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

ResidentSchema.virtual('id').get(() => this._id);

module.exports = model('resident', ResidentSchema);
