const db = require('../../models');

const {
	getTime,
	createFundingArrays,
	evaluateSubsidies,
	consolidateSubsidies
} = require('./deduplicateUtils');

const updateDuplicatedSubsidy = async ({
	subsidyId,
	updatedSubsidy,
	dedupSubsidy
}) => {
	try {
		dedupSubsidy.subsidy_id = subsidyId;

		const { _id: newDedupId } = await db.DeduplicatedSubsidy.create(
			dedupSubsidy
		);

		updatedSubsidy.deduplicated_subsidies.push(newDedupId);

		await db.Subsidy.updateOne({ _id: subsidyId }, updatedSubsidy);
	} catch (err) {
		console.log(err);
	}
};

const updateSubsidy = async props => {
	try {
		const { existingSubsidy, newSubsidy, newFundingSrc, agencyId } = props;

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
				dedupSubsidy: newSubsidy
			});
		}

		return configObj.update;
	} catch (err) {
		console.log(err);
	}
};

const deduplicateSubsidies = async props => {
	const { existingSubId, newSubsidy, newFundingSrc, agencyId } = props;

	try {
		if (existingSubId) {
			const existingSubsidy = await db.Subsidy.findById(existingSubId)
				.populate('funding_sources')
				.populate('uploads');

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

module.exports = { deduplicateSubsidies };
