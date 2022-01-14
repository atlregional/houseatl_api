require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../../models');

const init = async () => {
	const properties = await db.Property.find({});

	// console.log(properties);

	for await (const property of properties) {
		const uploadId = property.uploads[0];
		// console.log(property.uploads);
		await db.Property.updateOne(
			{ _id: property._id },
			{ uploads: [uploadId], upload_id: uploadId }
		);
	}
};

mongoose
	.connect(process.env.MONGODB_URI || 'mongodb://localhost/houseatl', {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(async () => {
		await init();
		console.log('Process complete.');
		process.exit(0);
	})
	.catch(err => {
		console.log('Unable to connect to DB...');
		console.log(err);
	});
