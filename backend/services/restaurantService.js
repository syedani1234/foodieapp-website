import { getDbPool } from '../config/database.js';
import { formatImageUrl } from '../utils/formatImageUrl.js';

const pool = getDbPool();

// Get restaurants with filters (pagination, search, cuisine)
export const getRestaurants = async (filters) => {
  const { q = '', cuisine = '', page = 1, limit = 12, sort = 'name', order = 'asc' } = filters;
  const offset = (page - 1) * limit;

  let whereConditions = ['r.is_active = TRUE'];
  const params = [];

  if (q && q.trim() !== '') {
    whereConditions.push('(r.name LIKE ? OR r.description LIKE ?)');
    const term = `%${q.trim()}%`;
    params.push(term, term);
  }
  if (cuisine && cuisine.trim() !== '') {
    whereConditions.push('rc.cuisine_id IN (SELECT id FROM cuisines WHERE LOWER(name) = LOWER(?))');
    params.push(cuisine.trim());
  }
  const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await pool.query(
    `SELECT COUNT(DISTINCT r.id) as total FROM restaurants r LEFT JOIN restaurant_cuisines rc ON r.id = rc.restaurant_id ${whereClause}`,
    params
  );
  const total = countResult[0].total || 0;
  const totalPages = Math.ceil(total / limit);

  const validSort = ['name', 'rating', 'delivery_fee', 'created_at'];
  const sortColumn = validSort.includes(sort) ? sort : 'name';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

  const [rows] = await pool.query(
    `SELECT DISTINCT
      r.id, r.name, r.image, r.address, r.description, r.rating,
      r.delivery_time, r.delivery_fee,
      GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS cuisine_names,
      GROUP_CONCAT(DISTINCT c.id) AS cuisine_ids
     FROM restaurants r
     LEFT JOIN restaurant_cuisines rc ON r.id = rc.restaurant_id
     LEFT JOIN cuisines c ON rc.cuisine_id = c.id
     ${whereClause}
     GROUP BY r.id
     ORDER BY r.${sortColumn} ${sortOrder}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const restaurants = rows.map(r => ({
    id: r.id,
    name: r.name,
    image: formatImageUrl(r.image),
    location: r.address || '',
    description: r.description || '',
    rating: parseFloat(r.rating) || 4.0,
    delivery_time: r.delivery_time || '30-45 minutes',
    delivery_fee: parseFloat(r.delivery_fee) || 2.99,
    cuisine_names: r.cuisine_names || '',
    cuisine_ids: r.cuisine_ids ? r.cuisine_ids.split(',').map(Number) : [],
  }));

  return { restaurants, total, totalPages, page, limit };
};

// Get single restaurant by ID (with menu)
export const getRestaurantById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.*, 
      GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as cuisine_names,
      GROUP_CONCAT(DISTINCT c.id) as cuisine_ids
     FROM restaurants r
     LEFT JOIN restaurant_cuisines rc ON r.id = rc.restaurant_id
     LEFT JOIN cuisines c ON rc.cuisine_id = c.id
     WHERE r.id = ? AND r.is_active = TRUE
     GROUP BY r.id`,
    [id]
  );
  if (rows.length === 0) return null;
  const restaurant = rows[0];
  const [menuRows] = await pool.query(
    `SELECT id, name, description, image, base_price, is_available
     FROM menu_items WHERE restaurant_id = ? AND is_available = TRUE ORDER BY name ASC`,
    [id]
  );
  return {
    ...restaurant,
    image: formatImageUrl(restaurant.image),
    cover_image: formatImageUrl(restaurant.cover_image),
    rating: parseFloat(restaurant.rating) || 4.0,
    cuisine_names: restaurant.cuisine_names || '',
    cuisine_ids: restaurant.cuisine_ids ? restaurant.cuisine_ids.split(',').map(Number) : [],
    menu: menuRows.map(item => ({
      ...item,
      image: formatImageUrl(item.image),
      base_price: parseFloat(item.base_price) || 0,
    })),
  };
};

// Create a new restaurant
export const createRestaurant = async (restaurantData) => {
  const {
    name, description, address, city, phone, email, website, opening_hours,
    image, cover_image, rating, delivery_time, minimum_order, delivery_fee, is_featured, cuisine_ids
  } = restaurantData;

  const [result] = await pool.query(
    `INSERT INTO restaurants 
     (name, description, address, city, phone, email, website, opening_hours, 
      image, cover_image, rating, delivery_time, minimum_order, delivery_fee, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name.trim(), description || '', address || '', city || '', phone || '', email || '', website || '',
     opening_hours || '', image || null, cover_image || null, parseFloat(rating) || 0.0,
     delivery_time || '30-45 minutes', parseFloat(minimum_order) || 0.0, parseFloat(delivery_fee) || 2.99,
     is_featured || false]
  );
  const restaurantId = result.insertId;

  if (cuisine_ids && Array.isArray(cuisine_ids) && cuisine_ids.length) {
    for (const cuisineId of cuisine_ids) {
      const [exists] = await pool.query('SELECT id FROM cuisines WHERE id = ?', [parseInt(cuisineId)]);
      if (exists.length) {
        await pool.query('INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id) VALUES (?, ?)', [restaurantId, parseInt(cuisineId)]);
      }
    }
  }
  return restaurantId;
};