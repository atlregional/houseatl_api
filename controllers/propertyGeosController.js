const { filter } = require('compression');
const { Geo } = require('../models');
const {
  formatAsProperName,
  formatDateInMongoAggregation,
  getStewardingAgency,
  calRisk,
  handleFundingArray,
  handleTotalSubsidizedUnits
} = require('./propertyGeosControllerUtils');
const util = require('util');

module.exports = {
  findAll: async (req, res) => {
    try {
      const geoJSON = {
        type: 'FeatureCollection',
        features: []
      };

      const lookupProperties = {
        $lookup: {
          from: 'properties',
          localField: 'property_id',
          foreignField: '_id',
          as: 'properties'
        }
      };

      const unwindProperties = { $unwind: '$properties' };

      const lookupOwners = {
        $lookup: {
          from: 'owners',
          localField: 'properties.owner_id',
          foreignField: '_id',
          as: 'properties.ownerName'
        }
      };

      const lookupSubsidies = {
        $lookup: {
          from: 'subsidies',
          localField: 'properties.subsidies',
          foreignField: '_id',
          as: 'properties.subsidies'
        }
      };

      const lookupFundingSources = {
        $lookup: {
          from: 'fundingsources',
          pipeline: [],
          as: 'properties.fundingSources'
        }
      };

      const lookupResidents = {
        $lookup: {
          from: 'residents',
          pipeline: [],
          as: 'properties.residents'
        }
      };

      const lookupAgencies = {
        $lookup: {
          from: 'agencies',
          pipeline: [],
          as: 'properties.agencies'
        }
      };

      const addFieldsToProperties = {
        $addFields: {
          // Add fields to the properties object
          'properties.ownerName': {
            $function: {
              body: formatAsProperName,
              args: [{ $arrayElemAt: ['$properties.ownerName.name', 0] }],
              lang: 'js'
            }
          },
          'properties.tax_allocation_district': { $literal: '' },
          'properties.totalUnits': { $ifNull: ['$properties.total_units', 'n/a'] },
          'properties.totalSubsidizedUnits': handleTotalSubsidizedUnits(),
          // Add fields to each subsidy in properties.subsidies
          'properties.subsidies': {
            $map: {
              input: '$properties.subsidies',
              as: 'subsidy',
              in: {
                $mergeObjects: [
                  '$$subsidy',
                  {
                    // id: { $toString: '$$subsidy._id' },
                    SubStart: {
                      $cond: [
                        { $in: ['$$subsidy.start_date', ['', null, undefined]] },
                        'n/a',
                        formatDateInMongoAggregation('$$subsidy.start_date')
                      ]
                    },
                    SubEnd: {
                      $cond: [
                        { $in: ['$$subsidy.end_date', ['', null, undefined]] },
                        'n/a',
                        formatDateInMongoAggregation('$$subsidy.end_date')
                      ]
                    },
                    RiskOfExp: {
                      $cond: [
                        {
                          $or: [
                            { $eq: ['$$subsidy.risk_of_exp', ''] },
                            { $eq: ['$$subsidy.risk_of_exp', null] },
                            { $eq: ['$$subsidy.risk_of_exp', undefined] },
                            { $not: { $ifNull: ['$$subsidy.risk_of_exp', false] } }
                          ]
                        },
                        'n/a',
                        formatDateInMongoAggregation('$$subsidy.risk_of_exp')
                      ]
                    },
                    UnitsSub: { $ifNull: ['$$subsidy.low_income_units', 0] },
                    housingType: { $ifNull: ['$$subsidy.development_type', 'n/a'] },
                    Funding: handleFundingArray(),
                    Stewarding: {
                      $function: {
                        body: getStewardingAgency.toString(),
                        args: [handleFundingArray(), '$$subsidy.uploads', '$properties.agencies'],
                        lang: 'js'
                      }
                    },
                    tenantType: {
                      $let: {
                        vars: {
                          matchingResident: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$properties.residents',
                                  as: 'resident',
                                  cond: {
                                    $eq: ['$$resident.subsidy_id', '$$subsidy.id']
                                  }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: {
                          $cond: [
                            {
                              $or: [
                                { $eq: ['$$matchingResident', null] },
                                { $eq: ['$$matchingResident.type', ''] },
                                { $eq: ['$$matchingResident.type', null] },
                                { $eq: ['$$matchingResident.type', undefined] }
                              ]
                            },
                            'n/a',
                            '$$matchingResident.type'
                          ]
                        }
                      }
                    },
                    ExtendedUseStatus: {
                      $function: {
                        body: calRisk.toString(),
                        args: ['$$subsidy.end_date', '$$subsidy.risk_of_exp'],
                        lang: 'js'
                      }
                    },
                    RiskUnits: {
                      $function: {
                        body: calRisk.toString(),
                        args: ['$$subsidy.end_date'],
                        lang: 'js'
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      };

      // const filter = {
      //   $match: {
      //     // 'properties.subsidies': { $exists: true, $not: { $size: 0 } },
      //     'properties.totalSubsidizedUnits': { $exists: true, $gt: 0 }
      //   }
      // };

      const projectResult = {
        $project: {
          'properties.owner_id': 0,
          'properties.total_units': 0,
          property_id: 0,
          'properties.fundingSources': 0,
          'properties.residents': 0,
          'properties.agencies': 0
        }
      };

      const populatedPropertyGeos = await Geo.aggregate(
        [
          lookupProperties,
          unwindProperties,
          lookupOwners,
          lookupSubsidies,
          lookupFundingSources,
          lookupResidents,
          lookupAgencies,
          addFieldsToProperties,
          // filter,
          projectResult
        ],
        {
          allowDiskUse: true
        }
      );

      // populatedPropertyGeos.map(obj => {
      //   const test = 'test';
      //   obj.test = test;
      //   obj.properties.test = 'test';
      // });

      // .filter(obj => obj.properties.totalSubsidizedUnits > 0);
      // console.log(populatedPropertyGeos.length);

      // const explain = await Geo.aggregate(
      //   [
      //     lookupProperties,
      //     unwindProperties,
      //     lookupOwners,
      //     lookupSubsidies,
      //     lookupFundingSources,
      //     lookupResidents,
      //     lookupAgencies,
      //     addFieldsToProperties,
      //     // updateStewarding,
      //     projectResult
      //   ],
      //   {
      //     allowDiskUse: true,
      //     explain: true
      //   }
      // ).explain();

      // console.log(util.inspect(explain, false, null, true));

      // console.log(explain);

      geoJSON.features = populatedPropertyGeos;
      // geoJSON.features = populatedPropertyGeos.filter(
      //   obj => obj.properties.totalSubsidizedUnits > 0
      // );
      res.status(200).json(geoJSON);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
