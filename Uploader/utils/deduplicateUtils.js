const config = require('../config/deduplicateConfig');

module.exports = {
	getTime(date) {
		return date ? new Date(date).getTime() : '';
	},
	createFundingArrays(existingRecord, newRecord) {
		const existingFundingArr = existingRecord.map(({ source }) => source);
		const newFundingArr = Object.values(newRecord).filter(item => item);
		return { existingFundingArr, newFundingArr };
	},
	createObjsForCompare(existingRecord, newRecord) {
		const existingObj = {};
		const newObj = {};

		config.compareKeys.forEach(key => {
			existingObj[key] = existingRecord[key];
			newObj[key] = newRecord[key];
		});
		return { existingObj, newObj };
	}
};
