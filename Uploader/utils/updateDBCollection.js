require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../../models');

const init = async ({ collection }) => {
	console.log(collection);
	const data = await db[collection].find({});
	// console.log(data[0]);
	await mongoose.disconnect();
	await mongoose
		.connect('mongodb://localhost/houseatl', {
			useNewUrlParser: true,
			useUnifiedTopology: true
		})
		.then(async () => {
			await db[collection].insertMany(data);
			console.log(data.length, 'docs inserted...');
			// console.log(localData);
		})
		.catch(err => console.log(err));

	// console.log(properties);

	// for await (const property of properties) {
	// 	const uploadId = property.uploads[0];
	// 	// console.log(property.uploads);
	// 	await db.Property.updateOne(
	// 		{ _id: property._id },
	// 		{ uploads: [uploadId], upload_id: uploadId }
	// 	);
	// }
};

mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(async () => {
		await init({ collection: process.argv[2] });
		console.log('Process complete.');
		process.exit(0);
	})
	.catch(err => {
		console.log('Unable to connect to DB...');
		console.log(err);
	});
