import { getDbPool } from '../config/database.js';
import { formatImageUrl } from '../utils/formatImageUrl.js';
import { slugify } from '../utils/slugify.js';
import { formatDateForMySQL } from '../utils/validate.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const pool = getDbPool();

// Get simple list of active deals
export const getDealsSimple = async () => {
  let query;
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM deals LIKE 'cuisine_id'");
    if (columns.length) {
      query = `
        SELECT d.*, r.name AS restaurant_name, r.image AS restaurant_image, c.name as cuisine_name
        FROM deals d
        LEFT JOIN restaurants r ON d.restaurant_id = r.id AND r.is_active = TRUE
        LEFT JOIN cuisines c ON d.cuisine_id = c.id
        WHERE d.is_active = TRUE AND (d.valid_until >= CURDATE() OR d.valid_until IS NULL)
        ORDER BY d.created_at DESC`;
    } else {
      query = `
        SELECT d.*, r.name AS restaurant_name, r.image AS restaurant_image
        FROM deals d
        LEFT JOIN restaurants r ON d.restaurant_id = r.id AND r.is_active = TRUE
        WHERE d.is_active = TRUE AND (d.valid_until >= CURDATE() OR d.valid_until IS NULL)
        ORDER BY d.created_at DESC`;
    }
  } catch {
    query = `
      SELECT d.*, r.name AS restaurant_name, r.image AS restaurant_image
      FROM deals d
      LEFT JOIN restaurants r ON d.restaurant_id = r.id AND r.is_active = TRUE
      WHERE d.is_active = TRUE AND (d.valid_until >= CURDATE() OR d.valid_until IS NULL)
      ORDER BY d.created_at DESC`;
  }
  const [deals] = await pool.query(query);
  return deals.map(formatDeal);
};

// Get filtered deals with pagination
export const getFilteredDeals = async (filters) => {
  const { featured, restaurant_id, cuisine_id, limit = 20, page = 1, deal_type, has_customization } = filters;
  const whereConditions = ['d.is_active = TRUE'];
  const params = [];

  if (featured === 'true') whereConditions.push('d.is_featured = TRUE');
  if (restaurant_id) { whereConditions.push('d.restaurant_id = ?'); params.push(parseInt(restaurant_id)); }

  let cuisineIdExists = false;
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM deals LIKE 'cuisine_id'");
    cuisineIdExists = cols.length > 0;
  } catch { /* ignore */ }
  if (cuisineIdExists && cuisine_id) { whereConditions.push('d.cuisine_id = ?'); params.push(parseInt(cuisine_id)); }

  let dealTypeExists = false;
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM deals LIKE 'deal_type'");
    dealTypeExists = cols.length > 0;
  } catch { /* ignore */ }
  if (dealTypeExists && deal_type) { whereConditions.push('d.deal_type = ?'); params.push(deal_type); }

  let hasCustomizationExists = false;
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM deals LIKE 'has_customization'");
    hasCustomizationExists = cols.length > 0;
  } catch { /* ignore */ }
  if (hasCustomizationExists && has_customization === 'true') whereConditions.push('d.has_customization = TRUE');

  whereConditions.push('(d.valid_until >= CURDATE() OR d.valid_until IS NULL)');
  const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM deals d ${whereClause}`, params);
  const total = countResult[0].total || 0;

  let query;
  if (cuisineIdExists) {
    query = `
      SELECT d.*, r.name as restaurant_name, r.image as restaurant_image, c.name as cuisine_name
      FROM deals d
      LEFT JOIN restaurants r ON d.restaurant_id = r.id
      LEFT JOIN cuisines c ON d.cuisine_id = c.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?`;
  } else {
    query = `
      SELECT d.*, r.name as restaurant_name, r.image as restaurant_image
      FROM deals d
      LEFT JOIN restaurants r ON d.restaurant_id = r.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?`;
  }
  const [deals] = await pool.query(query, [...params, take, skip]);
  const formatted = deals.map(formatDeal);
  return { deals: formatted, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) };
};

// Get single deal by ID
export const getDealById = async (id) => {
  let query;
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM deals LIKE 'cuisine_id'");
    if (cols.length) {
      query = `
        SELECT d.*, r.name AS restaurant_name, r.image AS restaurant_image, c.name as cuisine_name
        FROM deals d
        LEFT JOIN restaurants r ON d.restaurant_id = r.id
        LEFT JOIN cuisines c ON d.cuisine_id = c.id
        WHERE d.id = ? AND d.is_active = TRUE`;
    } else {
      query = `
        SELECT d.*, r.name AS restaurant_name, r.image AS restaurant_image
        FROM deals d
        LEFT JOIN restaurants r ON d.restaurant_id = r.id
        WHERE d.id = ? AND d.is_active = TRUE`;
    }
  } catch {
    query = `
      SELECT d.*, r.name AS restaurant_name, r.image AS restaurant_image
      FROM deals d
      LEFT JOIN restaurants r ON d.restaurant_id = r.id
      WHERE d.id = ? AND d.is_active = TRUE`;
  }
  const [deals] = await pool.query(query, [id]);
  if (deals.length === 0) return null;
  return formatDeal(deals[0]);
};

// Get deal customization data (static for demo)
export const getDealCustomization = async (dealId) => {
  const [deals] = await pool.query(
    `SELECT d.*, r.name AS restaurant_name, r.image AS restaurant_image
     FROM deals d LEFT JOIN restaurants r ON d.restaurant_id = r.id
     WHERE d.id = ? AND d.is_active = TRUE`,
    [dealId]
  );
  if (deals.length === 0) return null;
  const deal = deals[0];
  const title = (deal.title || '').toLowerCase();
  const description = (deal.description || '').toLowerCase();
  const tags = (deal.tags || '').toLowerCase();

  const hasPizza = /pizza/.test(title) || /pizza/.test(description) || /pizza/.test(tags);
  const hasBurger = /burger/.test(title) || /burger/.test(description) || /burger/.test(tags);
  const hasCombo = /combo/.test(title) || /combo/.test(description) || /combo/.test(tags);

  let dealType = deal.deal_type || 'other';
  if (dealType === 'other') {
    if (hasPizza && hasBurger) dealType = 'combo';
    else if (hasPizza) dealType = 'pizza';
    else if (hasBurger) dealType = 'burger';
    else if (hasCombo) dealType = 'combo';
  }

  let items = [];
  if (dealType === 'pizza' || (hasPizza && !hasBurger)) {
    items = [{
      id: 1, name: deal.title.includes('Pizza') ? deal.title : 'Cheese Pizza',
      description: deal.description || 'Delicious cheese pizza',
      base_price: deal.discount_price || 399,
      crusts: [
        { id: 1, name: 'Regular', price: 0 },
        { id: 2, name: 'Thin Crust', price: 20 },
        { id: 3, name: 'Cheesy Crust', price: 30 }
      ],
      toppings: [
        { id: 1, name: 'Extra Cheese', price: 20 },
        { id: 2, name: 'Mushrooms', price: 15 },
        { id: 3, name: 'Olives', price: 10 },
        { id: 4, name: 'Pepperoni', price: 25 }
      ]
    }];
  } else if (dealType === 'burger' || (hasBurger && !hasPizza)) {
    items = [{
      id: 2, name: deal.title.includes('Burger') ? deal.title : 'Beef Burger',
      description: deal.description || 'Juicy beef burger',
      base_price: deal.discount_price || 249,
      sizes: [
        { id: 1, name: 'Regular', price: 0 },
        { id: 2, name: 'Large', price: 50 },
        { id: 3, name: 'Jumbo', price: 80 }
      ],
      addons: [
        { id: 1, name: 'Extra Patty', price: 50 },
        { id: 2, name: 'Bacon', price: 30 },
        { id: 3, name: 'Cheese Slice', price: 20 },
        { id: 4, name: 'Avocado', price: 25 },
        { id: 5, name: 'Fried Egg', price: 15 }
      ]
    }];
  } else if (dealType === 'combo' || (hasPizza && hasBurger)) {
    const totalPrice = deal.discount_price || 599;
    const pizzaPrice = Math.floor(totalPrice * 0.6);
    const burgerPrice = Math.floor(totalPrice * 0.4);
    items = [
      {
        id: 1, name: 'Cheese Pizza',
        description: 'Delicious cheese pizza',
        base_price: pizzaPrice,
        crusts: [{ id: 1, name: 'Regular', price: 0 }, { id: 2, name: 'Thin Crust', price: 20 }, { id: 3, name: 'Cheesy Crust', price: 30 }],
        toppings: [{ id: 1, name: 'Extra Cheese', price: 20 }, { id: 2, name: 'Mushrooms', price: 15 }, { id: 3, name: 'Olives', price: 10 }, { id: 4, name: 'Pepperoni', price: 25 }]
      },
      {
        id: 2, name: 'Beef Burger',
        description: 'Juicy beef burger',
        base_price: burgerPrice,
        sizes: [{ id: 1, name: 'Regular', price: 0 }, { id: 2, name: 'Large', price: 50 }, { id: 3, name: 'Jumbo', price: 80 }],
        addons: [{ id: 1, name: 'Extra Patty', price: 50 }, { id: 2, name: 'Bacon', price: 30 }, { id: 3, name: 'Cheese Slice', price: 20 }, { id: 4, name: 'Avocado', price: 25 }, { id: 5, name: 'Fried Egg', price: 15 }]
      }
    ];
  } else {
    items = [{ id: 3, name: deal.title, description: deal.description || 'Special offer', base_price: deal.discount_price || 0 }];
  }

  return {
    deal: {
      id: deal.id, title: deal.title, description: deal.description || '',
      discount_price: parseFloat(deal.discount_price) || 0,
      original_price: parseFloat(deal.original_price) || 0,
      restaurant_name: deal.restaurant_name || 'Restaurant',
      restaurant_image: formatImageUrl(deal.restaurant_image),
      discount_percent: deal.discount_percent || 0
    },
    items,
    deal_type: dealType
  };
};

// Create a new deal (with optional image upload)
export const createDeal = async (dealData, imageBuffer) => {
  const {
    title, description, original_price, discount_price, discount_percent,
    restaurant_id, cuisine_id, valid_from, valid_until, tags,
    deal_type, is_featured, is_active, has_customization, quantity_available
  } = dealData;

  let imageUrl = null;
  if (imageBuffer) {
    const uploadResult = await uploadToCloudinary(imageBuffer, 'foodieapp');
    imageUrl = uploadResult.secure_url;
  }

  const slug = slugify(title);
  const validFromMySQL = valid_from ? formatDateForMySQL(valid_from) : null;
  const validUntilMySQL = valid_until ? formatDateForMySQL(valid_until) : null;
  const originalPriceNum = parseFloat(original_price);
  const discountPriceNum = parseFloat(discount_price) || 0;
  let finalDiscountPercent = discount_percent || 0;
  if (discount_price && !discount_percent && originalPriceNum > 0) {
    finalDiscountPercent = Math.round(((originalPriceNum - discountPriceNum) / originalPriceNum) * 100);
  }

  let detectedDealType = deal_type || 'other';
  const titleLower = (title || '').toLowerCase();
  if (detectedDealType === 'other') {
    if (titleLower.includes('pizza') && titleLower.includes('burger')) detectedDealType = 'combo';
    else if (titleLower.includes('pizza')) detectedDealType = 'pizza';
    else if (titleLower.includes('burger')) detectedDealType = 'burger';
    else if (titleLower.includes('combo')) detectedDealType = 'combo';
  }

  let detectedHasCustomization = has_customization || false;
  if (!detectedHasCustomization) {
    const desc = (description || '').toLowerCase();
    const tagsLower = (tags || '').toLowerCase();
    const hasPizza = titleLower.includes('pizza') || desc.includes('pizza') || tagsLower.includes('pizza');
    const hasBurger = titleLower.includes('burger') || desc.includes('burger') || tagsLower.includes('burger');
    const hasCombo = titleLower.includes('combo') || desc.includes('combo') || tagsLower.includes('combo');
    detectedHasCustomization = hasPizza || hasBurger || hasCombo;
  }

  let cuisineIdExists = false;
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM deals LIKE 'cuisine_id'");
    cuisineIdExists = cols.length > 0;
  } catch { /* ignore */ }
  let finalCuisineId = null;
  if (cuisineIdExists && cuisine_id) {
    const [cuisineRows] = await pool.query('SELECT id FROM cuisines WHERE id = ?', [parseInt(cuisine_id)]);
    if (cuisineRows.length) finalCuisineId = parseInt(cuisine_id);
  }

  let insertQuery, insertValues;
  if (cuisineIdExists) {
    insertQuery = `
      INSERT INTO deals
        (title, slug, description, restaurant_id, cuisine_id, image, discount_price,
         original_price, discount_percent, valid_from, valid_until, tags,
         has_customization, deal_type, is_featured, quantity_available, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    insertValues = [
      title.trim(), slug, description || '', parseInt(restaurant_id), finalCuisineId, imageUrl,
      discountPriceNum, originalPriceNum, finalDiscountPercent, validFromMySQL, validUntilMySQL,
      tags || '', detectedHasCustomization, detectedDealType,
      is_featured === 'true' || is_featured === true, quantity_available || null,
      is_active === 'true' || is_active === true
    ];
  } else {
    insertQuery = `
      INSERT INTO deals
        (title, slug, description, restaurant_id, image, discount_price,
         original_price, discount_percent, valid_from, valid_until, tags,
         has_customization, deal_type, is_featured, quantity_available, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    insertValues = [
      title.trim(), slug, description || '', parseInt(restaurant_id), imageUrl,
      discountPriceNum, originalPriceNum, finalDiscountPercent, validFromMySQL, validUntilMySQL,
      tags || '', detectedHasCustomization, detectedDealType,
      is_featured === 'true' || is_featured === true, quantity_available || null,
      is_active === 'true' || is_active === true
    ];
  }
  const [result] = await pool.query(insertQuery, insertValues);
  return result.insertId;
};

// Update an existing deal
export const updateDeal = async (id, updateData, imageBuffer) => {
  const {
    title, description, restaurant_id, cuisine_id, discount_price, original_price,
    discount_percent, valid_from, valid_until, tags, has_customization, deal_type,
    is_active, is_featured, quantity_available
  } = updateData;

  const updates = [];
  const values = [];

  if (title !== undefined) {
    updates.push('title = ?'); values.push(title.trim());
    const slug = slugify(title);
    updates.push('slug = ?'); values.push(slug);
  }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (restaurant_id !== undefined) {
    const [restaurantRows] = await pool.query('SELECT id FROM restaurants WHERE id = ?', [parseInt(restaurant_id)]);
    if (restaurantRows.length === 0) throw new Error('Invalid restaurant');
    updates.push('restaurant_id = ?'); values.push(parseInt(restaurant_id));
  }

  let cuisineIdExists = false;
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM deals LIKE 'cuisine_id'");
    cuisineIdExists = cols.length > 0;
  } catch { /* ignore */ }
  if (cuisineIdExists && cuisine_id !== undefined) {
    updates.push('cuisine_id = ?'); values.push(cuisine_id ? parseInt(cuisine_id) : null);
  }

  if (imageBuffer) {
    const uploadResult = await uploadToCloudinary(imageBuffer, 'foodieapp');
    updates.push('image = ?'); values.push(uploadResult.secure_url);
  }
  if (discount_price !== undefined) { updates.push('discount_price = ?'); values.push(parseFloat(discount_price) || 0); }
  if (original_price !== undefined) { updates.push('original_price = ?'); values.push(parseFloat(original_price) || 0); }
  if (discount_percent !== undefined) { updates.push('discount_percent = ?'); values.push(parseInt(discount_percent) || 0); }
  if (valid_from !== undefined) { updates.push('valid_from = ?'); values.push(valid_from ? formatDateForMySQL(valid_from) : null); }
  if (valid_until !== undefined) { updates.push('valid_until = ?'); values.push(valid_until ? formatDateForMySQL(valid_until) : null); }
  if (tags !== undefined) { updates.push('tags = ?'); values.push(tags); }
  if (has_customization !== undefined) { updates.push('has_customization = ?'); values.push(has_customization === 'true' || has_customization === true); }
  if (deal_type !== undefined) { updates.push('deal_type = ?'); values.push(deal_type); }
  if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active === 'true' || is_active === true); }
  if (is_featured !== undefined) { updates.push('is_featured = ?'); values.push(is_featured === 'true' || is_featured === true); }
  if (quantity_available !== undefined) { updates.push('quantity_available = ?'); values.push(quantity_available); }

  if (updates.length === 0) throw new Error('No updates provided');
  values.push(id);
  await pool.query(`UPDATE deals SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
  return true;
};

// Delete a deal (soft delete)
export const deleteDeal = async (id) => {
  await pool.query('UPDATE deals SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
};

// Helper to format a deal object
function formatDeal(deal) {
  let discountPercent = deal.discount_percent;
  if (!discountPercent && deal.original_price && deal.discount_price) {
    discountPercent = Math.round(((deal.original_price - deal.discount_price) / deal.original_price) * 100);
  }

  let detectedDealType = deal.deal_type || 'other';
  if (detectedDealType === 'other') {
    const title = (deal.title || '').toLowerCase();
    if (title.includes('pizza') && title.includes('burger')) detectedDealType = 'combo';
    else if (title.includes('pizza')) detectedDealType = 'pizza';
    else if (title.includes('burger')) detectedDealType = 'burger';
    else if (title.includes('combo')) detectedDealType = 'combo';
  }

  let hasCustomization = deal.has_customization || false;
  if (!hasCustomization) {
    const title = (deal.title || '').toLowerCase();
    const description = (deal.description || '').toLowerCase();
    const tags = (deal.tags || '').toLowerCase();
    const hasPizza = title.includes('pizza') || description.includes('pizza') || tags.includes('pizza');
    const hasBurger = title.includes('burger') || description.includes('burger') || tags.includes('burger');
    const hasCombo = title.includes('combo') || description.includes('combo') || tags.includes('combo');
    hasCustomization = hasPizza || hasBurger || hasCombo;
  }

  return {
    id: deal.id,
    title: deal.title,
    slug: deal.slug,
    description: deal.description || '',
    restaurant_id: deal.restaurant_id || null,
    restaurant_name: deal.restaurant_name || '',
    restaurant_image: formatImageUrl(deal.restaurant_image),
    cuisine_id: deal.cuisine_id || null,
    cuisine_name: deal.cuisine_name || null,
    original_price: parseFloat(deal.original_price) || 0,
    discount_price: parseFloat(deal.discount_price) || 0,
    discount_percent: discountPercent || 0,
    image: formatImageUrl(deal.image),
    is_active: Boolean(deal.is_active),
    is_featured: Boolean(deal.is_featured),
    tags: deal.tags || '',
    valid_from: deal.valid_from,
    valid_until: deal.valid_until,
    quantity_available: deal.quantity_available,
    has_customization: hasCustomization,
    deal_type: detectedDealType,
    created_at: deal.created_at,
    updated_at: deal.updated_at
  };
}