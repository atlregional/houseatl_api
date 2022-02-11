const configArrays = require('../config/configArrays');

const convertValue = (value, type) =>
	value && type === 'str' ? `${value}` : value && type === 'int' ? +value : '';

module.exports = {
	getTime(date) {
		if (date) return new Date(date).getTime();
		return '';
	},
	createFundingArrays(existingRecord, newRecord) {
		return {
			existingFundingArr: existingRecord.map(({ source }) => source),
			newFundingArr: Object.values(newRecord).filter(item => item)
		};
	},
	isExactMatch(existingRecord, newRecord) {
		let exactMatch = true;
		configArrays.compareKeys.forEach(({ key, type }) => {
			const existingValue = convertValue(existingRecord[key], type);
			const newValue = convertValue(newRecord[key], type);

			if (existingValue !== newValue) exactMatch = false;
		});
		return exactMatch;
	}
};
