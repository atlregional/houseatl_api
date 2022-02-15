const { Client } = require('@googlemaps/google-maps-services-js');
const apiKey = process.env.GOOGLE_API_KEY;
const client = new Client();
const turf = require('@turf/turf');
const coaGeoJSON = require('../geojsons/Cities_Georgia.json');
const geojsonConfig = require('./config/geojsonConfig');
const {
	configureAddressStr,
	configurePartialMatchAddress
} = require('./utils');

const { handleError } = require('./config/errorConfig');

let partialMatch = false;

const turfHandler = {
	pointInCOA: async propertyCoordinates => {
		const COACoordinates = coaGeoJSON['features'][0]['geometry']['coordinates'];
		const point = turf.point(propertyCoordinates);
		const multiPoly = turf.multiPolygon(COACoordinates);

		return turf.booleanPointInPolygon(point, multiPoly);
	},
	getPropertiesFromGeoJSONs: async propertyCoordinates => {
		const obj = {};
		const point = turf.point(propertyCoordinates);

		for (const config of Object.values(geojsonConfig)) {
			for (const feature of config.geoJSON.features) {
				const shape =
					feature.geometry.type === 'Polygon'
						? turf.polygon(feature.geometry.coordinates)
						: turf.multiPolygon(feature.geometry.coordinates);

				const pointInShape = turf.booleanPointInPolygon(point, shape);

				if (pointInShape) {
					obj[config.modelKey] = feature.properties[config.propertiesKey];
					break;
				}
			}
		}
		return obj;
	}
};

const clientHandler = async ({
	name,
	original_address,
	updated_address,
	city,
	zip,
	latitude,
	longitude
}) => {
	const param =
		original_address || updated_address
			? 'address'
			: latitude && longitude
			? 'latlng'
			: null;

	const location =
		param === 'address' && !updated_address
			? configureAddressStr(original_address, city, zip)
			: param === 'latlng'
			? `${latitude}, ${longitude}`
			: updated_address
			? configureAddressStr(updated_address, city, zip)
			: null;

	if (location) {
		const { data } = await client.geocode({
			params: {
				[param]: location,
				key: apiKey
			},
			timeout: 2000
		});

		const geocodedObj = { ...data.results[0] };

		if (geocodedObj.partial_match && latitude && longitude && !partialMatch) {
			partialMatch = true;

			return clientHandler({
				name,
				original_address,
				city,
				zip,
				latitude,
				longitude
			});
		}

		if (geocodedObj.partial_match) {
			const { updatedAddressStr, error } =
				configurePartialMatchAddress(original_address);

			const partialMatchAddressErrStr = updated_address
				? `{attempt1: ${original_address}, attempt2: ${updated_address}`
				: original_address;

			if (error)
				return handleError(
					partialMatchAddressErrStr,
					`Geocoder: Address error - Returned Address: ${geocodedObj.formatted_address}`
				);

			if (
				geocodedObj.geometry.location_type === 'APPROXIMATE' &&
				!updated_address &&
				!partialMatch
			) {
				partialMatch = true;

				return clientHandler({
					name,
					original_address,
					city,
					zip,
					longitude,
					latitude,
					updated_address: updatedAddressStr
				});
			}

			if (
				geocodedObj.geometry.location_type !== 'APPROXIMATE' &&
				!geocodedObj.formatted_address.includes(updatedAddressStr.split(',')[0])
			)
				return handleError(
					partialMatchAddressErrStr,
					`Geocoder: Potential address error (addresses do not match) - Returned address: ${geocodedObj.formatted_address}`
				);

			if (geocodedObj.geometry.location_type === 'APPROXIMATE' && partialMatch)
				return handleError(
					partialMatchAddressErrStr,
					`Geocoder: Address error (Approximate location) - Returned Address: ${geocodedObj.formatted_address}`
				);
		}

		if (partialMatch) partialMatch = false;

		return { data: geocodedObj, error: false };
	} else {
		const errorAddressStr = `name: ${name ? name : 'N/A'}, address: ${
			original_address ? original_address : 'N/A'
		}, city: ${city ? city : 'N/A'}, zip: ${zip ? zip : 'N/A'}`;

		return handleError(
			errorAddressStr,
			'Geocoder: Address error - Not enough info'
		);
	}
};

const Geocoder = async ({
	name,
	original_address,
	city,
	zip,
	latitude,
	longitude
}) => {
	const { data, error } = await clientHandler({
		name,
		original_address,
		city,
		zip,
		latitude,
		longitude
	});

	const obj = {};

	if (!error) {
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

		obj['geometry'] = {
			type: 'Point',
			coordinates: [
				data['geometry']['location']['lng'],
				data['geometry']['location']['lat']
			]
		};

		const isInCOA = await turfHandler.pointInCOA(
			obj['geometry']['coordinates']
		);

		if (!isInCOA) {
			const { data, error } = handleError(obj['address'], 'Not in COA');

			return {
				geocodedObj: data,
				error
			};
		}

		const geojsonPropertiesObj = await turfHandler.getPropertiesFromGeoJSONs(
			obj['geometry']['coordinates']
		);

		return { geocodedObj: { ...obj, ...geojsonPropertiesObj }, error: error };
	} else {
		return { geocodedObj: data, error };
	}
};

module.exports = Geocoder;
