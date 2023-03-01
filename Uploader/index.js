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

const mongoURI = process.env.MONGODB_URI;
// const mongoURI = 'mongodb://localhost/houseatl';
const user = process.env.user_id;
// const user = process.env.dev_user_id;

const dropFirst = false //process.argv[5] === 'fresh';

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

    const { userId, agencyId, uploadId } = await initializeDbUpload(
			user,
			agencyObj.agencyName,
			filename,
			dropFirst
		);


		console.log(`Extracting data from ${dataArr.length} records...`);
		const errorObj = {};

    // let itemCount = 0;

		for await (const item of dataArr) {
			// if (itemCount === 3) {
        const { Property, Subsidy, Owner, Resident, Funding_Source } =
          createDataObj(agencyObj, item);

        const { geocodedObj, error } = await Geocoder(Property);

        if (!error) {
          // console.log({ 
          //   Property: { ...Property, ...geocodedObj } , 
          //   Subsidy, 
          //   Owner, 
          //   Resident, 
          //   Funding_Source 
          // })
          await handleCollectionsInsert(userId, agencyId, uploadId, {
          	Owner,
          	Property: { ...Property, ...geocodedObj },
          	Subsidy,
          	Funding_Source,
          	Resident
          });
        } else {
          !errorObj[todaysDate]
            ? (errorObj[todaysDate] = [geocodedObj])
            : errorObj[todaysDate].push(geocodedObj);
        }
      // }
      // itemCount++
		}

		if (Object.keys(errorObj)[0]) {
			const errorFilePath = `./Uploader/error_logs/${agencyObj.agencyName}/errors-dev.json`;
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
			user,
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
