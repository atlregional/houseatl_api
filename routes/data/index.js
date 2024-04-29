const router = require('express').Router();
const dataController = require('../../controllers/dataController');

router.route('/').get(dataController.findAll);
router.route('/optimized').get(dataController.find);


module.exports = router;
