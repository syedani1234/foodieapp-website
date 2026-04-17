import express from 'express';
import {
  getAllRestaurants,
  getRestaurantDetails,
  createRestaurant
} from '../controllers/restaurantController.js';

const router = express.Router();

router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantDetails);
router.post('/', createRestaurant);

export default router;