const { Router } = require('express');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.get('/me', authMiddleware, AuthController.me);

module.exports = router;
