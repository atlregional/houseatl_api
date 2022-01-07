const { Schema, model, SchemaTypes } = require('mongoose');

const PropertySchema = Schema(
	{
		name: { type: String },
		geocoded_address: { type: String },
		original_address: { type: String },
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
		total_units: { type: Number },
		active: { type: String },
		owner_id: { type: Schema.Types.ObjectId, ref: 'owner' },
		upload_id: { type: Schema.Types.ObjectId, ref: 'upload' },
		user_id: { type: Schema.Types.ObjectId, ref: 'user' },
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

PropertySchema.virtual('id').get(() => this._id);

module.exports = model('property', PropertySchema);
