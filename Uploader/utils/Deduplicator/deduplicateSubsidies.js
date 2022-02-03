const { getSubsidy, updateDuplicatedSubsidy } = require('./dbInteraction');
const { getTime, createFundingArrays, isExactMatch } = require('./utils');
const consolidateSubsidies = require('./consolidateSubsidies');

const updateSubsidy = async props => {
	try {
		const { existingSubsidy, newSubsidy, newFundingSrc, agencyId, uploadId } =
			props;

		const { existingFundingArr, newFundingArr } = createFundingArrays(
			existingSubsidy.funding_sources,
			newFundingSrc
		);
		const existingAgencyId = existingSubsidy.uploads[0].agency_id;

		const configObj = { update: true, type: 'update_all' };

		if (
			existingFundingArr.includes('HOME') &&
			newFundingArr.includes('HOME') &&
			getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date) &&
			getTime(newSubsidy.end_date) > getTime(existingSubsidy.end_date) &&
			agencyId.toString() === existingAgencyId.toString()
		) {
			console.log(
				'Duplicate. Updating all fields. Creating deduplicated record.'
			);
		} else if (
			existingFundingArr.includes('HOME') &&
			newFundingArr.includes('HOME') &&
			agencyId.toString() === existingAgencyId.toString()
		) {
			console.log(
				'Duplicate. Updating null fields. Creating deduplicated record.'
			);
			configObj.type = 'update_null';
		} else if (
			existingFundingArr.includes('HOME') &&
			newFundingArr.includes('HOME')
		) {
			console.log('Update Rejected: not a duplicate. Creating new record.');
			configObj.update = false;
			configObj.type = null;
		} else if (
			getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date) &&
			getTime(newSubsidy.end_date) > getTime(existingSubsidy.end_date)
		) {
			console.log(
				'Duplicate. Updating all fields. Creating deduplicated record.'
			);
		} else {
			console.log(
				'Duplicate. Updating based on hierarchy. Creating deduplicated record.'
			);
			configObj.type = 'update_hierarchy';
		}

		if (configObj.update) {
			const consolidatedSubsidy = await consolidateSubsidies({
				...props,
				type: configObj.type
			});

			await updateDuplicatedSubsidy({
				subsidyId: existingSubsidy._id,
				updatedSubsidy: consolidatedSubsidy,
				dedupSubsidy: newSubsidy,
				uploadId,
				newFundingSrc
			});
		}

		return configObj.update;
	} catch (err) {
		console.log(err);
	}
};

const evaluateSubsidies = ({
	existingSubsidy,
	newSubsidy,
	newFundingSrc,
	agencyId
}) => {
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
		console.log('Not a duplicate: Funding does not match - Create new record');
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
};

const deduplicateSubsidies = async props => {
	const { existingSubId, newSubsidy, newFundingSrc, agencyId } = props;

	try {
		if (existingSubId) {
			const existingSubsidy = await getSubsidy(existingSubId);

			const { action } = existingSubsidy
				? evaluateSubsidies({
						existingSubsidy,
						newSubsidy,
						newFundingSrc,
						agencyId
				  })
				: { action: 'insert' };

			if (action === 'update') {
				props.existingSubsidy = existingSubsidy;
				const isUpdated = await updateSubsidy(props);

				return isUpdated;
			}

			return action === 'reject' ? true : false;
		}
	} catch (err) {
		console.log(err);
	}
};

module.exports = deduplicateSubsidies;