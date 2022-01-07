// const mongoose = require('mongoose');
const db = require('../../models');

const initializeDbUpload = async (userId, agency, filename, dropFirst) => {
	if (dropFirst) {
		await db.Upload.deleteMany({});
		await db.Owner.deleteMany({});
		await db.Property.deleteMany({});
		await db.Subsidy.deleteMany({});
		await db.FundingSource.deleteMany({});
		await db.Resident.deleteMany({});
		console.log('DB cleared');
	}

	const dbUser = await db.User.findById(userId);
	if (!dbUser) throw new Error(`No User - ${userId}`);

	const dbAgency = await db.Agency.findOne({ name: agency });
	if (!dbAgency) throw new Error(`No Agency Match in DB`);

	const dbUpload = await db.Upload.create({
		original_filename: filename,
		new_filename: filename,
		user_id: dbUser._id,
		agency_id: dbAgency._id
	});

	await db.User.updateOne(
		{ _id: dbUser._id },
		{ $push: { uploads: dbUpload._id } }
	);

	await db.Agency.updateOne(
		{ _id: agency._id },
		{ $push: { uploads: dbUpload._id } }
	);

	return { userId: dbUser._id, uploadId: dbUpload._id };
};

const handleCollectionsInsert = async (
	userId,
	uploadId,
	{ Owner, Property, Subsidy, FundingSource, Resident }
) => {
	const dbOwner = await db.Owner.create({
		...Owner,
		user_id: userId
	});

	const existingProperty = await db.Property.findOne({
		geocoded_address: Property.geocoded_address
	});

	const dbProperty = !existingProperty
		? await db.Property.create({
				...Property,
				upload_id: uploadId,
				user_id: userId,
				owner_id: dbOwner._id
		  })
		: existingProperty;

	const dbSubsidy = await db.Subsidy.create({
		...Subsidy,
		property_id: dbProperty._id,
		user_id: userId,
		funding_sources: []
	});

	for await (const source of Object.values(FundingSource)) {
		if (source) {
			const dbFundingSource = await db.FundingSource.create({
				source: source,
				subsidy_id: dbSubsidy._id,
				user_id: userId
			});

			await db.Subsidy.updateOne(
				{ _id: dbSubsidy._id },
				{ $push: { funding_sources: dbFundingSource._id } }
			);
		}
	}

	for await (const item of Object.values(Resident)) {
		if (item) {
			await db.Resident.create({
				type: item,
				subsidy_id: dbSubsidy._id,
				user_id: userId
			});
		}
	}
};

module.exports = { initializeDbUpload, handleCollectionsInsert };
