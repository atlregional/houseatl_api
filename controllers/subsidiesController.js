const db = require('../models');

module.exports = {
	findAll: async (req, res) =>
		db.Subsidy.find({})
			.populate('funding_sources')
			.then(data => res.json(data))
			.catch(err => res.status(422).json(err))
};
