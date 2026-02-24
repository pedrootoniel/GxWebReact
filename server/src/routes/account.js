const { Router } = require('express');
const AccountController = require('../controllers/accountController');
const { authMiddleware } = require('../middlewares/auth');

const router = Router();

router.get('/characters', authMiddleware, AccountController.getMyCharacters);
router.post('/reset', authMiddleware, AccountController.resetCharacter);

module.exports = router;
