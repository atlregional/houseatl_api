// User, Properties, Subsidies, resident, agencies, uploads, owners
const router = require('express').Router();

const propertyRoutes = require('./properties'),
	subsidyRoutes = require('./subsidies'),
	residentRoutes = require('./residents'),
	agencyRoutes = require('./agencies'),
	uploadRoutes = require('./uploads'),
	ownerRoutes = require('./owners');

router.use('/rest/properties', propertyRoutes);
router.use('/rest/subsidies', subsidyRoutes);
router.use('/rest/residents', residentRoutes);
router.use('/rest/agencies', agencyRoutes);
router.use('/rest/uploads', uploadRoutes);
router.use('/rest/owners', ownerRoutes);

module.exports = router;
