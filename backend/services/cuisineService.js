import { getDbPool } from '../config/database.js';
import { formatImageUrl } from '../utils/formatImageUrl.js';
import { slugify, unslugify } from '../utils/slugify.js';

const pool = getDbPool();

// Get all active cuisines with restaurant count
export const getAllCuisines = async () => {
  const [rows] = await pool.query(`
    SELECT 
      id, name, description, image, is_featured,
      (SELECT COUNT(*) FROM restaurant_cuisines WHERE cuisine_id = cuisines.id) as restaurant_count
    FROM cuisines 
    WHERE is_active = TRUE
    ORDER BY name ASC
  `);
  return rows.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    image: formatImageUrl(c.image),
    is_featured: Boolean(c.is_featured),
    restaurant_count: c.restaurant_count || 0,
    slug: slugify(c.name)
  }));
};

// Create a new cuisine
export const createCuisine = async (cuisineData) => {
  const { name, description, image, is_featured } = cuisineData;
  if (!name || name.trim() === '') throw new Error('Cuisine name is required');
  const cuisineName = name.trim();

  const [existing] = await pool.query('SELECT id FROM cuisines WHERE LOWER(name) = LOWER(?)', [cuisineName]);
  if (existing.length) throw new Error(`Cuisine "${cuisineName}" already exists`);

  const [result] = await pool.query(
    'INSERT INTO cuisines (name, description, image, is_featured) VALUES (?, ?, ?, ?)',
    [cuisineName, description || '', image || null, is_featured || false]
  );
  return result.insertId;
};

// Get a single cuisine by slug (with its restaurants)
export const getCuisineBySlug = async (slug) => {
  const cuisineName = unslugify(slug);
  const [cuisineRows] = await pool.query(
    `SELECT id, name, description, image, is_featured FROM cuisines WHERE LOWER(name) = LOWER(?) AND is_active = TRUE`,
    [cuisineName]
  );
  if (cuisineRows.length === 0) return null;

  const cuisine = cuisineRows[0];
  const [restaurantRows] = await pool.query(
    `SELECT r.id, r.name, r.image, r.address, r.description, r.rating, r.delivery_time, r.delivery_fee, r.minimum_order
     FROM restaurants r
     INNER JOIN restaurant_cuisines rc ON r.id = rc.restaurant_id
     WHERE rc.cuisine_id = ? AND r.is_active = TRUE
     ORDER BY r.name ASC`,
    [cuisine.id]
  );
  const [countResult] = await pool.query(`SELECT COUNT(*) as count FROM restaurant_cuisines WHERE cuisine_id = ?`, [cuisine.id]);
  const restaurant_count = countResult[0].count || 0;

  const restaurants = restaurantRows.map(r => ({
    id: r.id,
    name: r.name,
    image: formatImageUrl(r.image),
    location: r.address || '',
    description: r.description || '',
    rating: parseFloat(r.rating) || 4.0,
    delivery_time: r.delivery_time || '30-45 minutes',
    delivery_fee: parseFloat(r.delivery_fee) || 2.99,
    minimum_order: parseFloat(r.minimum_order) || 0,
    cuisine_name: cuisine.name
  }));

  return {
    cuisine: {
      id: cuisine.id,
      name: cuisine.name,
      description: cuisine.description || '',
      image: formatImageUrl(cuisine.image),
      is_featured: Boolean(cuisine.is_featured),
      restaurant_count,
      slug
    },
    restaurants,
    count: restaurants.length
  };
};