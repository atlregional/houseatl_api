const { Property, Subsidy, Resident, Agency, Upload, Owner } = require('../models');
const {
  calculateStats,
  handleSnapshotData,
  downloadCSV
} = require('./propertiesController.utils');

const findAll = async (req, res) => {
  try {
    const [properties, subsidies, residents, agencies, uploads, owners] = await Promise.all([
      getAllDataFromModel(Property),
      getAllDataFromModel(Subsidy, 'funding_sources'),
      getAllDataFromModel(Resident),
      getAllDataFromModel(Agency),
      getAllDataFromModel(Upload),
      getAllDataFromModel(Owner)
    ]);

    const result = {
      properties,
      subsidies,
      residents,
      agencies,
      uploads,
      owners
    };

    //

    res.json(result);
  } catch (err) {
    res.status(422).json(err);
  }
};

const find = async (req, res) => {
  try {
    const {
      filter, // filter object
      includeArray, // array of property IDs
      justStats, // just get the stats using the filter and include array
      justIDs, // return an array of property IDs 
      pagination,  // return property data in paginated chunks
      populated, // for finding a single property and all its info
      downloadCSV, // return csv
      snapshotData // return data formatted for snapshots
    } = req.headers;

    const data = {}

    return res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function getAllDataFromModel(model, populate) {
  return new Promise((resolve, reject) => {
    !populate 
    ? model
      .find({})
      .then(result => {
        resolve(result);
      })
      .catch(err => reject(err))
    : model
    .find({})
    .populate(populate)
    .then(result => {
      resolve(result);
    })
    .catch(err => reject(err));
  });
};

module.exports = { findAll, find };
