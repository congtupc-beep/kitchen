// src/api/routes/order.routes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const validator = require('../../middlewares/validator.middleware');
const orderValidation = require('../validations/order.validation'); // Schema Joi

router.route('/')
    .post(validator(orderValidation.createOrderSchema), orderController.createOrder)
    .get(orderController.getAllOrders);

module.exports = router;
