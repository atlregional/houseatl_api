const config = require('./config');

const convertValue = (value, type) =>
	value && type === 'str' ? `${value}` : value && type === 'int' ? +value : '';

module.exports = {
	handleDateLIHTC(updateObj, startDate) {
		const startDateArr = startDate.split('/');

		updateObj.end_date = `${startDateArr[0]}/${startDateArr[1]}/${
			+startDateArr[2] + 30
		}`;
		updateObj.risk_of_exp = `${startDateArr[0]}/${startDateArr[1]}/${
			+startDateArr[2] + 15
		}`;

		return updateObj;
	},
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
		config.compareKeys.forEach(({ key, type }) => {
			const existingValue = convertValue(existingRecord[key], type);
			const newValue = convertValue(newRecord[key], type);

			if (existingValue !== newValue) exactMatch = false;
		});
		return exactMatch;
	}
};
