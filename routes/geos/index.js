const router = require('express').Router();
const geoController = require('../../controllers/geoController.js');

// router.route('/').get(dataController.findAll);
router.route('/').post(geoController.find);
router.route('/').get(geoController.find);


module.exports = router;