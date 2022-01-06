require('dotenv').config();
const { xlsxToJSON, csvToJSON } = require('./utils/fileToJSON');
const createDataObj = require('./utils/createDataObj');

const init = async ({
	directory: directory,
	filename: filename,
	sheet: sheet
}) => {
	try {
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

		if (!sheet && fileType === 'xlsx') {
			console.log('missing sheet arg');
			process.exit(1);
		}

		const data =
			fileType === 'csv'
				? await csvToJSON(path)
				: fileType === 'xlsx'
				? await xlsxToJSON(path, sheet)
				: [];

		if (data[0]) {
			// ! Limiting Results for Testing -----------------------------
			const testingArr = data
				.filter(item => item.City.toUpperCase() === 'ATLANTA')
				.slice(0, 9);
			// ! ----------------------------------------------------------
			console.log('Geocoding addresses...');
			const dataObj = await createDataObj(directory, testingArr);
			console.log(dataObj);
			console.log(
				dataObj['765 McDaniel St SW, Atlanta, GA 30310, USA'].Subsidy
			);
		}
	} catch (err) {
		console.log(err);
	}
};

init({
	directory: process.argv[2],
	filename: process.argv[3],
	sheet: process.argv[4]
});
