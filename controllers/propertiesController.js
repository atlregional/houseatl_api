const db = require('../models');

module.exports = {
	findAll: (req, res) =>
		db.Property.find({})
			.then(properties => res.json(properties))
			.catch(err => res.status(422).json(err))
};
