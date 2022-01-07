const XLSX = require('xlsx');
const csv = require('csvtojson');

const xlsxToJSON = async (file, sheet, agency) => {
	console.log(`Reading ${file}: ${sheet}...`);
	const wb = XLSX.readFile(file);
	console.log('Converting file to JSON...');

	switch (agency) {
		case 'National Housing Preservation Database':
			return XLSX.utils.sheet_to_json(wb.Sheets[sheet], {
				defval: '',
				raw: false
			});
		case 'Invest Atlanta':
			return XLSX.utils.sheet_to_json(wb.Sheets[sheet], {
				defval: '',
				raw: false,
				range: 3
			});
		default:
			break;
	}
};

const csvToJSON = async file => csv().fromFile(file);

module.exports = { xlsxToJSON, csvToJSON };
