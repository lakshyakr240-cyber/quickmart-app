(function () {
  "use strict";

  if (!window.QuickMartData) {
    return;
  }

  var API_BASE_KEY = "quickmart_api_base_url_v1";
  var CLIENT_ID_KEY = "quickmart_client_id_v1";

  function randomId() {
    return "cli_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function runtimeApiBase() {
    var configured = String(window.QUICKMART_API_BASE || "").trim();
    if (!configured) return "";
    return configured.replace(/\/$/, "");
  }

  function explicitApiBase() {
    return String(runtimeApiBase() || window.localStorage.getItem(API_BASE_KEY) || "").trim();
  }

  function rpcEnabled() {
    var protocol = window.location && window.location.protocol ? window.location.protocol : "";
    if (protocol === "file:" && !explicitApiBase()) {
      return false;
    }
    return true;
  }

  function getClientId() {
    var id = window.localStorage.getItem(CLIENT_ID_KEY);
    if (id) return id;
    id = randomId();
    window.localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  }

  function defaultApiBase() {
    var configured = runtimeApiBase();
    if (configured) {
      return configured;
    }

    var origin = window.location && window.location.origin ? window.location.origin : "";
    if (origin && origin !== "null" && /^https?:/i.test(origin)) {
      if (/^https?:\/\/localhost(?::\d+)?$/i.test(origin) || /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin)) {
        return "http://localhost:8787";
      }
      return origin.replace(/\/$/, "");
    }
    return "http://localhost:8787";
  }

  function getApiBase() {
    return window.localStorage.getItem(API_BASE_KEY) || defaultApiBase();
  }

  function setApiBase(url) {
    var clean = String(url || "").trim();
    if (!clean) return;
    window.localStorage.setItem(API_BASE_KEY, clean.replace(/\/$/, ""));
  }

  function rpcSync(method, args) {
    if (!rpcEnabled()) {
      return { ok: false, message: "RPC disabled in file mode" };
    }
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", getApiBase() + "/api/rpc", false);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("x-client-id", getClientId());
      xhr.send(JSON.stringify({ method: method, args: args || [] }));
      if (xhr.status < 200 || xhr.status >= 300) {
        return { ok: false, message: "RPC HTTP " + xhr.status };
      }
      var payload = JSON.parse(xhr.responseText || "{}");
      if (!payload || payload.ok !== true) {
        return { ok: false, message: payload && payload.message ? payload.message : "RPC failed" };
      }
      return { ok: true, result: payload.result };
    } catch (error) {
      return { ok: false, message: error.message || "RPC unreachable" };
    }
  }

  function rpcAsync(method, args) {
    if (!rpcEnabled()) {
      return Promise.resolve({ ok: false, message: "RPC disabled in file mode" });
    }
    return fetch(getApiBase() + "/api/rpc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": getClientId()
      },
      body: JSON.stringify({ method: method, args: args || [] })
    })
      .then(function (res) {
        return res.json()["catch"](function () {
          return { ok: false, message: "Invalid RPC JSON" };
        });
      })
      .then(function (payload) {
        if (!payload || payload.ok !== true) {
          return { ok: false, message: payload && payload.message ? payload.message : "RPC failed" };
        }
        return { ok: true, result: payload.result };
      })
      ["catch"](function (error) {
        return { ok: false, message: error.message || "RPC unreachable" };
      });
  }

  function postJsonAsync(path, payload) {
    if (!rpcEnabled()) {
      return Promise.resolve({ ok: false, message: "Backend not connected." });
    }
    return fetch(getApiBase() + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": getClientId()
      },
      body: JSON.stringify(payload || {})
    }).then(function (res) {
      return res.json()["catch"](function () {
        return { ok: false, message: "Invalid JSON response." };
      });
    });
  }

  var overrideMethods = [
    "getState",
    "getProducts",
    "getCategories",
    "getSettings",
    "getCart",
    "setCart",
    "addToCart",
    "updateCartItem",
    "clearCart",
    "getCartDetails",
    "calculateDeliverySummary",
    "getCustomerSession",
    "setCustomerSession",
    "clearCustomerSession",
    "createOtp",
    "verifyOtp",
    "loginAdmin",
    "loginVendor",
    "loginDelivery",
    "getRoleSession",
    "clearRoleSession",
    "createOrder",
    "getOrders",
    "getDeliveryPartners",
    "getCustomerOrders",
    "getCustomerProfile",
    "updateCustomerProfile",
    "addCustomerAddress",
    "deleteCustomerAddress",
    "setDefaultCustomerAddress",
    "updateCustomerPreferences",
    "vendorDecision",
    "setProductStock",
    "assignDelivery",
    "markPickedUp",
    "markDelivered",
    "addCategory",
    "deleteCategory",
    "addProduct",
    "updateProduct",
    "deleteProduct",
    "updatePricingSettings",
    "updateOtpSettings",
    "addVendor",
    "addDeliveryPartner",
    "toggleUserActive",
    "toggleVendorActive",
    "toggleDeliveryPartnerActive",
    "getAdminDashboard",
    "getVendorPanelData",
    "getDeliveryPanelData",
    "resetAllData"
  ];

  overrideMethods.forEach(function (methodName) {
    var original = window.QuickMartData[methodName];
    if (typeof original !== "function") return;

    window.QuickMartData[methodName] = function () {
      var args = Array.prototype.slice.call(arguments);
      var remote = rpcSync(methodName, args);
      if (remote.ok) {
        return remote.result;
      }
      return original.apply(window.QuickMartData, args);
    };
  });

  var originalRequestOtp = window.QuickMartData.requestOtp;
  if (typeof originalRequestOtp === "function") {
    window.QuickMartData.requestOtp = function () {
      var args = Array.prototype.slice.call(arguments);
      return rpcAsync("requestOtp", args).then(function (remote) {
        if (remote.ok) {
          return remote.result;
        }
        return originalRequestOtp.apply(window.QuickMartData, args);
      });
    };
  }

  window.QuickMartApiBridge = {
    getApiBase: getApiBase,
    setApiBase: setApiBase,
    getClientId: getClientId,
    rpcSync: rpcSync,
    rpcAsync: rpcAsync
  };

  window.QuickMartPayments = {
    createRazorpayOrder: function (payload) {
      return postJsonAsync("/api/payments/razorpay/order", payload);
    },
    verifyRazorpayPayment: function (payload) {
      return postJsonAsync("/api/payments/razorpay/verify", payload);
    }
  };
})();
