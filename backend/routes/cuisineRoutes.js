import express from 'express';
import {
  getAllCuisines,
  createCuisine,
  getCuisineBySlug
} from '../controllers/cuisineController.js';

const router = express.Router();

router.get('/', getAllCuisines);
router.post('/', createCuisine);
router.get('/:slug', getCuisineBySlug);

export default router;