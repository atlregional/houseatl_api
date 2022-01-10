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
			name: 'Property Name',
			original_address: 'Street Address',
			city: 'City',
			state: 'State',
			zip: 'Zip Code',
			longitude: 'Longitude',
			latitude: 'Latitude',
			county: '',
			total_units: 'Known Total Units',
			active: 'Subsidy Status'
		},
		Owner: {
			name: 'Owner Name'
		},
		Subsidy: {
			project_name: 'Property Name',
			development_type: 'Construction Type',
			start_date: 'Start Date',
			end_date: 'End Date',
			ami_30: '',
			ami_50: '',
			ami_60: '',
			ami_80: '',
			ami_100: '',
			ami_115: '',
			ami_120: '',
			low_income_units: 'Assisted Units'
		},
		Resident: {
			type_1: 'Target Population',
			type_2: ''
		},
		Funding_Source: {
			source_1: 'Subsidy Name',
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
			name: 'PROJECT',
			original_address: 'ADDRESS',
			city: '',
			zip: '',
			county: '',
			total_units: '# OF UNITS'
		},
		Owner: {
			name: 'OWNERSHIP ENTITY'
		},
		Subsidy: {
			project_name: 'PROJECT',
			development_type: 'CONSTRUCTION TYPE',
			start_date: 'DATE CLOSED',
			end_date: 'EFFECTIVE AFFORDABILITY END DATE',
			ami_30: [
				'STUDIO   30%AMI',
				'1 BDRM          30% AMI',
				'2 BDRM          30% AMI',
				'3 BDRM          30% AMI',
				'4 BDRM          30% AMI'
			],
			ami_50: [
				'STUDIO   50%AMI',
				'1 BDRM          50% AMI',
				'2 BDRM          50% AMI',
				'3 BDRM          50% AMI'
			],
			ami_60: [
				'STUDIO   60%AMI',
				'1 BDRM          60% AMI',
				'2 BDRM          60% AMI',
				'3 BDRM          60% AMI',
				'4 BDRM          60% AMI'
			],
			ami_80: [
				'STUDIO   80%AMI',
				'1 BDRM          80% AMI',
				'2 BDRM          80% AMI',
				'3 BDRM          80% AMI'
			],
			ami_100: '',
			ami_115: '',
			ami_120: '',
			low_income_units: '# OF AFFORDABLE UNITS'
		},
		Resident: {
			type_1: 'TENANT TYPE',
			type_2: 'CONSTRUCTION TYPE'
		},
		Funding_Source: {
			// No funding source data provided...
			source_1: '',
			source_2: ''
		}
	},

	data_type_mapping: {
		Property: {
			name: 'str',
			original_address: 'str',
			city: 'str',
			zip: 'str',
			county: 'str',
			total_units: 'int',
			active: 'str'
		},
		Owner: {
			name: 'str'
		},
		Subsidy: {
			project_name: 'str',
			development_type: 'str',
			start_date: 'date',
			end_date: 'date',
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
