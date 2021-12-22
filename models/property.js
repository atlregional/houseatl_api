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
	neighborhood_statistical_area: { type: String },
	neighborhood_planning_unit: { type: String },
	tax_allocation_district: { type: String },
	city_council_district: { type: String },
	fair_market_value: { type: Number },
	total_units: { type: Number },
	active: { type: Boolean },
	owner_id: { type: String },
	// manager_id: { type: String },
	upload_id: { type: String },
	user_id: { type: String },
	created_on: { type: Date, default: Date.now() },
	updated_on: { type: Date, default: Date.now() }
});

module.exports = model('property', PropertySchema);
