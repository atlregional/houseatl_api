const db = require('../models');

module.exports = {
	findAll: async (req, res) => {
		try {
			const subsidies = await db.Subsidy.find({});
			const fundingSources = await db.FundingSource.find({});

			const result = subsidies.map(sub => {
				fundingSources.forEach(src => {
					if (sub.id === src.subsidy_id) {
						sub.funding_sources.push(src);
					}
				});
				return sub;
			});

			res.json(result);
		} catch (err) {
			console.log(err);
			res.status(422).json(err);
		}
	}
	// db.Subsidy.find({})
	// 	.populate('funding_sources')
	// 	.then(subsidies => {
	// 		// db.FundingSource.find({})
	// 		// 	.then(data => console.log(data))
	// 		// 	.catch(err => console.log(err));
	// 		res.json(subsidies);
	// 	})
	// 	.catch(err => {

	// 	})
};
