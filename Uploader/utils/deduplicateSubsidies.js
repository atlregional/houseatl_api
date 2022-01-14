require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../../models');
const userId = process.env.user_id;

const compareSubsidies = async (currentSub, comparedSub) => {
	// define rules for a match
	if (
		currentSub.start_date === comparedSub.start_date &&
		currentSub.end_date === comparedSub.end_date &&
		currentSub.low_income_units === comparedSub.low_income_units
	)
		return true;
	return false;
};

const consolidateObjs = async (currentObj, comparedObj) => {
	const obj = {};

	Object.keys(currentObj._doc).forEach(key => {
		if (!currentObj[key] && !comparedObj[key]) obj[key] = '';
		if (
			currentObj[key] === comparedObj[key] ||
			(currentObj[key] && !comparedObj[key])
		)
			obj[key] = currentObj[key];
		if (!currentObj[key] && comparedObj[key]) obj[key] = comparedObj[key];
		// This is where we can decide which obj takes precedence if the values do not match
		if (currentObj[key] !== comparedObj[key] && key !== '_id')
			obj[key] = currentObj[key];
	});
	obj['user_id'] = userId;

	return obj;
};

const deduplicateSubsidies = async propertyId => {
	const property = await db.Property.findById(propertyId)
		.populate({
			path: 'subsidies',
			populate: { path: 'funding_sources' }
		})
		.populate({
			path: 'subsidies',
			populate: { path: 'uploads' }
		});

	// console.log(property);

	if (property.subsidies[1]) {
		let i = 0;
		const obj = {};

		for await (const subsidy of property.subsidies) {
			if (i !== property.subsidies.length - 1) {
				const subsidyMatch = await compareSubsidies(
					subsidy,
					property.subsidies[i + 1]
				);

				if (subsidyMatch) {
					const consolidatedObj = await consolidateObjs(
						subsidy,
						property.subsidies[i + 1]
					);

					console.log(consolidatedObj);
				}
			}
			i++;
		}
	}
};

const init = async () => {
	try {
		const allProperties = await db.Property.find({});

		for await (const property of allProperties.slice(0, 100)) {
			await deduplicateSubsidies(property._id);
		}
	} catch (err) {
		console.log(err);
	}
};

mongoose
	.connect(process.env.MONGODB_URI || 'mongodb://localhost/houseatl', {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(async () => {
		await init();
		// console.log('Process complete.');
		process.exit(0);
	})
	.catch(err => {
		console.log('Unable to connect to DB...');
		console.log(err);
	});
