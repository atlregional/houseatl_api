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

router.use((err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	let msg = err.message;
	// If we are in production, override the message we
	// expose to the client (for security reasons)
	if (process.env.NODE_ENV === 'production') {
		msg = 'Internal server error';
	}
	if (err.statusCode === 500) {
		console.error(err);
	}
	res.status(err.statusCode).json({
		error: msg
	});
});

module.exports = router;
