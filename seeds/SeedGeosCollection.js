require('dotenv').config();
const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI;

const { Geo, Property } = require('../models');

const init = () => {
  mongoose
    .connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(async () => {
      try {
        console.log('db connected');
        const properties = await getPropertiesArray();

        if (properties?.[0]) {
          await seedGeosCollection(properties);
          console.log('inserted geos');
        }
      } catch (err) {
        throw new Error(err);
      }
    })
    .catch(err => {
      console.log(err);
      process.exit(1);
    });
};

async function getPropertiesArray() {
  const properties = await Property.find({}).select('_id geometry').lean();
  return properties;
}

async function seedGeosCollection(properties) {
  const geos = properties.map(property => ({
    type: 'Feature',
    geometry: property.geometry,
    property_id: property._id
  }));

  if (geos?.[0]) {
    await Geo.insertMany(geos);
  }
  return;
}

init();
