module.exports = {
	createDataObj(agencyObj, item) {
		const obj = {};
		agencyObj.getCollectionsArr().forEach(collection => {
			obj[collection] = agencyObj.createCollectionObj(collection, item);
		});
		return obj;
	},
	handleDateLIHTC(updateObj, startDate) {
		const startDateArr = startDate.split('/');

		updateObj.end_date = `${startDateArr[0]}/${startDateArr[1]}/${
			+startDateArr[2] + 30
		}`;
		updateObj.risk_of_exp = `${startDateArr[0]}/${startDateArr[1]}/${
			+startDateArr[2] + 15
		}`;

		return updateObj;
	}
};
