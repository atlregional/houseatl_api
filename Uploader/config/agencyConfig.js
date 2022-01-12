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
	}
};

const initialMethods = {
	cityFilter(obj) {
		if (this.cityKey) return obj[this.cityKey].toUpperCase() === 'ATLANTA';
		return true; // no cityKey all docs returned: City of Atlanta, Invest Atlanta
	},
	async excelToJSON(file, sheet) {
		const options = { defval: '', raw: false };
		if (this.xlsxRange > 0) options['range'] = this.xlsxRange; // Range helps identify the header row in an XLSX or XLS file

		return XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets[sheet], options);
	},
	async csvToJSON(file) {
		return csv().fromFile(file);
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
		return `${dateArr[0]}/${dateArr[1]}/20${dateArr[2]}`;
	},
	handleDataType(type, value) {
		if (!value || value === ' - ') return '';

		switch (type) {
			case 'str':
				const str = value.toString().trim();
				// Front end hardcoded options for Development Type in map filter are: New Construction, Rehab, Acquisition/Rehab, Rehabilitation -- this should be cleaned up
				// Cases not met: 'Rehab/Preservation', 'Acquisition', 'Acquisition New Construction',
				if (str === 'Acq./Rehab' || str === 'Acquisition Rehabilitation')
					return 'Acquisition/Rehab';
				if (str === 'Rehab') return 'Rehabilitation';
				if (str === 'Rehab/Preservation, Rental Assistance')
					return 'Rehab/Preservation';
				if (str === 'New Construction, Rental Assistance')
					return 'New Construction';

				return str;
			case 'int':
				return parseInt(value);
			case 'date':
				return this.handleDate(value);
			default:
				return value.toString().trim();
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
		xlsxRange: 2,
		// Dates come in as MM/DD/YY or MM/DD/YYYY
		handleDate(value) {
			const dateArr = value.split('/');

			if (dateArr[2].split('').length === 2)
				return `${dateArr[0]}/${dateArr[1]}/20${dateArr[2]}`;

			return value.toString();
		}
	},
	NHPD: {
		...initialMethods,
		agencyName: 'National Housing Preservation Database',
		cityKey: 'City',
		xlsxRange: 0,
		// Dates come in as MM/DD/YYYY
		handleDate(value) {
			return value.toString();
		}
	},
	InvestAtlanta: {
		...initialMethods,
		agencyName: 'Invest Atlanta',
		cityKey: '',
		xlsxRange: 3,
		// Dates come in as MM-YY, '', or Under Construction
		handleDate(value) {
			if (value === 'Under Construction') return '';

			const dateArr = value.split('-');
			const month = new Date(`${dateArr[0]}-01-20${dateArr[1]}`).getMonth() + 1;
			return `${month}/01/20${dateArr[1]}`;
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
