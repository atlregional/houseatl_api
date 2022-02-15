const db = require('../../../models');

module.exports = {
	async createDedupSubAndAddToSubUpdate(updatedSubObj, newDedupObj) {
		try {
      if (!newDedupObj.upload_id) {
        newDedupObj.upload_id =  newDedupObj.uploads[0]
      };
			const { _id } = await db.DeduplicatedSubsidy.create(newDedupObj);
			updatedSubObj.deduplicated_subsidies.push(_id);

			return updatedSubObj;
		} catch (err) {
			console.log(err);
		}
	}
};
