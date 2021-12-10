const router = require('express').Router();
const uploadsController = require('../../controllers/uploadsController');

router.route('/').get(uploadsController.findAll);

module.exports = router;
