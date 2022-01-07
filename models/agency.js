const { Schema, model } = require('mongoose');
// const { Agency } = require('.');

const AgencySchema = Schema(
	{
		name: { type: String },
		uploads: [{ type: Schema.Types.ObjectId, ref: 'upload' }],
		created_on: { type: Date, default: Date.now() },
		updated_on: { type: Date, default: Date.now() }
	},
	{ toJSON: { virtuals: true } }
);

AgencySchema.virtual('id').get(() => this._id);

module.exports = model('agency', AgencySchema);
