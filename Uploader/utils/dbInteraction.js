const db = require('../../models');
const { deduplicateSubsidies } = require('./deduplicateSubsidies');

const handleNewRecord = async ({
	newSubsidy,
	propertyId,
	newFundingSrc,
	newResidentArr,
	userId,
	agencyId,
	uploadId
}) => {
	try {
		const dbSubsidy = await db.Subsidy.create({
			...newSubsidy,
			property_id: propertyId,
			user_id: userId,
			funding_sources: [],
			agency_id: agencyId,
			uploads: [uploadId],
			deduplicated_subsidies: []
		});

		await db.Property.updateOne(
			{ _id: propertyId },
			{ $push: { subsidies: dbSubsidy._id } }
		);

		for await (const source of Object.values(newFundingSrc)) {
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

		for await (const item of newResidentArr) {
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
	} catch (err) {
		console.log(err);
	}
};

const handleDuplicatesAndUpdate = async props => {
	const {
		property,
		existingSubsArr,
		newResidentArr,
		newOwnerObj,
		userId,
		uploadId
	} = props;

	let updated = false;

	for await (const subsidyId of existingSubsArr) {
		props.existingSubId = subsidyId;

		const isDuplicate = await deduplicateSubsidies(props);
		if (isDuplicate) {
			updated = true;
			const existingResidents = await db.Resident.find({
				subsidy_id: subsidyId
			});

			if (existingResidents[0]) {
				for await (const newResident of newResidentArr) {
					const filteredResidents = existingResidents.filter(
						item => item.type === newResident
					);

					if (!filteredResidents[0])
						await db.Resident.create({
							type: newResident,
							subsidy_id: subsidyId,
							user_id: userId,
							uploads: [uploadId]
						});
				}
			}
		}
	}
	if (updated) {
		const existingOwner = await db.Owner.findById(property.owner_id);

		if (existingOwner && !existingOwner.name && newOwnerObj.name) {
			newOwnerObj.updated_on = new Date();
			await db.Owner.findByIdAndUpdate(existingOwner._id, newOwnerObj);
			await db.Property.findByIdAndUpdate(property._id, {
				updated_on: new Date()
			});
		}
	}
	return updated;
};

module.exports = {
	async initializeDbUpload(userId, agency, filename, dropFirst) {
		if (dropFirst) {
			await db.User.updateMany({}, { uploads: [] });
			await db.Agency.updateMany({}, { uploads: [] });
			await db.Upload.deleteMany({});
			await db.Owner.deleteMany({});
			await db.Property.deleteMany({});
			await db.Subsidy.deleteMany({});
			await db.FundingSource.deleteMany({});
			await db.Resident.deleteMany({});
			await db.DeduplicatedSubsidy.deleteMany({});
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
		const existingProperty = await db.Property.findOne({
			address: Property.address
		});

		const dbOwner = !existingProperty
			? await db.Owner.create({
					...Owner,
					user_id: userId,
					agency_id: agencyId,
					uploads: [uploadId]
			  })
			: null;

		const dbProperty =
			!existingProperty && dbOwner
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

		console.log(`Updating subsidies for property: ${dbProperty._id}`);

		const propObj = {
			property: dbProperty,
			propertyId: dbProperty._id,
			existingSubsArr: existingSubs,
			newSubsidy: Subsidy,
			newFundingSrc: Funding_Source,
			newResidentArr: Object.values(Resident),
			existingOwnerId: dbProperty.owner_id,
			newOwnerObj: Owner,
			uploadId,
			agencyId,
			userId
		};
		let createNewRecord = true;

		if (existingSubs[0]) {
			const isUpdated = await handleDuplicatesAndUpdate(propObj);

			if (isUpdated) {
				console.log('DB Updated.');
				createNewRecord = false;
			} else console.log('Not a duplicate. Creating new record.');
		} else console.log('First subsidy for property. Creating new record');

		if (createNewRecord) {
			await handleNewRecord(propObj);
			console.log('New record created.');
		}
	}
};
