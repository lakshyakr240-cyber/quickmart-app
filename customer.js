(function () {
  "use strict";

  var state = {
    selectedCategoryId: null,
    search: "",
    pendingCheckout: false
  };

  var DEFAULT_PREFS = {
    language: "en",
    lowDataMode: true,
    orderAlerts: true,
    whatsappAlerts: false,
    defaultPaymentMethod: "COD",
    contactlessDelivery: false,
    deliveryNote: "",
    autoOpenCartAfterAdd: true
  };

  var COLLECTION_SECTIONS = [
    {
      title: "Grocery & Kitchen",
      tiles: [
        { label: "Vegetables & Fruits", categoryName: "Vegetables & Fruits", search: "", icon: "VEG", color: "#d8f3dc" },
        { label: "Atta, Rice & Dal", categoryName: "Atta, Rice & Dal", search: "", icon: "DAL", color: "#fde68a" },
        { label: "Oil, Ghee & Masala", categoryName: "Oil, Ghee & Masala", search: "", icon: "OIL", color: "#fecaca" },
        { label: "Dairy, Bread & Eggs", categoryName: "Dairy, Bread & Eggs", search: "", icon: "DAI", color: "#bfdbfe" },
        { label: "Bakery & Biscuits", categoryName: "Bakery & Biscuits", search: "", icon: "BAK", color: "#fed7aa" },
        { label: "Dry Fruits & Cereals", categoryName: "Dry Fruits & Cereals", search: "", icon: "DRY", color: "#ddd6fe" },
        { label: "Chicken, Meat & Fish", categoryName: "Chicken, Meat & Fish", search: "Eggs", icon: "MEAT", color: "#fecdd3" },
        { label: "Kitchenware & Appliances", categoryName: "Kitchenware & Appliances", search: "", icon: "KIT", color: "#e2e8f0" }
      ]
    },
    {
      title: "Snacks & Drinks",
      tiles: [
        { label: "Chips & Namkeen", categoryName: "Chips & Namkeen", search: "", icon: "CHIP", color: "#fde68a" },
        { label: "Sweets & Chocolates", categoryName: "Sweets & Chocolates", search: "", icon: "SWEET", color: "#fbcfe8" },
        { label: "Drinks & Juices", categoryName: "Drinks & Juices", search: "", icon: "DRINK", color: "#bfdbfe" },
        { label: "Tea, Coffee & More", categoryName: "Tea, Coffee & More", search: "", icon: "TEA", color: "#d9f99d" },
        { label: "Instant Food", categoryName: "Instant Food", search: "", icon: "INST", color: "#fecaca" },
        { label: "Sauces & Spreads", categoryName: "Sauces & Spreads", search: "", icon: "SAUCE", color: "#fee2e2" },
        { label: "Paan Corner", categoryName: "Paan Corner", search: "", icon: "PAAN", color: "#bbf7d0" },
        { label: "Ice Creams", categoryName: "Ice Creams", search: "", icon: "ICE", color: "#c7d2fe" }
      ]
    },
    {
      title: "Household Essentials",
      tiles: [
        { label: "Home & Lifestyle", categoryName: "Home & Lifestyle", search: "", icon: "HOME", color: "#e2e8f0" },
        { label: "Cleaners & Repellents", categoryName: "Cleaners & Repellents", search: "Dettol", icon: "CLEAN", color: "#a7f3d0" },
        { label: "Electronics", categoryName: "Electronics", search: "", icon: "ELEC", color: "#ddd6fe" },
        { label: "Stationery & Games", categoryName: "Stationery & Games", search: "", icon: "GAME", color: "#bfdbfe" }
      ]
    }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function collectionImageData(label, icon, color) {
    var safeLabel = String(label || "").replace(/[<>]/g, "");
    var safeIcon = String(icon || "SHOP");
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='140' viewBox='0 0 220 140'>" +
      "<rect width='220' height='140' rx='20' fill='" +
      (color || "#dbeafe") +
      "'/>" +
      "<text x='110' y='78' text-anchor='middle' font-size='30' font-family='Arial,sans-serif' font-weight='700' fill='#1f2937'>" +
      safeIcon +
      "</text>" +
      "<text x='110' y='122' text-anchor='middle' font-size='15' font-family='Arial,sans-serif' fill='#1f2937'>" +
      safeLabel.slice(0, 18) +
      "</text>" +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function findCategoryIdByName(name) {
    var target = String(name || "").trim().toLowerCase();
    if (!target) return null;
    var category = QuickMartData.getCategories().find(function (item) {
      return String(item.name || "").trim().toLowerCase() === target;
    });
    return category ? Number(category.id) : null;
  }

  function quickFilterConfig(label) {
    var key = String(label || "").trim().toLowerCase();
    if (!key || key === "all") {
      return { categoryName: null, search: "" };
    }
    if (key === "vegetables" || key === "fruits") {
      return { categoryName: "Vegetables & Fruits", search: "" };
    }
    if (key === "dairy") {
      return { categoryName: "Dairy, Bread & Eggs", search: "" };
    }
    if (key === "essentials") {
      return { categoryName: "Cleaners & Repellents", search: "" };
    }
    return { categoryName: label, search: "" };
  }

  function setActiveQuickChip(label) {
    var normalized = String(label || "").trim().toLowerCase();
    document.querySelectorAll("[data-quick-filter]").forEach(function (chip) {
      var chipLabel = String(chip.getAttribute("data-quick-filter") || "").trim().toLowerCase();
      chip.classList.toggle("active", chipLabel === normalized);
    });
  }

  function openModal(id) {
    var modal = byId(id);
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(id) {
    var modal = byId(id);
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function sessionText() {
    var session = QuickMartData.getCustomerSession();
    if (session && session.phone) {
      return "Logged in: " + session.phone;
    }
    return "Guest";
  }

  function currentProfile() {
    return QuickMartData.getCustomerProfile();
  }

  function currentPreferences() {
    var profile = currentProfile();
    return Object.assign({}, DEFAULT_PREFS, (profile && profile.preferences) || {});
  }

  function applyPreferenceUI() {
    var prefs = currentPreferences();
    document.body.classList.toggle("low-data-mode", prefs.lowDataMode !== false);
    var payment = prefs.defaultPaymentMethod === "ONLINE" ? "ONLINE" : "COD";
    var paymentInput = document.querySelector('input[name="payment"][value="' + payment + '"]');
    if (paymentInput) {
      paymentInput.checked = true;
    }
  }

  function renderHeroStats() {
    var settings = QuickMartData.getSettings();
    byId("heroEta").textContent = "20-30 mins";
    byId("heroMinOrder").textContent = QuickMartData.formatINR(settings.minOrderValue || 100);
    byId("heroDeliveryFee").textContent = QuickMartData.formatINR(settings.deliveryFee || 0);
    byId("heroFreeCutoff").textContent = QuickMartData.formatINR(settings.freeDeliveryThreshold || 300) + "+";
  }

  function renderSearchState(resultCount) {
    var query = state.search.trim();
    var active = query.length > 0;
    document.body.classList.toggle("search-active", active);
    ["heroSection", "serviceSection", "categorySection", "collectionsSection", "ordersSection"].forEach(function (id) {
      var el = byId(id);
      if (el) {
        el.classList.toggle("hidden", active);
      }
    });

    var title = byId("productsTitle");
    var hint = byId("productSectionHint");
    var bar = byId("searchResultBar");
    if (!title || !hint || !bar) {
      return;
    }

    if (!active) {
      title.textContent = "\u26a1 Popular Items";
      hint.textContent = "Daily fresh picks for you";
      bar.classList.add("hidden");
      bar.textContent = "";
      return;
    }

    title.textContent = "Search Results";
    hint.textContent = "Only matching products are shown";
    bar.classList.remove("hidden");
    bar.textContent = String(resultCount || 0) + ' result(s) for "' + query + '"';
  }

  function categoryBadge(name) {
    var key = String(name || "").toLowerCase();
    if (key.includes("vegetable") || key.includes("fruit")) return "🥬";
    if (key.includes("grocery") || key.includes("atta") || key.includes("dal")) return "🛒";
    if (key.includes("dairy") || key.includes("bread") || key.includes("egg")) return "🥛";
    if (key.includes("medicine") || key.includes("pharma") || key.includes("wellness")) return "💊";
    if (key.includes("snacks") || key.includes("chips")) return "🍟";
    if (key.includes("drinks") || key.includes("juice")) return "🧃";
    if (key.includes("clean") || key.includes("essential") || key.includes("home")) return "🧴";
    if (key.includes("electronics")) return "🔌";
    if (key.includes("stationery")) return "📝";
    return "🛍️";
  }

  function currentAddressText(profile) {
    if (!profile || !Array.isArray(profile.addresses)) {
      return "Delivery address not set";
    }
    var selected = profile.addresses.find(function (a) {
      return a.id === profile.defaultAddressId;
    });
    if (!selected) {
      return "Delivery address not set";
    }
    return selected.label + ": " + selected.line1 + ", " + selected.area + ", " + selected.city + " - " + selected.pincode;
  }

  function currentAddressShort(profile) {
    if (!profile || !Array.isArray(profile.addresses)) {
      return "Add Address";
    }
    var selected = profile.addresses.find(function (a) {
      return a.id === profile.defaultAddressId;
    });
    if (!selected) {
      return "Add Address";
    }
    return selected.label + " - " + selected.area;
  }

  function renderSessionInfo() {
    var session = QuickMartData.getCustomerSession();
    byId("sessionPill").textContent = sessionText();
    byId("accountBtn").textContent = session && session.phone ? "My Account" : "Login";
    if (byId("settingsBtn")) {
      byId("settingsBtn").textContent = "My Profile";
    }

    var bar = byId("addressBar");
    var profile = currentProfile();
    var addressText = currentAddressText(profile);
    var shortAddressText = currentAddressShort(profile);

    if (bar) {
      bar.innerHTML =
        "<strong>Delivery:</strong> " +
        escapeHtml(addressText) +
        ' <button id="manageAddressBtn" class="action-link" type="button">Manage</button>';
    }

    var promoAddress = byId("promoAddressText");
    if (promoAddress) {
      promoAddress.textContent = shortAddressText;
    }
    var promoAddressSecondary = byId("promoAddressTextSecondary");
    if (promoAddressSecondary) {
      promoAddressSecondary.textContent = shortAddressText;
    }

    var manageBtn = byId("manageAddressBtn");
    if (manageBtn) {
      manageBtn.addEventListener("click", function () {
        openModal("accountModal");
        renderAccountModal();
      });
    }
  }

  function renderCategories() {
    var categories = QuickMartData.getCategories();
    var html =
      '<button class="category-tile category-all ' +
      (state.selectedCategoryId === null ? "active" : "") +
      '" data-cat="all" type="button"><span class="cat-badge">⭐</span><span class="cat-text">All</span></button>';

    categories.forEach(function (category) {
      var active = state.selectedCategoryId === category.id ? "active" : "";
      html +=
        '<button class="category-tile ' +
        active +
        '" data-cat="' +
        category.id +
        '" type="button"><span class="cat-badge">' +
        escapeHtml(categoryBadge(category.name)) +
        '</span><span class="cat-text">' +
        escapeHtml(category.name) +
        "</span></button>";
    });

    byId("categoryGrid").innerHTML = html;

    byId("categoryGrid").querySelectorAll(".category-tile").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var raw = btn.getAttribute("data-cat");
        state.selectedCategoryId = raw === "all" ? null : Number(raw);
        setActiveQuickChip("All");
        renderCategories();
        renderProducts();
      });
    });
  }

  function renderCollections() {
    var wrap = byId("collectionSections");
    if (!wrap) return;

    wrap.innerHTML = COLLECTION_SECTIONS.map(function (section, sectionIndex) {
      return (
        '<section class="collection-block">' +
        '<h3 class="collection-title">' +
        escapeHtml(section.title) +
        "</h3>" +
        '<div class="collection-grid">' +
        section.tiles
          .map(function (tile, tileIndex) {
            var imageSrc = collectionImageData(tile.label, tile.icon, tile.color);
            return (
              '<button class="collection-card" type="button" data-section="' +
              sectionIndex +
              '" data-tile="' +
              tileIndex +
              '">' +
              '<span class="collection-media"><img src="' +
              imageSrc +
              '" alt="' +
              escapeHtml(tile.label) +
              '" loading="lazy" /></span>' +
              '<span class="collection-label">' +
              escapeHtml(tile.label) +
              "</span>" +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        "</section>"
      );
    }).join("");

    wrap.querySelectorAll(".collection-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var sectionIdx = Number(card.getAttribute("data-section"));
        var tileIdx = Number(card.getAttribute("data-tile"));
        var tile = COLLECTION_SECTIONS[sectionIdx] && COLLECTION_SECTIONS[sectionIdx].tiles[tileIdx];
        if (!tile) return;

        var resolvedCategoryId = typeof tile.categoryId === "number" ? tile.categoryId : findCategoryIdByName(tile.categoryName);
        state.selectedCategoryId = typeof resolvedCategoryId === "number" && !Number.isNaN(resolvedCategoryId) ? resolvedCategoryId : null;
        state.search = tile.search || "";
        byId("searchInput").value = state.search;
        renderCategories();
        renderProducts();
      });
    });
  }

  function matchesFilters(product) {
    var categoryOk = state.selectedCategoryId === null || product.categoryId === state.selectedCategoryId;
    if (!categoryOk) return false;
    if (!state.search.trim()) return true;

    var q = state.search.trim().toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      product.weight.toLowerCase().includes(q) ||
      String(product.categoryName || "").toLowerCase().includes(q)
    );
  }

  function renderProducts() {
    var products = QuickMartData.getProducts().filter(matchesFilters);
    renderSearchState(products.length);
    if (!products.length) {
      if (state.search.trim()) {
        byId("productGrid").innerHTML = '<p class="muted">No products found for "<strong>' + escapeHtml(state.search.trim()) + '</strong>".</p>';
      } else {
        byId("productGrid").innerHTML = '<p class="muted">No products match your filters.</p>';
      }
      return;
    }

    byId("productGrid").innerHTML = products
      .map(function (product) {
        return (
          '<article class="product-card">' +
          '<img src="' +
          product.image +
          '" alt="' +
          escapeHtml(product.name) +
          '" loading="lazy" />' +
          '<div class="product-body">' +
          '<h3 class="product-name">' +
          escapeHtml(product.name) +
          "</h3>" +
          '<div class="row"><span class="muted">' +
          escapeHtml(product.weight) +
          '</span><span class="stock ' +
          (product.inStock ? "" : "out") +
          '">' +
          (product.inStock ? "In Stock" : "Out of Stock") +
          "</span></div>" +
          '<div class="row"><span class="price">' +
          QuickMartData.formatINR(product.price) +
          '</span><button class="btn add-btn" data-id="' +
          product.id +
          '" type="button" ' +
          (product.inStock ? "" : "disabled") +
          ">Add</button></div>" +
          "</div></article>"
        );
      })
      .join("");

    byId("productGrid").querySelectorAll(".add-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = Number(btn.getAttribute("data-id"));
        QuickMartData.addToCart(id);
        renderCart();
        if (currentPreferences().autoOpenCartAfterAdd !== false) {
          openModal("cartModal");
        }
      });
    });
  }

  function cartItemCard(item) {
    return (
      '<div class="cart-item">' +
      '<div><strong>' +
      escapeHtml(item.name) +
      '</strong><p class="muted">' +
      escapeHtml(item.weight) +
      " | " +
      QuickMartData.formatINR(item.price) +
      " each</p></div>" +
      '<div class="inline-row" style="justify-content: space-between">' +
      '<div class="qty-wrap">' +
      '<button class="qty-btn qty-minus" data-id="' +
      item.productId +
      '">-</button>' +
      "<strong>" +
      item.qty +
      "</strong>" +
      '<button class="qty-btn qty-plus" data-id="' +
      item.productId +
      '">+</button>' +
      "</div>" +
      "<strong>" +
      QuickMartData.formatINR(item.lineTotal) +
      "</strong>" +
      "</div>" +
      "</div>"
    );
  }

  function cartCount(items) {
    return items.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function selectedPayment() {
    var selected = document.querySelector('input[name="payment"]:checked');
    return selected ? selected.value : "COD";
  }

  function renderCart() {
    var details = QuickMartData.getCartDetails();
    var itemsEl = byId("cartItems");

    if (!details.items.length) {
      itemsEl.innerHTML = '<p class="muted">Your cart is empty.</p>';
    } else {
      itemsEl.innerHTML = details.items.map(cartItemCard).join("");
    }

    byId("cartCountBadge").textContent = String(cartCount(details.items));
    var dockCount = byId("cartDockCount");
    if (dockCount) {
      dockCount.textContent = String(cartCount(details.items));
    }
    byId("subtotalValue").textContent = QuickMartData.formatINR(details.subtotal);
    byId("deliveryValue").textContent = QuickMartData.formatINR(details.deliveryFee);
    byId("totalValue").textContent = QuickMartData.formatINR(details.total);
    byId("progressMessage").textContent = details.progressMessage;

    var checkoutBtn = byId("checkoutBtn");
    var enabled = details.items.length > 0 && details.canCheckout;
    checkoutBtn.disabled = !enabled;
    checkoutBtn.textContent = enabled ? "Place Order" : "Update Cart to Checkout";

    itemsEl.querySelectorAll(".qty-minus").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = Number(btn.getAttribute("data-id"));
        var row = details.items.find(function (i) {
          return i.productId === id;
        });
        QuickMartData.updateCartItem(id, row.qty - 1);
        renderCart();
      });
    });

    itemsEl.querySelectorAll(".qty-plus").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = Number(btn.getAttribute("data-id"));
        var row = details.items.find(function (i) {
          return i.productId === id;
        });
        QuickMartData.updateCartItem(id, row.qty + 1);
        renderCart();
      });
    });
  }

  function badgeClass(status) {
    if (status === "Delivered") return "status-live";
    if (status === "Rejected") return "status-danger";
    return "";
  }

  function renderOrders() {
    var orders = QuickMartData.getCustomerOrders();
    var wrap = byId("ordersWrap");

    if (!orders.length) {
      wrap.innerHTML = '<p class="muted">No customer orders yet. Login and place your first order.</p>';
      return;
    }

    wrap.innerHTML = orders
      .map(function (order) {
        var timeline = QuickMartData.ORDER_STEPS.map(function (step, index) {
          var done = index <= order.currentStepIndex ? "done" : "";
          return '<div class="timeline-step ' + done + '">' + step + "</div>";
        }).join("");

        var addressText = order.deliveryAddress
          ? order.deliveryAddress.line1 + ", " + order.deliveryAddress.area + ", " + order.deliveryAddress.city
          : "Address not available";

        var items = Array.isArray(order.items) ? order.items : [];
        var totalQty = items.reduce(function (sum, item) {
          return sum + Number(item.qty || 0);
        }, 0);
        var itemsHtml = items.length
          ? items
            .map(function (item) {
              var qty = Number(item.qty || 0);
              var unitPrice = Number(item.price || 0);
              var lineTotal = Number(item.lineTotal || 0);
              if (!lineTotal && qty > 0 && unitPrice > 0) {
                lineTotal = qty * unitPrice;
              }
              return (
                '<div class="row" style="padding:4px 0;border-bottom:1px dashed #e2e8f0">' +
                '<span class="muted" style="color:#1f2937">' +
                escapeHtml(item.name || "Item") +
                " x " +
                qty +
                (item.weight ? " (" + escapeHtml(item.weight) + ")" : "") +
                "</span>" +
                "<strong>" +
                QuickMartData.formatINR(lineTotal) +
                "</strong>" +
                "</div>"
              );
            })
            .join("")
          : '<p class="muted">No item details available.</p>';

        return (
          '<article class="order-card">' +
          '<div class="row"><strong>' +
          order.id +
          '</strong><span class="status-badge ' +
          badgeClass(order.status) +
          '">' +
          order.status +
          "</span></div>" +
          '<p class="muted" style="margin-top:4px">ETA: ' +
          escapeHtml(order.estimatedDeliveryText || "20-30 minutes") +
          " | Partner: " +
          escapeHtml(order.partnerName) +
          (order.partnerPhone ? " (" + escapeHtml(order.partnerPhone) + ")" : "") +
          "</p>" +
          '<p class="muted" style="margin-top:4px">Address: ' +
          escapeHtml(addressText) +
          "</p>" +
          '<p class="muted" style="margin-top:4px">Payment: ' +
          escapeHtml(String(order.paymentMethod || "COD")) +
          " - " +
          escapeHtml(String(order.paymentStatus || "PENDING")) +
          (order.paymentReference ? " (" + escapeHtml(order.paymentReference) + ")" : "") +
          "</p>" +
          '<p class="muted" style="margin-top:4px">Delivery Type: ' +
          (order.contactlessDelivery ? "Contactless" : "Standard handover") +
          (order.deliveryNote ? " | Note: " + escapeHtml(order.deliveryNote) : "") +
          "</p>" +
          '<div class="field-grid" style="margin-top:8px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:8px">' +
          '<div class="row"><strong>Order Items</strong><span class="muted">' +
          totalQty +
          " item(s)</span></div>" +
          itemsHtml +
          '<div class="row" style="margin-top:6px"><span class="muted">Subtotal</span><strong>' +
          QuickMartData.formatINR(order.subtotal || 0) +
          "</strong></div>" +
          '<div class="row"><span class="muted">Delivery Fee</span><strong>' +
          QuickMartData.formatINR(order.deliveryFee || 0) +
          "</strong></div>" +
          '<div class="row"><span class="muted">Total</span><strong class="price">' +
          QuickMartData.formatINR(order.total || 0) +
          "</strong></div>" +
          "</div>" +
          '<div class="timeline">' +
          timeline +
          "</div>" +
          (order.status === "Rejected"
            ? '<p class="muted" style="margin-top:6px;color:#991b1b">Order was rejected by vendor.</p>'
            : "") +
          "</article>"
        );
      })
      .join("");
  }

  function renderAddressList(profile) {
    var wrap = byId("customerAddressList");
    if (!profile || !Array.isArray(profile.addresses) || !profile.addresses.length) {
      wrap.innerHTML = '<p class="muted">No saved address yet.</p>';
      return;
    }

    wrap.innerHTML = profile.addresses
      .map(function (addr) {
        var isDefault = addr.id === profile.defaultAddressId;
        return (
          '<div class="order-card" style="margin-top:0">' +
          '<div class="row"><strong>' +
          escapeHtml(addr.label) +
          '</strong><span class="status-badge ' +
          (isDefault ? "status-live" : "") +
          '">' +
          (isDefault ? "Default" : "Saved") +
          "</span></div>" +
          '<p class="muted" style="margin-top:4px">' +
          escapeHtml(addr.line1 + ", " + addr.area + ", " + addr.city + " - " + addr.pincode) +
          "</p>" +
          '<div class="inline-row" style="margin-top:6px">' +
          '<button class="action-link set-default-address" data-id="' +
          addr.id +
          '" type="button">Set Default</button>' +
          '<button class="action-link delete-address" data-id="' +
          addr.id +
          '" type="button">Delete</button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderAccountModal() {
    var session = QuickMartData.getCustomerSession();
    var profile = currentProfile();

    byId("customerPhoneInput").value = session && session.phone ? session.phone : "";
    byId("customerNameInput").value = profile && profile.name ? profile.name : "";
    renderAddressList(profile);
  }

  function renderSettingsModal() {
    var prefs = currentPreferences();
    var session = QuickMartData.getCustomerSession();
    var profile = currentProfile();
    byId("languageSelect").value = prefs.language || "en";
    byId("lowDataToggle").checked = prefs.lowDataMode !== false;
    byId("orderAlertsToggle").checked = prefs.orderAlerts !== false;
    byId("defaultPaymentSelect").value = prefs.defaultPaymentMethod === "ONLINE" ? "ONLINE" : "COD";
    byId("contactlessToggle").checked = prefs.contactlessDelivery === true;
    byId("whatsappAlertsToggle").checked = prefs.whatsappAlerts === true;
    byId("autoOpenCartToggle").checked = prefs.autoOpenCartAfterAdd !== false;
    byId("deliveryNoteInput").value = String(prefs.deliveryNote || "");

    if (byId("profileNameTitle")) {
      byId("profileNameTitle").textContent = (profile && profile.name) ? profile.name : "Your Account";
    }
    if (byId("profilePhoneTitle")) {
      byId("profilePhoneTitle").textContent = (session && session.phone) ? session.phone : "Login to unlock profile options";
    }
  }

  function handleProfileAction(action) {
    if (action === "address") {
      closeModal("settingsModal");
      openModal("accountModal");
      renderAccountModal();
      return;
    }
    if (action === "orders") {
      closeModal("settingsModal");
      var ordersSection = byId("ordersSection");
      if (ordersSection && typeof ordersSection.scrollIntoView === "function") {
        ordersSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    if (action === "payment" || action === "payment-settings") {
      if (byId("defaultPaymentSelect")) {
        byId("defaultPaymentSelect").focus();
      }
      alert("Select preferred payment method and click Save Preferences.");
      return;
    }
    if (action === "help") {
      alert("QuickMart Support: +91 90010 01001");
      return;
    }
    if (action === "wishlist") {
      alert("Wishlist feature section is ready. Full save-to-wishlist backend can be enabled next.");
      return;
    }
    if (action === "prescriptions") {
      state.selectedCategoryId = findCategoryIdByName("Medicines");
      state.search = "";
      byId("searchInput").value = "";
      setActiveQuickChip("Medicines");
      renderCategories();
      renderProducts();
      closeModal("settingsModal");
      var productsSection = byId("productsSection");
      if (productsSection && typeof productsSection.scrollIntoView === "function") {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      alert("Medicines section opened for prescription related items.");
      return;
    }
    if (action === "gst") {
      var existingGst = window.localStorage.getItem("quickmart_customer_gst") || "";
      var enteredGst = window.prompt("Enter GST number (optional):", existingGst);
      if (enteredGst !== null) {
        window.localStorage.setItem("quickmart_customer_gst", String(enteredGst || "").trim());
        alert("GST details saved.");
      }
      return;
    }
    if (action === "gift-card") {
      alert("Gift card claim option is available. Full coupon integration can be enabled next.");
      return;
    }
    if (action === "rewards") {
      alert("Rewards tracker section is active. Rewards data will appear after promo campaigns.");
      return;
    }
    if (action === "share-app") {
      var link = window.location.href;
      if (window.navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(function () {
          alert("App link copied. Share it with your friends.");
        }, function () {
          window.prompt("Copy and share this link:", link);
        });
      } else {
        window.prompt("Copy and share this link:", link);
      }
      return;
    }
    if (action === "about-us") {
      alert("QuickMart Sasaram\nSupport: +91 90010 01001\nEmail: support@quickmart.in");
      return;
    }
    if (action === "privacy") {
      if (byId("contactlessToggle")) {
        byId("contactlessToggle").focus();
      }
      alert("For privacy, enable contactless delivery and logout from profile when needed.");
      return;
    }
    if (action === "notification-preference") {
      if (byId("orderAlertsToggle")) {
        byId("orderAlertsToggle").focus();
      }
      alert("Use Order Alerts and WhatsApp Updates toggles, then click Save Preferences.");
      return;
    }
    alert("This section will be enabled in the next update.");
  }

  async function tryPlaceOrder() {
    var session = QuickMartData.getCustomerSession();
    if (!session || !session.verified) {
      state.pendingCheckout = true;
      openModal("accountModal");
      renderAccountModal();
      alert("Please login with mobile OTP first.");
      return;
    }

    var prefs = currentPreferences();
    var paymentMethod = selectedPayment();
    var paymentMeta = {
      paymentStatus: paymentMethod === "ONLINE" ? "PENDING" : "COD_PENDING",
      paymentReference: "",
      paymentProviderOrderId: ""
    };

    if (paymentMethod === "ONLINE") {
      if (!window.QuickMartPayments || typeof window.QuickMartPayments.createRazorpayOrder !== "function") {
        alert("Online payment service not available. Please choose Cash on Delivery.");
        return;
      }

      var cartDetails = QuickMartData.getCartDetails();
      if (!cartDetails || !cartDetails.canCheckout) {
        alert("Cart is not ready for checkout.");
        return;
      }

      var paymentOrder = await window.QuickMartPayments.createRazorpayOrder({
        amount: Math.round(Number(cartDetails.total || 0) * 100),
        currency: "INR",
        receipt: "QM_" + Date.now()
      });

      if (!paymentOrder || !paymentOrder.ok) {
        var paymentErrorMessage = String((paymentOrder && paymentOrder.message) || "Unable to start online payment.");
        var isBackendOffline =
          paymentErrorMessage.toLowerCase().includes("backend not connected") ||
          paymentErrorMessage.toLowerCase().includes("rpc unreachable") ||
          paymentErrorMessage.toLowerCase().includes("failed to fetch") ||
          paymentErrorMessage.toLowerCase().includes("networkerror");

        if (isBackendOffline) {
          paymentMethod = "COD";
          paymentMeta.paymentStatus = "COD_PENDING";
          paymentMeta.paymentReference = "";
          paymentMeta.paymentProviderOrderId = "";
          alert("Online payment server connected nahi hai. Order ab Cash on Delivery (COD) se place hoga.");
        } else {
          alert(paymentErrorMessage);
          return;
        }
      }

      if (paymentMethod === "ONLINE") {
        paymentMeta.paymentStatus = "CREATED";
        paymentMeta.paymentProviderOrderId = String((paymentOrder.order && paymentOrder.order.id) || "");
      }

      if (paymentMethod === "ONLINE" && window.Razorpay && paymentOrder.keyId && paymentOrder.order && paymentOrder.order.id) {
        var verification = await new Promise(function (resolve) {
          var checkout = new window.Razorpay({
            key: paymentOrder.keyId,
            amount: paymentOrder.order.amount,
            currency: paymentOrder.order.currency || "INR",
            name: "QuickMart",
            description: "QuickMart Order Payment",
            order_id: paymentOrder.order.id,
            prefill: {
              contact: session.phone || ""
            },
            handler: function (response) {
              window.QuickMartPayments.verifyRazorpayPayment(response).then(resolve, function () {
                resolve({ ok: false, message: "Payment verification failed." });
              });
            },
            modal: {
              ondismiss: function () {
                resolve({ ok: false, message: "Online payment cancelled." });
              }
            },
            theme: { color: "#0f8e47" }
          });
          checkout.open();
        });

        if (!verification || !verification.ok) {
          alert((verification && verification.message) || "Payment not completed.");
          return;
        }

        paymentMeta.paymentStatus = "PAID";
        paymentMeta.paymentReference = String(verification.paymentId || verification.razorpay_payment_id || "");
      } else if (paymentMethod === "ONLINE") {
        alert("Razorpay checkout is not loaded, order will be placed as online pending.");
      }
    }

    var response = QuickMartData.createOrder(paymentMethod, {
      deliveryNote: String(prefs.deliveryNote || ""),
      contactlessDelivery: prefs.contactlessDelivery === true,
      paymentStatus: paymentMeta.paymentStatus,
      paymentReference: paymentMeta.paymentReference,
      paymentProviderOrderId: paymentMeta.paymentProviderOrderId
    });
    if (!response.ok) {
      alert(response.message);
      if (response.message.toLowerCase().includes("address")) {
        openModal("accountModal");
        renderAccountModal();
      }
      return;
    }

    alert("Order " + response.order.id + " placed successfully.");
    state.pendingCheckout = false;
    closeModal("cartModal");
    renderSessionInfo();
    renderCart();
    renderOrders();
  }

  function bindEvents() {
    function resetSearchAndShowHome() {
      state.search = "";
      byId("searchInput").value = "";
      setActiveQuickChip("All");
      renderCategories();
      renderProducts();
    }

    byId("searchInput").addEventListener("input", function (e) {
      state.search = e.target.value;
      if (state.search.trim()) {
        state.selectedCategoryId = null;
      }
      setActiveQuickChip("All");
      renderCategories();
      renderProducts();
    });

    byId("clearSearchBtn").addEventListener("click", function () {
      resetSearchAndShowHome();
    });

    var quickManageAddressBtn = byId("quickManageAddressBtn");
    if (quickManageAddressBtn) {
      quickManageAddressBtn.addEventListener("click", function () {
        openModal("accountModal");
        renderAccountModal();
      });
    }

    var shopNowBtn = byId("shopNowBtn");
    if (shopNowBtn) {
      shopNowBtn.addEventListener("click", function () {
        resetSearchAndShowHome();
        var productsSection = byId("productsSection");
        if (productsSection && typeof productsSection.scrollIntoView === "function") {
          productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    byId("cartToggleBtn").addEventListener("click", function () {
      openModal("cartModal");
      renderCart();
    });

    var cartDockBtn = byId("cartDockBtn");
    if (cartDockBtn) {
      cartDockBtn.addEventListener("click", function () {
        openModal("cartModal");
        renderCart();
      });
    }

    var homeDockBtn = byId("homeDockBtn");
    if (homeDockBtn) {
      homeDockBtn.addEventListener("click", function (e) {
        e.preventDefault();
        resetSearchAndShowHome();
        var heroSection = byId("heroSection");
        if (heroSection && typeof heroSection.scrollIntoView === "function") {
          heroSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    var categoriesDockBtn = byId("categoriesDockBtn");
    if (categoriesDockBtn) {
      categoriesDockBtn.addEventListener("click", function (e) {
        e.preventDefault();
        resetSearchAndShowHome();
        var categorySection = byId("categorySection");
        if (categorySection && typeof categorySection.scrollIntoView === "function") {
          categorySection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    var ordersDockBtn = byId("ordersDockBtn");
    if (ordersDockBtn) {
      ordersDockBtn.addEventListener("click", function (e) {
        e.preventDefault();
        resetSearchAndShowHome();
        var ordersSection = byId("ordersSection");
        if (ordersSection && typeof ordersSection.scrollIntoView === "function") {
          ordersSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    byId("closeCartBtn").addEventListener("click", function () {
      closeModal("cartModal");
    });

    byId("accountBtn").addEventListener("click", function () {
      openModal("accountModal");
      renderAccountModal();
    });

    byId("closeAccountBtn").addEventListener("click", function () {
      closeModal("accountModal");
    });

    byId("settingsBtn").addEventListener("click", function () {
      openModal("settingsModal");
      renderSettingsModal();
    });

    var profileDockBtn = byId("profileDockBtn");
    if (profileDockBtn) {
      profileDockBtn.addEventListener("click", function () {
        openModal("settingsModal");
        renderSettingsModal();
      });
    }

    byId("closeSettingsBtn").addEventListener("click", function () {
      closeModal("settingsModal");
    });

    byId("checkoutBtn").addEventListener("click", tryPlaceOrder);

    byId("customerPhoneInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizePhoneInput(e.target.value);
    });

    byId("customerOtpInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizeDigitsInput(e.target.value).slice(0, 6);
    });

    byId("addressPincodeInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizeDigitsInput(e.target.value).slice(0, 6);
    });

    byId("customerSendOtpBtn").addEventListener("click", function () {
      var phone = QuickMartData.normalizePhoneInput(byId("customerPhoneInput").value);
      byId("customerPhoneInput").value = phone;
      QuickMartData.requestOtp(phone).then(function (result) {
        if (!result.ok) {
          alert(result.message || "Unable to send OTP.");
          return;
        }
        if (result.mode === "webhook") {
          byId("customerOtpHint").textContent = "OTP sent to your mobile number.";
        } else {
          byId("customerOtpHint").textContent = "Demo OTP: " + result.demoOtp + " (valid for 5 minutes)";
        }
      });
    });

    byId("customerVerifyOtpBtn").addEventListener("click", function () {
      var phone = QuickMartData.normalizePhoneInput(byId("customerPhoneInput").value);
      var code = QuickMartData.normalizeDigitsInput(byId("customerOtpInput").value).slice(0, 6);
      byId("customerPhoneInput").value = phone;
      byId("customerOtpInput").value = code;
      var result = QuickMartData.verifyOtp(phone, code);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      renderSessionInfo();
      renderOrders();
      renderAccountModal();
      if (state.pendingCheckout) {
        state.pendingCheckout = false;
        closeModal("accountModal");
        openModal("cartModal");
        tryPlaceOrder();
      }
    });

    byId("saveCustomerProfileBtn").addEventListener("click", function () {
      var res = QuickMartData.updateCustomerProfile({
        name: byId("customerNameInput").value.trim()
      });
      alert(res.ok ? "Profile saved." : res.message);
      renderSessionInfo();
      renderAccountModal();
    });

    byId("logoutCustomerBtn").addEventListener("click", function () {
      QuickMartData.clearCustomerSession();
      state.pendingCheckout = false;
      closeModal("accountModal");
      renderSessionInfo();
      renderOrders();
      renderSettingsModal();
    });

    var profileLogoutBtn = byId("profileLogoutBtn");
    if (profileLogoutBtn) {
      profileLogoutBtn.addEventListener("click", function () {
        QuickMartData.clearCustomerSession();
        state.pendingCheckout = false;
        renderSessionInfo();
        renderOrders();
        renderSettingsModal();
        closeModal("settingsModal");
      });
    }

    byId("saveAddressBtn").addEventListener("click", function () {
      var res = QuickMartData.addCustomerAddress({
        label: byId("addressLabelInput").value.trim(),
        line1: byId("addressLine1Input").value.trim(),
        area: byId("addressAreaInput").value.trim(),
        city: byId("addressCityInput").value.trim(),
        pincode: byId("addressPincodeInput").value.trim()
      });
      alert(res.ok ? "Address saved." : res.message);
      if (!res.ok) return;
      byId("addressLabelInput").value = "";
      byId("addressLine1Input").value = "";
      byId("addressAreaInput").value = "";
      byId("addressPincodeInput").value = "";
      renderSessionInfo();
      renderAccountModal();
    });

    byId("customerAddressList").addEventListener("click", function (e) {
      var setDefaultBtn = e.target.closest(".set-default-address");
      var deleteBtn = e.target.closest(".delete-address");

      if (setDefaultBtn) {
        var res = QuickMartData.setDefaultCustomerAddress(setDefaultBtn.getAttribute("data-id"));
        if (!res.ok) {
          alert(res.message);
        }
        renderSessionInfo();
        renderAccountModal();
      }

      if (deleteBtn) {
        var res2 = QuickMartData.deleteCustomerAddress(deleteBtn.getAttribute("data-id"));
        if (!res2.ok) {
          alert(res2.message);
        }
        renderSessionInfo();
        renderAccountModal();
      }
    });

    byId("saveSettingsBtn").addEventListener("click", function () {
      var res = QuickMartData.updateCustomerPreferences({
        language: byId("languageSelect").value,
        lowDataMode: byId("lowDataToggle").checked,
        orderAlerts: byId("orderAlertsToggle").checked,
        defaultPaymentMethod: byId("defaultPaymentSelect").value,
        contactlessDelivery: byId("contactlessToggle").checked,
        whatsappAlerts: byId("whatsappAlertsToggle").checked,
        autoOpenCartAfterAdd: byId("autoOpenCartToggle").checked,
        deliveryNote: byId("deliveryNoteInput").value.trim()
      });
      alert(res.ok ? "Settings saved." : res.message);
      if (res.ok) {
        applyPreferenceUI();
        closeModal("settingsModal");
      }
    });

    byId("settingsModal").addEventListener("click", function (e) {
      var actionButton = e.target.closest("[data-profile-action]");
      if (!actionButton) return;
      handleProfileAction(actionButton.getAttribute("data-profile-action"));
    });

    window.addEventListener("storage", function () {
      renderHeroStats();
      applyPreferenceUI();
      renderSessionInfo();
      renderCategories();
      renderCollections();
      renderProducts();
      renderCart();
      renderOrders();
    });

    document.querySelectorAll("[data-quick-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filterLabel = String(btn.getAttribute("data-quick-filter") || "").trim();
        var config = quickFilterConfig(filterLabel);
        var categoryId = findCategoryIdByName(config.categoryName);
        state.selectedCategoryId = typeof categoryId === "number" ? categoryId : null;
        state.search = String(config.search || "");
        byId("searchInput").value = state.search;
        setActiveQuickChip(filterLabel || "All");
        renderCategories();
        renderProducts();
        var categorySection = byId("categorySection");
        if (categorySection && typeof categorySection.scrollIntoView === "function") {
          categorySection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function init() {
    renderHeroStats();
    applyPreferenceUI();
    renderSessionInfo();
    renderCategories();
    renderCollections();
    renderProducts();
    renderCart();
    renderOrders();
    setActiveQuickChip("All");
    bindEvents();

    setInterval(function () {
      renderHeroStats();
      applyPreferenceUI();
      renderProducts();
      renderCart();
      renderOrders();
      renderSessionInfo();
    }, 15000);
  }

  init();
})();
