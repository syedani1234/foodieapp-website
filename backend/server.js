import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getDbPool } from './config/database.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import cuisineRoutes from './routes/cuisineRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- Database Initialization Functions (copied from original monolithic server) ----------
async function initializeDatabase() {
  const pool = getDbPool();
  try {
    console.log('🔧 Initializing database...');

    // Create cuisines table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cuisines (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        image VARCHAR(500),
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create restaurants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        address TEXT,
        city VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        website VARCHAR(200),
        opening_hours TEXT,
        image VARCHAR(500),
        cover_image VARCHAR(500),
        rating DECIMAL(3,2) DEFAULT 0.00,
        delivery_time VARCHAR(50) DEFAULT '30-45 minutes',
        minimum_order DECIMAL(10,2) DEFAULT 0.00,
        delivery_fee DECIMAL(10,2) DEFAULT 2.99,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create restaurant_cuisines junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS restaurant_cuisines (
        restaurant_id INT NOT NULL,
        cuisine_id INT NOT NULL,
        PRIMARY KEY (restaurant_id, cuisine_id),
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create deals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE,
        description TEXT,
        restaurant_id INT,
        cuisine_id INT,
        original_price DECIMAL(10,2) NOT NULL,
        discount_price DECIMAL(10,2) NOT NULL,
        discount_percent INT,
        image VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        tags TEXT,
        valid_from DATETIME,
        valid_until DATETIME,
        quantity_available INT,
        has_customization BOOLEAN DEFAULT FALSE,
        deal_type ENUM('pizza', 'burger', 'combo', 'other') DEFAULT 'other',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL,
        FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create menu items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        restaurant_id INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        base_price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT DEFAULT 1,
        restaurant_id INT,
        order_number VARCHAR(50) UNIQUE,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(50),
        delivery_address TEXT,
        contact_number VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create order items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        menu_item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Database tables created/verified');

    // Check and add missing columns
    await checkAndAddMissingColumns(pool);

    // Insert sample data if tables are empty
    await insertSampleData(pool);
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

async function checkAndAddMissingColumns(pool) {
  try {
    console.log('🔍 Checking for missing columns...');

    // Check deals table for cuisine_id column
    try {
      const [dealsColumns] = await pool.query("SHOW COLUMNS FROM deals LIKE 'cuisine_id'");
      if (dealsColumns.length === 0) {
        console.log('⚠️ Adding missing "cuisine_id" column to deals table');
        await pool.query('ALTER TABLE deals ADD COLUMN cuisine_id INT NULL AFTER restaurant_id');
        try {
          await pool.query('ALTER TABLE deals ADD FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) ON DELETE SET NULL');
        } catch (fkError) {
          console.log('⚠️ Could not add foreign key constraint, but column was added:', fkError.message);
        }
      }
    } catch (error) {
      console.log('⚠️ Could not check cuisine_id column:', error.message);
    }

    const dealColumnsToAdd = [
      { name: 'tags', type: 'TEXT', after: 'valid_until' },
      { name: 'valid_from', type: 'DATETIME', after: 'tags' },
      { name: 'valid_until', type: 'DATETIME', after: 'valid_from' },
      { name: 'quantity_available', type: 'INT', after: 'valid_until' },
      { name: 'has_customization', type: 'BOOLEAN DEFAULT FALSE', after: 'quantity_available' },
      { name: 'deal_type', type: "ENUM('pizza', 'burger', 'combo', 'other') DEFAULT 'other'", after: 'has_customization' },
    ];

    for (const col of dealColumnsToAdd) {
      try {
        const [colExists] = await pool.query(`SHOW COLUMNS FROM deals LIKE '${col.name}'`);
        if (colExists.length === 0) {
          console.log(`⚠️ Adding missing '${col.name}' column to deals table`);
          await pool.query(`ALTER TABLE deals ADD COLUMN ${col.name} ${col.type} AFTER ${col.after}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not check/add column ${col.name}:`, error.message);
      }
    }

    // Check restaurants table for address column
    try {
      const [restaurantColumns] = await pool.query("SHOW COLUMNS FROM restaurants LIKE 'address'");
      if (restaurantColumns.length === 0) {
        console.log('⚠️ Adding missing "address" column to restaurants table');
        await pool.query('ALTER TABLE restaurants ADD COLUMN address TEXT AFTER description');
      }
    } catch (error) {
      console.log('⚠️ Could not check address column:', error.message);
    }

    console.log('✅ Column check completed');
  } catch (error) {
    console.log('⚠️ Could not check/add columns:', error.message);
  }
}

async function insertSampleData(pool) {
  try {
    const [cuisineCount] = await pool.query('SELECT COUNT(*) as count FROM cuisines');
    if (cuisineCount[0].count === 0) {
      console.log('📝 Inserting sample cuisines...');
      const sampleCuisines = [
        { name: 'Italian', description: 'Authentic Italian pasta and pizza', is_featured: true },
        { name: 'Chinese', description: 'Traditional Chinese dishes', is_featured: true },
        { name: 'Indian', description: 'Spicy and flavorful Indian cuisine', is_featured: true },
        { name: 'Mexican', description: 'Tacos, burritos, and more', is_featured: false },
        { name: 'Fast Food', description: 'Burgers, fries, and quick bites', is_featured: true },
      ];
      for (const cuisine of sampleCuisines) {
        await pool.query('INSERT IGNORE INTO cuisines (name, description, is_featured) VALUES (?, ?, ?)', [cuisine.name, cuisine.description, cuisine.is_featured]);
      }
      console.log('✅ Sample cuisines inserted');
    }

    const [restaurantCount] = await pool.query('SELECT COUNT(*) as count FROM restaurants');
    if (restaurantCount[0].count === 0) {
      console.log('📝 Inserting sample restaurants...');
      const sampleRestaurants = [
        { name: "Mario's Pizzeria", description: 'Authentic Italian pizza made with love', address: '123 Main Street, New York', city: 'New York', phone: '555-0101', rating: 4.5, delivery_time: '30-40 minutes', delivery_fee: 2.99, minimum_order: 15.0, is_featured: true },
        { name: 'Dragon Palace', description: 'Traditional Chinese cuisine', address: '456 Chinatown, New York', city: 'New York', phone: '555-0102', rating: 4.3, delivery_time: '40-50 minutes', delivery_fee: 3.99, minimum_order: 20.0, is_featured: true },
        { name: 'Spice Garden', description: 'Authentic Indian curries and biryanis', address: '789 Curry Lane, New York', city: 'New York', phone: '555-0103', rating: 4.7, delivery_time: '35-45 minutes', delivery_fee: 2.99, minimum_order: 18.0, is_featured: true },
      ];
      for (const restaurant of sampleRestaurants) {
        const [result] = await pool.query(
          `INSERT INTO restaurants (name, description, address, city, phone, rating, delivery_time, delivery_fee, minimum_order, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [restaurant.name, restaurant.description, restaurant.address, restaurant.city, restaurant.phone, restaurant.rating, restaurant.delivery_time, restaurant.delivery_fee, restaurant.minimum_order, restaurant.is_featured]
        );
        const restaurantId = result.insertId;
        let cuisineId;
        if (restaurant.name.includes("Pizzeria")) {
          const [italian] = await pool.query("SELECT id FROM cuisines WHERE name = 'Italian'");
          cuisineId = italian[0]?.id;
        } else if (restaurant.name.includes('Dragon')) {
          const [chinese] = await pool.query("SELECT id FROM cuisines WHERE name = 'Chinese'");
          cuisineId = chinese[0]?.id;
        } else if (restaurant.name.includes('Spice')) {
          const [indian] = await pool.query("SELECT id FROM cuisines WHERE name = 'Indian'");
          cuisineId = indian[0]?.id;
        }
        if (cuisineId) {
          await pool.query('INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id) VALUES (?, ?)', [restaurantId, cuisineId]);
        }
      }
      console.log('✅ Sample restaurants inserted');
    }

    const [dealCount] = await pool.query('SELECT COUNT(*) as count FROM deals');
    if (dealCount[0].count === 0) {
      console.log('📝 Inserting sample deals...');
      const [italian] = await pool.query("SELECT id FROM cuisines WHERE name = 'Italian' LIMIT 1");
      const [chinese] = await pool.query("SELECT id FROM cuisines WHERE name = 'Chinese' LIMIT 1");
      const [indian] = await pool.query("SELECT id FROM cuisines WHERE name = 'Indian' LIMIT 1");
      const [restaurants] = await pool.query('SELECT id FROM restaurants LIMIT 3');
      if (restaurants.length >= 3) {
        const sampleDeals = [
          { title: '2 Large Pizzas Deal', description: 'Get 2 large pizzas with 3 toppings each', restaurant_id: restaurants[0].id, cuisine_id: italian[0]?.id, original_price: 29.99, discount_price: 19.99, deal_type: 'pizza', has_customization: true, is_featured: true },
          { title: 'Family Combo Special', description: 'Perfect for family dinner with pizza, burger, and fries', restaurant_id: restaurants[1].id, cuisine_id: chinese[0]?.id, original_price: 39.99, discount_price: 29.99, deal_type: 'combo', has_customization: true, is_featured: true },
          { title: 'Spicy Burger Festival', description: 'Double patty burger with special sauce', restaurant_id: restaurants[2].id, cuisine_id: indian[0]?.id, original_price: 24.99, discount_price: 16.99, deal_type: 'burger', has_customization: true, is_featured: true },
        ];
        for (const deal of sampleDeals) {
          const slug = deal.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').replace(/\-+/g, '-');
          const discountPercent = Math.round(((deal.original_price - deal.discount_price) / deal.original_price) * 100);
          await pool.query(
            `INSERT INTO deals (title, slug, description, restaurant_id, cuisine_id, original_price, discount_price, discount_percent, deal_type, has_customization, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [deal.title, slug, deal.description, deal.restaurant_id, deal.cuisine_id, deal.original_price, deal.discount_price, discountPercent, deal.deal_type, deal.has_customization, deal.is_featured]
          );
        }
        console.log('✅ Sample deals inserted');
      }
    }
  } catch (error) {
    console.error('⚠️ Could not insert sample data:', error.message);
  }
}

// Test database connection (used by health check)
async function testDatabaseConnection() {
  const pool = getDbPool();
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// ---------- Initialize database (idempotent, runs once) ----------
initializeDatabase().catch(console.error);

// ---------- Express App Setup ----------
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory (for backward compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes
app.use('/restaurants', restaurantRoutes);
app.use('/api/restaurants', restaurantRoutes);  // frontend compatibility
app.use('/deals', dealRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/cuisines', cuisineRoutes);
app.use('/cuisines', cuisineRoutes);
app.use('/api/upload', uploadRoutes);

// Health check (uses testDatabaseConnection)
app.get('/api/health', async (req, res) => {
  try {
    await testDatabaseConnection();
    const pool = getDbPool();
    const [cuisineResult] = await pool.query('SELECT COUNT(*) as count FROM cuisines WHERE is_active = TRUE');
    const [restaurantResult] = await pool.query('SELECT COUNT(*) as count FROM restaurants WHERE is_active = TRUE');
    const [dealResult] = await pool.query('SELECT COUNT(*) as count FROM deals WHERE is_active = TRUE');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      counts: {
        cuisines: cuisineResult[0].count,
        restaurants: restaurantResult[0].count,
        deals: dealResult[0].count,
      },
      endpoints: {
        all_cuisines: `http://localhost:${PORT}/api/cuisines`,
        all_restaurants: `http://localhost:${PORT}/api/restaurants`,
        all_deals: `http://localhost:${PORT}/deals`,
        filtered_deals: `http://localhost:${PORT}/api/deals`,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);

// Start server only if not on Vercel (serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    try {
      await testDatabaseConnection();
      console.log('✅ Database ready');
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
    }
  });
}

export default app;