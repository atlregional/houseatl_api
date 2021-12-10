const router = require('express').Router();
const ownersController = require('../../controllers/ownersController');

router.route('/').get(ownersController.findAll);

module.exports = router;
