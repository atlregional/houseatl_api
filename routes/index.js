// User, Properties, Subsidies, resident, agencies, uploads, owners
const router = require('express').Router();

const userRoutes = require('./users'),
	propertyRoutes = require('./properties');

router.use('/api/users', userRoutes);
router.use('/api/properties', propertyRoutes);

module.exports = router;
