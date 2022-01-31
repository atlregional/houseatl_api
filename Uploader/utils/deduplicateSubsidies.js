// require('dotenv').config();
// const mongoose = require('mongoose');
const db = require('../../models');
const config = require('../config/deduplicateConfig');
const {
	getTime,
	createFundingArrays,
	createObjsForCompare
} = require('./deduplicateUtils');

// const userId = process.env.user_id;
// const Subsidy = {
// 	project_name: 'COLUMBIA RESIDENCES @ EDGEWOOD',
// 	development_type: 'New Construction',
// 	start_date: '03/31/2010',
// 	end_date: '03/31/2040',
// 	ami_30: '',
// 	ami_50: 100,
// 	ami_60: '',
// 	ami_80: 20,
// 	ami_100: 10,
// 	ami_115: '',
// 	ami_120: '',
// 	low_income_units: 130,
// 	property_id: '61e0b687d669d63d07414138',
// 	user_id: '61d72effd0782b55ffa8c5fd',
// 	uploads: ['61e0bbbe8f21dc15cb337fc8']
// };
// const Resident = {
// 	type_1: 'Family',
// 	type_2: ''
// };
// const Funding_Source = { source_1: 'HOME', source_2: '' };

const evaluateSubsidies = async (
	existingSubsidy,
	newSubsidy,
	newFundingSrc,
	agencyId
) => {
	const { existingObj, newObj } = createObjsForCompare(
		existingSubsidy,
		newSubsidy
	);
	const { existingFundingArr, newFundingArr } = createFundingArrays(
		existingSubsidy.funding_sources,
		newFundingSrc
	);

	const existingAgencyId = existingSubsidy.uploads[0].agency_id;

	if (existingFundingArr.includes('HOME') && newFundingArr.includes('HOME')) {
		return { action: 'update' };
	} else if (
		JSON.stringify(existingFundingArr) !== JSON.stringify(newFundingArr)
	) {
		return { action: 'create' };
	} else if (JSON.stringify(existingObj) === JSON.stringify(newObj)) {
		return { action: 'reject' };
	} else if (existingAgencyId.toString() !== agencyId.toString()) {
		return { action: 'update' };
	} else if (
		getTime(existingSubsidy.start_date) === getTime(newSubsidy.start_date) ||
		getTime(existingSubsidy.end_date) === getTime(newSubsidy.end_date) ||
		getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date) ||
		getTime(newSubsidy.end_date) > getTime(existingSubsidy.end_date)
	) {
		return { action: 'update' };
	} else return { action: 'reject' };
};

// IF fs === 'HOME' && start date and end date are more recent && agency is same -> UPDATE ALL FIELDS
// ELSE IF fs === 'HOME' && agency is same -> update all null fields with incoming values and start date and end date with most recent
// ELSE IF fs === 'HOME' -> do not update/do not insert dedup rec/create new record
// ELSE IF start date && end date are more recent -> update all fields
// ELSE -> updater start date and end date with most recent/dev type and AMI unit counts with:
// 	incoming if existing val is null
// 	value from agency highest in hierarchy [City of Atlanta, Invest Atlanta, Atlanta Housing, GDCA, NHPD]

const consolidateSubsidies = async (
	existingSubsidy,
	newSubsidy,
	uploadId,
	userId,
	type,
	agencyId
) => {
	existingSubsidy.uploads = existingSubsidy.uploads.map(({ _id }) => _id);
	existingSubsidy.funding_sources = existingSubsidy.funding_sources.map(
		({ _id }) => _id
	);

	existingSubsidy.user_id = userId;
	existingSubsidy.updated_on = new Date();

	if (!existingSubsidy.uploads.includes(uploadId))
		existingSubsidy.uploads.push(uploadId);

	switch (type) {
		case 'update_null':
			[...config.consolidateKeys, ...config.dateKeys].forEach(key => {
				if (
					(!existingSubsidy[key] && newSubsidy[key]) ||
					(config.dateKeys.includes(key) &&
						existingSubsidy[key] &&
						newSubsidy[key] &&
						getTime(newSubsidy[key]) > getTime(existingSubsidy[key]))
				)
					existingSubsidy[key] = newSubsidy[key];
			});
			break;
		case 'update_all':
			[...config.consolidateKeys, ...config.dateKeys].forEach(
				key => (existingSubsidy[key] = newSubsidy[key])
			);
			break;
		case 'update_hierarchy':
			const { name: existingAgency } = await db.Agency.findOne({
				uploads: existingSubsidy.uploads[existingSubsidy.uploads.length - 1]
			});

			const { name: newAgency } = await db.Agency.findById(agencyId);

			config.consolidateKeys.forEach(key => {
				if (
					(!existingSubsidy[key] && newSubsidy[key]) ||
					(newSubsidy[key] &&
						config.agencyHierarchy.indexOf(newAgency) <
							config.agencyHierarchy.indexOf(existingAgency))
				)
					existingSubsidy[key] = newSubsidy[key];
			});

			config.dateKeys.forEach(key => {
				if (
					existingSubsidy[key] &&
					newSubsidy[key] &&
					getTime(newSubsidy[key]) > getTime(existingSubsidy[key])
				) {
					existingSubsidy[key] = newSubsidy[key];
				}
			});

			break;
		default:
			break;
	}
	return existingSubsidy;
};

const updateRelatedCollections = async ({
	subsidyId,
	updatedSubsidy,
	dedupSubsidy,
	newResidentArr,
	userId,
	uploadId
}) => {
	try {
		dedupSubsidy.subsidy_id = subsidyId;

		const { _id: newDedupId } = await db.DeduplicatedSubsidy.create(
			dedupSubsidy
		);

		updatedSubsidy.deduplicated_subsidies.push(newDedupId);

		await db.Subsidy.updateOne({ _id: subsidyId }, updatedSubsidy);

		const { type } = await db.Resident.find({
			subsidy_id: subsidyId
		});

		if (!type) {
			for await (const val of newResidentArr) {
				if (val)
					await db.Resident.create({
						type: val,
						subsidy_id: subsidyId,
						user_id: userId,
						uploads: [uploadId]
					});
			}
		}
	} catch (err) {
		console.log(err);
	}
};

const updateSubsidy = async (
	existingSubsidy,
	newSubsidy,
	newFundingSrc,
	newResidentObj,
	uploadId,
	agencyId,
	userId
) => {
	const { existingObj, newObj } = createObjsForCompare(
		existingSubsidy,
		newSubsidy
	);
	const { existingFundingArr, newFundingArr } = createFundingArrays(
		existingSubsidy.funding_sources,
		newFundingSrc
	);
	const existingAgencyId = existingSubsidy.uploads[0].agency_id;

	if (
		existingFundingArr.includes('HOME') &&
		newFundingArr.includes('HOME') &&
		getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date) &&
		getTime(newSubsidy.end_date) > getTime(existingSubsidy.end_date) &&
		agencyId.toString() === existingAgencyId.toString()
	) {
		const consolidatedSubsidy = await consolidateSubsidies(
			existingSubsidy,
			newSubsidy,
			uploadId,
			userId,
			'update_all'
		);

		await updateRelatedCollections({
			subsidyId: existingSubsidy._id,
			updatedSubsidy: consolidatedSubsidy,
			dedupSubsidy: newSubsidy,
			newResidentArr: Object.values(newResidentObj),
			userId,
			uploadId
		});

		return true;
	} else if (
		existingFundingArr.includes('HOME') &&
		newFundingArr.includes('HOME') &&
		agencyId.toString() === existingAgencyId.toString()
	) {
		const consolidatedSubsidy = await consolidateSubsidies(
			existingSubsidy,
			newSubsidy,
			uploadId,
			userId,
			'update_null'
		);

		await updateRelatedCollections({
			subsidyId: existingSubsidy._id,
			updatedSubsidy: consolidatedSubsidy,
			dedupSubsidy: newSubsidy,
			newResidentArr: Object.values(newResidentObj),
			userId,
			uploadId
		});

		return true;
	} else if (
		existingFundingArr.includes('HOME') &&
		newFundingArr.includes('HOME')
	) {
		console.log('REJECT.');
		return false;
	} else if (
		getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date) &&
		getTime(newSubsidy.end_date) > getTime(existingSubsidy.end_date)
	) {
		const consolidatedSubsidy = await consolidateSubsidies(
			existingSubsidy,
			newSubsidy,
			uploadId,
			userId,
			'update_all'
		);

		await updateRelatedCollections({
			subsidyId: existingSubsidy._id,
			updatedSubsidy: consolidatedSubsidy,
			dedupSubsidy: newSubsidy,
			newResidentArr: Object.values(newResidentObj),
			userId,
			uploadId
		});

		return true;
	} else {
		const consolidatedSubsidy = await consolidateSubsidies(
			existingSubsidy,
			newSubsidy,
			uploadId,
			userId,
			'update_hierarchy',
			agencyId
		);

		await updateRelatedCollections({
			subsidyId: existingSubsidy._id,
			updatedSubsidy: consolidatedSubsidy,
			dedupSubsidy: newSubsidy,
			newResidentArr: Object.values(newResidentObj),
			userId,
			uploadId
		});

		return true;
	}
};

const deduplicateSubsidies = async ({
	existingSubId,
	newSubsidy,
	newFundingSrcObj,
	newResidentObj,
	uploadId,
	agencyId,
	userId
}) => {
	try {
		if (existingSubId) {
			const existingSubsidy = await db.Subsidy.findById(existingSubId)
				.populate('funding_sources')
				.populate('uploads');

			const { action } = existingSubsidy
				? await evaluateSubsidies(
						existingSubsidy,
						newSubsidy,
						newFundingSrcObj,
						agencyId
				  )
				: { action: 'insert' };

			// console.log(action);

			if (action === 'update') {
				const isUpdated = await updateSubsidy(
					existingSubsidy,
					newSubsidy,
					newFundingSrcObj,
					newResidentObj,
					uploadId,
					agencyId,
					userId
				);

				return isUpdated;
			}

			return action === 'reject' ? true : false;
		}
	} catch (err) {
		console.log(err);
	}
};

module.exports = deduplicateSubsidies;

// const init = async () => {
// 	const properties = await db.Property.find({});
// 	const testUpload = '61e0b67cd669d63d0741408d';
// 	const testAgency = '61d7316bd0782b55ffa8c601';
// 	// console.log(testAgency._id);

// 	for await (const property of properties.slice(0, 20)) {
// 		// console.log(property);
// 		const obj = {};
// 		let insertNew = true;
// 		for await (const subId of property.subsidies) {
// 			if (Subsidy.property_id === property._id.toString()) {
// 				const isDuplicate = await deduplicateSubsidies({
// 					existingSubId: subId,
// 					newSubsidy: Subsidy,
// 					newFundingSrcObj: Funding_Source,
// 					newResidentObj: Resident,
// 					uploadId: testUpload,
// 					agencyId: testAgency,
// 					userId: userId
// 				});
// 				if (isDuplicate) insertNew = false;
// 			}
// 		}
// 		// IF createNewSub is true... use objs to insert data
// 		// ELSE everything is already updated with duplicate record OR omitted completely
// 		console.log({ insertNew });
// 	}
// };

// const url = process.env.MONGODB_URI;
// const url = 'mongodb://localhost/houseatl';

// mongoose
// 	.connect(url, {
// 		useNewUrlParser: true,
// 		useUnifiedTopology: true
// 	})
// 	.then(async () => {
// 		await init();
// 		console.log('Process complete.');
// 		process.exit(0);
// 	})
// 	.catch(err => {
// 		console.log('Unable to connect to DB...');
// 		console.log(err);
// 	});
