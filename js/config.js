/**
 * Fox Store API base
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
})(typeof window !== "undefined" ? window : globalThis);
