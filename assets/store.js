/**
 * Com Tam Ong Map - Central State Store
 * Hybrid PostgreSQL + LocalStorage with Dine-In Table QR Ordering
 */
(() => {
  "use strict";

  const STORAGE_KEYS = {
    DISHES: 'comtam_dishes_v1',
    USERS: 'comtam_users_v1',
    ORDERS: 'comtam_orders_v1',
    CURRENT_USER: 'comtam_current_user_v1',
    CART: 'comtam_cart_v1',
    CURRENT_TABLE: 'comtam_current_table_v1',
    TABLES: 'comtam_tables_v1'
  };

  const initialMenu = (typeof restaurantMenu !== 'undefined') ? restaurantMenu : {};

  // Parse Table from URL ?table=XX or ?ban=XX
  const urlParams = new URLSearchParams(window.location.search);
  const paramTable = urlParams.get('table') || urlParams.get('ban');
  if (paramTable) {
    const num = paramTable.replace(/\D/g, '');
    const formatted = num ? `Bàn ${num.padStart(2, '0')}` : paramTable;
    localStorage.setItem(STORAGE_KEYS.CURRENT_TABLE, formatted);
  }

  function load(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      console.error('Storage read error for key:', key, e);
      return defaultVal;
    }
  }

  function save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage write error for key:', key, e);
    }
  }

  // Initial defaults
  if (!localStorage.getItem(STORAGE_KEYS.DISHES)) {
    save(STORAGE_KEYS.DISHES, initialMenu.dishes || []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    save(STORAGE_KEYS.USERS, initialMenu.defaultUsers || []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    save(STORAGE_KEYS.ORDERS, initialMenu.defaultOrders || []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    const defaultUsers = initialMenu.defaultUsers || [];
    const vip = defaultUsers.find(u => u.id === 'user_01') || defaultUsers[0] || null;
    save(STORAGE_KEYS.CURRENT_USER, vip);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CART)) {
    save(STORAGE_KEYS.CART, []);
  }

  const ComTamStore = {
    on(event, callback) {
      window.addEventListener(`comtam:${event}`, (e) => callback(e.detail));
    },

    emit(event, detail = {}) {
      window.dispatchEvent(new CustomEvent(`comtam:${event}`, { detail }));
    },

    // --- DINE-IN TABLE SYSTEM ---
    getCurrentTable() {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_TABLE) || null;
    },

    setCurrentTable(tableNumber) {
      if (tableNumber) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_TABLE, tableNumber);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_TABLE);
      }
      this.emit('table-changed', { tableNumber });
    },

    clearCurrentTable() {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_TABLE);
      this.emit('table-changed', { tableNumber: null });
    },

    getTables() {
      return load(STORAGE_KEYS.TABLES, Array.from({ length: 12 }, (_, i) => ({
        table_number: `Bàn ${String(i + 1).padStart(2, '0')}`,
        capacity: i < 4 ? 2 : (i < 8 ? 4 : 6),
        status: 'empty',
        active_order_code: null,
        waiter_call: null
      })));
    },

    saveTables(tables) {
      save(STORAGE_KEYS.TABLES, tables);
      this.emit('tables-changed', { tables });
    },

    async fetchTables() {
      try {
        const res = await fetch('/api/tables');
        if (res.ok) {
          const tables = await res.json();
          this.saveTables(tables);
          return tables;
        }
      } catch (e) {
        // offline fallback
      }
      return this.getTables();
    },

    async callWaiter(tableNumber, requestType) {
      try {
        await fetch(`/api/tables/${encodeURIComponent(tableNumber)}/call-waiter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestType })
        });
      } catch (e) {}

      // Update local state
      const tables = this.getTables();
      const t = tables.find(item => item.table_number === tableNumber);
      if (t) {
        t.waiter_call = requestType;
        t.waiter_call_time = new Date().toISOString();
        this.saveTables(tables);
      }
      this.emit('waiter-called', { tableNumber, requestType });
    },

    async clearWaiterCall(tableNumber) {
      try {
        await fetch(`/api/tables/${encodeURIComponent(tableNumber)}/clear-waiter`, {
          method: 'POST'
        });
      } catch (e) {}

      const tables = this.getTables();
      const t = tables.find(item => item.table_number === tableNumber);
      if (t) {
        t.waiter_call = null;
        t.waiter_call_time = null;
        this.saveTables(tables);
      }
      this.emit('waiter-cleared', { tableNumber });
    },

    async updateTableStatus(tableNumber, status) {
      try {
        await fetch(`/api/tables/${encodeURIComponent(tableNumber)}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
      } catch (e) {}

      const tables = this.getTables();
      const t = tables.find(item => item.table_number === tableNumber);
      if (t) {
        t.status = status;
        this.saveTables(tables);
      }
    },

    // --- DISHES (SYNCED WITH POSTGRESQL) ---
    getDishes() {
      return load(STORAGE_KEYS.DISHES, initialMenu.dishes || []);
    },

    getDish(id) {
      return this.getDishes().find(d => d.id === id);
    },

    saveDishes(dishes) {
      save(STORAGE_KEYS.DISHES, dishes);
      this.emit('dishes-changed', { dishes });
    },

    async fetchDishes() {
      try {
        const res = await fetch('/api/dishes');
        if (res.ok) {
          const dishes = await res.json();
          this.saveDishes(dishes);
          return dishes;
        }
      } catch (e) {}
      return this.getDishes();
    },

    async addDish(newDish) {
      if (!newDish.id) newDish.id = 'dish_' + Date.now();
      if (newDish.available === undefined) newDish.available = true;

      try {
        const res = await fetch('/api/dishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDish)
        });
        if (res.ok) {
          const created = await res.json();
          const dishes = this.getDishes();
          dishes.unshift(created);
          this.saveDishes(dishes);
          return created;
        }
      } catch (e) {}

      const dishes = this.getDishes();
      dishes.unshift(newDish);
      this.saveDishes(dishes);
      return newDish;
    },

    async updateDish(id, updates) {
      try {
        const res = await fetch(`/api/dishes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (res.ok) {
          const updated = await res.json();
          const dishes = this.getDishes();
          const idx = dishes.findIndex(d => d.id === id);
          if (idx !== -1) dishes[idx] = updated;
          this.saveDishes(dishes);
          return updated;
        }
      } catch (e) {}

      const dishes = this.getDishes();
      const idx = dishes.findIndex(d => d.id === id);
      if (idx !== -1) {
        dishes[idx] = { ...dishes[idx], ...updates };
        this.saveDishes(dishes);
        return dishes[idx];
      }
      return null;
    },

    async deleteDish(id) {
      try {
        await fetch(`/api/dishes/${id}`, { method: 'DELETE' });
      } catch (e) {}
      const dishes = this.getDishes().filter(d => d.id !== id);
      this.saveDishes(dishes);
    },

    async toggleDishAvailability(id) {
      try {
        const res = await fetch(`/api/dishes/${id}/toggle`, { method: 'POST' });
        if (res.ok) {
          const updated = await res.json();
          const dishes = this.getDishes();
          const idx = dishes.findIndex(d => d.id === id);
          if (idx !== -1) dishes[idx] = updated;
          this.saveDishes(dishes);
          return updated;
        }
      } catch (e) {}

      const dishes = this.getDishes();
      const dish = dishes.find(d => d.id === id);
      if (dish) {
        dish.available = !dish.available;
        this.saveDishes(dishes);
        return dish;
      }
      return null;
    },

    // --- USERS & AUTH ---
    getUsers() {
      return load(STORAGE_KEYS.USERS, initialMenu.defaultUsers || []);
    },

    saveUsers(users) {
      save(STORAGE_KEYS.USERS, users);
      const current = this.getCurrentUser();
      if (current) {
        const updatedCurrent = users.find(u => u.id === current.id);
        if (updatedCurrent) {
          save(STORAGE_KEYS.CURRENT_USER, updatedCurrent);
        }
      }
      this.emit('users-changed', { users });
    },

    async fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const users = await res.json();
          this.saveUsers(users);
          return users;
        }
      } catch (e) {}
      return this.getUsers();
    },

    getCurrentUser() {
      return load(STORAGE_KEYS.CURRENT_USER, null);
    },

    setCurrentUser(user) {
      save(STORAGE_KEYS.CURRENT_USER, user);
      this.emit('user-changed', { user });
    },

    async login(identifier, password) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          this.setCurrentUser(data.user);
          return data;
        }
        if (!res.ok) {
          return data;
        }
      } catch (e) {}

      // Local fallback
      const users = this.getUsers();
      const term = identifier.trim().toLowerCase();
      const user = users.find(u => 
        (u.phone === term || u.email?.toLowerCase() === term || u.membershipNumber?.toLowerCase() === term || (u.role === 'admin' && term === 'admin')) &&
        u.password === password
      );
      if (user) {
        this.setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, message: 'Thông tin đăng nhập hoặc mật khẩu không chính xác' };
    },

    async register(name, phone, email, password) {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            this.setCurrentUser(data.user);
            return data;
          }
        }
      } catch (e) {}

      const users = this.getUsers();
      if (users.some(u => u.phone === phone)) {
        return { success: false, message: 'Số điện thoại này đã được đăng ký' };
      }
      const newCardNum = 'CTM-' + Math.floor(1000 + Math.random() * 9000) + '-MEM';
      const newUser = {
        id: 'user_' + Date.now(),
        name,
        phone,
        email: email || '',
        password,
        role: 'customer',
        membershipNumber: newCardNum,
        tier: 'Silver',
        points: 50,
        totalSpent: 0,
        address: '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      users.push(newUser);
      this.saveUsers(users);
      this.setCurrentUser(newUser);
      return { success: true, user: newUser };
    },

    logout() {
      this.setCurrentUser(null);
    },

    async adminLogin(identifier, password) {
      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          this.setCurrentUser(data.user);
          return data;
        }
        return data;
      } catch (e) {}

      // Fallback
      const users = this.getUsers();
      const term = identifier.trim().toLowerCase();
      const user = users.find(u => 
        (u.phone === term || u.email?.toLowerCase() === term || u.membershipNumber?.toLowerCase() === term || (u.role === 'admin' && term === 'admin')) &&
        u.password === password && u.role === 'admin'
      );
      if (user) {
        this.setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, message: 'Sai tài khoản hoặc mật khẩu quản trị viên' };
    },

    async updateUser(userId, updates) {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const users = this.getUsers();
            const idx = users.findIndex(u => u.id === userId);
            if (idx !== -1) users[idx] = { ...users[idx], ...data.user };
            this.saveUsers(users);
            const cur = this.getCurrentUser();
            if (cur && cur.id === userId) {
              this.setCurrentUser({ ...cur, ...data.user });
            }
            return data;
          }
        }
      } catch (e) {}

      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        this.saveUsers(users);
        const cur = this.getCurrentUser();
        if (cur && cur.id === userId) {
          this.setCurrentUser({ ...cur, ...updates });
        }
        return { success: true, user: users[idx] };
      }
      return { success: false, message: 'Không tìm thấy người dùng' };
    },

    async changePassword(userId, oldPassword, newPassword, isAdminOverride = false) {
      try {
        const res = await fetch(`/api/users/${userId}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPassword, newPassword, isAdminOverride })
        });
        const data = await res.json();
        return data;
      } catch (e) {
        return { success: false, message: 'Lỗi kết nối máy chủ' };
      }
    },

    async deleteUser(userId) {
      try {
        const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
          const users = this.getUsers().filter(u => u.id !== userId);
          this.saveUsers(users);
          const cur = this.getCurrentUser();
          if (cur && cur.id === userId) {
            this.logout();
          }
          return data;
        }
        return data;
      } catch (e) {}

      const users = this.getUsers().filter(u => u.id !== userId);
      this.saveUsers(users);
      return { success: true };
    },

    async createUser(userData) {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const users = this.getUsers();
          users.unshift(data.user);
          this.saveUsers(users);
          return data;
        }
        return data;
      } catch (e) {
        return { success: false, message: 'Lỗi khi tạo người dùng' };
      }
    },

    async getUserDetail(userId) {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}

      const user = this.getUsers().find(u => u.id === userId);
      if (!user) return null;
      const orders = this.getOrders().filter(o => o.phone === user.phone || (o.customerName || o.customer_name) === user.name);
      return { user, orders };
    },

    async updateUserPoints(userId, deltaPoints, reason = '') {
      try {
        const res = await fetch(`/api/users/${userId}/points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delta: deltaPoints })
        });
        if (res.ok) {
          const user = await res.json();
          const users = this.getUsers();
          const idx = users.findIndex(u => u.id === userId);
          if (idx !== -1) users[idx] = user;
          this.saveUsers(users);
          return user;
        }
      } catch (e) {}

      const users = this.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return false;
      user.points = Math.max(0, (user.points || 0) + deltaPoints);
      if (user.points >= 500) user.tier = 'Diamond';
      else if (user.points >= 200) user.tier = 'Gold';
      else user.tier = 'Silver';
      this.saveUsers(users);
      return user;
    },

    // --- CART ---
    getCart() {
      return load(STORAGE_KEYS.CART, []);
    },

    saveCart(cart) {
      save(STORAGE_KEYS.CART, cart);
      this.emit('cart-changed', { cart });
    },

    addToCart(item) {
      const cart = this.getCart();
      const existing = cart.find(c => 
        c.dishId === item.dishId && 
        JSON.stringify(c.toppings || []) === JSON.stringify(item.toppings || []) &&
        (c.notes || '') === (item.notes || '')
      );
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        cart.push({
          dishId: item.dishId,
          name: item.name,
          price: item.price,
          unitPrice: item.unitPrice || item.price,
          image: item.image,
          quantity: item.quantity || 1,
          toppings: item.toppings || [],
          toppingsCost: item.toppingsCost || 0,
          notes: item.notes || ''
        });
      }
      this.saveCart(cart);
    },

    updateCartQuantity(index, quantity) {
      const cart = this.getCart();
      if (cart[index]) {
        if (quantity <= 0) {
          cart.splice(index, 1);
        } else {
          cart[index].quantity = quantity;
        }
        this.saveCart(cart);
      }
    },

    removeFromCart(index) {
      const cart = this.getCart();
      if (cart[index]) {
        cart.splice(index, 1);
        this.saveCart(cart);
      }
    },

    clearCart() {
      this.saveCart([]);
    },

    getCartSubtotal() {
      const cart = this.getCart();
      return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    // --- ORDERS (POSTGRESQL SYNCED) ---
    getOrders() {
      return load(STORAGE_KEYS.ORDERS, initialMenu.defaultOrders || []);
    },

    saveOrders(orders) {
      save(STORAGE_KEYS.ORDERS, orders);
      this.emit('orders-changed', { orders });
    },

    async fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const orders = await res.json();
          this.saveOrders(orders);
          return orders;
        }
      } catch (e) {}
      return this.getOrders();
    },

    async createOrder(orderData) {
      const currentTable = this.getCurrentTable();
      const orderType = orderData.orderType || (currentTable ? 'dine_in' : 'delivery');
      const tableNumber = orderData.tableNumber || currentTable || null;

      const code = 'CTM-' + Math.floor(1000 + Math.random() * 9000);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${timeStr}`;

      const payload = {
        orderCode: code,
        orderType: orderType,
        tableNumber: tableNumber,
        customerName: orderData.customerName,
        phone: orderData.phone || '',
        address: orderData.address || (orderType === 'dine_in' ? `Ăn tại bàn ${tableNumber}` : ''),
        notes: orderData.notes || '',
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        shippingFee: orderType === 'dine_in' ? 0 : (orderData.shippingFee || 0),
        pointsUsed: orderData.pointsUsed || 0,
        discountAmount: orderData.discountAmount || 0,
        totalAmount: orderData.totalAmount || 0,
        paymentMethod: orderData.paymentMethod || 'vietqr'
      };

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          const orders = this.getOrders();
          orders.unshift(created);
          this.saveOrders(orders);
          this.clearCart();
          this.fetchTables();
          return created;
        }
      } catch (e) {}

      // Fallback local
      const newOrder = {
        id: 'ord_' + Date.now(),
        orderCode: code,
        orderType: orderType,
        tableNumber: tableNumber,
        createdAt: dateStr,
        ...payload,
        paymentStatus: payload.paymentMethod === 'cod' ? 'cod' : 'pending',
        orderStatus: payload.paymentMethod === 'vietqr' ? 'pending_payment' : 'cooking',
        pointsEarned: Math.floor((payload.totalAmount || 0) / 10000),
        timeline: [
          { time: timeStr, title: orderType === 'dine_in' ? `Đã gọi món tại ${tableNumber}` : 'Đã tiếp nhận đơn hàng', desc: `Đơn hàng ${code} ghi nhận thành công.` }
        ]
      };
      const orders = this.getOrders();
      orders.unshift(newOrder);
      this.saveOrders(orders);
      this.clearCart();
      return newOrder;
    },

    async updateOrderStatus(orderId, newStatus, reason = '') {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
          const updated = await res.json();
          const orders = this.getOrders();
          const idx = orders.findIndex(o => o.id === orderId || o.orderCode === orderId);
          if (idx !== -1) orders[idx] = updated;
          this.saveOrders(orders);
          this.fetchTables();
          return updated;
        }
      } catch (e) {}

      const orders = this.getOrders();
      const order = orders.find(o => o.id === orderId || o.orderCode === orderId);
      if (!order) return null;
      order.orderStatus = newStatus;
      this.saveOrders(orders);
      return order;
    },

    async approveOrderPayment(orderId) {
      try {
        const res = await fetch(`/api/orders/${orderId}/approve`, { method: 'POST' });
        if (res.ok) {
          const updated = await res.json();
          const orders = this.getOrders();
          const idx = orders.findIndex(o => o.id === orderId || o.orderCode === orderId);
          if (idx !== -1) orders[idx] = updated;
          this.saveOrders(orders);
          this.fetchTables();
          this.emit('payment-approved', { order: updated });
          return updated;
        }
      } catch (e) {}

      const orders = this.getOrders();
      const order = orders.find(o => o.id === orderId || o.orderCode === orderId);
      if (!order) return null;
      order.paymentStatus = 'paid';
      order.orderStatus = 'cooking';
      this.saveOrders(orders);
      return order;
    },

    findOrdersByPhoneOrCode(query) {
      const q = query.trim().toUpperCase();
      const orders = this.getOrders();
      return orders.filter(o => 
        (o.orderCode || '').toUpperCase().includes(q) || 
        (o.phone || '').includes(q) ||
        (o.tableNumber || '').toUpperCase().includes(q)
      );
    },

    // Background sync with PostgreSQL
    async syncAll() {
      await Promise.all([
        this.fetchDishes(),
        this.fetchOrders(),
        this.fetchTables(),
        this.fetchUsers()
      ]);
    },

    resetToFactoryDemo() {
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.CART);
      this.clearCurrentTable();
      save(STORAGE_KEYS.ORDERS, initialMenu.defaultOrders || []);
      save(STORAGE_KEYS.DISHES, initialMenu.dishes || []);
      this.syncAll();
      this.emit('orders-changed', { orders: this.getOrders() });
      this.emit('dishes-changed', { dishes: this.getDishes() });
    }
  };

  // Auto sync on load & interval polling for realtime kitchen updates
  ComTamStore.syncAll();
  setInterval(() => {
    ComTamStore.fetchOrders();
    ComTamStore.fetchTables();
  }, 4000);

  window.ComTamStore = ComTamStore;
})();
