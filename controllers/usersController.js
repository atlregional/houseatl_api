const db = require('../models');

module.exports = {
	findById: ({ params }, res) =>
		db.User.findOne({ id: params.id })
			.then(user => res.json(user))
			.catch(err => res.status(422).json(err))
};
