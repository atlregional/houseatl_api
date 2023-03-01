const {
	getSubsidy,
	updateDuplicatedSubsidy
} = require('./db/deduplicatorControllers');

const { getTime, createFundingArrays, isExactMatch } = require('./utils');
const configArrays = require('../config/configArrays');
const consolidateSubsidies = require('./Consolidator');
const e = require('express');
// const { config } = require('dotenv');

const updateSubsidy = async props => {
	try {
		const {
			existingSubsidy,
			newSubsidy,
			newFundingSrc,
			agencyId,
			uploadId,
			existingAgencyId,
			userId
		} = props;

		const originalSubObj = {};
		if (!existingSubsidy.deduplicated_subsidies[0]) {
			// set original sub before existing subsidy is updated if it has not been deduplicated before
			[
				...configArrays.consolidateKeys,
				...configArrays.dateKeys,
				'property_id',
				'user_id',
				'funding_sources',
				'uploads'
			].forEach(key => {
				originalSubObj[key] = existingSubsidy[key];
			});
		}

		const { existingFundingArr, newFundingArr } = createFundingArrays(
			existingSubsidy.funding_sources,
			newFundingSrc
		);

		const configObj = { update: true, type: 'update_all', existingAgencyId };

		if (
			existingFundingArr.includes('HOME') &&
			newFundingArr.includes('HOME') &&
			getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date) &&
			getTime(newSubsidy.end_date) > getTime(existingSubsidy.end_date) &&
			agencyId.toString() === existingAgencyId.toString()
		) {
			console.log('Duplicate: update all');
		} else if (
			existingFundingArr.includes('HOME') &&
			newFundingArr.includes('HOME') &&
			agencyId.toString() === existingAgencyId.toString()
		) {
			console.log('Duplicate: update null');
			configObj.type = 'update_null';
		} else if (
		// 	existingFundingArr.includes('LIHTC') &&
		// 	newFundingArr.includes('LIHTC') &&
		// 	agencyId.toString() === existingAgencyId.toString()
    // ) {
		// 	console.log('Duplicate: update null');
		// 	configObj.type = 'update_null';
    // } else if (
			existingFundingArr.includes('HOME') &&
			newFundingArr.includes('HOME')
		) {
			console.log('Rejected: create new record');
			configObj.update = false;
			configObj.type = null;
		} else if (
			getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date) &&
			getTime(newSubsidy.end_date) > getTime(existingSubsidy.end_date)
		) {
			console.log('Duplicate: update all');
		} else {
			console.log('Duplicate: update hierarchy');
			configObj.type = 'update_hierarchy';
		}

		if (configObj.update) {
			const consolidatedSubsidy = await consolidateSubsidies({
				...props,
				type: configObj.type
			});

			await updateDuplicatedSubsidy({
				subsidyId: existingSubsidy._id,
				existingSubsidy: existingSubsidy,
				updatedSubsidy: consolidatedSubsidy,
				dedupSubsidy: newSubsidy,
				uploadId,
				newFundingSrc,
				userId,
				originalSubObj
			});
		}

		return configObj;
	} catch (err) {
		console.log(err);
	}
};

const evaluateSubsidies = ({
	existingSubsidy,
	newSubsidy,
	newFundingSrc,
	agencyId,
	existingAgencyId
}) => {
	const { existingFundingArr, newFundingArr } = createFundingArrays(
		existingSubsidy.funding_sources,
		newFundingSrc
	);

	if (existingFundingArr.includes('HOME') && newFundingArr.includes('HOME')) {
		console.log('Update: Both HOME');
		return { action: 'update' };
	} else if (
		JSON.stringify(existingFundingArr) !== JSON.stringify(newFundingArr)
	) {
		console.log('Reject: create new record');
		return { action: 'create' };
	} else if (isExactMatch(existingSubsidy, newSubsidy)) {
		console.log('Reject: exact match');
		return { action: 'reject' };
	} else if (existingAgencyId.toString() !== agencyId.toString()) {
		console.log('Update: no agency match');
		return { action: 'update' };
	} else if (
		getTime(existingSubsidy.start_date) === getTime(newSubsidy.start_date) ||
		getTime(existingSubsidy.end_date) === getTime(newSubsidy.end_date) ||
		getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date) ||
		getTime(newSubsidy.end_date) > getTime(existingSubsidy.end_date) ||
    getTime(newSubsidy.risk_of_exp) === getTime(existingSubsidy.risk_of_exp)

	) {
		console.log('Update: dates');
		return { action: 'update' };
	} 
  // else if (
  //     newFundingArr.includes('LIHTC') && 
  //     existingFundingArr.includes('LIHTC') &&
  //     getTime(newSubsidy.risk_of_exp) === getTime(existingSubsidy.risk_of_exp)
  // ) {
  //   console.log('Update: LIHTC same risk date')
  //   return {action: 'update'}

  // } 
  else {
		console.log('Reject: no case met');
		return { action: 'reject' };
	}
};

const deduplicateSubsidies = async props => {
	const { existingSubId, newSubsidy, newFundingSrc, agencyId } = props;

	try {
		if (existingSubId) {
			const existingSubsidy = await getSubsidy(existingSubId);



        const existingAgencyId = existingSubsidy
          ? existingSubsidy.uploads[existingSubsidy.uploads.length - 1].agency_id
          : null;

        const { action } = existingSubsidy
          ? evaluateSubsidies({
              existingSubsidy,
              newSubsidy,
              newFundingSrc,
              agencyId,
              existingAgencyId
            })
          : { action: 'insert' };

        if (action === 'update') {
          props.existingSubsidy = existingSubsidy;
          props.existingAgencyId = existingAgencyId;

          const updateObj = await updateSubsidy(props);

          return updateObj;
        }


			return action === 'reject'
				? { update: true, type: action, existingAgencyId }
				: { update: false, type: action, existingAgencyId };
		}
	} catch (err) {
		console.log(err);
	}
};

module.exports = deduplicateSubsidies;
