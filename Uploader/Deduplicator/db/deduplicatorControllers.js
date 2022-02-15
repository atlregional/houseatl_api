const db = require('../../../models');
const { createDedupSubAndAddToSubUpdate } = require('./helpers');

module.exports = {
	async getSubsidy(id) {
		return await db.Subsidy.findById(id)
			.populate('funding_sources')
			.populate('uploads');
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
          subsidy_id: subsidyId,
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
		} catch (err) {
			console.log(err);
		}
	}
};
