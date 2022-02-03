const db = require('../../../models');

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
		updatedSubsidy,
		dedupSubsidy,
		uploadId,
		newFundingSrc
	}) {
		try {
			const { _id: newDedupId } = await db.DeduplicatedSubsidy.create({
				...dedupSubsidy,
				subsidy_id: subsidyId,
				upload_id: uploadId,
				funding_sources: Object.values(newFundingSrc).filter(value => value)
			});

			updatedSubsidy.deduplicated_subsidies.push(newDedupId);

			await db.Subsidy.updateOne({ _id: subsidyId }, updatedSubsidy);
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
