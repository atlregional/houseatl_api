const { Schema, model, SchemaTypes } = require('mongoose');

const PropertySchema = Schema(
	{
		name: { type: String },
		address: { type: String },
		original_address: { type: String },
		city: { type: String },
		state: { type: String },
		zip: { type: String },
		county: { type: String },
		latitude: { type: Number },
		longitude: { type: Number },
		geometry: { type: Object },
		census_tract: { type: String },
		neighborhood_statistical_area: { type: String },
		neighborhood_planning_unit: { type: String },
		tax_allocation_district: { type: String },
		city_council_district: { type: String },
		school_zone: { type: String },
		high_school_zone: { type: String },
		total_units: { type: Number },
		owner_id: { type: Schema.Types.ObjectId, ref: 'owner' },
		subsidies: [{ type: Schema.Types.ObjectId, ref: 'subsidy' }],
		upload_id: { type: Schema.Types.ObjectId, ref: 'upload' },
		uploads: [{ type: Schema.Types.ObjectId, ref: 'upload' }],
		user_id: { type: Schema.Types.ObjectId, ref: 'user' },
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

PropertySchema.virtual('id').get(() => this._id);
// PropertySchema.virtual('upload_id').get(() => {
// 	console.log(this.uploads);
// 	return this.uploads[0];
// });

module.exports = model('property', PropertySchema);
