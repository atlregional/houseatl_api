const router = require('express').Router();
const propertyGeosController = require('../../controllers/propertyGeosController');

router.route('/').get(propertyGeosController.findAll);

module.exports = router;
