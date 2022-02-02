const db = require('../../models');
const config = require('../config/deduplicateConfig');

const getAgenciesForHierarchyCompare = async (uploadId, newAgencyId) => {
	try {
		const { name: existingAgency } = await db.Agency.findOne({
			uploads: uploadId
		});

		const { name: newAgency } = await db.Agency.findById(newAgencyId);

		return { existingAgency, newAgency };
	} catch (err) {
		console.log(err);
	}
};

const handleDateLIHTC = (updateObj, startDate) => {
	const startDateArr = startDate.split('/');

	updateObj.end_date = `${startDateArr[0]}/${startDateArr[1]}/${
		+startDateArr[2] + 30
	}`;
	updateObj.risk_of_exp = `${startDateArr[0]}/${startDateArr[1]}/${
		+startDateArr[2] + 15
	}`;

	return updateObj;
};
const getTime = date => (date ? new Date(date).getTime() : '');

const createFundingArrays = (existingRecord, newRecord) => ({
	existingFundingArr: existingRecord.map(({ source }) => source),
	newFundingArr: Object.values(newRecord).filter(item => item)
});

const convertValue = (value, type) =>
	value && type === 'str' ? `${value}` : value && type === 'int' ? +value : '';

const isExactMatch = (existingRecord, newRecord) => {
	let exactMatch = true;
	config.compareKeys.forEach(({ key, type }) => {
		const existingValue = convertValue(existingRecord[key], type);
		const newValue = convertValue(newRecord[key], type);

		if (existingValue !== newValue) exactMatch = false;
	});
	return exactMatch;
};

module.exports = {
	evaluateSubsidies({ existingSubsidy, newSubsidy, newFundingSrc, agencyId }) {
		const { existingFundingArr, newFundingArr } = createFundingArrays(
			existingSubsidy.funding_sources,
			newFundingSrc
		);
		const existingAgencyId = existingSubsidy.uploads[0].agency_id;

		if (existingFundingArr.includes('HOME') && newFundingArr.includes('HOME')) {
			console.log('Sent to update: Both HOME');
			return { action: 'update' };
		} else if (
			JSON.stringify(existingFundingArr) !== JSON.stringify(newFundingArr)
		) {
			console.log(
				'Not a duplicate: Funding does not match - Create new record'
			);
			return { action: 'create' };
		} else if (isExactMatch(existingSubsidy, newSubsidy)) {
			console.log('Exact Match: Reject record');
			return { action: 'reject' };
		} else if (existingAgencyId.toString() !== agencyId.toString()) {
			console.log('Sent to update: No agency match');
			return { action: 'update' };
		} else if (
			getTime(existingSubsidy.start_date) === getTime(newSubsidy.start_date) ||
			getTime(existingSubsidy.end_date) === getTime(newSubsidy.end_date) ||
			getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date) ||
			getTime(newSubsidy.end_date) > getTime(existingSubsidy.end_date)
		) {
			console.log('Sent to update: Dates');
			return { action: 'update' };
		} else {
			console.log('No case met in evaluator: Reject record');
			return { action: 'reject' };
		}
	},

	async consolidateSubsidies({
		type,
		existingSubsidy,
		newSubsidy,
		uploadId,
		userId,
		agencyId
	}) {
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
				const { existingAgency, newAgency } =
					await getAgenciesForHierarchyCompare(
						existingSubsidy.uploads[existingSubsidy.uploads.length - 1],
						agencyId
					);

				config.consolidateKeys.forEach(key => {
					if (
						(!existingSubsidy[key] && newSubsidy[key]) ||
						(newSubsidy[key] &&
							config.agencyHierarchy.indexOf(newAgency) <
								config.agencyHierarchy.indexOf(existingAgency))
					)
						existingSubsidy[key] = newSubsidy[key];
				});

				const isLIHTC = existingSubsidy.funding_sources
					.map(({ source }) => source)
					.includes('LIHTC');

				if (
					isLIHTC &&
					newSubsidy.start_date &&
					existingSubsidy.start_date &&
					getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date)
				) {
					existingSubsidy.start_date = newSubsidy.start_date;

					existingSubsidy = handleDateLIHTC(
						existingSubsidy,
						newSubsidy.start_date
					);
				} else if (isLIHTC && existingSubsidy.start_date) {
					existingSubsidy = handleDateLIHTC(
						existingSubsidy,
						existingSubsidy.start_date
					);
				} else {
					config.dateKeys.forEach(key => {
						if (
							existingSubsidy[key] &&
							newSubsidy[key] &&
							getTime(newSubsidy[key]) > getTime(existingSubsidy[key])
						) {
							existingSubsidy[key] = newSubsidy[key];
						}
					});
				}

				break;
			default:
				break;
		}
		existingSubsidy.uploads = existingSubsidy.uploads.map(({ _id }) => _id);
		existingSubsidy.funding_sources = existingSubsidy.funding_sources.map(
			({ _id }) => _id
		);

		existingSubsidy.user_id = userId;
		existingSubsidy.updated_on = new Date();

		if (!existingSubsidy.uploads.includes(uploadId))
			existingSubsidy.uploads.push(uploadId);

		return existingSubsidy;
	},
	getTime,
	createFundingArrays
};
