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
    return QuickMartData.getRoleSession("delivery");
  }

  function setLoggedInUI(on) {
    byId("deliveryLoginSection").classList.toggle("hidden", on);
    byId("deliveryApp").classList.toggle("hidden", !on);
    byId("deliveryLogoutBtn").classList.toggle("hidden", !on);
    byId("deliverySwitchBtn").classList.toggle("hidden", !on);
    byId("deliverySessionPill").textContent = on && session() ? session().name : "Logged out";
  }

  function loginWith(phone, pin) {
    byId("deliveryPhoneInput").value = QuickMartData.normalizePhoneInput(phone || "");
    byId("deliveryPinInput").value = QuickMartData.normalizePinInput(pin || "").slice(0, 4);
    byId("deliveryLoginBtn").click();
  }

  function renderPartnerQuickList() {
    var wrap = byId("deliveryPartnerQuickList");
    if (!wrap) return;
    var partners = QuickMartData.getDeliveryPartners().filter(function (partner) {
      return partner && partner.isActive;
    });
    if (!partners.length) {
      wrap.innerHTML = '<span class="muted">No active delivery partner found.</span>';
      return;
    }
    wrap.innerHTML = partners
      .map(function (partner) {
        return (
          '<button class="btn btn-secondary auto-partner-login" type="button" data-phone="' +
          esc(partner.phone) +
          '" data-pin="' +
          esc(partner.pin) +
          '">' +
          esc(partner.name) +
          "</button>"
        );
      })
      .join("");
  }

  function renderAssigned(data) {
    if (!data.assignedOrders.length) {
      byId("assignedOrdersWrap").innerHTML = '<p class="muted" style="padding:8px">No assigned orders right now.</p>';
      return;
    }

    var rows = data.assignedOrders
      .map(function (order) {
        var items = order.items.map(function (i) { return esc(i.name) + " x" + i.qty; }).join(", ");
        var action = "<span class='muted'>Waiting</span>";
        var deliveryStatusLabel = order.status === "Out for Delivery" ? "Picked Up" : order.status;

        if (order.status === "Ready for Pickup") {
          action = '<button class="btn pickup-btn" data-id="' + order.id + '" type="button">Mark Picked Up</button>';
        } else if (order.status === "Out for Delivery") {
          action = '<button class="btn" data-id="' + order.id + '" type="button">Mark Delivered</button>';
        }

        return (
          "<tr><td><strong>" +
          esc(order.id) +
          "</strong><br/><span class='muted'>" +
          esc(order.customerPhone) +
          "</span></td><td>" +
          esc(items) +
          "</td><td>" +
          esc(deliveryStatusLabel) +
          "</td><td>" +
          esc(order.estimatedDeliveryText || "20-30 minutes") +
          "</td><td>" +
          action +
          "</td></tr>"
        );
      })
      .join("");

    byId("assignedOrdersWrap").innerHTML =
      '<table><thead><tr><th>Order</th><th>Items</th><th>Status</th><th>ETA</th><th>Action</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>";

    byId("assignedOrdersWrap").querySelectorAll("button[data-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!session()) return;
        var id = btn.getAttribute("data-id");
        var isPickup = btn.classList.contains("pickup-btn");
        var result = isPickup
          ? QuickMartData.markPickedUp(id, session().id)
          : QuickMartData.markDelivered(id, session().id);

        if (!result.ok) alert(result.message);
        renderAll();
      });
    });
  }

  function renderDelivered(data) {
    if (!data.recentDelivered.length) {
      byId("deliveredOrdersWrap").innerHTML = '<p class="muted" style="padding:8px">No deliveries completed yet.</p>';
      return;
    }

    var rows = data.recentDelivered
      .map(function (order) {
        return (
          "<tr><td>" +
          esc(order.id) +
          "</td><td>" +
          QuickMartData.formatINR(order.total) +
          "</td><td>" +
          fmtDate(order.deliveredAt || order.updatedAt) +
          "</td></tr>"
        );
      })
      .join("");

    byId("deliveredOrdersWrap").innerHTML =
      '<table><thead><tr><th>Order</th><th>Total</th><th>Delivered At</th></tr></thead><tbody>' + rows + "</tbody></table>";
  }

  function renderAll() {
    var s = session();
    if (!s) return;
    var data = QuickMartData.getDeliveryPanelData(s.id);
    renderAssigned(data);
    renderDelivered(data);
  }

  function bindEvents() {
    byId("deliveryLoginBtn").addEventListener("click", function () {
      var phone = QuickMartData.normalizePhoneInput(byId("deliveryPhoneInput").value);
      var pin = QuickMartData.normalizePinInput(byId("deliveryPinInput").value).slice(0, 4);
      byId("deliveryPhoneInput").value = phone;
      byId("deliveryPinInput").value = pin;
      var res = QuickMartData.loginDelivery(phone, pin);
      if (!res.ok) {
        alert(res.message);
        return;
      }
      setLoggedInUI(true);
      renderPartnerQuickList();
      renderAll();
    });

    byId("deliveryLogoutBtn").addEventListener("click", function () {
      QuickMartData.clearRoleSession("delivery");
      setLoggedInUI(false);
      renderPartnerQuickList();
    });

    byId("deliverySwitchBtn").addEventListener("click", function () {
      QuickMartData.clearRoleSession("delivery");
      setLoggedInUI(false);
      renderPartnerQuickList();
      byId("deliveryPhoneInput").focus();
    });

    byId("deliveryQuickRaviBtn").addEventListener("click", function () {
      loginWith("9111100011", "3333");
    });

    byId("deliveryQuickAmanBtn").addEventListener("click", function () {
      loginWith("9111100022", "4444");
    });

    byId("deliveryPartnerQuickList").addEventListener("click", function (e) {
      var button = e.target.closest(".auto-partner-login");
      if (!button) return;
      loginWith(button.getAttribute("data-phone"), button.getAttribute("data-pin"));
    });

    window.addEventListener("storage", function () {
      renderPartnerQuickList();
      if (session()) renderAll();
    });

    byId("deliveryPhoneInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizePhoneInput(e.target.value);
    });

    byId("deliveryPinInput").addEventListener("input", function (e) {
      e.target.value = QuickMartData.normalizePinInput(e.target.value).slice(0, 4);
    });

    [byId("deliveryPhoneInput"), byId("deliveryPinInput")].forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          byId("deliveryLoginBtn").click();
        }
      });
    });
  }

  function init() {
    bindEvents();
    renderPartnerQuickList();
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

