const XLSX = require('xlsx');
const csv = require('csvtojson');
const mappings = require('./mappings');

const helpers = {
	calculateTotal(item, value) {
		let total = 0;

		value.forEach(key => {
			if (item[key]) total += +item[key];
		});

		return total;
	},
	formatDate(value, type) {
		const formatted = value.toString().split('')[
			type === 'month' || type === 'day' ? 1 : 2
		]
			? true
			: false;

		if (formatted) return value;

		if (type === 'month' || type === 'day') return `0${value}`;

		if (type === 'year') return `20${value}`;
	}
};

const initialMethods = {
	preFilter(obj) {
		if (this.cityKey) return obj[this.cityKey].toUpperCase() === 'ATLANTA';
		return true; // no cityKey all docs returned: City of Atlanta, Invest Atlanta
	},
	async excelToJSON(file, sheet) {
		const options = { defval: '', raw: false };
		if (this.xlsxRange > 0) options['range'] = this.xlsxRange; // Range helps identify the header row in an XLSX or XLS file

		return XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets[sheet], options);
	},
	async csvToJSON(file) {
		// Don't interpret dots (.) and square brackets in header fields as nested object or array identifiers at all (treat them like regular characters for JSON field identifiers)
		return csv({ flatKeys: true }).fromFile(file);
	},
	getMapping() {
		return mappings[this.agencyName];
	},
	getDataTypesMapping() {
		return mappings['data_type_mapping'];
	},
	getCollectionsArr() {
		return Object.keys(this.getMapping());
	},
	// Dates come in as MM/DD/YY, falling in the 2000's
	handleDate(value) {
		const dateArr = value.split('/');
		return `${helpers.formatDate(dateArr[0], 'month')}/${helpers.formatDate(
			dateArr[1],
			'day'
		)}/${helpers.formatDate(dateArr[2], 'year')}`;
	},
	handleDataType(type, value) {
		const val =
			value && typeof value === 'string' ? value.trim() : value ? value : '';

		if (!val || val === '-' || val === 'Under Construction' || val === 'N/A')
			return '';

		switch (type) {
			case 'str':
				const str = val.toString();
				// Front end hardcoded options for Development Type in map filter are: New Construction, Rehab, Acquisition/Rehab, Rehabilitation -- this should be cleaned up
				// Cases not met: 'Rehab/Preservation', 'Acquisition', 'Acquisition New Construction',

				if (str === 'Acq./Rehab' || str === 'Acquisition Rehabilitation')
					return 'Acquisition/Rehab';
				if (str === 'Rehabilitation') return 'Rehab';
				if (
					str === 'Rehab/Preservation' ||
					str === 'Rehab/Preservation, Rental Assistance'
				)
					return 'Preservation/Rehab';
				if (str === 'New Construction, Rental Assistance')
					return 'New Construction';

				return str;
			case 'int':
				return parseInt(val);
			case 'date':
				return this.handleDate(val);
			default:
				return val;
		}
	},
	createCollectionObj(type, item) {
		const mapping = this.getMapping()[type];
		const dataTypes = this.getDataTypesMapping()[type];
		const obj = {};

		// Item: value from file, Key: key we want for db, Value: Header from file
		Object.entries(mapping).forEach(([key, value]) => {
			value
				? (obj[key] = this.handleDataType(dataTypes[key], item[value]))
				: (obj[key] = '');
		});

		if (this.agencyName === 'Atlanta Housing' && type === 'Funding_Source')
			obj['source_1'] = 'HomeFlex';

		return obj;
	}
};

module.exports = {
	// Keys match directory names in data directory
	'Atlanta Housing': {
		...initialMethods,
		agencyName: 'Atlanta Housing',
		cityKey: 'CITY',
		xlsxRange: 0
	},
	'City of Atlanta': {
		...initialMethods,
		agencyName: 'City of Atlanta',
		cityKey: '',
		xlsxRange: 0
	},
	DCA: {
		...initialMethods,
		agencyName: 'Georgia Department of Community Affairs',
		cityKey: 'City',
		xlsxRange: 2
	},
	NHPD: {
		...initialMethods,
		agencyName: 'National Housing Preservation Database',
		cityKey: 'City',
		xlsxRange: 0,
		preFilter(obj) {
			const acceptedTypes = [
				'HOME',
				'Section 8',
				'Section 202',
				'Public Housing'
			];
			if (obj['Subsidy Name']) {
				return (
					obj[this.cityKey].toUpperCase() === 'ATLANTA' &&
					acceptedTypes.includes(obj['Subsidy Name'])
				);
			}
			return obj[this.cityKey].toUpperCase() === 'ATLANTA';
		}
	},
	InvestAtlanta: {
		...initialMethods,
		agencyName: 'Invest Atlanta',
		cityKey: '',
		xlsxRange: 3,
		// Dates come in as MM-YY
		handleDate(value) {
			const dateArr = value.split('-');
			if (!dateArr[0] || !dateArr[1]) return '';

			const month = new Date(`${dateArr[0]}-01-20${dateArr[1]}`).getMonth() + 1;

			return `${helpers.formatDate(month, 'month')}/01/${helpers.formatDate(
				dateArr[1],
				'year'
			)}`;
		},
		createCollectionObj(type, item) {
			const mapping = this.getMapping()[type];
			const dataTypes = this.getDataTypesMapping()[type];
			const obj = {};

			// Item: value from file, Key: key we want for db, Value: Header from file
			Object.entries(mapping).forEach(([key, value]) => {
				value && typeof value !== 'object'
					? (obj[key] = this.handleDataType(dataTypes[key], item[value]))
					: // AMI is split up into headers based on BR size
					value && typeof value === 'object'
					? (obj[key] = this.handleDataType(
							dataTypes[key],
							helpers.calculateTotal(item, value)
					  ))
					: (obj[key] = '');
			});
			return obj;
		}
	}
};
