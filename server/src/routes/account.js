const { Router } = require('express');
const AccountController = require('../controllers/accountController');
const { authMiddleware } = require('../middlewares/auth');

const router = Router();

router.get('/characters', authMiddleware, AccountController.getMyCharacters);
router.post('/reset', authMiddleware, AccountController.resetCharacter);
router.post('/add-stats', authMiddleware, AccountController.addStats);
router.post('/clear-pk', authMiddleware, AccountController.clearPk);
router.post('/unstick', authMiddleware, AccountController.unstick);

module.exports = router;
