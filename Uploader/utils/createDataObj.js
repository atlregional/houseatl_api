const { Client } = require('@googlemaps/google-maps-services-js');
const apiKey = process.env.GOOGLE_API_KEY;
const client = new Client();
const { handleError } = require('../config/errorConfig');

let partialMatch = false;

const mapDataToObjs = async (agencyObj, data) => {
	const obj = {};

	agencyObj.getCollectionsArr().forEach(collection => {
		obj[collection] = agencyObj.createCollectionObj(collection, data);
	});

	return obj;
};

const clientHandler = async ({
	name,
	original_address,
	city,
	zip,
	latitude,
	longitude
}) => {
	// If partial match is true, data contains lat and lng
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
			// Recursively runs function again with lat & lng to obtain geolocation of property
			clientHandler({ name, original_address, city, zip, latitude, longitude });
		} else if (data.results[0].partial_match && original_address) {
			return handleError(
				original_address,
				'Geolocation error - Partial address match'
			);
		}

		if (partialMatch) partialMatch = false;

		return { data: data.results[0], error: false };
	} else {
		const errorAddressStr = `name: ${name ? name : 'N/A'}, address: ${
			original_address ? original_address : 'N/A'
		}, city: ${city ? city : 'N/A'}, zip: ${zip ? zip : 'N/A'}`;

		return handleError(errorAddressStr, 'Geolocation error - Not enough info');
	}
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

	const { data, error } = await clientHandler({
		name,
		original_address,
		city,
		zip,
		latitude,
		longitude
	});

	if (data && !error) {
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

		return { geocodedObj: obj, error: error };
	} else if (data && error) {
		return { geocodedObj: data, error: error };
	} else if (!data) {
		return handleError(original_address, 'Geolocation Error - No return');
	}
};

const createDataObj = async (agencyObj, item) => {
	const { Property, Subsidy, Owner, Resident, Funding_Source } =
		await mapDataToObjs(agencyObj, item);

	const { geocodedObj, error } = await geocodeProperty(Property);

	// ! use empty geocodedObj to not use GoogleMaps API
	// const geocodedObj = {};
	// const error = false;

	if (!error) {
		const propertyObj = { ...Property, ...geocodedObj };

		return {
			Property: propertyObj,
			Subsidy,
			Owner,
			Resident,
			Funding_Source,
			Error: ''
		};
	} else {
		return {
			Property: '',
			Subsidy: '',
			Owner: '',
			Resident: '',
			FundingSource: '',
			Error: geocodedObj
		};
	}
};

module.exports = createDataObj;
