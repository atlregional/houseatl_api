const XLSX = require('xlsx');
const csv = require('csvtojson');
const mappings = require('./mappings');
const moment = require('moment');

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

		if (type === 'year') return value > 90 ? `19${value}` : `20${value}`;
	},
	filterByCityAndAcceptedFundingArr({
		cityVal,
		fundingVal,
		acceptedFundingArr
	}) {
		return cityVal.match(/atlanta/i) && acceptedFundingArr.includes(fundingVal);
	}
};

const initialMethods = {
	preFilter(obj) {
		// if (this.cityKey) return obj[this.cityKey].toUpperCase() === 'ATLANTA';
		return true; // no cityKey all docs returned: City of Atlanta, Invest Atlanta
	},
	async excelToJSON(file, sheet) {
    // console.log('file', file, sheet)
		const options = { defval: '', raw: false };
		if (this.xlsxRange > 0) options['range'] = this.xlsxRange; // Range helps identify the header row in an XLSX or XLS file
    const readFile = XLSX.readFile(file).Sheets[sheet];
    // console.log('readFile', readFile)
		return XLSX.utils.sheet_to_json(readFile, options);
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

        if (str === 'HUD HOME') {
          return 'HOME'
        };
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
				return val ? new Date(val) : null;
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

    // CONVERVERTES AND OVERWRITERS
    if (this.agencyName === 'Georgia Department of Community Affairs' && type === 'Subsidy') {
      if (obj?.[mapping['low_income_units']] === '') {
        const lowIncomeUnits = item[mapping['low_income_units']].split(' ')[0]
        obj['low_income_units'] = lowIncomeUnits;
      }

      obj['target_population'] = obj?.['target_population']?.split(' ').reverse()?.[0] || '';

      
      // const dateValue = item[mapping['risk_of_exp']] 
      //   ? this.handleDate(item[mapping['risk_of_exp']]) 
      //   : null;
      const startDate = item[mapping['start_date']]
      const endDate = item[mapping['end_date']]
      const riskDate = item[mapping['risk_of_exp']]

      if (item[mapping['funding_sources']] === 'HUD HOME') {
        obj['funding_sources'] = 'HOME'; 
      }

      if (item[mapping['funding_sources']] === 'LIHTC') {
        obj['risk_of_exp'] = riskDate 
          ? new Date(riskDate) 
          : startDate
          ? new Date(moment(new Date(startDate)).add(15, 'years').subtract(1, 'day').format('M/D/YYYY'))
            : null;
        obj['start_date'] = startDate 
          ? new Date(startDate) 
          : riskDate 
          ? new Date(moment(new Date(riskDate)).subtract(15, 'years').format('M/D/YYYY')) 
            : null;
        obj['end_date'] = endDate 
          ? new Date(endDate)
          : riskDate
          ? new Date(moment(new Date(riskDate)).add(15, 'years').subtract(1, 'day').format('M/D/YYYY'))
            : null;

        // obj['risk_of_exp'] = new Date(moment(new Date(dateValue)).subtract(1, 'day').format('M/D/YYYY'));
        // obj['start_date'] = new Date(moment(new Date(dateValue)).subtract(15, 'year').format('M/D/YYYY'));
        // obj['end_date'] = new Date(moment(new Date(dateValue)).add(15, 'year').subtract(1, 'day').format('M/D/YYYY'))
      } else {
        obj['start_date'] = startDate ? new Date(startDate) : null;
        obj['end_date'] = endDate ? new Date(endDate) : null;
        obj['risk_of_exp'] = null;
      }
            // obj['funding_sources'] = 'LIHTC'
    }
    if (this.agencyName === 'Atlanta Housing' && type === 'Subsidy'){
			obj['funding_sources'] = 'HomeFlex';
    }

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
		// cityKey: 'Project City',
		fundingSrcNameKey: 'Project Funding Source_1',
		acceptedFundingSrc: [
      // FOR LIHTC
      // 'LIHTC', 
      // 'LIHTC & HUD HOME', 
      // 'LIHTC & Tax Credit Assistance Program',
      // 'LIHTC & Exchange (1602)'
      // FOR HUD HOME
      // 'LIHTC & HUD HOME', 
      'HUD HOME',
      // 'HUD HOME, Housing Trust Fund, Tax Credit Assistance Program',
      // 'Tax Credit Assistance Program & HUD HOME',
      // 'HUD HOME & Tax Credit Assistance Program'

    ],
		xlsxRange: 0,
		preFilter(obj) {
      
      if (this.acceptedFundingSrc.includes(`${obj[this.fundingSrcNameKey]}`.trim())) {
        return true;
      }
			// if (obj[this.fundingSrcNameKey] && obj[this.cityKey])
			// 	return helpers.filterByCityAndAcceptedFundingArr({
			// 		cityVal: obj[this.cityKey].toUpperCase(),
			// 		fundingVal: obj[this.fundingSrcNameKey],
			// 		acceptedFundingArr: this.acceptedFundingSrc
			// 	});
			// else if (obj[this.cityKey])
			// 	return obj[this.cityKey].match(/atlanta/i);

			return false;
		}
	},
	NHPD: {
		...initialMethods,
		agencyName: 'National Housing Preservation Database',
    statusKey: 'Subsidy Status',
		fundingSrcNameKey: 'Subsidy Name',
		acceptedFundingSrc: ['HOME', 'Section 8', 'Section 202', 'Public Housing'],
		xlsxRange: 0,
		preFilter(obj) {
			if (
        this.acceptedFundingSrc.includes(`${obj[this.fundingSrcNameKey]}`.trim()) &&
        `${obj[this.statusKey]}` === 'Active'
      ) {
        return true;
      }
      return false;
			// if (obj[this.fundingSrcNameKey] && obj[this.cityKey]) {
			// 	return helpers.filterByCityAndAcceptedFundingArr({
			// 		cityVal: obj[this.cityKey].toUpperCase(),
			// 		fundingVal: obj[this.fundingSrcNameKey],
			// 		acceptedFundingArr: this.acceptedFundingSrc
			// 	});
			// } else if (obj[this.cityKey])
			// 	return obj[this.cityKey].toUpperCase() === 'ATLANTA';

			// return false;
		}
	},
	// InvestAtlanta: {
	// 	...initialMethods,
	// 	agencyName: 'Invest Atlanta',
	// 	cityKey: '',
	// 	xlsxRange: 3,
	// 	// Dates come in as MM-YY
	// 	handleDate(value) {
	// 		const dateArr = value.split('-');
	// 		if (!dateArr[0] || !dateArr[1]) return '';

	// 		const month = new Date(`${dateArr[0]}-01-20${dateArr[1]}`).getMonth() + 1;

	// 		return `${helpers.formatDate(month, 'month')}/01/${helpers.formatDate(
	// 			dateArr[1],
	// 			'year'
	// 		)}`;
	// 	},
	// 	createCollectionObj(type, item) {
	// 		const mapping = this.getMapping()[type];
	// 		const dataTypes = this.getDataTypesMapping()[type];
	// 		const obj = {};

	// 		// Item: value from file, Key: key we want for db, Value: Header from file
	// 		Object.entries(mapping).forEach(([key, value]) => {
	// 			value && typeof value !== 'object'
	// 				? (obj[key] = this.handleDataType(dataTypes[key], item[value]))
  //         : value && typeof value === 'object'
	// 				? (obj[key] = this.handleDataType(
	// 						dataTypes[key],
	// 						helpers.calculateTotal(item, value)
	// 				  ))
	// 				: (obj[key] = '');
	// 		});
	// 		return obj;
	// 	}
	// }
};
