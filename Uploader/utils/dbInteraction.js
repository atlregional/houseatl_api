// const mongoose = require('mongoose');
const db = require('../../models');

module.exports = {
	async initializeDbUpload(userId, agency, filename, dropFirst) {
		if (dropFirst) {
			await db.User.updateOne({ _id: userId }, { uploads: [] });
			await db.Agency.updateMany({}, { uploads: [] });
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
			{ $push: { uploads: dbUpload._id }, updated_on: new Date() }
		);

		await db.Agency.updateOne(
			{ _id: dbAgency._id },
			{ $push: { uploads: dbUpload._id }, updated_on: new Date() }
		);

		return {
			userId: dbUser._id,
			agencyId: dbAgency._id,
			uploadId: dbUpload._id
		};
	},
	async handleCollectionsInsert(
		userId,
		agencyId,
		uploadId,
		{ Owner, Property, Subsidy, Funding_Source, Resident }
	) {
		const dbOwner = await db.Owner.create({
			...Owner,
			user_id: userId,
			agency_id: agencyId,
			uploads: [uploadId]
		});

		const existingProperty = await db.Property.findOne({
			address: Property.address
		});

		const dbProperty = !existingProperty
			? await db.Property.create({
					...Property,
					user_id: userId,
					owner_id: dbOwner._id,
					agency_id: agencyId,
					subsidies: [],
					upload_id: uploadId,
					uploads: []
			  })
			: existingProperty;

		const existingSubs = dbProperty.subsidies || [];

		// const test = {};
		if (existingSubs[0])
			existingSubs.forEach(sub => {
				console.log(sub);
				// compare sub to Subsidy and determine match
				// if complete match, do not create sub
				// if update, "consolidate sub with new Subsidy"
				// if not a match, create new sub
			});

		const dbSubsidy = await db.Subsidy.create({
			...Subsidy,
			property_id: dbProperty._id,
			user_id: userId,
			funding_sources: [],
			agency_id: agencyId,
			uploads: [uploadId],
			deduplicated_subsidies: []
		});

		await db.Property.updateOne(
			{ _id: dbProperty._id },
			{ $push: { subsidies: dbSubsidy._id } }
		);

		for await (const source of Object.values(Funding_Source)) {
			if (source) {
				const dbFundingSource = await db.FundingSource.create({
					source: source,
					subsidy_id: dbSubsidy._id,
					user_id: userId,
					agency_id: agencyId,
					uploads: [uploadId]
				});

				await db.Subsidy.updateOne(
					{ _id: dbSubsidy._id },
					{
						$push: { funding_sources: dbFundingSource._id }
					}
				);
			}
		}

		for await (const item of Object.values(Resident)) {
			if (item) {
				await db.Resident.create({
					type: item,
					subsidy_id: dbSubsidy._id,
					user_id: userId,
					agency_id: agencyId,
					uploads: [uploadId]
				});
			}
		}
	}
};
