const db = require('../models');

module.exports = {
	findAll: (req, res) =>
		db.Upload.find({})
			.then(uploads => res.json(uploads))
			.catch(err => res.status(422).json(err))
};
