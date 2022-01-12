require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const agencyConfig = require('./config/agencyConfig');
const { handleError } = require('./config/errorConfig');
const createDataObj = require('./utils/createDataObj');
const {
	initializeDbUpload,
	handleCollectionsInsert
} = require('./utils/dbInteraction');

const date = new Date(Date.now());
const todaysDate = `${
	date.getMonth() + 1
}/${date.getDate()}/${date.getFullYear()}`;

const init = async ({ directory, filename, sheet, user }) => {
	try {
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
		// console.log(data);

		if (!data[0]) {
			console.log('No data detected from file:', filename);
			process.exit(1);
		}

		// ! Limiting Results for Testing -----------------------------
		const dataArr = data.filter(item => agencyObj.cityFilter(item));
		// .slice(0, 20);
		// console.log(dataArr);
		// ! ----------------------------------------------------------

		const { userId, uploadId } = await initializeDbUpload(
			user,
			agencyObj.agencyName,
			filename,
			false
		);

		console.log(`Extracting data from ${dataArr.length} records...`);
		const errorObj = {};

		for await (const item of dataArr) {
			const { Property, Subsidy, Owner, Resident, Funding_Source, Error } =
				await createDataObj(agencyObj, item);

			if (!Error && Subsidy.start_date) {
				// console.log({ Property, Subsidy, Owner, Resident, Funding_Source });
				await handleCollectionsInsert(userId, uploadId, {
					Owner,
					Property,
					Subsidy,
					Funding_Source,
					Resident
				});
				console.log('DB updated...');
			} else if (!Error && !Subsidy.start_date) {
				// If no start_date front end throws an error referencing project_name
				const obj = handleError(
					Property.address || Property.original_address,
					`No start date- ${Subsidy.project_name}`
				);

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
			const errorFilePath = `./Uploader/error_logs/${agencyObj.agencyName}/errors.json`;
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
