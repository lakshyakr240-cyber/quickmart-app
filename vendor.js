(function () {
  "use strict";

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
    return QuickMartData.getRoleSession("vendor");
  }

  function setLoggedInUI(on) {
    byId("vendorLoginSection").classList.toggle("hidden", on);
    byId("vendorApp").classList.toggle("hidden", !on);
    byId("vendorLogoutBtn").classList.toggle("hidden", !on);
    byId("vendorSessionPill").textContent = on && session() ? session().name : "Logged out";
  }

  function renderProducts(data) {
    if (!data.products.length) {
      byId("vendorProductsWrap").innerHTML = '<p class="muted" style="padding:8px">No products.</p>';
      return;
    }

    var rows = data.products
      .map(function (p) {
        return (
          "<tr>" +
          "<td>" +
          esc(p.name) +
          "</td><td>" +
          esc(p.weight) +
          "</td><td>" +
          esc(p.categoryName) +
          "</td><td>" +
          QuickMartData.formatINR(p.price) +
          "</td><td>" +
          (p.inStock ? "In Stock" : "Out") +
          "</td><td><button class='btn toggle-stock-btn' data-id='" +
          p.id +
          "' data-stock='" +
          (p.inStock ? "1" : "0") +
          "' type='button'>" +
          (p.inStock ? "Set Out" : "Set In") +
          "</button></td></tr>"
        );
      })
      .join("");

    byId("vendorProductsWrap").innerHTML =
      '<table><thead><tr><th>Name</th><th>Weight</th><th>Category</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>";
  }

  function renderPendingOrders(data) {
    if (!data.pendingOrders.length) {
      byId("vendorPendingOrdersWrap").innerHTML = '<p class="muted" style="padding:8px">No new orders.</p>';
      return;
    }

    var rows = data.pendingOrders
      .map(function (o) {
        var items = o.items.map(function (i) { return esc(i.name) + " x" + i.qty; }).join(", ");
        return (
          "<tr><td><strong>" +
          esc(o.id) +
          "</strong><br/><span class='muted'>" +
          esc(o.customerPhone) +
          "</span></td><td>" +
          esc(items) +
          "</td><td>" +
          QuickMartData.formatINR(o.total) +
          "</td><td><div class='inline-row'><button class='btn accept-order-btn' data-id='" +
          o.id +
          "' type='button'>Accept</button><button class='btn btn-danger reject-order-btn' data-id='" +
          o.id +
          "' type='button'>Reject</button></div></td></tr>"
        );
      })
      .join("");

    byId("vendorPendingOrdersWrap").innerHTML =
      '<table><thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Action</th></tr></thead><tbody>' + rows + "</tbody></table>";
  }

  function renderRecentOrders(data) {
    if (!data.recentOrders.length) {
      byId("vendorRecentOrdersWrap").innerHTML = '<p class="muted" style="padding:8px">No recent orders.</p>';
      return;
    }

    var rows = data.recentOrders
      .map(function (o) {
        return (
          "<tr><td>" +
          esc(o.id) +
          "</td><td>" +
          esc(o.status) +
          "</td><td>" +
          esc(o.partnerName) +
          "</td><td>" +
          fmtDate(o.updatedAt || o.createdAt) +
          "</td></tr>"
        );
      })
      .join("");

    byId("vendorRecentOrdersWrap").innerHTML =
      '<table><thead><tr><th>Order</th><th>Status</th><th>Delivery</th><th>Updated</th></tr></thead><tbody>' + rows + "</tbody></table>";
  }

  function renderAll() {
    var s = session();
    if (!s) return;
    var data = QuickMartData.getVendorPanelData(s.id);
    renderProducts(data);
    renderPendingOrders(data);
    renderRecentOrders(data);
  }

  function bindEvents() {
    byId("vendorLoginBtn").addEventListener("click", function () {
      var phone = QuickMartData.normalizePhoneInput(byId("vendorPhoneInput").value);
      var pin = QuickMartData.normalizePinInput(byId("vendorPinInput").value).slice(0, 4);
      byId("vendorPhoneInput").value = phone;
      byId("vendorPinInput").value = pin;
      var res = QuickMartData.loginVendor(phone, pin);
      if (!res.ok) {
        alert(res.message);
        return;
      }
      setLoggedInUI(true);
      renderAll();
    });

    byId("vendorLogoutBtn").addEventListener("click", function () {
      QuickMartData.clearRoleSession("vendor");
      setLoggedInUI(false);
    });

    byId("vendorRestoreDemoBtn").addEventListener("click", function () {
      byId("vendorPhoneInput").value = "9001001001";
      byId("vendorPinInput").value = "1111";
      byId("vendorLoginBtn").click();
    });

    byId("vendorProductsWrap").addEventListener("click", function (e) {
      var btn = e.target.closest(".toggle-stock-btn");
      if (!btn || !session()) return;
      var id = Number(btn.getAttribute("data-id"));
      var stock = btn.getAttribute("data-stock") === "1";
      var res = QuickMartData.setProductStock(id, !stock, session().id);
      if (!res.ok) alert(res.message);
      renderAll();
    });

    byId("vendorPendingOrdersWrap").addEventListener("click", function (e) {
      var accept = e.target.closest(".accept-order-btn");
      var reject = e.target.closest(".reject-order-btn");
      if (!session()) return;

      if (accept) {
        var orderId = accept.getAttribute("data-id");
        var r1 = QuickMartData.vendorDecision(orderId, true, session().id);
        if (!r1.ok) alert(r1.message);
        renderAll();
      }

      if (reject) {
        var orderId2 = reject.getAttribute("data-id");
        var r2 = QuickMartData.vendorDecision(orderId2, false, session().id);
        if (!r2.ok) alert(r2.message);
        renderAll();
      }
    });

    window.addEventListener("storage", function () {
      if (session()) renderAll();
    });

    byId("vendorPhoneInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizePhoneInput(e.target.value);
    });

    byId("vendorPinInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizePinInput(e.target.value).slice(0, 4);
    });

    [byId("vendorPhoneInput"), byId("vendorPinInput")].forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          byId("vendorLoginBtn").click();
        }
      });
    });
  }

  function init() {
    bindEvents();
    if (session()) {
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

