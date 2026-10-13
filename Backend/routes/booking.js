const express = require('express');
const { requireLogin } = require('../middlewares.js');
const controller = require('../controllers/booking.js');

const router = express.Router();

router.get('/mine', requireLogin, controller.mine);
router.post('/orders', requireLogin, controller.createOrder);
router.post('/verify', requireLogin, controller.verifyPayment);

module.exports = router;
