const router = require('express').Router();
const agenciesController = require('../../controllers/agenciesController');

router.route('/').get(agenciesController.findAll);

module.exports = router;
