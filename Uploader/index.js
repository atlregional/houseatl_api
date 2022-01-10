require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const { xlsxToJSON, csvToJSON } = require('./utils/fileToJSON');
const createDataObj = require('./utils/createDataObj');
const {
	initializeDbUpload,
	handleCollectionsInsert
} = require('./utils/dbInteraction');

const date = new Date(Date.now());
const todaysDate = `${
	date.getMonth() + 1
}/${date.getDate()}/${date.getFullYear()}`;

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
		const fileType = filename.split('.').includes('csv')
			? 'csv'
			: filename.split('.').includes('xlsx') ||
			  filename.split('.').includes('xls')
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
				: directory === 'Atlanta Housing'
				? 'Atlanta Housing'
				: directory === 'DCA'
				? 'Georgia Department of Community Affairs'
				: directory === 'City of Atlanta'
				? directory
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
		const cityFilter = (agency, item) => {
			switch (agency) {
				case 'Invest Atlanta':
					return true;
				case 'National Housing Preservation Database':
					return item.City.toUpperCase() === 'ATLANTA';
				case 'Atlanta Housing':
					return item.CITY.toUpperCase() === 'ATLANTA';
				case 'Georgia Department of Community Affairs':
					return item.City.toUpperCase() === 'ATLANTA';
				case 'City of Atlanta':
					return true;
				default:
					return false;
			}
		};
		const dataArr = data
			.filter(item => cityFilter(agencyName, item))
			.slice(0, 5);
		// ! ----------------------------------------------------------

		const { userId, uploadId } = await initializeDbUpload(
			process.env.user_id,
			agencyName,
			filename,
			true
		);

		console.log(`Extracting data from ${dataArr.length} records...`);
		const errorObj = {};

		for await (const item of dataArr) {
			const { Property, Subsidy, Owner, Resident, FundingSource, Error } =
				await createDataObj(agencyName, item);

			if (!Error && Subsidy.start_date) {
				// If no start_date front end throws an error due to project_name
				// console.log({ Property, Subsidy, Owner, Resident, FundingSource });
				await handleCollectionsInsert(userId, uploadId, {
					Owner,
					Property,
					Subsidy,
					FundingSource,
					Resident
				});
				console.log('DB updated...');
			} else if (!Error && !Subsidy.start_date) {
				const obj = {
					addressProvided: Property.address,
					type: `No start date: ${Subsidy.project_name}`
				};

				!errorObj[todaysDate]
					? (errorObj[todaysDate] = [obj])
					: errorObj[todaysDate].push(obj);
			} else if (Error) {
				!errorObj[todaysDate]
					? (errorObj[todaysDate] = [Error])
					: errorObj[todaysDate].push(Error);
			}
		}

		if (Object.keys(errorObj)[0]) {
			const errorFilePath = `./Uploader/Errors/${agencyName}/errors.json`;
			fs.writeFileSync(errorFilePath, JSON.stringify(errorObj));

			console.log(`Errors Detected. See ${errorFilePath} for more info.`);
		}
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
