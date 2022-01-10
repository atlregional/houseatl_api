require('dotenv').config();
const mongoose = require('mongoose');
const { xlsxToJSON, csvToJSON } = require('./utils/fileToJSON');
const createDataObj = require('./utils/createDataObj');
const {
	initializeDbUpload,
	handleCollectionsInsert
} = require('./utils/dbInteraction');

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
				: filename.split('.')[1] === 'xlsx' || filename.split('.')[1] === 'xls'
				? 'excel'
				: null;

		const path = `./data/${directory}/${filename}`;

		if (!sheet && fileType === 'excel') {
			console.log('missing sheet arg');
			process.exit(1);
		}

		const agencyName =
			directory === 'NHPD'
				? 'National Housing Preservation Database'
				: directory === 'InvestAtlanta'
				? 'Invest Atlanta'
				: '';

		if (!agencyName) throw new Error(`No Agency Case- ${directory}`);

		const data =
			fileType === 'csv'
				? await csvToJSON(path)
				: fileType === 'excel'
				? await xlsxToJSON(path, sheet, agencyName)
				: [];

		if (!data[0]) {
			console.log('No data detected from file...');
			process.exit(1);
		}

		// ! Limiting Results for Testing -----------------------------
		const dataArr = data
			.filter(
				item =>
					agencyName === 'Invest Atlanta' ||
					item.City.toUpperCase() === 'ATLANTA'
			)
			.slice(0, 5);
		// ! ----------------------------------------------------------

		const { userId, uploadId } = await initializeDbUpload(
			process.env.user_id,
			agencyName,
			filename,
			false
		);

		console.log(`Extracting data from ${dataArr.length} records...`);
		for await (const item of dataArr) {
			const { Property, Subsidy, Owner, Resident, FundingSource } =
				await createDataObj(agencyName, item);

			// console.log({ Property, Subsidy, Owner, Resident, FundingSource });

			await handleCollectionsInsert(userId, uploadId, {
				Owner,
				Property,
				Subsidy,
				FundingSource,
				Resident
			});
		}
		console.log('DB updated...');
	} catch (err) {
		console.log(err);
	}
};

mongoose
	.connect(process.env.MONGODB_URI || 'mongodb://localhost/houseatl', {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(async () => {
		await init({
			directory: process.argv[2],
			filename: process.argv[3],
			sheet: process.argv[4]
		});
		console.log('Process complete.');
		process.exit(0);
	})
	.catch(err => {
		console.log('Unable to connect to DB...');
		console.log(err);
	});
