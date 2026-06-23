// src/validations/dish.validation.js
const Joi = require('joi');

const dishValidationSchema = {
    body: Joi.object({
        master_menu_id: Joi.number()
            .integer()
            .required()
            .messages({
                'number.base': 'Mã thực đơn phải là số.',
                'any.required': 'Vui lòng chọn thực đơn gốc cho món ăn.'
            }),
        name: Joi.string()
            .min(2)
            .max(255)
            .required()
            .messages({
                'string.empty': 'Tên món ăn không được để trống.',
                'string.min': 'Tên món ăn phải có ít nhất 2 ký tự.',
                'any.required': 'Tên món ăn là bắt buộc.'
            }),
        category: Joi.string()
            .required()
            .messages({
                'string.empty': 'Danh mục món ăn không được để trống.',
                'any.required': 'Vui lòng chọn danh mục cho món ăn.'
            }),
        price: Joi.number()
            .min(0)
            .required()
            .messages({
                'number.base': 'Giá tiền phải là số.',
                'number.min': 'Giá tiền không được là số âm.',
                'any.required': 'Giá tiền là bắt buộc.'
            }),
        description: Joi.string()
            .max(500)
            .allow('', null)
            .messages({
                'string.max': 'Mô tả không được dài quá 500 ký tự.'
            }),
        image_url: Joi.string()
            .uri()
            .allow('', null)
            .messages({
                'string.uri': 'Đường dẫn ảnh phải là một URL hợp lệ.'
            })
    })
};

module.exports = { dishValidationSchema };