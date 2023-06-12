const { Schema, model } = require('mongoose');

const GeoSchema = Schema(
  {
    "type": { type: String },
    "geometry": {type: Object},
    "property_id": {type: String}
  }
);

module.exports = model('geo', GeoSchema);

