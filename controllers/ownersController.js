const db = require('../models');

module.exports = {
	findAll: (req, res) =>
		db.Owner.find({})
			.then(owners => res.json(owners))
			.catch(err => res.status(422).json(err))
};
