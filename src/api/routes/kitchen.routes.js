const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchen.controller');
const { validate } = require('../../middlewares/validator.middleware');
const taskValidation = require('../../validations/task.validation');

/**
 * 🍳 ROUTES KDS BẾP (Thành viên E)
 * ✅ Đồng bộ: Dùng validate(schema, property) middleware
 */

// GET /api/kitchen/tasks - Danh sách tasks của đầu bếp
router.get('/tasks',
    validate(taskValidation.getTasksByChef.query, 'query'), // ✅ ĐÃ SỬA: Thêm .query
    kitchenController.getTasksByChef
);

// GET /api/kitchen/tasks/:id - Chi tiết task
router.get('/tasks/:id',
    validate(taskValidation.taskIdParam.params, 'params'), // ✅ ĐÃ SỬA: Thêm .params
    kitchenController.getTaskById
);

// POST /api/kitchen/tasks/:id/start - Bắt đầu nấu
router.post('/tasks/:id/start',
    validate(taskValidation.startTask.params, 'params'),
    validate(taskValidation.startTask.body, 'body'),
    kitchenController.startTask
);

// POST /api/kitchen/tasks/:id/complete - Hoàn thành
router.post('/tasks/:id/complete',
    validate(taskValidation.completeTask.params, 'params'), // ✅ ĐÃ SỬA: Thêm .params
    kitchenController.completeTask
);

// 🚨 DÒNG QUAN TRỌNG NHẤT: PHẢI CÓ ĐỂ EXPORT RA ROUTER
module.exports = router;