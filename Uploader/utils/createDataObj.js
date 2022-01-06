const { Client } = require('@googlemaps/google-maps-services-js');
const mappings = require('../config/mappings');
const apiKey = process.env.GOOGLE_API_KEY;
console.log(apiKey);
const client = new Client();
const errors = { NoInfo: 0 };
let partialMatch = false;

const handleDataType = (type, value) => {
	if (!value) return '';

	switch (type) {
		case 'str':
			return value.toString();
		case 'int':
			return +value;
		case 'datetime':
			return new Date(value);
		default:
			return value;
	}
};

const createCollectionObj = (values, org, type) => {
	const mapping =
		org === 'NHPD'
			? mappings['National Housing Preservation Database'][type]
			: null;

	const dataTypes = mappings['data_type_mapping'][type];

	const obj = {};

	Object.entries(mapping).forEach(([key, value]) =>
		value
			? (obj[key] = handleDataType(dataTypes[key], values[mapping[key]]))
			: (obj[key] = '')
	);
	return obj;
};

const mapDataToObjs = async (org, values) => {
	const Property = createCollectionObj(values, org, 'Property');
	const Subsidy = createCollectionObj(values, org, 'Subsidy');
	const Owner = createCollectionObj(values, org, 'Owner');
	const Resident = createCollectionObj(values, org, 'Resident');
	const FundingSource = createCollectionObj(values, org, 'Funding_Source');

	return { Property, Subsidy, Owner, Resident, FundingSource };
};

const clientHandler = async ({
	name,
	original_address,
	city,
	zip,
	latitude,
	longitude
}) => {
	const param = original_address && !partialMatch ? 'address' : 'latlng';
	const location =
		original_address && !partialMatch
			? `${original_address} ${city ? ',' + city : ''}, GA${
					zip ? ',' + zip : ''
			  }`
			: latitude && longitude
			? `${latitude}, ${longitude}`
			: null;

	if (location) {
		const { data } = await client.geocode({
			params: {
				[param]: location,
				key: apiKey
			},
			timeout: 2000
		});

		if (
			data.results[0].partial_match &&
			latitude &&
			longitude &&
			!partialMatch
		) {
			partialMatch = true;
			clientHandler({ name, original_address, city, zip, latitude, longitude });
		} else if (data.results[0].partial_match && original_address) {
			errors[original_address] = 'Partial Address Match';
			return null;
		}

		if (partialMatch) partialMatch = false;

		return data.results[0];
	} else {
		errors.NoInfo += 1;
	}

	return null;
};

const geocodeProperty = async ({
	name,
	original_address,
	city,
	zip,
	latitude,
	longitude
}) => {
	const obj = {};

	const data = await clientHandler({
		name,
		original_address,
		city,
		zip,
		latitude,
		longitude
	});

	data['address_components'].forEach(component => {
		let key = '';
		switch (component['types'][0]) {
			case 'locality':
				key = 'city';
				break;
			case 'administrative_area_level_1':
				key = 'state';
				break;
			case 'postal_code':
				key = 'zip';
				break;
			case 'administrative_area_level_2':
				key = 'county';
			default:
				break;
		}
		if (key) obj[key] = component['long_name'];
	});

	obj['geocoded_address'] = data['formatted_address'];
	obj['latitude'] = data['geometry']['location']['lat'];
	obj['longitude'] = data['geometry']['location']['lng'];

	return obj;
};

const createDataObj = async (org, arr) => {
	const obj = {};

	for await (const item of arr) {
		const values = Object.values(item);

		if (values.includes('ATLANTA' || 'Atlanta')) {
			const { Property, Subsidy, Owner, Resident, FundingSource } =
				await mapDataToObjs(org, values);

			const geocodedObj = await geocodeProperty(Property);

			const propertyObj = { ...Property, ...geocodedObj };

			!obj[propertyObj.geocoded_address]
				? (obj[propertyObj.geocoded_address] = {
						Property: propertyObj,
						Subsidy: [Subsidy],
						Owner: Owner,
						Resident: Resident,
						FundingSource: FundingSource
				  })
				: obj[propertyObj.geocoded_address].Subsidy.push(Subsidy);
		}
	}
	return obj;
};

module.exports = createDataObj;
