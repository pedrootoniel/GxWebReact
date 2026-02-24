const { Router } = require('express');
const MarketController = require('../controllers/marketController');
const { authMiddleware } = require('../middlewares/auth');

const router = Router();

router.get('/items', MarketController.getItems);
router.get('/items/:id', MarketController.getItemDetail);
router.post('/buy', authMiddleware, MarketController.buyItem);
router.delete('/items/:id', authMiddleware, MarketController.removeItem);
router.get('/my-listings', authMiddleware, MarketController.getMyListings);
router.get('/history', authMiddleware, MarketController.getPurchaseHistory);

module.exports = router;
