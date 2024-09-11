const { Schema, model } = require('mongoose');

const SubsidySchema = Schema(
	{
		project_name: { type: String },
		development_type: { type: String },
    funding_sources: { type: String },
		start_date: { type: Date },
		end_date: { type: Date },
		risk_of_exp: { type: Date },
		year_15: { type: String },
		year_30: { type: String },
		public_funds: { type: Number },
		private_funds: { type: Number },
		ami_30: { type: Number },
		ami_50: { type: Number },
		ami_60: { type: Number },
		ami_80: { type: Number },
		ami_100: { type: Number },
		ami_115: { type: Number },
		ami_120: { type: Number },
		low_income_units: { type: Number },
    target_population: {type: String},
		property_id: { type: Schema.Types.ObjectId, ref: 'property' },
		user_id: { type: Schema.Types.ObjectId, ref: 'user' },
		// funding_sources: [{ type: Schema.Types.ObjectId, ref: 'fundingSource' }],
		deduplicated_subsidies: [
			{ type: Schema.Types.ObjectId, ref: 'deduplicatedSubsidy' }
		],
		uploads: [{ type: Schema.Types.ObjectId, ref: 'upload' }],
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

SubsidySchema.virtual('id').get(() => this._id);

module.exports = model('subsidy', SubsidySchema);
