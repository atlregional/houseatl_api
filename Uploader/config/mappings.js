module.exports = {
	'Atlanta Housing': {
		Property: {
			name: '0',
			original_address: '2',
			city: '3',
			state: '4',
			zip: '5',
			county: '',
			total_units: '11'
		},
		Owner: {
			name: '6'
		},
		Subsidy: {
			project_name: '0',
			development_type: '',
			start_date: '12',
			end_date: '13',
			ami_30: '',
			ami_50: '',
			ami_60: '',
			ami_80: '9',
			ami_100: '',
			ami_115: '',
			ami_120: '',
			low_income_units: '10'
		},
		Resident: {
			type_1: '1',
			type_2: ''
		},
		Funding_Source: {
			source_1: '7',
			source_2: ''
		}
	},
	'National Housing Preservation Database': {
		Property: {
			name: '10',
			original_address: '11',
			city: '12',
			state: '13',
			zip: '14',
			county: '',
			total_units: '28'
		},
		Owner: {
			name: '17'
		},
		Subsidy: {
			project_name: '10',
			development_type: '',
			start_date: '7',
			end_date: '8',
			ami_30: '',
			ami_50: '',
			ami_60: '',
			ami_80: '',
			ami_100: '',
			ami_115: '',
			ami_120: '',
			low_income_units: '9'
		},
		Resident: {
			type_1: '24',
			type_2: ''
		},
		Funding_Source: {
			source_1: '5',
			source_2: ''
		}
	},
	'Georgia Department of Community Affairs': {
		Property: {
			name: '3',
			original_address: '5',
			city: '6',
			zip: '7',
			county: '8',
			total_units: '16'
		},
		Owner: {
			name: ''
		},
		Subsidy: {
			project_name: '3',
			development_type: '13',
			start_date: '0',
			end_date: '',
			ami_30: '',
			ami_50: '',
			ami_60: '',
			ami_80: '',
			ami_100: '',
			ami_115: '',
			ami_120: '',
			low_income_units: ''
		},
		Resident: {
			type_1: '14',
			type_2: ''
		},
		Funding_Source: {
			source_1: '11',
			source_2: '12'
		}
	},
	'City of Atlanta': {
		Property: {
			name: '2',
			original_address: '3',
			city: '',
			zip: '',
			county: '',
			total_units: ''
		},
		Owner: {
			name: ''
		},
		Subsidy: {
			project_name: '2',
			development_type: '5',
			start_date: '0',
			end_date: '1',
			ami_30: '9',
			ami_50: '10',
			ami_60: '11',
			ami_80: '12',
			ami_100: '',
			ami_115: '',
			ami_120: '',
			low_income_units: '14'
		},
		Resident: {
			type_1: '4',
			type_2: ''
		},
		Funding_Source: {
			source_1: '8',
			source_2: ''
		}
	},

	'Invest Atlanta': {
		Property: {
			name: '0',
			original_address: '4',
			city: '',
			zip: '',
			county: '',
			total_units: '6'
		},
		Owner: {
			name: '2'
		},
		Subsidy: {
			project_name: '0',
			development_type: '34',
			start_date: '5',
			end_date: '31',
			ami_30: '13',
			ami_50: '18',
			ami_60: '25',
			ami_80: '30',
			ami_100: '',
			ami_115: '',
			ami_120: '',
			low_income_units: '7'
		},
		Resident: {
			type_1: '32',
			type_2: '33'
		},
		Funding_Source: {
			source_1: '48',
			source_2: '49'
		}
	},

	data_type_mapping: {
		Property: {
			name: 'str',
			original_address: 'str',
			city: 'str',
			zip: 'str',
			county: 'str',
			total_units: 'int'
		},
		Owner: {
			name: 'str'
		},
		Subsidy: {
			project_name: 'str',
			development_type: 'str',
			start_date: 'datetime',
			end_date: 'datetime',
			ami_30: 'int',
			ami_50: 'int',
			ami_60: 'int',
			ami_80: 'int',
			ami_100: 'int',
			ami_115: 'int',
			ami_120: 'int',
			low_income_units: 'int'
		},
		Resident: {
			type_1: 'str',
			type_2: 'str'
		},
		Funding_Source: {
			source_1: 'str',
			source_2: 'str'
		}
	}
};
