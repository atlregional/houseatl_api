module.exports = {
	compareKeys: [
		{ key: 'development_type', type: 'str' },
		{ key: 'start_date', type: 'str' },
		{ key: 'end_date', type: 'str' },
    { key: 'risk_of_exp', type: 'str'},
		{ key: 'ami_30', type: 'int' },
		{ key: 'ami_50', type: 'int' },
		{ key: 'ami_60', type: 'int' },
		{ key: 'ami_80', type: 'int' },
		{ key: 'ami_100', type: 'int' },
		{ key: 'ami_115', type: 'int' },
		{ key: 'ami_120', type: 'int' },
		{ key: 'low_income_units', type: 'int' }
	],
	consolidateKeys: [
		'project_name',
		'development_type',
		'ami_30',
		'ami_50',
		'ami_60',
		'ami_80',
		'ami_100',
		'ami_115',
		'ami_120',
		'low_income_units'
	],
	dateKeys: ['start_date', 'end_date','risk_of_exp'],
	agencyHierarchy: [
		'City of Atlanta',
		'Invest Atlanta',
		'Atlanta Housing',
		'Georgia Department of Community Affairs',
		'National Housing Preservation Database'
	]
};
