import * as restaurantService from '../services/restaurantService.js';

export const getAllRestaurants = async (req, res) => {
  try {
    const { q, cuisine, _page, _limit, sort, order } = req.query;
    const result = await restaurantService.getRestaurants({
      q, cuisine, page: _page, limit: _limit, sort, order
    });
    res.setHeader('X-Total-Count', result.total);
    res.setHeader('X-Total-Pages', result.totalPages);
    res.setHeader('X-Current-Page', result.page);
    res.setHeader('X-Per-Page', result.limit);
    res.json(result.restaurants);
  } catch (error) {
    console.error('Get all restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants', message: error.message });
  }
};

export const getRestaurantDetails = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid restaurant ID' });
    }
    const restaurant = await restaurantService.getRestaurantById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant details error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant details', message: error.message });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const restaurantId = await restaurantService.createRestaurant(req.body);
    res.status(201).json({ success: true, data: { id: restaurantId } });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Failed to create restaurant', message: error.message });
  }
};