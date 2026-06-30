const kitchenService = require('../../services/kitchen.service');
const responseBuilder = require('../../utils/responseBuilder');

/**
 * KitchenController - Điều phối API KDS
 */
class KitchenController {
    /**
     * GET /api/kitchen/tasks
     */
    async getTasksByChef(req, res, next) {
        try {
            const chefId = req.query.chef_id;
            const status = req.query.status;
            let tasks;
            
            if (status) {
                tasks = await kitchenService.getTasksByChefAndStatus(chefId, status);
            } else {
                tasks = await kitchenService.getTasksByChef(chefId);
            }
            return responseBuilder.success(res, tasks, 'Tải danh sách tác vụ đầu bếp thành công.');
        } catch (error) { 
            next(error); 
        }
    }

    /**
     * GET /api/kitchen/tasks/:id
     */
    async getTaskById(req, res, next) {
        try {
            const taskId = req.params.id;
            const task = await kitchenService.getTaskById(taskId);
            return responseBuilder.success(res, task, 'Tải chi tiết tác vụ thành công.');
        } catch (error) { 
            next(error); 
        }
    }

    /**
     * POST /api/kitchen/tasks/:id/start
     */
    async startTask(req, res, next) {
        try {
            const taskId = req.params.id;
            const chefId = req.body.chef_id;
            const task = await kitchenService.startTask(taskId, chefId);
            return responseBuilder.success(res, task, 'Bắt đầu chế biến tác vụ thành công.');
        } catch (error) { 
            next(error); 
        }
    }

    /**
     * POST /api/kitchen/tasks/:id/complete
     */
    async completeTask(req, res, next) {
        try {
            const taskId = req.params.id;
            const task = await kitchenService.completeTask(taskId);
            return responseBuilder.success(res, task, 'Hoàn thành tác vụ nấu ăn thành công.');
        } catch (error) { 
            next(error); 
        }
    }
}

module.exports = new KitchenController();