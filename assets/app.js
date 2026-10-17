(() => {
  "use strict";

  let dishes = (window.ComTamStore ? window.ComTamStore.getDishes() : null) || (typeof restaurantMenu !== 'undefined' ? restaurantMenu.dishes : []);
  const ingredientCatalog = (typeof restaurantMenu !== 'undefined') ? restaurantMenu.ingredientCatalog : {};

  const wheel = document.querySelector('#wheel'),
    track = document.querySelector('#menu-track'),
    details = document.querySelector('#details'),
    pager = document.querySelector('#pager');
  const PAGE_SIZE = 4;
  let PAGE_COUNT = Math.max(1, Math.ceil(dishes.length / PAGE_SIZE));
  const currencyFormatter = new Intl.NumberFormat('vi-VN');
  const formatPrice = n => currencyFormatter.format(n);
  let selectedDishIndex = 0,
    menuPage = 0,
    tableTurn = 0;
  let detailState = "idle";

  const plates = Array.from({
    length: 4
  }, (_, i) => {
    const plate = document.createElement('div');
    plate.className = 'plate-position';
    plate.style.setProperty('--angle', `${i * 90}deg`);
    plate.setAttribute('aria-hidden', 'true');
    const img = new Image();
    img.src = 'assets/' + (dishes[i] ? dishes[i].image : 'comtam-suon-cha.png');
    img.alt = '';
    img.draggable = false;
    plate.append(img);
    wheel.append(plate);
    return img;
  });

  function renderMenuPage() {
    track.replaceChildren();
    dishes.slice(menuPage * PAGE_SIZE, (menuPage + 1) * PAGE_SIZE).forEach((d, localIndex) => {
      const index = menuPage * PAGE_SIZE + localIndex,
        b = document.createElement('button');
      b.className = 'dish-card';
      b.type = 'button';
      b.dataset.index = index;
      b.setAttribute('aria-pressed', String(index === selectedDishIndex));
      b.setAttribute('aria-label', `${d.name}, ${formatPrice(d.price)} đồng`);
      b.innerHTML = `
        <img src="assets/${d.image}" alt="" draggable="false">
        <div class="card-body">
          <strong class="card-title">${d.name}</strong>
          <div class="card-footer-row">
            <span class="card-price">${formatPrice(d.price)} <small>đ</small></span>
            <span class="card-order-btn" title="Đặt món này" onclick="event.stopPropagation(); if(window.ComTamApp) window.ComTamApp.openCustomization(window.ComTamStore.getDishes()[${index}]);">⚡ Đặt</span>
          </div>
        </div>
      `;
      b.addEventListener('click', () => selectDish(index));
      track.append(b);
    });
    const counterEl = document.querySelector('#counter');
    if (counterEl) {
      counterEl.textContent = `TRANG ${String(menuPage + 1).padStart(2, '0')} / ${String(PAGE_COUNT).padStart(2, '0')}`;
    }
    [...pager.children].forEach((b, i) => {
      b.classList.toggle('active', i === menuPage);
      b.setAttribute('aria-current', i === menuPage ? 'page' : 'false');
    });
  }

  function renderPagerDots() {
    pager.replaceChildren();
    for (let i = 0; i < PAGE_COUNT; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Trang menu ${i + 1}`);
      dot.addEventListener('click', () => changeMenuPage(i));
      pager.append(dot);
    }
  }

  let menuAnimating = false;
  async function changeMenuPage(index, direction) {
    if (detailState !== 'idle' || menuAnimating) return;
    const nextPage = (index + PAGE_COUNT) % PAGE_COUNT;
    if (nextPage === menuPage) return;
    if (reducedMotion.matches) {
      menuPage = nextPage;
      renderMenuPage();
      return;
    }
    const sign = direction ?? (nextPage > menuPage ? 1 : -1);
    const controls = [document.querySelector('#previous'), document.querySelector('#next'), ...pager.children];
    const animations = [];
    menuAnimating = true;
    track.inert = true;
    track.setAttribute('aria-busy', 'true');
    controls.forEach(b => b.setAttribute('aria-disabled', 'true'));
    try {
      await Promise.all(dishes.slice(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE).map(d => {
        const img = new Image();
        img.src = 'assets/' + d.image;
        return img.decode().catch(() => {});
      }));
      const oldCards = [...track.children],
        layout = getComputedStyle(track);
      const oldHeight = track.getBoundingClientRect().height;
      const outgoing = document.createElement('div');
      outgoing.className = 'menu-outgoing';
      outgoing.setAttribute('aria-hidden', 'true');
      outgoing.inert = true;
      outgoing.style.gridTemplateColumns = layout.gridTemplateColumns;
      outgoing.style.gap = layout.gap;
      outgoing.style.padding = layout.padding;
      track.style.minHeight = `${oldHeight}px`;
      track.classList.add('is-paging');
      menuPage = nextPage;
      renderMenuPage();
      const newCards = [...track.children];
      outgoing.append(...oldCards);
      track.append(outgoing);
      const distance = track.getBoundingClientRect().width + 16;
      const speed = 1.2,
        stagger = 65 / speed,
        exitDuration = 620 / speed,
        entryDuration = 680 / speed;
      const entryStart = exitDuration + (oldCards.length - 1) * stagger;
      const slide = (elements, entering) => elements.map((el, i) => {
        const order = sign > 0 ? i : elements.length - 1 - i;
        const animation = el.animate([{
          transform: `translateX(${entering ? sign * distance : 0}px)`
        }, {
          transform: `translateX(${entering ? 0 : -sign * distance}px)`
        }], {
          duration: entering ? entryDuration : exitDuration,
          delay: order * stagger + (entering ? entryStart : 0),
          easing: entering ? 'cubic-bezier(.22,.61,.36,1)' : 'cubic-bezier(.4,0,.6,1)',
          fill: 'both'
        });
        animations.push(animation);
        return animation.finished;
      });
      await Promise.all([...slide(oldCards, false), ...slide(newCards, true)]);
    } finally {
      track.querySelector('.menu-outgoing')?.remove();
      animations.forEach(a => a.cancel());
      track.classList.remove('is-paging');
      track.style.minHeight = '';
      track.inert = false;
      track.removeAttribute('aria-busy');
      controls.forEach(b => b.removeAttribute('aria-disabled'));
      menuAnimating = false;
    }
  }

  function selectDish(index, initial = false) {
    if (detailState !== "idle") return;
    if (index === selectedDishIndex && !initial) return;
    const d = dishes[index];
    if (!d) return;

    if (!initial) {
      tableTurn++;
      plates[tableTurn % 4].src = 'assets/' + d.image;
      wheel.style.setProperty('--rotation', `${-tableTurn * 90}deg`);
    } else {
      plates[tableTurn % 4].src = 'assets/' + d.image;
    }
    selectedDishIndex = index;
    const nameEl = document.querySelector('#dish-name');
    const catEl = document.querySelector('#category');
    const descEl = document.querySelector('#description');
    const priceEl = document.querySelector('#price');
    const timeEl = document.querySelector('#time');
    const tagsEl = document.querySelector('#tags');

    if (nameEl) nameEl.textContent = d.name;
    if (catEl) catEl.textContent = d.category;
    if (descEl) descEl.textContent = d.description;
    if (priceEl) priceEl.innerHTML = formatPrice(d.price) + ' <small>đ</small>';
    if (timeEl) timeEl.textContent = d.time;
    if (tagsEl) {
      if (d.components && d.components.length > 0) {
        tagsEl.className = 'stage-components-container';
        tagsEl.replaceChildren(...d.components.map(c => {
          const el = document.createElement('span');
          el.className = 'stage-comp-pill';
          const pText = c.price > 0 ? (c.price >= 1000 ? (c.price / 1000) + 'k' : formatPrice(c.price)) : '0đ';
          el.innerHTML = `<span class="pill-ico">${c.icon || '🥢'}</span> <span class="pill-name">${c.name}</span> <b class="pill-cost ${c.price === 0 ? 'cost-free' : ''}">${pText}</b>`;
          el.style.cursor = 'pointer';
          el.title = 'Bấm để xem chi tiết thành phần & giá';
          el.onclick = () => openDishDetails();
          return el;
        }));
      } else {
        tagsEl.className = 'stage-components-container';
        tagsEl.replaceChildren(...(d.tags || []).map(t => {
          const el = document.createElement('span');
          el.className = 'stage-comp-pill';
          el.textContent = t;
          return el;
        }));
      }
    }
    [...track.children].forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.index) === selectedDishIndex)));
    if (!initial && details) {
      details.classList.remove('changing');
      void details.offsetWidth;
      details.classList.add('changing');
    }
  }

  document.querySelector('#previous')?.addEventListener('click', () => changeMenuPage(menuPage - 1, -1));
  document.querySelector('#next')?.addEventListener('click', () => changeMenuPage(menuPage + 1, 1));
  track.addEventListener('keydown', e => {
    const i = [...track.children].indexOf(document.activeElement);
    if (i < 0) return;
    let target;
    if (e.key === 'ArrowRight') target = (i + 1) % PAGE_SIZE;
    if (e.key === 'ArrowLeft') target = (i + PAGE_SIZE - 1) % PAGE_SIZE;
    if (e.key === 'Home') target = 0;
    if (e.key === 'End') target = PAGE_SIZE - 1;
    if (target !== undefined) {
      e.preventDefault();
      track.children[target].focus({
        preventScroll: true
      });
    }
  });

  document.addEventListener('pointerdown', () => {
    document.documentElement.dataset.input = 'pointer';
  }, true);
  document.addEventListener('keydown', e => {
    if (['Tab', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) document.documentElement.dataset.input = 'keyboard';
  }, true);

  const stage = document.querySelector('#stage'),
    dialog = document.querySelector('#dish-dialog'),
    panel = document.querySelector('#detail-panel'),
    flyer = document.querySelector('#flying-plate');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let transitionId = 0,
    activeAnimations = [],
    returnFocus = null,
    previousOverflow = '',
    detailMotion = null;

  function updateDetailLiveTotal() {
    const d = dishes[selectedDishIndex];
    if (!d) return;
    const qty = parseInt(document.querySelector('#modal-dish-qty')?.textContent || '1', 10);
    let extraCost = 0;
    document.querySelectorAll('#modal-toppings-list input[type="checkbox"]:checked').forEach(cb => {
      const card = cb.closest('.modal-topping-card');
      if (card) {
        extraCost += parseInt(card.dataset.price || '0', 10);
        card.classList.add('selected');
      }
    });
    document.querySelectorAll('#modal-toppings-list input[type="checkbox"]:not(:checked)').forEach(cb => {
      cb.closest('.modal-topping-card')?.classList.remove('selected');
    });

    const singleTotal = d.price + extraCost;
    const grandTotal = singleTotal * qty;
    const liveTotalEl = document.querySelector('#modal-live-total');
    if (liveTotalEl) {
      liveTotalEl.innerHTML = formatPrice(grandTotal) + ' <small>đ</small>';
    }
  }

  function renderDishDetails(d) {
    document.querySelector('#modal-name').textContent = d.name;
    document.querySelector('#modal-category').textContent = d.category;
    document.querySelector('#modal-description').textContent = d.description;
    document.querySelector('#modal-time').textContent = d.time;
    const priceEl = document.querySelector('#modal-price');
    if (priceEl) priceEl.innerHTML = formatPrice(d.price) + ' <small>đ</small>';

    // Set dish image
    const modalImg = document.querySelector('#modal-dish-img');
    if (modalImg) {
      modalImg.src = 'assets/' + (d.image || 'comtam-suon-cha.png');
      modalImg.alt = d.name;
    }

    // Reset quantity and notes
    const qtyEl = document.querySelector('#modal-dish-qty');
    if (qtyEl) qtyEl.textContent = '1';
    const notesInput = document.querySelector('#modal-dish-notes');
    if (notesInput) notesInput.value = '';
    document.querySelectorAll('#quick-note-tags .quick-note-tag').forEach(tag => tag.classList.remove('active'));

    // Render Components Breakdown
    const ingredientsEl = document.querySelector('#modal-ingredients');
    const summaryEl = document.querySelector('#modal-components-summary');
    if (ingredientsEl) {
      if (d.components && d.components.length > 0) {
        ingredientsEl.replaceChildren(...d.components.map(comp => {
          const item = document.createElement('li');
          item.className = 'component-card-item';
          const priceDisplay = comp.price > 0 ? formatPrice(comp.price) + ' đ' : 'Miễn phí kèm đĩa';
          const isFree = comp.price === 0;
          item.innerHTML = `
            <div class="comp-icon-badge">${comp.icon || '🍱'}</div>
            <div class="comp-text">
              <strong class="comp-title">${comp.name}</strong>
              <span class="comp-role-badge">${comp.role || 'Thành phần'}</span>
            </div>
            <div class="comp-price-val ${isFree ? 'is-free' : ''}">${priceDisplay}</div>
          `;
          return item;
        }));

        if (summaryEl) {
          const sumPrices = d.components.reduce((acc, c) => acc + (c.price || 0), 0);
          if (sumPrices > d.price) {
            const saved = sumPrices - d.price;
            summaryEl.innerHTML = `
              <div class="combo-savings-banner">
                <span>✨ <b>Giá trọn gói combo: ${formatPrice(d.price)} đ</b> (Tiết kiệm ${formatPrice(saved)} đ so với tổng giá gọi lẻ từng phần ${formatPrice(sumPrices)} đ)</span>
              </div>
            `;
          } else {
            summaryEl.innerHTML = `
              <div class="combo-savings-banner">
                <span>🥢 Món ăn nóng hổi vừa ra lò, nướng than hoa vàng giòn thơm lừng</span>
              </div>
            `;
          }
        }
      } else {
        ingredientsEl.replaceChildren(...(d.tags || []).map(tag => {
          const item = document.createElement('li');
          item.className = 'component-card-item';
          item.innerHTML = `
            <div class="comp-icon-badge">🥢</div>
            <div class="comp-text">
              <strong class="comp-title">${tag}</strong>
              <span class="comp-role-badge">Nguyên liệu</span>
            </div>
            <div class="comp-price-val is-free">Kèm đĩa</div>
          `;
          return item;
        }));
        if (summaryEl) summaryEl.innerHTML = '';
      }
    }

    // Render Toppings Selector
    const toppingsListEl = document.querySelector('#modal-toppings-list');
    if (toppingsListEl) {
      const defaultToppings = [
        { id: "top_egg", name: "Trứng ốp la lòng đào", price: 10000 },
        { id: "top_cha", name: "Chả trứng hoàng kim hấp", price: 15000 },
        { id: "top_bi", name: "Bì heo thính thơm giòn", price: 10000 },
        { id: "top_suon", name: "Sườn cốt lết than hoa thêm", price: 35000 },
        { id: "top_topmo", name: "Chén tóp mỡ mỡ hành giòn", price: 8000 },
        { id: "top_canh", name: "Canh khổ qua nhồi thịt", price: 20000 },
        { id: "top_rongbien", name: "Canh rong biển đậu hũ", price: 15000 },
        { id: "top_com", name: "Thêm một chén cơm tấm", price: 10000 }
      ];

      const toppings = (d.toppings && d.toppings.length > 0) ? d.toppings : defaultToppings;
      toppingsListEl.innerHTML = toppings.map(top => `
        <label class="modal-topping-card" data-id="${top.id || ''}" data-name="${top.name}" data-price="${top.price}">
          <input type="checkbox" class="dish-detail-topping-cb" value="${top.id || top.name}">
          <div class="topping-card-content">
            <span class="topping-card-name">${top.name}</span>
            <span class="topping-card-price">+${formatPrice(top.price)} đ</span>
          </div>
        </label>
      `).join('');

      toppingsListEl.querySelectorAll('.dish-detail-topping-cb').forEach(cb => {
        cb.addEventListener('change', updateDetailLiveTotal);
      });
    }

    updateDetailLiveTotal();
  }

  async function runDetailAnimation(el, keyframes, options) {
    const animation = el.animate(keyframes, {
      fill: 'forwards',
      ...options
    });
    activeAnimations.push(animation);
    await animation.finished;
  }

  function resetDishDetails() {
    if (detailState === 'idle') return;
    transitionId++;
    detailState = 'idle';
    const wheelTransition = wheel.style.transition;
    wheel.style.transition = 'none';
    document.body.classList.remove('dish-open');
    dialog.classList.remove('returning');
    void wheel.offsetWidth;
    activeAnimations.forEach(a => a.cancel());
    activeAnimations = [];
    detailMotion = null;
    void wheel.offsetWidth;
    wheel.style.transition = wheelTransition;
    document.body.style.overflow = previousOverflow;
    plates.forEach(img => img.classList.remove('lifted'));
    panel.hidden = true;
    panel.inert = false;
    panel.style.visibility = '';
    panel.classList.remove('forming');
    flyer.hidden = true;
    dialog.removeAttribute('aria-busy');
    document.querySelector('#detail-status').textContent = '';
    if (dialog.open) dialog.close();
    if (returnFocus?.isConnected) returnFocus.focus({
      preventScroll: true
    });
  }

  async function closeDishDetails() {
    if (detailState === 'idle' || detailState.startsWith('closing') || detailState === 'returning') return;
    if (detailState !== 'open' || reducedMotion.matches || !detailMotion || detailMotion.width !== innerWidth || detailMotion.height !== innerHeight) {
      resetDishDetails();
      return;
    }
    const run = ++transitionId;
    panel.inert = true;
    dialog.focus({
      preventScroll: true
    });
    dialog.setAttribute('aria-busy', 'true');
    const reverse = animations => Promise.all(animations.map(animation => {
      animation.reverse();
      return animation.finished;
    }));
    try {
      detailState = 'closing-content';
      await reverse(detailMotion.content);
      if (run !== transitionId) return;
      detailState = 'closing-surface';
      panel.hidden = true;
      flyer.hidden = false;
      await reverse([detailMotion.surface]);
      if (run !== transitionId) return;
      detailState = 'returning';
      dialog.classList.add('returning');
      const returnAnimations = detailMotion.flight.filter(animation => animation.effect.getKeyframes().some(frame => frame.opacity !== undefined));
      returnAnimations.forEach(animation => {
        animation.currentTime = 1000;
      });
      const returnPlate = runDetailAnimation(flyer, [{
        transform: getComputedStyle(flyer).transform
      }, {
        transform: `translate(0,0) scale(${detailMotion.homeScaleX},${detailMotion.homeScaleY})`
      }], {
        delay: 420,
        duration: 580,
        easing: 'cubic-bezier(.4,0,.2,1)'
      });
      const lowerTable = runDetailAnimation(wheel, [{
        translate: getComputedStyle(wheel).translate
      }, {
        translate: '0 0'
      }], {
        delay: 420,
        duration: 580,
        easing: 'cubic-bezier(.4,0,.2,1)'
      });
      await Promise.all([reverse(returnAnimations), returnPlate, lowerTable]);
      if (run === transitionId) resetDishDetails();
    } catch (error) {
      if (run === transitionId) {
        resetDishDetails();
        console.error('Dish close transition failed', error);
      }
    }
  }

  async function openDishDetails() {
    if (detailState !== 'idle' || menuAnimating) return;
    detailState = 'flying';
    const run = ++transitionId;
    returnFocus = document.activeElement;
    detailMotion = {
      width: innerWidth,
      height: innerHeight
    };
    wheel.getAnimations().forEach(a => a.finish());
    const img = plates[tableTurn % 4],
      rect = img.getBoundingClientRect(),
      d = dishes[selectedDishIndex];
    const restingSize = getComputedStyle(img);
    detailMotion.homeScaleX = parseFloat(restingSize.width) / rect.width;
    detailMotion.homeScaleY = parseFloat(restingSize.height) / rect.height;
    renderDishDetails(d);
    flyer.querySelector('img').src = img.src;
    flyer.hidden = false;
    flyer.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
    panel.hidden = true;
    panel.inert = true;
    panel.style.visibility = '';
    panel.scrollTop = 0;
    panel.classList.remove('forming');
    dialog.setAttribute('aria-busy', 'true');
    document.querySelector('#detail-status').textContent = 'Đang mở chi tiết ' + d.name;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.focus({
      preventScroll: true
    });
    img.classList.add('lifted');
    document.body.classList.add('dish-open');
    try {
      if (!reducedMotion.matches) {
        const size = Math.min(340, innerWidth - 64, innerHeight * .46);
        const dx = innerWidth / 2 - (rect.left + rect.width / 2),
          dy = innerHeight / 2 - (rect.top + rect.height / 2),
          scale = size / rect.width;
        const pose = `translate(${dx}px,${dy}px) scale(${scale})`;
        detailState = 'spinning';
        const surface = flyer.querySelector('.plate-solid'),
          photo = flyer.querySelector('img');
        await Promise.all([runDetailAnimation(flyer, [{
          transform: 'translate(0,0) scale(1)'
        }, {
          transform: pose
        }], {
          duration: 580,
          easing: 'cubic-bezier(.22,.7,.2,1)'
        }), runDetailAnimation(photo, [{
          transform: 'rotate(0deg)'
        }, {
          transform: 'rotate(360deg)'
        }], {
          duration: 1000,
          easing: 'linear'
        }), runDetailAnimation(surface, [{
          opacity: 0
        }, {
          opacity: 1
        }], {
          delay: 800,
          duration: 160,
          easing: 'ease-out'
        }), runDetailAnimation(photo, [{
          opacity: 1
        }, {
          opacity: 0
        }], {
          delay: 800,
          duration: 200,
          easing: 'ease-in-out'
        })]);
        if (run !== transitionId) return;
        detailMotion.flight = activeAnimations.slice();
        detailState = 'expanding';
        panel.classList.add('forming');
        panel.hidden = false;
        panel.style.visibility = 'hidden';
        const bounds = panel.getBoundingClientRect(),
          panelStyle = getComputedStyle(panel);
        const corner = parseFloat(panelStyle.borderTopLeftRadius);
        const targetWidth = bounds.width / scale,
          targetHeight = bounds.height / scale;
        const offsetX = (bounds.left + bounds.width / 2 - innerWidth / 2) / scale;
        const offsetY = (bounds.top + bounds.height / 2 - innerHeight / 2) / scale;
        await runDetailAnimation(surface, [{
          width: `${rect.width * .92}px`,
          height: `${rect.height * .92}px`,
          borderRadius: '50%',
          transform: 'translate(-50%,-50%)',
          boxShadow: '0 0 0 #13211400'
        }, {
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          borderRadius: `${corner / scale}px`,
          transform: `translate(calc(-50% + ${offsetX}px),calc(-50% + ${offsetY}px))`,
          boxShadow: `0 ${30 / scale}px ${100 / scale}px #1321142a`
        }], {
          duration: 820,
          easing: 'cubic-bezier(.4,0,.2,1)'
        });
        if (run !== transitionId) return;
        detailMotion.surface = activeAnimations[activeAnimations.length - 1];
        panel.style.visibility = '';
        flyer.hidden = true;
        panel.classList.remove('forming');
        detailState = 'revealing';
        const contentStart = activeAnimations.length;
        await Promise.all([...panel.children].map(el => runDetailAnimation(el, [{
          opacity: 0,
          transform: 'translateY(7px)'
        }, {
          opacity: 1,
          transform: 'translateY(0)'
        }], {
          duration: 220,
          easing: 'ease-out'
        })));
        detailMotion.content = activeAnimations.slice(contentStart);
      }
      if (run !== transitionId) return;
      flyer.hidden = true;
      panel.hidden = false;
      panel.inert = false;
      detailState = 'open';
      dialog.removeAttribute('aria-busy');
      document.querySelector('#detail-status').textContent = '';
      panel.querySelector('.dialog-close').focus({
        preventScroll: true
      });
    } catch (error) {
      if (run === transitionId) {
        closeDishDetails();
        console.error('Dish detail transition failed', error);
      }
    }
  }

  stage.addEventListener('click', e => {
    if (e.target.closest('.table-wheel')) openDishDetails();
  });
  stage.addEventListener('keydown', e => {
    if (e.target === stage && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openDishDetails();
    }
  });

  // Quantity buttons in Modal Dialog
  const modalQtyMinus = document.querySelector('#btn-modal-qty-minus');
  const modalQtyPlus = document.querySelector('#btn-modal-qty-plus');
  const modalQtyDisplay = document.querySelector('#modal-dish-qty');
  if (modalQtyMinus && modalQtyDisplay) {
    modalQtyMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      let cur = parseInt(modalQtyDisplay.textContent || '1', 10);
      if (cur > 1) {
        modalQtyDisplay.textContent = cur - 1;
        updateDetailLiveTotal();
      }
    });
  }
  if (modalQtyPlus && modalQtyDisplay) {
    modalQtyPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      let cur = parseInt(modalQtyDisplay.textContent || '1', 10);
      modalQtyDisplay.textContent = cur + 1;
      updateDetailLiveTotal();
    });
  }

  // Quick kitchen note tags in Modal Dialog
  const quickNoteTags = document.querySelectorAll('#quick-note-tags .quick-note-tag');
  quickNoteTags.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('active');
      const activeNotes = Array.from(document.querySelectorAll('#quick-note-tags .quick-note-tag.active'))
        .map(b => b.dataset.note);
      const notesInput = document.querySelector('#modal-dish-notes');
      if (notesInput) {
        notesInput.value = activeNotes.join(', ');
      }
    });
  });

  // Order button in Modal Dialog - Directly add dish + selected toppings to Cart
  const orderDishBtn = document.querySelector('#order-dish');
  if (orderDishBtn) {
    orderDishBtn.addEventListener('click', () => {
      const d = dishes[selectedDishIndex];
      if (!d) return;

      const qty = parseInt(document.querySelector('#modal-dish-qty')?.textContent || '1', 10);
      const selectedBoxes = document.querySelectorAll('#modal-toppings-list input[type="checkbox"]:checked');
      const selectedToppings = [];
      let extraCost = 0;

      selectedBoxes.forEach(box => {
        const card = box.closest('.modal-topping-card');
        if (card) {
          const topPrice = parseInt(card.dataset.price || '0', 10);
          selectedToppings.push(`${card.dataset.name} (+${formatPrice(topPrice)}đ)`);
          extraCost += topPrice;
        }
      });

      const notes = document.querySelector('#modal-dish-notes')?.value.trim() || '';

      if (window.ComTamStore) {
        window.ComTamStore.addToCart({
          dishId: d.id,
          name: d.name,
          price: d.price + extraCost,
          unitPrice: d.price,
          image: d.image,
          quantity: qty,
          toppings: selectedToppings,
          toppingsCost: extraCost,
          notes: notes
        });
      }

      if (window.showToast) {
        window.showToast(`Đã thêm ${qty} phần ${d.name} vào giỏ hàng!`, 'success');
      }

      closeDishDetails();
      if (window.ComTamApp && window.ComTamApp.openCart) {
        window.ComTamApp.openCart();
      }
    });
  }

  // Quick order button in Details section
  const quickOrderBtn = document.querySelector('#btn-quick-order');
  if (quickOrderBtn) {
    quickOrderBtn.addEventListener('click', () => {
      openDishDetails();
    });
  }

  // Button to open details dialog from stage
  const openDetailBtn = document.querySelector('#btn-open-dish-modal');
  if (openDetailBtn) {
    openDetailBtn.addEventListener('click', () => {
      openDishDetails();
    });
  }

  dialog.querySelector('.dialog-close').addEventListener('click', closeDishDetails);
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    closeDishDetails();
  });
  dialog.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const buttons = [...dialog.querySelectorAll('button')].filter(b => b.getClientRects().length && !b.disabled && !b.closest('[inert]'));
    const first = buttons[0],
      last = buttons[buttons.length - 1];
    if (!first) {
      e.preventDefault();
      dialog.focus({
        preventScroll: true
      });
      return;
    }
    if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      e.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener('click', e => {
    if (e.target === dialog && detailState === 'open') closeDishDetails();
  });
  dialog.addEventListener('close', () => {
    if (!dialog.open && detailState !== 'idle') resetDishDetails();
  });

  // Listen to dishes changes from store
  if (window.ComTamStore) {
    window.ComTamStore.on('dishes-changed', () => {
      dishes = window.ComTamStore.getDishes();
      PAGE_COUNT = Math.max(1, Math.ceil(dishes.length / PAGE_SIZE));
      if (menuPage >= PAGE_COUNT) menuPage = PAGE_COUNT - 1;
      if (selectedDishIndex >= dishes.length) selectedDishIndex = 0;
      renderPagerDots();
      renderMenuPage();
      selectDish(selectedDishIndex, true);
    });
  }

  renderPagerDots();
  renderMenuPage();
  selectDish(0, true);
})();
