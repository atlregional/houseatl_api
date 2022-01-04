const { Schema, model } = require('mongoose');

const FundingSourceSchema = Schema({
	id: { type: String },
	source: { type: String },
	subsidy_id: { type: Schema.Types.String, ref: 'subsidy' },
	user_id: { type: String },
	created_on: { type: Date, default: Date.now() },
	updated_on: { type: Date, default: Date.now() }
});

module.exports = model('fundingSource', FundingSourceSchema);
