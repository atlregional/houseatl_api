const fs = require('fs');
const path = require('path');

module.exports = {
    find: (req, res) => {
        let key = req?.query?.key;

        key = key?.toLowerCase().trim().replace(/ /g, '');

        const filepath = {
          citycouncil: 'geojsons/ATL_City_Council_District.json',
          highschoolzones: 'geojsons/ATL_HighSchoolZones.json',
          nsas: 'geojsons/ATL_Neighborhood_Statistical_Areas.json',
          npus: 'geojsons/ATL_NPUs.json',
          schoolzones: 'geojsons/ATL_SchoolZones.json',
          tads: 'geojsons/ATL_Tax_Allocation_District.json',
          tracts: 'geojsons/ATL_Tracts.json',
          cities: 'geojsons/Cities_Georgia.json'
        }


        if (!filepath?.[key]) {
            return res.status(400).json({ error: 'Valid key parameter is required' });
        }

        const geoJsonFilePath = path.join(__dirname, `../${filepath[key]}`);

        // Check if the file exists before requiring it
        fs.access(geoJsonFilePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error(`File not found: ${geoJsonFilePath}`, err);
                return res.status(404).json({ error: 'GeoJSON file not found' });
            }

            // If file exists, require it
            try {
                const geoJSON = require(geoJsonFilePath);
                return res.json({
                    key,
                    geoJSON
                });
            } catch (error) {
                console.error(`Error requiring file: ${geoJsonFilePath}`, error);
                return res.status(500).json({ error: 'Error loading GeoJSON file' });
            }
        });
    }
};
