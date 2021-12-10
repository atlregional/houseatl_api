const db = require('../models');

module.exports = {
	findAll: (req, res) =>
		db.Subsidy.find({})
			.then(subsidies => res.json(subsidies))
			.catch(err => res.status(422).json(err))
};
