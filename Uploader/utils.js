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
	},
	configureAddressStr(address, city, zip) {
		return `${address}${city ? ', ' + city : ''}${
			!address.includes('GA') && !address.includes('Georgia') ? ', GA' : ''
		}${zip ? ', ' + zip : ''}`;
	},
	configurePartialMatchAddress(address) {
		const firstStreetNum = parseInt(address);

		if (firstStreetNum) {
			let addressStr = '';

			address
				.replace(/[&-]/g, '')
				.split(' ')
				.forEach((item, i) => {
					if ((item && !parseInt(item)) || i > 2)
						// Handles case: 123 & 456 X St
						addressStr += `${item} `;
				});

			return {
				updatedAddressStr: `${firstStreetNum} ${addressStr}`,
				error: false
			};
		} else {
			return { updatedAddressStr: '', error: true };
		}
	}
};
