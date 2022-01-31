module.exports = {
	compareKeys: [
		'development_type',
		'start_date',
		'end_date',
		'ami_30',
		'ami_50',
		'ami_60',
		'ami_80',
		'ami_100',
		'ami_115',
		'ami_120',
		'low_income_units'
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
	dateKeys: ['start_date', 'end_date'],
	agencyHierarchy: [
		'City of Atlanta',
		'Invest Atlanta',
		'Atlanta Housing',
		'Georgia Department of Community Affairs',
		'National Housing Preservation Database'
	]
};
