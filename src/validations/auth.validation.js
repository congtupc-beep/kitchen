// src/validations/auth.validation.js
const Joi = require('joi');

const loginValidationSchema = {
    body: Joi.object({
        name: Joi.string()
            .min(3)
            .max(100)
            .required()
            .messages({
                'string.base': 'Họ tên đăng nhập phải là chuỗi ký tự.',
                'string.empty': 'Họ tên đăng nhập không được để trống.',
                'string.min': 'Họ tên đăng nhập phải chứa ít nhất 3 ký tự.',
                'string.max': 'Họ tên đăng nhập không được dài quá 100 ký tự.',
                'any.required': 'Vui lòng cung cấp họ tên đăng nhập hệ thống bếp.'
            }),
        password: Joi.string()
            .min(6)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Mật khẩu không được để trống.',
                'string.min': 'Mật khẩu phải chứa ít nhất 6 ký tự.',
                'any.required': 'Trường mật khẩu là bắt buộc.'
            })
    })
};

module.exports = { loginValidationSchema };