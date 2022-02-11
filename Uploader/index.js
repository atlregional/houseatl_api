require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const agencyConfig = require('./config/agencyConfig');
const Geocoder = require('./Geocoder');
const {
	initializeDbUpload,
	handleCollectionsInsert
} = require('./db/uploaderControllers');
const { createDataObj } = require('./utils');
const { handleError } = require('./config/errorConfig');

// const mongoURI = process.env.MONGODB_URI;
const mongoURI = 'mongodb://localhost/houseatl';
const dropFirst = true;

const date = new Date();
const todaysDate = `${
	date.getMonth() + 1
}/${date.getDate()}/${date.getFullYear()}`;

const init = async ({ directory, filename, sheet, user }) => {
	try {
		if (!user) {
			console.log('Error: set user_id in .env');
			console.log('Exiting...');
			process.exit(1);
		}
		if (!directory || !filename) {
			console.log('missing directory and/or filename arg(s)');
			console.log('Exiting...');
			process.exit(1);
		}
		const fileType = filename.split('.').includes('csv')
			? 'csv'
			: filename.split('.').includes('xlsx') ||
			  filename.split('.').includes('xls')
			? 'excel'
			: '';

		if (!fileType) {
			console.log('Unknown filetype:', filename);
			console.log('Exiting...');
			process.exit(1);
		}

		const path = `./data/${directory}/${filename}`;

		if (!sheet && fileType === 'excel') {
			console.log('missing sheet arg:', filename);
			console.log('Exiting...');
			process.exit(1);
		}

		const agencyObj = agencyConfig[directory] ? agencyConfig[directory] : null;

		if (!agencyObj) {
			console.log('No config found:', directory);
			console.log('Exiting...');
			process.exit(1);
		}

		const data =
			fileType === 'csv'
				? await agencyObj.csvToJSON(path)
				: fileType === 'excel'
				? await agencyObj.excelToJSON(path, sheet)
				: [];

		if (!data[0]) {
			console.log('No data detected from file:', filename);
			process.exit(1);
		}

		const dataArr = data.filter(item => agencyObj.preFilter(item));
		// ! Limiting Results for Testing -----------------------------
		// .slice(0, 20);
		// console.log(dataArr);
		const { userId, agencyId, uploadId } = await initializeDbUpload(
			user,
			agencyObj.agencyName,
			filename,
			dropFirst
		);

		console.log(`Extracting data from ${dataArr.length} records...`);
		const errorObj = {};

		for await (const item of dataArr) {
			const { Property, Subsidy, Owner, Resident, Funding_Source } =
				createDataObj(agencyObj, item);

			const { geocodedObj, error } = await Geocoder(Property);

			if (!error && Subsidy.start_date) {
				await handleCollectionsInsert(userId, agencyId, uploadId, {
					Owner,
					Property: { ...Property, ...geocodedObj },
					Subsidy,
					Funding_Source,
					Resident
				});
			} else if (!error && !Subsidy.start_date) {
				// If no start_date front end throws an error referencing project_name
				const { data } = handleError(
					Property.address || Property.original_address,
					`No start date- ${Subsidy.project_name}`
				);

				!errorObj[todaysDate]
					? (errorObj[todaysDate] = [data])
					: errorObj[todaysDate].push(data);
			} else if (error) {
				!errorObj[todaysDate]
					? (errorObj[todaysDate] = [geocodedObj])
					: errorObj[todaysDate].push(geocodedObj);
			}
		}

		if (Object.keys(errorObj)[0]) {
			const errorFilePath = `./Uploader/error_logs/${agencyObj.agencyName}/errors.json`;
			fs.writeFileSync(errorFilePath, JSON.stringify(errorObj));

			console.log(`Errors Detected. See ${errorFilePath} for more info.`);
		}
	} catch (err) {
		console.log(err);
	}
};

mongoose
	.connect(mongoURI, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(async () => {
		await init({
			directory: process.argv[2],
			filename: process.argv[3],
			sheet: process.argv[4],
			user: process.env.user_id
		});
		console.log('Process complete.');
		process.exit(0);
	})
	.catch(err => {
		console.log('Unable to connect to DB...');
		console.log(err);
	});
