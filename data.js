// ============================================================
// data.js — Mock Restaurant Data for Tomas Morato Discovery
// ============================================================

const TOMAS_MORATO_CENTER = { lat: 14.6337, lng: 121.0337 };

const RESTAURANTS = [
  {
    id: 1,
    name: "Romulo Café",
    cuisine: "Filipino",
    description: "A tribute to Filipino culinary heritage, serving timeless dishes in an elegant, colonial-inspired setting.",
    lat: 14.6350, lng: 121.0330,
    rating: 4.7, reviews: 284, priceRange: 3,
    ambiance: ["date-night", "family"],
    dietary: ["vegetarian"],
    hours: { open: "11:00", close: "22:00" },
    waitTime: "none",
    phone: "+63 2 8374 1234",
    address: "32 Scout Tuazon, Tomas Morato Ave, QC",
    imgColor: "#8B3A1A",
    imgPattern: "filipino",
    menu: [
      { category: "Starters", items: [
        { name: "Kare-Kare Spring Rolls", price: 280, description: "Crispy rolls filled with oxtail kare-kare and peanut sauce" },
        { name: "Kesong Puti Salad", price: 250, description: "Fresh white cheese, tomatoes, basil and red onion" },
        { name: "Crispy Dinuguan Lumpia", price: 230, description: "Pork blood stew wrapped in crunchy spring roll" }
      ]},
      { category: "Mains", items: [
        { name: "Beef Caldereta", price: 480, description: "Slow-cooked beef in rich tomato-liver sauce with olives" },
        { name: "Chicken Inasal", price: 380, description: "Grilled marinated chicken, Bacolod style with annatto oil" },
        { name: "Laing", price: 280, description: "Taro leaves slow-cooked in coconut cream with chili and shrimp" },
        { name: "Lechon Kawali", price: 420, description: "Deep-fried crispy pork belly with liver sauce" }
      ]},
      { category: "Drinks", items: [
        { name: "Calamansi Juice", price: 120, description: "Fresh calamansi with honey and ice" },
        { name: "Buko Pandan", price: 150, description: "Young coconut strips with pandan jelly in cream" },
        { name: "Samalamig", price: 130, description: "Traditional cold Philippine refreshment" }
      ]},
      { category: "Desserts", items: [
        { name: "Leche Flan", price: 180, description: "Classic caramel custard, silky smooth" },
        { name: "Halo-Halo", price: 220, description: "Layered shaved ice dessert with ube, leche flan, and coconut" },
        { name: "Bibingka", price: 160, description: "Rice cake with salted egg and cheese" }
      ]}
    ],
    photos: { food: ["img/hero_food.png"], drinks: ["img/restaurant_cards.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Fiesta Friday", description: "20% off all main courses! Celebrate Filipino flavors.", valid: "Today until 10PM" }
  },
  {
    id: 2,
    name: "Sarsa Kitchen+Bar",
    cuisine: "Filipino Modern",
    description: "Modern takes on Southern Tagalog and Visayan classics in a lively bar setting.",
    lat: 14.6340, lng: 121.0325,
    rating: 4.5, reviews: 412, priceRange: 3,
    ambiance: ["family", "date-night"],
    dietary: ["halal", "vegetarian"],
    hours: { open: "11:00", close: "23:00" },
    waitTime: "15-30",
    phone: "+63 2 8928 5678",
    address: "Scout Rallos, Tomas Morato Ave, QC",
    imgColor: "#3D1C0A",
    imgPattern: "modern-filipino",
    menu: [
      { category: "Starters", items: [
        { name: "Pork BBQ Skewers", price: 240, description: "Marinated pork skewers with banana ketchup glaze" },
        { name: "Chicharon Bulaklak", price: 280, description: "Deep-fried pork ruffles with vinegar dip" }
      ]},
      { category: "Mains", items: [
        { name: "Inihaw na Liempo", price: 460, description: "Grilled pork belly with java rice and atchara" },
        { name: "Crispy Pata", price: 620, description: "Whole crispy pork leg, good for sharing" },
        { name: "Batchoy", price: 320, description: "Rich pork broth noodle soup from Iloilo" }
      ]},
      { category: "Drinks", items: [
        { name: "San Miguel Pale Pilsen", price: 120, description: "Ice cold local draft beer" },
        { name: "Lambanog Cocktail", price: 180, description: "Filipino coconut liquor mixed cocktail" }
      ]},
      { category: "Desserts", items: [
        { name: "Ginataang Bilo-Bilo", price: 160, description: "Sticky rice balls in sweetened coconut milk" }
      ]}
    ],
    photos: { food: ["img/restaurant_cards.png"], drinks: ["img/hero_food.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Happy Hour", description: "Buy 1 Take 1 on all draft beers 4–7PM!", valid: "Daily 4PM–7PM" }
  },
  {
    id: 3,
    name: "Mamou",
    cuisine: "Steakhouse",
    description: "Quezon City's beloved steakhouse known for its USDA Prime cuts and signature truffle fries.",
    lat: 14.6355, lng: 121.0340,
    rating: 4.8, reviews: 567, priceRange: 4,
    ambiance: ["date-night", "family"],
    dietary: [],
    hours: { open: "12:00", close: "22:30" },
    waitTime: "packed",
    phone: "+63 2 8352 9012",
    address: "Scout Castor, Tomas Morato Ave, QC",
    imgColor: "#1A0A00",
    imgPattern: "steakhouse",
    menu: [
      { category: "Starters", items: [
        { name: "Truffle Mushroom Soup", price: 320, description: "Creamy wild mushroom soup with truffle oil" },
        { name: "Crispy Calamari", price: 380, description: "Tender squid rings with aioli dipping sauce" }
      ]},
      { category: "Mains", items: [
        { name: "USDA Prime Ribeye", price: 1850, description: "16oz bone-in ribeye, dry-aged 21 days" },
        { name: "Wagyu Striploin", price: 2400, description: "A5 Japanese wagyu, 10oz, buttery texture" },
        { name: "Lamb Rack", price: 1600, description: "French-trimmed lamb with rosemary jus" },
        { name: "Seafood Linguine", price: 680, description: "Fresh pasta with prawns, squid, and mussels" }
      ]},
      { category: "Drinks", items: [
        { name: "House Red Wine", price: 380, description: "Curated Argentinian Malbec" },
        { name: "Craft Cocktails", price: 280, description: "Ask for our rotating seasonal menu" }
      ]},
      { category: "Desserts", items: [
        { name: "Molten Chocolate Lava Cake", price: 320, description: "Warm chocolate center with vanilla ice cream" },
        { name: "Crème Brûlée", price: 280, description: "Classic French custard with caramelized sugar" }
      ]}
    ],
    photos: { food: ["img/hero_food.png"], drinks: ["img/restaurant_cards.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Date Night Special", description: "2 steaks + bottle of wine for ₱3,500. Reserve your table!", valid: "Fri–Sat only" }
  },
  {
    id: 4,
    name: "El Chupacabra",
    cuisine: "Mexican",
    description: "Vibrant Mexican street food and margaritas in a colorful, lively atmosphere.",
    lat: 14.6330, lng: 121.0345,
    rating: 4.4, reviews: 329, priceRange: 2,
    ambiance: ["family", "pet-friendly"],
    dietary: ["vegetarian", "gluten-free"],
    hours: { open: "11:30", close: "23:30" },
    waitTime: "15-30",
    phone: "+63 2 8928 3456",
    address: "Scout Lozano, Tomas Morato Ave, QC",
    imgColor: "#5C2A00",
    imgPattern: "mexican",
    menu: [
      { category: "Starters", items: [
        { name: "Guacamole & Chips", price: 220, description: "Fresh avocado dip with crispy tortilla chips" },
        { name: "Elotes", price: 180, description: "Mexican street corn with cotija cheese and chili" }
      ]},
      { category: "Mains", items: [
        { name: "Carne Asada Tacos", price: 380, description: "Grilled beef tacos with pico de gallo and salsa verde (3pcs)" },
        { name: "Pork Carnitas Burrito", price: 420, description: "Slow-cooked pork with rice, beans, and salsa" },
        { name: "Veggie Enchiladas", price: 340, description: "Corn tortillas with roasted vegetables in mole sauce" },
        { name: "Fish Tacos", price: 360, description: "Battered fish, slaw, chipotle mayo (3pcs)" }
      ]},
      { category: "Drinks", items: [
        { name: "Classic Margarita", price: 220, description: "Tequila, triple sec, fresh lime" },
        { name: "Mexican Mule", price: 200, description: "Tequila with ginger beer and lime" },
        { name: "Agua Fresca", price: 120, description: "Fresh fruit water, rotating flavors" }
      ]},
      { category: "Desserts", items: [
        { name: "Churros con Chocolate", price: 180, description: "Crispy churros with dark chocolate dipping sauce" },
        { name: "Tres Leches", price: 200, description: "Three-milk soaked sponge cake" }
      ]}
    ],
    photos: { food: ["img/restaurant_cards.png"], drinks: ["img/hero_food.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Taco Tuesday", description: "Tacos at ₱99 each every Tuesday. All day!", valid: "Every Tuesday" }
  },
  {
    id: 5,
    name: "The Wholesome Table",
    cuisine: "Organic / Health",
    description: "Clean, organic Filipino food made from locally sourced, sustainable ingredients.",
    lat: 14.6345, lng: 121.0350,
    rating: 4.6, reviews: 198, priceRange: 3,
    ambiance: ["study-friendly", "date-night"],
    dietary: ["vegan", "vegetarian", "gluten-free", "halal"],
    hours: { open: "08:00", close: "21:00" },
    waitTime: "none",
    phone: "+63 2 8354 7890",
    address: "Scout Borromeo, Tomas Morato Ave, QC",
    imgColor: "#1E3A1E",
    imgPattern: "health",
    menu: [
      { category: "Starters", items: [
        { name: "Harvest Bowl", price: 280, description: "Quinoa, roasted vegetables, poached egg, tahini dressing" },
        { name: "Beet Carpaccio", price: 260, description: "Roasted beets, arugula, goat cheese, balsamic" }
      ]},
      { category: "Mains", items: [
        { name: "Organic Chicken Adobo", price: 380, description: "Free-range chicken in native vinegar and spices" },
        { name: "Vegan Buddha Bowl", price: 320, description: "Brown rice, chickpeas, roasted veggies, avocado" },
        { name: "Grilled Salmon", price: 580, description: "Norwegian salmon with quinoa tabbouleh" }
      ]},
      { category: "Drinks", items: [
        { name: "Cold Brew Coffee", price: 160, description: "Slow-steeped Philippine Benguet beans" },
        { name: "Green Detox Juice", price: 180, description: "Spinach, cucumber, green apple, ginger" },
        { name: "Golden Milk Latte", price: 170, description: "Turmeric, coconut milk, black pepper" }
      ]},
      { category: "Desserts", items: [
        { name: "Chia Pudding", price: 160, description: "Coconut chia pudding with mango coulis" },
        { name: "Avocado Ice Cream", price: 180, description: "Dairy-free avocado soft serve" }
      ]}
    ],
    photos: { food: ["img/hero_food.png"], drinks: ["img/restaurant_cards.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Morning Wellness", description: "Free cold brew with any breakfast order before 10AM!", valid: "Daily until 10AM" }
  },
  {
    id: 6,
    name: "Motorino",
    cuisine: "Italian Pizza",
    description: "Authentic Neapolitan pizza with naturally leavened dough fired in a wood-burning oven.",
    lat: 14.6325, lng: 121.0335,
    rating: 4.5, reviews: 243, priceRange: 3,
    ambiance: ["date-night", "family"],
    dietary: ["vegetarian"],
    hours: { open: "11:30", close: "22:00" },
    waitTime: "15-30",
    phone: "+63 2 8374 5678",
    address: "Scout Albano, Tomas Morato Ave, QC",
    imgColor: "#2E1503",
    imgPattern: "italian",
    menu: [
      { category: "Starters", items: [
        { name: "Burrata", price: 380, description: "Fresh burrata with heirloom tomatoes and basil" },
        { name: "Arancini", price: 280, description: "Crispy risotto balls with mozzarella and tomato sauce" }
      ]},
      { category: "Mains", items: [
        { name: "Margherita", price: 580, description: "San Marzano tomato, fior di latte, fresh basil" },
        { name: "Spicy Sopressata", price: 680, description: "Cured pork, nduja, chili, honey" },
        { name: "Funghi Truffle", price: 720, description: "Wild mushrooms, truffle oil, fontina, rosemary" },
        { name: "Prosciutto & Rocket", price: 700, description: "Parma ham, arugula, parmigiano, lemon" }
      ]},
      { category: "Drinks", items: [
        { name: "San Pellegrino", price: 120, description: "Italian sparkling mineral water" },
        { name: "Aperol Spritz", price: 280, description: "Prosecco, Aperol, orange slice" },
        { name: "Espresso", price: 100, description: "Italian blend double shot" }
      ]},
      { category: "Desserts", items: [
        { name: "Tiramisu", price: 280, description: "Classic with ladyfingers, mascarpone, espresso" },
        { name: "Panna Cotta", price: 240, description: "Vanilla panna cotta with berry compote" }
      ]}
    ],
    photos: { food: ["img/restaurant_cards.png"], drinks: ["img/hero_food.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Pasta e Pizza", description: "Any pasta + any pizza for ₱1,100. Perfect for two!", valid: "Mon–Thu only" }
  },
  {
    id: 7,
    name: "Blackbird",
    cuisine: "Café / International",
    description: "An all-day café serving international bites, specialty coffee, and craft cocktails in a sleek space.",
    lat: 14.6360, lng: 121.0328,
    rating: 4.6, reviews: 356, priceRange: 3,
    ambiance: ["study-friendly", "date-night"],
    dietary: ["vegetarian", "vegan"],
    hours: { open: "07:00", close: "23:00" },
    waitTime: "none",
    phone: "+63 2 8928 9012",
    address: "Scout Madriñan, Tomas Morato Ave, QC",
    imgColor: "#0D0D0D",
    imgPattern: "cafe",
    menu: [
      { category: "Starters", items: [
        { name: "Avocado Toast", price: 280, description: "Sourdough, smashed avocado, poached egg, everything bagel spice" },
        { name: "Smoked Salmon Tartine", price: 380, description: "House-cured salmon, cream cheese, capers, dill" }
      ]},
      { category: "Mains", items: [
        { name: "Eggs Benedict", price: 380, description: "Canadian bacon, poached eggs, hollandaise on English muffin" },
        { name: "Blackbird Burger", price: 480, description: "Wagyu beef patty, aged cheddar, caramelized onion, truffle aioli" },
        { name: "Risotto Primavera", price: 420, description: "Creamy Arborio rice with seasonal vegetables and parmigiano" }
      ]},
      { category: "Drinks", items: [
        { name: "Single Origin Pour Over", price: 180, description: "Ethiopia Yirgacheffe, fruity and floral" },
        { name: "Iced Oat Latte", price: 200, description: "Double espresso with oat milk over ice" },
        { name: "Blackbird Negroni", price: 280, description: "Gin, Campari, sweet vermouth" }
      ]},
      { category: "Desserts", items: [
        { name: "Flourless Chocolate Cake", price: 260, description: "Dense, fudgy, gluten-free with salted caramel" },
        { name: "Seasonal Tart", price: 220, description: "Rotating flavors using local seasonal fruit" }
      ]}
    ],
    photos: { food: ["img/hero_food.png"], drinks: ["img/restaurant_cards.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Brunch Special", description: "All-day brunch items 20% off on weekends!", valid: "Sat–Sun all day" }
  },
  {
    id: 8,
    name: "Yabu House of Katsu",
    cuisine: "Japanese",
    description: "Japan's famous katsu specialist. Perfectly breaded, perfectly fried, every single time.",
    lat: 14.6335, lng: 121.0318,
    rating: 4.7, reviews: 520, priceRange: 2,
    ambiance: ["family"],
    dietary: [],
    hours: { open: "11:00", close: "21:30" },
    waitTime: "15-30",
    phone: "+63 2 8352 1234",
    address: "Scout Tuazon, Tomas Morato Ave, QC",
    imgColor: "#1A1000",
    imgPattern: "japanese",
    menu: [
      { category: "Starters", items: [
        { name: "Miso Soup", price: 80, description: "Traditional tofu and seaweed miso" },
        { name: "Gyoza", price: 180, description: "Pan-fried pork dumplings with ponzu dip" }
      ]},
      { category: "Mains", items: [
        { name: "Premium Hire Katsu Set", price: 580, description: "Premium tenderloin cutlet, steamed rice, coleslaw, miso" },
        { name: "Rosu Katsu Set", price: 420, description: "Loin cut katsu set meal with all the trimmings" },
        { name: "Ebi Katsu Set", price: 480, description: "Three jumbo prawn katsu set meal" },
        { name: "Chicken Katsu Set", price: 380, description: "Juicy chicken katsu set meal" }
      ]},
      { category: "Drinks", items: [
        { name: "Matcha Latte", price: 160, description: "Ceremonial grade matcha with steamed milk" },
        { name: "Barley Tea", price: 80, description: "Warm or cold mugicha" },
        { name: "Japanese Beer", price: 180, description: "Sapporo or Asahi" }
      ]},
      { category: "Desserts", items: [
        { name: "Matcha Ice Cream", price: 120, description: "Premium Japanese green tea soft serve" }
      ]}
    ],
    photos: { food: ["img/restaurant_cards.png"], drinks: ["img/hero_food.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Katsu for Kids", description: "Free kids meal with any premium set purchase!", valid: "Weekends only" }
  },
  {
    id: 9,
    name: "UCC Clockwork Coffee",
    cuisine: "Café / Japanese",
    description: "A serene Japanese coffee shop experience with specialty brews and light Japanese bites.",
    lat: 14.6320, lng: 121.0340,
    rating: 4.4, reviews: 187, priceRange: 2,
    ambiance: ["study-friendly", "date-night"],
    dietary: ["vegetarian"],
    hours: { open: "08:00", close: "22:00" },
    waitTime: "none",
    phone: "+63 2 8926 5678",
    address: "Scout de Guia, Tomas Morato Ave, QC",
    imgColor: "#0A0A14",
    imgPattern: "japanese-cafe",
    menu: [
      { category: "Starters", items: [
        { name: "Japanese Cheesecake", price: 160, description: "Light and fluffy cotton cheesecake slice" },
        { name: "Tamagoyaki", price: 120, description: "Japanese rolled omelette, lightly sweet" }
      ]},
      { category: "Mains", items: [
        { name: "Katsu Sando", price: 340, description: "Crispy pork katsu on milk bread with tonkatsu sauce" },
        { name: "Teriyaki Chicken Rice", price: 320, description: "Glazed chicken over steamed Japanese rice" }
      ]},
      { category: "Drinks", items: [
        { name: "UCC Drip Coffee", price: 120, description: "Premium Japanese blend, hot or iced" },
        { name: "Hojicha Latte", price: 160, description: "Roasted green tea with steamed milk" },
        { name: "Yuzu Soda", price: 150, description: "Fresh yuzu citrus with sparkling water" }
      ]},
      { category: "Desserts", items: [
        { name: "Parfait", price: 220, description: "Layered matcha and red bean parfait with mochi" }
      ]}
    ],
    photos: { food: ["img/hero_food.png"], drinks: ["img/restaurant_cards.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Morning Brew", description: "Coffee + pastry combo for ₱200 until 11AM!", valid: "Daily until 11AM" }
  },
  {
    id: 10,
    name: "Vikings Luxury Buffet",
    cuisine: "International Buffet",
    description: "Premium all-you-can-eat buffet with 200+ live cooking stations spanning Filipino, Asian, and Western cuisine.",
    lat: 14.6365, lng: 121.0355,
    rating: 4.3, reviews: 892, priceRange: 4,
    ambiance: ["family"],
    dietary: ["halal", "vegetarian", "vegan"],
    hours: { open: "11:00", close: "22:00" },
    waitTime: "packed",
    phone: "+63 2 8354 9012",
    address: "Scout Tuason, Tomas Morato Ave, QC",
    imgColor: "#1A0A20",
    imgPattern: "buffet",
    menu: [
      { category: "Starters", items: [
        { name: "Salad Bar", price: 0, description: "12 varieties of salads, cold cuts, and antipasti" },
        { name: "Sushi Station", price: 0, description: "Live sushi and sashimi rolling station" }
      ]},
      { category: "Mains", items: [
        { name: "Roast Leg of Lamb", price: 0, description: "Slow-roasted with garlic and rosemary jus" },
        { name: "Seafood on Ice", price: 0, description: "Prawns, crabs, oysters, mussels, and more" },
        { name: "Lechon Station", price: 0, description: "Whole roasted pig carved tableside" }
      ]},
      { category: "Drinks", items: [
        { name: "Free-Flow Juices", price: 0, description: "8 varieties of fresh juices" },
        { name: "Soft Drinks", price: 0, description: "Included in buffet price" }
      ]},
      { category: "Desserts", items: [
        { name: "Dessert Island", price: 0, description: "100+ dessert options, ice cream, cakes, pastries" }
      ]}
    ],
    photos: { food: ["img/restaurant_cards.png"], drinks: ["img/hero_food.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Lunch Set", description: "₱1,499 lunch buffet (Mon–Fri). Dinner ₱1,899. Kids under 4 eat free!", valid: "Always" }
  },
  {
    id: 11,
    name: "Serenitea",
    cuisine: "Milk Tea / Café",
    description: "Premium milk tea and tea-based beverages crafted with real brewed tea and fresh toppings.",
    lat: 14.6310, lng: 121.0325,
    rating: 4.4, reviews: 621, priceRange: 1,
    ambiance: ["study-friendly", "family"],
    dietary: ["vegetarian", "vegan"],
    hours: { open: "09:00", close: "23:00" },
    waitTime: "none",
    phone: "+63 2 8928 7890",
    address: "Tomas Morato Ave corner Scout Tobias, QC",
    imgColor: "#1A1A0A",
    imgPattern: "milk-tea",
    menu: [
      { category: "Starters", items: [
        { name: "French Fries", price: 120, description: "Classic salted fries with cheese dip" }
      ]},
      { category: "Mains", items: [
        { name: "Tuna Sandwich", price: 180, description: "Tuna salad on toasted white bread" }
      ]},
      { category: "Drinks", items: [
        { name: "Winter Melon Milk Tea", price: 140, description: "Signature winter melon with pearl jelly" },
        { name: "Wintermelon Yakult", price: 155, description: "Winter melon base with Yakult and lychee" },
        { name: "Taro Milk Tea", price: 140, description: "Creamy purple taro with tapioca pearls" },
        { name: "Matcha Red Bean", price: 150, description: "Premium matcha with azuki bean and milk" }
      ]},
      { category: "Desserts", items: [
        { name: "Mochi Waffles", price: 160, description: "Chewy rice flour waffles with ice cream" }
      ]}
    ],
    photos: { food: ["img/hero_food.png"], drinks: ["img/restaurant_cards.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Bogo Hour", description: "Buy 1 Get 1 on all large drinks 2–5PM!", valid: "Weekdays 2PM–5PM" }
  },
  {
    id: 12,
    name: "Lola Café",
    cuisine: "Filipino Comfort",
    description: "Your neighborhood comfort food haven. Lola's recipes brought to life with modern presentation.",
    lat: 14.6345, lng: 121.0360,
    rating: 4.3, reviews: 145, priceRange: 1,
    ambiance: ["family", "study-friendly"],
    dietary: ["vegetarian"],
    hours: { open: "07:00", close: "21:00" },
    waitTime: "none",
    phone: "+63 2 8374 3456",
    address: "Scout Rallos, Tomas Morato Ave, QC",
    imgColor: "#2A1A00",
    imgPattern: "comfort",
    menu: [
      { category: "Starters", items: [
        { name: "Pandesal & Kesong Puti", price: 80, description: "Fresh pandesal rolls with white cheese" }
      ]},
      { category: "Mains", items: [
        { name: "Sinigang na Baboy", price: 220, description: "Sour tamarind soup with tender pork and vegetables" },
        { name: "Adobo sa Gata", price: 200, description: "Chicken adobo with coconut milk, creamy and rich" },
        { name: "Tinolang Manok", price: 190, description: "Ginger-based chicken soup with papaya and moringa" }
      ]},
      { category: "Drinks", items: [
        { name: "Kapeng Barako", price: 80, description: "Strong Philippine liberica coffee" },
        { name: "Dalandan Juice", price: 80, description: "Fresh squeezed orange" }
      ]},
      { category: "Desserts", items: [
        { name: "Puto Bumbong", price: 80, description: "Purple sticky rice with coconut and sugar" },
        { name: "Saging con Yelo", price: 90, description: "Banana in sweet cream with shaved ice" }
      ]}
    ],
    photos: { food: ["img/restaurant_cards.png"], drinks: ["img/hero_food.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Almusal Special", description: "Breakfast tapa set ₱150 with free coffee before 9AM!", valid: "Daily until 9AM" }
  },
  {
    id: 13,
    name: "Vitorrio's",
    cuisine: "Italian",
    description: "Family-style Italian trattoria with wood-fired pastas, antipasti, and imported Italian wines.",
    lat: 14.6355, lng: 121.0315,
    rating: 4.5, reviews: 213, priceRange: 3,
    ambiance: ["date-night", "family"],
    dietary: ["vegetarian"],
    hours: { open: "12:00", close: "22:00" },
    waitTime: "15-30",
    phone: "+63 2 8352 3456",
    address: "Scout Tuazon, Tomas Morato Ave, QC",
    imgColor: "#1C0A00",
    imgPattern: "trattoria",
    menu: [
      { category: "Starters", items: [
        { name: "Bruschetta Trio", price: 280, description: "Three varieties: tomato basil, mushroom, nduja" },
        { name: "Antipasto Platter", price: 480, description: "Cured meats, artisanal cheeses, olives, and pickles" }
      ]},
      { category: "Mains", items: [
        { name: "Cacio e Pepe", price: 480, description: "Classic Roman pasta with pecorino and black pepper" },
        { name: "Osso Buco", price: 780, description: "Braised veal shank with saffron risotto Milanese" },
        { name: "Pasta al Pomodoro", price: 380, description: "Spaghetti in slow-cooked San Marzano tomato sauce" }
      ]},
      { category: "Drinks", items: [
        { name: "Barolo", price: 480, description: "Glass of the King of Italian reds" },
        { name: "Prosecco", price: 320, description: "Chilled Italian sparkling wine" }
      ]},
      { category: "Desserts", items: [
        { name: "Cannoli", price: 220, description: "Crispy pastry tubes with sweetened ricotta and pistachios" }
      ]}
    ],
    photos: { food: ["img/hero_food.png"], drinks: ["img/restaurant_cards.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Pasta Night", description: "All pasta dishes ₱100 off every Wednesday!", valid: "Every Wednesday" }
  },
  {
    id: 14,
    name: "Napoli Pizza & Pasta",
    cuisine: "Pizza / Italian",
    description: "Casual Italian spot famous for its thin-crust pizzas and generous pasta portions.",
    lat: 14.6315, lng: 121.0350,
    rating: 4.2, reviews: 289, priceRange: 2,
    ambiance: ["family", "study-friendly"],
    dietary: ["vegetarian"],
    hours: { open: "11:00", close: "22:00" },
    waitTime: "none",
    phone: "+63 2 8928 1234",
    address: "Scout Limbaga, Tomas Morato Ave, QC",
    imgColor: "#3A0A00",
    imgPattern: "pizza",
    menu: [
      { category: "Starters", items: [
        { name: "Garlic Bread", price: 120, description: "Toasted focaccia with garlic butter and herbs" },
        { name: "Minestrone Soup", price: 160, description: "Chunky Italian vegetable soup" }
      ]},
      { category: "Mains", items: [
        { name: "Quattro Formaggi", price: 520, description: "Four cheese pizza: mozzarella, gorgonzola, fontina, parmesan" },
        { name: "Diavola", price: 480, description: "Spicy salami, tomato, mozzarella, chili flakes" },
        { name: "Spaghetti Carbonara", price: 380, description: "Classic guanciale, eggs, pecorino, black pepper" },
        { name: "Lasagna Bolognese", price: 420, description: "Layered pasta with slow-cooked beef ragu and béchamel" }
      ]},
      { category: "Drinks", items: [
        { name: "Italian Soda", price: 120, description: "San Pellegrino Limonata or Aranciata" },
        { name: "House Wine", price: 200, description: "Glass of Chianti" }
      ]},
      { category: "Desserts", items: [
        { name: "Gelato", price: 160, description: "Two scoops: pistachio, stracciatella, or lemon" }
      ]}
    ],
    photos: { food: ["img/restaurant_cards.png"], drinks: ["img/hero_food.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Pizza & Pasta Duo", description: "Any pizza + any pasta for ₱850. Great value!", valid: "Mon–Fri only" }
  },
  {
    id: 15,
    name: "Crustasia",
    cuisine: "Seafood",
    description: "Southeast Asian-style seafood boil with premium shellfish, bold spice blends, and communal dining.",
    lat: 14.6375, lng: 121.0340,
    rating: 4.6, reviews: 378, priceRange: 3,
    ambiance: ["family", "date-night"],
    dietary: ["halal", "gluten-free"],
    hours: { open: "11:00", close: "22:00" },
    waitTime: "15-30",
    phone: "+63 2 8354 5678",
    address: "Scout Castor, Tomas Morato Ave, QC",
    imgColor: "#0A1A2A",
    imgPattern: "seafood",
    menu: [
      { category: "Starters", items: [
        { name: "Garlic Butter Clams", price: 280, description: "Surf clams in white wine and garlic butter" },
        { name: "Calamari Rings", price: 240, description: "Crispy fried squid with sriracha mayo" }
      ]},
      { category: "Mains", items: [
        { name: "Seafood Boil Bag (S)", price: 680, description: "Shrimp, crab, mussels, corn, potato in your chosen sauce" },
        { name: "King Crab Leg", price: 1800, description: "Giant Alaskan king crab, steamed or grilled, per 500g" },
        { name: "Lobster Thermidor", price: 1400, description: "Half lobster with creamy cognac sauce, gratinated" },
        { name: "Spicy Mantis Shrimp", price: 780, description: "Whole mantis shrimp in chili garlic sauce" }
      ]},
      { category: "Drinks", items: [
        { name: "Mango Shake", price: 150, description: "Fresh Philippine Carabao mango blend" },
        { name: "Blue Lagoon Mocktail", price: 160, description: "Blue curacao syrup, lemonade, soda" },
        { name: "San Miguel Light", price: 100, description: "Cold light beer" }
      ]},
      { category: "Desserts", items: [
        { name: "Mango Float", price: 180, description: "Layers of graham, cream, and Philippine mango" },
        { name: "Buko Pie", price: 160, description: "Classic young coconut pie from Laguna" }
      ]}
    ],
    photos: { food: ["img/hero_food.png"], drinks: ["img/restaurant_cards.png"], ambiance: ["img/hero_bg.png"] },
    dailySpecial: { title: "Catch of the Day", description: "Fresh catch 20% off! Check with staff for today's selection.", valid: "While stocks last" }
  }
];

// Helper to compute open status
function isOpenNow(hours) {
  const now = new Date();
  const [oh, om] = hours.open.split(':').map(Number);
  const [ch, cm] = hours.close.split(':').map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  return current >= open && current <= close;
}

// Helper to compute distance between two lat/lng points (Haversine)
function computeDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Format distance
function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Price range to symbols
function priceSymbol(range) {
  return '₱'.repeat(range);
}

// Wait time labels
const WAIT_LABELS = {
  'none': { label: 'No Wait', color: '#22c55e', icon: '✓' },
  '15-30': { label: '15–30 min', color: '#f59e0b', icon: '⏱' },
  'packed': { label: 'Packed', color: '#ef4444', icon: '⚠' }
};

// Ambiance labels
const AMBIANCE_LABELS = {
  'date-night': '💕 Date Night',
  'family': '👨‍👩‍👧 Family',
  'study-friendly': '💻 Study-Friendly',
  'pet-friendly': '🐾 Pet-Friendly'
};

// Dietary labels
const DIETARY_LABELS = {
  'vegan': '🌱 Vegan',
  'vegetarian': '🥦 Vegetarian',
  'halal': '☪️ Halal',
  'gluten-free': '🌾 Gluten-Free'
};
