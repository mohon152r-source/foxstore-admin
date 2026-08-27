// Fox Store — Admin panel API client + helpers
// Token-based auth: JWT in localStorage only (no password cookie).

// API base: live from config.js
function getApiBase() {
  try {
    if (typeof window !== "undefined" && typeof window.getApiBase === "function" && window.getApiBase !== getApiBase) {
      return String(window.getApiBase() || "").replace(/\/$/, "");
    }
    if (typeof window !== "undefined" && window.DFOX_API_BASE) {
      return String(window.DFOX_API_BASE).replace(/\/$/, "");
    }
  } catch (e) {}
  try {
    var saved = localStorage.getItem("dfox_api_base");
    if (saved && !/onrender\.com/i.test(saved)) return saved.replace(/\/$/, "");
  } catch (e) {}
  return "https://foxstore-api.mohon153r.workers.dev";
}
var API_BASE = getApiBase();

/** Relative page URL — works whether root is / or /admin/ */
function pageUrl(file) {
  file = file || "index.html";
  file = String(file).replace(/^\/admin\//, "").replace(/^\//, "");
  if (file && file.indexOf(".html") === -1 && file.indexOf("?") === -1 && file.indexOf("#") === -1) {
    file = file + ".html";
  }
  return file;
}
var TOKEN_KEY = "dfox_admin_token";
var USER_KEY = "dfox_admin_user";

function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } }
function setUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

function showToast(msg, type) {
  type = type || "success";
  if (type === "fail") type = "error";
  if (type === "warn") type = "warning";
  var wrap = document.getElementById("toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "toast-wrap";
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  var t = document.createElement("div");
  t.className = "toast " + type;
  t.setAttribute("role", "status");
  t.textContent = String(msg == null ? "" : msg);
  wrap.appendChild(t);
  var ms = type === "error" ? 4500 : 3200;
  setTimeout(function () {
    t.style.opacity = "0";
    t.style.transform = "translateY(-6px)";
    t.style.transition = "opacity .2s, transform .2s";
    setTimeout(function () { t.remove(); }, 220);
  }, ms);
}

function esc(s) {
  if (s === null || s === undefined) return "";
  var div = document.createElement("div");
  div.textContent = String(s);
  return div.innerHTML;
}

async function api(endpoint, opts) {
  opts = opts || {};
  var method = (opts.method || "GET").toUpperCase();

  var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  var token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  var body = undefined;
  if (opts.body !== undefined) {
    body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }

  return doFetch(endpoint, method, headers, body);
}

/** Password visibility toggle — wraps an input with an eye button. */

/** Password strength 0–4 (min length 4). */

/** Accent color for log/action labels */
function logAccent(action) {
  var a = String(action || "").toLowerCase();
  if (/fail|error|ban|delete|revoke|denied|invalid/.test(a)) return "#f87171";
  if (/pause|warn|expire|disable/.test(a)) return "#fbbf24";
  if (/create|generat|success|verif|login_success|resume|unban|active|recharge/.test(a)) return "#34d399";
  if (/extend|update|edit|patch|transfer/.test(a)) return "#60a5fa";
  if (/trial/.test(a)) return "#c084fc";
  if (/unbind|reset|hwid/.test(a)) return "#fb7185";
  return "#a1a1aa";
}

function logIcon(action) {
  var a = String(action || "").toLowerCase();
  if (/delete|revoke/.test(a)) return "🗑";
  if (/ban/.test(a)) return "🚫";
  if (/pause/.test(a)) return "⏸";
  if (/resume|unban|active/.test(a)) return "▶";
  if (/create|generat/.test(a)) return "✨";
  if (/verif|login/.test(a)) return "✅";
  if (/fail|error|denied/.test(a)) return "⚠";
  if (/extend/.test(a)) return "⏱";
  if (/reset|unbind|hwid/.test(a)) return "🔄";
  if (/recharge|wallet|transfer/.test(a)) return "💰";
  if (/trial/.test(a)) return "🧪";
  return "📋";
}

/**
 * Two-line colorful log card HTML.
 * opts: { action, time, chips:[{label,value}], detail, accent }
 */
function renderLogCard(opts) {
  opts = opts || {};
  var action = opts.action || "event";
  var accent = opts.accent || logAccent(action);
  var chips = (opts.chips || []).filter(Boolean).map(function (c) {
    if (typeof c === "string") return '<span class="chip">' + esc(c) + "</span>";
    return '<span class="chip">' + esc(c.label || "") +
      (c.value != null && c.value !== "" ? ' <strong>' + esc(String(c.value)) + "</strong>" : "") +
      "</span>";
  }).join("");
  var detail = opts.detail
    ? '<span class="log-detail">' + esc(typeof opts.detail === "string" ? opts.detail : JSON.stringify(opts.detail)) + "</span>"
    : "";
  return (
    '<div class="log-card" style="--log-accent:' + accent + '">' +
      '<div class="log-icon">' + logIcon(action) + "</div>" +
      '<div class="log-body">' +
        '<div class="log-line1">' +
          '<span class="log-action">' + esc(action) + "</span>" +
          (opts.time ? '<span class="log-time">' + esc(opts.time) + "</span>" : "") +
        "</div>" +
        '<div class="log-line2">' + chips + detail + "</div>" +
      "</div>" +
    "</div>"
  );
}


function scorePassword(pw) {
  pw = String(pw || "");
  if (pw.length < 4) return 0;
  var score = 0;
  if (pw.length >= 4) score++;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // map raw points to 0–4
  if (score <= 1) return 0;
  if (score === 2) return 1;
  if (score === 3) return 2;
  if (score === 4) return 3;
  return 4;
}

var PW_LEVELS = [
  { key: "weak", label: "Weak", pct: 20, color: "#ef4444" },
  { key: "fair", label: "Fair", pct: 40, color: "#f59e0b" },
  { key: "good", label: "Good", pct: 60, color: "#eab308" },
  { key: "strong", label: "Strong", pct: 80, color: "#22c55e" },
  { key: "secure", label: "Secure", pct: 100, color: "#34d399" }
];

/**
 * Attach strength meter under password input(s).
 * Call after bindPasswordToggles.
 */
function bindPasswordStrength(root) {
  root = root || document;
  root.querySelectorAll("input[type=password], input[data-pw-toggle]").forEach(function (input) {
    if (input.dataset.pwStrengthBound) return;
    input.dataset.pwStrengthBound = "1";
    if (input.minLength > 4 || input.getAttribute("minlength") === "8") {
      input.setAttribute("minlength", "4");
    }
    if (!input.getAttribute("minlength")) input.setAttribute("minlength", "4");

    var meter = document.createElement("div");
    meter.className = "pw-strength";
    meter.innerHTML =
      '<div class="pw-strength-track"><div class="pw-strength-fill"></div></div>' +
      '<div class="pw-strength-label"><span>Strength</span><span class="lvl weak">Weak</span></div>';

    // Place after pw-wrap if present, else after input
    var anchor = input.closest(".pw-wrap") || input;
    if (anchor.parentNode) {
      if (anchor.nextSibling) anchor.parentNode.insertBefore(meter, anchor.nextSibling);
      else anchor.parentNode.appendChild(meter);
    }

    function update() {
      var pw = input.value;
      var fill = meter.querySelector(".pw-strength-fill");
      var lvl = meter.querySelector(".lvl");
      if (!pw) {
        fill.style.width = "0%";
        fill.style.background = "#ef4444";
        lvl.className = "lvl weak";
        lvl.textContent = "—";
        return;
      }
      var s = scorePassword(pw);
      var info = PW_LEVELS[s];
      fill.style.width = info.pct + "%";
      // gradient feel: blend toward green as it grows
      fill.style.background = "linear-gradient(90deg, #ef4444 0%, " + info.color + " 100%)";
      lvl.className = "lvl " + info.key;
      lvl.textContent = info.label;
    }
    input.addEventListener("input", update);
    input.addEventListener("change", update);
    update();
  });
}

function bindPasswordToggles(root) {
  root = root || document;
  root.querySelectorAll("input[type=password], input[data-pw-toggle]").forEach(function (input) {
    if (input.dataset.pwBound) return;
    input.dataset.pwBound = "1";
    var wrap = document.createElement("div");
    wrap.className = "pw-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pw-eye";
    btn.setAttribute("aria-label", "Show password");
    btn.innerHTML = "👁";
    btn.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.innerHTML = show ? "🙈" : "👁";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
    wrap.appendChild(btn);
  });
}

async function doFetch(endpoint, method, headers, body) {
  API_BASE = getApiBase();
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 25000);
  var res;
  try {
    res = await fetch(API_BASE + "/api/admin" + endpoint, {
      method: method,
      body: body,
      headers: headers,
      cache: "no-store",
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e && e.name === "AbortError") throw new Error("Request timeout — API: " + API_BASE);
    throw e;
  }
  clearTimeout(timer);
  var data;
  try { data = await res.json(); } catch { data = {}; }

  if (res.status === 401 && !endpoint.startsWith("/auth/")) {
    clearToken();
    window.location.replace(pageUrl("login.html"));
    throw new Error("Session expired");
  }

  if (res.status === 409) {
    throw new Error(data.error || "Duplicate request blocked");
  }

  if (res.status === 429) {
    throw new Error(data.error || "Too many requests — slow down");
  }

  if (!res.ok || data.ok === false) {
    throw new Error(data.error || "HTTP " + res.status);
  }
  return data;
}

async function checkAuth() {
  if (!getToken()) return null;
  try {
    var d = await api("/auth/me");
    return d.user || null;
  } catch {
    return null;
  }
}

function requireAuth() {
  checkAuth().then(async function (user) {
    if (!user) {
      clearToken();
      window.location.replace(pageUrl("login.html"));
    } else {
      window.__user = user;
      try {
        var me = await api("/auth/me");
        if (me.wallet) window.__wallet = me.wallet;
        if (me.user) window.__user = me.user;
        if (me.user && me.user.permissions) window.__user.permissions = me.user.permissions;
        if (me.user && me.user.discountPercent != null) window.__user.discountPercent = me.user.discountPercent;
      } catch (e) {}
      try {
        var st = await api("/settings");
        var d = (st && st.data) || {};
        function asStr(v, fallback) {
          if (v == null) return fallback;
          if (typeof v === "string") {
            // unwrap JSON-encoded strings e.g. "\"Fox\""
            if ((v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') || (v.charAt(0) === "'")) {
              try {
                var p = JSON.parse(v);
                if (typeof p === "string") return p;
              } catch (e) {}
            }
            return v;
          }
          if (typeof v === "object" && v !== null && v.value != null) return asStr(v.value, fallback);
          return String(v);
        }
        window.__brand = {
          name: asStr(d.brand_name, "Fox Store") || "Fox Store",
          logoUrl: asStr(d.brand_logo_url, "") || ""
        };
      } catch (e) {
        window.__brand = window.__brand || { name: "Fox Store", logoUrl: "" };
      }
      document.dispatchEvent(new Event("auth-ready"));
    }
  });
}

function logout() {
  clearToken();
  window.location.replace(pageUrl("login.html"));
}

function hasPerm(name) {
  var role = (window.__user && window.__user.role) || "";
  if (role === "ruler" || role === "superadmin") return true;
  var p = (window.__user && window.__user.permissions) || {};
  return p[name] === true;
}
function isRuler() { return window.__user && window.__user.role === "ruler"; }
function isManager() {
  return window.__user && (window.__user.role === "ruler" || window.__user.role === "superadmin");
}
function isReseller() { return window.__user && window.__user.role === "reseller"; }

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}
function daysUntil(d) {
  if (!d) return 0;
  return Math.max(0, Math.floor((new Date(d).getTime() - Date.now()) / 86400000));
}
var CREDIT_RATE = 100; // 100 BDT = 1 credit
function walletCurrency() {
  var c = (window.__wallet && window.__wallet.currency) || "BDT";
  return String(c).toUpperCase() === "CREDIT" ? "CREDIT" : "BDT";
}
function userDiscountPercent() {
  var u = window.__user || {};
  var d = Number(u.discountPercent);
  return isNaN(d) ? 0 : Math.min(100, Math.max(0, d));
}
/** Apply seller discount to BDT amount */
function afterDiscountBdt(bdt) {
  var d = userDiscountPercent();
  var n = Number(bdt) || 0;
  return Math.round(n * (1 - d / 100) * 100) / 100;
}
/** n is always BDT stored amount — formats in user's chosen unit */
function formatMoney(n, unit) {
  unit = unit || walletCurrency();
  var bdt = Number(n || 0);
  if (unit === "CREDIT") {
    var cr = bdt / CREDIT_RATE;
    var s = Math.abs(cr - Math.round(cr)) < 1e-9 ? String(Math.round(cr)) : cr.toFixed(2);
    return s + " cr";
  }
  return "৳" + (Math.abs(bdt - Math.round(bdt)) < 1e-9 ? String(Math.round(bdt)) : bdt.toFixed(2));
}
function formatMoneyPlain(n) { return Number(n || 0).toFixed(2); }
/** Price with optional strike when user has discount. listBdt = catalog price in BDT */
function formatPriceHtml(listBdt) {
  var list = Number(listBdt) || 0;
  var d = userDiscountPercent();
  var pay = afterDiscountBdt(list);
  if (d > 0 && pay < list) {
    return '<span class="price-stack">' +
      '<span class="price-was">' + esc(formatMoney(list)) + '</span> ' +
      '<span class="price-now">' + esc(formatMoney(pay)) + '</span>' +
      '<span class="price-disc">-' + d + '%</span></span>';
  }
  return '<span class="price-now">' + esc(formatMoney(list)) + '</span>';
}
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  showToast("Copied: " + text.substring(0, 20) + (text.length > 20 ? "..." : ""));
}


var DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2064%2064%22%20fill%3D%22none%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2232%22%20fill%3D%22%2327272a%22/%3E%3Ccircle%20cx%3D%2232%22%20cy%3D%2224%22%20r%3D%2212%22%20fill%3D%22%2352525b%22/%3E%3Cpath%20d%3D%22M8%2056c0-12%2010.7-20%2024-20s24%208%2024%2020%22%20fill%3D%22%2352525b%22/%3E%3C/svg%3E";
function defaultAvatar() { return DEFAULT_AVATAR; }
function roleGlowClass(role) {
  if (role === "ruler") return "profile-card--ruler";
  if (role === "superadmin") return "profile-card--superadmin";
  return "profile-card--reseller";
}
function profileAvatarUrl(user) {
  var u = user || window.__user || getUser() || {};
  return (u.avatarUrl && String(u.avatarUrl).trim()) ? String(u.avatarUrl).trim() : defaultAvatar();
}

function balanceTone(n) {
  var v = Number(n);
  if (isNaN(v)) return "balance-chip--muted";
  if (v <= 0) return "balance-chip--empty";
  if (v < 100) return "balance-chip--low";
  if (v < 1000) return "balance-chip--mid";
  return "balance-chip--high";
}

/** Shell: top header card + bottom nav + #page-content outlet */
function renderNav(active) {
  return mountShellHtml(active);
}

function mountShell(active) {
  var app = document.getElementById("app");
  if (!app) return;
  if (!document.getElementById("shell-header")) {
    app.innerHTML = mountShellHtml(active);
  } else {
    // update active nav + balance/profile
    app.innerHTML = mountShellHtml(active);
  }
}

function mountShellHtml(active) {
  var links = getNavLinks();
  var role = (window.__user && window.__user.role) || "reseller";
  var nav = links.filter(function (l) { return l.roles.indexOf(role) !== -1; });
  var user = window.__user || getUser() || { username: "", role: "" };
  var balNum = (window.__wallet && window.__wallet.balance != null) ? Number(window.__wallet.balance) : null;
  var avatar = profileAvatarUrl(user);
  var glow = roleGlowClass(role);
  var tone = balanceTone(balNum);
  var cur = walletCurrency();

  var bottomNav = '<nav class="bottom-nav">' + nav.map(function (l) {
    return '<a href="' + l.href + '" class="' + (active === l.label ? "active" : "") + '">' +
      l.icon + "<span>" + l.label + "</span></a>";
  }).join("") + "</nav>";

  var balanceCard = balNum !== null
    ? ('<div class="balance-card ' + tone + '" title="Stored as BDT · display ' + cur + ' (100৳=1cr)">' +
         '<div class="balance-label">Balance · ' + (cur === "CREDIT" ? "Credit" : "Taka") + '</div>' +
         '<div class="balance-value">' + esc(formatMoney(balNum, cur)) + '</div>' +
       '</div>')
    : '';

  var profileCard =
    '<div class="profile-card ' + glow + '" title="' + esc(user.username || "") + ' · ' + esc(role) + '">' +
      '<img class="profile-avatar" src="' + esc(avatar) + '" alt="" onerror="this.onerror=null;this.src=DEFAULT_AVATAR">' +
      '<div class="profile-meta">' +
        '<div class="profile-name">' + esc(user.username || "") + '</div>' +
        '<div class="profile-role">' + esc(role) + '</div>' +
      '</div>' +
    '</div>';

  var brand = window.__brand || { name: "Fox Store", logoUrl: "" };
  var brandName = brand.name || "Fox Store";
  var brandLogo = brand.logoUrl || "";
  var brandMark = brandLogo
    ? ('<img class="brand-logo" src="' + esc(brandLogo) + '" alt="" onerror="this.style.display=\'none\'">')
    : '<span class="brand-mark">F</span>';
  var header =
    '<header class="shell-header" id="shell-header">' +
      '<div class="header-card">' +
        '<div class="header-left">' +
          '<a href="' + pageUrl("dashboard.html") + '" class="brand">' +
            brandMark +
            '<span class="brand-text">' + esc(brandName) + '</span>' +
          '</a>' +
        '</div>' +
        '<div class="header-right">' +
          balanceCard +
          profileCard +
        '</div>' +
      '</div>' +
    '</header>';

  return header + bottomNav + '<main class="main" id="page-content"></main>';
}

function getNavLinks() {
  // Tabs: Dashboard | Apps | Purchase | Keys | Sellers | Logs | Me
  return [
    { href: pageUrl("dashboard.html"), label: "Dashboard", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>', roles: ["ruler", "superadmin", "reseller"] },
    { href: pageUrl("mods.html"), label: "Apps", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>', roles: ["ruler", "superadmin", "reseller"] },
    { href: pageUrl("new-key.html"), label: "Purchase", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>', roles: ["ruler", "superadmin", "reseller"] },
    { href: pageUrl("keys.html"), label: "Keys", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>', roles: ["ruler", "superadmin", "reseller"] },
    { href: pageUrl("resellers.html"), label: "Sellers", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>', roles: ["ruler", "superadmin"] },
    { href: pageUrl("audit.html"), label: "Logs", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>', roles: ["ruler", "superadmin"] },
    { href: pageUrl("settings.html"), label: "Me", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>', roles: ["ruler", "superadmin", "reseller"] },
  ];
}

// ==================== ADDITIONAL API FUNCTIONS ====================

// Key Management Functions
async function getKeys(searchQuery) {
  var endpoint = "/keys";
  if (searchQuery) endpoint += "?q=" + encodeURIComponent(searchQuery);
  return api(endpoint);
}

async function getKeyDetail(keyId) {
  return api("/keys/" + keyId);
}

async function createKey(keyData) {
  return api("/keys", { method: "POST", body: keyData });
}

async function extendKey(keyId, days, hours, minutes) {
  return api("/keys/" + keyId + "/extend", {
    method: "POST",
    body: { days: days || 0, hours: hours || 0, minutes: minutes || 0 }
  });
}

async function resetHwid(keyId) {
  return api("/keys/" + keyId + "/hwid-reset", { method: "POST" });
}

async function pauseKey(keyId) {
  return api("/keys/" + keyId + "/pause", { method: "POST" });
}

async function resumeKey(keyId) {
  return api("/keys/" + keyId + "/resume", { method: "POST" });
}

async function banKey(keyId) {
  return api("/keys/" + keyId + "/ban", { method: "POST" });
}

async function unbanKey(keyId) {
  return api("/keys/" + keyId + "/unban", { method: "POST" });
}

async function deleteKey(keyId) {
  return api("/keys/" + keyId + "/delete", { method: "DELETE" });
}

function exportKeys() {
  var token = getToken();
  if (!token) return;
  window.open(getApiBase() + "/api/admin/keys/export", "_blank");
}

// Package Management Functions
async function getPackages() {
  return api("/packages");
}

async function createPackage(packageData) {
  return api("/packages", { method: "POST", body: packageData });
}

async function updatePackage(packageId, packageData) {
  return api("/packages/" + packageId, { method: "PATCH", body: packageData });
}

async function deletePackage(packageId) {
  return api("/packages/" + packageId, { method: "DELETE" });
}

async function reorderPackages(packageIds) {
  return api("/packages/reorder", { method: "POST", body: { packageIds: packageIds } });
}

// Mod Management Functions
async function getMods() {
  return api("/mods");
}

async function createMod(modData) {
  return api("/mods", { method: "POST", body: modData });
}

async function updateMod(modId, modData) {
  return api("/mods/" + modId, { method: "PATCH", body: modData });
}

async function deleteMod(modId) {
  return api("/mods/" + modId, { method: "DELETE" });
}

async function toggleMod(modId) {
  return api("/mods/" + modId + "/toggle", { method: "POST" });
}

async function reorderMods(modIds) {
  return api("/mods/reorder", { method: "POST", body: { modIds: modIds } });
}

// Reseller Management Functions
async function getResellers() {
  return api("/resellers");
}

async function createReseller(resellerData) {
  return api("/resellers", { method: "POST", body: resellerData });
}

async function getResellerDetail(resellerId) {
  return api("/resellers/" + resellerId + "/zoom");
}

async function rechargeReseller(resellerId, amount) {
  return api("/resellers/" + resellerId + "/recharge", { method: "POST", body: { amount: amount } });
}

async function setResellerBalance(resellerId, balance) {
  return api("/resellers/" + resellerId + "/set-balance", { method: "POST", body: { balance: balance } });
}

async function setResellerDiscount(resellerId, discountPercent) {
  return api("/resellers/" + resellerId + "/set-discount", { method: "POST", body: { discountPercent: discountPercent } });
}

async function deleteReseller(resellerId) {
  return api("/resellers/" + resellerId, { method: "DELETE" });
}

// Branding Functions
async function getBranding() {
  return api("/settings/branding");
}

async function saveBranding(brandingData) {
  return api("/settings/branding", { method: "POST", body: brandingData });
}

// Wallet Functions
async function getWalletInfo() {
  return api("/wallets/me");
}

// Stats Functions
async function getStats() {
  return api("/stats");
}

// Audit Functions
async function getAuditLogs() {
  return api("/audit");
}

// Export all functions to global scope
window.getKeys = getKeys;
window.getKeyDetail = getKeyDetail;
window.createKey = createKey;
window.extendKey = extendKey;
window.resetHwid = resetHwid;
window.pauseKey = pauseKey;
window.resumeKey = resumeKey;
window.banKey = banKey;
window.unbanKey = unbanKey;
window.deleteKey = deleteKey;
window.exportKeys = exportKeys;
window.getPackages = getPackages;
window.createPackage = createPackage;
window.updatePackage = updatePackage;
window.deletePackage = deletePackage;
window.reorderPackages = reorderPackages;
window.getMods = getMods;
window.createMod = createMod;
window.updateMod = updateMod;
window.deleteMod = deleteMod;
window.toggleMod = toggleMod;
window.reorderMods = reorderMods;
window.getResellers = getResellers;
window.createReseller = createReseller;
window.getResellerDetail = getResellerDetail;
window.rechargeReseller = rechargeReseller;
window.setResellerBalance = setResellerBalance;
window.setResellerDiscount = setResellerDiscount;
window.deleteReseller = deleteReseller;
window.getBranding = getBranding;
window.saveBranding = saveBranding;
window.getWalletInfo = getWalletInfo;
window.getStats = getStats;
window.getAuditLogs = getAuditLogs;
