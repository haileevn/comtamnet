/**
 * Com Tam Ong Map (comtam.net) - Complete Order, Membership & Admin System
 */
(() => {
  "use strict";

  const store = window.ComTamStore;
  const currencyFormatter = new Intl.NumberFormat('vi-VN');
  const formatPrice = n => currencyFormatter.format(n);

  // --- Sound & Audio Chime System ---
  let soundEnabled = true;

  function playOrderChime() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      // High-pitched pleasant restaurant bell chime: E6 (1318Hz) -> G#6 (1661Hz)
      playTone(1318.5, 0.0, 0.6);
      playTone(1661.2, 0.15, 0.85);
    } catch (err) {
      console.warn('Audio chime warning:', err);
    }
  }
  window.playOrderChime = playOrderChime;

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    let container = document.querySelector('#toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span style="font-size:16px;font-weight:700;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
  window.showToast = showToast;

  // --- Copy Helper ---
  function copyText(text, label = 'nội dung') {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Đã sao chép ${label}: ${text}`, 'success');
    }).catch(() => {
      showToast(`Sao chép thất bại`, 'warning');
    });
  }
  window.copyText = copyText;

  // --- Update Header Badges & State ---
  function updateTableUI() {
    const table = store.getCurrentTable();
    const bar = document.querySelector('#dinein-table-bar');
    const label = document.querySelector('#dinein-table-label');
    const headerBtn = document.querySelector('#btn-table-nav');
    const headerText = document.querySelector('#header-table-text');

    if (table) {
      if (bar) bar.style.display = 'block';
      if (label) label.textContent = table.toUpperCase();
      if (headerBtn) headerBtn.style.display = 'inline-flex';
      if (headerText) headerText.textContent = table;
    } else {
      if (bar) bar.style.display = 'none';
      if (headerBtn) headerBtn.style.display = 'none';
    }
  }

  function updateHeaderState() {
    const user = store.getCurrentUser();
    const cart = store.getCart();
    
    // Update Cart Badge
    const cartBadge = document.querySelector('#cart-badge');
    if (cartBadge) {
      const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      cartBadge.textContent = totalItems;
      cartBadge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
    }

    // Update Member Button (Ensure no duplicate "Quản Trị" buttons)
    const memberBtn = document.querySelector('#btn-member-nav');
    if (memberBtn) {
      if (user && user.role === 'customer') {
        const shortName = user.name.split(' ').slice(-1)[0] || user.name;
        memberBtn.innerHTML = `<span class="btn-icon">💳</span> <span>${shortName}</span> <span class="user-points-pill">${user.points || 0}đ</span>`;
      } else if (user && user.role === 'admin') {
        memberBtn.innerHTML = `<span class="btn-icon">👑</span> <span>Hội Viên VIP</span>`;
      } else {
        memberBtn.innerHTML = `<span class="btn-icon">💳</span> <span>Thẻ Hội Viên</span>`;
      }
    }

    // Update Admin Nav Button
    const adminBtn = document.querySelector('#btn-admin-nav');
    if (adminBtn) {
      adminBtn.innerHTML = `<span class="btn-icon">⚙️</span> <span>Quản Trị Bếp</span>`;
    }

    updateTableUI();
  }

  // --- Dine-In Table & Waiter Calls ---
  function openWaiterModal() {
    const modal = document.querySelector('#waiter-modal-overlay');
    const body = document.querySelector('#waiter-modal-body');
    if (!modal || !body) return;

    const currentTable = store.getCurrentTable() || 'Bàn 01';

    body.innerHTML = `
      <div style="margin-bottom:16px;text-align:center;">
        <span class="dinein-badge" style="font-size:12px;padding:4px 14px;">ĐANG NGỒI TẠI</span>
        <h3 style="margin:6px 0 2px;font-size:24px;color:var(--primary-color);">${currentTable.toUpperCase()}</h3>
        <p style="font-size:12.5px;color:var(--text-muted);margin:0;">Bấm yêu cầu bạn cần để nhân viên phục vụ tận bàn ngay lập tức:</p>
      </div>

      <div class="waiter-options-grid">
        <button type="button" class="waiter-opt-card" onclick="window.ComTamApp.submitWaiterCall('Xin thêm nước mắm kẹo & ớt tươi')">
          <div class="waiter-opt-icon">🥢</div>
          <div>
            <strong class="waiter-opt-title">Thêm Nước Mắm Kẹo</strong>
            <span class="waiter-opt-desc">Chén nước mắm pha kẹo chuẩn vị, ớt xiêm, tỏi</span>
          </div>
        </button>

        <button type="button" class="waiter-opt-card" onclick="window.ComTamApp.submitWaiterCall('Xin thêm đá lạnh & trà đá')">
          <div class="waiter-opt-icon">🧊</div>
          <div>
            <strong class="waiter-opt-title">Thêm Đá / Trà Đá</strong>
            <span class="waiter-opt-desc">Ly đá lạnh sảng khoái hoặc châm đầy bình trà đá</span>
          </div>
        </button>

        <button type="button" class="waiter-opt-card" onclick="window.ComTamApp.submitWaiterCall('Xin thêm khăn lạnh & tăm tre')">
          <div class="waiter-opt-icon">🧻</div>
          <div>
            <strong class="waiter-opt-title">Khăn Lạnh & Tăm Tre</strong>
            <span class="waiter-opt-desc">Khăn ướt ướp lạnh thơm dịu, tăm tre sạch</span>
          </div>
        </button>

        <button type="button" class="waiter-opt-card" onclick="window.ComTamApp.submitWaiterCall('Xin thêm chén canh nóng / mỡ hành')">
          <div class="waiter-opt-icon">🥣</div>
          <div>
            <strong class="waiter-opt-title">Thêm Canh & Mỡ Hành</strong>
            <span class="waiter-opt-desc">Chén canh nóng hổi, thêm mỡ hành tóp mỡ giòn</span>
          </div>
        </button>

        <button type="button" class="waiter-opt-card" onclick="window.ComTamApp.submitWaiterCall('Nhờ nhân viên dọn dẹp bàn ăn')">
          <div class="waiter-opt-icon">🧹</div>
          <div>
            <strong class="waiter-opt-title">Nhờ Dọn Dẹp Bàn</strong>
            <span class="waiter-opt-desc">Dọn dĩa đã dùng, lau bàn sạch sẽ</span>
          </div>
        </button>

        <button type="button" class="waiter-opt-card" onclick="window.ComTamApp.submitWaiterCall('Yêu cầu thanh toán / In hóa đơn tại bàn')">
          <div class="waiter-opt-icon">💳</div>
          <div>
            <strong class="waiter-opt-title">Tính Tiền Tại Bàn</strong>
            <span class="waiter-opt-desc">Mang hóa đơn và máy POS / mã VietQR lại bàn</span>
          </div>
        </button>
      </div>

      <div style="background:#f9f6f0;padding:14px;border-radius:var(--radius-sm);border:1px solid #ebdccf;">
        <label for="custom-waiter-note" style="display:block;font-size:12.5px;font-weight:700;margin-bottom:6px;color:var(--dark-ink);">Nhu cầu gọi nhân viên khác:</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="custom-waiter-note" class="form-control" placeholder="Ví dụ: Xin thêm chén dĩa cho trẻ nhỏ, xin thêm chanh tươi...">
          <button type="button" class="btn-checkout" style="width:auto;padding:0 20px;white-space:nowrap;" onclick="window.ComTamApp.submitCustomWaiterCall()">Gửi</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  function closeWaiterModal() {
    const modal = document.querySelector('#waiter-modal-overlay');
    if (modal) modal.classList.remove('active');
  }

  async function submitWaiterCall(requestType) {
    const table = store.getCurrentTable() || 'Bàn 01';
    await store.callWaiter(table, requestType);
    playOrderChime();
    closeWaiterModal();
    showToast(`🔔 Đã gọi phục vụ: "${requestType}" cho ${table}! Nhân viên đang đến ngay.`, 'success');
  }

  async function submitCustomWaiterCall() {
    const input = document.querySelector('#custom-waiter-note');
    const text = input ? input.value.trim() : '';
    if (!text) {
      showToast('Vui lòng nhập nội dung cần gọi phục vụ', 'warning');
      return;
    }
    await submitWaiterCall(text);
  }

  function viewCurrentTableOrders() {
    const table = store.getCurrentTable();
    if (!table) {
      showToast('Bạn chưa chọn bàn ăn', 'warning');
      return;
    }
    const modal = document.querySelector('#table-orders-modal-overlay');
    const body = document.querySelector('#table-orders-modal-body');
    if (!modal || !body) return;

    const allOrders = store.getOrders();
    const tableOrders = allOrders.filter(o => (o.tableNumber === table || o.table_number === table) && o.orderStatus !== 'cancelled' && o.order_status !== 'cancelled');

    if (tableOrders.length === 0) {
      body.innerHTML = `
        <div style="text-align:center;padding:34px 10px;">
          <div style="font-size:44px;margin-bottom:12px;">🍽️</div>
          <h4 style="margin:0 0 6px;color:var(--dark-ink);font-size:17px;">Bàn này chưa có món nào được gọi</h4>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:18px;">Hãy quay lại bàn xoay tròn và bấm "⚡ Đặt" các dĩa cơm tấm thơm ngon nhé!</p>
          <button type="button" class="btn-checkout" style="width:auto;padding:10px 24px;margin:0 auto;display:inline-flex;" onclick="document.querySelector('#table-orders-modal-overlay').classList.remove('active')">Khám Phá Thực Đơn</button>
        </div>
      `;
    } else {
      let grandTotal = 0;
      let ordersHtml = tableOrders.map(ord => {
        grandTotal += (ord.totalAmount || ord.total_amount || 0);
        const items = ord.items || [];
        const status = ord.orderStatus || ord.order_status || 'cooking';
        let statusText = '🔥 Bếp đang nướng sườn';
        if (status === 'completed') statusText = '✓ Đã hoàn tất';
        else if (status === 'pending_payment') statusText = '⏳ Chờ thanh toán';

        return `
          <div style="background:#fdfaf6;border:1px solid #ebdccf;border-radius:var(--radius-sm);padding:14px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px dashed #ebdccf;padding-bottom:6px;">
              <div>
                <strong style="color:var(--primary-color);font-size:14px;">${ord.orderCode || ord.order_code}</strong>
                <span style="font-size:11.5px;color:var(--text-muted);margin-left:8px;">${ord.createdAt || ord.created_at || ''}</span>
              </div>
              <span class="order-status-badge ${status}">
                ${statusText}
              </span>
            </div>
            <div>
              ${items.map(it => `
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;">
                  <span><strong>${it.quantity}x</strong> ${it.name} ${(it.toppings && it.toppings.length) ? `<small style="color:var(--primary-color);">(${it.toppings.join(', ')})</small>` : ''}</span>
                  <span style="font-weight:600;">${formatPrice(it.price * it.quantity)} đ</span>
                </div>
              `).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px dashed #ebdccf;font-weight:700;font-size:13.5px;">
              <span>Tổng tiền đơn này:</span>
              <span style="color:var(--primary-color);">${formatPrice(ord.totalAmount || ord.total_amount || 0)} đ</span>
            </div>
          </div>
        `;
      }).join('');

      body.innerHTML = `
        <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <span class="dinein-badge">HÓA ĐƠN BÀN ĂN</span>
            <strong style="font-size:18px;margin-left:6px;color:var(--dark-ink);">${table.toUpperCase()}</strong>
          </div>
          <div style="font-size:13.5px;font-weight:700;">
            Tổng thanh toán: <span style="font-size:18px;color:var(--primary-color);">${formatPrice(grandTotal)} đ</span>
          </div>
        </div>
        <div style="max-height:360px;overflow-y:auto;padding-right:4px;">
          ${ordersHtml}
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button type="button" class="btn-sm-action" style="flex:1;padding:10px;" onclick="document.querySelector('#table-orders-modal-overlay').classList.remove('active')">
            ➕ Gọi Thêm Món
          </button>
          <button type="button" class="btn-checkout" style="flex:1;padding:10px;" onclick="document.querySelector('#table-orders-modal-overlay').classList.remove('active'); window.ComTamApp.submitWaiterCall('Yêu cầu thanh toán / In hóa đơn tại bàn');">
            💳 Yêu Cầu Tính Tiền
          </button>
        </div>
      `;
    }

    modal.classList.add('active');
  }

  function promptSwitchTable() {
    const modal = document.querySelector('#switch-table-modal-overlay');
    const body = document.querySelector('#switch-table-modal-body');
    if (!modal || !body) return;

    const current = store.getCurrentTable();

    body.innerHTML = `
      <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px;">
        Vui lòng chọn số bàn bạn đang ngồi tại quán Cơm Tấm Ông Mập:
      </p>
      <div class="switch-table-grid">
        ${Array.from({ length: 12 }, (_, i) => {
          const num = `Bàn ${String(i + 1).padStart(2, '0')}`;
          const isAct = (current === num);
          const cap = i < 4 ? '2 người' : (i < 8 ? '4 người' : '6 người');
          return `
            <div class="table-select-card ${isAct ? 'active' : ''}" onclick="window.ComTamApp.selectTable('${num}')">
              <span class="table-num">${num}</span>
              <span class="table-cap">${cap}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div style="border-top:1px dashed #ebdccf;padding-top:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <button type="button" class="btn-sm-action danger" onclick="window.ComTamApp.clearTable()">
          📦 Chuyển sang đặt mang về (Giao tận nơi)
        </button>
        <button type="button" class="btn-sm-action" onclick="document.querySelector('#switch-table-modal-overlay').classList.remove('active')">
          Đóng
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  function selectTable(tableNum) {
    store.setCurrentTable(tableNum);
    showToast(`Đã chuyển phục vụ tại: ${tableNum}`, 'success');
    document.querySelector('#switch-table-modal-overlay')?.classList.remove('active');
    updateTableUI();
  }

  function clearTable() {
    store.clearCurrentTable();
    showToast('Đã chuyển sang chế độ Giao hàng tận nơi (Takeaway / Delivery)', 'info');
    document.querySelector('#switch-table-modal-overlay')?.classList.remove('active');
    updateTableUI();
  }

  // --- Cart Drawer Management ---
  let usePointsApplied = false;

  function openCartDrawer() {
    renderCartDrawer();
    const overlay = document.querySelector('#cart-drawer-overlay');
    if (overlay) overlay.classList.add('active');
  }

  function closeCartDrawer() {
    const overlay = document.querySelector('#cart-drawer-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  function renderCartDrawer() {
    const cart = store.getCart();
    const user = store.getCurrentUser();
    const container = document.querySelector('#cart-items-container');
    const footer = document.querySelector('#cart-footer-container');
    if (!container || !footer) return;

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">🍚</div>
          <p style="font-weight:700;font-size:16px;color:var(--dark-ink);margin:0 0 6px;">Giỏ hàng của bạn đang trống</p>
          <p style="font-size:13px;margin:0 0 16px;">Hãy xoay bàn tròn và chọn dĩa cơm tấm thơm ngon nhé!</p>
          <button type="button" class="btn-direct-order" onclick="document.querySelector('#cart-drawer-overlay').classList.remove('active');" style="margin:0 auto;display:inline-flex;">Khám phá thực đơn</button>
        </div>
      `;
      footer.style.display = 'none';
      return;
    }

    footer.style.display = 'block';

    let itemsHtml = '';
    cart.forEach((item, idx) => {
      const toppingsText = (item.toppings && item.toppings.length > 0) ? `+ ${item.toppings.join(', ')}` : 'Nguyên bản chuẩn vị';
      const notesHtml = item.notes ? `<div class="cart-item-notes">📝 Ghi chú: ${item.notes}</div>` : '';
      const lineTotal = item.price * item.quantity;

      itemsHtml += `
        <div class="cart-item">
          <img src="assets/${item.image}" class="cart-item-img" alt="${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-toppings">${toppingsText}</div>
            ${notesHtml}
            <div class="cart-item-price">${formatPrice(lineTotal)} <small>đ</small></div>
            <div class="cart-item-actions">
              <button type="button" class="qty-btn" onclick="window.ComTamApp.changeCartQty(${idx}, ${item.quantity - 1})">−</button>
              <span class="qty-val">${item.quantity}</span>
              <button type="button" class="qty-btn" onclick="window.ComTamApp.changeCartQty(${idx}, ${item.quantity + 1})">+</button>
              <button type="button" class="cart-item-delete" title="Xóa món" onclick="window.ComTamApp.removeCartItem(${idx})">🗑</button>
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = itemsHtml;

    // Calculate totals
    const subtotal = store.getCartSubtotal();
    const shippingFee = subtotal >= 150000 ? 0 : 18000;
    
    // Points discount
    let maxUsablePoints = 0;
    let pointsDiscount = 0;
    if (user && user.points > 0) {
      maxUsablePoints = Math.min(user.points, Math.floor(subtotal / 200));
      if (usePointsApplied) {
        pointsDiscount = maxUsablePoints * 100;
      }
    } else {
      usePointsApplied = false;
    }

    const finalTotal = Math.max(0, subtotal + shippingFee - pointsDiscount);

    footer.innerHTML = `
      ${user && user.points > 0 ? `
        <div class="cart-points-box">
          <label>
            <input type="checkbox" id="use-member-points-cb" ${usePointsApplied ? 'checked' : ''} onchange="window.ComTamApp.toggleUsePoints(this.checked)">
            <span>Dùng <b>${maxUsablePoints} điểm</b> VIP (-${formatPrice(maxUsablePoints * 100)} đ)</span>
          </label>
          <span style="font-size:11px;color:var(--text-muted);">Khả dụng: ${user.points}đ</span>
        </div>
      ` : ''}
      <div class="cart-summary-row">
        <span>Tạm tính món</span>
        <span>${formatPrice(subtotal)} đ</span>
      </div>
      <div class="cart-summary-row">
        <span>Phí giao hàng ${subtotal >= 150000 ? '<small style="color:#27ae60;">(Freeship >150k)</small>' : ''}</span>
        <span>${shippingFee === 0 ? '<b style="color:#27ae60;">Miễn phí</b>' : formatPrice(shippingFee) + ' đ'}</span>
      </div>
      ${pointsDiscount > 0 ? `
        <div class="cart-summary-row" style="color:var(--primary-color);">
          <span>Giảm giá thẻ thành viên</span>
          <span>-${formatPrice(pointsDiscount)} đ</span>
        </div>
      ` : ''}
      <div class="cart-summary-row total-row">
        <span>Tổng thanh toán</span>
        <span style="color:var(--primary-color);">${formatPrice(finalTotal)} đ</span>
      </div>
      <button type="button" class="btn-checkout" onclick="window.ComTamApp.openCheckoutModal()">
        <span>Tiến Hành Đặt Hàng</span> <span>→</span>
      </button>
    `;
  }

  // --- Topping Customization Modal ---
  let currentCustomizingDish = null;

  function openToppingModal(dish) {
    currentCustomizingDish = dish;
    const modal = document.querySelector('#topping-modal-overlay');
    const container = document.querySelector('#topping-modal-body');
    if (!modal || !container) return;

    const toppingsList = (restaurantMenu && restaurantMenu.toppings) ? restaurantMenu.toppings : [
      { id: "top_egg", name: "Trứng ốp la lòng đào", price: 10000 },
      { id: "top_cha", name: "Chả trứng hoàng kim hấp", price: 15000 },
      { id: "top_bi", name: "Bì heo thính thơm giòn", price: 12000 },
      { id: "top_suon", name: "Sườn cốt lết than hoa thêm", price: 35000 },
      { id: "top_topmo", name: "Chén tóp mỡ mỡ hành giòn", price: 8000 },
      { id: "top_canh", name: "Chén canh khổ qua nhồi thịt", price: 25000 },
      { id: "top_com", name: "Thêm một chén cơm tấm", price: 10000 }
    ];

    container.innerHTML = `
      <div class="dish-preview-row">
        <img src="assets/${dish.image}" class="dish-preview-img" alt="${dish.name}">
        <div>
          <h4 style="margin:0 0 4px;font-size:16px;color:var(--dark-ink);">${dish.name}</h4>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">${dish.category}</div>
          <div style="font-size:16px;font-weight:700;color:var(--primary-color);">${formatPrice(dish.price)} <small>đ</small></div>
        </div>
      </div>

      <div class="toppings-group-title">Chọn topping ăn kèm (tùy chọn)</div>
      <div class="toppings-grid" id="toppings-grid-select">
        ${toppingsList.map(top => `
          <label class="topping-checkbox-card" data-id="${top.id}" data-name="${top.name}" data-price="${top.price}">
            <input type="checkbox" name="dish-topping" value="${top.id}" onchange="window.ComTamApp.updateToppingTotal()">
            <div class="topping-info">
              <span class="topping-name">${top.name}</span>
              <span class="topping-price">+${formatPrice(top.price)} đ</span>
            </div>
          </label>
        `).join('')}
      </div>

      <div class="form-group">
        <label for="topping-dish-notes">Ghi chú cho quán cơm tấm:</label>
        <textarea id="topping-dish-notes" class="order-notes-input" rows="2" placeholder="Ví dụ: Nhiều mỡ hành tóp mỡ, nước mắm ớt riêng, ít cơm..."></textarea>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #f0e9df;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:13px;font-weight:600;color:var(--dark-ink);">Số lượng:</span>
          <button type="button" class="qty-btn" onclick="window.ComTamApp.changeToppingModalQty(-1)">−</button>
          <span id="topping-modal-qty" style="font-weight:700;font-size:15px;min-width:20px;text-align:center;">1</span>
          <button type="button" class="qty-btn" onclick="window.ComTamApp.changeToppingModalQty(1)">+</button>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:var(--text-muted);">Tổng món này:</div>
          <div id="topping-modal-total" style="font-size:18px;font-weight:800;color:var(--primary-color);">${formatPrice(dish.price)} đ</div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  function closeToppingModal() {
    const modal = document.querySelector('#topping-modal-overlay');
    if (modal) modal.classList.remove('active');
    currentCustomizingDish = null;
  }

  function updateToppingTotal() {
    if (!currentCustomizingDish) return;
    const qty = parseInt(document.querySelector('#topping-modal-qty')?.textContent || '1', 10);
    const selectedBoxes = document.querySelectorAll('#toppings-grid-select input[type="checkbox"]:checked');
    let extraCost = 0;
    selectedBoxes.forEach(box => {
      const card = box.closest('.topping-checkbox-card');
      if (card) {
        card.classList.add('selected');
        extraCost += parseInt(card.dataset.price || '0', 10);
      }
    });
    document.querySelectorAll('#toppings-grid-select input[type="checkbox"]:not(:checked)').forEach(box => {
      box.closest('.topping-checkbox-card')?.classList.remove('selected');
    });

    const singleItemTotal = currentCustomizingDish.price + extraCost;
    const finalTotal = singleItemTotal * qty;
    const totalEl = document.querySelector('#topping-modal-total');
    if (totalEl) totalEl.textContent = formatPrice(finalTotal) + ' đ';
  }

  function confirmAddToppingToCart() {
    if (!currentCustomizingDish) return;
    const qty = parseInt(document.querySelector('#topping-modal-qty')?.textContent || '1', 10);
    const selectedBoxes = document.querySelectorAll('#toppings-grid-select input[type="checkbox"]:checked');
    const selectedToppings = [];
    let extraCost = 0;

    selectedBoxes.forEach(box => {
      const card = box.closest('.topping-checkbox-card');
      if (card) {
        selectedToppings.push(`${card.dataset.name} (+${formatPrice(parseInt(card.dataset.price, 10))}đ)`);
        extraCost += parseInt(card.dataset.price || '0', 10);
      }
    });

    const notes = document.querySelector('#topping-dish-notes')?.value.trim() || '';

    store.addToCart({
      dishId: currentCustomizingDish.id,
      name: currentCustomizingDish.name,
      price: currentCustomizingDish.price + extraCost,
      unitPrice: currentCustomizingDish.price,
      image: currentCustomizingDish.image,
      quantity: qty,
      toppings: selectedToppings,
      toppingsCost: extraCost,
      notes: notes
    });

    showToast(`Đã thêm ${qty} phần ${currentCustomizingDish.name} vào giỏ hàng!`, 'success');
    closeToppingModal();
    openCartDrawer();
  }

  // --- Checkout & VietQR Modal ---
  let countdownTimer = null;
  let currentGeneratedOrderCode = '';

  function openCheckoutModal() {
    closeCartDrawer();
    const cart = store.getCart();
    if (cart.length === 0) {
      showToast('Giỏ hàng trống!', 'warning');
      return;
    }

    const modal = document.querySelector('#checkout-modal-overlay');
    const body = document.querySelector('#checkout-modal-body');
    if (!modal || !body) return;

    const user = store.getCurrentUser();
    const currentTable = store.getCurrentTable();
    const isDineIn = Boolean(currentTable);

    const subtotal = store.getCartSubtotal();
    const shippingFee = isDineIn ? 0 : (subtotal >= 150000 ? 0 : 18000);
    let pointsDiscount = 0;
    let pointsUsed = 0;
    if (user && user.points > 0 && usePointsApplied) {
      pointsUsed = Math.min(user.points, Math.floor(subtotal / 200));
      pointsDiscount = pointsUsed * 100;
    }
    const finalTotal = Math.max(0, subtotal + shippingFee - pointsDiscount);

    currentGeneratedOrderCode = 'CTM-' + Math.floor(1000 + Math.random() * 9000);

    body.innerHTML = `
      <form id="checkout-form" onsubmit="window.ComTamApp.handleCheckoutSubmit(event)">
        <div class="checkout-grid">
          <div>
            ${isDineIn ? `
              <div style="background:#fff6ee;border:1.5px solid var(--primary-color);padding:12px 14px;border-radius:var(--radius-sm);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <span class="dinein-badge" style="font-size:10px;">ORDER TẠI BÀN (POSTGRESQL SYNC)</span>
                  <strong style="display:block;font-size:16px;color:var(--primary-color);margin-top:2px;">Quý khách đang ngồi tại ${currentTable}</strong>
                  <span style="font-size:11.5px;color:var(--text-muted);">Miễn phí phục vụ 0đ · Bếp nướng sườn than hoa phục vụ tận bàn</span>
                </div>
                <button type="button" class="btn-sm-action" onclick="window.ComTamApp.promptSwitchTable()">Đổi Bàn</button>
              </div>
              <input type="hidden" id="order-cust-address" value="Ăn tại quán — ${currentTable}">
            ` : ''}

            <h4 style="margin:0 0 14px;font-size:15px;color:var(--dark-ink);border-bottom:1px solid #ebdccf;padding-bottom:6px;">
              ${isDineIn ? '👤 Thông tin khách dùng bữa' : '📍 Thông tin người nhận'}
            </h4>
            <div class="form-group">
              <label for="order-cust-name">Họ và tên ${isDineIn ? '(hoặc tên bàn)' : '*'} </label>
              <input type="text" id="order-cust-name" class="form-control" required value="${user ? user.name : (isDineIn ? `Khách ${currentTable}` : '')}" placeholder="Ví dụ: Nguyễn Văn Tuấn">
            </div>
            <div class="form-group">
              <label for="order-cust-phone">Số điện thoại ${isDineIn ? '(để tích điểm thẻ VIP)' : '*'} </label>
              <input type="tel" id="order-cust-phone" class="form-control" ${isDineIn ? '' : 'required'} value="${user ? user.phone : ''}" placeholder="Ví dụ: 0908123456">
            </div>
            ${!isDineIn ? `
              <div class="form-group">
                <label for="order-cust-address">Địa chỉ giao cơm chi tiết *</label>
                <input type="text" id="order-cust-address" class="form-control" required value="${user && user.address ? user.address : ''}" placeholder="Số nhà, tên đường, phường/xã, quận...">
              </div>
            ` : ''}
            <div class="form-group">
              <label for="order-cust-notes">Ghi chú khẩu vị cho đầu bếp</label>
              <textarea id="order-cust-notes" class="form-control" rows="2" placeholder="${isDineIn ? 'Ví dụ: Sườn nướng giòn viền, nhiều mỡ hành tóp mỡ, ít cơm...' : 'Ví dụ: Giao trước 12h, gọi trước khi đến...'}"></textarea>
            </div>
          </div>

          <div>
            <h4 style="margin:0 0 14px;font-size:15px;color:var(--dark-ink);border-bottom:1px solid #ebdccf;padding-bottom:6px;">
              💳 Phương thức thanh toán
            </h4>
            <div class="payment-options">
              <label class="payment-option-card selected" data-method="vietqr" onclick="window.ComTamApp.selectPaymentMethod('vietqr')">
                <input type="radio" name="payment-method" value="vietqr" checked style="accent-color:var(--primary-color);">
                <div class="payment-option-icon">⚡</div>
                <div class="payment-option-text">
                  <strong>Chuyển khoản VietQR ${isDineIn ? 'tại bàn' : '(Napas 24/7)'}</strong>
                  <small>Quét mã ngân hàng tự động điền số tiền, bếp nướng sườn ngay</small>
                </div>
              </label>

              <label class="payment-option-card" data-method="cod" onclick="window.ComTamApp.selectPaymentMethod('cod')">
                <input type="radio" name="payment-method" value="cod" style="accent-color:var(--primary-color);">
                <div class="payment-option-icon">💵</div>
                <div class="payment-option-text">
                  <strong>${isDineIn ? 'Thanh toán sau tại bàn / quầy thu ngân' : 'Tiền mặt khi nhận cơm (COD)'}</strong>
                  <small>${isDineIn ? 'Bếp nhận đơn làm ngay, dùng bữa xong thanh toán tiền mặt/thẻ' : 'Thanh toán trực tiếp cho shipper khi nhận cơm tấm'}</small>
                </div>
              </label>
            </div>

            <div id="vietqr-display-box" class="vietqr-box">
              <div class="vietqr-header">
                <div style="font-weight:700;font-size:13px;color:#0054a6;">VIETCOMBANK · NAPAS 24/7</div>
                <div class="payment-countdown" id="payment-timer">⏳ 05:00</div>
              </div>

              <div class="vietqr-img-wrapper">
                <img 
                  id="vietqr-live-img" 
                  class="vietqr-img" 
                  src="https://img.vietqr.io/image/970436-990812345678-compact2.png?amount=${finalTotal}&addInfo=COMTAM%20${currentGeneratedOrderCode}&accountName=COM%20TAM%20ONG%20MAP" 
                  alt="Mã VietQR Cơm Tấm Ông Mập"
                  onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=COMTAM_${currentGeneratedOrderCode}_${finalTotal}'"
                >
              </div>

              <table class="vietqr-info-table">
                <tr>
                  <td>Ngân hàng:</td>
                  <td>Vietcombank (VCB)</td>
                </tr>
                <tr>
                  <td>Số tài khoản:</td>
                  <td>
                    <span>990812345678</span>
                    <button type="button" class="btn-copy" onclick="window.copyText('990812345678', 'STK')">Copy</button>
                  </td>
                </tr>
                <tr>
                  <td>Chủ tài khoản:</td>
                  <td>COM TAM ONG MAP</td>
                </tr>
                <tr>
                  <td>Số tiền:</td>
                  <td>
                    <span style="color:var(--primary-color);">${formatPrice(finalTotal)} đ</span>
                    <button type="button" class="btn-copy" onclick="window.copyText('${finalTotal}', 'Số tiền')">Copy</button>
                  </td>
                </tr>
                <tr>
                  <td>Nội dung CK:</td>
                  <td>
                    <span style="color:#d9534f;font-weight:800;">COMTAM ${currentGeneratedOrderCode}</span>
                    <button type="button" class="btn-copy" onclick="window.copyText('COMTAM ${currentGeneratedOrderCode}', 'Nội dung')">Copy</button>
                  </td>
                </tr>
              </table>
            </div>

            <div style="margin-top:16px;background:#fcf9f4;padding:12px;border-radius:var(--radius-sm);border:1px solid #ede1d1;">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                <span>Tổng đơn hàng:</span>
                <span style="font-weight:700;font-size:16px;color:var(--primary-color);">${formatPrice(finalTotal)} đ</span>
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);">
                Tích lũy: +${Math.floor(finalTotal / 10000)} điểm thẻ thành viên
              </div>
            </div>

            <button type="submit" class="btn-checkout" style="margin-top:16px;">
              <span>${isDineIn ? '⚡ Xác Nhận Gọi Món Vào Bếp' : 'Hoàn Tất Đặt Hàng'}</span>
            </button>
          </div>
        </div>
      </form>
    `;

    startPaymentCountdown(300);
    modal.classList.add('active');
  }

  function closeCheckoutModal() {
    const modal = document.querySelector('#checkout-modal-overlay');
    if (modal) modal.classList.remove('active');
    if (countdownTimer) clearInterval(countdownTimer);
  }

  function startPaymentCountdown(durationSeconds) {
    if (countdownTimer) clearInterval(countdownTimer);
    let rem = durationSeconds;
    const timerEl = document.querySelector('#payment-timer');
    countdownTimer = setInterval(() => {
      rem--;
      if (rem <= 0) {
        clearInterval(countdownTimer);
        if (timerEl) timerEl.textContent = 'Hết thời gian quét';
      } else {
        const m = String(Math.floor(rem / 60)).padStart(2, '0');
        const s = String(rem % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `⏳ ${m}:${s}`;
      }
    }, 1000);
  }

  function selectPaymentMethod(method) {
    const cards = document.querySelectorAll('.payment-option-card');
    cards.forEach(c => {
      c.classList.toggle('selected', c.dataset.method === method);
      const radio = c.querySelector('input[type="radio"]');
      if (radio) radio.checked = (c.dataset.method === method);
    });

    const qrBox = document.querySelector('#vietqr-display-box');
    if (qrBox) {
      qrBox.style.display = method === 'vietqr' ? 'block' : 'none';
    }
  }

  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    const name = document.querySelector('#order-cust-name').value.trim();
    const phone = document.querySelector('#order-cust-phone').value.trim();
    const addressInput = document.querySelector('#order-cust-address');
    const notes = document.querySelector('#order-cust-notes').value.trim();
    const methodRadio = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = methodRadio ? methodRadio.value : 'vietqr';

    const currentTable = store.getCurrentTable();
    const isDineIn = Boolean(currentTable);
    const address = addressInput ? addressInput.value.trim() : (isDineIn ? `Ăn tại quán — ${currentTable}` : '');

    const cart = store.getCart();
    const user = store.getCurrentUser();
    const subtotal = store.getCartSubtotal();
    const shippingFee = isDineIn ? 0 : (subtotal >= 150000 ? 0 : 18000);
    let pointsDiscount = 0;
    let pointsUsed = 0;
    if (user && user.points > 0 && usePointsApplied) {
      pointsUsed = Math.min(user.points, Math.floor(subtotal / 200));
      pointsDiscount = pointsUsed * 100;
    }
    const finalTotal = Math.max(0, subtotal + shippingFee - pointsDiscount);

    const newOrder = await store.createOrder({
      orderType: isDineIn ? 'dine_in' : 'delivery',
      tableNumber: isDineIn ? currentTable : null,
      customerName: name || (isDineIn ? `Khách ${currentTable}` : 'Khách vãng lai'),
      phone: phone,
      address: address,
      notes: notes,
      items: cart,
      subtotal: subtotal,
      shippingFee: shippingFee,
      pointsUsed: pointsUsed,
      discountAmount: pointsDiscount,
      totalAmount: finalTotal,
      paymentMethod: paymentMethod
    });

    closeCheckoutModal();
    playOrderChime();
    showToast(`Đặt món thành công! Mã đơn: ${newOrder.orderCode || newOrder.order_code}`, 'success');
    
    // Auto open order tracking modal
    openTrackingModal(newOrder.orderCode || newOrder.order_code);
  }

  // --- Order Tracking Modal ---
  function openTrackingModal(prefillCode = '') {
    const modal = document.querySelector('#tracking-modal-overlay');
    if (!modal) return;

    const input = document.querySelector('#tracking-query-input');
    if (input && prefillCode) {
      input.value = prefillCode;
    }

    modal.classList.add('active');
    searchOrders(prefillCode || (input ? input.value : ''));
  }

  function closeTrackingModal() {
    const modal = document.querySelector('#tracking-modal-overlay');
    if (modal) modal.classList.remove('active');
  }

  function searchOrders(query = '') {
    const q = query.trim() || document.querySelector('#tracking-query-input')?.value.trim() || '';
    const container = document.querySelector('#tracking-results-container');
    if (!container) return;

    if (!q) {
      const user = store.getCurrentUser();
      const allOrders = store.getOrders();
      const matching = (user && user.role === 'customer') 
        ? allOrders.filter(o => o.phone === user.phone)
        : allOrders;

      if (matching.length > 0) {
        renderOrderTrackingDetail(matching[0]);
      } else {
        container.innerHTML = `
          <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
            <div style="font-size:40px;margin-bottom:12px;">🔍</div>
            <p style="font-weight:600;font-size:14px;color:var(--dark-ink);">Nhập Mã đơn hàng (VD: CTM-7821) hoặc Số điện thoại để tra cứu</p>
          </div>
        `;
      }
      return;
    }

    const results = store.findOrdersByPhoneOrCode(q);
    if (results.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          <div style="font-size:40px;margin-bottom:12px;">🍚</div>
          <p style="font-weight:700;font-size:15px;color:var(--dark-ink);margin-bottom:6px;">Không tìm thấy đơn hàng</p>
          <p style="font-size:13px;">Vui lòng kiểm tra lại Mã đơn hàng hoặc Số điện thoại đặt cơm.</p>
        </div>
      `;
      return;
    }

    renderOrderTrackingDetail(results[0], results.length > 1 ? results : null);
  }

  function renderOrderTrackingDetail(order, otherMatches = null) {
    const container = document.querySelector('#tracking-results-container');
    if (!container) return;

    const statusBadgeText = {
      'pending_payment': 'Chờ chuyển khoản VietQR',
      'cooking': 'Bếp đang nướng sườn',
      'delivering': 'Shipper đang giao hàng',
      'completed': 'Giao hàng thành công',
      'cancelled': 'Đơn hàng đã huỷ'
    };

    const timelineHtml = (order.timeline || []).map((step, idx) => `
      <div class="timeline-step active">
        <div class="step-node">${idx + 1}</div>
        <div class="step-content">
          <div class="step-title-row">
            <span class="step-title">${step.title}</span>
            <span class="step-time">${step.time}</span>
          </div>
          <p class="step-desc">${step.desc}</p>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      ${otherMatches ? `
        <div style="margin-bottom:14px;display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
          ${otherMatches.map(m => `
            <button type="button" class="btn-sm-action ${m.id === order.id ? 'active' : ''}" onclick="window.ComTamApp.viewSingleOrder('${m.id}')">
              ${m.orderCode} (${m.orderStatus})
            </button>
          `).join('')}
        </div>
      ` : ''}

      <div style="background:#faf7f2;border:1px solid #ebdccf;border-radius:var(--radius-md);padding:18px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
          <div>
            <span style="font-size:12px;color:var(--text-muted);">Mã đơn hàng:</span>
            <h3 style="margin:2px 0 0;font-size:20px;color:var(--dark-ink);font-weight:800;letter-spacing:1px;">${order.orderCode}</h3>
            <small style="color:var(--text-muted);">${order.createdAt}</small>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button type="button" class="btn-sm-action" onclick="window.ComTamApp.openKitchenTicket('${order.id}')" title="In phiếu chế biến / hoá đơn">
              🖨️ In Phiếu Bếp
            </button>
            <span class="status-badge ${order.orderStatus}">
              ● ${statusBadgeText[order.orderStatus] || order.orderStatus}
            </span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;border-top:1px dashed #ebdccf;padding-top:12px;">
          <div>
            <span style="color:var(--text-muted);display:block;">Khách hàng:</span>
            <strong>${order.customerName} - ${order.phone}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted);display:block;">Địa chỉ nhận:</span>
            <strong>${order.address}</strong>
          </div>
        </div>
        ${order.notes ? `
          <div style="font-size:12.5px;color:var(--primary-color);margin-top:8px;font-style:italic;">
            📝 Ghi chú: ${order.notes}
          </div>
        ` : ''}
      </div>

      <h4 style="margin:0 0 12px;font-size:15px;color:var(--dark-ink);">Tiến độ đơn hàng thời gian thực</h4>
      <div class="order-timeline-stepper">
        ${timelineHtml}
      </div>

      <h4 style="margin:20px 0 12px;font-size:15px;color:var(--dark-ink);">Chi tiết dĩa cơm tấm đã đặt</h4>
      <div style="border:1px solid #ebdccf;border-radius:var(--radius-md);overflow:hidden;background:#ffffff;">
        ${order.items.map(it => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f2e9de;">
            <img src="assets/${it.image}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:1px solid #ede1d1;">
            <div style="flex:1;">
              <strong style="font-size:13.5px;color:var(--dark-ink);">${it.name}</strong>
              <div style="font-size:11.5px;color:var(--text-muted);">${it.toppings && it.toppings.length ? it.toppings.join(', ') : 'Nguyên bản'}</div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:13px;font-weight:600;">x${it.quantity}</span>
              <div style="font-size:13.5px;font-weight:700;color:var(--primary-color);">${formatPrice(it.price * it.quantity)} đ</div>
            </div>
          </div>
        `).join('')}
        <div style="padding:14px 16px;background:#faf7f2;font-size:13px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span>Tạm tính món:</span>
            <span>${formatPrice(order.subtotal)} đ</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span>Phí giao hàng:</span>
            <span>${formatPrice(order.shippingFee)} đ</span>
          </div>
          ${order.discountAmount > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:var(--primary-color);">
              <span>Giảm điểm hội viên:</span>
              <span>-${formatPrice(order.discountAmount)} đ</span>
            </div>
          ` : ''}
          <div style="display:flex;justify-content:space-between;font-weight:800;font-size:16px;color:var(--dark-ink);border-top:1px dashed #e2d5c3;padding-top:8px;margin-top:6px;">
            <span>Tổng cộng:</span>
            <span style="color:var(--primary-color);">${formatPrice(order.totalAmount)} đ</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- Thermal Kitchen Ticket / Receipt Modal ---
  function openKitchenTicket(orderId) {
    const order = store.getOrders().find(o => o.id === orderId || o.orderCode === orderId);
    if (!order) {
      showToast('Không tìm thấy đơn hàng để in', 'error');
      return;
    }

    const modal = document.querySelector('#kitchen-ticket-modal-overlay');
    const container = document.querySelector('#kitchen-ticket-container');
    if (!modal || !container) return;

    const paymentText = order.paymentStatus === 'paid' 
      ? 'ĐÃ THANH TOÁN (VIETQR)' 
      : (order.paymentMethod === 'cod' ? 'THU TIỀN MẶT KHI GIAO (COD)' : 'CHỜ CHUYỂN KHOẢN');

    container.innerHTML = `
      <div class="receipt-paper">
        <div class="receipt-header">
          <h2>CƠM TẤM ÔNG MẬP</h2>
          <p>Website: comtam.net · Hotline: 1900 6868</p>
          <p>128 Võ Văn Tần, P. Võ Thị Sáu, Q.3, TP.HCM</p>
          <div class="receipt-badge">PHIẾU BẾP & GIAO HÀNG</div>
          <p style="font-size:14px;font-weight:900;margin-top:6px;">MÃ ĐƠN: ${order.orderCode}</p>
        </div>

        <div class="receipt-info-block">
          <div>Thời gian: ${order.createdAt}</div>
          <div>Khách hàng: <b>${order.customerName}</b> - ${order.phone}</div>
          <div>Địa chỉ: <b>${order.address}</b></div>
          <div>Thanh toán: <b>${paymentText}</b></div>
          ${order.notes ? `<div style="background:#fdf2e9;padding:4px;margin-top:4px;border:1px dashed #c86b2b;"><b>GHI CHÚ:</b> ${order.notes}</div>` : ''}
        </div>

        <table class="receipt-table">
          <thead>
            <tr>
              <th style="width:55%;">Món / Topping</th>
              <th style="width:15%;text-align:center;">SL</th>
              <th style="width:30%;text-align:right;">Tiền</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(it => `
              <tr>
                <td class="item-name">${it.name}</td>
                <td style="text-align:center;font-weight:900;">${it.quantity}</td>
                <td style="text-align:right;font-weight:700;">${formatPrice(it.price * it.quantity)}</td>
              </tr>
              ${it.toppings && it.toppings.length ? `
                <tr>
                  <td colspan="3" class="item-toppings">↳ ${it.toppings.join(', ')}</td>
                </tr>
              ` : ''}
            `).join('')}
          </tbody>
        </table>

        <div class="receipt-summary">
          <div class="receipt-summary-row">
            <span>Tạm tính:</span>
            <span>${formatPrice(order.subtotal)} đ</span>
          </div>
          <div class="receipt-summary-row">
            <span>Phí ship:</span>
            <span>${formatPrice(order.shippingFee)} đ</span>
          </div>
          ${order.discountAmount > 0 ? `
            <div class="receipt-summary-row">
              <span>Giảm thẻ VIP:</span>
              <span>-${formatPrice(order.discountAmount)} đ</span>
            </div>
          ` : ''}
          <div class="receipt-summary-row bold">
            <span>TỔNG THU:</span>
            <span>${formatPrice(order.totalAmount)} đ</span>
          </div>
        </div>

        <div class="receipt-footer-notes">
          <p>Quét QR kiểm tra đơn: comtam.net?code=${order.orderCode}</p>
          <p>*** Chúc quý khách ngon miệng! ***</p>
        </div>

        <div class="no-print" style="margin-top:20px;display:flex;gap:10px;justify-content:center;">
          <button type="button" class="btn-checkout" style="width:auto;padding:8px 18px;" onclick="window.print()">
            🖨️ In Phiếu Ngay
          </button>
          <button type="button" class="btn-sm-action" onclick="document.querySelector('#kitchen-ticket-modal-overlay').classList.remove('active')">
            Đóng
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  // --- VIP Membership & Auth Modal ---
  function openMembershipModal() {
    const modal = document.querySelector('#membership-modal-overlay');
    const body = document.querySelector('#membership-modal-body');
    if (!modal || !body) return;

    const user = store.getCurrentUser();
    if (!user || user.role === 'admin') {
      renderAuthForms(body);
    } else {
      renderMemberCardView(body, user);
    }

    modal.classList.add('active');
  }

  function closeMembershipModal() {
    const modal = document.querySelector('#membership-modal-overlay');
    if (modal) modal.classList.remove('active');
  }

  function renderAuthForms(container) {
    container.innerHTML = `
      <div style="display:flex;gap:12px;margin-bottom:20px;border-bottom:1px solid #ebdccf;padding-bottom:10px;">
        <button type="button" id="tab-auth-login" class="admin-nav-tab active" onclick="window.ComTamApp.switchAuthTab('login')">
          Đăng Nhập Khách Hàng
        </button>
        <button type="button" id="tab-auth-register" class="admin-nav-tab" onclick="window.ComTamApp.switchAuthTab('register')">
          Đăng Ký Hội Viên Mới
        </button>
      </div>

      <div style="background:#fff7ea;border:1px solid #f6dac1;border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>
          <strong style="font-size:13px;color:var(--dark-ink);display:block;">Trải nghiệm nhanh tài khoản VIP:</strong>
          <small style="color:var(--text-muted);">Khách hàng Nguyễn Văn Tuấn (Hạng Gold, 350 điểm)</small>
        </div>
        <button type="button" class="btn-sm-action" style="background:var(--primary-color);color:#fff;border-color:var(--primary-color);font-weight:700;" onclick="window.ComTamApp.quickLoginCustomer()">
          Đăng nhập ngay
        </button>
      </div>

      <form id="form-customer-login" onsubmit="window.ComTamApp.handleCustomerLogin(event)">
        <div class="form-group">
          <label for="cust-login-id">Số điện thoại hoặc Email</label>
          <input type="text" id="cust-login-id" class="form-control" required placeholder="0908123456" value="0908123456">
        </div>
        <div class="form-group">
          <label for="cust-login-pass">Mật khẩu</label>
          <input type="password" id="cust-login-pass" class="form-control" required placeholder="Nhập mật khẩu" value="123">
        </div>
        <button type="submit" class="btn-checkout" style="margin-top:14px;">
          Đăng Nhập Thẻ Thành Viên
        </button>
      </form>

      <form id="form-customer-register" style="display:none;" onsubmit="window.ComTamApp.handleCustomerRegister(event)">
        <div class="form-group">
          <label for="cust-reg-name">Họ và tên *</label>
          <input type="text" id="cust-reg-name" class="form-control" required placeholder="Ví dụ: Lê Minh Trí">
        </div>
        <div class="form-group">
          <label for="cust-reg-phone">Số điện thoại *</label>
          <input type="tel" id="cust-reg-phone" class="form-control" required placeholder="Ví dụ: 0987654321">
        </div>
        <div class="form-group">
          <label for="cust-reg-email">Email (tùy chọn)</label>
          <input type="email" id="cust-reg-email" class="form-control" placeholder="email@gmail.com">
        </div>
        <div class="form-group">
          <label for="cust-reg-pass">Mật khẩu *</label>
          <input type="password" id="cust-reg-pass" class="form-control" required placeholder="Tạo mật khẩu">
        </div>
        <button type="submit" class="btn-checkout" style="margin-top:14px;">
          Đăng Ký & Nhận Ngay 50 Điểm Thưởng
        </button>
      </form>
    `;
  }

  let activeMemberTab = 'card';

  function renderMemberCardView(container, user) {
    const tier = user.tier || 'Silver';
    const tierClass = tier === 'Diamond' ? 'tier-diamond' : tier === 'Gold' ? 'tier-gold' : 'tier-silver';
    const tierNameVi = tier === 'Diamond' ? 'HỘI VIÊN KIM CƯƠNG' : tier === 'Gold' ? 'HỘI VIÊN VÀNG' : 'HỘI VIÊN BẠC';
    const orders = store.getOrders().filter(o => o.phone === user.phone || (o.customerName || o.customer_name) === user.name);

    let tabContent = '';

    if (activeMemberTab === 'card') {
      tabContent = `
        <div class="vip-card-container">
          <div class="vip-card ${tierClass}">
            <div class="card-top-row">
              <span class="card-brand-name">CƠM TẤM ÔNG MẬP</span>
              <span class="card-tier-badge">${tierNameVi}</span>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;">
              <div class="card-chip"></div>
              <div style="font-size:18px;opacity:0.8;">📡 NFC VIP</div>
            </div>

            <div class="card-number">${user.membershipNumber || user.membership_number || 'CTM-8889-VIP'}</div>

            <div class="card-bottom-row">
              <div>
                <div style="font-size:9.5px;opacity:0.8;text-transform:uppercase;letter-spacing:1px;">Chủ thẻ hội viên</div>
                <div class="card-holder-name">${user.name}</div>
              </div>
              <div class="card-points-display">
                <small>Điểm tích lũy</small>
                <strong>${user.points || 0} <span style="font-size:13px;">ĐIỂM</span></strong>
              </div>
            </div>
          </div>
        </div>

        <div class="membership-stats">
          <div class="member-stat-box highlight">
            <small>Điểm khả dụng</small>
            <strong>${user.points || 0} đ</strong>
          </div>
          <div class="member-stat-box">
            <small>Quy đổi trừ bill</small>
            <strong>${formatPrice((user.points || 0) * 100)} đ</strong>
          </div>
          <div class="member-stat-box">
            <small>Tổng chi tiêu</small>
            <strong>${formatPrice(user.totalSpent || user.total_spent || 0)} đ</strong>
          </div>
        </div>

        <div class="tier-benefits">
          <h4>🎁 Quyền lợi hạng ${tier}</h4>
          <ul class="benefits-list">
            <li>Tích lũy <b>${tier === 'Diamond' ? '10%' : tier === 'Gold' ? '7%' : '5%'}</b> giá trị mỗi đơn hàng cơm tấm</li>
            <li>Đổi điểm thanh toán trực tiếp: 1 điểm = 100 đồng</li>
            <li>${tier === 'Diamond' ? 'Miễn phí giao hàng trọn đời mọi đơn' : tier === 'Gold' ? 'Miễn phí giao hàng cho đơn từ 120.000đ' : 'Miễn phí giao hàng cho đơn từ 150.000đ'}</li>
            <li>Quà tặng sinh nhật đặc biệt và ưu đãi giảm giá ngày lễ</li>
          </ul>
        </div>

        <div style="margin-top:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h4 style="margin:0;font-size:15px;color:var(--dark-ink);">Lịch sử đơn hàng của bạn (${orders.length})</h4>
          </div>

          ${orders.length === 0 ? `
            <p style="font-size:13px;color:var(--text-muted);text-align:center;padding:16px;">Bạn chưa có đơn hàng nào.</p>
          ` : `
            <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;">
              ${orders.map(o => `
                <div style="background:#faf7f2;border:1px solid #ebdccf;border-radius:var(--radius-sm);padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <strong style="font-size:13.5px;color:var(--dark-ink);">${o.orderCode || o.order_code}</strong>
                    <div style="font-size:11.5px;color:var(--text-muted);">${o.createdAt || o.created_at} · ${formatPrice(o.totalAmount || o.total_amount)} đ</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <button type="button" class="btn-sm-action" onclick="window.ComTamApp.openKitchenTicket('${o.id}')" title="In phiếu bếp">🖨️ In</button>
                    <span class="status-badge ${o.orderStatus || o.order_status}" style="font-size:11px;">${o.orderStatus || o.order_status}</span>
                    <button type="button" class="btn-sm-action" onclick="window.ComTamApp.viewSingleOrder('${o.id}')">Theo dõi</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    } else if (activeMemberTab === 'profile') {
      tabContent = `
        <form id="form-user-edit-profile" onsubmit="window.ComTamApp.handleUpdateProfile(event)" style="background:#ffffff;border:1px solid #ebdccf;border-radius:var(--radius-sm);padding:20px;">
          <h4 style="margin:0 0 14px;font-size:16px;color:var(--dark-ink);">✏️ Chỉnh Sửa Thông Tin Cá Nhân</h4>
          
          <div style="background:#fdfaf6;border:1px solid #ebdccf;padding:12px 14px;border-radius:6px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <small style="color:var(--text-muted);display:block;">Mã Thẻ Hội Viên:</small>
              <strong style="color:var(--primary-color);font-size:14px;">${user.membershipNumber || user.membership_number}</strong>
            </div>
            <div>
              <small style="color:var(--text-muted);display:block;">Hạng Thẻ:</small>
              <strong style="color:var(--dark-ink);">${tierNameVi}</strong>
            </div>
            <div>
              <small style="color:var(--text-muted);display:block;">Điểm Tích Lũy:</small>
              <strong style="color:#27ae60;">${user.points || 0} điểm</strong>
            </div>
          </div>

          <div class="form-group">
            <label for="member-edit-name">Họ và tên *</label>
            <input type="text" id="member-edit-name" class="form-control" required value="${user.name}">
          </div>

          <div class="form-group">
            <label for="member-edit-phone">Số điện thoại *</label>
            <input type="tel" id="member-edit-phone" class="form-control" required value="${user.phone}">
          </div>

          <div class="form-group">
            <label for="member-edit-email">Email</label>
            <input type="email" id="member-edit-email" class="form-control" value="${user.email || ''}">
          </div>

          <div class="form-group">
            <label for="member-edit-address">Địa chỉ nhận cơm mặc định</label>
            <textarea id="member-edit-address" class="form-control" rows="2" placeholder="Ví dụ: 123 Nguyễn Thị Minh Khai, P. Bến Nghé, Quận 1">${user.address || ''}</textarea>
          </div>

          <button type="submit" class="btn-checkout" style="margin-top:10px;">
            💾 Lưu Cập Nhật Thông Tin
          </button>
        </form>
      `;
    } else if (activeMemberTab === 'password') {
      tabContent = `
        <form id="form-user-change-password" onsubmit="window.ComTamApp.handleChangePassword(event)" style="background:#ffffff;border:1px solid #ebdccf;border-radius:var(--radius-sm);padding:20px;">
          <h4 style="margin:0 0 14px;font-size:16px;color:var(--dark-ink);">🔒 Đổi Mật Khẩu Tài Khoản</h4>
          <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:16px;">Để bảo mật tài khoản hội viên của bạn, vui lòng nhập mật khẩu hiện tại trước khi tạo mật khẩu mới.</p>

          <div class="form-group">
            <label for="member-old-pass">Mật khẩu hiện tại *</label>
            <input type="password" id="member-old-pass" class="form-control" required placeholder="Nhập mật khẩu đang dùng">
          </div>

          <div class="form-group">
            <label for="member-new-pass">Mật khẩu mới *</label>
            <input type="password" id="member-new-pass" class="form-control" required minlength="3" placeholder="Tối thiểu 3 ký tự">
          </div>

          <div class="form-group">
            <label for="member-confirm-pass">Xác nhận mật khẩu mới *</label>
            <input type="password" id="member-confirm-pass" class="form-control" required minlength="3" placeholder="Nhập lại mật khẩu mới">
          </div>

          <button type="submit" class="btn-checkout" style="margin-top:10px;">
            🔒 Cập Nhật Mật Khẩu Mới
          </button>
        </form>
      `;
    } else if (activeMemberTab === 'delete') {
      tabContent = `
        <div style="background:#fff2f2;border:1px solid #f5c6cb;border-radius:var(--radius-sm);padding:20px;">
          <h4 style="margin:0 0 10px;font-size:16px;color:#721c24;">⚠️ Xóa Vĩnh Viễn Tài Khoản Khách Hàng</h4>
          <p style="font-size:13px;color:#721c24;line-height:1.6;margin-bottom:14px;">
            Hành động này sẽ xóa toàn bộ hồ sơ khách hàng của bạn (<b>${user.name} - ${user.phone}</b>) khỏi hệ thống cơm tấm Ông Mập:
          </p>
          <ul style="font-size:12.5px;color:#721c24;padding-left:20px;margin-bottom:16px;">
            <li>Toàn bộ <b>${user.points || 0} điểm tích lũy</b> (tương đương ${formatPrice((user.points || 0) * 100)} đ)</li>
            <li>Hạng thẻ VIP ${tier} và tất cả ưu đãi miễn phí giao hàng</li>
            <li>Thông tin địa chỉ giao hàng và lịch sử liên kết đơn hàng</li>
          </ul>

          <div style="margin-bottom:16px;">
            <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#721c24;font-weight:600;cursor:pointer;">
              <input type="checkbox" id="confirm-delete-user-check">
              Tôi xác nhận và đồng ý xóa vĩnh viễn tài khoản của mình
            </label>
          </div>

          <button type="button" class="btn-sm-action danger" style="padding:10px 18px;font-size:13px;font-weight:700;" onclick="window.ComTamApp.handleDeleteMyAccount()">
            🗑️ Xóa Tài Khoản Của Tôi Ngay
          </button>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #ebdccf;padding-bottom:10px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="user-avatar-mini">${user.name ? user.name.charAt(0).toUpperCase() : 'VIP'}</div>
          <div>
            <strong style="font-size:15px;color:var(--dark-ink);display:block;">${user.name}</strong>
            <small style="color:var(--text-muted);">${user.phone} · ${tierNameVi}</small>
          </div>
        </div>
        <button type="button" class="btn-sm-action danger" onclick="window.ComTamApp.logout()">Đăng xuất</button>
      </div>

      <div class="sub-nav-tabs">
        <button type="button" class="sub-nav-btn ${activeMemberTab === 'card' ? 'active' : ''}" onclick="window.ComTamApp.switchMemberTab('card')">
          💳 Thẻ VIP & Điểm
        </button>
        <button type="button" class="sub-nav-btn ${activeMemberTab === 'profile' ? 'active' : ''}" onclick="window.ComTamApp.switchMemberTab('profile')">
          ✏️ Sửa Thông Tin
        </button>
        <button type="button" class="sub-nav-btn ${activeMemberTab === 'password' ? 'active' : ''}" onclick="window.ComTamApp.switchMemberTab('password')">
          🔒 Đổi Mật Khẩu
        </button>
        <button type="button" class="sub-nav-btn danger ${activeMemberTab === 'delete' ? 'active' : ''}" onclick="window.ComTamApp.switchMemberTab('delete')">
          🗑️ Xóa Tài Khoản
        </button>
      </div>

      ${tabContent}
    `;
  }

  // --- Admin Portal Modal ---
  function openAdminModal() {
    const modal = document.querySelector('#admin-modal-overlay');
    if (!modal) return;

    const user = store.getCurrentUser();
    if (!user || user.role !== 'admin') {
      renderAdminLoginForm();
    } else {
      renderAdminDashboard();
    }

    modal.classList.add('active');
  }

  function closeAdminModal() {
    const modal = document.querySelector('#admin-modal-overlay');
    if (modal) modal.classList.remove('active');
  }

  function renderAdminLoginForm() {
    const body = document.querySelector('#admin-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div style="max-width:400px;margin:40px auto;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🛡️</div>
        <h3 style="margin:0 0 8px;font-size:20px;color:var(--dark-ink);">Đăng Nhập Quản Trị Viên</h3>
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 20px;">Hệ thống quản lý thực đơn, duyệt thanh toán & hội viên comtam.net</p>

        <div style="background:#fff7ea;border:1px solid #f6dac1;border-radius:var(--radius-sm);padding:10px;margin-bottom:16px;">
          <small style="color:var(--dark-ink);display:block;margin-bottom:6px;">Tài khoản demo: <b>admin</b> | Mật khẩu: <b>admin</b></small>
          <button type="button" class="btn-sm-action" style="background:#2b2724;color:#fff;font-weight:700;" onclick="window.ComTamApp.quickLoginAdmin()">
            ⚡ 1-Click Vào Thẳng Quản Trị
          </button>
        </div>

        <form id="admin-login-form" onsubmit="window.ComTamApp.handleAdminLogin(event)" style="text-align:left;">
          <div class="form-group">
            <label for="admin-user-input">Tài khoản quản lý</label>
            <input type="text" id="admin-user-input" class="form-control" required value="admin">
          </div>
          <div class="form-group">
            <label for="admin-pass-input">Mật khẩu</label>
            <input type="password" id="admin-pass-input" class="form-control" required value="admin">
          </div>
          <button type="submit" class="btn-checkout" style="background:#2b2724;margin-top:14px;">
            Đăng Nhập Quản Trị Bếp
          </button>
        </form>
      </div>
    `;
  }

  let activeAdminTab = 'orders';

  function renderAdminDashboard() {
    const body = document.querySelector('#admin-modal-body');
    if (!body) return;

    const orders = store.getOrders();
    const dishes = store.getDishes();
    const users = store.getUsers();
    const tables = store.getTables();

    // Stats
    const totalRev = orders.filter(o => (o.orderStatus !== 'cancelled' && o.order_status !== 'cancelled')).reduce((sum, o) => sum + (o.totalAmount || o.total_amount || 0), 0);
    const pendingOrders = orders.filter(o => o.orderStatus === 'pending_payment' || o.paymentStatus === 'pending' || o.order_status === 'pending_payment' || o.payment_status === 'pending').length;
    const cookingOrders = orders.filter(o => o.orderStatus === 'cooking' || o.order_status === 'cooking').length;
    const customerCount = users.filter(u => u.role === 'customer').length;
    const callingTables = tables.filter(t => t.waiter_call);

    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid #ebdccf;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:24px;">👨‍🍳</span>
          <div>
            <h3 style="margin:0;font-size:18px;color:var(--dark-ink);">Bảng Quản Trị Cơm Tấm Ông Mập</h3>
            <small style="color:var(--text-muted);">Cơ sở dữ liệu PostgreSQL (comtam_db) · Đồng bộ thời gian thực 12 bàn ăn & đơn hàng</small>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button type="button" class="btn-sm-action" onclick="window.ComTamApp.toggleSound()" style="background:#fff;">
            ${soundEnabled ? '🔊 Chuông: BẬT' : '🔇 Chuông: TẮT'}
          </button>
          <button type="button" class="btn-sm-action" onclick="window.playOrderChime(); window.showToast('🔔 Đang thử chuông báo đơn mới!', 'info');">
            🔔 Thử Chuông
          </button>
          <button type="button" class="btn-sm-action danger" onclick="window.ComTamApp.logout()">Thoát Admin</button>
        </div>
      </div>

      <div class="admin-nav-tabs">
        <button type="button" class="admin-nav-tab ${activeAdminTab === 'dashboard' ? 'active' : ''}" onclick="window.ComTamApp.switchAdminTab('dashboard')">
          📊 Tổng Quan
        </button>
        <button type="button" class="admin-nav-tab ${activeAdminTab === 'tables' ? 'active' : ''}" onclick="window.ComTamApp.switchAdminTab('tables')">
          🗺️ Sơ Đồ Bàn & Gọi Phục Vụ ${callingTables.length > 0 ? `<span class="cart-badge" style="background:#8e44ad;color:#fff;animation:pulseBadge 1s infinite;">🔥 ${callingTables.length}</span>` : ''}
        </button>
        <button type="button" class="admin-nav-tab ${activeAdminTab === 'orders' ? 'active' : ''}" onclick="window.ComTamApp.switchAdminTab('orders')">
          📋 Quản Lý Đơn Hàng ${pendingOrders > 0 ? `<span class="cart-badge" style="background:#d9534f;color:#fff;">${pendingOrders}</span>` : ''}
        </button>
        <button type="button" class="admin-nav-tab ${activeAdminTab === 'dishes' ? 'active' : ''}" onclick="window.ComTamApp.switchAdminTab('dishes')">
          🍲 Quản Lý Thực Đơn (${dishes.length})
        </button>
        <button type="button" class="admin-nav-tab ${activeAdminTab === 'members' ? 'active' : ''}" onclick="window.ComTamApp.switchAdminTab('members')">
          👥 Khách Hàng CRM (${customerCount})
        </button>
        <button type="button" class="admin-nav-tab ${activeAdminTab === 'admin_profile' ? 'active' : ''}" onclick="window.ComTamApp.switchAdminTab('admin_profile')">
          🛡️ Hồ Sơ Quản Trị
        </button>
        <button type="button" class="admin-nav-tab ${activeAdminTab === 'settings' ? 'active' : ''}" onclick="window.ComTamApp.switchAdminTab('settings')">
          ⚙️ Cài Đặt & PostgreSQL
        </button>
      </div>

      <div class="admin-tab-pane ${activeAdminTab === 'dashboard' ? 'active' : ''}" id="admin-tab-dashboard">
        <div class="admin-kpi-grid">
          <div class="admin-kpi-card">
            <div class="kpi-icon-box">💰</div>
            <div class="kpi-details">
              <small>Tổng Doanh Thu</small>
              <strong>${formatPrice(totalRev)} đ</strong>
            </div>
          </div>
          <div class="admin-kpi-card">
            <div class="kpi-icon-box" style="background:#fff3cd;color:#856404;">⚡</div>
            <div class="kpi-details">
              <small>Chờ Duyệt Thanh Toán</small>
              <strong style="color:#d9534f;">${pendingOrders} đơn</strong>
            </div>
          </div>
          <div class="admin-kpi-card">
            <div class="kpi-icon-box" style="background:#ffe8d6;color:#c86b2b;">🔥</div>
            <div class="kpi-details">
              <small>Bếp Đang Nướng</small>
              <strong>${cookingOrders} đơn</strong>
            </div>
          </div>
          <div class="admin-kpi-card">
            <div class="kpi-icon-box" style="background:#d1ecf1;color:#0c5460;">👥</div>
            <div class="kpi-details">
              <small>Khách Hàng Thành Viên</small>
              <strong>${customerCount} hội viên</strong>
            </div>
          </div>
        </div>

        <h4 style="margin:20px 0 10px;font-size:15px;color:var(--dark-ink);">Đơn hàng mới nhất cần chú ý</h4>
        ${renderOrdersTable(orders.slice(0, 5))}
      </div>

      <div class="admin-tab-pane ${activeAdminTab === 'tables' ? 'active' : ''}" id="admin-tab-tables">
        ${renderTablesTab(tables, orders)}
      </div>

      <div class="admin-tab-pane ${activeAdminTab === 'orders' ? 'active' : ''}" id="admin-tab-orders">
        ${renderOrdersTab(orders)}
      </div>

      <div class="admin-tab-pane ${activeAdminTab === 'dishes' ? 'active' : ''}" id="admin-tab-dishes">
        ${renderDishesTab(dishes)}
      </div>

      <div class="admin-tab-pane ${activeAdminTab === 'members' ? 'active' : ''}" id="admin-tab-members">
        ${renderMembersTab(users)}
      </div>

      <div class="admin-tab-pane ${activeAdminTab === 'admin_profile' ? 'active' : ''}" id="admin-tab-admin-profile">
        ${renderAdminProfileTab(users)}
      </div>

      <div class="admin-tab-pane ${activeAdminTab === 'settings' ? 'active' : ''}" id="admin-tab-settings">
        <div style="background:#ffffff;border:1px solid #ebdccf;border-radius:var(--radius-md);padding:24px;max-width:680px;">
          <h4 style="margin:0 0 12px;font-size:16px;color:var(--dark-ink);">Cài đặt hệ thống & Cơ sở dữ liệu</h4>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">
            Hệ thống kết nối trực tiếp với máy chủ Node.js và hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL 14 (Database: <b>comtam_db</b>).
          </p>

          <div style="padding:16px;background:#f0f8ff;border:1px solid #cce5ff;border-radius:var(--radius-sm);margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="font-size:18px;">🐘</span>
              <strong style="color:#004085;font-size:14px;">Trạng Thái PostgreSQL Database (comtam_db):</strong>
            </div>
            <p style="font-size:12.5px;color:#004085;margin:0 0 10px;">
              Kết nối: <b>Active</b> | 12 Món cơm tấm | 12 Bàn ăn | Khách hàng VIP & Đơn hàng đã đồng bộ.
            </p>
            <button type="button" class="btn-sm-action" style="background:#004085;color:#fff;" onclick="window.ComTamStore.syncAll().then(() => { window.showToast('Đã đồng bộ lại toàn bộ dữ liệu PostgreSQL!', 'success'); renderAdminDashboard(); });">
              🔄 Kiểm Tra & Đồng Bộ Toàn Bộ Với PostgreSQL
            </button>
          </div>

          <div style="padding:16px;background:#fff8ee;border:1px solid #ebdccf;border-radius:var(--radius-sm);margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="font-size:18px;">🖨️</span>
              <strong style="color:var(--primary-color);font-size:14px;">In Bộ Mã QR Standee Để Bàn (12 Bàn):</strong>
            </div>
            <p style="font-size:12.5px;color:var(--text-muted);margin:0 0 10px;">
              Xuất trang in tiêu chuẩn A4 chứa đầy đủ 12 standee để bàn kèm mã QR dẫn thẳng vào trang gọi món cho từng bàn ăn.
            </p>
            <button type="button" class="btn-checkout" style="width:auto;padding:8px 20px;" onclick="window.open('/api/tables/print-qr', '_blank')">
              🖨️ Mở Trang In Standee QR 12 Bàn
            </button>
          </div>

          <div style="padding:16px;background:#fff2f2;border:1px solid #f5c6cb;border-radius:var(--radius-sm);">
            <strong style="color:#721c24;display:block;margin-bottom:6px;">Khôi phục / Reset dữ liệu đơn hàng:</strong>
            <p style="font-size:12.5px;color:#721c24;margin:0 0 12px;">Xóa lịch sử đơn test và các yêu cầu gọi phục vụ trên server PostgreSQL và trình duyệt.</p>
            <button type="button" class="btn-sm-action danger" onclick="if(confirm('Khôi phục dữ liệu ban đầu?')) { fetch('/api/reset-data', {method:'POST'}).then(() => { store.resetToFactoryDemo(); window.showToast('Đã làm mới dữ liệu!', 'info'); renderAdminDashboard(); }); }">
              ↺ Reset Dữ Liệu Đơn & Bàn
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderTablesTab(tables, orders) {
    const callingCount = tables.filter(t => t.waiter_call).length;
    const diningCount = tables.filter(t => t.status === 'dining').length;
    const emptyCount = tables.filter(t => t.status === 'empty' || !t.status).length;
    const billingCount = tables.filter(t => t.status === 'billing').length;

    let tablesHtml = tables.map(t => {
      const isCalling = Boolean(t.waiter_call);
      const status = isCalling ? 'calling' : (t.status || 'empty');
      const tableNum = t.table_number;
      const numOnly = tableNum.replace(/\D/g, '');
      
      // Find active order for this table
      const activeOrder = orders.find(o => 
        (o.tableNumber === tableNum || o.table_number === tableNum) && 
        (o.orderStatus === 'cooking' || o.orderStatus === 'pending_payment' || o.order_status === 'cooking' || o.order_status === 'pending_payment')
      );
      
      let statusLabel = 'Trống';
      if (status === 'calling') statusLabel = '🔥 Gọi Phục Vụ';
      else if (status === 'dining') statusLabel = 'Đang Ăn';
      else if (status === 'billing') statusLabel = 'Chờ Tính Tiền';

      return `
        <div class="table-card status-${status}">
          <div>
            <div class="table-card-header">
              <div>
                <h4 class="table-card-title">${tableNum}</h4>
                <span class="table-card-cap">${t.capacity || 4} chỗ ngồi</span>
              </div>
              <span class="table-status-pill ${status}">${statusLabel}</span>
            </div>

            ${isCalling ? `
              <div class="table-calling-banner">
                <span class="calling-title">🔔 YÊU CẦU:</span>
                <span class="calling-desc">${t.waiter_call}</span>
              </div>
            ` : ''}

            ${activeOrder ? `
              <div class="table-order-info">
                <div class="order-code-row">
                  <span>Mã: ${activeOrder.orderCode || activeOrder.order_code}</span>
                  <span style="color:var(--primary-color);">${formatPrice(activeOrder.totalAmount || activeOrder.total_amount || 0)} đ</span>
                </div>
                <div class="order-items-snippet">
                  ${(activeOrder.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
              </div>
            ` : `
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;min-height:36px;display:flex;align-items:center;">
                ${status === 'empty' ? 'Bàn trống, sẵn sàng đón khách' : 'Chưa gắn mã đơn cụ thể'}
              </div>
            `}
          </div>

          <div>
            ${isCalling ? `
              <button type="button" class="btn-sm-action btn-resolve-call" onclick="window.ComTamApp.adminClearWaiter('${tableNum}')">
                ✓ Đã Phục Vụ Xong
              </button>
            ` : ''}

            <div class="table-card-actions">
              ${activeOrder ? `
                <button type="button" class="btn-sm-action" onclick="window.ComTamApp.openTrackingModal('${activeOrder.orderCode || activeOrder.order_code}')">
                  🧾 Đơn
                </button>
                <button type="button" class="btn-sm-action" onclick="window.ComTamApp.openKitchenTicket('${activeOrder.id}')">
                  🖨️ In Bếp
                </button>
              ` : ''}
              
              <button type="button" class="btn-sm-action" onclick="window.open('/?table=${numOnly}', '_blank')" title="Mở trang khách hàng ngồi tại bàn này">
                📱 Thử QR
              </button>

              <select class="form-control" style="font-size:11px;padding:3px 6px;height:auto;width:auto;flex:1;" onchange="window.ComTamApp.adminSetTableStatus('${tableNum}', this.value)">
                <option value="empty" ${t.status === 'empty' ? 'selected' : ''}>🟢 Trống</option>
                <option value="dining" ${t.status === 'dining' ? 'selected' : ''}>🟡 Đang Ăn</option>
                <option value="billing" ${t.status === 'billing' ? 'selected' : ''}>🔴 Tính Tiền</option>
              </select>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="admin-tables-container">
        <div class="admin-tables-toolbar">
          <div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;flex-wrap:wrap;">
              <strong style="font-size:16px;color:var(--dark-ink);">Sơ Đồ 12 Bàn Ăn Thời Gian Thực</strong>
              <div class="admin-tables-legend">
                <span class="legend-item"><span class="legend-dot empty"></span> Trống (${emptyCount})</span>
                <span class="legend-item"><span class="legend-dot dining"></span> Đang ăn (${diningCount})</span>
                <span class="legend-item"><span class="legend-dot billing"></span> Chờ tính tiền (${billingCount})</span>
                <span class="legend-item"><span class="legend-dot calling"></span> Gọi phục vụ (${callingCount})</span>
              </div>
            </div>
            <small style="color:var(--text-muted);">Tự động đồng bộ với cơ sở dữ liệu PostgreSQL (comtam_db)</small>
          </div>

          <div style="display:flex;gap:8px;">
            <button type="button" class="btn-checkout" style="width:auto;padding:8px 18px;font-size:13px;display:inline-flex;align-items:center;gap:6px;" onclick="window.open('/api/tables/print-qr', '_blank')">
              <span>🖨️ In Standee Mã QR 12 Bàn</span>
            </button>
            <button type="button" class="btn-sm-action" onclick="window.ComTamStore.fetchTables().then(() => renderAdminDashboard())">
              🔄 Tải lại
            </button>
          </div>
        </div>

        <div class="tables-grid">
          ${tablesHtml}
        </div>
      </div>
    `;
  }

  function renderOrdersTab(orders) {
    return `
      <div class="admin-table-container">
        <div class="admin-table-toolbar">
          <div style="display:flex;align-items:center;gap:10px;">
            <strong style="font-size:14px;color:var(--dark-ink);">Danh sách đơn hàng (${orders.length})</strong>
            <button type="button" class="btn-sm-action" style="background:#fff4ea;border-color:var(--primary-color);color:var(--primary-color);font-weight:700;" onclick="window.ComTamApp.simulateNewOrder()">
              + Giả Lập Đơn Khách Mới
            </button>
          </div>
          <div style="font-size:12px;color:var(--text-muted);">
            Bấm <b>⚡ Duyệt Thanh Toán</b> để xác nhận nhận tiền và chuyển đơn vào bếp ngay!
          </div>
        </div>
        ${renderOrdersTable(orders)}
      </div>
    `;
  }

  function renderOrdersTable(orders) {
    if (orders.length === 0) {
      return `<div style="padding:30px;text-align:center;color:var(--text-muted);">Chưa có đơn hàng nào.</div>`;
    }

    return `
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã Đơn</th>
              <th>Thời Gian</th>
              <th>Khách Hàng / SĐT</th>
              <th>Món Đặt</th>
              <th>Tổng Tiền</th>
              <th>Thanh Toán</th>
              <th>Trạng Thái</th>
              <th>Hành Động Quản Trị</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => {
              const needsApproval = (o.paymentStatus === 'pending' || o.orderStatus === 'pending_payment');
              const itemList = o.items.map(i => `${i.name} (x${i.quantity})`).join(', ');

              return `
                <tr>
                  <td><b>${o.orderCode}</b></td>
                  <td style="font-size:12px;white-space:nowrap;">${o.createdAt}</td>
                  <td>
                    <div><b>${o.customerName}</b></div>
                    <small style="color:var(--text-muted);">${o.phone}</small>
                  </td>
                  <td style="max-width:200px;font-size:12px;" title="${itemList}">
                    <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${itemList}</div>
                  </td>
                  <td style="font-weight:700;color:var(--primary-color);">${formatPrice(o.totalAmount)} đ</td>
                  <td>
                    <span class="status-badge ${o.paymentStatus === 'paid' ? 'completed' : 'pending_payment'}" style="font-size:11px;">
                      ${o.paymentStatus === 'paid' ? '✓ Đã Thanh Toán' : o.paymentMethod === 'cod' ? '💵 COD' : '⏳ Chờ Chuyển Khoản'}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge ${o.orderStatus}" style="font-size:11px;">
                      ${o.orderStatus}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">
                      ${needsApproval ? `
                        <button type="button" class="btn-quick-approve" title="Xác nhận nhận tiền và cho vào bếp nướng" onclick="window.ComTamApp.adminApprovePayment('${o.id}')">
                          ⚡ Duyệt Thanh Toán
                        </button>
                      ` : ''}

                      <button type="button" class="btn-sm-action" onclick="window.ComTamApp.openKitchenTicket('${o.id}')" title="In phiếu chế biến / hoá đơn 80mm">
                        🖨️ In Phiếu
                      </button>

                      <select style="font-size:12px;padding:4px 6px;border-radius:4px;border:1px solid #d8cbbe;" onchange="window.ComTamApp.adminChangeStatus('${o.id}', this.value)">
                        <option value="">Đổi trạng thái...</option>
                        <option value="cooking" ${o.orderStatus === 'cooking' ? 'selected' : ''}>🔥 Bếp đang nướng</option>
                        <option value="delivering" ${o.orderStatus === 'delivering' ? 'selected' : ''}>🛵 Đang giao hàng</option>
                        <option value="completed" ${o.orderStatus === 'completed' ? 'selected' : ''}>✨ Hoàn tất đơn</option>
                        <option value="cancelled" ${o.orderStatus === 'cancelled' ? 'selected' : ''}>✕ Huỷ đơn</option>
                      </select>

                      <button type="button" class="btn-sm-action" onclick="window.ComTamApp.viewSingleOrder('${o.id}')">👁</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDishesTab(dishes) {
    return `
      <div class="admin-table-container">
        <div class="admin-table-toolbar">
          <strong style="font-size:14px;color:var(--dark-ink);">Quản lý món ăn thực đơn (${dishes.length} món)</strong>
          <button type="button" class="btn-direct-order" style="margin:0;padding:8px 16px;font-size:13px;" onclick="window.ComTamApp.openDishEditorModal()">
            + Thêm Món Mới
          </button>
        </div>

        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên Món Ăn</th>
                <th>Danh Mục</th>
                <th>Giá Bán</th>
                <th>Thời Gian</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${dishes.map(d => `
                <tr>
                  <td>
                    <img src="assets/${d.image}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:1px solid #ede1d1;">
                  </td>
                  <td>
                    <strong>${d.name}</strong>
                    <div style="font-size:11.5px;color:var(--text-muted);">${(d.tags || []).join(' · ')}</div>
                  </td>
                  <td style="font-size:12px;">${d.category}</td>
                  <td style="font-weight:700;color:var(--primary-color);">${formatPrice(d.price)} đ</td>
                  <td style="font-size:12px;">${d.time}</td>
                  <td>
                    <button type="button" class="btn-sm-action" style="background:${d.available !== false ? '#d4edda' : '#f8d7da'};color:${d.available !== false ? '#155724' : '#721c24'};" onclick="window.ComTamApp.adminToggleDish('${d.id}')">
                      ${d.available !== false ? '● Đang Bán' : '○ Tạm Hết'}
                    </button>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button type="button" class="btn-sm-action" onclick="window.ComTamApp.openDishEditorModal('${d.id}')">✏ Sửa</button>
                      <button type="button" class="btn-sm-action danger" onclick="window.ComTamApp.adminDeleteDish('${d.id}')">🗑 Xóa</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAdminProfileTab(users) {
    const admin = store.getCurrentUser() || { name: 'Quản Trị Bếp Ông Mập', phone: '0988888888', email: 'admin@comtam.net', role: 'admin' };
    const allStaff = users.filter(u => u.role === 'admin' || u.role === 'staff');

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
        <form id="admin-profile-form" onsubmit="window.ComTamApp.handleUpdateAdminProfile(event)" style="background:#ffffff;border:1px solid #ebdccf;border-radius:var(--radius-sm);padding:20px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;border-bottom:1px solid #ebdccf;padding-bottom:10px;">
            <span style="font-size:24px;">🛡️</span>
            <div>
              <h4 style="margin:0;font-size:16px;color:var(--dark-ink);">Hồ Sơ Quản Trị Viên</h4>
              <small style="color:var(--text-muted);">Quyền hạn: <b>Quản Trị Tối Cao (Root Admin)</b></small>
            </div>
          </div>

          <div class="form-group">
            <label for="adm-prof-name">Họ và tên Quản trị viên *</label>
            <input type="text" id="adm-prof-name" class="form-control" required value="${admin.name}">
          </div>

          <div class="form-group">
            <label for="adm-prof-phone">Số điện thoại Quản trị / Hotline *</label>
            <input type="tel" id="adm-prof-phone" class="form-control" required value="${admin.phone}">
          </div>

          <div class="form-group">
            <label for="adm-prof-email">Email quản trị viên *</label>
            <input type="email" id="adm-prof-email" class="form-control" required value="${admin.email || ''}">
          </div>

          <div class="form-group">
            <label for="adm-prof-address">Cơ sở / Chi nhánh phụ trách</label>
            <input type="text" id="adm-prof-address" class="form-control" value="${admin.address || 'Trụ sở comtam.net'}">
          </div>

          <button type="submit" class="btn-checkout" style="background:#2b2724;margin-top:10px;">
            💾 Lưu Cập Nhật Thông Tin Admin
          </button>
        </form>

        <form id="admin-password-form" onsubmit="window.ComTamApp.handleChangeAdminPassword(event)" style="background:#ffffff;border:1px solid #ebdccf;border-radius:var(--radius-sm);padding:20px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;border-bottom:1px solid #ebdccf;padding-bottom:10px;">
            <span style="font-size:24px;">🔒</span>
            <div>
              <h4 style="margin:0;font-size:16px;color:var(--dark-ink);">Đổi Mật Khẩu Quản Trị Viên</h4>
              <small style="color:var(--text-muted);">Bảo vệ quyền truy cập và dữ liệu vận hành quán</small>
            </div>
          </div>

          <div class="form-group">
            <label for="adm-old-pass">Mật khẩu hiện tại *</label>
            <input type="password" id="adm-old-pass" class="form-control" required placeholder="Nhập mật khẩu đang dùng">
          </div>

          <div class="form-group">
            <label for="adm-new-pass">Mật khẩu mới *</label>
            <input type="password" id="adm-new-pass" class="form-control" required minlength="3" placeholder="Tối thiểu 3 ký tự">
          </div>

          <div class="form-group">
            <label for="adm-confirm-pass">Xác nhận mật khẩu mới *</label>
            <input type="password" id="adm-confirm-pass" class="form-control" required minlength="3" placeholder="Nhập lại mật khẩu mới">
          </div>

          <button type="submit" class="btn-checkout" style="background:#2b2724;margin-top:10px;">
            🔑 Cập Nhật Mật Khẩu Mới
          </button>
        </form>
      </div>

      <div class="admin-table-container">
        <div class="admin-table-toolbar">
          <div>
            <strong style="font-size:15px;color:var(--dark-ink);">Danh Sách Nhân Sự & Quản Trị Bếp (${allStaff.length})</strong>
            <div style="font-size:12px;color:var(--text-muted);">Tất cả tài khoản được cấp quyền truy cập hệ thống quản trị comtam.net</div>
          </div>
          <button type="button" class="btn-checkout" style="width:auto;padding:8px 16px;font-size:12.5px;background:#2b2724;" onclick="window.ComTamApp.openCreateAdminModal()">
            ➕ Thêm Quản Trị Viên / Nhân Viên
          </button>
        </div>

        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Nhân Sự</th>
                <th>Tài Khoản / SĐT</th>
                <th>Email</th>
                <th>Phân Quyền</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${allStaff.map(s => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <div class="user-avatar-mini" style="background:#2b2724;">${s.name.charAt(0)}</div>
                      <b>${s.name}</b>
                    </div>
                  </td>
                  <td>${s.phone || 'admin'}</td>
                  <td>${s.email || '-'}</td>
                  <td>
                    <span class="status-badge ${s.role === 'admin' ? 'cooking' : 'delivering'}" style="font-size:11px;">
                      ${s.role === 'admin' ? '🛡️ Quản Trị Viên (Admin)' : '👨‍🍳 Nhân Viên Bếp (Staff)'}
                    </span>
                  </td>
                  <td><span class="status-badge delivered" style="font-size:11px;">Hoạt động</span></td>
                  <td>
                    ${s.id === 'admin_01' || s.id === admin.id ? `
                      <small style="color:var(--text-muted);font-weight:600;">(Đang đăng nhập)</small>
                    ` : `
                      <button type="button" class="btn-sm-action danger" onclick="window.ComTamApp.adminDeleteStaff('${s.id}', '${s.name}')">Xóa quyền</button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  let crmSearchQuery = '';
  let crmSelectedTier = 'all';

  function renderMembersTab(users) {
    let customers = users.filter(u => u.role === 'customer');

    if (crmSearchQuery) {
      const q = crmSearchQuery.toLowerCase();
      customers = customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.membershipNumber && c.membershipNumber.toLowerCase().includes(q)) ||
        (c.membership_number && c.membership_number.toLowerCase().includes(q))
      );
    }

    if (crmSelectedTier !== 'all') {
      customers = customers.filter(c => c.tier === crmSelectedTier);
    }

    const totalCustPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);
    const totalCustSpent = customers.reduce((sum, c) => sum + (c.totalSpent || c.total_spent || 0), 0);

    return `
      <div class="crm-toolbar">
        <div class="crm-search-box">
          <input type="text" id="crm-search-input" class="form-control" style="font-size:13px;" placeholder="🔍 Tìm theo Tên, SĐT, Email, Mã thẻ..." value="${crmSearchQuery}" oninput="window.ComTamApp.handleCrmSearch(this.value)">
          <select id="crm-filter-tier" class="form-control" style="width:140px;font-size:13px;" onchange="window.ComTamApp.handleCrmFilter(this.value)">
            <option value="all" ${crmSelectedTier === 'all' ? 'selected' : ''}>Tất cả hạng</option>
            <option value="Diamond" ${crmSelectedTier === 'Diamond' ? 'selected' : ''}>Kim Cương</option>
            <option value="Gold" ${crmSelectedTier === 'Gold' ? 'selected' : ''}>Vàng (Gold)</option>
            <option value="Silver" ${crmSelectedTier === 'Silver' ? 'selected' : ''}>Bạc (Silver)</option>
          </select>
        </div>

        <button type="button" class="btn-checkout" style="width:auto;padding:8px 18px;font-size:13px;" onclick="window.ComTamApp.openCreateCustomerModal()">
          ➕ Đăng Ký Khách Hàng Mới Tại Quầy
        </button>
      </div>

      <div class="membership-stats" style="margin-bottom:16px;">
        <div class="member-stat-box">
          <small>Hội viên hiển thị</small>
          <strong>${customers.length} khách</strong>
        </div>
        <div class="member-stat-box highlight">
          <small>Tổng điểm tích lũy</small>
          <strong>${totalCustPoints} điểm</strong>
        </div>
        <div class="member-stat-box">
          <small>Tổng doanh thu hội viên</small>
          <strong>${formatPrice(totalCustSpent)} đ</strong>
        </div>
      </div>

      <div class="admin-table-container">
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Mã Thẻ VIP</th>
                <th>Khách Hàng</th>
                <th>Liên Hệ (SĐT / Email)</th>
                <th>Địa Chỉ Nhận Cơm</th>
                <th>Hạng Thẻ</th>
                <th>Điểm Tích Lũy</th>
                <th>Tổng Chi Tiêu</th>
                <th>Thao Tác Quản Lý CRM</th>
              </tr>
            </thead>
            <tbody>
              ${customers.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">
                    Không tìm thấy khách hàng nào khớp với tìm kiếm "${crmSearchQuery}".
                  </td>
                </tr>
              ` : customers.map(u => `
                <tr>
                  <td><b>${u.membershipNumber || u.membership_number}</b></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <div class="user-avatar-mini">${u.name ? u.name.charAt(0) : 'U'}</div>
                      <div>
                        <strong>${u.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div><b>${u.phone}</b></div>
                    <small style="color:var(--text-muted);">${u.email || 'Chưa cập nhật'}</small>
                  </td>
                  <td style="max-width:180px;font-size:12px;color:#555;">
                    ${u.address || '<i style="color:#aaa;">Chưa có</i>'}
                  </td>
                  <td>
                    <span class="status-badge ${u.tier === 'Diamond' ? 'delivering' : u.tier === 'Gold' ? 'cooking' : 'pending_payment'}" style="font-size:11px;">
                      ${u.tier}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <b style="color:var(--primary-color);font-size:14px;">${u.points || 0}</b> <small>đ</small>
                      <button type="button" class="btn-sm-action" style="padding:1px 5px;font-size:10px;" onclick="window.ComTamApp.adminAdjustPoints('${u.id}', 50)">+50</button>
                    </div>
                  </td>
                  <td style="font-size:13px;font-weight:600;">${formatPrice(u.totalSpent || u.total_spent || 0)} đ</td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                      <button type="button" class="btn-sm-action" title="Xem chi tiết hồ sơ & tất cả đơn hàng" onclick="window.ComTamApp.openCustomerDetailModal('${u.id}')">
                        👁️ Chi Tiết
                      </button>
                      <button type="button" class="btn-sm-action" title="Sửa thông tin khách hàng" onclick="window.ComTamApp.openEditCustomerModal('${u.id}')">
                        ✏️ Sửa
                      </button>
                      <button type="button" class="btn-sm-action" title="Cấp lại mật khẩu cho khách" onclick="window.ComTamApp.promptResetPassword('${u.id}', '${u.name}')">
                        🔑 Đổi MK
                      </button>
                      <button type="button" class="btn-sm-action danger" title="Xóa tài khoản khách hàng" onclick="window.ComTamApp.adminDeleteCustomer('${u.id}', '${u.name}')">
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- CRM Modals Functions ---
  async function openCustomerDetailModal(userId) {
    const modal = document.querySelector('#customer-detail-modal-overlay');
    const body = document.querySelector('#customer-detail-modal-body');
    if (!modal || !body) return;

    body.innerHTML = `<p style="text-align:center;padding:24px;font-size:14px;color:var(--dark-ink);">⏳ Đang nạp hồ sơ & lịch sử đơn hàng từ PostgreSQL...</p>`;
    modal.classList.add('active');

    const data = await store.getUserDetail(userId);
    if (!data || !data.user) {
      body.innerHTML = `<p style="color:#d9534f;text-align:center;padding:20px;">Không tìm thấy khách hàng này.</p>`;
      return;
    }

    const u = data.user;
    const orders = data.orders || [];
    const tier = u.tier || 'Silver';
    const tierNameVi = tier === 'Diamond' ? 'HỘI VIÊN KIM CƯƠNG' : tier === 'Gold' ? 'HỘI VIÊN VÀNG' : 'HỘI VIÊN BẠC';

    body.innerHTML = `
      <div style="display:flex;gap:16px;align-items:center;background:#fff8ee;border:1px solid #ebdccf;padding:16px;border-radius:var(--radius-sm);margin-bottom:18px;">
        <div class="user-avatar-mini" style="width:50px;height:50px;font-size:22px;">${u.name.charAt(0)}</div>
        <div style="flex:1;">
          <h4 style="margin:0 0 4px;font-size:18px;color:var(--dark-ink);">${u.name}</h4>
          <div style="font-size:12.5px;color:var(--text-muted);display:flex;gap:14px;flex-wrap:wrap;">
            <span>📞 <b>${u.phone}</b></span>
            <span>✉️ ${u.email || 'Chưa có email'}</span>
            <span>📍 ${u.address || 'Chưa cập nhật địa chỉ'}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <span class="status-badge ${tier === 'Diamond' ? 'delivering' : tier === 'Gold' ? 'cooking' : 'pending_payment'}" style="font-size:12px;margin-bottom:4px;display:inline-block;">${tierNameVi}</span>
          <div style="font-size:12px;color:var(--text-muted);">Mã thẻ: <b>${u.membership_number || u.membershipNumber}</b></div>
        </div>
      </div>

      <div class="membership-stats" style="margin-bottom:20px;">
        <div class="member-stat-box highlight">
          <small>Điểm Tích Lũy</small>
          <strong>${u.points || 0} điểm</strong>
        </div>
        <div class="member-stat-box">
          <small>Tổng Chi Tiêu</small>
          <strong>${formatPrice(u.total_spent || u.totalSpent || 0)} đ</strong>
        </div>
        <div class="member-stat-box">
          <small>Tổng Số Đơn Đã Đặt</small>
          <strong>${orders.length} đơn</strong>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h4 style="margin:0;font-size:15px;color:var(--dark-ink);">📋 Toàn Bộ Lịch Sử Đơn Hàng Của Khách (${orders.length})</h4>
        <button type="button" class="btn-sm-action" onclick="window.ComTamApp.openEditCustomerModal('${u.id}')">✏️ Sửa Khách Hàng</button>
      </div>

      ${orders.length === 0 ? `
        <div style="text-align:center;padding:26px;background:#faf6f0;border-radius:8px;color:var(--text-muted);">
          Khách hàng này chưa có đơn hàng nào trong hệ thống.
        </div>
      ` : `
        <div style="max-height:280px;overflow-y:auto;border:1px solid #ebdccf;border-radius:8px;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Thời Gian</th>
                <th>Món Đặt</th>
                <th>Tổng Tiền</th>
                <th>Hình Thức</th>
                <th>Trạng Thái</th>
                <th>In Bếp</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => {
                const items = Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items) : []);
                const itemsText = items.map(it => `${it.quantity}x ${it.dishName || it.name}`).join(', ');
                return `
                  <tr>
                    <td><b>${o.order_code || o.orderCode}</b></td>
                    <td style="font-size:11.5px;color:var(--text-muted);">${o.created_at || o.createdAt}</td>
                    <td style="max-width:200px;font-size:12px;" title="${itemsText}">
                      <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${itemsText}</div>
                    </td>
                    <td><b>${formatPrice(o.total_amount || o.totalAmount)} đ</b></td>
                    <td style="font-size:12px;">${(o.order_type === 'dine_in' || o.orderType === 'dine_in') ? `Bàn ${o.table_number || o.tableNumber}` : 'Giao tận nơi'}</td>
                    <td>
                      <span class="status-badge ${o.order_status || o.orderStatus}" style="font-size:10.5px;">
                        ${o.order_status || o.orderStatus}
                      </span>
                    </td>
                    <td>
                      <button type="button" class="btn-sm-action" onclick="window.ComTamApp.openKitchenTicket('${o.id}')" title="In phiếu bếp">🖨️ In</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  }

  function openEditCustomerModal(userId) {
    const modal = document.querySelector('#customer-edit-modal-overlay');
    const body = document.querySelector('#customer-edit-modal-body');
    if (!modal || !body) return;

    const u = store.getUsers().find(x => x.id === userId);
    if (!u) {
      showToast('Không tìm thấy người dùng', 'error');
      return;
    }

    body.innerHTML = `
      <form id="form-edit-customer" onsubmit="window.ComTamApp.handleSaveEditCustomer(event, '${u.id}')">
        <div class="form-group">
          <label for="ed-cust-name">Họ và tên khách hàng *</label>
          <input type="text" id="ed-cust-name" class="form-control" required value="${u.name}">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="ed-cust-phone">Số điện thoại *</label>
            <input type="tel" id="ed-cust-phone" class="form-control" required value="${u.phone}">
          </div>
          <div class="form-group">
            <label for="ed-cust-email">Email</label>
            <input type="email" id="ed-cust-email" class="form-control" value="${u.email || ''}">
          </div>
        </div>

        <div class="form-group">
          <label for="ed-cust-address">Địa chỉ nhận cơm</label>
          <input type="text" id="ed-cust-address" class="form-control" value="${u.address || ''}">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="ed-cust-tier">Hạng thẻ hội viên</label>
            <select id="ed-cust-tier" class="form-control">
              <option value="Silver" ${u.tier === 'Silver' ? 'selected' : ''}>Bạc (Silver)</option>
              <option value="Gold" ${u.tier === 'Gold' ? 'selected' : ''}>Vàng (Gold)</option>
              <option value="Diamond" ${u.tier === 'Diamond' ? 'selected' : ''}>Kim Cương (Diamond)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="ed-cust-points">Điểm tích lũy</label>
            <input type="number" id="ed-cust-points" class="form-control" required value="${u.points || 0}" min="0">
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:16px;">
          <button type="submit" class="btn-checkout" style="flex:1;">
            💾 Lưu Thay Đổi
          </button>
          <button type="button" class="btn-sm-action" style="padding:10px 16px;" onclick="document.querySelector('#customer-edit-modal-overlay').classList.remove('active')">
            Hủy
          </button>
        </div>
      </form>
    `;
    modal.classList.add('active');
  }

  function openCreateCustomerModal() {
    const modal = document.querySelector('#customer-create-modal-overlay');
    const body = document.querySelector('#customer-create-modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
      <form id="form-create-customer" onsubmit="window.ComTamApp.handleCreateCustomer(event)">
        <div class="form-group">
          <label for="new-cust-name">Họ và tên khách hàng *</label>
          <input type="text" id="new-cust-name" class="form-control" required placeholder="Ví dụ: Lê Minh Trí">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="new-cust-phone">Số điện thoại *</label>
            <input type="tel" id="new-cust-phone" class="form-control" required placeholder="0987654321">
          </div>
          <div class="form-group">
            <label for="new-cust-email">Email (tùy chọn)</label>
            <input type="email" id="new-cust-email" class="form-control" placeholder="khach@gmail.com">
          </div>
        </div>

        <div class="form-group">
          <label for="new-cust-address">Địa chỉ khách hàng (tùy chọn)</label>
          <input type="text" id="new-cust-address" class="form-control" placeholder="Số nhà, tên đường, phường, quận...">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="new-cust-tier">Hạng thẻ ban đầu</label>
            <select id="new-cust-tier" class="form-control">
              <option value="Silver" selected>Bạc (Silver)</option>
              <option value="Gold">Vàng (Gold)</option>
              <option value="Diamond">Kim Cương (Diamond)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="new-cust-points">Điểm tặng ban đầu</label>
            <input type="number" id="new-cust-points" class="form-control" value="50" min="0">
          </div>
        </div>

        <div class="form-group">
          <label for="new-cust-pass">Mật khẩu tài khoản *</label>
          <input type="password" id="new-cust-pass" class="form-control" value="123" required placeholder="Mặc định: 123">
        </div>

        <div style="display:flex;gap:10px;margin-top:16px;">
          <button type="submit" class="btn-checkout" style="flex:1;">
            ➕ Đăng Ký Khách Hàng
          </button>
          <button type="button" class="btn-sm-action" style="padding:10px 16px;" onclick="document.querySelector('#customer-create-modal-overlay').classList.remove('active')">
            Hủy
          </button>
        </div>
      </form>
    `;
    modal.classList.add('active');
  }

  function openCreateAdminModal() {
    const modal = document.querySelector('#admin-create-modal-overlay');
    const body = document.querySelector('#admin-create-modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
      <form id="form-create-admin" onsubmit="window.ComTamApp.handleCreateAdmin(event)">
        <div class="form-group">
          <label for="new-adm-name">Họ và tên nhân sự *</label>
          <input type="text" id="new-adm-name" class="form-control" required placeholder="Ví dụ: Nguyễn Văn Hùng">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="new-adm-phone">Số điện thoại *</label>
            <input type="tel" id="new-adm-phone" class="form-control" required placeholder="0911223344">
          </div>
          <div class="form-group">
            <label for="new-adm-email">Email quản trị *</label>
            <input type="email" id="new-adm-email" class="form-control" required placeholder="staff@comtam.net">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="new-adm-role">Phân quyền chức vụ</label>
            <select id="new-adm-role" class="form-control">
              <option value="admin">Quản Trị Viên (Admin)</option>
              <option value="staff">Nhân Viên Bếp (Staff)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="new-adm-pass">Mật khẩu đăng nhập *</label>
            <input type="password" id="new-adm-pass" class="form-control" required minlength="4" placeholder="Tối thiểu 4 ký tự">
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:16px;">
          <button type="submit" class="btn-checkout" style="background:#2b2724;flex:1;">
            ➕ Tạo Tài Khoản Quản Trị
          </button>
          <button type="button" class="btn-sm-action" style="padding:10px 16px;" onclick="document.querySelector('#admin-create-modal-overlay').classList.remove('active')">
            Hủy
          </button>
        </div>
      </form>
    `;
    modal.classList.add('active');
  }

  // --- Add / Edit Dish Modal ---
  function openDishEditorModal(dishId = null) {
    const existing = dishId ? store.getDish(dishId) : null;
    const modal = document.querySelector('#dish-editor-modal-overlay');
    const body = document.querySelector('#dish-editor-modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
      <form id="dish-editor-form" onsubmit="window.ComTamApp.handleSaveDish(event, '${dishId || ''}')">
        <div class="form-group">
          <label for="ed-dish-name">Tên món ăn *</label>
          <input type="text" id="ed-dish-name" class="form-control" required value="${existing ? existing.name : ''}" placeholder="Ví dụ: Cơm Tấm Sườn Cốt Lết Than Hoa">
        </div>

        <div style="grid-template-columns:1fr 1fr;display:grid;gap:12px;">
          <div class="form-group">
            <label for="ed-dish-price">Giá bán (VNĐ) *</label>
            <input type="number" id="ed-dish-price" class="form-control" required value="${existing ? existing.price : 65000}">
          </div>
          <div class="form-group">
            <label for="ed-dish-time">Thời gian chuẩn bị</label>
            <input type="text" id="ed-dish-time" class="form-control" value="${existing ? existing.time : '5–10 phút'}">
          </div>
        </div>

        <div class="form-group">
          <label for="ed-dish-category">Danh mục</label>
          <input type="text" id="ed-dish-category" class="form-control" value="${existing ? existing.category : 'Món Nướng Than Hoa · Đậm Đà'}" placeholder="Ví dụ: Đặc Sản Trứ Danh">
        </div>

        <div class="form-group">
          <label for="ed-dish-image">Chọn hình ảnh dĩa cơm</label>
          <select id="ed-dish-image" class="form-control">
            <option value="comtam-suon-cha.png" ${existing && existing.image === 'comtam-suon-cha.png' ? 'selected' : ''}>Dĩa Cơm Tấm Sườn Bì Chả</option>
            <option value="comtam-suon-cay.png" ${existing && existing.image === 'comtam-suon-cay.png' ? 'selected' : ''}>Dĩa Cơm Tấm Sườn Cây Mật Ong</option>
            <option value="comtam-suon-nuong.png" ${existing && existing.image === 'comtam-suon-nuong.png' ? 'selected' : ''}>Dĩa Cơm Tấm Sườn Nướng Cốt Lết</option>
            <option value="comtam-ba-roi.png" ${existing && existing.image === 'comtam-ba-roi.png' ? 'selected' : ''}>Dĩa Cơm Tấm Ba Rọi Muối Ớt</option>
            <option value="comtam-dui-ga.png" ${existing && existing.image === 'comtam-dui-ga.png' ? 'selected' : ''}>Dĩa Cơm Tấm Đùi Gà Nướng</option>
            <option value="comtam-tau-hu-ky.png" ${existing && existing.image === 'comtam-tau-hu-ky.png' ? 'selected' : ''}>Dĩa Cơm Tấm Tàu Hũ Ky Tôm Thịt</option>
            <option value="comtam-bo-sa-te.png" ${existing && existing.image === 'comtam-bo-sa-te.png' ? 'selected' : ''}>Dĩa Cơm Tấm Bò Nướng Mè Sa Tế</option>
            <option value="comtam-cha-cua.png" ${existing && existing.image === 'comtam-cha-cua.png' ? 'selected' : ''}>Dĩa Cơm Tấm Chả Cua Trứng Muối</option>
            <option value="canh-kho-qua.png" ${existing && existing.image === 'canh-kho-qua.png' ? 'selected' : ''}>Tô Canh Khổ Qua Nhồi Thịt</option>
            <option value="canh-rong-bien.png" ${existing && existing.image === 'canh-rong-bien.png' ? 'selected' : ''}>Tô Canh Rong Biển Đậu Hũ</option>
            <option value="tra-tac-sa.png" ${existing && existing.image === 'tra-tac-sa.png' ? 'selected' : ''}>Trà Tắc Sả & Flan</option>
            <option value="nuoc-sam-mia-lau.png" ${existing && existing.image === 'nuoc-sam-mia-lau.png' ? 'selected' : ''}>Nước Sâm Mía Lau</option>
          </select>
        </div>

        <div class="form-group">
          <label for="ed-dish-desc">Mô tả món ăn</label>
          <textarea id="ed-dish-desc" class="form-control" rows="3">${existing ? existing.description : 'Sườn cốt lết nướng than hoa vàng giòn thơm lừng, dùng cùng mỡ hành tóp mỡ béo ngậy và nước mắm chua ngọt đậm đà.'}</textarea>
        </div>

        <div class="form-group">
          <label for="ed-dish-tags">Tags nguyên liệu (cách nhau bởi dấu phẩy)</label>
          <input type="text" id="ed-dish-tags" class="form-control" value="${existing && existing.tags ? existing.tags.join(', ') : 'Sườn nướng, Mỡ hành, Cơm tấm'}">
        </div>

        <button type="submit" class="btn-checkout" style="margin-top:14px;">
          ${existing ? 'Cập Nhật Món Ăn' : 'Thêm Món Vào Thực Đơn'}
        </button>
      </form>
    `;

    modal.classList.add('active');
  }

  function closeDishEditorModal() {
    const modal = document.querySelector('#dish-editor-modal-overlay');
    if (modal) modal.classList.remove('active');
  }

  // --- Simulate New Order (Test feature for Admin) ---
  function simulateNewOrder() {
    const sampleNames = ["Võ Hoàng Yến", "Trương Gia Huy", "Phạm Quỳnh Anh", "Lê Thanh Sơn"];
    const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const dishes = store.getDishes();
    const d1 = dishes[Math.floor(Math.random() * dishes.length)];
    const phone = '09' + Math.floor(10000000 + Math.random() * 90000000);
    const subtotal = d1.price;
    const shippingFee = 18000;
    const totalAmount = subtotal + shippingFee;

    const ord = store.createOrder({
      customerName: name,
      phone: phone,
      address: 'Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
      notes: 'Giao nhanh giúp em ạ, đang đói',
      items: [{
        dishId: d1.id,
        name: d1.name,
        price: d1.price,
        image: d1.image,
        quantity: 1,
        toppings: ['Trứng ốp la lòng đào (+10.000đ)']
      }],
      subtotal: subtotal,
      shippingFee: shippingFee,
      pointsUsed: 0,
      discountAmount: 0,
      totalAmount: totalAmount,
      paymentMethod: 'vietqr'
    });

    playOrderChime();
    showToast(`🔔 [ĐƠN MỚI] ${name} vừa đặt đơn ${ord.orderCode} (${formatPrice(totalAmount)}đ)!`, 'warning');
    renderAdminDashboard();
  }

  // --- Public Interface for Window (ComTamApp) ---
  window.ComTamApp = {
    openCart: openCartDrawer,
    closeCart: closeCartDrawer,
    changeCartQty: (idx, qty) => store.updateCartQuantity(idx, qty),
    removeCartItem: (idx) => store.removeFromCart(idx),
    toggleUsePoints: (checked) => {
      usePointsApplied = checked;
      renderCartDrawer();
    },

    openCustomization: openToppingModal,
    closeCustomization: closeToppingModal,
    changeToppingModalQty: (delta) => {
      const el = document.querySelector('#topping-modal-qty');
      if (el) {
        let cur = parseInt(el.textContent, 10) + delta;
        if (cur < 1) cur = 1;
        el.textContent = cur;
        updateToppingTotal();
      }
    },
    updateToppingTotal: updateToppingTotal,
    confirmAddToppingToCart: confirmAddToppingToCart,

    openCheckoutModal: openCheckoutModal,
    closeCheckoutModal: closeCheckoutModal,
    selectPaymentMethod: selectPaymentMethod,
    handleCheckoutSubmit: handleCheckoutSubmit,

    openTrackingModal: openTrackingModal,
    closeTrackingModal: closeTrackingModal,
    searchOrders: searchOrders,
    viewSingleOrder: (orderId) => {
      const order = store.getOrders().find(o => o.id === orderId || o.orderCode === orderId);
      if (order) {
        openTrackingModal(order.orderCode);
      }
    },

    openKitchenTicket: openKitchenTicket,

    openMembership: openMembershipModal,
    closeMembership: closeMembershipModal,
    switchAuthTab: (tab) => {
      document.querySelector('#tab-auth-login')?.classList.toggle('active', tab === 'login');
      document.querySelector('#tab-auth-register')?.classList.toggle('active', tab === 'register');
      document.querySelector('#form-customer-login').style.display = tab === 'login' ? 'block' : 'none';
      document.querySelector('#form-customer-register').style.display = tab === 'register' ? 'block' : 'none';
    },
    quickLoginCustomer: () => {
      const res = store.login('0908123456', '123');
      if (res.success) {
        showToast('Đăng nhập thành công! Chào anh Nguyễn Văn Tuấn (VIP Gold)', 'success');
        openMembershipModal();
      }
    },
    quickLoginAdmin: () => {
      const res = store.login('admin', 'admin');
      if (res.success) {
        showToast('Chào Quản trị viên Bếp Ông Mập!', 'success');
        openAdminModal();
      }
    },
    switchMemberTab: (tab) => {
      activeMemberTab = tab;
      const u = store.getCurrentUser();
      const body = document.querySelector('#membership-modal-body');
      if (body && u) renderMemberCardView(body, u);
    },
    handleCustomerLogin: async (e) => {
      e.preventDefault();
      const id = document.querySelector('#cust-login-id').value.trim();
      const pass = document.querySelector('#cust-login-pass').value;
      const res = await store.login(id, pass);
      if (res.success && res.user) {
        showToast(`Đăng nhập thành công! Chào ${res.user.name}`, 'success');
        openMembershipModal();
      } else {
        showToast(res.error || res.message || 'Sai thông tin đăng nhập hoặc mật khẩu', 'error');
      }
    },
    handleCustomerRegister: async (e) => {
      e.preventDefault();
      const name = document.querySelector('#cust-reg-name').value.trim();
      const phone = document.querySelector('#cust-reg-phone').value.trim();
      const email = document.querySelector('#cust-reg-email').value.trim();
      const pass = document.querySelector('#cust-reg-pass').value;
      const res = await store.register(name, phone, email, pass);
      if (res.success && res.user) {
        showToast(`Chúc mừng ${name} đã nhận thẻ thành viên + 50 điểm thưởng!`, 'success');
        openMembershipModal();
      } else {
        showToast(res.error || res.message || 'Lỗi khi đăng ký', 'error');
      }
    },
    handleUpdateProfile: async (e) => {
      e.preventDefault();
      const u = store.getCurrentUser();
      if (!u) return;
      const name = document.querySelector('#member-edit-name').value.trim();
      const phone = document.querySelector('#member-edit-phone').value.trim();
      const email = document.querySelector('#member-edit-email').value.trim();
      const address = document.querySelector('#member-edit-address').value.trim();

      const res = await store.updateUser(u.id, { name, phone, email, address });
      if (res.success) {
        showToast('✓ Đã cập nhật thông tin cá nhân thành công!', 'success');
        activeMemberTab = 'profile';
        openMembershipModal();
      } else {
        showToast(res.message || 'Lỗi cập nhật', 'error');
      }
    },
    handleChangePassword: async (e) => {
      e.preventDefault();
      const u = store.getCurrentUser();
      if (!u) return;
      const oldPass = document.querySelector('#member-old-pass').value;
      const newPass = document.querySelector('#member-new-pass').value;
      const confirmPass = document.querySelector('#member-confirm-pass').value;

      if (newPass !== confirmPass) {
        showToast('Mật khẩu mới và xác nhận mật khẩu không khớp', 'error');
        return;
      }

      const res = await store.changePassword(u.id, oldPass, newPass);
      if (res.success) {
        showToast('✓ Đổi mật khẩu tài khoản thành công!', 'success');
        activeMemberTab = 'card';
        openMembershipModal();
      } else {
        showToast(res.error || res.message || 'Mật khẩu cũ không chính xác', 'error');
      }
    },
    handleDeleteMyAccount: async () => {
      const u = store.getCurrentUser();
      if (!u) return;
      const check = document.querySelector('#confirm-delete-user-check');
      if (!check || !check.checked) {
        showToast('Vui lòng tích xác nhận đồng ý xóa tài khoản', 'warning');
        return;
      }

      if (confirm(`Bạn có chắc chắn 100% muốn xóa tài khoản "${u.name}"? Thao tác này không thể hoàn tác!`)) {
        const res = await store.deleteUser(u.id);
        if (res.success) {
          showToast('Đã xóa tài khoản cá nhân. Hẹn gặp lại quý khách!', 'info');
          closeMembershipModal();
        } else {
          showToast(res.error || res.message || 'Lỗi khi xóa tài khoản', 'error');
        }
      }
    },
    logout: () => {
      store.logout();
      showToast('Đã đăng xuất', 'info');
      closeMembershipModal();
      closeAdminModal();
    },

    openAdmin: openAdminModal,
    closeAdmin: closeAdminModal,
    switchAdminTab: (tab) => {
      activeAdminTab = tab;
      renderAdminDashboard();
    },
    toggleSound: () => {
      soundEnabled = !soundEnabled;
      showToast(`Chuông báo đơn: ${soundEnabled ? 'BẬT' : 'TẮT'}`, 'info');
      renderAdminDashboard();
    },
    simulateNewOrder: simulateNewOrder,
    handleAdminLogin: async (e) => {
      e.preventDefault();
      const user = document.querySelector('#admin-user-input').value.trim();
      const pass = document.querySelector('#admin-pass-input').value;
      const res = await store.adminLogin(user, pass);
      if (res.success && res.user && res.user.role === 'admin') {
        showToast(`Chào Quản trị viên ${res.user.name}!`, 'success');
        renderAdminDashboard();
      } else {
        showToast(res.error || res.message || 'Tài khoản hoặc mật khẩu quản trị viên không chính xác', 'error');
      }
    },
    handleUpdateAdminProfile: async (e) => {
      e.preventDefault();
      const adm = store.getCurrentUser();
      if (!adm) return;
      const name = document.querySelector('#adm-prof-name').value.trim();
      const phone = document.querySelector('#adm-prof-phone').value.trim();
      const email = document.querySelector('#adm-prof-email').value.trim();
      const address = document.querySelector('#adm-prof-address').value.trim();

      const res = await store.updateUser(adm.id, { name, phone, email, address });
      if (res.success) {
        showToast('✓ Đã cập nhật hồ sơ quản trị viên!', 'success');
        renderAdminDashboard();
      } else {
        showToast(res.error || res.message || 'Lỗi cập nhật hồ sơ', 'error');
      }
    },
    handleChangeAdminPassword: async (e) => {
      e.preventDefault();
      const adm = store.getCurrentUser();
      if (!adm) return;
      const oldPass = document.querySelector('#adm-old-pass').value;
      const newPass = document.querySelector('#adm-new-pass').value;
      const confirmPass = document.querySelector('#adm-confirm-pass').value;

      if (newPass !== confirmPass) {
        showToast('Mật khẩu mới và xác nhận không khớp', 'error');
        return;
      }

      const res = await store.changePassword(adm.id, oldPass, newPass);
      if (res.success) {
        showToast('✓ Đổi mật khẩu quản trị viên thành công!', 'success');
        renderAdminDashboard();
      } else {
        showToast(res.error || res.message || 'Mật khẩu cũ không chính xác', 'error');
      }
    },
    handleCrmSearch: (val) => {
      crmSearchQuery = val.trim();
      const pane = document.querySelector('#admin-tab-members');
      if (pane) pane.innerHTML = renderMembersTab(store.getUsers());
    },
    handleCrmFilter: (val) => {
      crmSelectedTier = val;
      const pane = document.querySelector('#admin-tab-members');
      if (pane) pane.innerHTML = renderMembersTab(store.getUsers());
    },
    openCustomerDetailModal: openCustomerDetailModal,
    openEditCustomerModal: openEditCustomerModal,
    handleSaveEditCustomer: async (e, userId) => {
      e.preventDefault();
      const name = document.querySelector('#ed-cust-name').value.trim();
      const phone = document.querySelector('#ed-cust-phone').value.trim();
      const email = document.querySelector('#ed-cust-email').value.trim();
      const address = document.querySelector('#ed-cust-address').value.trim();
      const tier = document.querySelector('#ed-cust-tier').value;
      const points = parseInt(document.querySelector('#ed-cust-points').value, 10);

      const res = await store.updateUser(userId, { name, phone, email, address, tier, points });
      if (res.success) {
        showToast(`✓ Đã cập nhật khách hàng ${name}`, 'success');
        document.querySelector('#customer-edit-modal-overlay')?.classList.remove('active');
        renderAdminDashboard();
      } else {
        showToast(res.message || 'Lỗi khi cập nhật khách hàng', 'error');
      }
    },
    promptResetPassword: async (userId, userName) => {
      const newPass = prompt(`Nhập mật khẩu mới cấp cho khách hàng "${userName}":`, '123456');
      if (!newPass) return;
      const res = await store.changePassword(userId, '', newPass, true);
      if (res.success) {
        showToast(`✓ Đã cấp lại mật khẩu cho ${userName}: ${newPass}`, 'success');
      } else {
        showToast(res.message || 'Lỗi khi đặt lại mật khẩu', 'error');
      }
    },
    adminDeleteCustomer: async (userId, userName) => {
      if (confirm(`Bạn có chắc muốn xoá khách hàng "${userName}" khỏi hệ thống? Dữ liệu không thể khôi phục!`)) {
        const res = await store.deleteUser(userId);
        if (res.success) {
          showToast(`Đã xoá khách hàng ${userName}`, 'info');
          renderAdminDashboard();
        } else {
          showToast(res.message || 'Lỗi khi xoá khách hàng', 'error');
        }
      }
    },
    openCreateCustomerModal: openCreateCustomerModal,
    handleCreateCustomer: async (e) => {
      e.preventDefault();
      const name = document.querySelector('#new-cust-name').value.trim();
      const phone = document.querySelector('#new-cust-phone').value.trim();
      const email = document.querySelector('#new-cust-email').value.trim();
      const address = document.querySelector('#new-cust-address').value.trim();
      const tier = document.querySelector('#new-cust-tier').value;
      const points = parseInt(document.querySelector('#new-cust-points').value, 10) || 50;
      const password = document.querySelector('#new-cust-pass').value;

      const res = await store.createUser({ name, phone, email, address, tier, points, password, role: 'customer' });
      if (res.success) {
        showToast(`✓ Đã tạo thành công khách hàng mới: ${name}`, 'success');
        document.querySelector('#customer-create-modal-overlay')?.classList.remove('active');
        renderAdminDashboard();
      } else {
        showToast(res.error || res.message || 'Lỗi khi tạo khách hàng', 'error');
      }
    },
    openCreateAdminModal: openCreateAdminModal,
    handleCreateAdmin: async (e) => {
      e.preventDefault();
      const name = document.querySelector('#new-adm-name').value.trim();
      const phone = document.querySelector('#new-adm-phone').value.trim();
      const email = document.querySelector('#new-adm-email').value.trim();
      const role = document.querySelector('#new-adm-role').value;
      const password = document.querySelector('#new-adm-pass').value;

      const res = await store.createUser({ name, phone, email, role, password, tier: 'Diamond', points: 0 });
      if (res.success) {
        showToast(`✓ Đã thêm nhân sự: ${name} (${role === 'admin' ? 'Quản Trị Viên' : 'Nhân Viên Bếp'})`, 'success');
        document.querySelector('#admin-create-modal-overlay')?.classList.remove('active');
        renderAdminDashboard();
      } else {
        showToast(res.error || res.message || 'Lỗi khi tạo nhân sự', 'error');
      }
    },
    adminDeleteStaff: async (userId, userName) => {
      if (confirm(`Bạn có chắc muốn xoá quyền quản trị của "${userName}"?`)) {
        const res = await store.deleteUser(userId);
        if (res.success) {
          showToast(`Đã thu hồi quyền quản trị của ${userName}`, 'info');
          renderAdminDashboard();
        } else {
          showToast(res.message || 'Lỗi khi xoá quyền', 'error');
        }
      }
    },
    adminApprovePayment: (orderId) => {
      const updated = store.approveOrderPayment(orderId);
      if (updated) {
        playOrderChime();
        showToast(`⚡ Đã duyệt thanh toán đơn ${updated.orderCode}! Bếp đang nướng sườn.`, 'success');
        renderAdminDashboard();
      }
    },
    adminChangeStatus: (orderId, newStatus) => {
      if (!newStatus) return;
      const updated = store.updateOrderStatus(orderId, newStatus);
      if (updated) {
        showToast(`Đã chuyển đơn ${updated.orderCode} sang trạng thái: ${newStatus}`, 'success');
        renderAdminDashboard();
      }
    },
    adminToggleDish: (dishId) => {
      const updated = store.toggleDishAvailability(dishId);
      if (updated) {
        showToast(`Đã đổi trạng thái món: ${updated.name}`, 'info');
        renderAdminDashboard();
      }
    },
    adminDeleteDish: (dishId) => {
      if (confirm('Bạn có chắc muốn xoá món ăn này khỏi thực đơn?')) {
        store.deleteDish(dishId);
        showToast('Đã xoá món ăn', 'info');
        renderAdminDashboard();
      }
    },
    openDishEditorModal: openDishEditorModal,
    closeDishEditorModal: closeDishEditorModal,
    handleSaveDish: (e, existingId) => {
      e.preventDefault();
      const name = document.querySelector('#ed-dish-name').value.trim();
      const price = parseInt(document.querySelector('#ed-dish-price').value, 10);
      const time = document.querySelector('#ed-dish-time').value.trim();
      const category = document.querySelector('#ed-dish-category').value.trim();
      const image = document.querySelector('#ed-dish-image').value;
      const description = document.querySelector('#ed-dish-desc').value.trim();
      const tags = document.querySelector('#ed-dish-tags').value.split(',').map(t => t.trim()).filter(Boolean);

      if (existingId) {
        store.updateDish(existingId, { name, price, time, category, image, description, tags });
        showToast(`Đã cập nhật món: ${name}`, 'success');
      } else {
        store.addDish({ name, price, time, category, image, description, tags, ingredients: ['pork', 'rice', 'herbs'] });
        showToast(`Đã thêm món mới: ${name}`, 'success');
      }
      closeDishEditorModal();
      renderAdminDashboard();
    },
    adminAdjustPoints: (userId, delta) => {
      const updated = store.updateUserPoints(userId, delta, `Admin điều chỉnh ${delta > 0 ? '+' : ''}${delta} điểm`);
      if (updated) {
        showToast(`Đã cập nhật điểm cho ${updated.name}: ${updated.points} điểm`, 'success');
        renderAdminDashboard();
      }
    },

    // Dine-In Table & Waiter API
    openWaiterModal: openWaiterModal,
    closeWaiterModal: closeWaiterModal,
    submitWaiterCall: submitWaiterCall,
    submitCustomWaiterCall: submitCustomWaiterCall,
    viewCurrentTableOrders: viewCurrentTableOrders,
    promptSwitchTable: promptSwitchTable,
    selectTable: selectTable,
    clearTable: clearTable,
    adminClearWaiter: async (tableNum) => {
      await store.clearWaiterCall(tableNum);
      showToast(`✓ Đã phục vụ xong cho ${tableNum}`, 'success');
      renderAdminDashboard();
    },
    adminSetTableStatus: async (tableNum, status) => {
      await store.updateTableStatus(tableNum, status);
      showToast(`Đã đổi trạng thái ${tableNum} thành "${status}"`, 'info');
      renderAdminDashboard();
    }
  };

  // Listen to store events for reactive updates
  let lastCallingCount = 0;
  store.on('tables-changed', (detail) => {
    updateTableUI();
    const tables = detail.tables || store.getTables();
    const calling = tables.filter(t => t.waiter_call);
    if (calling.length > lastCallingCount) {
      playOrderChime();
      const latest = calling[calling.length - 1];
      showToast(`🚨 ${latest.table_number.toUpperCase()} ĐANG GỌI: ${latest.waiter_call}`, 'warning');
    }
    lastCallingCount = calling.length;
    if (document.querySelector('#admin-modal-overlay')?.classList.contains('active')) {
      renderAdminDashboard();
    }
  });

  store.on('table-changed', () => {
    updateTableUI();
  });

  store.on('cart-changed', () => {
    updateHeaderState();
    renderCartDrawer();
  });

  store.on('user-changed', () => {
    updateHeaderState();
  });

  store.on('orders-changed', () => {
    updateHeaderState();
    const query = document.querySelector('#tracking-query-input')?.value;
    if (document.querySelector('#tracking-modal-overlay')?.classList.contains('active')) {
      searchOrders(query);
    }
    if (document.querySelector('#admin-modal-overlay')?.classList.contains('active')) {
      renderAdminDashboard();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    updateHeaderState();
    updateTableUI();
  });
})();
