const { Schema, model } = require('mongoose');

const FundingSourceSchema = Schema(
	{
		source: { type: String },
		subsidy_id: { type: Schema.Types.ObjectId, ref: 'subsidy' },
		user_id: { type: Schema.Types.ObjectId, ref: 'user' },
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

FundingSourceSchema.virtual('id').get(() => this._id);

module.exports = model('fundingSource', FundingSourceSchema);
