const db = require('../models');

module.exports = {
	findAll: (req, res) =>
		db.Resident.find({})
			.then(residents => res.json(residents))
			.catch(err => res.status(422).json(err))
};
