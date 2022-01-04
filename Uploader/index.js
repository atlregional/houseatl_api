require('dotenv').config();
const { xlsxToJSON } = require('./utils/fileToJSON');
const mapDataToObjs = require('./utils/mapDataToObjs');
const { Client } = require('@googlemaps/google-maps-services-js');

const apiKey = process.env.GOOGLE_API_KEY;
const client = new Client();
const errors = {};

const geocodeAddress = async address => {
	try {
		const obj = {};
		const { data } = await client.geocode({
			params: {
				address: address,
				key: apiKey
			},
			timeout: 2000
		});

		if (data.results[0].partial_match) {
			console.log('no address match');
			errors[address] = 'address error';
			return null;
		}

		data.results[0]['address_components'].forEach(component => {
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

		obj['geocoded_address'] = data.results[0]['formatted_address'];
		obj['latitude'] = data.results[0]['geometry']['location']['lat'];
		obj['longitude'] = data.results[0]['geometry']['location']['lng'];

		return obj;
	} catch (err) {
		console.log(err);
	}
};

const init = async ({
	directory: directory,
	filename: filename,
	sheet: sheet
}) => {
	if (!directory || !filename) {
		console.log('missing directory and/or filename arg(s)');
		process.exit(1);
	}
	const fileType =
		filename.split('.')[1] === 'csv'
			? 'csv'
			: filename.split('.')[1] === 'xlsx'
			? 'xlsx'
			: null;

	const path = `./data/${directory}/${filename}`;

	const obj = {};

	switch (fileType) {
		case 'xlsx':
			if (!sheet) {
				console.log('missing sheet arg');
				process.exit(1);
			}

			const json = await xlsxToJSON(path, sheet);

			// ! Limiting Results for Testing -----------------------------
			const filteredArr = json.filter(item => item.State === 'GA');
			const testArr = [filteredArr[0], filteredArr[1]];
			// ! ----------------------------------------------------------
			for await (const item of testArr) {
				const values = Object.values(item);
				const { Property } = await mapDataToObjs(directory, values);

				if (Property) {
					const geocodedObj = await geocodeAddress(
						`${Property.original_address}, ${Property.city}, GA, ${Property.zip}`
					);

					const propertyObj = { ...Property, ...geocodedObj };

					if (!obj[propertyObj.geocoded_address])
						obj[propertyObj.geocoded_address] = { Property: propertyObj };
				}
			}

			console.log(obj);

			break;
		default:
			console.log('case not met');
			process.exit(1);
	}
};

init({
	directory: process.argv[2],
	filename: process.argv[3],
	sheet: process.argv[4]
});
