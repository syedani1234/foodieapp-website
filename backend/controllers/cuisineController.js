import * as cuisineService from '../services/cuisineService.js';

export const getAllCuisines = async (req, res) => {
  try {
    const cuisines = await cuisineService.getAllCuisines();
    res.json(cuisines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCuisine = async (req, res) => {
  try {
    const id = await cuisineService.createCuisine(req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    if (error.message.includes('already exists')) return res.status(409).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const getCuisineBySlug = async (req, res) => {
  try {
    const result = await cuisineService.getCuisineBySlug(req.params.slug);
    if (!result) return res.status(404).json({ error: 'Cuisine not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};