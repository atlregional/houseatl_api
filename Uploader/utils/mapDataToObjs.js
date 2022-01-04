const mappings = require('../config/mappings');

const createPropertyObj = (values, mapping) => {
	const state = values[mapping['state']];

	if (state === 'GA' || state === 'Georgia') {
		const obj = {};
		obj['name'] = values[mapping['name']] || '';
		obj['original_address'] = values[mapping['original_address']] || '';
		obj['city'] = values[mapping['city']] || '';
		obj['zip'] = values[mapping['zip']] || '';
		obj['total_units'] = values[mapping['total_units']] || '';

		return obj;
	}

	return null;
};

const mapDataToObjs = async (org, values) => {
	try {
		const mapping =
			org === 'NHPD'
				? mappings['National Housing Preservation Database']
				: null;

		const Property = createPropertyObj(values, mapping['Property']);

		return { Property };
	} catch (err) {
		console.log(err);
	}
};

module.exports = mapDataToObjs;
