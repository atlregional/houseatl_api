const router = require('express').Router();
const dataController = require('../../controllers/dataController');

router.route('/').get(dataController.findAll);
router.route('/optimized').post(dataController.find);


module.exports = router;
