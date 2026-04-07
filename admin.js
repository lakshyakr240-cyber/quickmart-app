(function () {
  "use strict";

  var editProductId = null;
  var uploadedProductImage = "";

  function byId(id) {
    return document.getElementById(id);
  }

  function esc(v) {
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtDate(iso) {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return iso;
    }
  }

  function session() {
    return QuickMartData.getRoleSession("admin");
  }

  function setLoggedInUI(loggedIn) {
    byId("adminLoginSection").classList.toggle("hidden", loggedIn);
    byId("adminApp").classList.toggle("hidden", !loggedIn);
    byId("adminLogoutBtn").classList.toggle("hidden", !loggedIn);
    byId("adminSessionPill").textContent = loggedIn ? "Admin Active" : "Logged out";
  }

  function setProductImagePreview(src) {
    var wrap = byId("productImagePreviewWrap");
    var image = byId("productImagePreview");
    if (!src) {
      wrap.classList.add("hidden");
      image.removeAttribute("src");
      return;
    }
    image.src = src;
    wrap.classList.remove("hidden");
  }

  function currentProductImage() {
    return uploadedProductImage || byId("productImageInput").value.trim();
  }

  function analyticsCard(title, value) {
    return '<article class="stat-card"><h3>' + esc(title) + "</h3><p>" + esc(value) + "</p></article>";
  }

  function renderAnalytics(data) {
    byId("analyticsGrid").innerHTML =
      analyticsCard("Total Orders", data.analytics.totalOrders) +
      analyticsCard("Active Orders", data.analytics.activeOrders) +
      analyticsCard("Delivered", data.analytics.deliveredOrders) +
      analyticsCard("Revenue", QuickMartData.formatINR(data.analytics.revenue)) +
      analyticsCard("Avg Order", QuickMartData.formatINR(data.analytics.averageOrderValue));
  }

  function renderPricing(data) {
    byId("minOrderInput").value = data.settings.minOrderValue;
    byId("deliveryFeeInput").value = data.settings.deliveryFee;
    byId("freeThresholdInput").value = data.settings.freeDeliveryThreshold;
  }

  function renderOtpSettings(data) {
    byId("otpModeInput").value = String(data.settings.otpMode || "demo");
    byId("otpWebhookInput").value = String(data.settings.otpWebhookUrl || "");
    byId("otpWebhookInput").disabled = byId("otpModeInput").value !== "webhook";
  }

  function renderOrders(data) {
    if (!data.orders.length) {
      byId("ordersTableWrap").innerHTML = '<p class="muted" style="padding:8px">No orders yet.</p>';
      return;
    }

    var partnerOptions = data.deliveryPartners
      .map(function (p) {
        return '<option value="' + p.id + '" ' + (p.isActive ? "" : "disabled") + ">" +
          esc(p.name) +
          " (" +
          esc(p.phone) +
          ")" +
          (p.isActive ? "" : " - Inactive") +
          "</option>";
      })
      .join("");

    var rows = data.orders
      .map(function (order) {
        var orderItems = order.items.map(function (i) { return esc(i.name) + " x" + i.qty; }).join(", ");
        var selectedPartnerId = order.assignedDeliveryPartnerId ? String(order.assignedDeliveryPartnerId) : "";
        var assignCell =
          '<div class="inline-row"><select data-order="' +
          order.id +
          '" class="assign-select"><option value="">Select</option>' +
          partnerOptions +
          '</select><button class="btn assign-btn" data-order="' +
          order.id +
          '" type="button">' +
          (selectedPartnerId ? "Reassign" : "Assign") +
          "</button></div>";

        var rowHtml = (
          "<tr>" +
          "<td><strong>" +
          esc(order.id) +
          "</strong><br/><span class='muted'>" +
          esc(order.customerPhone) +
          "</span></td>" +
          "<td>" +
          esc(orderItems) +
          "</td>" +
          "<td><span class='status-badge'>" +
          esc(order.status) +
          "</span></td>" +
          "<td>" +
          QuickMartData.formatINR(order.total) +
          "</td>" +
          "<td>" +
          esc(order.paymentMethod) +
          "</td>" +
          "<td>" +
          esc(order.partnerName) +
          (order.partnerPhone ? "<br/><span class='muted'>" + esc(order.partnerPhone) + "</span>" : "") +
          "</td>" +
          "<td>" +
          assignCell +
          "</td>" +
          "<td>" +
          fmtDate(order.createdAt) +
          "</td>" +
          "</tr>"
        );
        if (selectedPartnerId) {
          rowHtml = rowHtml.replace('value="' + selectedPartnerId + '"', 'value="' + selectedPartnerId + '" selected');
        }
        return rowHtml;
      })
      .join("");

    byId("ordersTableWrap").innerHTML =
      '<table><thead><tr><th>Order</th><th>Items</th><th>Status</th><th>Total</th><th>Payment</th><th>Delivery</th><th>Assign</th><th>Created</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>";
  }

  function renderCategories(data) {
    var list = data.categories
      .map(function (c) {
        return (
          '<div class="inline-row"><span>' +
          esc(c.name) +
          '</span><button class="action-link delete-category" data-id="' +
          c.id +
          '" type="button">Delete</button></div>'
        );
      })
      .join("");
    byId("categoriesWrap").innerHTML = list || '<p class="muted">No categories</p>';

    var options = data.categories
      .map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.name) + "</option>";
      })
      .join("");
    byId("productCategoryInput").innerHTML = options;
  }

  function renderProducts(data) {
    if (!data.products.length) {
      byId("productsTableWrap").innerHTML = '<p class="muted" style="padding:8px">No products yet.</p>';
      return;
    }

    var rows = data.products
      .map(function (p) {
        return (
          "<tr>" +
          "<td>" +
          esc(p.name) +
          "</td>" +
          "<td><img src='" +
          esc(p.image) +
          "' alt='" +
          esc(p.name) +
          "' style='width:42px;height:42px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0'/></td>" +
          "<td>" +
          esc(p.weight) +
          "</td>" +
          "<td>" +
          esc(p.categoryName) +
          "</td>" +
          "<td>" +
          QuickMartData.formatINR(p.price) +
          "</td>" +
          "<td>" +
          (p.inStock ? "In Stock" : "Out") +
          "</td>" +
          "<td><div class='inline-row'><button class='action-link edit-product' data-id='" +
          p.id +
          "' type='button'>Edit</button><button class='action-link delete-product' data-id='" +
          p.id +
          "' type='button'>Delete</button></div></td>" +
          "</tr>"
        );
      })
      .join("");

    byId("productsTableWrap").innerHTML =
      '<table><thead><tr><th>Name</th><th>Image</th><th>Weight</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>";
  }

  function renderUsers(data) {
    var rows = (data.users || [])
      .map(function (u) {
        return (
          "<tr><td>" +
          esc(u.phone) +
          "</td><td>" +
          u.totalOrders +
          "</td><td>" +
          (u.isActive ? "Active" : "Blocked") +
          "</td><td>" +
          fmtDate(u.lastOrderAt) +
          "</td><td><button class='action-link toggle-user' data-id='" +
          u.id +
          "' data-active='" +
          (u.isActive ? "1" : "0") +
          "' type='button'>" +
          (u.isActive ? "Block" : "Unblock") +
          "</button></td></tr>"
        );
      })
      .join("");
    byId("usersTableWrap").innerHTML =
      '<table><thead><tr><th>Phone</th><th>Total Orders</th><th>Status</th><th>Last Order</th><th>Action</th></tr></thead><tbody>' +
      (rows || "<tr><td colspan='5'>No users yet.</td></tr>") +
      "</tbody></table>";
  }

  function renderVendors(data) {
    var rows = data.vendors
      .map(function (v) {
        return (
          "<tr><td>" +
          esc(v.name) +
          "</td><td>" +
          esc(v.phone) +
          "</td><td>" +
          (v.isActive ? "Active" : "Inactive") +
          "</td><td><button class='action-link toggle-vendor' data-id='" +
          v.id +
          "' data-active='" +
          (v.isActive ? "1" : "0") +
          "' type='button'>" +
          (v.isActive ? "Disable" : "Enable") +
          "</button></td></tr>"
        );
      })
      .join("");
    byId("vendorsTableWrap").innerHTML =
      '<table><thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead><tbody>' + rows + "</tbody></table>";
  }

  function renderDelivery(data) {
    var rows = data.deliveryPartners
      .map(function (d) {
        return (
          "<tr><td>" +
          esc(d.name) +
          "</td><td>" +
          esc(d.phone) +
          "</td><td>" +
          (d.isActive ? "Active" : "Inactive") +
          "</td><td><button class='action-link toggle-delivery' data-id='" +
          d.id +
          "' data-active='" +
          (d.isActive ? "1" : "0") +
          "' type='button'>" +
          (d.isActive ? "Disable" : "Enable") +
          "</button></td></tr>"
        );
      })
      .join("");
    byId("deliveryTableWrap").innerHTML =
      '<table><thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead><tbody>' + rows + "</tbody></table>";
  }

  function resetProductForm() {
    editProductId = null;
    uploadedProductImage = "";
    byId("productFormTitle").textContent = "Add Product";
    byId("productForm").reset();
    byId("productImageFileInput").value = "";
    byId("productStockInput").checked = true;
    setProductImagePreview("");
    byId("cancelProductEditBtn").classList.add("hidden");
  }

  function renderAll() {
    var data = QuickMartData.getAdminDashboard();
    renderAnalytics(data);
    renderPricing(data);
    renderOtpSettings(data);
    renderOrders(data);
    renderCategories(data);
    renderProducts(data);
    renderUsers(data);
    renderVendors(data);
    renderDelivery(data);
  }

  function bindEvents() {
    byId("adminLoginBtn").addEventListener("click", function () {
      var email = byId("adminEmailInput").value.trim();
      var password = byId("adminPasswordInput").value.trim();
      var res = QuickMartData.loginAdmin(email, password);
      if (!res.ok) {
        alert(res.message);
        return;
      }
      setLoggedInUI(true);
      resetProductForm();
      renderAll();
    });

    [byId("adminEmailInput"), byId("adminPasswordInput")].forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          byId("adminLoginBtn").click();
        }
      });
    });

    byId("adminLogoutBtn").addEventListener("click", function () {
      QuickMartData.clearRoleSession("admin");
      setLoggedInUI(false);
    });

    byId("pricingForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var res = QuickMartData.updatePricingSettings({
        minOrderValue: Number(byId("minOrderInput").value),
        deliveryFee: Number(byId("deliveryFeeInput").value),
        freeDeliveryThreshold: Number(byId("freeThresholdInput").value)
      });
      alert(res.ok ? "Pricing updated." : res.message);
      renderAll();
    });

    byId("otpForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var res = QuickMartData.updateOtpSettings({
        otpMode: byId("otpModeInput").value,
        otpWebhookUrl: byId("otpWebhookInput").value.trim()
      });
      alert(res.ok ? "OTP settings saved." : res.message);
      renderAll();
    });

    byId("otpModeInput").addEventListener("change", function () {
      byId("otpWebhookInput").disabled = byId("otpModeInput").value !== "webhook";
    });

    byId("categoryForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var res = QuickMartData.addCategory(byId("categoryNameInput").value.trim());
      alert(res.ok ? "Category added." : res.message);
      if (res.ok) byId("categoryNameInput").value = "";
      renderAll();
    });

    byId("categoriesWrap").addEventListener("click", function (e) {
      var btn = e.target.closest(".delete-category");
      if (!btn) return;
      var id = Number(btn.getAttribute("data-id"));
      var res = QuickMartData.deleteCategory(id);
      alert(res.ok ? "Category removed." : res.message);
      renderAll();
    });

    byId("productForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var payload = {
        name: byId("productNameInput").value.trim(),
        weight: byId("productWeightInput").value.trim(),
        price: Number(byId("productPriceInput").value),
        categoryId: Number(byId("productCategoryInput").value),
        image: currentProductImage(),
        inStock: byId("productStockInput").checked
      };
      var res = editProductId ? QuickMartData.updateProduct(editProductId, payload) : QuickMartData.addProduct(payload);
      alert(res.ok ? "Product saved." : res.message);
      if (res.ok) resetProductForm();
      renderAll();
    });

    byId("cancelProductEditBtn").addEventListener("click", resetProductForm);

    byId("productImageInput").addEventListener("input", function () {
      var imageUrl = byId("productImageInput").value.trim();
      if (imageUrl) {
        uploadedProductImage = "";
        byId("productImageFileInput").value = "";
      }
      setProductImagePreview(imageUrl);
    });

    byId("productImageFileInput").addEventListener("change", function () {
      var file = byId("productImageFileInput").files && byId("productImageFileInput").files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        uploadedProductImage = String(reader.result || "");
        byId("productImageInput").value = "";
        setProductImagePreview(uploadedProductImage);
      };
      reader.readAsDataURL(file);
    });

    byId("clearProductImageBtn").addEventListener("click", function () {
      uploadedProductImage = "";
      byId("productImageInput").value = "";
      byId("productImageFileInput").value = "";
      setProductImagePreview("");
    });

    byId("productsTableWrap").addEventListener("click", function (e) {
      var editBtn = e.target.closest(".edit-product");
      var delBtn = e.target.closest(".delete-product");
      var data = QuickMartData.getAdminDashboard();

      if (editBtn) {
        var id = Number(editBtn.getAttribute("data-id"));
        var product = data.products.find(function (p) { return p.id === id; });
        if (!product) return;
        editProductId = product.id;
        byId("productFormTitle").textContent = "Edit Product";
        byId("productNameInput").value = product.name;
        byId("productWeightInput").value = product.weight;
        byId("productPriceInput").value = product.price;
        byId("productCategoryInput").value = String(product.categoryId);
        uploadedProductImage = "";
        byId("productImageFileInput").value = "";
        if (String(product.image || "").startsWith("data:")) {
          byId("productImageInput").value = "";
        } else {
          byId("productImageInput").value = product.image;
        }
        setProductImagePreview(product.image);
        byId("productStockInput").checked = !!product.inStock;
        byId("cancelProductEditBtn").classList.remove("hidden");
        return;
      }

      if (delBtn) {
        var deleteId = Number(delBtn.getAttribute("data-id"));
        var res = QuickMartData.deleteProduct(deleteId);
        alert(res.ok ? "Product deleted." : res.message);
        renderAll();
      }
    });

    byId("ordersTableWrap").addEventListener("click", function (e) {
      var assignBtn = e.target.closest(".assign-btn");
      if (!assignBtn) return;
      var orderId = assignBtn.getAttribute("data-order");
      var select = byId("ordersTableWrap").querySelector('select[data-order="' + orderId + '"]');
      var partnerId = Number(select && select.value);
      if (!partnerId) {
        alert("Select a delivery partner first.");
        return;
      }
      var res = QuickMartData.assignDelivery(orderId, partnerId, session() ? session().id : null);
      alert(res.ok ? "Delivery partner assigned." : res.message);
      renderAll();
    });

    byId("vendorForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var res = QuickMartData.addVendor({
        name: byId("vendorNameInput").value.trim(),
        phone: QuickMartData.normalizePhoneInput(byId("vendorPhoneInput").value),
        pin: QuickMartData.normalizePinInput(byId("vendorPinInput").value).slice(0, 4)
      });
      alert(res.ok ? "Vendor added." : res.message);
      if (res.ok) byId("vendorForm").reset();
      renderAll();
    });

    byId("deliveryForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var res = QuickMartData.addDeliveryPartner({
        name: byId("deliveryNameInput").value.trim(),
        phone: QuickMartData.normalizePhoneInput(byId("deliveryPhoneInput").value),
        pin: QuickMartData.normalizePinInput(byId("deliveryPinInput").value).slice(0, 4)
      });
      alert(res.ok ? "Delivery partner added." : res.message);
      if (res.ok) byId("deliveryForm").reset();
      renderAll();
    });

    byId("vendorPhoneInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizePhoneInput(e.target.value);
    });

    byId("vendorPinInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizePinInput(e.target.value).slice(0, 4);
    });

    byId("deliveryPhoneInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizePhoneInput(e.target.value);
    });

    byId("deliveryPinInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizePinInput(e.target.value).slice(0, 4);
    });

    byId("vendorsTableWrap").addEventListener("click", function (e) {
      var btn = e.target.closest(".toggle-vendor");
      if (!btn) return;
      var id = Number(btn.getAttribute("data-id"));
      var active = btn.getAttribute("data-active") === "1";
      QuickMartData.toggleVendorActive(id, !active);
      renderAll();
    });

    byId("deliveryTableWrap").addEventListener("click", function (e) {
      var btn = e.target.closest(".toggle-delivery");
      if (!btn) return;
      var id = Number(btn.getAttribute("data-id"));
      var active = btn.getAttribute("data-active") === "1";
      QuickMartData.toggleDeliveryPartnerActive(id, !active);
      renderAll();
    });

    byId("usersTableWrap").addEventListener("click", function (e) {
      var btn = e.target.closest(".toggle-user");
      if (!btn) return;
      var id = Number(btn.getAttribute("data-id"));
      var active = btn.getAttribute("data-active") === "1";
      var res = QuickMartData.toggleUserActive(id, !active);
      if (!res.ok) {
        alert(res.message);
      }
      renderAll();
    });

    window.addEventListener("storage", function () {
      if (session()) renderAll();
    });
  }

  function init() {
    bindEvents();
    var s = session();
    if (s) {
      setLoggedInUI(true);
      renderAll();
    } else {
      setLoggedInUI(false);
    }

    setInterval(function () {
      if (session()) renderAll();
    }, 12000);
  }

  init();
})();

