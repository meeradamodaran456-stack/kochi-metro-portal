const express = require('express');
const router  = express.Router();
const { login, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/login',           login);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
