// ============================================================
// app.js — Tomas Morato Restaurant Discovery
// All page logic: routing, map, wheel, swipe, filters, modals
// Refactored for backend-ready async API service layer
// ============================================================

/* ==================== ROUTER ==================== */
const PAGES = ['home', 'food-radar', 'restaurant-list', 'food-wheel', 'food-swipe', 'dashboard'];

function navigateTo(pageId) {
  if (pageId === 'dashboard') {
    const token = localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
    if (!token) {
      openLoginModal();
      return;
    }
  }

  PAGES.forEach(p => {
    const section = document.getElementById(p);
    const link = document.querySelector(`[data-page="${p}"]`);
    if (section) section.classList.toggle('active', p === pageId);
    if (link) link.classList.toggle('active', p === pageId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Lazy-init page features
  if (pageId === 'food-radar') initFoodRadar();
  if (pageId === 'food-wheel') initFoodWheel();
  if (pageId === 'food-swipe') initFoodSwipe();
  if (pageId === 'restaurant-list') renderRestaurantList();
  if (pageId === 'dashboard') initDashboard();
}

document.addEventListener('DOMContentLoaded', () => {
  // Nav link clicks
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.page));
  });

  // Scroll nav style
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Start on home
  navigateTo('home');

  // Init toast container
  if (!document.querySelector('.toast-container')) {
    const tc = document.createElement('div');
    tc.className = 'toast-container';
    document.body.appendChild(tc);
  }
});

/* ==================== TOAST SYSTEM ==================== */
function showToast(message, icon = '🍴') {
  const container = document.querySelector('.toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ==================== EMOJI MAPS FOR CARD COLORS ==================== */
const CUISINE_EMOJI = {
  'Filipino': '🇵🇭', 'Filipino Modern': '🍲', 'Steakhouse': '🥩',
  'Mexican': '🌮', 'Organic / Health': '🥗', 'Italian Pizza': '🍕',
  'Italian': '🍝', 'Café / International': '☕', 'Japanese': '🍱',
  'Café / Japanese': '🍵', 'International Buffet': '🍽️', 'Milk Tea / Café': '🧋',
  'Filipino Comfort': '🏠', 'Pizza / Italian': '🍕', 'Seafood': '🦞'
};

/* ==================== OWNER LOGIN & LOGOUT ==================== */
function openLoginModal() {
  document.getElementById('login-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Reset form state
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  const err = document.getElementById('login-error');
  if (err) err.style.display = 'none';
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function switchLoginTab(role) {
  document.getElementById('login-role').value = role;
  // Toggle tabs
  document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${role}`).classList.add('active');
  // Toggle hint cards
  document.getElementById('hint-admin').style.display = role === 'admin' ? 'block' : 'none';
  document.getElementById('hint-owner').style.display = role === 'owner' ? 'block' : 'none';
  // Clear errors
  const err = document.getElementById('login-error');
  if (err) err.style.display = 'none';
}

function toggleLoginPassword() {
  const input = document.getElementById('login-password');
  const btn = document.getElementById('pw-toggle');
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

async function handleOwnerLoginSubmit() {
  const user = document.getElementById('login-username').value.trim();
  const pass = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-submit-btn');

  if (errEl) errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const res = await API.ownerLogin(user, pass, role);

    // Handle pending claim
    const pendingClaimId = localStorage.getItem('pending_claim_id');
    if (pendingClaimId) {
      await API.claimRestaurant(parseInt(pendingClaimId));
      localStorage.removeItem('pending_claim_id');
      showToast('Listing claimed successfully!', '🏪');
    } else {
      showToast(`Welcome back, ${res.displayName}!`, '✅');
    }

    closeLoginModal();
    navigateTo('dashboard');
  } catch (e) {
    if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
    else showToast(e.message, '❌');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

function ownerLogout() {
  localStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
  localStorage.removeItem('tm_user_role');
  localStorage.removeItem('tm_user_name');
  showToast('Logged out successfully', '🚪');
  navigateTo('home');
}

async function claimListing(id) {
  try {
    const token = localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
    if (!token) {
      showToast('Please sign in to claim this listing', '🔑');
      localStorage.setItem('pending_claim_id', id);
      closeModal();
      openLoginModal();
      return;
    }
    showToast('Claiming restaurant...', '🏪');
    await API.claimRestaurant(id);
    showToast('Listing claimed! You can now manage it in the Owner Dashboard.', '✅');
    closeModal();
    navigateTo('dashboard');
  } catch (e) {
    showToast(e.message, '❌');
  }
}

/* ==================== FOOD RADAR ==================== */
let map = null, radiusCircle = null, radarMarkers = [], radarInited = false, radarFilters = { openNow: false, cuisine: null };

function initFoodRadar() {
  if (radarInited) return;
  radarInited = true;

  const center = TOMAS_MORATO_CENTER;

  // Init Leaflet map
  map = L.map('leaflet-map', {
    center: [center.lat, center.lng],
    zoom: 15,
    zoomControl: false
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // User center marker
  const centerIcon = L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;background:#FF6B00;border-radius:50%;border:3px solid white;box-shadow:0 0 20px rgba(255,107,0,0.7);"></div>`,
    iconAnchor: [10, 10]
  });
  L.marker([center.lat, center.lng], { icon: centerIcon }).addTo(map);

  // Draw initial radius
  updateRadarRadius(1500);

  // Radius slider
  const slider = document.getElementById('radar-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      const km = parseFloat(slider.value);
      document.getElementById('radius-display').textContent = km.toFixed(1) + ' km';
      updateRadarRadius(km * 1000);
    });
  }

  // Filter chips
  document.querySelectorAll('.map-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chip.classList.toggle('active');
      if (filter === 'open-now') {
        radarFilters.openNow = chip.classList.contains('active');
      }
      updateRadarRadius(parseFloat(slider?.value || 1.5) * 1000);
    });
  });
}

async function updateRadarRadius(meters) {
  const center = TOMAS_MORATO_CENTER;
  const count = document.getElementById('radar-count');
  if (count) count.textContent = 'Searching...';

  // Draw circle
  if (radiusCircle) map.removeLayer(radiusCircle);
  radiusCircle = L.circle([center.lat, center.lng], {
    radius: meters,
    color: '#FF6B00',
    fillColor: '#FF6B00',
    fillOpacity: 0.06,
    weight: 2
  }).addTo(map);

  try {
    const nearby = await API.getNearbyRestaurants(center.lat, center.lng, meters, {
      openNow: radarFilters.openNow,
      cuisine: radarFilters.cuisine
    });

    // Remove old markers
    radarMarkers.forEach(m => map.removeLayer(m));
    radarMarkers = [];

    // Place markers
    nearby.forEach(r => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;background:#FF6B00;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid rgba(255,255,255,0.4);box-shadow:0 2px 10px rgba(255,107,0,0.5);display:flex;align-items:center;justify-content:center;">
                 <div style="width:12px;height:12px;background:white;border-radius:50%;transform:rotate(45deg);"></div>
               </div>`,
        iconAnchor: [16, 32]
      });
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:'Outfit',sans-serif;min-width:200px;padding:4px;">
          <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;">${r.name}</div>
          <div style="font-size:12px;color:#FF6B00;margin-bottom:6px;">${r.cuisine} • ${priceSymbol(r.priceRange)}</div>
          <div style="font-size:12px;color:#9B9287;">⭐ ${r.rating} • ${r.reviews} reviews</div>
          <button onclick="openRestaurantModal(${r.id})" style="margin-top:10px;padding:8px 16px;background:#FF6B00;color:white;border:none;border-radius:20px;font-size:12px;cursor:pointer;width:100%;font-family:'Outfit',sans-serif;font-weight:600;">View Details</button>
        </div>
      `);
      radarMarkers.push(marker);
    });

    renderRadarSidebar(nearby);
  } catch (err) {
    if (count) count.textContent = 'Error loading';
    showToast(err.message, '❌');
  }
}

function renderRadarSidebar(nearby) {
  const list = document.getElementById('radar-list');
  const count = document.getElementById('radar-count');
  if (!list) return;

  if (count) count.textContent = `${nearby.length} restaurant${nearby.length !== 1 ? 's' : ''} found`;

  list.innerHTML = nearby.slice(0, 10).map((r, i) => {
    const wait = WAIT_LABELS[r.waitTime];
    return `
      <div class="radar-restaurant-item" onclick="openRestaurantModal(${r.id})">
        <div class="radar-item-rank">${i + 1}</div>
        <div class="radar-item-info">
          <div class="radar-item-name">${r.name}</div>
          <div class="radar-item-meta">
            <span>⭐ ${r.rating}</span>
            <span>${r.cuisine}</span>
            <span class="wait-badge ${r.waitTime === 'none' ? 'wait-none' : r.waitTime === '15-30' ? 'wait-mid' : 'wait-packed'}">${wait.icon} ${wait.label}</span>
          </div>
        </div>
        <div class="radar-item-dist">${formatDistance(r._dist)}</div>
      </div>
    `;
  }).join('') || `<div class="empty-state"><div class="empty-icon">🔍</div><p>No restaurants found. Try increasing radius.</p></div>`;
}

/* ==================== RESTAURANT LIST PAGE ==================== */
let listFilters = { search: '', cuisine: '', ambiance: '', dietary: '', openNow: false };

async function renderRestaurantList() {
  const grid = document.getElementById('restaurant-grid');
  if (!grid) return;

  // Show Skeleton state
  grid.innerHTML = `
    <div class="skeleton-grid">
      ${Array(6).fill().map(() => `
        <div class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line subtitle"></div>
            <div class="skeleton-line desc"></div>
            <div class="skeleton-line desc-short"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  try {
    const filtered = await API.getRestaurants(listFilters);
    const countEl = document.getElementById('list-count');
    if (countEl) countEl.textContent = `${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🍽️</div><p>No restaurants match your filters.<br>Try adjusting your search.</p></div>`;
      return;
    }

    grid.innerHTML = filtered.map(r => {
      const open = isOpenNow(r.hours);
      const wait = WAIT_LABELS[r.waitTime];
      const emoji = CUISINE_EMOJI[r.cuisine] || '🍴';

      return `
        <div class="restaurant-card" onclick="openRestaurantModal(${r.id})">
          <div class="card-image-wrap">
            <div class="card-img-placeholder" style="background:linear-gradient(135deg, ${r.imgColor}, #0F0C0A);">${emoji}</div>
            <div class="card-rating-badge">⭐ ${r.rating}</div>
            <div class="card-wait">
              <span class="wait-badge ${r.waitTime === 'none' ? 'wait-none' : r.waitTime === '15-30' ? 'wait-mid' : 'wait-packed'}">${wait.icon} ${wait.label}</span>
            </div>
            <span class="card-open-badge ${open ? 'badge-open' : 'badge-closed'}">${open ? '● Open' : '● Closed'}</span>
          </div>
          <div class="card-body">
            <div class="card-top-row">
              <div class="card-name">${r.name}</div>
              <div class="card-price">${priceSymbol(r.priceRange)}</div>
            </div>
            <div class="card-cuisine">${r.cuisine}</div>
            <div class="card-desc">${r.description}</div>
            <div class="card-tags">
              ${r.ambiance.slice(0, 2).map(a => `<span class="tag">${AMBIANCE_LABELS[a]}</span>`).join('')}
              ${r.dietary.slice(0, 1).map(d => `<span class="tag orange">${DIETARY_LABELS[d]}</span>`).join('')}
            </div>
            <div class="card-footer">
              <div class="card-daily-special">🔥 ${r.dailySpecial.title}</div>
              <button class="card-view-btn" onclick="event.stopPropagation(); openRestaurantModal(${r.id})">View →</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">❌</div><p>Failed to load restaurants.<br>${err.message}</p></div>`;
  }

  // Bind filter controls
  bindListControls();
}

function bindListControls() {
  const searchInput = document.getElementById('list-search');
  const cuisineSelect = document.getElementById('filter-cuisine');
  const ambianceSelect = document.getElementById('filter-ambiance');
  const dietarySelect = document.getElementById('filter-dietary');
  const openNowBtn = document.getElementById('filter-open-now');

  if (searchInput && !searchInput._bound) {
    searchInput._bound = true;
    searchInput.addEventListener('input', () => { listFilters.search = searchInput.value; renderRestaurantList(); });
  }
  if (cuisineSelect && !cuisineSelect._bound) {
    cuisineSelect._bound = true;
    cuisineSelect.addEventListener('change', () => { listFilters.cuisine = cuisineSelect.value; renderRestaurantList(); });
  }
  if (ambianceSelect && !ambianceSelect._bound) {
    ambianceSelect._bound = true;
    ambianceSelect.addEventListener('change', () => { listFilters.ambiance = ambianceSelect.value; renderRestaurantList(); });
  }
  if (dietarySelect && !dietarySelect._bound) {
    dietarySelect._bound = true;
    dietarySelect.addEventListener('change', () => { listFilters.dietary = dietarySelect.value; renderRestaurantList(); });
  }
  if (openNowBtn && !openNowBtn._bound) {
    openNowBtn._bound = true;
    openNowBtn.addEventListener('click', () => {
      listFilters.openNow = !listFilters.openNow;
      openNowBtn.classList.toggle('active', listFilters.openNow);
      renderRestaurantList();
    });
  }
}

/* ==================== RESTAURANT DETAIL MODAL ==================== */
let currentMenuCat = 0;

async function openRestaurantModal(id) {
  try {
    showToast('Loading details...', '🍽️');
    const r = await API.getRestaurantById(id);
    const queueStatus = await API.getQueue(id);

    const modal = document.getElementById('restaurant-modal');
    const open = isOpenNow(r.hours);
    const emoji = CUISINE_EMOJI[r.cuisine] || '🍴';
    const dist = formatDistance(computeDistance(TOMAS_MORATO_CENTER.lat, TOMAS_MORATO_CENTER.lng, r.lat, r.lng));

    // Build modal HTML
    modal.querySelector('.modal-content').innerHTML = `
      <button class="modal-close" onclick="closeModal()">✕</button>

      <div class="modal-hero">
        <div style="width:100%;height:240px;background:linear-gradient(135deg, ${r.imgColor}, #0F0C0A);display:flex;align-items:center;justify-content:center;font-size:120px;">${emoji}</div>
        <div class="modal-hero-overlay"></div>
        <div class="modal-hero-content">
          <div class="modal-restaurant-name">${r.name}</div>
          <div class="modal-meta-row">
            <span class="modal-meta-item">⭐ ${r.rating} (${r.reviews} reviews)</span>
            <span class="modal-meta-item">📍 ${dist}</span>
            <span class="modal-meta-item">${priceSymbol(r.priceRange)}</span>
            <span class="modal-meta-item ${open ? 'badge-open' : 'badge-closed'}" style="padding:3px 10px;border-radius:20px;">${open ? '● Open Now' : '● Closed'}</span>
          </div>
        </div>
      </div>

      <div class="modal-body">
        <!-- Wait Time Widget -->
        <div class="wait-time-widget">
          <div class="widget-title">⏱ Real-Time Wait — Report Current Crowd</div>
          <div class="wait-options">
            <button class="wait-opt-btn ${r.waitTime === 'none' ? 'selected-none' : ''}" onclick="reportWaitTime(${r.id}, 'none', this.parentNode)">✓ No Wait</button>
            <button class="wait-opt-btn ${r.waitTime === '15-30' ? 'selected-mid' : ''}" onclick="reportWaitTime(${r.id}, '15-30', this.parentNode)">⏱ 15–30 min</button>
            <button class="wait-opt-btn ${r.waitTime === 'packed' ? 'selected-packed' : ''}" onclick="reportWaitTime(${r.id}, 'packed', this.parentNode)">⚠ Packed!</button>
          </div>
        </div>

        <!-- Daily Special -->
        <div class="daily-special-banner">
          <div class="special-icon">🔥</div>
          <div class="special-info">
            <div class="special-title">${r.dailySpecial.title}</div>
            <div class="special-desc">${r.dailySpecial.description}</div>
            <div class="special-valid">${r.dailySpecial.valid}</div>
          </div>
        </div>

        <!-- Address & Hours -->
        <div style="display:flex;gap:20px;margin-bottom:24px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;text-align:left;">
            <div class="widget-title" style="margin-bottom:6px;">📍 Location</div>
            <div style="font-size:14px;color:var(--gray-100);">${r.address}</div>
            <div style="font-size:13px;color:var(--gray-300);margin-top:4px;">📞 ${r.phone}</div>
          </div>
          <div style="text-align:left;">
            <div class="widget-title" style="margin-bottom:6px;">🕐 Hours</div>
            <div style="font-size:14px;color:var(--gray-100);">${r.hours.open} – ${r.hours.close}</div>
            <div style="font-size:12px;margin-top:4px;color:${open ? '#22c55e' : '#ef4444'};">${open ? '● Open Now' : '● Currently Closed'}</div>
          </div>
          <div style="text-align:left;">
            <div class="widget-title" style="margin-bottom:6px;">🏷️ Tags</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${r.ambiance.map(a => `<span class="tag">${AMBIANCE_LABELS[a]}</span>`).join('')}
              ${r.dietary.map(d => `<span class="tag orange">${DIETARY_LABELS[d]}</span>`).join('')}
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="modal-tabs">
          <div class="modal-tab active" onclick="switchModalTab(0, this)">🍽️ Menu</div>
          <div class="modal-tab" onclick="switchModalTab(1, this)">📷 Photos</div>
          <div class="modal-tab" onclick="switchModalTab(2, this)">🎟️ Get in Line</div>
          <div class="modal-tab" onclick="switchModalTab(3, this)">ℹ️ Info</div>
        </div>

        <!-- Tab: Menu -->
        <div class="tab-panel active" id="tab-menu">
          <div class="menu-categories">
            ${r.menu.map((cat, i) => `<button class="menu-cat-btn ${i===0?'active':''}" onclick="switchMenuCat(${i}, this, ${r.id})">${cat.category}</button>`).join('')}
          </div>
          <div class="menu-items-list" id="menu-items-${r.id}">
            ${renderMenuItems(r.menu[0].items)}
          </div>
        </div>

        <!-- Tab: Photos -->
        <div class="tab-panel" id="tab-photos">
          <div class="menu-categories">
            <button class="menu-cat-btn active" onclick="switchPhotoTab('food', this, ${r.id})">🍴 Food</button>
            <button class="menu-cat-btn" onclick="switchPhotoTab('drinks', this, ${r.id})">🍹 Drinks</button>
            <button class="menu-cat-btn" onclick="switchPhotoTab('ambiance', this, ${r.id})">✨ Ambiance</button>
          </div>
          <div class="photo-gallery" id="photo-gallery-${r.id}">
            ${renderPhotoGallery(r.photos.food)}
          </div>
        </div>

        <!-- Tab: Queue -->
        <div class="tab-panel" id="tab-queue">
          <div class="queue-section">
            <h3>Digital Queue</h3>
            <div class="queue-status">Skip the wait! Join the virtual queue at ${r.name} and we'll notify you when your table is ready.</div>
            <div id="queue-display-${r.id}" style="max-width:320px; margin: 0 auto; display:flex; flex-direction:column; gap:12px;">
              <div class="form-group" style="text-align:left;">
                <label class="form-label">Your Name</label>
                <input type="text" class="form-input" id="join-queue-name" placeholder="Enter your name..." />
              </div>
              <div class="form-group" style="text-align:left;">
                <label class="form-label">Party Size</label>
                <input type="number" class="form-input" id="join-queue-size" value="2" min="1" max="20" />
              </div>
              <button class="btn-queue" style="margin-top:10px;" onclick="submitJoinQueue(${r.id})">🎟️ Get in Line</button>
            </div>
            <div style="margin-top:28px;padding-top:20px;border-top:1px solid var(--border-glass);font-size:13px;color:var(--gray-300);">
              <div>Current queue size: <strong style="color:var(--orange)" id="queue-waiting-count">${queueStatus.waitingCount} tables waiting</strong></div>
              <div style="margin-top:6px;">Current wait status: <strong style="color:var(--orange)">${queueStatus.currentWaitLabel}</strong></div>
            </div>
          </div>
        </div>

        <!-- Tab: Info -->
        <div class="tab-panel" id="tab-info">
          <div style="display:flex; flex-direction:column; gap:16px;">
            <p style="font-size:15px;color:var(--gray-100);line-height:1.8;margin-bottom:20px;text-align:left;">${r.description}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
              <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-glass);border-radius:12px;padding:16px;text-align:left;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--gray-300);margin-bottom:6px;">Cuisine</div>
                <div style="font-size:15px;font-weight:600;">${r.cuisine}</div>
              </div>
              <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-glass);border-radius:12px;padding:16px;text-align:left;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--gray-300);margin-bottom:6px;">Price Range</div>
                <div style="font-size:15px;font-weight:600;color:var(--orange);">${priceSymbol(r.priceRange)} ${['', 'Budget', 'Moderate', 'Upscale', 'Fine Dining'][r.priceRange]}</div>
              </div>
              <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-glass);border-radius:12px;padding:16px;text-align:left;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--gray-300);margin-bottom:6px;">Ambiance</div>
                <div style="font-size:14px;">${r.ambiance.map(a => AMBIANCE_LABELS[a]).join(', ') || 'General Dining'}</div>
              </div>
              <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-glass);border-radius:12px;padding:16px;text-align:left;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--gray-300);margin-bottom:6px;">Dietary Options</div>
                <div style="font-size:14px;">${r.dietary.map(d => DIETARY_LABELS[d]).join(', ') || 'Standard Menu'}</div>
              </div>
            </div>

            <!-- Claim Banner -->
            <div style="margin-top: 24px; padding: 20px; background: rgba(255, 107, 0, 0.06); border: 1px dashed var(--border-orange); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap:16px;">
              <div style="text-align: left; flex:1; min-width:200px;">
                <strong style="color: var(--white); display: block; margin-bottom: 4px; font-size:15px;">🏪 Are you the owner of this restaurant?</strong>
                <span style="font-size: 13px; color: var(--gray-300); line-height: 1.4;">Claim this listing to update hours, push custom specials, and manage your digital waitlist live!</span>
              </div>
              <button class="btn-primary" style="padding: 10px 24px; font-size: 13px; font-weight:600;" onclick="claimListing(${r.id})">🏪 Claim Listing</button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    showToast(err.message, '❌');
  }
}

function renderMenuItems(items) {
  return items.map(item => `
    <div class="menu-item">
      <div class="menu-item-info" style="text-align:left;">
        <div class="menu-item-name">${item.name}</div>
        <div class="menu-item-desc">${item.description}</div>
      </div>
      ${item.price > 0 ? `<div class="menu-item-price">₱${item.price}</div>` : `<div class="menu-item-price" style="font-size:14px;color:var(--gray-300);">Included</div>`}
    </div>
  `).join('');
}

function renderPhotoGallery(photos) {
  const placeholders = ['img/hero_food.png', 'img/restaurant_cards.png', 'img/hero_bg.png'];
  const imgs = photos.length >= 3 ? photos : [...photos, ...placeholders].slice(0, 6);
  return imgs.map(src => `<img class="gallery-img" src="${src}" alt="Restaurant photo" onerror="this.style.display='none'">`).join('');
}

function switchModalTab(idx, el) {
  document.querySelectorAll('.modal-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('.tab-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
}

async function switchMenuCat(idx, el, restaurantId) {
  el.parentNode.querySelectorAll('.menu-cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  try {
    const r = await API.getRestaurantById(restaurantId);
    const container = document.getElementById(`menu-items-${restaurantId}`);
    if (container) container.innerHTML = renderMenuItems(r.menu[idx].items);
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function switchPhotoTab(type, el, restaurantId) {
  el.parentNode.querySelectorAll('.menu-cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  try {
    const r = await API.getRestaurantById(restaurantId);
    const modal = document.getElementById('restaurant-modal');
    const gallery = modal.querySelector('.photo-gallery');
    if (gallery) gallery.innerHTML = renderPhotoGallery(r.photos[type] || r.photos.food);
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function reportWaitTime(id, waitTime, container) {
  try {
    await API.reportWaitTime(id, waitTime);
    container.querySelectorAll('.wait-opt-btn').forEach(b => {
      b.classList.remove('selected-none', 'selected-mid', 'selected-packed');
    });
    const idx = ['none', '15-30', 'packed'].indexOf(waitTime);
    const cls = ['selected-none', 'selected-mid', 'selected-packed'][idx];
    container.querySelectorAll('.wait-opt-btn')[idx].classList.add(cls);
    const label = WAIT_LABELS[waitTime].label;
    showToast(`Wait time updated: ${label}`, WAIT_LABELS[waitTime].icon);
    
    // Refresh lists
    if (document.getElementById('restaurant-list').classList.contains('active')) {
      renderRestaurantList();
    }
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function submitJoinQueue(restaurantId) {
  const nameInput = document.getElementById('join-queue-name');
  const sizeInput = document.getElementById('join-queue-size');
  const name = nameInput?.value?.trim();
  const size = parseInt(sizeInput?.value) || 2;
  
  if (!name) {
    showToast('Please enter your name!', '⚠️');
    return;
  }

  try {
    showToast('Submitting...', '🎟️');
    const result = await API.joinQueue(restaurantId, name, size);
    const display = document.getElementById(`queue-display-${restaurantId}`);
    if (display) {
      display.innerHTML = `
        <div style="animation:slideUp 0.4s ease">
          <div style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:var(--orange);margin-bottom:6px;">Your Queue Number</div>
          <div class="queue-number">#${result.queueNumber}</div>
          <div style="font-size:14px;color:var(--gray-300);">Estimated wait: ${result.estimatedWaitMinutes} minutes</div>
          <button class="btn-queue" style="margin-top:20px;" onclick="openRestaurantModal(${restaurantId})">🔄 Refresh Status</button>
        </div>
      `;
    }
    showToast(`You're #${result.queueNumber} in the queue!`, '🎟️');
    
    // Refresh parent page if listing is open
    const countDisplay = document.getElementById('queue-waiting-count');
    if (countDisplay) {
      const q = await API.getQueue(restaurantId);
      countDisplay.textContent = `${q.waitingCount} tables waiting`;
    }
  } catch (e) {
    showToast(e.message, '❌');
  }
}

function closeModal() {
  document.getElementById('restaurant-modal').classList.remove('open');
  document.body.style.overflow = '';
}

/* ==================== FOOD WHEEL ==================== */
let wheelSpinning = false, wheelInited = false;
let wheelFilters = { cuisine: null, priceRange: null, ambiance: null };
let wheelAngle = 0;
let wheelRestaurants = [];

async function initFoodWheel() {
  if (wheelInited) return;
  wheelInited = true;
  await updateWheelRestaurants();

  // Filter chips
  document.querySelectorAll('.wheel-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      const filter = chip.dataset.filter;
      const value = chip.dataset.value;
      
      chip.closest('.wheel-chips').querySelectorAll('.wheel-chip').forEach(c => c.classList.remove('active'));
      chip.classList.toggle('active');
      
      if (chip.classList.contains('active')) {
        if (filter === 'price') wheelFilters.priceRange = parseInt(value);
        if (filter === 'ambiance') wheelFilters.ambiance = value;
      } else {
        if (filter === 'price') wheelFilters.priceRange = null;
        if (filter === 'ambiance') wheelFilters.ambiance = null;
      }
      await updateWheelRestaurants();
    });
  });
}

async function updateWheelRestaurants() {
  try {
    const list = await API.getRestaurants();
    let filtered = list.filter(r => {
      if (wheelFilters.priceRange && r.priceRange > wheelFilters.priceRange) return false;
      if (wheelFilters.ambiance && !r.ambiance.includes(wheelFilters.ambiance)) return false;
      return true;
    });
    if (filtered.length === 0) filtered = [...list];
    wheelRestaurants = filtered;
    drawWheel();
  } catch (e) {
    showToast(e.message, '❌');
  }
}

function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const restaurants = wheelRestaurants.slice(0, 10);
  const N = restaurants.length;
  if (N === 0) return;

  const R = canvas.width / 2;
  const sliceAngle = (2 * Math.PI) / N;

  const COLORS = [
    '#FF6B00','#CC5500','#E85C00','#FF8C38','#D45200',
    '#B84500','#FF7722','#E06000','#FF9944','#CC4400'
  ];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(R, R);
  ctx.rotate((wheelAngle * Math.PI) / 180);

  for (let i = 0; i < N; i++) {
    const start = i * sliceAngle - Math.PI / 2;
    const end = start + sliceAngle;

    // Slice
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R - 4, start, end);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.save();
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(10, 14 - Math.floor(N/5))}px Outfit, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    const name = restaurants[i].name.length > 14 ? restaurants[i].name.slice(0, 12) + '…' : restaurants[i].name;
    ctx.fillText(name, R - 16, 5);
    ctx.restore();
  }

  // Center circle
  ctx.restore();
  ctx.beginPath();
  ctx.arc(R, R, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#0F0C0A';
  ctx.fill();
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function spinWheel() {
  if (wheelSpinning) return;
  const restaurants = wheelRestaurants.slice(0, 10);
  if (restaurants.length === 0) return;
  wheelSpinning = true;

  const centerBtn = document.getElementById('wheel-spin-btn');
  if (centerBtn) { centerBtn.classList.add('spinning'); centerBtn.textContent = '...'; }

  const extraSpins = 5 + Math.random() * 5;
  const targetSlice = Math.floor(Math.random() * restaurants.length);
  const sliceAngle = 360 / restaurants.length;
  const targetAngle = wheelAngle + (extraSpins * 360) + (360 - (targetSlice * sliceAngle));
  const duration = 4000;
  const start = performance.now();
  const startAngle = wheelAngle;

  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    wheelAngle = startAngle + (targetAngle - startAngle) * easeOut(progress);
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      wheelAngle = targetAngle % 360;
      wheelSpinning = false;
      if (centerBtn) { centerBtn.classList.remove('spinning'); centerBtn.textContent = 'SPIN'; }
      showWheelResult(restaurants[targetSlice]);
    }
  }
  requestAnimationFrame(animate);
}

function showWheelResult(restaurant) {
  const result = document.getElementById('wheel-result');
  if (!result) return;
  result.innerHTML = `
    <div class="result-label">🎉 Tonight you're eating at...</div>
    <div class="result-name">${restaurant.name}</div>
    <div class="result-sub">${restaurant.cuisine} • ${priceSymbol(restaurant.priceRange)} • ⭐ ${restaurant.rating}</div>
    <button class="btn-view-result" onclick="openRestaurantModal(${restaurant.id})">View Restaurant →</button>
    <button class="btn-view-result" style="margin-left:10px;background:transparent;border:1px solid var(--border-orange);color:var(--orange);" onclick="spinWheel()">Spin Again</button>
  `;
  result.classList.add('show');
  showToast(`Spin landed on ${restaurant.name}!`, '🎡');
}

/* ==================== FOOD SWIPE ==================== */
let swipeInited = false;
let swipeIndex = 0;
let swipeLiked = 0, swipeSkipped = 0;
let swipeList = [];
let roomCode = null;
let isDragging = false, startX = 0, currentX = 0;

async function initFoodSwipe() {
  if (swipeInited) return;
  swipeInited = true;
  try {
    const list = await API.getRestaurants();
    swipeList = [...list].sort(() => Math.random() - 0.5);
    swipeIndex = 0;
    swipeLiked = 0;
    swipeSkipped = 0;
    renderSwipeCards();
    updateSwipeScore();
  } catch (e) {
    showToast(e.message, '❌');
  }
}

function renderSwipeCards() {
  const stack = document.getElementById('swipe-stack');
  if (!stack) return;

  const toShow = swipeList.slice(swipeIndex, swipeIndex + 3);
  if (toShow.length === 0) {
    stack.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;">
      <div style="font-size:60px;">🎉</div>
      <div style="font-family:var(--font-display);font-size:32px;">All Done!</div>
      <div style="color:var(--gray-300);font-size:14px;">You've swiped through all restaurants.</div>
      <button class="btn-primary" onclick="resetSwipe()" style="margin-top:12px;">🔄 Start Over</button>
    </div>`;
    return;
  }

  stack.innerHTML = toShow.map((r, i) => {
    const emoji = CUISINE_EMOJI[r.cuisine] || '🍴';
    return `
      <div class="swipe-card" id="swipe-card-${r.id}" data-id="${r.id}" style="z-index:${3-i};">
        <div class="swipe-like-label" id="like-label-${r.id}">LIKE</div>
        <div class="swipe-nope-label" id="nope-label-${r.id}">NOPE</div>
        <div class="swipe-card-img-placeholder" style="background:linear-gradient(135deg, ${r.imgColor}, #0F0C0A);">${emoji}</div>
        <div class="swipe-card-body">
          <div class="swipe-card-name" style="text-align:left;">${r.name}</div>
          <div class="swipe-card-sub" style="text-align:left;">${r.cuisine} • ${priceSymbol(r.priceRange)}</div>
          <div class="swipe-card-footer">
            <div class="swipe-card-rating">⭐ ${r.rating} (${r.reviews})</div>
            <div style="font-size:12px;color:var(--gray-300);">${r.ambiance.slice(0,1).map(a => AMBIANCE_LABELS[a]).join('')}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind drag events to top card
  const topCard = stack.querySelector('.swipe-card');
  if (topCard) bindSwipeDrag(topCard);
}

function bindSwipeDrag(card) {
  const id = card.dataset.id;

  function onStart(e) {
    isDragging = true;
    startX = e.clientX || e.touches?.[0]?.clientX || 0;
    currentX = startX;
    card.style.transition = 'none';
  }

  // We define listeners locally to bind/unbind cleanly
  function onMove(e) {
    if (!isDragging) return;
    currentX = e.clientX || e.touches?.[0]?.clientX || 0;
    const dx = currentX - startX;
    const rotate = dx * 0.08;
    card.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
    const like = document.getElementById(`like-label-${id}`);
    const nope = document.getElementById(`nope-label-${id}`);
    if (like) like.style.opacity = Math.max(0, dx / 100);
    if (nope) nope.style.opacity = Math.max(0, -dx / 100);
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    const dx = currentX - startX;
    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

    if (Math.abs(dx) > 80) {
      const dir = dx > 0 ? 1 : -1;
      card.style.transform = `translateX(${dir * 500}px) rotate(${dir * 30}deg)`;
      card.style.opacity = '0';
      
      // Remove document-level event listeners to avoid leaks
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
      
      setTimeout(() => {
        if (dir === 1) swipeLike(parseInt(id));
        else swipeNope(parseInt(id));
      }, 300);
    } else {
      card.style.transform = '';
      const like = document.getElementById(`like-label-${id}`);
      const nope = document.getElementById(`nope-label-${id}`);
      if (like) like.style.opacity = 0;
      if (nope) nope.style.opacity = 0;
    }
  }

  card.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  card.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd);
}

async function swipeLike(id) {
  const r = swipeList.find(x => x.id === id);
  swipeLiked++;
  swipeIndex++;
  updateSwipeScore();

  try {
    if (roomCode && r) {
      const res = await API.sendSwipeLike(roomCode, id);
      if (res.match) {
        showMatch(r);
        return;
      }
    }
    renderSwipeCards();
    if (r) showToast(`❤️ Liked ${r.name}!`, '❤️');
  } catch (e) {
    showToast(e.message, '❌');
  }
}

function swipeNope(id) {
  const r = swipeList.find(x => x.id === id);
  swipeSkipped++;
  swipeIndex++;
  updateSwipeScore();
  renderSwipeCards();
  if (r) showToast(`✕ Skipped ${r.name}`, '✕');
}

function doSwipeLike() {
  if (swipeIndex >= swipeList.length) return;
  const r = swipeList[swipeIndex];
  const card = document.getElementById(`swipe-card-${r.id}`);
  if (card) {
    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    card.style.transform = 'translateX(500px) rotate(30deg)';
    card.style.opacity = '0';
    setTimeout(() => swipeLike(r.id), 300);
  }
}

function doSwipeNope() {
  if (swipeIndex >= swipeList.length) return;
  const r = swipeList[swipeIndex];
  const card = document.getElementById(`swipe-card-${r.id}`);
  if (card) {
    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    card.style.transform = 'translateX(-500px) rotate(-30deg)';
    card.style.opacity = '0';
    setTimeout(() => swipeNope(r.id), 300);
  }
}

function updateSwipeScore() {
  const likedEl = document.getElementById('swipe-liked');
  const skippedEl = document.getElementById('swipe-skipped');
  const leftEl = document.getElementById('swipe-left');
  if (likedEl) likedEl.textContent = swipeLiked;
  if (skippedEl) skippedEl.textContent = swipeSkipped;
  if (leftEl) leftEl.textContent = Math.max(0, swipeList.length - swipeIndex);
}

async function resetSwipe() {
  try {
    const list = await API.getRestaurants();
    swipeList = [...list].sort(() => Math.random() - 0.5);
    swipeIndex = 0; swipeLiked = 0; swipeSkipped = 0;
    renderSwipeCards();
    updateSwipeScore();
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function createRoom() {
  try {
    showToast('Creating room...', '📡');
    const room = await API.createSwipeRoom();
    roomCode = room.code;
    document.getElementById('room-code-display').textContent = roomCode;
    document.getElementById('room-status').classList.add('show');
    document.getElementById('room-status').textContent = `Room ${roomCode} created! Share this code with your group.`;
    document.getElementById('room-members-list').innerHTML = `
      <div class="member-avatar">You</div>
      <div class="member-avatar" style="background:var(--gray-700);color:var(--gray-300);">+</div>
    `;
    showToast(`Room ${roomCode} created! Share with friends.`, '🚀');
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function joinRoom() {
  const input = document.getElementById('room-join-input');
  const code = input?.value?.toUpperCase().trim();
  if (!code) { showToast('Enter a room code first!', '⚠️'); return; }
  try {
    showToast('Joining room...', '📡');
    const room = await API.joinSwipeRoom(code);
    roomCode = room.code;
    document.getElementById('room-code-display').textContent = roomCode;
    document.getElementById('room-status').classList.add('show');
    document.getElementById('room-status').textContent = `Joined room ${roomCode}! Start swiping!`;
    document.getElementById('room-members-list').innerHTML = room.members.map(m => `
      <div class="member-avatar">${m === 'You' ? 'You' : 'P2'}</div>
    `).join('');
    showToast(`Joined room ${roomCode}!`, '🎉');
  } catch (e) {
    showToast(e.message, '❌');
  }
}

function showMatch(restaurant) {
  const notif = document.getElementById('match-notification');
  const nameEl = document.getElementById('match-name');
  if (notif && nameEl) {
    nameEl.textContent = restaurant.name;
    document.getElementById('match-sub').textContent = `${restaurant.cuisine} • ${priceSymbol(restaurant.priceRange)} • ⭐ ${restaurant.rating}`;
    notif.classList.add('show');
  }
  swipeIndex++;
  updateSwipeScore();
}

function closeMatch() {
  const notif = document.getElementById('match-notification');
  if (notif) notif.classList.remove('show');
  renderSwipeCards();
}

/* ==================== OWNER DASHBOARD ==================== */
let dashInited = false;
let queueList = [];
let currentOwnerRestaurant = null;

async function initDashboard() {
  const container = document.getElementById('dashboard');
  if (!container) return;

  // Show a loading overlay inside the dashboard
  let overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `<div class="spinner"></div><div class="loading-text">LOADING OWNER SYSTEM...</div>`;
  container.appendChild(overlay);

  try {
    // 1. Get Claimed Restaurant Profile
    currentOwnerRestaurant = await API.getOwnerRestaurant();
    
    // Update dashboard header / claimed banner
    const banner = document.querySelector('.dash-claim-banner');
    if (banner && currentOwnerRestaurant) {
      banner.innerHTML = `
        <strong>🏪 Managing: ${currentOwnerRestaurant.name}</strong><br>
        <span style="font-size:12px;color:var(--gray-300);">${currentOwnerRestaurant.address} | Phone: ${currentOwnerRestaurant.phone}</span>
      `;
    }

    // Populate profile edit form
    populateProfileForm(currentOwnerRestaurant);

    // 2. Fetch and render queue
    await refreshDashboardQueue();

    // 3. Fetch promos list
    await refreshDashboardPromos();

    // 4. Fetch analytics
    const analytics = await API.getAnalytics();
    updateDashboardAnalytics(analytics);

    dashInited = true;
  } catch (err) {
    showToast(err.message, '❌');
    // If not claimed or authorized, let them logout or return to home
    localStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
    navigateTo('home');
  } finally {
    overlay.remove();
  }
}

function switchDashPanel(panelId, el) {
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.dash-nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  if (el) el.classList.add('active');
  
  if (panelId === 'dash-queue') refreshDashboardQueue();
  if (panelId === 'dash-promos') refreshDashboardPromos();
}

function populateProfileForm(r) {
  const panel = document.getElementById('dash-profile');
  if (!panel) return;
  
  const nameInput = panel.querySelector('input[placeholder="Restaurant name"]');
  if (nameInput) nameInput.value = r.name;
  
  const cuisineInput = panel.querySelector('input[placeholder="e.g. Italian, Filipino…"]');
  if (cuisineInput) cuisineInput.value = r.cuisine;
  
  const addressInput = panel.querySelector('input[placeholder="Full address on Tomas Morato Ave"]');
  if (addressInput) addressInput.value = r.address;
  
  const phoneInput = panel.querySelector('input[placeholder="+63 2 XXXX XXXX"]');
  if (phoneInput) phoneInput.value = r.phone;
  
  const hoursInput = panel.querySelector('input[placeholder="e.g. 11:00 AM – 10:00 PM"]');
  if (hoursInput) hoursInput.value = `${r.hours.open} – ${r.hours.close}`;
  
  const priceSelect = panel.querySelector('select');
  if (priceSelect) priceSelect.selectedIndex = r.priceRange - 1;

  const descTextarea = panel.querySelector('textarea');
  if (descTextarea) descTextarea.value = r.description;

  // Checkboxes
  const checkboxes = panel.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    const text = cb.parentNode.textContent.trim().toLowerCase();
    let matched = false;
    r.ambiance.forEach(a => {
      const matchText = AMBIANCE_LABELS[a].toLowerCase().split(' ').slice(1).join(' ');
      if (text.includes(matchText)) matched = true;
    });
    r.dietary.forEach(d => {
      const matchText = DIETARY_LABELS[d].toLowerCase().split(' ').slice(1).join(' ');
      if (text.includes(matchText)) matched = true;
    });
    cb.checked = matched;
  });
}

async function saveOwnerProfile() {
  if (!currentOwnerRestaurant) return;
  
  const panel = document.getElementById('dash-profile');
  const name = panel.querySelector('input[placeholder="Restaurant name"]')?.value;
  const cuisine = panel.querySelector('input[placeholder="e.g. Italian, Filipino…"]')?.value;
  const address = panel.querySelector('input[placeholder="Full address on Tomas Morato Ave"]')?.value;
  const phone = panel.querySelector('input[placeholder="+63 2 XXXX XXXX"]')?.value;
  const hoursText = panel.querySelector('input[placeholder="e.g. 11:00 AM – 10:00 PM"]')?.value;
  const priceRange = (panel.querySelector('select')?.selectedIndex || 0) + 1;
  const description = panel.querySelector('textarea')?.value;

  // Parse hours
  let open = '11:00', close = '22:00';
  if (hoursText && hoursText.includes('–')) {
    const parts = hoursText.split('–').map(s => s.trim());
    open = parts[0];
    close = parts[1];
  } else if (hoursText && hoursText.includes('-')) {
    const parts = hoursText.split('-').map(s => s.trim());
    open = parts[0];
    close = parts[1];
  }

  // Get checked tags
  const ambiance = [];
  const dietary = [];
  const checkboxes = panel.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (!cb.checked) return;
    const labelText = cb.parentNode.textContent.trim().toLowerCase();
    
    // Match with AMBIANCE keys
    Object.keys(AMBIANCE_LABELS).forEach(k => {
      const matchText = AMBIANCE_LABELS[k].toLowerCase().split(' ').slice(1).join(' ');
      if (labelText.includes(matchText)) ambiance.push(k);
    });
    // Match with DIETARY keys
    Object.keys(DIETARY_LABELS).forEach(k => {
      const matchText = DIETARY_LABELS[k].toLowerCase().split(' ').slice(1).join(' ');
      if (labelText.includes(matchText)) dietary.push(k);
    });
  });

  const updateData = {
    name,
    cuisine,
    address,
    phone,
    hours: { open, close },
    priceRange,
    description,
    ambiance,
    dietary
  };

  try {
    showToast('Saving profile...', '💾');
    await API.updateOwnerRestaurant(updateData);
    showToast('Profile saved successfully!', '✅');
    currentOwnerRestaurant = { ...currentOwnerRestaurant, ...updateData };
    
    // Update details in navigation sidebar claimed banner
    const banner = document.querySelector('.dash-claim-banner');
    if (banner) {
      banner.innerHTML = `
        <strong>🏪 Managing: ${name}</strong><br>
        <span style="font-size:12px;color:var(--gray-300);">${address} | Phone: ${phone}</span>
      `;
    }
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function refreshDashboardQueue() {
  const container = document.getElementById('queue-list-container');
  if (!container) return;

  try {
    const list = await API.getOwnerQueue();
    queueList = list;
    
    const active = queueList.filter(q => !q.called && !q.seated);
    
    // Update overview stats
    const seatedCount = queueList.filter(q => q.seated).length;
    const statSeated = document.getElementById('dash-seated-today');
    if (statSeated) statSeated.textContent = 32 + seatedCount;

    const previewCount = document.getElementById('dash-queue-count');
    if (previewCount) previewCount.textContent = active.length;

    // Update next guest info in overview preview
    const overviewPreview = document.querySelector('#dash-overview .btn-publish[onclick*="dash-queue"]')?.parentNode;
    if (overviewPreview) {
      const nextGuest = active[0];
      const nextText = overviewPreview.querySelector('div:nth-of-type(3)');
      if (nextText) {
        if (nextGuest) {
          nextText.innerHTML = `Next: <strong style="color:var(--orange);">#${nextGuest.num} ${nextGuest.name}</strong> (${nextGuest.size} pax)`;
        } else {
          nextText.innerHTML = `Next: <span style="color:var(--gray-300);">None (Queue is empty)</span>`;
        }
      }
    }

    if (active.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><p>Queue is clear! All guests have been seated.</p></div>`;
      return;
    }

    container.innerHTML = active.map((q, i) => `
      <div class="queue-item" id="qitem-${q.num}">
        <div class="queue-num">#${q.num}</div>
        <div class="queue-info" style="text-align:left;">
          <div class="queue-name">${q.name}</div>
          <div class="queue-time">Waiting since ${q.time}</div>
        </div>
        <div class="queue-size">👥 ${q.size}</div>
        <button class="btn-call" onclick="callGuest(${q.num})">📢 Call</button>
        <button class="btn-done" onclick="seatGuest(${q.num})">✓ Seated</button>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = `<div style="padding:20px;text-align:center;color:red;">Error: ${e.message}</div>`;
  }
}

async function callGuest(num) {
  try {
    showToast(`Calling queue #${num}...`, '📢');
    await API.callGuest(num);
    const item = document.getElementById(`qitem-${num}`);
    if (item) item.style.borderColor = '#f59e0b';
    showToast(`Queue #${num} called successfully!`, '📢');
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function seatGuest(num) {
  try {
    showToast(`Seating guest #${num}...`, '🎟️');
    await API.seatGuest(num);
    showToast(`#${num} seated! Great job! 🎉`, '✅');
    await refreshDashboardQueue();
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function addToQueue() {
  const nameInput = document.getElementById('queue-name-input');
  const sizeInput = document.getElementById('queue-size-input');
  const name = nameInput?.value?.trim();
  const size = parseInt(sizeInput?.value) || 2;
  if (!name) { showToast('Please enter a guest name!', '⚠️'); return; }

  try {
    showToast('Adding to queue...', '🎟️');
    const res = await API.ownerAddToQueue(name, size);
    if (nameInput) nameInput.value = '';
    showToast(`${name} added to queue as #${res.guest.num}!`, '🎟️');
    await refreshDashboardQueue();
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function refreshDashboardPromos() {
  const listContainer = document.querySelector('#dash-promos div:nth-of-type(3) div');
  if (!listContainer) return;
  
  try {
    const promos = await API.getOwnerPromos();
    
    // Live preview
    const preview = document.getElementById('promo-preview');
    if (preview) {
      if (promos.length > 0) {
        preview.innerHTML = `
          <div class="daily-special-banner" style="margin:0;">
            <div class="special-icon">🔥</div>
            <div class="special-info">
              <div class="special-title">${promos[0].title}</div>
              <div class="special-desc">${promos[0].description}</div>
              <div class="special-valid">${promos[0].valid}</div>
            </div>
          </div>
        `;
      } else {
        preview.innerHTML = `<div style="font-size:14px;color:var(--gray-500);">Your published promo will appear here.</div>`;
      }
    }

    if (promos.length === 0) {
      listContainer.innerHTML = `<div style="font-size:13px;color:var(--gray-500);text-align:center;padding:12px;">No active promos yet.</div>`;
      return;
    }

    listContainer.innerHTML = promos.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:rgba(255,255,255,0.03);border:1px solid var(--border-glass);border-radius:var(--radius-md);">
        <div style="text-align:left;">
          <div style="font-weight:600;">${p.title}</div>
          <div style="font-size:13px;color:var(--gray-300);">${p.description} • ${p.valid}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="padding:4px 12px;background:${p.status === 'LIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(255,107,0,0.15)'};border:1px solid ${p.status === 'LIVE' ? 'rgba(34,197,94,0.3)' : 'var(--border-orange)'};border-radius:20px;font-size:12px;color:${p.status === 'LIVE' ? '#22c55e' : 'var(--orange)'};">${p.status}</span>
          <button onclick="deletePromo(${p.id})" style="background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:16px;" title="Delete Promo">✕</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    listContainer.innerHTML = `<div style="font-size:13px;color:red;padding:12px;">Error: ${e.message}</div>`;
  }
}

async function publishPromo() {
  const titleInput = document.getElementById('promo-title');
  const descInput = document.getElementById('promo-desc');
  const validInput = document.getElementById('promo-valid');
  
  const title = titleInput?.value?.trim();
  const desc = descInput?.value?.trim();
  const valid = validInput?.value?.trim() || 'Today only';
  
  if (!title || !desc) { showToast('Please fill in all promo details!', '⚠️'); return; }

  try {
    showToast('Publishing...', '🔥');
    await API.createOwnerPromo({ title, description: desc, valid });
    
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (validInput) validInput.value = '';

    showToast(`Promo "${title}" published!`, '🔥');
    await refreshDashboardPromos();
    
    // Update active promo banner on overview page
    const promoBanner = document.querySelector('#dash-overview .daily-special-banner');
    if (promoBanner) {
      promoBanner.innerHTML = `
        <div class="special-icon">🔥</div>
        <div class="special-info">
          <div class="special-title">${title}</div>
          <div class="special-desc">${desc}</div>
          <div class="special-valid">${valid}</div>
        </div>
      `;
    }
  } catch (e) {
    showToast(e.message, '❌');
  }
}

async function deletePromo(id) {
  if (!confirm('Are you sure you want to delete this promo?')) return;
  try {
    showToast('Deleting...', '🔥');
    await API.deleteOwnerPromo(id);
    showToast('Promo deleted successfully!', '✅');
    await refreshDashboardPromos();
  } catch (e) {
    showToast(e.message, '❌');
  }
}

function updateDashboardAnalytics(analytics) {
  // Update overview stats
  const overview = document.getElementById('dash-overview');
  if (overview) {
    const cards = overview.querySelectorAll('.stat-card');
    if (cards.length >= 4) {
      cards[0].querySelector('.stat-card-value').textContent = analytics.viewsToday;
      cards[0].querySelector('.stat-card-change').textContent = analytics.viewsChange;
      
      cards[1].querySelector('.stat-card-value').textContent = 32 + queueList.filter(q => q.seated).length;
      cards[1].querySelector('.stat-card-change').textContent = `${queueList.filter(q => !q.called && !q.seated).length} still waiting`;
      
      cards[2].querySelector('.stat-card-value').textContent = analytics.swipeMatches;
      cards[2].querySelector('.stat-card-change').textContent = analytics.swipeMatchesChange;
      
      cards[3].querySelector('.stat-card-value').textContent = analytics.avgRating;
      cards[3].querySelector('.stat-card-change').textContent = `Based on ${analytics.reviewsCount} reviews`;
    }
  }

  // Update analytics panel menu list
  const analyticsPanel = document.getElementById('dash-analytics');
  if (analyticsPanel) {
    const menuList = analyticsPanel.querySelector('div:nth-of-type(2) > div:first-of-type > div:nth-of-type(2)');
    if (menuList && analytics.topMenuItems) {
      const maxViews = Math.max(...analytics.topMenuItems.map(i => i.count)) || 1;
      menuList.innerHTML = analytics.topMenuItems.map(item => `
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="flex:1;font-size:14px;text-align:left;">${item.name}</div>
          <div style="font-size:13px;color:var(--gray-300);">${item.count} views</div>
          <div style="width:80px;height:6px;background:var(--gray-700);border-radius:3px;overflow:hidden;">
            <div style="width:${(item.count / maxViews) * 100}%;height:100%;background:var(--orange);border-radius:3px;"></div>
          </div>
        </div>
      `).join('');
    }

    const discoveryList = analyticsPanel.querySelector('div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2)');
    if (discoveryList && analytics.discoverySources) {
      discoveryList.innerHTML = analytics.discoverySources.map(item => `
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="flex:1;font-size:14px;text-align:left;">${item.source}</div>
          <div style="font-size:13px;color:var(--orange);font-weight:600;">${item.percentage}%</div>
        </div>
      `).join('');
    }
  }

  // Draw Line Chart
  const canvas = document.getElementById('visits-chart');
  if (canvas && window.Chart && analytics.visitsChart) {
    if (canvas._chart) {
      canvas._chart.data.datasets[0].data = analytics.visitsChart;
      canvas._chart.update();
    } else {
      initDashCharts(analytics.visitsChart);
    }
  }
}

function initDashCharts(chartData = [45, 62, 58, 71, 89, 134, 118]) {
  const canvas = document.getElementById('visits-chart');
  if (!canvas || !window.Chart) return;

  if (canvas._chart) canvas._chart.destroy();

  const ctx = canvas.getContext('2d');
  canvas._chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Page Views',
        data: chartData,
        borderColor: '#FF6B00',
        backgroundColor: 'rgba(255,107,0,0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#FF6B00',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#9B9287', font: { family: 'Outfit' } } }
      },
      scales: {
        x: { ticks: { color: '#9B9287' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#9B9287' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

/* ==================== HERO QUICK FILTERS ==================== */
function quickFilter(filter) {
  listFilters = { search: '', cuisine: '', ambiance: '', dietary: '', openNow: false };
  if (filter === 'open-now') listFilters.openNow = true;
  else if (filter === 'date-night') listFilters.ambiance = 'date-night';
  else if (filter === 'vegan') listFilters.dietary = 'vegan';
  else if (filter === 'study') listFilters.ambiance = 'study-friendly';
  else if (filter === 'halal') listFilters.dietary = 'halal';
  navigateTo('restaurant-list');
}
