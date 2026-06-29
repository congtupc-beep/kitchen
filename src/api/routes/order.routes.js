// src/api/routes/order.routes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validate } = require('../../middlewares/validator.middleware');
const orderValidation = require('../../validations/order.validation'); // Schema Joi

router.route('/')
    .post(validate(orderValidation.createOrderSchema, 'body'), orderController.createOrder)
    .get(orderController.getAllOrders);

module.exports = router;
