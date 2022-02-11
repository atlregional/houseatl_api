const db = require('../../models');

module.exports = {
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
