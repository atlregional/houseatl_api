const { Client } = require('@googlemaps/google-maps-services-js');
const mappings = require('../config/mappings');
const apiKey = process.env.GOOGLE_API_KEY;
const client = new Client();
const errors = { NoInfo: 0 };
let partialMatch = false;

const handleDataType = (type, value, agency) => {
	if (!value) return '';

	switch (type) {
		case 'str':
			return value.toString();
		case 'int':
			return +value;
		case 'date':
			if (agency === 'Invest Atlanta') {
				const dateArr = value.split('-');
				return new Date(`${dateArr[0]}-01-${dateArr[1]}`);
			}
			return new Date(value);
		default:
			return value.toString();
	}
};

const calculateTotal = (item, value) => {
	let total = 0;

	value.forEach(key => {
		if (item[key]) total += +item[key];
	});

	return total;
};

const createCollectionObj = (item, agency, type) => {
	const mapping = mappings[agency][type];

	const dataTypes = mappings['data_type_mapping'][type];

	const obj = {};

	// Key: key we want for db, Value: Header from file
	Object.entries(mapping).forEach(([key, value]) => {
		value && typeof value !== 'object'
			? (obj[key] = handleDataType(dataTypes[key], item[mapping[key]], agency))
			: // ! Handles case where data has AMI split up into headers based on # of bedrooms
			value &&
			  typeof value === 'object' &&
			  agency === 'Invest Atlanta' &&
			  type === 'Subsidy'
			? (obj[key] = handleDataType(
					dataTypes[key],
					calculateTotal(item, value),
					agency
			  ))
			: (obj[key] = '');
	});
	return obj;
};

const mapDataToObjs = async (agency, data) => {
	const Property = createCollectionObj(data, agency, 'Property');
	const Subsidy = createCollectionObj(data, agency, 'Subsidy');
	const Owner = createCollectionObj(data, agency, 'Owner');
	const Resident = createCollectionObj(data, agency, 'Resident');
	const FundingSource = createCollectionObj(data, agency, 'Funding_Source');

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

	obj['address'] = data['formatted_address'];
	obj['latitude'] = data['geometry']['location']['lat'];
	obj['longitude'] = data['geometry']['location']['lng'];

	return obj;
};

const createDataObj = async (agency, item) => {
	const { Property, Subsidy, Owner, Resident, FundingSource } =
		await mapDataToObjs(agency, item);

	const geocodedObj = await geocodeProperty(Property);

	// ! use empty geocodedObj to not use GoogleMaps API
	// const geocodedObj = {};

	const propertyObj = { ...Property, ...geocodedObj };

	// console.log({ propertyObj, Subsidy, Owner, Resident, FundingSource });
	return { Property: propertyObj, Subsidy, Owner, Resident, FundingSource };
};

module.exports = createDataObj;
