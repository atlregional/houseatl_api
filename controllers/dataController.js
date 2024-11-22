const { 
  Property,
  Subsidy,
  Resident,
  Agency,
  Upload,
  Owner 
} = require('../models');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');

// const {
//   calculateStats,
//   handleSnapshotData,
//   downloadCSV
// } = require('./propertiesController.utils');
// const util = require('util');

// const getModel = { 
//   property: Property,
//   subsidy: Subsidy,
//   resident: Resident,
//   agency: Agency,
//   upload: Upload,
//   owner: Owner 
// }

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
      id,
      ids,
      justStats, // just get the stats using the filter and include array
      justIDs, // return an array of property IDs 
      pagination,  // return property data in paginated chunks
      populated, // for finding a single property and all its info
      snapshotData, // return data formatted for snapshots
      downloadCSV,
      downloadXLSX
    } = req.query;

    const {
      subsidyFilter, // subsidy level filter w/ {property_id: { $in: includeArray}}
      download, // return csv { fileType: 'csv' or 'xlsx', model: 'properties' or 'subsidies', populated: ''}
      intersectingIDs // set $in query
    } = req.body;

    const result = {};

    console.log('\n***\nRequest Params', req.query);
    console.log('Request Body', req.body );

    if (id) {
      console.log('Get all data for single property', id);
      result.property = await getDataFromModel({
        id,
        model: Property,
        populate: 'subsidies'
      })
      return res.json(result);
    }

    if (ids) {
      console.log('Get all data for list of properties', ids);
      result.properties = await getDataFromModel({
        ids,
        model: Property,
        populate: 'subsidies'
      });
      // console.log({result})
      return res.json(result);
    }

    if (subsidyFilter?.low_income_units)  {
      if (Array.isArray(subsidyFilter.low_income_units)) {
        // Handle Range  
        subsidyFilter.low_income_units = {
          $gte: Number(subsidyFilter.low_income_units?.[0] || 0),
          $lte: Number(subsidyFilter.low_income_units?.[1] || 99999)
        }
      } else {
        subsidyFilter.low_income_units = {$gte: new Date(subsidyFilter.low_income_units)}
      }
    }

    if (subsidyFilter?.start_date)  {
      if (Array.isArray(subsidyFilter.start_date)) {
        // Handle Range  
        subsidyFilter.start_date = {
          $gte: new Date(subsidyFilter.start_date?.[0] || '1900-01-01'),
          $lte: new Date(subsidyFilter.start_date?.[1] || '9999-12-31'),
        }
      } else {
        subsidyFilter.start_date = {$gte: new Date(subsidyFilter.start_date)}
      }
    }

    if (subsidyFilter?.end_date)  {
      if (Array.isArray(subsidyFilter.end_date)) {
        // Handle Range  
        subsidyFilter.end_date = {
          $gte: new Date(subsidyFilter.end_date?.[0] || '1900-01-01'),
          $lte: new Date(subsidyFilter.end_date?.[1] || '9999-12-31'),
        }
      } else {
        subsidyFilter.end_date = {$gte: new Date(subsidyFilter.end_date)}
      }
    }

    if (subsidyFilter?.risk_of_exp)  {
      if (Array.isArray(subsidyFilter.risk_of_exp)) {
        // Handle Range  
        subsidyFilter.risk_of_exp = {
          $gte: new Date(subsidyFilter.risk_of_exp?.[0] || '1900-01-01'),
          $lte: new Date(subsidyFilter.risk_of_exp?.[1] || '9999-12-31'),
        }
      } else {
        subsidyFilter.risk_of_exp = {$lte: new Date(subsidyFilter.risk_of_exp)}
      }
    }

    if (subsidyFilter?.property_id) {
      subsidyFilter.property_id = { 
        $in: subsidyFilter.property_id.map(id => 
          new mongoose.Types.ObjectId(id)) 
      };
    }

    const stringMatchFields = [
      'target_population',
      'funding_sources',
      'development_type'
    ]

    stringMatchFields.forEach(field => {
      if (subsidyFilter?.[field])  {
        if (Array.isArray(subsidyFilter[field])) {
          const filterArray = [];
          subsidyFilter[field].forEach(value => 
            filterArray.push(new RegExp(value))
          );
          subsidyFilter[field] = { $in: filterArray };
        } else {
          subsidyFilter[field] = new RegExp(subsidyFilter[field]);   
        }
      }      
    })
    
    if (download || downloadCSV || downloadXLSX) {
      console.log('CSV Download Requested');
      if (intersectingIDs) {
        const array = intersectingIDs.map(id => new mongoose.Types.ObjectId(id));
        subsidyFilter.property_id = { $in: array };
      }
      const data = await getDataFromModel({
        filter: subsidyFilter || {},
        model: Subsidy, //getModel[download.model] || Subsidy,
        populate: 'property_id'// download.populate || null
      });

      const currentTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'America/New_York'
      }).replace(/[\/,:\s]/g, '-');
  
      console.log(currentTime);

      const columns = [
        { "header":"Property ID",
          "key": "property_id._id"
        },
        { 
          "header":"Project Name",
          "key": "project_name"
        },
        { 
          "header":"Address",
          "key": "property_id.address"
        },
        { 
          "header":"Longitude",
          "key": "property_id.longitude"
        },
        { 
          "header":"Latitude",
          "key": "property_id.latitude"
        },
        { 
          "header":"Total Units",
          "key": "property_id.total_units"
        },
        { 
          "header":"Project Subsidy Units",
          "key": "low_income_units"
        },
        { 
          "header":"Development Type",
          "key": "development_type"
        },
        { 
          "header":"Subsidy Start Date",
          "key": "start_date"
        },
        { 
          "header":"Subsidy End Date",
          "key": "end_date"
        },
        { 
          "header":"Subsidy Early End Date (LIHTC only)",
          "key": "risk_of_exp"
        },
        { 
          "header":"Funding Source",
          "key": "funding_sources"
        },
        // { 
        //   "header":"Duration Until Expiration",
        //   "key": ""
        // },
        // { 
        //   "header":"Extended Use Status (LIHTC only)",
        //   "key": ""
        // },
        { 
          "header":"Stewarding Agency",
          "key": ""
        },
        { 
          "header":"Target Population",
          "key": "target_population"
        },
        { 
          "header":"AMI 30",
          "key": "ami_30"
        },
        { 
          "header":"AMI 50",
          "key": "ami_50"
        },
        { 
          "header":"AMI 60",
          "key": "ami_60"
        },
        { 
          "header":"AMI 80",
          "key": "ami_80"
        },
        { 
          "header":"AMI 100",
          "key": "ami_100"
        },
        { 
          "header":"AMI 115",
          "key": "ami_115"
        },
        { 
          "header":"AMI 120",
          "key": "ami_120"
        },
        { 
          "header":"Census Tract",
          "key": "property_id.census_tract"
        },
        { 
          "header":"Council District",
          "key": "property_id.city_council_district"
        },
        { 
          "header":"Neighborhood Statistical Area",
          "key": "property_id.neighborhood_statistical_area"
        },
        { 
          "header":"NPU",
          "key": "property_id.neighborhood_planning_unit"
        },
        { 
          "header":"TAD",
          "key": "property_id.tax_allocation_district"
        }
      ];

      if (download?.type === 'csv' || downloadCSV ) {
        const csvData = generateCSV(data, columns);
        res.setHeader('Content-Disposition', `attachment; filename=HouseATL-Download-${currentTime}.csv`);
        res.setHeader('Content-Type', 'text/csv');
        res.send(csvData);
      } else if (download?.type === 'xlsx' || downloadXLSX) {
        await generateXLSX(data, columns, res, currentTime);
      } else {
        res.status(400).send('Unsupported download type');
      }
      return;
    }

    console.log('Getting Stats');
    result.stats = await getSubsidyStats(
      subsidyFilter, 
      intersectingIDs
    ) 

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

    // if (pagination) {
    //   console.log('Paginated Data Requested for Page', pagination)
    // }

    if (populated) {
      console.log('Populated Property Data Requested')
    }

    if (snapshotData) {
      console.log('Snapshot Data Requested')

    }

    // ELSE JUST SEND BARE GEO PROPERTY GEOMETRIES
    result.properties = await getDataFromModel({
      model: Property,
      select: 'id, geometry'
    });

    // const features = result.properties.features.map()

    return res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Utility Functions
function generateCSV(data, columns) {
  const opts = { fields: columns.map(col => ({ label: col.header, value: col.key })) };
  const parser = new Parser(opts);
  return parser.parse(data);
};

async function generateXLSX(data, columns, res, currentTime) {
  const workbook = new ExcelJS.Workbook();
  const worksheet2 = workbook.addWorksheet('Properties');
  const worksheet = workbook.addWorksheet('Subsidies');

  worksheet.columns = columns.filter(col => col.key === 'property_id._id' || !col.key.includes('property_id')).map(col => ({ header: col.header, key: col.key }));
  worksheet2.columns = columns.filter(col => col.key.includes('property_id') ).map(col => ({ header: col.header, key: col.key }));

  data.forEach(item => {
    const row = {};
    columns.forEach(col => {
      row[col.key] = col.key.split('.').reduce((o, i) => (o ? o[i] : ''), item);
    });
    row['property_id._id'] = row['property_id._id']?.toString().replace(/"/g, '');
    worksheet.addRow(row);
    // worksheet2.addRow(row);
  });

  const propertyIDs = [];
  data.forEach(item => {
    const row = {};
    columns.forEach(col => {
      row[col.key] = col.key.split('.').reduce((o, i) => (o ? o[i] : ''), item);
    });
    if (!propertyIDs.includes(row['property_id._id'])) {
      row['property_id._id'] = row['property_id._id']?.toString().replace(/"/g, '');
      worksheet2.addRow(row)
      propertyIDs.push(row['property_id._id']);
    }
  });



  res.setHeader('Content-Disposition', `attachment; filename=HouseATL-Download-${currentTime}.xlsx`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  await workbook.xlsx.write(res, { useStyles: true, useSharedStrings: true });
  res.end();
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

function getDataFromModel({ id, ids, model, filter, populate, select }) {
  return new Promise((resolve, reject) => {
    
    let query;
    
    if (id) {
      // Query for a single id
      query = model.findById(id).select(select);
    } else if (ids) {
      // Query for an array of ids
      const idArray = ids.split(',')
        // Convert each string in the array to an ObjectId
      const objectIdArray = idArray.map(id => new mongoose.Types.ObjectId(id));

      query = model.find({ _id: { $in: objectIdArray } }).select(select);
    } else {
      // Query based on a filter
      query = model.find(filter || {}).select(select);
    }
    
    // Apply population if provided
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => query.populate(pop));
      } else {
        query.populate(populate);
      }
    }

    // Execute the query
    query
      .then(result => {
        resolve(result);
      })
      .catch(err => {
        reject(err);
      });
  });
};

// function getDataFromModel({ id, model, filter, populate, select }) {
//   return new Promise((resolve, reject) => {
    
//     const query = id 
//       ? model.findById(id).select(select) 
//       : model.find(filter || {}).select(select);
    
//     if (populate) {
//       if (Array.isArray(populate)) {
//         populate.forEach(pop =>
//         query.populate(pop))
//       } else {
//         query.populate(populate);
//       }
//     }
    
//     query
//       .then(result => {
//         resolve(result);
//       })
//       .catch(err => {
//         reject(err);
//       });
//   });
// };

async function getSubsidyStats(
  subsidyFilter, 
  intersectingIDs
) {

  const today = new Date();
  const onYearFromNow = new Date();
  onYearFromNow.setFullYear(today.getFullYear() + 1);

  let risk_start_date_filter = null;
  let risk_end_date_filter = null;

  if (subsidyFilter?.start_date) {
    if (subsidyFilter.start_date >= today && subsidyFilter.start_date <= onYearFromNow) {
      risk_start_date_filter = { $gte: subsidyFilter.start_date };
    }
  }
  
  if (subsidyFilter?.end_date) {
    if (subsidyFilter.end_date >= today && subsidyFilter.end_date <= onYearFromNow) {
      risk_end_date_filter = { $lte: subsidyFilter.end_date };
    }
  }

  // if (intersectingIDs) {
  //   const array = intersectingIDs || []
  //   subsidyFilter.property_id = {$in: [...array]}
  // }

  if (intersectingIDs) {
    const array = intersectingIDs.map(id => new mongoose.Types.ObjectId(id));
    subsidyFilter.property_id = { $in: array };
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
                  {'$lte': ["$end_date", risk_end_date_filter ||onYearFromNow] }
                ]
              },
              "$low_income_units",
              0 // default value if condition is not met
            ]          
          }
        },
        'maxLowIncomeUnits':  {
          '$max': {
            '$cond': [
              {'$gte': ["$end_date", today] },
              "$low_income_units",
              0 // default value if condition is not met
            ]          
          }       
        }
        // {
        //   '$max': '$low_income_units'
        // }
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
  return stats?.[0] || {
    totalSubsidizedUnits: 0,
    totalAtRiskUnits: 0,
    totalProperties: 0
  }
};

module.exports = { findAll, find };
