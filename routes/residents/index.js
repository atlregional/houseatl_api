const router = require('express').Router();
const residentsController = require('../../controllers/residentsController');

router.route('/').get(residentsController.findAll);

module.exports = router;
