/**
 * Fox Store API Configuration
 * Admin panel -> Cloudflare Worker (primary)
 */
(function (w) {
  var PRIMARY_API = "https://foxstore-api.mohon153r.workers.dev";
  var BACKUP_API = "https://foxstore-api.mohon153r.workers.dev";
  var GAME_API = "https://foxstore-api.mohon153r.workers.dev";

  function strip(u) {
    return String(u || "").replace(/\/$/, "");
  }

  var base = strip(PRIMARY_API);
  try {
    var q = new URLSearchParams(w.location.search).get("api");
    if (q) {
      q = q.trim();
      if (/^(primary|render)$/i.test(q)) {
        base = strip(PRIMARY_API);
        w.localStorage.setItem("dfox_api_slot", "primary");
        w.localStorage.removeItem("dfox_api_base");
      } else if (/^(backup|workers|cf)$/i.test(q)) {
        base = strip(BACKUP_API);
        w.localStorage.setItem("dfox_api_slot", "backup");
        w.localStorage.removeItem("dfox_api_base");
      } else if (/^https?:\/\//i.test(q)) {
        base = strip(q);
        w.localStorage.setItem("dfox_api_base", base);
        w.localStorage.removeItem("dfox_api_slot");
      }
    } else {
      var slot2 = w.localStorage.getItem("dfox_api_slot");
      var saved = w.localStorage.getItem("dfox_api_base");
      if (slot2 === "backup" && BACKUP_API) base = strip(BACKUP_API);
      else if (saved && /^https?:\/\//i.test(saved)) base = strip(saved);
      else base = strip(PRIMARY_API);
    }
  } catch (e) {
    base = strip(PRIMARY_API);
  }

  try {
    var prev = w.localStorage.getItem("dfox_api_base") || "";
    if (/mod\.dfox404\.workers\.dev/i.test(prev) && !w.localStorage.getItem("dfox_api_slot")) {
      w.localStorage.removeItem("dfox_api_base");
      base = strip(PRIMARY_API);
    }
  } catch (e2) {}

  w.DFOX_PRIMARY_API = strip(PRIMARY_API);
  w.DFOX_BACKUP_API = strip(BACKUP_API);
  w.DFOX_GAME_API = strip(GAME_API);
  w.DFOX_API_BASE = base;
  w.__DFOX_API_BASE__ = base;

  w.getApiBase = function () {
    return strip(w.DFOX_API_BASE || PRIMARY_API);
  };
  w.getGameApiBase = function () {
    return strip(w.DFOX_GAME_API || GAME_API);
  };
  w.setApiBase = function (slotOrUrl) {
    var next = strip(slotOrUrl);
    if (/^(primary|render)$/i.test(next)) {
      next = strip(PRIMARY_API);
      try {
        w.localStorage.setItem("dfox_api_slot", "primary");
        w.localStorage.removeItem("dfox_api_base");
      } catch (e) {}
    } else if (/^(backup|workers|cf)$/i.test(next) && BACKUP_API) {
      next = strip(BACKUP_API);
      try {
        w.localStorage.setItem("dfox_api_slot", "backup");
        w.localStorage.removeItem("dfox_api_base");
      } catch (e) {}
    } else if (/^https?:\/\//i.test(next)) {
      try {
        w.localStorage.setItem("dfox_api_base", next);
        w.localStorage.removeItem("dfox_api_slot");
      } catch (e) {}
    } else {
      next = strip(PRIMARY_API);
    }
    w.DFOX_API_BASE = next;
    w.__DFOX_API_BASE__ = next;
    return next;
  };
  w.getApiSlot = function () {
    var cur = strip(w.DFOX_API_BASE);
    if (BACKUP_API && cur === strip(BACKUP_API)) return "backup";
    if (cur === strip(PRIMARY_API)) return "primary";
    return "custom";
  };

  // ==================== ADDITIONAL CONFIG ====================
  
  // App Configuration
  w.CONFIG = {
    API_BASE_URL: base,
    PRIMARY_API: PRIMARY_API,
    BACKUP_API: BACKUP_API,
    GAME_API: GAME_API,
    TELEGRAM_BOT_USERNAME: 'FoxStoreBot',
    DEFAULT_KEY_PREFIX: 'HQCRX',
    CURRENCY: 'BDT',
    BRAND_NAME: 'Fox Store',
    THEME_COLOR: '#007bff',
    VERSION: '1.0.0'
  };

  // Storage Keys
  w.STORAGE_KEYS = {
    TOKEN: 'adminToken',
    USER: 'adminUser',
    BRANDING: 'brandingSettings',
    REMEMBER_ME: 'rememberMe',
    API_SLOT: 'dfox_api_slot',
    API_BASE: 'dfox_api_base'
  };

  // ==================== API HELPER FUNCTIONS ====================
  
  // Global API Call Function
  w.apiCall = async function(endpoint, method = 'GET', body = null, customHeaders = {}) {
    const token = w.localStorage.getItem(w.STORAGE_KEYS.TOKEN);
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...customHeaders
    };

    const options = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const apiBase = w.getApiBase();
      const response = await fetch(`${apiBase}${endpoint}`, options);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        w.localStorage.removeItem(w.STORAGE_KEYS.TOKEN);
        w.localStorage.removeItem(w.STORAGE_KEYS.USER);
        if (w.location.pathname !== '/login.html') {
          w.location.href = 'login.html';
        }
        return { ok: false, error: 'Session expired. Please login again.' };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      w.showNotification('API Error: ' + error.message, 'error');
      return { ok: false, error: error.message };
    }
  };

  // ==================== NOTIFICATION SYSTEM ====================
  
  w.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
      color: ${type === 'warning' ? '#000' : '#fff'};
      border-radius: 8px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      animation: slideInRight 0.3s ease;
    `;
    
    if (!document.getElementById('notificationStyles')) {
      const style = document.createElement('style');
      style.id = 'notificationStyles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // ==================== AUTH FUNCTIONS ====================
  
  w.checkAuth = function() {
    const token = w.localStorage.getItem(w.STORAGE_KEYS.TOKEN);
    const currentPage = w.location.pathname.split('/').pop();
    
    const publicPages = ['login.html', 'index.html', 'forgot-password.html'];
    
    if (!publicPages.includes(currentPage)) {
      if (!token) {
        w.location.href = 'login.html';
        return false;
      }
    }
    
    return true;
  };

  w.logout = function() {
    w.localStorage.removeItem(w.STORAGE_KEYS.TOKEN);
    w.localStorage.removeItem(w.STORAGE_KEYS.USER);
    w.localStorage.removeItem(w.STORAGE_KEYS.REMEMBER_ME);
    w.location.href = 'login.html';
  };

  // ==================== UTILITY FUNCTIONS ====================
  
  w.formatDate = function(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  w.formatCurrency = function(amount) {
    return `${w.CONFIG.CURRENCY} ${parseFloat(amount || 0).toFixed(2)}`;
  };

  w.getQueryParam = function(param) {
    const urlParams = new URLSearchParams(w.location.search);
    return urlParams.get(param);
  };

  w.escapeHtml = function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  w.debounce = function(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  w.copyToClipboard = async function(text) {
    try {
      await navigator.clipboard.writeText(text);
      w.showNotification('Copied to clipboard!', 'success');
      return true;
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      w.showNotification('Copied to clipboard!', 'success');
      return true;
    }
  };

  w.confirmAction = function(message) {
    return confirm(message);
  };

  w.showLoading = function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '<div class="loading-spinner"></div>';
    }
  };

  w.hideLoading = function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '';
    }
  };

  // ==================== BRANDING FUNCTIONS ====================
  
  w.loadBranding = async function() {
    try {
      const savedBranding = w.localStorage.getItem(w.STORAGE_KEYS.BRANDING);
      if (savedBranding) {
        const branding = JSON.parse(savedBranding);
        w.applyBranding(branding);
      } else {
        const token = w.localStorage.getItem(w.STORAGE_KEYS.TOKEN);
        if (token) {
          const response = await w.apiCall('/api/admin/settings/branding', 'GET');
          if (response.ok && response.data) {
            w.localStorage.setItem(w.STORAGE_KEYS.BRANDING, JSON.stringify(response.data));
            w.applyBranding(response.data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading branding:', error);
    }
  };

  w.applyBranding = function(branding) {
    if (!branding) return;
    
    const brandElements = document.querySelectorAll('.brand-name, .app-title, .logo-text');
    brandElements.forEach(el => {
      el.textContent = branding.brandName || w.CONFIG.BRAND_NAME;
    });
    
    if (branding.logoUrl) {
      const logoElements = document.querySelectorAll('.brand-logo, .logo-img, .sidebar-logo');
      logoElements.forEach(el => {
        el.src = branding.logoUrl;
        el.style.display = 'block';
      });
    }
    
    if (branding.themeColor) {
      document.documentElement.style.setProperty('--primary-color', branding.themeColor);
      document.documentElement.style.setProperty('--theme-color', branding.themeColor);
    }
  };

  // ==================== AUTO INITIALIZE ====================
  
  document.addEventListener('DOMContentLoaded', function() {
    w.checkAuth();
    w.loadBranding();
    
    // Update title
    document.title = `${w.CONFIG.BRAND_NAME} - Admin Panel`;
  });

})(typeof window !== "undefined" ? window : globalThis);
