const { Property, Subsidy, Resident, Agency, Upload, Owner } = require('../models');
const {
  calculateStats,
  handleSnapshotData,
  downloadCSV
} = require('./propertiesController.utils');
const util = require('util')

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
      // propertyFilter, // property level filter
      // includeArray, // array of property IDs
      justStats, // just get the stats using the filter and include array
      justIDs, // return an array of property IDs 
      pagination,  // return property data in paginated chunks
      populated, // for finding a single property and all its info
      downloadCSV, // return csv
      snapshotData // return data formatted for snapshots
    } = req.query;

    const {
      subsidyFilter, // subsidy level filter w/ {property_id: { $in: includeArray}}
    } = req.body;


    console.log('Request Params', req.query);
    console.log('Request Body', req.body )
    
    const result = {};

    // const propertyFilterObject = propertyFilter || {};
    // const subsidyFilterObject = subsidyFilter || {};

    if (subsidyFilter?.start_date)  {
      subsidyFilter.start_date = {$gte: new Date(subsidyFilter.start_date)}    
    }

    if (subsidyFilter?.end_date)  {
      subsidyFilter.end_date = {$lte: new Date(subsidyFilter.end_date)}    
    }

    // console.log('Requested Subsidy Filter', subsidyFilter);

    console.log('Getting Stats');
    result.stats = await getSubsidyStats(subsidyFilter) 




    if (justStats) {
      console.log('Just Stats Requested');
      return res.json(result);
    }

    if (justIDs) {
      console.log('Just IDs Requested');
      // console.log(subsidyFilter);
      const subsidies = await getDataFromModel({
        model: Subsidy,
        filter: subsidyFilter || {},
        select: 'property_id'
      });
      const propertyIDs = new Set();
      subsidies.forEach(({property_id}) => propertyIDs.add(property_id.toString()))
      result.propertyIDs = [...propertyIDs];

      return res.json(result);
    }



    if (pagination) {
      console.log('Paginated Data Requested for Page', pagination)
    }

    if (populated) {
      console.log('Populated Property Data Requested')
    }

    if (downloadCSV) {
      console.log('CSV Download Requested')
    }

    if (snapshotData) {
      console.log('Snapshot Data Requested')

    }

    // ELSE JUST SEND BARE GEO PROPERTY GEOMETRIES
    result.properties = await getDataFromModel({
      model: Property,
      // populate: 'subsidies',
      select: 'id, geometry'
    });

    return res.json(result);

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

function getDataFromModel({ model, populate, filter, select }) {
  return new Promise((resolve, reject) => {
    
    const query = model.find(filter || {}).select(select);
    
    if (populate) {
      query.populate(populate);
    }
    
    query
      .then(result => {
        resolve(result);
      })
      .catch(err => {
        reject(err);
      });
  });
}

async function getSubsidyStats(subsidyFilter) {

  const today = new Date();
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(today.getMonth() + 6);

  let risk_start_date_filter = null;
  let risk_end_date_filter = null;

  if (subsidyFilter?.start_date) {
    if (subsidyFilter.start_date >= today && subsidyFilter.start_date <= sixMonthsFromNow) {
      risk_start_date_filter = { $gte: subsidyFilter.start_date };
    }
  }
  
  if (subsidyFilter?.end_date) {
    if (subsidyFilter.end_date >= today && subsidyFilter.end_date <= sixMonthsFromNow) {
      risk_end_date_filter = { $lte: subsidyFilter.end_date };
    }
  }
  

  const agg = [
    {
      '$match': subsidyFilter || {}
    }, {
      '$group': {
        '_id': '$property_id',
        'maxAtRiskUnits': {
          '$max': {
            '$cond': [
              {
                '$and': [
                  {'$gte': ["$end_date", risk_start_date_filter || today] },
                  {'$lte': ["$end_date", risk_end_date_filter ||sixMonthsFromNow] }
                ]
              },
              "$low_income_units",
              0 // default value if condition is not met
            ]          
          }
        },
        'maxLowIncomeUnits': {
          '$max': '$low_income_units'
        }
      }
    }, {
      '$group': {
        '_id': null,
        'totalSubsidizedUnits': {
          '$sum': '$maxLowIncomeUnits'
        },
        'totalAtRiskUnits': {
          '$sum': '$maxAtRiskUnits'
        },
        'totalProperties': {
          '$sum': 1
        }
      }
    }
  ];

  const stats = await Subsidy.aggregate(agg).exec();
  return stats[0]
}

module.exports = { findAll, find };
