const { Schema, model } = require('mongoose');

const SubsidySchema = Schema({
	id: { type: String },
	development_type: { type: String },
	awarded_date: { type: Date },
	start_date: { type: Date },
	end_date: { type: Date },
	year_15: { type: Date },
	year_30: { type: Date },
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
	property_id: { type: String },
	user_id: { type: String }
});

module.exports = model('subsidy', SubsidySchema);
