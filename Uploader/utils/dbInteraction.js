const db = require('../../models');
const deduplicatorConfig = require('./Deduplicator/config');
const deduplicateSubsidies = require('./Deduplicator/deduplicateSubsidies');
const {
	getAgenciesForHierarchyCompare
} = require('./Deduplicator/dbInteraction');

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

const handleUpdateType = async ({
	updateObj,
	existingOwner,
	newOwnerObj,
	ownerUpdateObj,
	property,
	newProperty,
	propertyUpdateObj,
	existingResident,
	residentUpdateObj,
	uploadId
}) => {
	switch (updateObj.type) {
		case 'update_all':
			if (existingOwner.name !== newOwnerObj.name)
				await db.Owner.findByIdAndUpdate(existingOwner._id, ownerUpdateObj);

			if (property.total_units !== newProperty.total_units)
				await db.Property.findByIdAndUpdate(property._id, propertyUpdateObj);

			if (existingResident && residentUpdateObj)
				db.Resident.findByIdAndUpdate(existingResident._id, residentUpdateObj);
			break;

		case 'update_null':
			if (!existingOwner.name && newOwnerObj.name)
				await db.Owner.findByIdAndUpdate(existingOwner._id, ownerUpdateObj);

			if (!property.total_units && newProperty.total_units)
				await db.Property.findByIdAndUpdate(property._id, propertyUpdateObj);
			break;

		case 'update_hierarchy':
			const { existingAgency, newAgency } =
				await getAgenciesForHierarchyCompare(
					updateObj.existingAgencyId,
					uploadId
				);
			const newAgencyHasPriority =
				deduplicatorConfig.agencyHierarchy.indexOf(newAgency) <
				deduplicatorConfig.agencyHierarchy.indexOf(existingAgency);

			if (
				(!existingOwner.name && newOwnerObj.name) ||
				(newOwnerObj.name && newAgencyHasPriority)
			)
				await db.Owner.findByIdAndUpdate(existingOwner._id, ownerUpdateObj);

			if (
				(!property.total_units && newProperty.total_units) ||
				(newProperty.total_units && newAgencyHasPriority)
			)
				await db.Property.findByIdAndUpdate(property._id, propertyUpdateObj);

			if (existingResident && residentUpdateObj && newAgencyHasPriority)
				await db.Resident.findByIdAndUpdate(
					existingResident._id,
					residentUpdateObj
				);
			break;

		default:
			break;
	}
};

const updateRelatedCollections = async props => {
	const {
		property,
		newProperty,
		updateObj,
		existingOwner,
		newOwnerObj,
		newResidentArr,
		uploadId,
		userId
	} = props;

	const existingResident = await db.Resident.findOne({
		subsidy_id: updateObj.existingSubId
	});

	const ownerUpdateObj = { ...newOwnerObj };
	const propertyUpdateObj = {
		total_units: newProperty.total_units
	};
	const residentUpdateObj = newResidentArr
		.filter(value => value)
		.map(item => ({
			type: item,
			subsidy_id: updateObj.existingSubId
		}))[0];

	if (!existingResident && residentUpdateObj)
		db.Resident.create({
			...residentUpdateObj,
			uploads: [uploadId],
			user_id: userId
		});

	[ownerUpdateObj, propertyUpdateObj, residentUpdateObj].forEach(obj => {
		if (obj) {
			obj.updated_on = new Date();
			obj.user_id = userId;

			if (!property.uploads.includes(uploadId))
				obj.$push = { uploads: uploadId };
		}
	});

	await handleUpdateType({
		...props,
		existingOwner,
		ownerUpdateObj,
		propertyUpdateObj,
		existingResident,
		residentUpdateObj
	});
};

const handleDuplicatesAndUpdate = async props => {
	const { existingSubsArr } = props;

	const updateObj = { updated: false };

	for await (const subsidyId of existingSubsArr) {
		props.existingSubId = subsidyId;

		const { update, type, existingAgencyId } = await deduplicateSubsidies(
			props
		);

		console.log('Subsidy deduplicated and updated.');
		updateObj.updated = update;
		updateObj.type = type;
		updateObj.existingAgencyId = existingAgencyId;
		updateObj.existingSubId = subsidyId;
	}

	if (updateObj.updated) {
		await updateRelatedCollections({ ...props, updateObj });
		console.log('Collections related to subsidy updated.');
	}

	return updateObj.updated;
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
			: await db.Owner.findById(existingProperty.owner_id);

		const dbProperty = !existingProperty
			? await db.Property.create({
					...Property,
					user_id: userId,
					owner_id: dbOwner._id,
					agency_id: agencyId,
					subsidies: [],
					upload_id: uploadId,
					uploads: [uploadId]
			  })
			: existingProperty;

		const existingSubs = dbProperty.subsidies || [];

		console.log(`Updating subsidies for property: ${dbProperty._id}`);

		const propObj = {
			property: dbProperty,
			newProperty: Property,
			propertyId: dbProperty._id,
			existingSubsArr: existingSubs,
			newSubsidy: Subsidy,
			newFundingSrc: Funding_Source,
			newResidentArr: Object.values(Resident),
			existingOwner: dbOwner,
			newOwnerObj: Owner,
			uploadId,
			agencyId,
			userId
		};

		let createNewRecord = true;

		if (existingSubs[0]) {
			const isUpdated = await handleDuplicatesAndUpdate(propObj);

			if (isUpdated) createNewRecord = false;
			else console.log('Not a duplicate. Creating new record.');
		} else console.log('First subsidy for property. Creating new record');

		if (createNewRecord) {
			await handleNewRecord(propObj);
			console.log('New record created.');
		}
	}
};
