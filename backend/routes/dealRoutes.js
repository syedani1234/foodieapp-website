import express from 'express';
import * as dealController from '../controllers/dealController.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.get('/', dealController.getDealsSimple);
router.get('/filtered', dealController.getFilteredDeals);
router.get('/:id', dealController.getDealById);
router.get('/:id/customization', dealController.getDealCustomization);
router.post('/', upload.single('image'), dealController.createDeal);
router.patch('/:id', upload.single('image'), dealController.updateDeal);
router.delete('/:id', dealController.deleteDeal);

export default router;
