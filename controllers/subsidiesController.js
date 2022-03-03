const db = require('../models');

// add unfiltered flag to send all data (including no start date)
module.exports = {
	findAll: async (req, res) =>
		db.Subsidy.find({})
			.populate('funding_sources')
			.then(data => {
				// const subsidies = !req.query.unfiltered
				// 	? data.filter(item => item.start_date)
				// 	: data;

				res.json(data);
			})
			.catch(err => res.status(422).json(err))
};
