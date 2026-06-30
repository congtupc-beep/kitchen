const Joi = require('joi');
const constants = require('../utils/constants');

// Schema cho POST /api/orders
const createOrder = {
    body: Joi.object({
        table_id: Joi.string().trim().required()
            .messages({
                'string.empty': 'Tên bàn không được để trống',
                'any.required': 'Thiếu thông tin bàn (table_id)'
            }),
        guest_count: Joi.number().integer().min(1).max(50).default(1)
            .messages({
                'number.base': 'Số khách phải là số',
                'number.min': 'Số khách tối thiểu là 1'
            }),
        note: Joi.string().trim().allow('').max(500).default(''),
        items: Joi.array().items(
            Joi.object({
                dish_id: Joi.number().integer().positive().required()
                    .messages({ 'any.required': 'Thiếu mã món (dish_id)' }),
                quantity: Joi.number().integer().min(1).max(99).required()
                    .messages({ 'any.required': 'Thiếu số lượng (quantity)' }),
                note: Joi.string().trim().allow('').max(200).default('')
            })
        ).min(1).max(50).required()
            .messages({
                'array.min': 'Đơn hàng phải có ít nhất 1 món',
                'any.required': 'Thiếu danh sách món (items)'
            })
    })
};

// Schema cho GET /api/orders/:id và POST /api/orders/:id/cancel
const orderIdParam = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
            .messages({
                'number.base': 'Mã đơn hàng phải là số',
                'number.positive': 'Mã đơn hàng phải là số dương',
                'any.required': 'Thiếu mã đơn hàng (id)'
            })
    })
};

// Schema cho POST /api/orders/:id/status
const updateStatus = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
            .messages({
                'number.base': 'Mã đơn hàng phải là số',
                'number.positive': 'Mã đơn hàng phải là số dương',
                'any.required': 'Thiếu mã đơn hàng (id)'
            })
    }),
    body: Joi.object({
        status: Joi.string().valid(
            constants.ORDER_STATUS.PENDING,
            constants.ORDER_STATUS.PROCESSING,
            constants.ORDER_STATUS.DONE
        ).required()
            .messages({
                'any.only': 'Trạng thái đơn hàng không hợp lệ',
                'any.required': 'Thiếu trạng thái đơn hàng'
            })
    })
};

// Schema cho GET /api/orders/pending và /recent
const orderQuery = {
    query: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(50),
        status: Joi.string()
            .valid(...Object.values(constants.ORDER_STATUS))
            .optional()
    })
};

module.exports = {
    createOrder,
    orderIdParam,
    updateStatus,
    orderQuery
};