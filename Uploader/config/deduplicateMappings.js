module.exports = [
	{
		key: 'project_name',
		valueType: 'str',
		forDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'development_type',
		valueType: 'str',
		forDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'start_date',
		valueType: 'str',
		forDeduplicate: true,
		forCompare: true,
		compareType: 'direct'
	},
	{
		key: 'end_date',
		valueType: 'str',
		forDeduplicate: true,
		forCompare: true,
		compareType: 'direct'
	},
	{
		key: 'ami_30',
		valueType: 'int',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'ami_50',
		valueType: 'int',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'ami_60',
		valueType: 'int',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'ami_80',
		valueType: 'int',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'ami_100',
		valueType: 'int',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'ami_115',
		valueType: 'int',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'ami_120',
		valueType: 'int',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'low_income_units',
		valueType: 'int',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'property_id',
		valueType: 'str',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'funding_sources',
		valueType: 'arr',
		neededForDeduplicate: true,
		forCompare: true,
		compareType: 'array'
	},
	{
		key: 'uploads',
		valueType: 'arr',
		neededForDeduplicate: true,
		forCompare: false,
		compareType: ''
	},
	{
		key: 'deduplicated_subsidies',
		valueType: 'arr',
		neededForDeduplicate: false,
		forCompare: false,
		compareType: ''
	}
];

// const mapFundingSources = arr =>
// 	arr.map(({ source }) => (source ? source : '')).sort();

// const compareVals = (valA, valB) => {
// 	// ? establish rules via hierarchy

// 	if (!valA && !valB) return '';
// 	if ((valA && !valB) || valA === valB) return valA;
// 	if (!valA && valB) return valB;
// 	return valA;
// };
// const compareSubsidies = async (currentSub, comparedSub) => {
// 	const obj = {};

// 	deduplicateMapping.forEach(({ key, forCompare, compareType }) => {
// 		if (forCompare)
// 			switch (compareType) {
// 				case 'direct':
// 					currentSub[key] === comparedSub[key]
// 						? (obj[key] = true)
// 						: (obj[key] = false);
// 					break;
// 				case 'array':
// 					JSON.stringify(mapFundingSources(currentSub[key])) ===
// 					JSON.stringify(mapFundingSources(comparedSub[key]))
// 						? (obj[key] = true)
// 						: (obj[key] = false);
// 					break;
// 				default:
// 					break;
// 			}
// 	});

// 	// define rules for a match
// 	if (obj.start_date && obj.end_date && obj.funding_sources) return true;
// 	if (obj.start_date && obj.end_date) return true;
// 	if (obj.funding_sources && (obj.start_date || obj.end_date)) return true;
// 	return false;
// };

// const consolidateObjs = async ({ currentObj, comparedObj }) => {
// 	const obj = {};
// 	const duplicatesArr = [];
// 	// const uploadsArr = [];
// 	const fundingSourcesArr = [];

// 	deduplicateMapping.forEach(({ key, valueType }) => {
// 		// console.log(key, valueType);
// 		switch (valueType) {
// 			case 'arr':
// 				if (key === 'deduplicated_subsidies') {
// 					currentObj._id // _id removed after first consolidated obj is created
// 						? duplicatesArr.push(currentObj._id, comparedObj._id)
// 						: duplicatesArr.push(comparedObj._id);
// 					obj[key] = [];
// 				}
// 				if (key === 'funding_sources') {
// 					currentObj._id // _id removed after first consolidated obj is created
// 						? fundingSourcesArr.push(
// 								...(currentObj[key] || []),
// 								...(comparedObj[key] || [])
// 						  )
// 						: fundingSourcesArr.push(...(comparedObj[key] || []));
// 					obj[key] = [];
// 				}

// 				if (key === 'uploads') {
// 					obj[key] = [
// 						...new Set(
// 							[...currentObj[key], ...comparedObj[key]].map(({ _id }) => _id)
// 						)
// 					];
// 				}

// 				break;
// 			case 'str':
// 				obj[key] = compareVals(currentObj[key], comparedObj[key]);
// 				break;
// 			case 'int':
// 				obj[key] =
// 					currentObj[key] >= comparedObj[key]
// 						? currentObj[key]
// 						: comparedObj[key];
// 				break;
// 			default:
// 				break;
// 		}
// 	});

// 	return {
// 		consolidatedObj: obj,
// 		duplicates: duplicatesArr,
// 		sources: fundingSourcesArr[0]
// 			? fundingSourcesArr.map(({ source }) => source)
// 			: []
// 	};
// };

// const deduplicateSubsidies = async propertyId => {
// 	const property = await db.Property.findById(propertyId)
// 		.populate({
// 			path: 'subsidies',
// 			populate: { path: 'funding_sources' }
// 		})
// 		.populate({
// 			path: 'subsidies',
// 			populate: { path: 'uploads' }
// 		});

// 	if (property.subsidies[1]) {
// 		const updateObj = {
// 			subsidy: {},
// 			duplicatesArr: [],
// 			fundingSourcesArr: []
// 		};

// 		for await (const subsidy of property.subsidies) {
// 			const subIndex = property.subsidies.indexOf(subsidy);

// 			if (subIndex !== property.subsidies.length - 1) {
// 				const subsidyMatch = await compareSubsidies(
// 					subsidy,
// 					property.subsidies[subIndex + 1]
// 				);
// 				// console.log(subsidyMatch);

// 				if (subsidyMatch) {
// 					const { consolidatedObj, duplicates, sources } =
// 						await consolidateObjs({
// 							currentObj: Object.keys(updateObj.subsidy)[0]
// 								? updateObj.subsidy
// 								: subsidy,
// 							comparedObj: property.subsidies[subIndex + 1]
// 						});

// 					updateObj.subsidy = consolidatedObj;
// 					updateObj.duplicatesArr = [...updateObj.duplicatesArr, ...duplicates];
// 					updateObj.fundingSourcesArr = [
// 						...new Set([...updateObj.fundingSourcesArr, ...sources])
// 					];
// 				}
// 			}
// 		}

// 		if (Object.keys(updateObj.subsidy)[0]) {
// 			console.log(updateObj);
// 			// const { consolidated, duplicates, fundingSources } = subsidyUpdateObj;
// 			// // CREATE NEW SUB
// 			// for await (const subId of duplicates) {
// 			// 	const deduplicatedSub = [...property.subsidies].filter(
// 			// 		item => item._id === subId
// 			// 	)[0];
// 			// 	const deduplicatedObj = {};
// 			// 	deduplicatedSubModelKeys.forEach(key => {
// 			// 		if (key === 'uploads') deduplicatedObj[key] = deduplicatedSub[key];
// 			// 	});
// 			// 	// const newFundingSources = [...deduplicatedSub.funding_sources].map(
// 			// 	// 	item => item.source
// 			// 	// );
// 			// 	deduplicatedObj.subsidy_id = subId;
// 			// 	deduplicatedObj.user_id = userId;
// 			// 	// CREATE DEDUP
// 			// 	// UPDATE NEW SUB DEDUPS
// 			// 	// console.log(deduplicatedObj);
// 			// }
// 			// for await (const item of fundingSources) {
// 			// 	const fundingSourceObj = {};
// 			// 	fundingSourceObj.source = item;
// 			// 	fundingSourceObj.uploads = consolidated.uploads;
// 			// 	fundingSourceObj.user_id = userId;
// 			// 	// new subsidy ID
// 			// 	// console.log(fundingSourceObj);
// 			// 	// Create New Funding Source
// 			// 	// Update Subsidy funding sources
// 			// }
// 		}
// 	}
// };

// const init = async () => {
// 	try {
// 		const allProperties = await db.Property.find({});

// 		for await (const property of allProperties.slice(0, 100)) {
// 			await deduplicateSubsidies(property._id);
// 		}
// 	} catch (err) {
// 		console.log(err);
// 	}
// };
