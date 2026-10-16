/**
 * Database Layer for Com Tam Ong Map (comtam.net)
 * PostgreSQL Connection, Migrations and Seeding
 */
const { Pool } = require('pg');
const restaurantMenu = require('./assets/demo-menu-data.js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://haile@localhost:5432/comtam_db'
});

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('Connecting to PostgreSQL database: comtam_db...');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS dishes (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        price INT NOT NULL,
        time VARCHAR(64),
        image VARCHAR(255),
        description TEXT,
        tags JSONB,
        ingredients JSONB,
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(64) UNIQUE NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(32) DEFAULT 'customer',
        membership_number VARCHAR(64),
        tier VARCHAR(32) DEFAULT 'Silver',
        points INT DEFAULT 0,
        total_spent BIGINT DEFAULT 0,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        order_code VARCHAR(64) UNIQUE NOT NULL,
        order_type VARCHAR(32) DEFAULT 'delivery',
        table_number VARCHAR(32),
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(64),
        address TEXT,
        notes TEXT,
        items JSONB NOT NULL,
        subtotal INT NOT NULL,
        shipping_fee INT DEFAULT 0,
        points_used INT DEFAULT 0,
        discount_amount INT DEFAULT 0,
        total_amount INT NOT NULL,
        payment_method VARCHAR(32) DEFAULT 'vietqr',
        payment_status VARCHAR(32) DEFAULT 'pending',
        order_status VARCHAR(32) DEFAULT 'pending_payment',
        points_earned INT DEFAULT 0,
        points_awarded BOOLEAN DEFAULT FALSE,
        timeline JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS restaurant_tables (
        table_number VARCHAR(32) PRIMARY KEY,
        capacity INT DEFAULT 4,
        status VARCHAR(32) DEFAULT 'empty',
        active_order_id VARCHAR(64),
        active_order_code VARCHAR(64),
        waiter_call TEXT,
        waiter_call_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS waiter_calls (
        id SERIAL PRIMARY KEY,
        table_number VARCHAR(32) NOT NULL,
        request_type VARCHAR(255) NOT NULL,
        status VARCHAR(32) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure new columns exist for existing databases
      ALTER TABLE dishes ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';
    `);

    // Check if dishes need seeding or components sync
    const dishCount = await client.query('SELECT COUNT(*) FROM dishes');
    if (parseInt(dishCount.rows[0].count, 10) === 0) {
      console.log('Seeding initial 12 Cơm Tấm dishes into PostgreSQL...');
      for (const d of restaurantMenu.dishes) {
        await client.query(`
          INSERT INTO dishes (id, name, category, price, time, image, description, tags, ingredients, components, available)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          d.id, d.name, d.category, d.price, d.time, d.image, d.description,
          JSON.stringify(d.tags || []), JSON.stringify(d.ingredients || []),
          JSON.stringify(d.components || []), d.available !== false
        ]);
      }
    } else {
      // Sync components into existing dishes
      for (const d of restaurantMenu.dishes) {
        await client.query(`
          UPDATE dishes 
          SET components = $1, tags = $2
          WHERE id = $3
        `, [JSON.stringify(d.components || []), JSON.stringify(d.tags || []), d.id]);
      }
    }

    // Check if users need seeding
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count, 10) === 0) {
      console.log('Seeding default customers and admin into PostgreSQL...');
      for (const u of restaurantMenu.defaultUsers) {
        await client.query(`
          INSERT INTO users (id, name, phone, email, password, role, membership_number, tier, points, total_spent, address)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          u.id, u.name, u.phone, u.email, u.password, u.role, u.membershipNumber,
          u.tier, u.points, u.totalSpent, u.address
        ]);
      }
    }

    // Check if tables need seeding (12 Tables: Bàn 01 - Bàn 12)
    const tableCount = await client.query('SELECT COUNT(*) FROM restaurant_tables');
    if (parseInt(tableCount.rows[0].count, 10) === 0) {
      console.log('Seeding 12 restaurant tables into PostgreSQL...');
      for (let i = 1; i <= 12; i++) {
        const tableNum = `Bàn ${String(i).padStart(2, '0')}`;
        await client.query(`
          INSERT INTO restaurant_tables (table_number, capacity, status)
          VALUES ($1, $2, $3)
        `, [tableNum, i <= 4 ? 2 : (i <= 8 ? 4 : 6), 'empty']);
      }
    }

    // Check if default orders need seeding
    const orderCount = await client.query('SELECT COUNT(*) FROM orders');
    if (parseInt(orderCount.rows[0].count, 10) === 0) {
      console.log('Seeding initial sample orders into PostgreSQL...');
      for (const o of restaurantMenu.defaultOrders) {
        await client.query(`
          INSERT INTO orders (id, order_code, order_type, table_number, customer_name, phone, address, notes, items, subtotal, shipping_fee, points_used, discount_amount, total_amount, payment_method, payment_status, order_status, points_earned, timeline)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
          o.id, o.orderCode, 'delivery', null, o.customerName, o.phone, o.address, o.notes,
          JSON.stringify(o.items || []), o.subtotal, o.shippingFee, o.pointsUsed,
          o.discountAmount, o.totalAmount, o.paymentMethod, o.paymentStatus, o.orderStatus,
          o.pointsEarned, JSON.stringify(o.timeline || [])
        ]);
      }
    }

    console.log('PostgreSQL comtam_db initialized and seeded successfully!');
  } catch (err) {
    console.error('Error during PostgreSQL initialization:', err);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDB
};
