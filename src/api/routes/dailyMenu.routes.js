// src/api/routes/dailyMenu.routes.js
const express = require('express');
const router = express.Router();
const dailyMenuController = require('../controllers/dailyMenu.controller');
const { validate } = require('../../middlewares/validator.middleware');
const { saveDailyMenuSchema, updateMenuItemStatusSchema } = require('../../validations/dailyMenu.validation');

/**
 * Định tuyến chi tiết cho Thực đơn ngày
 * Đường dẫn gốc tại server.js: /api/daily-menus
 */
router.route('/')
    .get(dailyMenuController.getDailyMenu)
    .post(validate(saveDailyMenuSchema, 'body'), dailyMenuController.saveDailyMenu);

router.route('/status')
    .put(validate(updateMenuItemStatusSchema, 'body'), dailyMenuController.updateMenuItemStatus);

module.exports = router;