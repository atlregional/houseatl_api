const db = require('../models');

module.exports = {
	findAll: (req, res) =>
		db.Agency.find({})
			.then(agencies => res.json(agencies))
			.catch(err => res.status(422).json(err))
};
