const router = require('express').Router();
const propertiesController = require('../../controllers/propertiesController');

router.route('/').get(propertiesController.findAll);

module.exports = router;
