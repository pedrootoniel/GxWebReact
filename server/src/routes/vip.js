const { Router } = require('express');
const VipController = require('../controllers/vipController');
const { authMiddleware } = require('../middlewares/auth');

const router = Router();

router.get('/packages', VipController.getPackages);
router.get('/my-vip', authMiddleware, VipController.getMyVip);
router.post('/purchase', authMiddleware, VipController.purchaseVip);

module.exports = router;
