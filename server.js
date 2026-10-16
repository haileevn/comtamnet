/**
 * Backend Web & API Server for Com Tam Ong Map (comtam.net)
 * Powered by Node.js and PostgreSQL (comtam_db)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { pool, initDB } = require('./db.js');

const PORT = process.env.PORT || 8000;

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // --- API ROUTES ---
  if (pathname.startsWith('/api/')) {
    try {
      // 1. DISHES
      if (pathname === '/api/dishes') {
        if (method === 'GET') {
          const result = await pool.query('SELECT * FROM dishes ORDER BY created_at ASC');
          return sendJSON(res, 200, result.rows);
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const id = body.id || 'dish_' + Date.now();
          const query = `
            INSERT INTO dishes (id, name, category, price, time, image, description, tags, ingredients, components, available)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `;
          const values = [
            id, body.name, body.category || 'Món Chính', body.price || 65000, body.time || '5–10 phút',
            body.image || 'comtam-suon-cha.png', body.description || '', JSON.stringify(body.tags || []),
            JSON.stringify(body.ingredients || ['pork', 'rice', 'herbs']),
            JSON.stringify(body.components || []), body.available !== false
          ];
          const result = await pool.query(query, values);
          return sendJSON(res, 201, result.rows[0]);
        }
      }

      if (pathname.startsWith('/api/dishes/')) {
        const dishId = pathname.replace('/api/dishes/', '').split('/')[0];
        
        if (pathname.endsWith('/toggle') && method === 'POST') {
          const result = await pool.query(
            'UPDATE dishes SET available = NOT available WHERE id = $1 RETURNING *',
            [dishId]
          );
          return sendJSON(res, 200, result.rows[0] || null);
        }

        if (method === 'PUT') {
          const body = await parseBody(req);
          const query = `
            UPDATE dishes SET 
              name = COALESCE($1, name),
              category = COALESCE($2, category),
              price = COALESCE($3, price),
              time = COALESCE($4, time),
              image = COALESCE($5, image),
              description = COALESCE($6, description),
              tags = COALESCE($7, tags),
              components = COALESCE($8, components)
            WHERE id = $9
            RETURNING *
          `;
          const values = [
            body.name, body.category, body.price, body.time, body.image,
            body.description, body.tags ? JSON.stringify(body.tags) : null,
            body.components ? JSON.stringify(body.components) : null, dishId
          ];
          const result = await pool.query(query, values);
          return sendJSON(res, 200, result.rows[0] || null);
        }

        if (method === 'DELETE') {
          await pool.query('DELETE FROM dishes WHERE id = $1', [dishId]);
          return sendJSON(res, 200, { success: true });
        }
      }

      // 2. ORDERS
      if (pathname === '/api/orders') {
        if (method === 'GET') {
          const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
          return sendJSON(res, 200, result.rows);
        }

        if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'ord_' + Date.now();
          const code = body.orderCode || ('CTM-' + Math.floor(1000 + Math.random() * 9000));
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          const orderType = body.orderType || (body.tableNumber ? 'dine_in' : 'delivery');
          const tableNum = body.tableNumber || null;

          const defaultTimeline = [
            { time: timeStr, title: orderType === 'dine_in' ? `Đã gọi món tại ${tableNum}` : 'Đã tiếp nhận đơn hàng', desc: `Đơn hàng ${code} ghi nhận thành công.` }
          ];

          const query = `
            INSERT INTO orders (
              id, order_code, order_type, table_number, customer_name, phone, address, notes,
              items, subtotal, shipping_fee, points_used, discount_amount, total_amount,
              payment_method, payment_status, order_status, points_earned, timeline
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
          `;
          const values = [
            id, code, orderType, tableNum, body.customerName, body.phone || '',
            body.address || (orderType === 'dine_in' ? `Ăn tại quán - ${tableNum}` : ''),
            body.notes || '', JSON.stringify(body.items || []), body.subtotal || 0,
            body.shippingFee || 0, body.pointsUsed || 0, body.discountAmount || 0,
            body.totalAmount || 0, body.paymentMethod || 'vietqr',
            body.paymentMethod === 'cod' ? 'cod' : 'pending',
            body.paymentMethod === 'vietqr' ? 'pending_payment' : 'cooking',
            Math.floor((body.totalAmount || 0) / 10000),
            JSON.stringify(body.timeline || defaultTimeline)
          ];
          const result = await pool.query(query, values);

          // If dine-in, update table status to 'dining'
          if (tableNum) {
            await pool.query(`
              UPDATE restaurant_tables 
              SET status = 'dining', active_order_id = $1, active_order_code = $2
              WHERE table_number = $3
            `, [id, code, tableNum]);
          }

          // If member used points, deduct from user
          if (body.phone && body.pointsUsed > 0) {
            await pool.query(
              'UPDATE users SET points = GREATEST(0, points - $1) WHERE phone = $2',
              [body.pointsUsed, body.phone]
            );
          }

          return sendJSON(res, 201, result.rows[0]);
        }
      }

      if (pathname.startsWith('/api/orders/')) {
        const orderId = pathname.replace('/api/orders/', '').split('/')[0];

        // ⚡ Quick Approve Payment
        if (pathname.endsWith('/approve') && method === 'POST') {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          const curOrder = await pool.query('SELECT * FROM orders WHERE id = $1 OR order_code = $1', [orderId]);
          if (curOrder.rows.length === 0) return sendJSON(res, 404, { error: 'Order not found' });
          
          const order = curOrder.rows[0];
          const timeline = order.timeline || [];
          timeline.push({
            time: timeStr,
            title: '⚡ Đã duyệt thanh toán trực tuyến',
            desc: 'Nhân viên đã xác nhận nhận tiền thành công. Bếp lập tức nướng sườn chuẩn bị!'
          });

          const result = await pool.query(`
            UPDATE orders SET 
              payment_status = 'paid',
              order_status = 'cooking',
              timeline = $1
            WHERE id = $2
            RETURNING *
          `, [JSON.stringify(timeline), order.id]);

          return sendJSON(res, 200, result.rows[0]);
        }

        // Update Order Status
        if (pathname.endsWith('/status') && method === 'PUT') {
          const body = await parseBody(req);
          const newStatus = body.status;
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const curOrder = await pool.query('SELECT * FROM orders WHERE id = $1 OR order_code = $1', [orderId]);
          if (curOrder.rows.length === 0) return sendJSON(res, 404, { error: 'Order not found' });
          const order = curOrder.rows[0];
          const timeline = order.timeline || [];

          const statusTitles = {
            'cooking': 'Bếp đang nướng sườn than hoa',
            'delivering': 'Shipper đang tốc hành giao đến',
            'completed': 'Đã hoàn tất đơn hàng',
            'cancelled': 'Đơn hàng đã huỷ'
          };
          timeline.push({
            time: timeStr,
            title: statusTitles[newStatus] || newStatus,
            desc: `Cập nhật trạng thái sang ${newStatus}`
          });

          const result = await pool.query(`
            UPDATE orders SET 
              order_status = $1,
              timeline = $2
            WHERE id = $3
            RETURNING *
          `, [newStatus, JSON.stringify(timeline), order.id]);

          // If dine-in completed or cancelled, release table
          if ((newStatus === 'completed' || newStatus === 'cancelled') && order.table_number) {
            await pool.query(`
              UPDATE restaurant_tables 
              SET status = 'empty', active_order_id = NULL, active_order_code = NULL
              WHERE table_number = $1
            `, [order.table_number]);
          }

          return sendJSON(res, 200, result.rows[0]);
        }
      }

      // 3. TABLES (SƠ ĐỒ BÀN & ORDER TẠI BÀN)
      if (pathname === '/api/tables') {
        if (method === 'GET') {
          const result = await pool.query('SELECT * FROM restaurant_tables ORDER BY table_number ASC');
          return sendJSON(res, 200, result.rows);
        }
      }

      if (pathname.startsWith('/api/tables/')) {
        const parts = pathname.split('/');
        const tableNum = decodeURIComponent(parts[3]); // e.g. "Bàn 01"

        // Customer calls waiter at table
        if (pathname.endsWith('/call-waiter') && method === 'POST') {
          const body = await parseBody(req);
          const reqType = body.requestType || 'Gọi nhân viên phục vụ';
          
          await pool.query(`
            UPDATE restaurant_tables 
            SET waiter_call = $1, waiter_call_time = CURRENT_TIMESTAMP
            WHERE table_number = $2
          `, [reqType, tableNum]);

          await pool.query(`
            INSERT INTO waiter_calls (table_number, request_type, status)
            VALUES ($1, $2, 'pending')
          `, [tableNum, reqType]);

          return sendJSON(res, 200, { success: true, tableNumber: tableNum, requestType: reqType });
        }

        // Staff clears waiter call
        if (pathname.endsWith('/clear-waiter') && method === 'POST') {
          await pool.query(`
            UPDATE restaurant_tables 
            SET waiter_call = NULL, waiter_call_time = NULL
            WHERE table_number = $1
          `, [tableNum]);

          await pool.query(`
            UPDATE waiter_calls 
            SET status = 'resolved' 
            WHERE table_number = $1 AND status = 'pending'
          `, [tableNum]);

          return sendJSON(res, 200, { success: true });
        }

        // Toggle table status (empty, dining, billing)
        if (pathname.endsWith('/status') && method === 'PUT') {
          const body = await parseBody(req);
          const result = await pool.query(`
            UPDATE restaurant_tables 
            SET status = $1 
            WHERE table_number = $2
            RETURNING *
          `, [body.status, tableNum]);
          return sendJSON(res, 200, result.rows[0]);
        }
      }

      // 4. USERS & AUTH
      if (pathname === '/api/users') {
        if (method === 'GET') {
          const role = parsedUrl.query.role;
          const search = parsedUrl.query.q ? `%${parsedUrl.query.q.trim().toLowerCase()}%` : null;

          let query = 'SELECT id, name, phone, email, role, membership_number, tier, points, total_spent, address, status, created_at FROM users WHERE 1=1';
          const values = [];

          if (role) {
            values.push(role);
            query += ` AND role = $${values.length}`;
          }

          if (search) {
            values.push(search);
            query += ` AND (LOWER(name) LIKE $${values.length} OR LOWER(phone) LIKE $${values.length} OR LOWER(membership_number) LIKE $${values.length} OR LOWER(email) LIKE $${values.length})`;
          }

          query += ' ORDER BY created_at DESC';
          const result = await pool.query(query, values);
          return sendJSON(res, 200, result.rows);
        }

        // Admin creates a new customer or admin manually
        if (method === 'POST') {
          const body = await parseBody(req);
          if (!body.name || !body.phone) {
            return sendJSON(res, 400, { success: false, message: 'Họ tên và số điện thoại là bắt buộc' });
          }

          const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [body.phone.trim()]);
          if (existing.rows.length > 0) {
            return sendJSON(res, 400, { success: false, message: 'Số điện thoại này đã tồn tại trong hệ thống' });
          }

          const role = body.role || 'customer';
          const cardNum = role === 'admin' ? ('ADMIN-' + Math.floor(100 + Math.random() * 900)) : ('CTM-' + Math.floor(1000 + Math.random() * 9000) + '-MEM');
          const newId = 'user_' + Date.now();
          const points = parseInt(body.points, 10) || (role === 'admin' ? 9999 : 50);
          const tier = body.tier || (points >= 500 ? 'Diamond' : (points >= 200 ? 'Gold' : 'Silver'));

          const query = `
            INSERT INTO users (id, name, phone, email, password, role, membership_number, tier, points, total_spent, address, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
            RETURNING id, name, phone, email, role, membership_number, tier, points, total_spent, address, status, created_at
          `;
          const values = [
            newId, body.name.trim(), body.phone.trim(), body.email || '',
            body.password || '123456', role, cardNum, tier, points,
            parseInt(body.totalSpent, 10) || 0, body.address || ''
          ];
          const result = await pool.query(query, values);
          return sendJSON(res, 201, { success: true, user: result.rows[0] });
        }
      }

      if (pathname.startsWith('/api/users/')) {
        const parts = pathname.split('/');
        const userId = parts[3];

        // GET /api/users/:id - Get user with full order history
        if (parts.length === 4 && method === 'GET') {
          const userRes = await pool.query(
            'SELECT id, name, phone, email, role, membership_number, tier, points, total_spent, address, status, created_at FROM users WHERE id = $1',
            [userId]
          );
          if (userRes.rows.length === 0) return sendJSON(res, 404, { error: 'Không tìm thấy người dùng' });
          const user = userRes.rows[0];

          // Fetch orders by this user
          const ordersRes = await pool.query(
            'SELECT * FROM orders WHERE phone = $1 OR customer_name = $2 ORDER BY created_at DESC',
            [user.phone, user.name]
          );

          return sendJSON(res, 200, { user, orders: ordersRes.rows });
        }

        // PUT /api/users/:id - Update profile information
        if (parts.length === 4 && method === 'PUT') {
          const body = await parseBody(req);
          const points = body.points !== undefined ? parseInt(body.points, 10) : null;
          let tier = body.tier || null;
          if (points !== null && !tier) {
            tier = points >= 500 ? 'Diamond' : (points >= 200 ? 'Gold' : 'Silver');
          }

          const query = `
            UPDATE users SET
              name = COALESCE($1, name),
              phone = COALESCE($2, phone),
              email = COALESCE($3, email),
              address = COALESCE($4, address),
              tier = COALESCE($5, tier),
              points = COALESCE($6, points),
              role = COALESCE($7, role),
              status = COALESCE($8, status)
            WHERE id = $9
            RETURNING id, name, phone, email, role, membership_number, tier, points, total_spent, address, status, created_at
          `;
          const values = [
            body.name, body.phone, body.email, body.address,
            tier, points, body.role, body.status, userId
          ];
          const result = await pool.query(query, values);
          if (result.rows.length === 0) return sendJSON(res, 404, { error: 'Không tìm thấy người dùng' });
          return sendJSON(res, 200, { success: true, user: result.rows[0] });
        }

        // PUT /api/users/:id/password - Change password
        if (pathname.endsWith('/password') && method === 'PUT') {
          const body = await parseBody(req);
          const oldPass = body.oldPassword;
          const newPass = body.newPassword;
          const isAdminOverride = body.isAdminOverride === true;

          if (!newPass || newPass.length < 3) {
            return sendJSON(res, 400, { success: false, message: 'Mật khẩu mới phải có ít nhất 3 ký tự' });
          }

          const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
          if (userRes.rows.length === 0) return sendJSON(res, 404, { error: 'Không tìm thấy tài khoản' });
          const user = userRes.rows[0];

          if (!isAdminOverride && user.password !== oldPass) {
            return sendJSON(res, 400, { success: false, message: 'Mật khẩu hiện tại không chính xác' });
          }

          await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPass, userId]);
          return sendJSON(res, 200, { success: true, message: 'Đổi mật khẩu thành công' });
        }

        // DELETE /api/users/:id - Delete user account
        if (parts.length === 4 && method === 'DELETE') {
          const userRes = await pool.query('SELECT role, membership_number FROM users WHERE id = $1', [userId]);
          if (userRes.rows.length === 0) return sendJSON(res, 404, { error: 'Không tìm thấy tài khoản' });
          const user = userRes.rows[0];

          if (user.membership_number === 'ADMIN-ROOT' || userId === 'admin_01') {
            return sendJSON(res, 400, { success: false, message: 'Không thể xóa tài khoản Quản Trị Viên gốc (Root Admin)' });
          }

          await pool.query('DELETE FROM users WHERE id = $1', [userId]);
          return sendJSON(res, 200, { success: true, message: 'Đã xóa tài khoản thành công' });
        }

        // POST /api/users/:id/points - Adjust points
        if (pathname.endsWith('/points') && method === 'POST') {
          const body = await parseBody(req);
          const delta = parseInt(body.delta, 10) || 0;

          const result = await pool.query(`
            UPDATE users 
            SET points = GREATEST(0, points + $1)
            WHERE id = $2
            RETURNING *
          `, [delta, userId]);

          if (result.rows.length > 0) {
            const user = result.rows[0];
            let tier = 'Silver';
            if (user.points >= 500) tier = 'Diamond';
            else if (user.points >= 200) tier = 'Gold';
            await pool.query('UPDATE users SET tier = $1 WHERE id = $2', [tier, user.id]);
            user.tier = tier;
            delete user.password;
            return sendJSON(res, 200, user);
          }
          return sendJSON(res, 404, { error: 'User not found' });
        }
      }

      // Customer Login (Checks existence & password clearly)
      if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await parseBody(req);
        const id = (body.identifier || '').trim().toLowerCase();
        const pass = body.password || '';

        const checkUser = await pool.query(`
          SELECT * FROM users 
          WHERE LOWER(phone) = $1 OR LOWER(email) = $1 OR LOWER(membership_number) = $1 OR (role = 'admin' AND $1 = 'admin')
        `, [id]);

        if (checkUser.rows.length === 0) {
          return sendJSON(res, 401, { success: false, message: 'Số điện thoại hoặc thông tin đăng nhập chưa được đăng ký trong hệ thống' });
        }

        const user = checkUser.rows[0];
        if (user.password !== pass) {
          return sendJSON(res, 401, { success: false, message: 'Mật khẩu không chính xác, vui lòng thử lại' });
        }

        if (user.status === 'blocked') {
          return sendJSON(res, 403, { success: false, message: 'Tài khoản này đang bị tạm khóa. Vui lòng liên hệ hotline 1900 6868.' });
        }

        delete user.password;
        return sendJSON(res, 200, { success: true, user });
      }

      // Admin Login (Strictly verifies role = 'admin')
      if (pathname === '/api/auth/admin-login' && method === 'POST') {
        const body = await parseBody(req);
        const id = (body.identifier || '').trim().toLowerCase();
        const pass = body.password || '';

        const checkUser = await pool.query(`
          SELECT * FROM users 
          WHERE LOWER(phone) = $1 OR LOWER(email) = $1 OR LOWER(membership_number) = $1 OR (role = 'admin' AND $1 = 'admin')
        `, [id]);

        if (checkUser.rows.length === 0) {
          return sendJSON(res, 401, { success: false, message: 'Tài khoản quản trị viên không tồn tại' });
        }

        const user = checkUser.rows[0];
        if (user.role !== 'admin') {
          return sendJSON(res, 403, { success: false, message: 'Tài khoản này là tài khoản khách hàng, không có quyền truy cập Quản Trị Bếp' });
        }

        if (user.password !== pass) {
          return sendJSON(res, 401, { success: false, message: 'Mật khẩu quản trị viên không chính xác' });
        }

        delete user.password;
        return sendJSON(res, 200, { success: true, user });
      }

      if (pathname === '/api/auth/register' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.phone || !body.password) {
          return sendJSON(res, 400, { success: false, message: 'Vui lòng điền đầy đủ Họ tên, Số điện thoại và Mật khẩu' });
        }

        const cardNum = 'CTM-' + Math.floor(1000 + Math.random() * 9000) + '-MEM';
        const newId = 'user_' + Date.now();

        try {
          const result = await pool.query(`
            INSERT INTO users (id, name, phone, email, password, role, membership_number, tier, points, total_spent, address, status)
            VALUES ($1, $2, $3, $4, $5, 'customer', $6, 'Silver', 50, 0, '', 'active')
            RETURNING id, name, phone, email, role, membership_number, tier, points, total_spent, address, status, created_at
          `, [newId, body.name.trim(), body.phone.trim(), body.email ? body.email.trim() : '', body.password, cardNum]);

          return sendJSON(res, 201, { success: true, user: result.rows[0] });
        } catch (e) {
          return sendJSON(res, 400, { success: false, message: 'Số điện thoại này đã được đăng ký thành viên trước đó' });
        }
      }

      // 5. PRINT STANDEE QR CODE SHEET (HTML View)
      if (pathname === '/api/tables/print-qr') {
        const tables = await pool.query('SELECT * FROM restaurant_tables ORDER BY table_number ASC');
        const host = req.headers.host || 'localhost:8000';
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Bộ Mã QR Gọi Món Tại Bàn — Cơm Tấm Ông Mập</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f0f0; margin: 0; padding: 20px; }
              .page-title { text-align: center; margin-bottom: 20px; }
              .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1000px; margin: 0 auto; }
              .standee-card {
                background: #fff; border: 2px solid #b87333; border-radius: 16px; padding: 20px;
                text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.08); page-break-inside: avoid;
              }
              .brand { font-size: 16px; font-weight: 800; color: #2b2724; text-transform: uppercase; margin-bottom: 2px; }
              .sub { font-size: 11px; color: #c86b2b; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
              .table-badge {
                display: inline-block; background: #c86b2b; color: #fff; font-size: 18px; font-weight: 900;
                padding: 6px 18px; border-radius: 30px; margin-bottom: 12px;
              }
              .qr-box { padding: 10px; background: #fdfaf6; border: 1px solid #ebdccf; border-radius: 12px; display: inline-block; margin-bottom: 12px; }
              .qr-img { width: 160px; height: 160px; display: block; }
              .hint { font-size: 12px; color: #555; line-height: 1.4; margin: 0; font-weight: 600; }
              .url { font-size: 10px; color: #888; margin-top: 6px; }
              @media print {
                body { background: #fff; padding: 0; }
                .no-print { display: none; }
                .grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
              }
            </style>
          </head>
          <body>
            <div class="page-title no-print">
              <h2>🖨️ BỘ MÃ QR ĐỂ BÀN GỌI MÓN (12 BÀN ĂN)</h2>
              <button onclick="window.print()" style="padding:10px 24px;background:#c86b2b;color:#fff;border:none;border-radius:24px;font-weight:700;cursor:pointer;font-size:15px;">
                🖨️ In Ngay Bộ Standee Để Bàn
              </button>
            </div>
            <div class="grid">
              ${tables.rows.map(t => {
                const num = t.table_number.replace(/\D/g, '');
                const targetUrl = `http://${host}/?table=${num}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(targetUrl)}`;
                return `
                  <div class="standee-card">
                    <div class="brand">CƠM TẤM ÔNG MẬP</div>
                    <div class="sub">COMTAM.NET · SÀI GÒN XƯA</div>
                    <div class="table-badge">${t.table_number.toUpperCase()}</div>
                    <div class="qr-box">
                      <img class="qr-img" src="${qrUrl}" alt="QR ${t.table_number}">
                    </div>
                    <p class="hint">📱 QUÉT MÃ ĐỂ XEM MENU<br />VÀ ĐẶT CƠM TRỰC TIẾP TẠI BÀN</p>
                    <div class="url">${targetUrl}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </body>
          </html>
        `);
      }

      // 6. RESET DATA
      if (pathname === '/api/reset-data' && method === 'POST') {
        await pool.query('TRUNCATE orders, waiter_calls CASCADE');
        return sendJSON(res, 200, { success: true, message: 'Reset orders and calls successfully' });
      }

      return sendJSON(res, 404, { error: 'API route not found' });
    } catch (err) {
      console.error('API Error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Cơm Tấm Ông Mập Server (comtam.net) is running!`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Database: PostgreSQL (comtam_db) connected successfully`);
    console.log(`=======================================================`);
  });
}).catch(err => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
