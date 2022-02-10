module.exports = {
	CityCouncilDistricts: {
		geoJSON: require('../../geojsons/ATL_City_Council_Districtswgs.json'),
		propertiesKey: 'NAME',
		modelKey: 'city_council_district'
	},
	HighSchoolZones: {
		geoJSON: require('../../geojsons/ATL_HighSchoolZones.json'),
		propertiesKey: 'PropHS',
		modelKey: 'high_school_zone'
	},
	NeighborhoodStatisticalAreas: {
		geoJSON: require('../../geojsons/ATL_Neighborhood_Statistical_Areas.json'),
		propertiesKey: 'STATISTICA',
		modelKey: 'neighborhood_statistical_area'
	},
	NPUs: {
		geoJSON: require('../../geojsons/ATL_NPUs.json'),
		propertiesKey: 'NAME',
		modelKey: 'neighborhood_planning_unit'
	},
	SchoolZones: {
		geoJSON: require('../../geojsons/ATL_SchoolZones.json'),
		propertiesKey: 'PropES',
		modelKey: 'school_zone'
	},
	TaxAllocationDistrict: {
		geoJSON: require('../../geojsons/ATL_Tax_Allocation_District.json'),
		propertiesKey: 'ZONEDESC',
		modelKey: 'tax_allocation_district'
	},
	CensusTracts: {
		geoJSON: require('../../geojsons/ATL_Tracts.json'),
		propertiesKey: 'NAME10',
		modelKey: 'census_tract'
	}
};
