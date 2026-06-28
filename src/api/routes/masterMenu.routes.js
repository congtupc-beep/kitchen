const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');

// Định nghĩa tuyến đường GET /api/dishes
router.get('/', menuController.getMasterMenuDishes);

module.exports = router;