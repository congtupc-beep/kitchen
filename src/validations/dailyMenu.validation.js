// src/validations/dailyMenu.validation.js
const Joi = require('joi');

/**
 * Schema xác thực dữ liệu khi tạo/cập nhật thực đơn ngày
 */
const saveDailyMenuSchema = Joi.object({
    date: Joi.string()
        .isoDate()
        .required()
        .messages({
            'string.base': 'Ngày áp dụng phải là chuỗi.',
            'string.empty': 'Ngày áp dụng không được để trống.',
            'string.isoDate': 'Ngày áp dụng không đúng định dạng ISO YYYY-MM-DD.',
            'any.required': 'Ngày áp dụng là bắt buộc.'
        }),
    dishIds: Joi.array()
        .items(Joi.number().integer().min(1))
        .required()
        .messages({
            'array.base': 'Danh sách món ăn phải là mảng.',
            'any.required': 'Danh sách món ăn chọn cho thực đơn là bắt buộc.'
        }),
    createdBy: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Mã người tạo phải là số.',
            'any.required': 'Mã người tạo thực đơn là bắt buộc.'
        })
});

/**
 * Schema xác thực dữ liệu khi cập nhật trạng thái món ăn trong thực đơn ngày
 */
const updateMenuItemStatusSchema = Joi.object({
    date: Joi.string()
        .isoDate()
        .required()
        .messages({
            'string.empty': 'Ngày thực đơn không được để trống.',
            'string.isoDate': 'Ngày thực đơn không đúng định dạng ISO YYYY-MM-DD.',
            'any.required': 'Ngày thực đơn là bắt buộc.'
        }),
    dishId: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Mã món ăn phải là số.',
            'any.required': 'Mã món ăn là bắt buộc.'
        }),
    status: Joi.string()
        .valid('AVAILABLE', 'SOLD_OUT', 'UNAVAILABLE')
        .required()
        .messages({
            'any.only': 'Trạng thái món ăn không hợp lệ. Chỉ chấp nhận AVAILABLE, SOLD_OUT hoặc UNAVAILABLE.',
            'any.required': 'Trạng thái món ăn là bắt buộc.'
        })
});

module.exports = {
    saveDailyMenuSchema: { body: saveDailyMenuSchema },
    updateMenuItemStatusSchema: { body: updateMenuItemStatusSchema }
};
