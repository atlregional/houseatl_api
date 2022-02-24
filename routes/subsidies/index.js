const router = require('express').Router();
const subsidiesController = require('../../controllers/subsidiesController');

router.route('/').get(subsidiesController.findAll);

module.exports = router;
