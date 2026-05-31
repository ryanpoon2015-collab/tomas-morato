// ============================================================
// app.js — Tomas Morato Restaurant Discovery
// All page logic: routing, map, wheel, swipe, filters, modals
// Refactored for backend-ready async API service layer
// ============================================================

/* ==================== ROUTER ==================== */
const PAGES = ['home', 'food-radar', 'restaurant-list', 'food-wheel', 'food-swipe', 'about-us', 'dashboard'];

function toggleMobileNav() {
  const wrapper = document.getElementById('nav-menu-wrapper');
  const btn = document.getElementById('mobile-nav-toggle');
  if (wrapper && btn) {
    wrapper.classList.toggle('open');
    btn.classList.toggle('open');
  }
}

function navigateTo(pageId) {
  // Close mobile nav on transition
  const wrapper = document.getElementById('nav-menu-wrapper');
  const btn = document.getElementById('mobile-nav-toggle');
  if (wrapper && btn) {
    wrapper.classList.remove('open');
    btn.classList.remove('open');
  }

  if (pageId === 'dashboard') {
    const token = sessionStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
    if (!token) {
      openLoginModal('owner');
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

/* ==================== ABOUT US & CONTACT FORM ==================== */
function handleContactSubmit() {
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  const submitBtn = document.getElementById('contact-submit-btn');

  if (!name || !email || !subject || !message) {
    showToast('Please fill out all fields.', '⚠️');
    return;
  }

  // Simple email pattern validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address.', '⚠️');
    return;
  }

  // Disable button to show processing
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  // Simulate network request
  setTimeout(() => {
    // Hide form container, show success container
    document.getElementById('contact-form-container').style.display = 'none';
    document.getElementById('contact-success').style.display = 'block';

    showToast('Message sent! Thank you.', '✉️');

    submitBtn.disabled = false;
    submitBtn.textContent = '🚀 Send Message';
  }, 1000);
}

function resetContactForm() {
  // Clear inputs
  document.getElementById('contact-name').value = '';
  document.getElementById('contact-email').value = '';
  document.getElementById('contact-subject').value = '';
  document.getElementById('contact-message').value = '';

  // Show form container, hide success container
  document.getElementById('contact-form-container').style.display = 'block';
  document.getElementById('contact-success').style.display = 'none';
}

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
function openLoginModal(role = 'owner') {
  document.getElementById('login-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Reset form state
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  const err = document.getElementById('login-error');
  if (err) err.style.display = 'none';

  // Switch to the requested role tab (defaults to owner)
  switchLoginTab(role);
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
    const pendingClaimId = sessionStorage.getItem('pending_claim_id');
    if (pendingClaimId) {
      await API.claimRestaurant(parseInt(pendingClaimId));
      sessionStorage.removeItem('pending_claim_id');
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
  sessionStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
  sessionStorage.removeItem('tm_user_role');
  sessionStorage.removeItem('tm_user_name');
  showToast('Logged out successfully', '🚪');
  navigateTo('home');
}

async function claimListing(id) {
  try {
    const token = sessionStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
    if (!token) {
      showToast('Please sign in to claim this listing', '🔑');
      sessionStorage.setItem('pending_claim_id', id);
      closeModal();
      openLoginModal('owner');
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
let map = null, radiusCircle = null, radarMarkers = [], radarInited = false;
let radarFilters = { openNow: false, cuisine: null, ambiance: [], dietary: [] };
let userLocation = null;  // { lat, lng } — user's real location or null
let userLocationMarker = null;

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

  // Default center marker (Tomas Morato)
  placeUserMarker(center.lat, center.lng);

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

  // Filter chips — support all tag types
  document.querySelectorAll('.map-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chip.classList.toggle('active');

      if (filter === 'open-now') {
        radarFilters.openNow = chip.classList.contains('active');
      } else if (filter === 'date-night') {
        toggleRadarArrayFilter('ambiance', 'date-night', chip.classList.contains('active'));
      } else if (filter === 'vegan') {
        toggleRadarArrayFilter('dietary', 'vegan', chip.classList.contains('active'));
      } else if (filter === 'halal') {
        toggleRadarArrayFilter('dietary', 'halal', chip.classList.contains('active'));
      }

      updateRadarRadius(parseFloat(slider?.value || 1.5) * 1000);
    });
  });

  // Ask for user location
  requestUserLocation();
}

/** Toggle a value in one of the array-based radar filters */
function toggleRadarArrayFilter(key, value, isActive) {
  if (isActive) {
    if (!radarFilters[key].includes(value)) radarFilters[key].push(value);
  } else {
    radarFilters[key] = radarFilters[key].filter(v => v !== value);
  }
}

/** Place or move the "You are here" marker */
function placeUserMarker(lat, lng) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="position:relative;width:20px;height:20px;">
             <div style="position:absolute;inset:0;background:#FF6B00;border-radius:50%;border:3px solid white;box-shadow:0 0 20px rgba(255,107,0,0.7);z-index:2;"></div>
             <div style="position:absolute;inset:-8px;background:rgba(255,107,0,0.18);border-radius:50%;animation:locPulse 2s ease-out infinite;z-index:1;"></div>
           </div>`,
    iconAnchor: [10, 10]
  });
  if (userLocationMarker) map.removeLayer(userLocationMarker);
  userLocationMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
  userLocationMarker.bindPopup(`<div style="font-family:'Outfit',sans-serif;font-size:13px;color:#fff;"><strong>📍 You are here</strong></div>`);
}

/** Request the user's geolocation */
function requestUserLocation() {
  // Show location prompt banner
  showLocationPrompt();
}

/** Show a banner prompting for location access */
function showLocationPrompt() {
  // Only show if we haven't already got a location
  if (userLocation) return;

  const existing = document.getElementById('location-prompt');
  if (existing) return;

  const panel = document.querySelector('.radar-map-panel');
  if (!panel) return;

  const prompt = document.createElement('div');
  prompt.id = 'location-prompt';
  prompt.className = 'location-prompt';
  prompt.innerHTML = `
    <div class="location-prompt-icon">📍</div>
    <div class="location-prompt-text">
      <strong>Where are you?</strong>
      <span>Share your location to see restaurants near you</span>
    </div>
    <button class="location-prompt-btn" onclick="geolocateUser()">Use My Location</button>
    <button class="location-prompt-dismiss" onclick="dismissLocationPrompt()" title="Dismiss">✕</button>
  `;
  panel.prepend(prompt);
}

/** Use browser Geolocation API */
function geolocateUser() {
  const prompt = document.getElementById('location-prompt');
  if (prompt) {
    prompt.querySelector('.location-prompt-btn').textContent = 'Locating…';
    prompt.querySelector('.location-prompt-btn').disabled = true;
  }

  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', '⚠️');
    dismissLocationPrompt();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      placeUserMarker(userLocation.lat, userLocation.lng);
      map.setView([userLocation.lat, userLocation.lng], 15, { animate: true });

      // Re-draw radius and markers from new center
      const slider = document.getElementById('radar-slider');
      updateRadarRadius(parseFloat(slider?.value || 1.5) * 1000);

      dismissLocationPrompt();
      showToast('Location found! Map centered on you.', '📍');
    },
    (err) => {
      console.warn('Geolocation error:', err.message);
      showToast('Could not get your location. Using default.', '⚠️');
      dismissLocationPrompt();
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

/** Dismiss the location prompt */
function dismissLocationPrompt() {
  const prompt = document.getElementById('location-prompt');
  if (prompt) {
    prompt.classList.add('dismissed');
    setTimeout(() => prompt.remove(), 300);
  }
}

async function updateRadarRadius(meters) {
  // Use user's real location if available, else default center
  const center = userLocation || TOMAS_MORATO_CENTER;
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
      cuisine: radarFilters.cuisine,
      ambiance: radarFilters.ambiance,
      dietary: radarFilters.dietary
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

    const token = sessionStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
    const role = sessionStorage.getItem('tm_user_role');
    const claimedRestaurantId = parseInt(sessionStorage.getItem('tm_claimed_restaurant_id') || '0');
    const canEdit = token && (role === 'admin' || (role === 'owner' && claimedRestaurantId === r.id));
    const disabledAttr = canEdit ? '' : 'style="pointer-events: none; cursor: default; opacity: 0.6;"';
    const isOwnerOrAdmin = token && (role === 'owner' || role === 'admin');

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
            <button class="wait-opt-btn ${r.waitTime === 'none' ? 'selected-none' : ''}" ${disabledAttr} onclick="reportWaitTime(${r.id}, 'none', this.parentNode)">✓ No Wait</button>
            <button class="wait-opt-btn ${r.waitTime === '15-30' ? 'selected-mid' : ''}" ${disabledAttr} onclick="reportWaitTime(${r.id}, '15-30', this.parentNode)">⏱ 15–30 min</button>
            <button class="wait-opt-btn ${r.waitTime === 'packed' ? 'selected-packed' : ''}" ${disabledAttr} onclick="reportWaitTime(${r.id}, 'packed', this.parentNode)">⚠ Packed!</button>
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
          <div class="modal-tab" onclick="switchModalTab(1, this)">ℹ️ Info</div>
        </div>

        <!-- Tab: Menu -->
        <div class="tab-panel active" id="tab-menu">
          <div class="menu-categories">
            ${r.menu.map((cat, i) => `<button class="menu-cat-btn ${i === 0 ? 'active' : ''}" onclick="switchMenuCat(${i}, this, ${r.id})">${cat.category}</button>`).join('')}
          </div>
          <div class="menu-items-list" id="menu-items-${r.id}">
            ${renderMenuItems(r.menu[0].items)}
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
            ${isOwnerOrAdmin ? '' : `
            <div style="margin-top: 24px; padding: 20px; background: rgba(255, 107, 0, 0.06); border: 1px dashed var(--border-orange); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap:16px;">
              <div style="text-align: left; flex:1; min-width:200px;">
                <strong style="color: var(--white); display: block; margin-bottom: 4px; font-size:15px;">🏪 Are you the owner of this restaurant?</strong>
                <span style="font-size: 13px; color: var(--gray-300); line-height: 1.4;">Claim this listing to update hours, push custom specials, and manage your daily specials live!</span>
              </div>
              <button class="btn-primary" style="padding: 10px 24px; font-size: 13px; font-weight:600;" onclick="claimListing(${r.id})">🏪 Claim Listing</button>
            </div>
            `}
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
  const token = sessionStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
  const role = sessionStorage.getItem('tm_user_role');
  const claimedRestaurantId = parseInt(sessionStorage.getItem('tm_claimed_restaurant_id') || '0');

  if (!token) {
    showToast('Please sign in to update wait times!', '🔒');
    return;
  }
  if (role !== 'admin' && (role !== 'owner' || claimedRestaurantId !== id)) {
    showToast('You can only update the wait time for your own restaurant!', '🔒');
    return;
  }

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

    // Update dashboard wait time selection if active
    if (currentOwnerRestaurant && currentOwnerRestaurant.id === id) {
      currentOwnerRestaurant.waitTime = waitTime;
      const dashOptions = document.getElementById('dash-wait-options');
      if (dashOptions && dashOptions !== container) {
        dashOptions.querySelectorAll('.wait-opt-btn').forEach(b => {
          b.classList.remove('selected-none', 'selected-mid', 'selected-packed');
        });
        dashOptions.querySelectorAll('.wait-opt-btn')[idx].classList.add(cls);
      }
    }

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
      const wasActive = chip.classList.contains('active');

      // Remove active from all chips in the same group first
      chip.closest('.wheel-chips').querySelectorAll('.wheel-chip').forEach(c => c.classList.remove('active'));

      if (!wasActive) {
        // Was not active — activate it and apply filter
        chip.classList.add('active');
        if (filter === 'price') wheelFilters.priceRange = parseInt(value);
        if (filter === 'ambiance') wheelFilters.ambiance = value;
      } else {
        // Was already active — deactivate and clear filter
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
    '#FF6B00', '#CC5500', '#E85C00', '#FF8C38', '#D45200',
    '#B84500', '#FF7722', '#E06000', '#FF9944', '#CC4400'
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
    ctx.font = `bold ${Math.max(10, 14 - Math.floor(N / 5))}px Outfit, sans-serif`;
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

  // extraSpins MUST be an integer so that extraSpins*360 is an exact multiple
  // of 360. If it were a float, (float*360 + angleDiff) % 360 ≠ angleDiff,
  // causing a random rotational offset that misaligns the result.
  const extraSpins = Math.floor(5 + Math.random() * 5); // integer: 5–9
  const targetSlice = Math.floor(Math.random() * restaurants.length);
  const sliceAngle = 360 / restaurants.length;

  // Desired final wheel angle so targetSlice's centre sits exactly at 12 o'clock:
  //   centre_screen = (targetSlice * sliceAngle - 90 + sliceAngle/2 + finalAngle) % 360
  //   we want that = 270  →  finalAngle = (360 - targetSlice*sliceAngle - sliceAngle/2 + 720) % 360
  const targetFinalAngle = ((360 - targetSlice * sliceAngle - sliceAngle / 2) % 360 + 360) % 360;
  const currentAngle = ((wheelAngle % 360) + 360) % 360;
  let angleDiff = (targetFinalAngle - currentAngle + 360) % 360;
  if (angleDiff === 0) angleDiff = 360; // ensure at least one full extra rotation
  const targetAngle = wheelAngle + extraSpins * 360 + angleDiff;
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
let likedRestaurants = [];
let matchedRestaurantIds = [];
let currentMatchRestaurantId = null;

async function initFoodSwipe() {
  if (swipeInited) return;
  swipeInited = true;
  try {
    const list = await API.getRestaurants();
    swipeList = [...list].sort(() => Math.random() - 0.5);
    swipeIndex = 0;
    swipeLiked = 0;
    swipeSkipped = 0;
    likedRestaurants = [];
    matchedRestaurantIds = [];
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
      <div style="display:flex;gap:10px;width:100%;justify-content:center;margin-top:12px;">
        <button class="btn-primary" onclick="showLikedSummary()" style="padding:10px 20px;font-size:13px;font-weight:600;">📋 View Liked List</button>
        <button class="btn-secondary" onclick="resetSwipe()" style="padding:10px 20px;font-size:13px;font-weight:600;background:transparent;border:1px solid var(--border-orange);color:var(--orange);">🔄 Start Over</button>
      </div>
    </div>`;

    // Automatically display the summary list modal
    showLikedSummary();
    return;
  }

  stack.innerHTML = toShow.map((r, i) => {
    const emoji = CUISINE_EMOJI[r.cuisine] || '🍴';
    return `
      <div class="swipe-card" id="swipe-card-${r.id}" data-id="${r.id}" style="z-index:${3 - i};">
        <div class="swipe-like-label" id="like-label-${r.id}">LIKE</div>
        <div class="swipe-nope-label" id="nope-label-${r.id}">NOPE</div>
        <div class="swipe-card-img-placeholder" style="background:linear-gradient(135deg, ${r.imgColor}, #0F0C0A);">${emoji}</div>
        <div class="swipe-card-body">
          <div class="swipe-card-name" style="text-align:left;">${r.name}</div>
          <div class="swipe-card-sub" style="text-align:left;">${r.cuisine} • ${priceSymbol(r.priceRange)}</div>
          <div class="swipe-card-footer">
            <div class="swipe-card-rating">⭐ ${r.rating} (${r.reviews})</div>
            <div style="font-size:12px;color:var(--gray-300);">${r.ambiance.slice(0, 1).map(a => AMBIANCE_LABELS[a]).join('')}</div>
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
  if (r && !likedRestaurants.some(x => x.id === r.id)) {
    likedRestaurants.push(r);
  }
  swipeLiked++;
  swipeIndex++;
  updateSwipeScore();

  try {
    if (roomCode && r) {
      const res = await API.sendSwipeLike(roomCode, id);
      if (res.match && !matchedRestaurantIds.includes(r.id)) {
        matchedRestaurantIds.push(r.id);
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
    likedRestaurants = [];
    matchedRestaurantIds = [];
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
    `;
    updateRoomUI();
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
    updateRoomUI();
    showToast(`Joined room ${roomCode}!`, '🎉');
  } catch (e) {
    showToast(e.message, '❌');
  }
}

function deleteRoom() {
  if (!roomCode) return;
  const oldCode = roomCode;
  roomCode = null;
  document.getElementById('room-code-display').textContent = 'None';

  const status = document.getElementById('room-status');
  if (status) {
    status.classList.remove('show');
    status.textContent = '';
  }

  const membersList = document.getElementById('room-members-list');
  if (membersList) {
    membersList.innerHTML = '';
  }

  const input = document.getElementById('room-join-input');
  if (input) input.value = '';

  updateRoomUI();
  showToast(`Room ${oldCode} deleted.`, '🗑️');
}

function updateRoomUI() {
  const btnDelete = document.getElementById('btn-delete-room');
  if (btnDelete) {
    btnDelete.style.display = roomCode ? 'inline-flex' : 'none';
  }
}

function showLikedSummary() {
  const modal = document.getElementById('swipe-liked-modal');
  const container = document.getElementById('swipe-liked-list');
  if (!modal || !container) return;

  if (likedRestaurants.length === 0) {
    container.innerHTML = `
      <div style="padding:40px 20px;color:var(--gray-500);text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🍽️</div>
        <p>No restaurants liked during this session.<br>Swipe right on some places first!</p>
      </div>
    `;
  } else {
    container.innerHTML = likedRestaurants.map(r => {
      const emoji = CUISINE_EMOJI[r.cuisine] || '🍴';
      const isMatched = matchedRestaurantIds.includes(r.id);
      const matchBadge = isMatched ? `<span style="background:rgba(255,107,0,0.15);border:1px solid var(--border-orange);color:var(--orange);font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;margin-left:8px;white-space:nowrap;display:inline-block;line-height:1.2;">🔥 Group Match</span>` : '';

      return `
        <div class="liked-restaurant-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid var(--border-glass);border-radius:var(--radius-lg);gap:12px;transition:var(--transition);text-align:left;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
            <div style="font-size:20px;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, ${r.imgColor}, #0F0C0A);flex-shrink:0;">${emoji}</div>
            <div style="min-width:0;flex:1;">
              <div style="font-size:15px;font-weight:700;color:var(--white);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">${r.name}</span>
                ${matchBadge}
              </div>
              <div style="font-size:12px;color:var(--gray-300);">${r.cuisine} • ${priceSymbol(r.priceRange)} • ⭐ ${r.rating}</div>
            </div>
          </div>
          <button class="btn-room" onclick="chooseLikedRestaurant(${r.id})" style="padding:8px 14px;font-size:12px;border-radius:var(--radius-pill);white-space:nowrap;margin:0;flex-shrink:0;">Let's Go! →</button>
        </div>
      `;
    }).join('');
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSwipeLikedModal() {
  const modal = document.getElementById('swipe-liked-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

function chooseLikedRestaurant(id) {
  closeSwipeLikedModal();
  openRestaurantModal(id);
}

function showMatch(restaurant) {
  currentMatchRestaurantId = restaurant.id;
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
  if (currentMatchRestaurantId) {
    const id = currentMatchRestaurantId;
    currentMatchRestaurantId = null;
    openRestaurantModal(id);
  }
}

/* ==================== OWNER DASHBOARD ==================== */
let dashInited = false;
let queueList = [];
let currentOwnerRestaurant = null;
let currentMenuData = [];
let currentMenuCategoryIndex = 0;

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

    // Deep copy menu data for draft edits
    currentMenuData = JSON.parse(JSON.stringify(currentOwnerRestaurant.menu || []));
    currentMenuCategoryIndex = 0;

    // Update dashboard header
    const managingTitle = document.getElementById('dash-managing-title');
    const managingInfo = document.getElementById('dash-managing-info');
    if (managingTitle && managingInfo && currentOwnerRestaurant) {
      managingTitle.textContent = `🏪 Managing: ${currentOwnerRestaurant.name}`;
      managingInfo.textContent = `${currentOwnerRestaurant.address} | Phone: ${currentOwnerRestaurant.phone}`;
    }

    // Populate profile edit form
    populateProfileForm(currentOwnerRestaurant);

    // Render dashboard wait time widget
    renderDashboardWaitTime(currentOwnerRestaurant);

    // 2. Fetch promos list
    await refreshDashboardPromos();

    // 3. Populate Account Settings details
    const currentUsername = sessionStorage.getItem('tm_username') || 'owner@romulo.com';
    const currentUsernameEl = document.getElementById('account-current-username');
    if (currentUsernameEl) currentUsernameEl.textContent = currentUsername;

    const fullUserField = document.getElementById('account-new-username');
    if (fullUserField) fullUserField.value = currentUsername;
    const overviewUserField = document.getElementById('overview-new-username');
    if (overviewUserField) overviewUserField.value = currentUsername;

    dashInited = true;
  } catch (err) {
    showToast(err.message, '❌');
    // If not claimed or authorized, let them logout or return to home
    sessionStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
    navigateTo('home');
  } finally {
    overlay.remove();
  }
}

function renderDashboardWaitTime(r) {
  const container = document.getElementById('dash-wait-options');
  if (!container) return;
  container.innerHTML = `
    <button class="wait-opt-btn ${r.waitTime === 'none' ? 'selected-none' : ''}" onclick="reportWaitTime(${r.id}, 'none', this.parentNode)">✓ No Wait</button>
    <button class="wait-opt-btn ${r.waitTime === '15-30' ? 'selected-mid' : ''}" onclick="reportWaitTime(${r.id}, '15-30', this.parentNode)">⏱ 15–30 min</button>
    <button class="wait-opt-btn ${r.waitTime === 'packed' ? 'selected-packed' : ''}" onclick="reportWaitTime(${r.id}, 'packed', this.parentNode)">⚠ Packed!</button>
  `;
}

function switchDashPanel(panelId, el) {
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.dash-nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  if (el) el.classList.add('active');

  if (panelId === 'dash-promos') refreshDashboardPromos();
  if (panelId === 'dash-menu') renderDashMenuEditor();
  if (panelId === 'dash-account') {
    const currentUsername = sessionStorage.getItem('tm_username') || 'owner@romulo.com';
    const currentUsernameEl = document.getElementById('account-current-username');
    if (currentUsernameEl) currentUsernameEl.textContent = currentUsername;
    const fullUserField = document.getElementById('account-new-username');
    if (fullUserField) fullUserField.value = currentUsername;
  }
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

    // Update dashboard header
    const managingTitle = document.getElementById('dash-managing-title');
    const managingInfo = document.getElementById('dash-managing-info');
    if (managingTitle && managingInfo) {
      managingTitle.textContent = `🏪 Managing: ${name}`;
      managingInfo.textContent = `${address} | Phone: ${phone}`;
    }
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

async function handleUpdateAccount(type) {
  const isOverview = type === 'overview';
  const userFieldId = isOverview ? 'overview-new-username' : 'account-new-username';
  const passFieldId = isOverview ? 'overview-new-password' : 'account-new-password';
  const confirmFieldId = 'account-confirm-password';
  const errorEl = document.getElementById('account-update-error');

  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  const username = document.getElementById(userFieldId)?.value?.trim();
  const password = document.getElementById(passFieldId)?.value;

  if (!username || !password) {
    showToast('Username and password cannot be empty!', '⚠️');
    return;
  }

  if (!isOverview) {
    const confirmPass = document.getElementById(confirmFieldId)?.value;
    if (password !== confirmPass) {
      if (errorEl) {
        errorEl.textContent = '❌ Passwords do not match!';
        errorEl.style.display = 'block';
      } else {
        showToast('Passwords do not match!', '❌');
      }
      return;
    }
  }

  try {
    showToast('Updating account settings...', '🔐');
    await API.updateOwnerAccount(username, password);
    showToast('Account updated successfully!', '✅');

    // Update UI elements
    const currentUsernameEl = document.getElementById('account-current-username');
    if (currentUsernameEl) currentUsernameEl.textContent = username;

    // Clear password fields
    if (document.getElementById('overview-new-password')) document.getElementById('overview-new-password').value = '';
    if (document.getElementById('account-new-password')) document.getElementById('account-new-password').value = '';
    if (document.getElementById('account-confirm-password')) document.getElementById('account-confirm-password').value = '';

    // Keep fields in sync
    const fullUserField = document.getElementById('account-new-username');
    if (fullUserField) fullUserField.value = username;
    const overviewUserField = document.getElementById('overview-new-username');
    if (overviewUserField) overviewUserField.value = username;

  } catch (e) {
    if (errorEl) {
      errorEl.textContent = `❌ ${e.message}`;
      errorEl.style.display = 'block';
    } else {
      showToast(e.message, '❌');
    }
  }
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

/* ==================== OWNER DASHBOARD: MENU EDITOR ==================== */
function renderDashMenuEditor() {
  const catContainer = document.getElementById('dash-menu-categories');
  const itemsContainer = document.getElementById('dash-menu-items-list');
  const addItemCatLabel = document.getElementById('add-item-category-name');

  if (!catContainer || !itemsContainer || !currentMenuData) return;

  // 1. Render category tab buttons
  if (currentMenuData.length === 0) {
    catContainer.innerHTML = `<span style="font-size:13px;color:var(--gray-500);">No categories. Create one to begin.</span>`;
    itemsContainer.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray-500);">Create a category first to add menu items.</div>`;
    if (addItemCatLabel) addItemCatLabel.textContent = '(Create a category)';
    return;
  }

  // Bound check Category Index
  if (currentMenuCategoryIndex >= currentMenuData.length) {
    currentMenuCategoryIndex = 0;
  }

  catContainer.innerHTML = currentMenuData.map((cat, idx) => `
    <button class="menu-cat-btn ${idx === currentMenuCategoryIndex ? 'active' : ''}" onclick="switchMenuCategory(${idx})">
      ${cat.category}
    </button>
  `).join('');

  const activeCat = currentMenuData[currentMenuCategoryIndex];
  if (addItemCatLabel) addItemCatLabel.textContent = `"${activeCat.category}"`;

  // 2. Render items in active category
  if (!activeCat.items || activeCat.items.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align:center;padding:40px;border:1px dashed var(--border-glass);border-radius:var(--radius-lg);color:var(--gray-500);">
        No items in this category yet. Add one below!
      </div>
    `;
    return;
  }

  itemsContainer.innerHTML = activeCat.items.map((item, idx) => `
    <div class="dash-menu-item-row">
      <div class="form-group" style="flex: 2; min-width: 180px;">
        <label class="form-label" style="font-size: 10px; margin-bottom: 4px;">Item Name</label>
        <input type="text" class="form-input" value="${item.name.replace(/"/g, '&quot;')}" oninput="changeMenuItemValue(${idx}, 'name', this.value)" placeholder="Item name..." required />
      </div>
      <div class="form-group" style="flex: 0.8; min-width: 90px;">
        <label class="form-label" style="font-size: 10px; margin-bottom: 4px;">Price (₱)</label>
        <input type="number" class="form-input" value="${item.price}" oninput="changeMenuItemValue(${idx}, 'price', this.value)" placeholder="Price..." min="0" required />
      </div>
      <div class="form-group" style="flex: 3; min-width: 200px;">
        <label class="form-label" style="font-size: 10px; margin-bottom: 4px;">Description</label>
        <input type="text" class="form-input" value="${(item.description || '').replace(/"/g, '&quot;')}" oninput="changeMenuItemValue(${idx}, 'description', this.value)" placeholder="Item description..." />
      </div>
      <div class="dash-menu-item-actions">
        <button class="btn-delete-item" onclick="deleteMenuItem(${idx})">
          🗑️ Delete
        </button>
      </div>
    </div>
  `).join('');
}

function switchMenuCategory(idx) {
  currentMenuCategoryIndex = idx;
  renderDashMenuEditor();
}

function changeMenuItemValue(itemIdx, field, value) {
  if (!currentMenuData || !currentMenuData[currentMenuCategoryIndex]) return;
  const items = currentMenuData[currentMenuCategoryIndex].items;
  if (!items || !items[itemIdx]) return;

  if (field === 'price') {
    items[itemIdx][field] = parseFloat(value) || 0;
  } else {
    items[itemIdx][field] = value;
  }
}

function deleteMenuItem(itemIdx) {
  if (!currentMenuData || !currentMenuData[currentMenuCategoryIndex]) return;
  const items = currentMenuData[currentMenuCategoryIndex].items;
  if (!items || !items[itemIdx]) return;

  const itemName = items[itemIdx].name || 'this item';
  if (confirm(`Remove "${itemName}" from the menu?`)) {
    items.splice(itemIdx, 1);
    renderDashMenuEditor();
    showToast(`Removed "${itemName}"`, '🗑️');
  }
}

function addNewMenuItem() {
  const nameInput = document.getElementById('new-item-name');
  const priceInput = document.getElementById('new-item-price');
  const descInput = document.getElementById('new-item-desc');

  const name = nameInput?.value?.trim();
  const price = parseFloat(priceInput?.value) || 0;
  const description = descInput?.value?.trim() || '';

  if (!name) {
    showToast('Item Name is required!', '⚠️');
    return;
  }

  if (!currentMenuData || currentMenuData.length === 0) {
    showToast('Create a category first!', '⚠️');
    return;
  }

  const activeCat = currentMenuData[currentMenuCategoryIndex];
  if (!activeCat.items) activeCat.items = [];

  activeCat.items.push({ name, price, description });

  // Clear inputs
  if (nameInput) nameInput.value = '';
  if (priceInput) priceInput.value = '';
  if (descInput) descInput.value = '';

  renderDashMenuEditor();
  showToast(`Added "${name}" to ${activeCat.category}`, '➕');
}

function addNewCategoryPrompt() {
  const name = prompt('Enter name for the new menu category (e.g. Starters, Mains, Special Drinks):');
  if (!name || !name.trim()) return;

  const cleanName = name.trim();

  // Check for duplicates
  const exists = currentMenuData.some(c => c.category.toLowerCase() === cleanName.toLowerCase());
  if (exists) {
    showToast(`Category "${cleanName}" already exists!`, '⚠️');
    return;
  }

  currentMenuData.push({ category: cleanName, items: [] });
  currentMenuCategoryIndex = currentMenuData.length - 1;

  renderDashMenuEditor();
  showToast(`Created category "${cleanName}"`, '➕');
}

function deleteCurrentCategory() {
  if (!currentMenuData || currentMenuData.length === 0) return;
  const catName = currentMenuData[currentMenuCategoryIndex].category;

  if (confirm(`Are you sure you want to delete the entire category "${catName}" and all its items?`)) {
    currentMenuData.splice(currentMenuCategoryIndex, 1);
    currentMenuCategoryIndex = 0;
    renderDashMenuEditor();
    showToast(`Deleted category "${catName}"`, '🗑️');
  }
}

async function saveOwnerMenu() {
  if (!currentOwnerRestaurant) return;

  // Validate the menu inputs (simple name check)
  let isValid = true;
  currentMenuData.forEach(cat => {
    if (cat.items) {
      cat.items.forEach(item => {
        if (!item.name || !item.name.trim()) {
          isValid = false;
        }
      });
    }
  });

  if (!isValid) {
    showToast('All menu items must have a name!', '❌');
    return;
  }

  try {
    showToast('Saving menu changes...', '💾');
    // Save to server/mock state
    await API.updateOwnerRestaurant({ menu: currentMenuData });

    // Update local cached copy of owner restaurant
    currentOwnerRestaurant.menu = JSON.parse(JSON.stringify(currentMenuData));

    showToast('Menu saved successfully!', '✅');
    renderDashMenuEditor();

    // Refresh lists and maps to reflect changes immediately
    if (document.getElementById('restaurant-list').classList.contains('active')) {
      renderRestaurantList();
    }
  } catch (e) {
    showToast(e.message, '❌');
  }
}
