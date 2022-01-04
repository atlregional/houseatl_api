const XLSX = require('xlsx');

const xlsxToJSON = async (file, sheet) => {
	console.log(`Reading ${file}: ${sheet}...`);
	const wb = XLSX.readFile(file);
	console.log('Converting file to JSON...');

	return XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' });
};

module.exports = { xlsxToJSON };
