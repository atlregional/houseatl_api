module.exports = {
	'Atlanta Housing': {
		Property: {
			name: 'COMMUNITY NAME',
			original_address: 'ADDRESS',
			city: 'CITY',
			state: '',
			zip: 'ZIP',
			county: '',
			total_units: '# OF AHA ASSISTED UNITS',
			active: 'AGREEMENT STATUS'
		},
		Owner: {
			name: ''
		},
		Subsidy: {
			project_name: 'COMMUNITY NAME',
			development_type: '',
			start_date: 'CURRENT AGREEMENT EFFECTIVE DATE',
			end_date: 'CURRENT AGREEMENT EXPIRATION DATE',
			ami_30: '',
			ami_50: '',
			ami_60: '',
			ami_80: '',
			ami_100: '',
			ami_115: '',
			ami_120: '',
			low_income_units: '# OF AHA ASSISTED UNITS'
		},
		Resident: {
			type_1: '',
			type_2: ''
		},
		Funding_Source: {
			source_1: '',
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
			name: 'Property Name',
			original_address: 'Address',
			city: 'City',
			zip: 'Zip Code',
			county: 'County',
			total_units: 'Total Units'
		},
		Owner: {
			name: 'Owner Main Contact (Warm Body)'
		},
		Subsidy: {
			project_name: 'Property Name',
			development_type: 'New Construction or Acq./Rehab',
			start_date: 'First PIS',
			end_date: 'End of Extended Use Period',
			ami_30: '',
			ami_50: '',
			ami_60: '',
			ami_80: '',
			ami_100: '',
			ami_115: '',
			ami_120: '',
			low_income_units: 'No. LIHTC Units'
		},
		Resident: {
			type_1: 'Tenancy',
			type_2: ''
		},
		Funding_Source: {
			source_1: 'Primary Funding Source',
			source_2: 'Secondary Funding Source'
		}
	},
	'City of Atlanta': {
		Property: {
			name: 'Project Name',
			original_address: 'Full Address',
			city: '',
			zip: '',
			county: '',
			total_units: 'Total Units'
		},
		Owner: {
			name: ''
		},
		Subsidy: {
			project_name: 'Project Name',
			development_type: 'Project Type',
			start_date: 'Units Available Date (Est. or Actual)',
			end_date: '',
			ami_30: 'AMI <30%',
			ami_50: 'AMI <50%',
			ami_60: 'AMI <60%',
			ami_80: 'AMI <80%',
			ami_100: '',
			ami_115: '',
			ami_120: 'AMI <120%',
			low_income_units: '# of Aff. Units'
		},
		Resident: {
			type_1: 'Target Population',
			type_2: ''
		},
		Funding_Source: {
			source_1: 'Funding Sources',
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
