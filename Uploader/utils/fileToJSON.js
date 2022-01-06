const XLSX = require('xlsx');
// const Papa = require('papaparse');
const csv = require('csvtojson');

const xlsxToJSON = async (file, sheet) => {
	console.log(`Reading ${file}: ${sheet}...`);
	const wb = XLSX.readFile(file);
	console.log('Converting file to JSON...');

	return XLSX.utils.sheet_to_json(wb.Sheets[sheet], {
		defval: '',
		raw: false
	});
};

const csvToJSON = async file => csv().fromFile(file);

module.exports = { xlsxToJSON, csvToJSON };
