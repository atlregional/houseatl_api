const { Property, Subsidy, Resident, Agency, Upload, Owner } = require('../models');

const findAll = async (req, res) => {
  try {
    const [properties, subsidies, residents, agencies, uploads, owners] = await Promise.all([
      getAllDataFromModel(Property),
      getAllDataFromModel(Subsidy),
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

function getAllDataFromModel(model) {
  return new Promise((resolve, reject) => {
    model
      .find({})
      .then(result => {
        resolve(result);
      })
      .catch(err => reject(err));
  });
}

module.exports = { findAll };
