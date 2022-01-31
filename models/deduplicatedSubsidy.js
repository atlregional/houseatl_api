const { Schema, model } = require('mongoose');

const DeduplicatedSubsidySchema = Schema(
	{
		project_name: { type: String },
		development_type: { type: String },
		start_date: { type: String },
		end_date: { type: String },
		year_15: { type: String },
		year_30: { type: String },
		public_funds: { type: Number },
		private_funds: { type: Number },
		ami_30: { type: String },
		ami_50: { type: String },
		ami_60: { type: String },
		ami_80: { type: String },
		ami_100: { type: String },
		ami_115: { type: String },
		ami_120: { type: String },
		low_income_units: { type: Number },
		property_id: { type: Schema.Types.ObjectId, ref: 'property' },
		user_id: { type: Schema.Types.ObjectId, ref: 'user' },
		subsidy_id: { type: Schema.Types.ObjectId, ref: 'subsidy' },
		funding_sources: [{ type: Schema.Types.ObjectId, ref: 'fundingSource' }],
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

DeduplicatedSubsidySchema.virtual('id').get(() => this._id);

module.exports = model('deduplicatedSubsidy', DeduplicatedSubsidySchema);
