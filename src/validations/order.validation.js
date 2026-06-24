// src/api/validations/order.validation.js
const Joi = require('joi');

const createOrderSchema = Joi.object({
    tableId: Joi.string().required().messages({
        'any.required': 'Mã số bàn ăn là bắt buộc không được để trống.'
    }),
    guestCount: Joi.number().integer().min(1).required().messages({
        'number.min': 'Số lượng khách ngồi tại bàn phải lớn hơn hoặc bằng 1.'
    }),
    note: Joi.string().allow('', null),
    items: Joi.array().items(
        Joi.object({
            dishId: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required().messages({
                'number.min': 'Số lượng suất ăn đặt mua tối thiểu phải từ 1 suất.'
            }),
            note: Joi.string().allow('', null)
        })
    ).min(1).required().messages({
        'array.min': 'Đơn hàng gửi đi phải có ít nhất 1 món ăn chi tiết.'
    })
});

module.exports = {
    createOrderSchema
};
