const db = require('../../../models');
const config = require('./config');

const createDedupSubAndAddToSubUpdate = async (updatedSubObj, newDedupObj) => {
	try {
		const { _id } = await db.DeduplicatedSubsidy.create(newDedupObj);
		console.log('New deduplicated subsidy created');

		updatedSubObj.deduplicated_subsidies.push(_id);

		return updatedSubObj;
	} catch (err) {
		console.log(err);
	}
};

module.exports = {
	async getSubsidy(id) {
		try {
			return await db.Subsidy.findById(id)
				.populate('funding_sources')
				.populate('uploads');
		} catch (err) {
			console.log(err);
		}
	},
	async updateDuplicatedSubsidy({
		subsidyId,
		existingSubsidy,
		updatedSubsidy,
		dedupSubsidy,
		uploadId,
		newFundingSrc,
		userId,
		originalSubObj
	}) {
		try {
			if (!existingSubsidy.deduplicated_subsidies[0]) {
				updatedSubsidy = await createDedupSubAndAddToSubUpdate(updatedSubsidy, {
					...originalSubObj,
					funding_sources: originalSubObj.funding_sources.map(
						({ source }) => source
					)
				});
			}

			updatedSubsidy = await createDedupSubAndAddToSubUpdate(updatedSubsidy, {
				...dedupSubsidy,
				subsidy_id: subsidyId,
				upload_id: uploadId,
				funding_sources: Object.values(newFundingSrc).filter(value => value),
				user_id: userId
			});

			await db.Subsidy.updateOne({ _id: subsidyId }, updatedSubsidy);
			console.log('Subsidy updated');
		} catch (err) {
			console.log(err);
		}
	},
	async getAgenciesForHierarchyCompare(uploadId, newAgencyId) {
		try {
			const existingObj = await db.Agency.findOne({
				uploads: uploadId
			});
			const newObj = await db.Agency.findById(newAgencyId);

			return {
				existingAgency: existingObj ? existingObj.name : '',
				newAgency: newObj ? newObj.name : ''
			};
		} catch (err) {
			console.log(err);
		}
	}
};
