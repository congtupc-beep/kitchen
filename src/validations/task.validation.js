const Joi = require('joi');
// ✅ ĐÃ SỬA: Đường dẫn chính xác lùi 1 cấp thư mục từ src/validations/ ra src/ rồi đi vào src/utils/constants.js
const constants = require('../utils/constants');

// Schema cho POST /api/kitchen/tasks/:id/start
const startTask = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
            .messages({ 'any.required': 'Thiếu mã tác vụ (id)' })
    }),
    body: Joi.object({
        chef_id: Joi.number().integer().positive().required()
            .messages({
                'number.base': 'Mã đầu bếp phải là số',
                'number.positive': 'Mã đầu bếp phải là số dương',
                'any.required': 'Thiếu mã đầu bếp (chef_id)'
            })
    })
};

// Schema cho POST /api/kitchen/tasks/:id/complete
const completeTask = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
            .messages({ 'any.required': 'Thiếu mã tác vụ (id)' })
    })
};

// Schema cho GET /api/kitchen/tasks/:id
const taskIdParam = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

// Schema cho GET /api/kitchen/tasks?chef_id=X&status=Y
const getTasksByChef = {
    query: Joi.object({
        chef_id: Joi.number().integer().positive().optional()
            .messages({ 
                'number.base': 'Mã đầu bếp phải là số', 
                'number.positive': 'Mã đầu bếp phải là số dương' 
            }),
        status: Joi.string()
            .valid(...Object.values(constants.TASK_STATUS))
            .optional()
            .messages({
                'any.only': 'Trạng thái tìm kiếm không hợp lệ trong hệ thống'
            })
    })
};

module.exports = {
    startTask,
    completeTask,
    taskIdParam,
    getTasksByChef
};