const { Schema, model, SchemaTypes } = require('mongoose');

const PropertySchema = Schema({
	id: { type: String },
	name: { type: String },
	geocoded_address: { type: String },
	address: { type: String },
	city: { type: String },
	state: { type: String },
	zip: { type: String },
	county: { type: String },
	latitude: { type: Number },
	longitude: { type: Number },
	census_tract: { type: String },
	neighborhood_planning_unit: { type: String },
	tax_allocation_district: { type: String },
	city_council_district: { type: String },
	fair_market_value: { type: Number },
	total_units: { type: Number },
	active: { type: Boolean },
	upload_id: { type: String },
	user_id: { type: String }
});

module.exports = model('property', PropertySchema);
