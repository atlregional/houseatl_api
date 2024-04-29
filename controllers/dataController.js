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

    res.json(result);
  } catch (err) {
    res.status(422).json(err);
  }
};

const find = async (req, res) => {
  try {
    const {
      filter,
      includeArray,
      justStats,
      justIDs,
      pagination,
      populated,
      downloadCSV,
      snapshotData
    } = req.headers;

    const data = {}

    let query = Property.find({ ...filter });

    if (includeArray) {
      query = query.where('_id').in(includeArray);
    }

    if (populated) {
      query = query.populate('subsidy');
    }



    return res.json(data);

    // if (pagination) {
    //   query = query.limit(pagination);
    // }

    // if (
    //   snapshotData && 
    //   ( snapshotData.subsidiesByExpiration || 
    //     snapshotData.unitsByFundingSource || 
    //     snapshotData.unitsPerStewardingAgency
    //   )
    // ) {
    //   // Assume we handle snapshot data with aggregation or special queries
    //   // This would involve more complex MongoDB operations
    //   return res.json(handleSnapshotData(snapshotData));
    // }

    // if (downloadCSV) {
    //   const data = await query.select('propertyID geometry properties').lean();
    //   return downloadCSV(data);
    // }

    // const properties = await query.select(justIDs ? 'propertyID' : 'propertyID geometry properties').lean();

    // if (justStats) {
    //   return res.json({
    //     stats: calculateStats(properties)
    //   });
    // }

    // if (justIDs) {
    //   return res.json({
    //     propertyIDs: properties.map(({_id} )=> _id),
    //     stats: calculateStats(properties)
    //   });
    // }

    // return res.json({
    //   properties: properties,
    //   stats: calculateStats(properties)
    // });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

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
}

module.exports = { findAll, find };
