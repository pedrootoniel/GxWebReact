const { Router } = require('express');
const ShopController = require('../controllers/shopController');
const { authMiddleware } = require('../middlewares/auth');

const router = Router();

router.get('/items', ShopController.getItems);
router.get('/items/:id', ShopController.getItemDetail);
router.get('/credits', authMiddleware, ShopController.getCredits);
router.post('/purchase', authMiddleware, ShopController.purchaseItem);
router.get('/cart', authMiddleware, ShopController.getCart);
router.post('/cart', authMiddleware, ShopController.addToCart);
router.delete('/cart/:id', authMiddleware, ShopController.removeFromCart);
router.get('/history', authMiddleware, ShopController.getPurchaseHistory);

module.exports = router;
