// ============================================================
// api.js — API Service Layer
// Supports mock (localStorage & in-memory) and live (Fetch API) modes
// ============================================================

const API = (() => {
  // Helpers
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Get Auth Token from LocalStorage
  const getAuthToken = () => {
    return localStorage.getItem(CONFIG.AUTH_TOKEN_KEY) || '';
  };

  // Build live request headers
  const getHeaders = (contentType = 'application/json') => {
    const headers = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Handle Response helper
  const handleResponse = async (response) => {
    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return await response.json();
  };

  // Mock State (shared in memory for mock mode, backed by localStorage where appropriate)
  let mockClaimedRestaurantId = parseInt(localStorage.getItem('tm_claimed_restaurant_id') || '1');
  
  // Initialize mock queue in localStorage if not exists
  if (!localStorage.getItem('tm_mock_queues')) {
    const initialQueues = {};
    // Populate some initial queues for restaurants
    RESTAURANTS.forEach(r => {
      initialQueues[r.id] = [
        { num: 12, name: 'Santos Family', size: 4, time: '7:24 PM', called: false },
        { num: 13, name: 'Maria R.', size: 2, time: '7:31 PM', called: false },
        { num: 14, name: 'Reyes Group', size: 6, time: '7:38 PM', called: false },
        { num: 15, name: 'Dela Cruz', size: 3, time: '7:42 PM', called: false }
      ];
    });
    localStorage.setItem('tm_mock_queues', JSON.stringify(initialQueues));
  }

  // Helper to get mock queue for current claimed restaurant
  const getMockQueueList = (restaurantId) => {
    const all = JSON.parse(localStorage.getItem('tm_mock_queues') || '{}');
    return all[restaurantId] || [];
  };

  const saveMockQueueList = (restaurantId, list) => {
    const all = JSON.parse(localStorage.getItem('tm_mock_queues') || '{}');
    all[restaurantId] = list;
    localStorage.setItem('tm_mock_queues', JSON.stringify(all));
  };

  // Mock Promos List
  if (!localStorage.getItem('tm_mock_promos')) {
    const initialPromos = {};
    RESTAURANTS.forEach(r => {
      initialPromos[r.id] = [
        { id: 101, title: r.dailySpecial.title, description: r.dailySpecial.description, valid: r.dailySpecial.valid, status: 'LIVE' },
        { id: 102, title: 'Truffle Special', description: 'Truffle pasta 20% off', valid: 'Every Tuesday', status: 'SCHEDULED' }
      ];
    });
    localStorage.setItem('tm_mock_promos', JSON.stringify(initialPromos));
  }

  const getMockPromos = (restaurantId) => {
    const all = JSON.parse(localStorage.getItem('tm_mock_promos') || '{}');
    return all[restaurantId] || [];
  };

  const saveMockPromos = (restaurantId, list) => {
    const all = JSON.parse(localStorage.getItem('tm_mock_promos') || '{}');
    all[restaurantId] = list;
    localStorage.setItem('tm_mock_promos', JSON.stringify(all));
  };

  // Swipe sessions / Room matches in mock mode
  let mockRooms = {}; // { roomCode: { members: [], likes: {} } }

  return {
    // ------------------------------------------------------------
    // PUBLIC DISCOVERY API
    // ------------------------------------------------------------

    // 1. Get List of Restaurants with Filters
    getRestaurants: async (filters = {}) => {
      if (CONFIG.API_MODE === 'live') {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.cuisine) queryParams.append('cuisine', filters.cuisine);
        if (filters.ambiance) queryParams.append('ambiance', filters.ambiance);
        if (filters.dietary) queryParams.append('dietary', filters.dietary);
        if (filters.openNow) queryParams.append('open_now', filters.openNow);

        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/restaurants?${queryParams.toString()}`);
        return await handleResponse(res);
      } else {
        // Mock implementation
        await delay(400); // Simulate network latency
        let filtered = [...RESTAURANTS];

        if (filters.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter(r => 
            r.name.toLowerCase().includes(q) || 
            r.cuisine.toLowerCase().includes(q) || 
            r.description.toLowerCase().includes(q)
          );
        }
        if (filters.cuisine) {
          filtered = filtered.filter(r => r.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase()));
        }
        if (filters.ambiance) {
          filtered = filtered.filter(r => r.ambiance.includes(filters.ambiance));
        }
        if (filters.dietary) {
          filtered = filtered.filter(r => r.dietary.includes(filters.dietary));
        }
        if (filters.openNow) {
          filtered = filtered.filter(r => isOpenNow(r.hours));
        }
        return filtered;
      }
    },

    // 2. Get Single Restaurant Detail
    getRestaurantById: async (id) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/restaurants/${id}`);
        return await handleResponse(res);
      } else {
        await delay(300);
        const rest = RESTAURANTS.find(r => r.id === parseInt(id));
        if (!rest) throw new Error('Restaurant not found');
        return { ...rest };
      }
    },

    // 3. Get Nearby Restaurants (Radius Search)
    getNearbyRestaurants: async (lat, lng, radiusMeters, filters = {}) => {
      if (CONFIG.API_MODE === 'live') {
        const queryParams = new URLSearchParams({ lat, lng, radius: radiusMeters });
        if (filters.openNow) queryParams.append('open_now', filters.openNow);
        if (filters.cuisine) queryParams.append('cuisine', filters.cuisine);

        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/restaurants/nearby?${queryParams.toString()}`);
        return await handleResponse(res);
      } else {
        await delay(400);
        return RESTAURANTS
          .filter(r => {
            const dist = computeDistance(lat, lng, r.lat, r.lng);
            if (dist > radiusMeters) return false;
            if (filters.openNow && !isOpenNow(r.hours)) return false;
            if (filters.cuisine && !r.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase())) return false;
            return true;
          })
          .map(r => ({ ...r, _dist: computeDistance(lat, lng, r.lat, r.lng) }))
          .sort((a, b) => a._dist - b._dist);
      }
    },

    // 4. Report Wait Time (Crowdsourced)
    reportWaitTime: async (id, waitTime) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/restaurants/${id}/wait-time`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ waitTime }),
        });
        return await handleResponse(res);
      } else {
        await delay(200);
        const rest = RESTAURANTS.find(r => r.id === parseInt(id));
        if (rest) {
          rest.waitTime = waitTime;
          return { success: true, waitTime };
        }
        throw new Error('Restaurant not found');
      }
    },

    // 5. Get Public Queue Status
    getQueue: async (restaurantId) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/restaurants/${restaurantId}/queue`);
        return await handleResponse(res);
      } else {
        await delay(300);
        const queue = getMockQueueList(restaurantId);
        const active = queue.filter(q => !q.called);
        const rest = RESTAURANTS.find(r => r.id === parseInt(restaurantId));
        return {
          waitingCount: active.length,
          currentWaitLabel: rest ? WAIT_LABELS[rest.waitTime].label : 'No Wait',
        };
      }
    },

    // 6. Join Virtual Queue
    joinQueue: async (restaurantId, name, partySize) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/restaurants/${restaurantId}/queue`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ name, partySize }),
        });
        return await handleResponse(res);
      } else {
        await delay(500);
        const queue = getMockQueueList(restaurantId);
        const num = queue.length > 0 ? Math.max(...queue.map(q => q.num)) + 1 : 12;
        const now = new Date();
        const time = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        
        const newGuest = {
          num,
          name: name || 'Guest',
          size: parseInt(partySize) || 2,
          time,
          called: false
        };
        queue.push(newGuest);
        saveMockQueueList(restaurantId, queue);
        
        return {
          success: true,
          queueNumber: num,
          estimatedWaitMinutes: num * 5,
        };
      }
    },

    // ------------------------------------------------------------
    // GROUP SWIPE ROOMS API
    // ------------------------------------------------------------

    // 7. Create Swipe Room
    createSwipeRoom: async () => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/rooms`, {
          method: 'POST',
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } else {
        await delay(400);
        const code = Math.random().toString(36).substr(2, 6).toUpperCase();
        mockRooms[code] = {
          code,
          members: ['You'],
          likes: {},
        };
        return { code, members: ['You'] };
      }
    },

    // 8. Join Swipe Room
    joinSwipeRoom: async (code) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/rooms/${code}/join`, {
          method: 'POST',
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } else {
        await delay(400);
        const formattedCode = code.toUpperCase().trim();
        if (!mockRooms[formattedCode]) {
          // Auto create it for local demo simplicity if it doesn't exist
          mockRooms[formattedCode] = {
            code: formattedCode,
            members: ['You', 'P2'],
            likes: {},
          };
        } else {
          if (!mockRooms[formattedCode].members.includes('P2')) {
            mockRooms[formattedCode].members.push('P2');
          }
        }
        return { code: formattedCode, members: mockRooms[formattedCode].members };
      }
    },

    // 9. Send Swipe Like
    sendSwipeLike: async (code, restaurantId) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/rooms/${code}/swipe`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ restaurantId, action: 'like' }),
        });
        return await handleResponse(res);
      } else {
        await delay(100);
        const formattedCode = code.toUpperCase().trim();
        if (!mockRooms[formattedCode]) return { match: false };
        
        const likes = mockRooms[formattedCode].likes;
        if (!likes[restaurantId]) likes[restaurantId] = 1; // You liked it
        else likes[restaurantId]++; // Someone else also liked it
        
        // Auto simulate partner liking it with 50% probability
        if (likes[restaurantId] === 1 && Math.random() > 0.5) {
          likes[restaurantId]++;
        }

        const isMatch = likes[restaurantId] >= 2;
        return { match: isMatch };
      }
    },

    // ------------------------------------------------------------
    // OWNER DASHBOARD & AUTH API
    // ------------------------------------------------------------

    // 10. Owner Login
    ownerLogin: async (username, password) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/auth/login`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ username, password }),
        });
        const data = await handleResponse(res);
        if (data.token) {
          localStorage.setItem(CONFIG.AUTH_TOKEN_KEY, data.token);
        }
        return data;
      } else {
        await delay(600);
        if (username && password) {
          const fakeToken = `mock_jwt_${btoa(username)}_${Date.now()}`;
          localStorage.setItem(CONFIG.AUTH_TOKEN_KEY, fakeToken);
          // Auto assign first restaurant (Romulo Cafe) to this login
          mockClaimedRestaurantId = 1;
          localStorage.setItem('tm_claimed_restaurant_id', '1');
          return { success: true, token: fakeToken, restaurantId: 1 };
        }
        throw new Error('Please enter both username and password');
      }
    },

    // 11. Claim Restaurant
    claimRestaurant: async (restaurantId) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/auth/claim`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ restaurantId }),
        });
        return await handleResponse(res);
      } else {
        await delay(500);
        mockClaimedRestaurantId = parseInt(restaurantId);
        localStorage.setItem('tm_claimed_restaurant_id', restaurantId.toString());
        return { success: true, claimedId: mockClaimedRestaurantId };
      }
    },

    // 12. Get Claimed Restaurant Profile
    getOwnerRestaurant: async () => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/restaurant`, {
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } else {
        await delay(400);
        const r = RESTAURANTS.find(x => x.id === mockClaimedRestaurantId);
        if (!r) throw new Error('No restaurant claimed yet');
        return { ...r };
      }
    },

    // 13. Update Restaurant Profile
    updateOwnerRestaurant: async (restaurantData) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/restaurant`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(restaurantData),
        });
        return await handleResponse(res);
      } else {
        await delay(500);
        const idx = RESTAURANTS.findIndex(x => x.id === mockClaimedRestaurantId);
        if (idx !== -1) {
          // Merge updates
          RESTAURANTS[idx] = { ...RESTAURANTS[idx], ...restaurantData };
          return { success: true, restaurant: RESTAURANTS[idx] };
        }
        throw new Error('Restaurant not found');
      }
    },

    // 14. Get Owner Promos
    getOwnerPromos: async () => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/promos`, {
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } else {
        await delay(300);
        return getMockPromos(mockClaimedRestaurantId);
      }
    },

    // 15. Create/Update Promo
    createOwnerPromo: async (promo) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/promos`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(promo),
        });
        return await handleResponse(res);
      } else {
        await delay(400);
        const promos = getMockPromos(mockClaimedRestaurantId);
        const newPromo = {
          id: Date.now(),
          title: promo.title,
          description: promo.description,
          valid: promo.valid || 'Today only',
          status: 'LIVE',
        };
        // Update restaurant's active promo field
        const r = RESTAURANTS.find(x => x.id === mockClaimedRestaurantId);
        if (r) {
          r.dailySpecial = {
            title: newPromo.title,
            description: newPromo.description,
            valid: newPromo.valid,
          };
        }
        // Save to promos list
        promos.unshift(newPromo);
        saveMockPromos(mockClaimedRestaurantId, promos);
        return { success: true, promo: newPromo };
      }
    },

    // 16. Delete Promo
    deleteOwnerPromo: async (promoId) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/promos/${promoId}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } else {
        await delay(300);
        let promos = getMockPromos(mockClaimedRestaurantId);
        promos = promos.filter(p => p.id !== parseInt(promoId));
        saveMockPromos(mockClaimedRestaurantId, promos);
        return { success: true };
      }
    },

    // 17. Get Owner Queue List
    getOwnerQueue: async () => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/queue`, {
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } else {
        await delay(300);
        return getMockQueueList(mockClaimedRestaurantId);
      }
    },

    // 18. Add Guest to Queue from Dashboard
    ownerAddToQueue: async (name, size) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/queue`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ name, size }),
        });
        return await handleResponse(res);
      } else {
        await delay(400);
        const queue = getMockQueueList(mockClaimedRestaurantId);
        const num = queue.length > 0 ? Math.max(...queue.map(q => q.num)) + 1 : 12;
        const now = new Date();
        const time = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        
        const newGuest = {
          num,
          name,
          size: parseInt(size),
          time,
          called: false
        };
        queue.push(newGuest);
        saveMockQueueList(mockClaimedRestaurantId, queue);
        return { success: true, guest: newGuest };
      }
    },

    // 19. Call Guest
    callGuest: async (num) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/queue/${num}/call`, {
          method: 'PATCH',
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } else {
        await delay(200);
        const queue = getMockQueueList(mockClaimedRestaurantId);
        const guest = queue.find(q => q.num === parseInt(num));
        if (guest) {
          guest.called = true; // wait, in our app.js called is boolean. If it's called we change border color, if it's seated we delete it.
          // Wait, app.js filters out called guests from rendering: const active = queueList.filter(q => !q.called); but wait, app.js callGuest only flashes but doesn't remove! SeatGuest sets called=true and renders, filtering it out.
          // Let's match app.js behavior.
          saveMockQueueList(mockClaimedRestaurantId, queue);
          return { success: true };
        }
        throw new Error('Guest not found');
      }
    },

    // 20. Seat Guest
    seatGuest: async (num) => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/queue/${num}/seat`, {
          method: 'PATCH',
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } else {
        await delay(200);
        const queue = getMockQueueList(mockClaimedRestaurantId);
        const guest = queue.find(q => q.num === parseInt(num));
        if (guest) {
          guest.seated = true;
          guest.called = true; // this filters it out in renderQueueList
          saveMockQueueList(mockClaimedRestaurantId, queue);
          return { success: true };
        }
        throw new Error('Guest not found');
      }
    },

    // 21. Get Analytics
    getAnalytics: async (period = '7d') => {
      if (CONFIG.API_MODE === 'live') {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/owner/analytics?period=${period}`, {
          headers: getHeaders(),
        });
        return await handleResponse(res);
      } else {
        await delay(500);
        return {
          viewsToday: 248,
          viewsChange: '↑ 12% vs yesterday',
          queueSeatedToday: 32,
          queueSeatedChange: '↑ 8 still waiting',
          swipeMatches: 17,
          swipeMatchesChange: '↑ 41% this week',
          avgRating: 4.7,
          reviewsCount: 284,
          visitsChart: [45, 62, 58, 71, 89, 134, 118],
          topMenuItems: [
            { name: 'USDA Prime Ribeye', count: 89 },
            { name: 'Wagyu Striploin', count: 67 },
            { name: 'Molten Lava Cake', count: 54 },
            { name: 'Truffle Mushroom Soup', count: 41 },
          ],
          discoverySources: [
            { source: 'Food Radar', percentage: 42 },
            { source: 'Restaurant List', percentage: 31 },
            { source: 'Food Swipe', percentage: 18 },
            { source: 'Food Wheel', percentage: 9 },
          ]
        };
      }
    }
  };
})();
