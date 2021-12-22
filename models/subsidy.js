const { Schema, model } = require('mongoose');

const SubsidySchema = Schema({
	id: { type: String },
	project_name: { type: String },
	development_type: { type: String },
	awarded_date: { type: String },
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
	property_id: { type: String },
	user_id: { type: String },
	created_on: { type: Date, default: Date.now() },
	updated_on: { type: Date, default: Date.now() }
});

module.exports = model('subsidy', SubsidySchema);
