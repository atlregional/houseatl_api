const { Schema, model } = require('mongoose');

const GeoSchema = Schema({
  type: { type: String },
  geometry: { type: Object },
  property_id: { type: Schema.Types.ObjectId, ref: 'property' }
});

module.exports = model('geo', GeoSchema);
