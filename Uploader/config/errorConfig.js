module.exports = {
	handleError(address, text) {
		return {
			data: {
				addressProvided: address,
				text: text
			},
			error: true
		};
	}
};
