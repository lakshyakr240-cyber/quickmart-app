(function (window) {
  "use strict";

  var STATE_KEY = "quickmart_state_v1";
  var CART_KEY = "quickmart_cart_v1";
  var CUSTOMER_SESSION_KEY = "quickmart_customer_session_v1";
  var ROLE_SESSION_KEY_PREFIX = "quickmart_role_session_";
  var OTP_KEY = "quickmart_pending_otp_v1";

  var ORDER_STEPS = [
    "Order Placed",
    "Accepted",
    "Preparing",
    "Ready for Pickup",
    "Out for Delivery",
    "Delivered"
  ];

  var BASE_CATEGORY_NAMES = [
    "Grocery",
    "Vegetables",
    "Fruits",
    "Dairy",
    "Medicines",
    "Essentials",
    "Vegetables & Fruits",
    "Atta, Rice & Dal",
    "Oil, Ghee & Masala",
    "Dairy, Bread & Eggs",
    "Bakery & Biscuits",
    "Dry Fruits & Cereals",
    "Chicken, Meat & Fish",
    "Kitchenware & Appliances",
    "Chips & Namkeen",
    "Sweets & Chocolates",
    "Drinks & Juices",
    "Tea, Coffee & More",
    "Instant Food",
    "Sauces & Spreads",
    "Paan Corner",
    "Ice Creams",
    "Home & Lifestyle",
    "Cleaners & Repellents",
    "Electronics",
    "Stationery & Games",
    "Hygiene",
    "Pharma",
    "Wellness"
  ];

  var BASE_PRODUCTS = [
    { name: "Aashirvaad Atta", weight: "5 kg", categoryName: "Atta, Rice & Dal", price: 245, color: "#fde68a" },
    { name: "Toor Dal", weight: "1 kg", categoryName: "Atta, Rice & Dal", price: 128, color: "#fca5a5" },
    { name: "Fortune Sunflower Oil", weight: "1 L", categoryName: "Grocery", price: 165, color: "#fde68a" },
    { name: "Potato", weight: "1 kg", categoryName: "Vegetables & Fruits", price: 32, color: "#bbf7d0" },
    { name: "Tomato", weight: "500 g", categoryName: "Vegetables & Fruits", price: 24, color: "#fecaca" },
    { name: "Banana", weight: "6 pcs", categoryName: "Vegetables & Fruits", price: 48, color: "#fef08a" },
    { name: "Apple", weight: "1 kg", categoryName: "Vegetables & Fruits", price: 140, color: "#fee2e2" },
    { name: "Amul Milk", weight: "1 L", categoryName: "Dairy, Bread & Eggs", price: 62, color: "#bfdbfe" },
    { name: "Paneer", weight: "200 g", categoryName: "Dairy, Bread & Eggs", price: 92, color: "#e9d5ff" },
    { name: "Paracetamol", weight: "10 tablets", categoryName: "Medicines", price: 35, color: "#bae6fd" },
    { name: "Dettol Handwash", weight: "250 ml", categoryName: "Hygiene", price: 78, color: "#a7f3d0" },
    { name: "Surf Excel", weight: "1 kg", categoryName: "Cleaners & Repellents", price: 112, color: "#ddd6fe" },
    { name: "Eggs", weight: "6 pcs", categoryName: "Dairy, Bread & Eggs", price: 42, color: "#fde68a" },
    { name: "Lays Classic", weight: "52 g", categoryName: "Chips & Namkeen", price: 20, color: "#fef3c7" },
    { name: "Cadbury Dairy Milk Silk", weight: "60 g", categoryName: "Sweets & Chocolates", price: 95, color: "#fbcfe8" },
    { name: "Real Mango Juice", weight: "1 L", categoryName: "Drinks & Juices", price: 110, color: "#bfdbfe" },
    { name: "Nescafe Classic", weight: "50 g", categoryName: "Tea, Coffee & More", price: 145, color: "#d9f99d" },
    { name: "Kissan Tomato Ketchup", weight: "500 g", categoryName: "Sauces & Spreads", price: 120, color: "#fee2e2" },
    { name: "Amul Vanilla Ice Cream", weight: "750 ml", categoryName: "Ice Creams", price: 190, color: "#c7d2fe" },
    { name: "Harpic Cleaner", weight: "500 ml", categoryName: "Cleaners & Repellents", price: 98, color: "#a7f3d0" },
    { name: "UNO Cards", weight: "1 pack", categoryName: "Stationery & Games", price: 65, color: "#bfdbfe" },
    { name: "Vitamin C Tablets", weight: "20 tablets", categoryName: "Wellness", price: 149, color: "#bae6fd" }
  ];

  function nowISO() {
    return new Date().toISOString();
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function fmt(n) {
    return "\u20B9" + Number(n || 0).toFixed(0);
  }

  function num(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeDigits(raw) {
    return String(raw || "")
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
      .replace(/[\u0966-\u096F]/g, function (d) { return String(d.charCodeAt(0) - 0x0966); })
      .replace(/[\uFF10-\uFF19]/g, function (d) { return String(d.charCodeAt(0) - 0xFF10); });
  }

  function digitsOnly(raw) {
    return normalizeDigits(raw).replace(/\D/g, "");
  }

  function normalizePhone(raw) {
    var onlyDigits = digitsOnly(raw);
    if (onlyDigits.length > 10) {
      return onlyDigits.slice(-10);
    }
    return onlyDigits;
  }

  function normalizePin(raw) {
    return digitsOnly(raw).slice(0, 6);
  }

  function productIcon(label) {
    var n = String(label || "").toLowerCase();
    if (n.includes("atta")) return "ATTA";
    if (n.includes("dal")) return "DAL";
    if (n.includes("potato")) return "POT";
    if (n.includes("tomato")) return "TOM";
    if (n.includes("banana")) return "BAN";
    if (n.includes("apple")) return "APL";
    if (n.includes("milk")) return "MLK";
    if (n.includes("paneer")) return "PNR";
    if (n.includes("paracetamol")) return "MED";
    if (n.includes("handwash")) return "HND";
    if (n.includes("surf")) return "SRF";
    if (n.includes("egg")) return "EGG";
    return "PRD";
  }

  function placeholder(label, color) {
    var icon = productIcon(label);
    var cleanLabel = String(label || "").replace(/[<>]/g, "").slice(0, 22);
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'>" +
      "<defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='" +
      color +
      "'/><stop offset='100%' stop-color='#ffffff'/></linearGradient></defs>" +
      "<rect width='320' height='200' rx='18' fill='url(#g)'/>" +
      "<rect x='14' y='14' width='78' height='78' rx='12' fill='rgba(255,255,255,0.65)'/>" +
      "<text x='53' y='62' text-anchor='middle' font-size='24' font-family='Arial,sans-serif' font-weight='700' fill='#1f2937'>" +
      icon +
      "</text>" +
      "<text x='18' y='132' font-size='27' font-family='Arial,sans-serif' font-weight='700' fill='#1f2937'>" +
      cleanLabel +
      "</text>" +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function baseCategories() {
    return BASE_CATEGORY_NAMES.map(function (name, index) {
      return { id: index + 1, name: name };
    });
  }

  function categoryIdByName(s, name) {
    var target = normalizedCategoryName(name);
    if (!target) {
      return null;
    }
    var category = s.categories.find(function (item) {
      return normalizedCategoryName(item && item.name) === target;
    });
    return category ? num(category.id, 0) : null;
  }

  function baseProductsFromState(s) {
    return BASE_PRODUCTS.map(function (template, index) {
      var categoryId = categoryIdByName(s, template.categoryName) || 1;
      return {
        id: index + 1,
        name: template.name,
        weight: template.weight,
        categoryId: categoryId,
        price: template.price,
        image: placeholder(template.name, template.color),
        inStock: template.inStock !== false
      };
    });
  }

  function normalizedCategoryName(name) {
    return String(name || "").trim().toLowerCase();
  }

  function ensureBaseCategories(s) {
    var changed = false;
    var namesSeen = {};

    s.categories = s.categories
      .map(function (category) {
        return {
          id: num(category && category.id, 0),
          name: String((category && category.name) || "").trim()
        };
      })
      .filter(function (category) {
        return category.id > 0 && !!category.name;
      });

    s.categories.forEach(function (category) {
      namesSeen[normalizedCategoryName(category.name)] = true;
    });

    BASE_CATEGORY_NAMES.forEach(function (name) {
      var normalized = normalizedCategoryName(name);
      if (namesSeen[normalized]) {
        return;
      }
      s.categories.push({ id: s.nextIds.category++, name: name });
      namesSeen[normalized] = true;
      changed = true;
    });

    var maxCategoryId = s.categories.reduce(function (maxId, category) {
      return Math.max(maxId, num(category.id, 0));
    }, 0);

    if (s.nextIds.category <= maxCategoryId) {
      s.nextIds.category = maxCategoryId + 1;
      changed = true;
    }

    return changed;
  }

  function ensureBaseProducts(s) {
    var changed = false;
    var existingByName = {};

    s.products = s.products
      .map(function (product) {
        var normalizedName = String((product && product.name) || "").trim();
        return {
          id: num(product && product.id, 0),
          name: normalizedName,
          weight: String((product && product.weight) || "").trim(),
          categoryId: num(product && product.categoryId, 0),
          price: num(product && product.price, 0),
          image: String((product && product.image) || "").trim(),
          inStock: product && product.inStock !== false
        };
      })
      .filter(function (product) {
        return product.id > 0 && !!product.name && !!product.weight && product.price > 0;
      });

    s.products.forEach(function (product) {
      existingByName[normalizedCategoryName(product.name)] = product;
    });

    BASE_PRODUCTS.forEach(function (template) {
      var key = normalizedCategoryName(template.name);
      var categoryId = categoryIdByName(s, template.categoryName) || 1;
      var existing = existingByName[key];

      if (existing) {
        if (existing.categoryId !== categoryId) {
          existing.categoryId = categoryId;
          changed = true;
        }
        if (!String(existing.image || "").trim()) {
          existing.image = placeholder(template.name, template.color);
          changed = true;
        }
        return;
      }
      s.products.push({
        id: s.nextIds.product++,
        name: template.name,
        weight: template.weight,
        categoryId: categoryId,
        price: template.price,
        image: placeholder(template.name, template.color),
        inStock: template.inStock !== false
      });
      existingByName[key] = s.products[s.products.length - 1];
      changed = true;
    });

    var maxProductId = s.products.reduce(function (maxId, product) {
      return Math.max(maxId, num(product.id, 0));
    }, 0);

    if (s.nextIds.product <= maxProductId) {
      s.nextIds.product = maxProductId + 1;
      changed = true;
    }

    return changed;
  }

  function defaults() {
    return {
      createdAt: nowISO(),
      updatedAt: nowISO(),
      settings: {
        minOrderValue: 100,
        deliveryFee: 15,
        freeDeliveryThreshold: 300,
        otpMode: "demo",
        otpWebhookUrl: ""
      },
      categories: baseCategories(),
      products: baseProductsFromState({ categories: baseCategories() }),
      users: [],
      vendors: [
        { id: 1, name: "QuickMart Main Vendor", phone: "9001001001", pin: "1111", isActive: true },
        { id: 2, name: "QuickMart Backup Vendor", phone: "9001001002", pin: "2222", isActive: true }
      ],
      deliveryPartners: [
        { id: 1, name: "Ravi Kumar", phone: "9111100011", pin: "3333", isActive: true },
        { id: 2, name: "Aman Singh", phone: "9111100022", pin: "4444", isActive: true }
      ],
      admins: [
        { id: 1, name: "QuickMart Admin", email: "admin@quickmart.in", password: "admin123", isActive: true }
      ],
      orders: [],
      nextIds: { category: BASE_CATEGORY_NAMES.length + 1, product: BASE_PRODUCTS.length + 1, order: 1, user: 1, vendor: 3, deliveryPartner: 3 }
    };
  }

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function addTimeline(order, status, at) {
    order.timeline = order.timeline || [];
    if (!order.timeline.some(function (t) { return t.status === status; })) {
      order.timeline.push({ status: status, at: at || nowISO() });
      return true;
    }
    return false;
  }

  function normalizeUserShape(user) {
    user.name = String(user.name || "").trim();
    if (!user.name) {
      user.name = "QuickMart Customer";
    }
    user.phone = normalizePhone(user.phone);
    user.totalOrders = num(user.totalOrders, 0);
    user.createdAt = user.createdAt || nowISO();
    user.lastOrderAt = user.lastOrderAt || null;
    user.isActive = user.isActive !== false;
    user.addresses = Array.isArray(user.addresses) ? user.addresses : [];
    user.defaultAddressId = user.defaultAddressId || null;
    user.preferences = Object.assign(
      {
        language: "en",
        lowDataMode: true,
        orderAlerts: true,
        whatsappAlerts: false,
        defaultPaymentMethod: "COD",
        contactlessDelivery: false,
        deliveryNote: "",
        autoOpenCartAfterAdd: true
      },
      user.preferences || {}
    );
  }

  function ensureBaselineOperators(s) {
    var changed = false;
    var deliveryDefaults = [
      { phone: "9111100011", name: "Ravi Kumar", pin: "3333" },
      { phone: "9111100022", name: "Aman Singh", pin: "4444" }
    ];
    var vendorDefaults = [
      { phone: "9001001001", name: "QuickMart Main Vendor", pin: "1111" },
      { phone: "9001001002", name: "QuickMart Backup Vendor", pin: "2222" }
    ];

    deliveryDefaults.forEach(function (entry) {
      var existing = s.deliveryPartners.find(function (partner) {
        return normalizePhone(partner.phone) === entry.phone;
      });
      if (!existing) {
        s.deliveryPartners.push({
          id: s.nextIds.deliveryPartner++,
          name: entry.name,
          phone: entry.phone,
          pin: entry.pin,
          isActive: true
        });
        changed = true;
        return;
      }
      if (normalizePin(existing.pin) !== entry.pin || existing.isActive === false) {
        existing.pin = entry.pin;
        existing.isActive = true;
        if (!String(existing.name || "").trim()) {
          existing.name = entry.name;
        }
        changed = true;
      }
    });

    vendorDefaults.forEach(function (entry) {
      var existing = s.vendors.find(function (vendor) {
        return normalizePhone(vendor.phone) === entry.phone;
      });
      if (!existing) {
        s.vendors.push({
          id: s.nextIds.vendor++,
          name: entry.name,
          phone: entry.phone,
          pin: entry.pin,
          isActive: true
        });
        changed = true;
        return;
      }
      if (normalizePin(existing.pin) !== entry.pin || existing.isActive === false) {
        existing.pin = entry.pin;
        existing.isActive = true;
        if (!String(existing.name || "").trim()) {
          existing.name = entry.name;
        }
        changed = true;
      }
    });

    var maxDeliveryId = s.deliveryPartners.reduce(function (maxId, partner) {
      return Math.max(maxId, num(partner.id, 0));
    }, 0);
    if (s.nextIds.deliveryPartner <= maxDeliveryId) {
      s.nextIds.deliveryPartner = maxDeliveryId + 1;
      changed = true;
    }

    var maxVendorId = s.vendors.reduce(function (maxId, vendor) {
      return Math.max(maxId, num(vendor.id, 0));
    }, 0);
    if (s.nextIds.vendor <= maxVendorId) {
      s.nextIds.vendor = maxVendorId + 1;
      changed = true;
    }

    return changed;
  }

  function advanceOrder(order, nowMs) {
    var changed = false;
    if (order.status === "Accepted" && order.acceptedAt && nowMs - new Date(order.acceptedAt).getTime() >= 120000) {
      order.status = "Preparing";
      order.preparingAt = nowISO();
      addTimeline(order, "Preparing", order.preparingAt);
      changed = true;
    }
    if (order.status === "Preparing" && order.preparingAt && nowMs - new Date(order.preparingAt).getTime() >= 180000) {
      order.status = "Ready for Pickup";
      order.readyForPickupAt = nowISO();
      addTimeline(order, "Ready for Pickup", order.readyForPickupAt);
      changed = true;
    }
    return changed;
  }

  function ensureShape(s) {
    var changed = false;
    var defaultSettings = { minOrderValue: 100, deliveryFee: 15, freeDeliveryThreshold: 300, otpMode: "demo", otpWebhookUrl: "" };
    if (!s.settings || typeof s.settings !== "object") {
      s.settings = {};
      changed = true;
    }
    s.settings = Object.assign(defaultSettings, s.settings);
    if (!Array.isArray(s.categories)) {
      s.categories = [];
      changed = true;
    }
    if (!Array.isArray(s.products)) {
      s.products = [];
      changed = true;
    }
    if (!Array.isArray(s.users)) {
      s.users = [];
      changed = true;
    }
    if (!Array.isArray(s.vendors)) {
      s.vendors = [];
      changed = true;
    }
    if (!Array.isArray(s.deliveryPartners)) {
      s.deliveryPartners = [];
      changed = true;
    }
    if (!Array.isArray(s.admins)) {
      s.admins = [];
      changed = true;
    }
    if (!Array.isArray(s.orders)) {
      s.orders = [];
      changed = true;
    }
    if (!s.nextIds || typeof s.nextIds !== "object") {
      s.nextIds = {};
      changed = true;
    }
    s.nextIds = Object.assign({ category: 1, product: 1, order: 1, user: 1, vendor: 1, deliveryPartner: 1 }, s.nextIds || {});
    changed = ensureBaseCategories(s) || changed;
    changed = ensureBaseProducts(s) || changed;
    changed = ensureBaselineOperators(s) || changed;
    s.users.forEach(normalizeUserShape);
    return changed;
  }

  function stateInternal() {
    var s = readJSON(STATE_KEY, null);
    if (!s) {
      s = defaults();
      writeJSON(STATE_KEY, s);
      return s;
    }
    var changed = ensureShape(s);
    var seedColors = ["#fde68a", "#fca5a5", "#bbf7d0", "#fecaca", "#fef08a", "#fee2e2", "#bfdbfe", "#e9d5ff", "#bae6fd", "#a7f3d0", "#ddd6fe", "#fde68a"];
    s.products.forEach(function (product, idx) {
      if (product.id <= 12 && String(product.image || "").indexOf("data:image/svg+xml") === 0) {
        var nextImage = placeholder(product.name, seedColors[idx % seedColors.length]);
        if (product.image !== nextImage) {
          product.image = nextImage;
          changed = true;
        }
      }
    });
    var nowMs = Date.now();
    s.orders.forEach(function (o) {
      changed = advanceOrder(o, nowMs) || changed;
    });
    if (changed) {
      s.updatedAt = nowISO();
      writeJSON(STATE_KEY, s);
    }
    return s;
  }

  function getState() {
    return clone(stateInternal());
  }

  function updateState(mutator) {
    var s = stateInternal();
    var result = mutator(s);
    s.updatedAt = nowISO();
    writeJSON(STATE_KEY, s);
    return result;
  }

  function getCart() {
    var cart = readJSON(CART_KEY, []);
    return Array.isArray(cart) ? cart : [];
  }

  function setCart(cart) {
    writeJSON(CART_KEY, Array.isArray(cart) ? cart : []);
  }

  function addToCart(productId) {
    var cart = getCart();
    var item = cart.find(function (x) { return x.productId === productId; });
    if (item) item.qty += 1;
    else cart.push({ productId: productId, qty: 1 });
    setCart(cart);
    return clone(cart);
  }

  function updateCartItem(productId, qty) {
    var cart = getCart();
    var item = cart.find(function (x) { return x.productId === productId; });
    if (!item) return clone(cart);
    if (qty <= 0) cart = cart.filter(function (x) { return x.productId !== productId; });
    else item.qty = qty;
    setCart(cart);
    return clone(cart);
  }

  function clearCart() {
    setCart([]);
  }

  function getCustomerSession() {
    return readJSON(CUSTOMER_SESSION_KEY, null);
  }

  function setCustomerSession(session) {
    writeJSON(CUSTOMER_SESSION_KEY, session || null);
  }

  function clearCustomerSession() {
    window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  }

  function createOtp(phone) {
    var cleanPhone = normalizePhone(phone);
    if (cleanPhone.length !== 10) {
      return "";
    }
    var otp = String(Math.floor(100000 + Math.random() * 900000));
    writeJSON(OTP_KEY, { phone: cleanPhone, code: otp, expiresAt: Date.now() + 300000 });
    return otp;
  }

  function requestOtp(phone) {
    var cleanPhone = normalizePhone(phone);
    if (cleanPhone.length !== 10) {
      return Promise.resolve({ ok: false, message: "Enter a valid 10-digit mobile number." });
    }

    var otp = createOtp(cleanPhone);
    if (!otp) {
      return Promise.resolve({ ok: false, message: "Unable to generate OTP." });
    }

    var settings = getSettings();
    var webhookUrl = String(settings.otpWebhookUrl || "").trim();
    var otpMode = String(settings.otpMode || "demo").toLowerCase();

    if (otpMode !== "webhook" || !webhookUrl) {
      return Promise.resolve({
        ok: true,
        mode: "demo",
        demoOtp: otp,
        message: "Demo OTP generated."
      });
    }

    return fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile: cleanPhone,
        otp: otp,
        app: "QuickMart",
        city: "Sasaram"
      })
    }).then(
      function (response) {
        if (!response.ok) {
          throw new Error("OTP provider returned " + response.status);
        }
        return { ok: true, mode: "webhook", message: "OTP sent to mobile number." };
      },
      function () {
        return {
          ok: false,
          mode: "webhook",
          message: "OTP SMS send failed. Check OTP webhook URL/settings."
        };
      }
    );
  }

  function verifyOtp(phone, code) {
    var pending = readJSON(OTP_KEY, null);
    if (!pending) return { ok: false, message: "Please request OTP first." };
    if (Date.now() > pending.expiresAt) {
      window.localStorage.removeItem(OTP_KEY);
      return { ok: false, message: "OTP expired. Request again." };
    }
    if (pending.phone !== normalizePhone(phone)) return { ok: false, message: "Phone mismatch." };
    if (pending.code !== digitsOnly(code).slice(0, 6)) return { ok: false, message: "Invalid OTP." };
    var session = { phone: pending.phone, verified: true, verifiedAt: nowISO() };
    setCustomerSession(session);
    updateState(function (s) {
      ensureUser(s, pending.phone);
      return true;
    });
    window.localStorage.removeItem(OTP_KEY);
    return { ok: true, session: clone(session) };
  }

  function roleSession(role) {
    return readJSON(ROLE_SESSION_KEY_PREFIX + role, null);
  }

  function setRoleSession(role, session) {
    writeJSON(ROLE_SESSION_KEY_PREFIX + role, session || null);
  }

  function clearRoleSession(role) {
    window.localStorage.removeItem(ROLE_SESSION_KEY_PREFIX + role);
  }

  function loginAdmin(email, password) {
    var s = stateInternal();
    var user = s.admins.find(function (a) {
      return a.isActive && a.email.toLowerCase() === String(email || "").trim().toLowerCase() && a.password === String(password || "").trim();
    });
    if (!user) return { ok: false, message: "Invalid admin credentials." };
    var session = { id: user.id, name: user.name, email: user.email, role: "admin", loginAt: nowISO() };
    setRoleSession("admin", session);
    return { ok: true, session: clone(session) };
  }

  function loginVendor(phone, pin) {
    var s = stateInternal();
    var cleanPhone = normalizePhone(phone);
    var cleanPin = normalizePin(pin);
    var user = s.vendors.find(function (v) {
      return v.isActive && normalizePhone(v.phone) === cleanPhone && normalizePin(v.pin) === cleanPin;
    });
    var vendorDefaults = {
      "9001001001": { name: "QuickMart Main Vendor", pin: "1111" },
      "9001001002": { name: "QuickMart Backup Vendor", pin: "2222" }
    };
    var fallbackVendor = vendorDefaults[cleanPhone];
    if (!user && fallbackVendor && cleanPin === fallbackVendor.pin) {
      user = updateState(function (state) {
        var existing = state.vendors.find(function (v) { return normalizePhone(v.phone) === cleanPhone; });
        if (!existing) {
          existing = {
            id: state.nextIds.vendor++,
            name: fallbackVendor.name,
            phone: cleanPhone,
            pin: fallbackVendor.pin,
            isActive: true
          };
          state.vendors.push(existing);
        }
        existing.isActive = true;
        existing.pin = fallbackVendor.pin;
        existing.name = existing.name || fallbackVendor.name;
        return clone(existing);
      });
    }
    if (!user) return { ok: false, message: "Invalid vendor credentials or account disabled. Demo: 9001001001 / 1111." };
    var session = { id: user.id, name: user.name, phone: user.phone, role: "vendor", loginAt: nowISO() };
    setRoleSession("vendor", session);
    return { ok: true, session: clone(session) };
  }

  function loginDelivery(phone, pin) {
    var s = stateInternal();
    var cleanPhone = normalizePhone(phone);
    var cleanPin = normalizePin(pin);
    var user = s.deliveryPartners.find(function (d) {
      return d.isActive && normalizePhone(d.phone) === cleanPhone && normalizePin(d.pin) === cleanPin;
    });
    var deliveryDefaults = {
      "9111100011": { name: "Ravi Kumar", pin: "3333" },
      "9111100022": { name: "Aman Singh", pin: "4444" }
    };
    var fallbackDelivery = deliveryDefaults[cleanPhone];
    if (!user && fallbackDelivery && cleanPin === fallbackDelivery.pin) {
      user = updateState(function (state) {
        var existing = state.deliveryPartners.find(function (d) { return normalizePhone(d.phone) === cleanPhone; });
        if (!existing) {
          existing = {
            id: state.nextIds.deliveryPartner++,
            name: fallbackDelivery.name,
            phone: cleanPhone,
            pin: fallbackDelivery.pin,
            isActive: true
          };
          state.deliveryPartners.push(existing);
        }
        existing.isActive = true;
        existing.pin = fallbackDelivery.pin;
        existing.name = existing.name || fallbackDelivery.name;
        return clone(existing);
      });
    }
    if (!user) return { ok: false, message: "Invalid delivery credentials. Demo: 9111100011 / 3333 or 9111100022 / 4444." };
    var session = { id: user.id, name: user.name, phone: user.phone, role: "delivery", loginAt: nowISO() };
    setRoleSession("delivery", session);
    return { ok: true, session: clone(session) };
  }

  function categoryMap(s) {
    var map = {};
    s.categories.forEach(function (c) { map[c.id] = c.name; });
    return map;
  }

  function productsWithCategory(s) {
    var cMap = categoryMap(s);
    return s.products.map(function (p) {
      return Object.assign({}, p, { categoryName: cMap[p.categoryId] || "Other" });
    });
  }

  function getProducts() {
    return clone(productsWithCategory(stateInternal()));
  }

  function getCategories() {
    return clone(stateInternal().categories);
  }

  function getSettings() {
    return clone(stateInternal().settings);
  }

  function deliverySummary(subtotal, settings) {
    var min = num(settings.minOrderValue, 100);
    var fee = num(settings.deliveryFee, 15);
    var freeAt = num(settings.freeDeliveryThreshold, 300);

    if (subtotal <= 0) return { deliveryFee: 0, canCheckout: false, progressMessage: "Add items to start your order." };
    if (subtotal < min) {
      return {
        deliveryFee: 0,
        canCheckout: false,
        progressMessage: "Minimum order is " + fmt(min) + ". Add " + fmt(min - subtotal) + " more to checkout."
      };
    }
    if (subtotal >= freeAt) return { deliveryFee: 0, canCheckout: true, progressMessage: "Free delivery unlocked." };
    return { deliveryFee: fee, canCheckout: true, progressMessage: "Add " + fmt(freeAt - subtotal) + " more for free delivery" };
  }

  function cartDetails() {
    var s = stateInternal();
    var cart = getCart();
    var byId = {};
    s.products.forEach(function (p) { byId[p.id] = p; });

    var items = cart.map(function (it) {
      var p = byId[it.productId];
      if (!p) return null;
      return {
        productId: p.id,
        name: p.name,
        weight: p.weight,
        image: p.image,
        inStock: p.inStock,
        price: p.price,
        qty: it.qty,
        lineTotal: p.price * it.qty
      };
    }).filter(Boolean);

    var subtotal = items.reduce(function (sum, it) { return sum + it.lineTotal; }, 0);
    var hasOutOfStock = items.some(function (it) { return !it.inStock; });
    var info = deliverySummary(subtotal, s.settings);

    if (hasOutOfStock) {
      return {
        items: items,
        subtotal: subtotal,
        deliveryFee: 0,
        total: subtotal,
        canCheckout: false,
        progressMessage: "Some items are out of stock. Remove them to continue."
      };
    }

    return {
      items: items,
      subtotal: subtotal,
      deliveryFee: info.deliveryFee,
      total: subtotal + info.deliveryFee,
      canCheckout: info.canCheckout,
      progressMessage: info.progressMessage
    };
  }

  function findUserByPhone(s, phone) {
    var cleanPhone = normalizePhone(phone);
    return s.users.find(function (u) { return normalizePhone(u.phone) === cleanPhone; }) || null;
  }

  function ensureUser(s, phone) {
    var cleanPhone = normalizePhone(phone);
    var user = findUserByPhone(s, cleanPhone);
    if (!user) {
      user = {
        id: s.nextIds.user++,
        phone: cleanPhone,
        name: "QuickMart Customer",
        totalOrders: 0,
        createdAt: nowISO(),
        lastOrderAt: null,
        isActive: true,
        addresses: [],
        defaultAddressId: null,
        preferences: {
          language: "en",
          lowDataMode: true,
          orderAlerts: true,
          whatsappAlerts: false,
          defaultPaymentMethod: "COD",
          contactlessDelivery: false,
          deliveryNote: "",
          autoOpenCartAfterAdd: true
        }
      };
      s.users.push(user);
    }
    normalizeUserShape(user);
    return user;
  }

  function createOrder(paymentMethod, extraDetails) {
    var customer = getCustomerSession();
    if (!customer || !customer.verified) return { ok: false, message: "Phone verification required." };
    var cleanCustomerPhone = normalizePhone(customer.phone);
    if (cleanCustomerPhone.length !== 10) return { ok: false, message: "Valid customer phone is required." };
    var safeExtra = extraDetails || {};

    return updateState(function (s) {
      var details = cartDetails();
      if (!details.items.length) return { ok: false, message: "Cart is empty." };
      if (!details.canCheckout) return { ok: false, message: details.progressMessage || ("Minimum order is " + fmt(s.settings.minOrderValue) + ".") };
      var existingUser = ensureUser(s, cleanCustomerPhone);
      if (existingUser && existingUser.isActive === false) {
        return { ok: false, message: "Your account is blocked. Contact QuickMart support." };
      }
      if (!existingUser.defaultAddressId) {
        return { ok: false, message: "Please add delivery address in Account before checkout." };
      }
      var selectedAddress = existingUser.addresses.find(function (addr) {
        return addr.id === existingUser.defaultAddressId;
      });
      if (!selectedAddress) {
        return { ok: false, message: "Please select a default delivery address in Account." };
      }

      var id = "ORD" + String(s.nextIds.order++).padStart(4, "0");
      var ts = nowISO();
      var method = paymentMethod === "ONLINE" ? "ONLINE" : "COD";
      var order = {
        id: id,
        customerPhone: cleanCustomerPhone,
        customerName: existingUser.name || "QuickMart Customer",
        deliveryAddress: clone(selectedAddress),
        items: details.items.map(function (i) { return { productId: i.productId, name: i.name, weight: i.weight, qty: i.qty, price: i.price, lineTotal: i.lineTotal }; }),
        subtotal: details.subtotal,
        deliveryFee: details.deliveryFee,
        total: details.total,
        paymentMethod: method,
        paymentStatus: method === "ONLINE" ? String(safeExtra.paymentStatus || "PENDING") : "COD_PENDING",
        paymentReference: String(safeExtra.paymentReference || ""),
        paymentProviderOrderId: String(safeExtra.paymentProviderOrderId || ""),
        deliveryNote: String(safeExtra.deliveryNote || "").slice(0, 140),
        contactlessDelivery: safeExtra.contactlessDelivery === true,
        status: "Order Placed",
        timeline: [{ status: "Order Placed", at: ts }],
        estimatedDeliveryMins: 20 + Math.floor(Math.random() * 11),
        estimatedDeliveryText: "20-30 minutes",
        assignedDeliveryPartnerId: null,
        createdAt: ts,
        updatedAt: ts
      };

      s.orders.unshift(order);
      existingUser.totalOrders += 1;
      existingUser.lastOrderAt = ts;
      clearCart();
      return { ok: true, order: clone(order) };
    });
  }

  function enrichOrder(order, s) {
    var p = s.deliveryPartners.find(function (x) { return x.id === order.assignedDeliveryPartnerId; });
    return Object.assign({}, clone(order), {
      currentStepIndex: Math.max(0, ORDER_STEPS.indexOf(order.status)),
      partnerName: p ? p.name : "Assignment pending",
      partnerPhone: p ? p.phone : ""
    });
  }

  function getOrders() {
    var s = stateInternal();
    return s.orders.map(function (o) { return enrichOrder(o, s); });
  }

  function getDeliveryPartners() {
    return clone(stateInternal().deliveryPartners);
  }

  function getCustomerOrders() {
    var s = stateInternal();
    var customer = getCustomerSession();
    if (!customer) return [];
    var cleanPhone = normalizePhone(customer.phone);
    return s.orders
      .filter(function (o) { return normalizePhone(o.customerPhone) === cleanPhone; })
      .map(function (o) { return enrichOrder(o, s); });
  }

  function getCustomerProfile() {
    var s = stateInternal();
    var customer = getCustomerSession();
    if (!customer || !customer.verified) {
      return null;
    }
    var user = findUserByPhone(s, customer.phone);
    return user ? clone(user) : null;
  }

  function updateCustomerProfile(payload) {
    return updateState(function (s) {
      var customer = getCustomerSession();
      if (!customer || !customer.verified) {
        return { ok: false, message: "Please login first." };
      }
      var user = ensureUser(s, customer.phone);
      var nextName = String(payload.name || "").trim();
      if (nextName) {
        user.name = nextName;
      }
      return { ok: true, profile: clone(user) };
    });
  }

  function addCustomerAddress(payload) {
    return updateState(function (s) {
      var customer = getCustomerSession();
      if (!customer || !customer.verified) {
        return { ok: false, message: "Please login first." };
      }
      var user = ensureUser(s, customer.phone);
      var line1 = String(payload.line1 || "").trim();
      var area = String(payload.area || "").trim();
      var city = String(payload.city || "Sasaram").trim();
      var pincode = digitsOnly(payload.pincode).slice(0, 6);
      var label = String(payload.label || "Home").trim();
      if (!line1 || !area || city.length < 2 || pincode.length !== 6) {
        return { ok: false, message: "Address, area, city and valid 6-digit pincode are required." };
      }

      var address = {
        id: "ADDR" + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, "0"),
        label: label || "Home",
        line1: line1,
        area: area,
        city: city,
        pincode: pincode,
        createdAt: nowISO()
      };
      user.addresses.push(address);
      if (!user.defaultAddressId) {
        user.defaultAddressId = address.id;
      }
      return { ok: true, profile: clone(user), address: clone(address) };
    });
  }

  function deleteCustomerAddress(addressId) {
    return updateState(function (s) {
      var customer = getCustomerSession();
      if (!customer || !customer.verified) {
        return { ok: false, message: "Please login first." };
      }
      var user = ensureUser(s, customer.phone);
      var before = user.addresses.length;
      user.addresses = user.addresses.filter(function (addr) { return addr.id !== addressId; });
      if (before === user.addresses.length) {
        return { ok: false, message: "Address not found." };
      }
      if (user.defaultAddressId === addressId) {
        user.defaultAddressId = user.addresses.length ? user.addresses[0].id : null;
      }
      return { ok: true, profile: clone(user) };
    });
  }

  function setDefaultCustomerAddress(addressId) {
    return updateState(function (s) {
      var customer = getCustomerSession();
      if (!customer || !customer.verified) {
        return { ok: false, message: "Please login first." };
      }
      var user = ensureUser(s, customer.phone);
      var exists = user.addresses.some(function (addr) { return addr.id === addressId; });
      if (!exists) {
        return { ok: false, message: "Address not found." };
      }
      user.defaultAddressId = addressId;
      return { ok: true, profile: clone(user) };
    });
  }

  function updateCustomerPreferences(payload) {
    return updateState(function (s) {
      var customer = getCustomerSession();
      if (!customer || !customer.verified) {
        return { ok: false, message: "Please login first." };
      }
      var user = ensureUser(s, customer.phone);
      var defaultPaymentMethod = String(payload.defaultPaymentMethod || user.preferences.defaultPaymentMethod || "COD").toUpperCase();
      if (defaultPaymentMethod !== "COD" && defaultPaymentMethod !== "ONLINE") {
        defaultPaymentMethod = "COD";
      }
      user.preferences = Object.assign({}, user.preferences, {
        language: String(payload.language || user.preferences.language || "en"),
        lowDataMode: payload.lowDataMode !== false,
        orderAlerts: payload.orderAlerts !== false,
        whatsappAlerts: payload.whatsappAlerts === true,
        defaultPaymentMethod: defaultPaymentMethod,
        contactlessDelivery: payload.contactlessDelivery === true,
        deliveryNote: String(payload.deliveryNote || "").slice(0, 140),
        autoOpenCartAfterAdd: payload.autoOpenCartAfterAdd !== false
      });
      return { ok: true, profile: clone(user) };
    });
  }

  function vendorDecision(orderId, accept, vendorId) {
    return updateState(function (s) {
      var o = s.orders.find(function (x) { return x.id === orderId; });
      if (!o || o.status !== "Order Placed") return { ok: false, message: "Order not available." };
      var ts = nowISO();
      if (accept) {
        o.status = "Accepted";
        o.acceptedAt = ts;
        addTimeline(o, "Accepted", ts);
      } else {
        o.status = "Rejected";
        o.rejectedAt = ts;
        addTimeline(o, "Rejected", ts);
      }
      o.vendorId = vendorId || null;
      o.updatedAt = ts;
      return { ok: true, order: clone(o) };
    });
  }

  function setProductStock(productId, inStock, vendorId) {
    return updateState(function (s) {
      var p = s.products.find(function (x) { return x.id === productId; });
      if (!p) return { ok: false, message: "Product not found." };
      p.inStock = !!inStock;
      p.stockUpdatedBy = vendorId || null;
      p.updatedAt = nowISO();
      return { ok: true, product: clone(p) };
    });
  }

  function assignDelivery(orderId, partnerId, adminId) {
    return updateState(function (s) {
      var o = s.orders.find(function (x) { return x.id === orderId; });
      var p = s.deliveryPartners.find(function (x) { return x.id === partnerId && x.isActive; });
      if (!o) return { ok: false, message: "Order not found." };
      if (!p) return { ok: false, message: "Partner unavailable." };
      if (o.status === "Rejected" || o.status === "Delivered") return { ok: false, message: "Order closed." };
      o.assignedDeliveryPartnerId = p.id;
      o.assignedAt = nowISO();
      o.assignedByAdminId = adminId || null;
      o.updatedAt = nowISO();
      return { ok: true, order: clone(o) };
    });
  }

  function markPickedUp(orderId, partnerId) {
    return updateState(function (s) {
      var o = s.orders.find(function (x) { return x.id === orderId; });
      if (!o) return { ok: false, message: "Order not found." };
      if (o.assignedDeliveryPartnerId !== partnerId) return { ok: false, message: "Not assigned to you." };
      if (o.status !== "Ready for Pickup") return { ok: false, message: "Order not ready." };
      var ts = nowISO();
      o.status = "Out for Delivery";
      o.pickedUpAt = ts;
      addTimeline(o, "Out for Delivery", ts);
      o.updatedAt = ts;
      return { ok: true, order: clone(o) };
    });
  }

  function markDelivered(orderId, partnerId) {
    return updateState(function (s) {
      var o = s.orders.find(function (x) { return x.id === orderId; });
      if (!o) return { ok: false, message: "Order not found." };
      if (o.assignedDeliveryPartnerId !== partnerId) return { ok: false, message: "Not assigned to you." };
      if (o.status !== "Out for Delivery") return { ok: false, message: "Order not in delivery stage." };
      var ts = nowISO();
      o.status = "Delivered";
      o.deliveredAt = ts;
      addTimeline(o, "Delivered", ts);
      o.updatedAt = ts;
      return { ok: true, order: clone(o) };
    });
  }

  function addCategory(name) {
    return updateState(function (s) {
      var n = String(name || "").trim();
      if (!n) return { ok: false, message: "Category name required." };
      if (s.categories.some(function (c) { return c.name.toLowerCase() === n.toLowerCase(); })) {
        return { ok: false, message: "Category already exists." };
      }
      var cat = { id: s.nextIds.category++, name: n };
      s.categories.push(cat);
      return { ok: true, category: clone(cat) };
    });
  }

  function deleteCategory(id) {
    return updateState(function (s) {
      if (s.products.some(function (p) { return p.categoryId === id; })) {
        return { ok: false, message: "Category has products. Remove products first." };
      }
      var before = s.categories.length;
      s.categories = s.categories.filter(function (c) { return c.id !== id; });
      return before === s.categories.length ? { ok: false, message: "Category not found." } : { ok: true };
    });
  }

  function addProduct(payload) {
    return updateState(function (s) {
      var categoryId = Number(payload.categoryId);
      if (!s.categories.some(function (c) { return c.id === categoryId; })) return { ok: false, message: "Invalid category." };
      var p = {
        id: s.nextIds.product++,
        name: String(payload.name || "").trim(),
        weight: String(payload.weight || "").trim(),
        categoryId: categoryId,
        price: num(payload.price, 0),
        image: String(payload.image || "").trim() || placeholder(payload.name || "Product", "#d1fae5"),
        inStock: payload.inStock !== false
      };
      if (!p.name || !p.weight || p.price <= 0) return { ok: false, message: "Name, weight and valid price required." };
      s.products.push(p);
      return { ok: true, product: clone(p) };
    });
  }

  function updateProduct(id, payload) {
    return updateState(function (s) {
      var p = s.products.find(function (x) { return x.id === id; });
      if (!p) return { ok: false, message: "Product not found." };
      var categoryId = Number(payload.categoryId);
      if (!s.categories.some(function (c) { return c.id === categoryId; })) return { ok: false, message: "Invalid category." };
      var price = num(payload.price, 0);
      var name = String(payload.name || "").trim();
      var weight = String(payload.weight || "").trim();
      if (!name || !weight || price <= 0) return { ok: false, message: "Name, weight and valid price required." };
      p.name = name;
      p.weight = weight;
      p.categoryId = categoryId;
      p.price = price;
      p.image = String(payload.image || "").trim() || placeholder(name, "#bfdbfe");
      p.inStock = !!payload.inStock;
      p.updatedAt = nowISO();
      return { ok: true, product: clone(p) };
    });
  }

  function deleteProduct(id) {
    return updateState(function (s) {
      var before = s.products.length;
      s.products = s.products.filter(function (p) { return p.id !== id; });
      if (before === s.products.length) return { ok: false, message: "Product not found." };
      setCart(getCart().filter(function (i) { return i.productId !== id; }));
      return { ok: true };
    });
  }

  function updatePricingSettings(payload) {
    return updateState(function (s) {
      var minOrderValue = num(payload.minOrderValue, s.settings.minOrderValue);
      var deliveryFee = num(payload.deliveryFee, s.settings.deliveryFee);
      var freeDeliveryThreshold = num(payload.freeDeliveryThreshold, s.settings.freeDeliveryThreshold);
      if (minOrderValue <= 0 || deliveryFee < 0 || freeDeliveryThreshold < minOrderValue) {
        return { ok: false, message: "Invalid pricing values." };
      }
      s.settings.minOrderValue = Math.round(minOrderValue);
      s.settings.deliveryFee = Math.round(deliveryFee);
      s.settings.freeDeliveryThreshold = Math.round(freeDeliveryThreshold);
      return { ok: true, settings: clone(s.settings) };
    });
  }

  function updateOtpSettings(payload) {
    return updateState(function (s) {
      var mode = String(payload.otpMode || "demo").toLowerCase();
      var webhookUrl = String(payload.otpWebhookUrl || "").trim();
      if (mode !== "demo" && mode !== "webhook") {
        return { ok: false, message: "OTP mode should be demo or webhook." };
      }
      if (mode === "webhook" && !/^https:\/\//i.test(webhookUrl)) {
        return { ok: false, message: "Webhook URL must start with https://." };
      }
      s.settings.otpMode = mode;
      s.settings.otpWebhookUrl = webhookUrl;
      return { ok: true, settings: clone(s.settings) };
    });
  }

  function addVendor(payload) {
    return updateState(function (s) {
      var name = String(payload.name || "").trim();
      var phone = normalizePhone(payload.phone);
      var pin = normalizePin(payload.pin).slice(0, 4);
      if (!name || phone.length !== 10 || pin.length < 4) return { ok: false, message: "Name, valid 10-digit phone and 4-digit PIN required." };
      if (s.vendors.some(function (v) { return normalizePhone(v.phone) === phone; })) return { ok: false, message: "Phone already exists." };
      var v = { id: s.nextIds.vendor++, name: name, phone: phone, pin: pin, isActive: true };
      s.vendors.push(v);
      return { ok: true, vendor: clone(v) };
    });
  }

  function addDeliveryPartner(payload) {
    return updateState(function (s) {
      var name = String(payload.name || "").trim();
      var phone = normalizePhone(payload.phone);
      var pin = normalizePin(payload.pin).slice(0, 4);
      if (!name || phone.length !== 10 || pin.length < 4) return { ok: false, message: "Name, valid 10-digit phone and 4-digit PIN required." };
      if (s.deliveryPartners.some(function (d) { return normalizePhone(d.phone) === phone; })) return { ok: false, message: "Phone already exists." };
      var d = { id: s.nextIds.deliveryPartner++, name: name, phone: phone, pin: pin, isActive: true };
      s.deliveryPartners.push(d);
      return { ok: true, partner: clone(d) };
    });
  }

  function toggleVendorActive(id, isActive) {
    return updateState(function (s) {
      var v = s.vendors.find(function (x) { return x.id === id; });
      if (!v) return { ok: false, message: "Vendor not found." };
      v.isActive = !!isActive;
      return { ok: true, vendor: clone(v) };
    });
  }

  function toggleDeliveryPartnerActive(id, isActive) {
    return updateState(function (s) {
      var d = s.deliveryPartners.find(function (x) { return x.id === id; });
      if (!d) return { ok: false, message: "Partner not found." };
      d.isActive = !!isActive;
      return { ok: true, partner: clone(d) };
    });
  }

  function toggleUserActive(id, isActive) {
    return updateState(function (s) {
      var u = s.users.find(function (x) { return x.id === id; });
      if (!u) return { ok: false, message: "User not found." };
      u.isActive = !!isActive;
      return { ok: true, user: clone(u) };
    });
  }

  function adminDashboard() {
    var s = stateInternal();
    var orders = s.orders.map(function (o) { return enrichOrder(o, s); });
    var delivered = orders.filter(function (o) { return o.status === "Delivered"; });
    var active = orders.filter(function (o) { return o.status !== "Delivered" && o.status !== "Rejected"; });
    var revenue = delivered.reduce(function (sum, o) { return sum + o.total; }, 0);

    return {
      settings: clone(s.settings),
      categories: clone(s.categories),
      products: clone(productsWithCategory(s)),
      users: clone(s.users),
      vendors: clone(s.vendors),
      deliveryPartners: clone(s.deliveryPartners),
      orders: orders,
      analytics: {
        totalOrders: orders.length,
        activeOrders: active.length,
        deliveredOrders: delivered.length,
        revenue: revenue,
        averageOrderValue: delivered.length ? Math.round(revenue / delivered.length) : 0
      }
    };
  }

  function vendorPanelData(vendorId) {
    var s = stateInternal();
    return {
      vendorId: vendorId,
      products: clone(productsWithCategory(s)),
      pendingOrders: s.orders.filter(function (o) { return o.status === "Order Placed"; }).map(function (o) { return enrichOrder(o, s); }),
      recentOrders: s.orders.filter(function (o) { return o.status !== "Order Placed"; }).map(function (o) { return enrichOrder(o, s); })
    };
  }

  function deliveryPanelData(deliveryId) {
    var s = stateInternal();
    return {
      assignedOrders: s.orders
        .filter(function (o) {
          return o.assignedDeliveryPartnerId === deliveryId && o.status !== "Delivered" && o.status !== "Rejected";
        })
        .map(function (o) { return enrichOrder(o, s); }),
      recentDelivered: s.orders
        .filter(function (o) {
          return o.assignedDeliveryPartnerId === deliveryId && o.status === "Delivered";
        })
        .map(function (o) { return enrichOrder(o, s); })
    };
  }

  function resetAllData() {
    writeJSON(STATE_KEY, defaults());
    clearCart();
    clearCustomerSession();
    clearRoleSession("admin");
    clearRoleSession("vendor");
    clearRoleSession("delivery");
    window.localStorage.removeItem(OTP_KEY);
  }

  window.QuickMartData = {
    ORDER_STEPS: ORDER_STEPS,
    formatINR: fmt,
    getState: getState,
    getProducts: getProducts,
    getCategories: getCategories,
    getSettings: getSettings,
    getCart: getCart,
    setCart: setCart,
    addToCart: addToCart,
    updateCartItem: updateCartItem,
    clearCart: clearCart,
    getCartDetails: cartDetails,
    calculateDeliverySummary: deliverySummary,
    getCustomerSession: getCustomerSession,
    setCustomerSession: setCustomerSession,
    clearCustomerSession: clearCustomerSession,
    normalizePhoneInput: normalizePhone,
    normalizePinInput: normalizePin,
    normalizeDigitsInput: digitsOnly,
    createOtp: createOtp,
    requestOtp: requestOtp,
    verifyOtp: verifyOtp,
    loginAdmin: loginAdmin,
    loginVendor: loginVendor,
    loginDelivery: loginDelivery,
    getRoleSession: roleSession,
    clearRoleSession: clearRoleSession,
    createOrder: createOrder,
    getOrders: getOrders,
    getDeliveryPartners: getDeliveryPartners,
    getCustomerOrders: getCustomerOrders,
    getCustomerProfile: getCustomerProfile,
    updateCustomerProfile: updateCustomerProfile,
    addCustomerAddress: addCustomerAddress,
    deleteCustomerAddress: deleteCustomerAddress,
    setDefaultCustomerAddress: setDefaultCustomerAddress,
    updateCustomerPreferences: updateCustomerPreferences,
    vendorDecision: vendorDecision,
    setProductStock: setProductStock,
    assignDelivery: assignDelivery,
    markPickedUp: markPickedUp,
    markDelivered: markDelivered,
    addCategory: addCategory,
    deleteCategory: deleteCategory,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    updatePricingSettings: updatePricingSettings,
    updateOtpSettings: updateOtpSettings,
    addVendor: addVendor,
    addDeliveryPartner: addDeliveryPartner,
    toggleUserActive: toggleUserActive,
    toggleVendorActive: toggleVendorActive,
    toggleDeliveryPartnerActive: toggleDeliveryPartnerActive,
    getAdminDashboard: adminDashboard,
    getVendorPanelData: vendorPanelData,
    getDeliveryPanelData: deliveryPanelData,
    resetAllData: resetAllData
  };

  stateInternal();
})(window);

