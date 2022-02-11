const { getTime } = require('./utils');
const { handleDateLIHTC } = require('../utils');
const { getAgenciesForHierarchyCompare } = require('../db/helpers');
const configArrays = require('../config/configArrays');

const Consolidator = async ({
	type,
	existingSubsidy,
	newSubsidy,
	uploadId,
	userId,
	agencyId
}) => {
	switch (type) {
		case 'update_null':
			[...configArrays.consolidateKeys, ...configArrays.dateKeys].forEach(
				key => {
					if (
						(!existingSubsidy[key] && newSubsidy[key]) ||
						(configArrays.dateKeys.includes(key) &&
							existingSubsidy[key] &&
							newSubsidy[key] &&
							getTime(newSubsidy[key]) > getTime(existingSubsidy[key]))
					)
						existingSubsidy[key] = newSubsidy[key];
				}
			);
			break;
		case 'update_all':
			[...configArrays.consolidateKeys, ...configArrays.dateKeys].forEach(
				key => (existingSubsidy[key] = newSubsidy[key])
			);
			break;
		case 'update_hierarchy':
			const { existingAgency, newAgency } =
				await getAgenciesForHierarchyCompare(
					existingSubsidy.uploads[existingSubsidy.uploads.length - 1],
					agencyId
				);

			configArrays.consolidateKeys.forEach(key => {
				if (
					(!existingSubsidy[key] && newSubsidy[key]) ||
					(newSubsidy[key] &&
						configArrays.agencyHierarchy.indexOf(newAgency) <
							configArrays.agencyHierarchy.indexOf(existingAgency))
				)
					existingSubsidy[key] = newSubsidy[key];
			});

			const isLIHTC = existingSubsidy.funding_sources
				.map(({ source }) => source)
				.includes('LIHTC');

			if (
				isLIHTC &&
				newSubsidy.start_date &&
				existingSubsidy.start_date &&
				getTime(newSubsidy.start_date) > getTime(existingSubsidy.start_date)
			) {
				existingSubsidy.start_date = newSubsidy.start_date;

				existingSubsidy = handleDateLIHTC(
					existingSubsidy,
					newSubsidy.start_date
				);
			} else if (isLIHTC && existingSubsidy.start_date) {
				existingSubsidy = handleDateLIHTC(
					existingSubsidy,
					existingSubsidy.start_date
				);
			} else {
				configArrays.dateKeys.forEach(key => {
					if (
						existingSubsidy[key] &&
						newSubsidy[key] &&
						getTime(newSubsidy[key]) > getTime(existingSubsidy[key])
					) {
						existingSubsidy[key] = newSubsidy[key];
					}
				});
			}
			break;
		default:
			break;
	}

	existingSubsidy.uploads = existingSubsidy.uploads.map(({ _id }) => _id);
	existingSubsidy.funding_sources = existingSubsidy.funding_sources.map(
		({ _id }) => _id
	);
	existingSubsidy.user_id = userId;
	existingSubsidy.updated_on = new Date();

	if (!existingSubsidy.uploads.includes(uploadId))
		existingSubsidy.uploads.push(uploadId);

	return existingSubsidy;
};

module.exports = Consolidator;
