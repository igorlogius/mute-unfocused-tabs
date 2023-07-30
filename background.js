/* global browser */

(async () => {
  const url_regex = new RegExp("^https?://");

  const log = (level, msg) => {
    level = level.trim().toLowerCase();
    if (
      ["error", "warn"].includes(level) ||
      (temporary && ["debug", "info", "log"].includes(level))
    ) {
      console[level](extname + "::" + level.toUpperCase() + "::" + msg);
      return;
    }
  };

  function setMuted(tabId, muted) {
    browser.tabs.update(tabId, { muted });
  }

  function onRemoved(tabId /*, removeInfo*/) {
    if (excludedTabs.has(tabId)) {
      excludedTabs.delete(tabId);
    }
  }

  // false := unmanaged / aka. all tabs / default
  // true := only managed / selected
  async function getMode() {
    log("debug", "getMode");
    let store = undefined;
    try {
      store = await browser.storage.local.get("mode");
    } catch (e) {
      log("debug", "access to storage failed");
      return false;
    }
    if (typeof store === "undefined") {
      log("debug", "store is undefined");
      return false;
    }
    if (typeof store.mode !== "boolean") {
      log("debug", "store.mode is not boolean");
      return false;
    }
    return store.mode;
  }

  async function getList() {
    log("debug", "getList");

    let store = undefined;
    try {
      store = await browser.storage.local.get("selectors");
    } catch (e) {
      log("debug", "access to storage failed");
      return [];
    }

    if (typeof store === "undefined") {
      log("debug", "store is undefined");
      return [];
    }

    if (typeof store.selectors === "undefined") {
      log("debug", "store.selectors is undefined");
      return [];
    }

    if (typeof store.selectors.forEach !== "function") {
      log("error", "store.selectors is not iterable");
      return [];
    }

    const l = [];

    store.selectors.forEach((e) => {
      // check activ
      if (typeof e.activ !== "boolean") {
        return;
      }
      if (e.activ !== true) {
        return;
      }

      // check url regex
      if (typeof e.url_regex !== "string") {
        return;
      }
      e.url_regex = e.url_regex.trim();
      if (e.url_regex === "") {
        return;
      }

      try {
        log("debug", e.url_regex);
        l.push(new RegExp(e.url_regex));
      } catch (e) {
        log("WARN", "invalid url regex : " + e.url_regex);
        return;
      }
    });

    return l;
  }

  function matchesRegexRules(url) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].test(url)) {
        log("debug", "isListed: " + url);
        return true;
      }
    }
    return false;
  }

  async function updateMuteState() {
    log("debug", "updateMuteState");
    let tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const aid = tabs[0].id;
    tabs = await browser.tabs.query({
      /*url: "<all_urls>"*/
    });
    tabs.forEach(async (tab) => {
      // ignore not https? urls
      if (!url_regex.test(tab.url)) {
        browser.browserAction.setBadgeText({ tabId: tab.id, text: "NA" });
        browser.browserAction.setBadgeBackgroundColor({
          tabId: tab.id,
          color: "white",
        });
        browser.browserAction.setTitle({ tabId: tab.id, title: "unmanaged" });
        browser.browserAction.disable(tab.id);
        return;
      }
      // if mode is exclude (true)
      let shouldInvertBehaviour = excludedTabs.has(tab.id)
      let shouldControlMute = !mode != (matchesRegexRules(tab.url) != shouldInvertBehaviour)

      if (shouldControlMute) {
        browser.browserAction.setBadgeText({ tabId: tab.id, text: "ON" });
        browser.browserAction.setBadgeBackgroundColor({
          tabId: tab.id,
          color: "green",
        });
        browser.browserAction.setTitle({
          tabId: tab.id,
          title: "managed, click to unmanage",
        });
        setMuted(tab.id, tab.id !== aid);
        return;
      } else {
        browser.browserAction.setBadgeText({ tabId: tab.id, text: "OFF" });
        browser.browserAction.setBadgeBackgroundColor({
          tabId: tab.id,
          color: "red",
        });
        browser.browserAction.setTitle({
          tabId: tab.id,
          title: "unmanaged, click to manage",
        });
      }
    });
  }

  async function onClicked(/*tab ,data*/) {
    log("debug", "onClicked");

    // get all selected
    const tabs = await browser.tabs.query({
      highlighted: true,
      hidden: false,
      currentWindow: true,
    });

    for (const tab of tabs) {
      if (excludedTabs.has(tab.id)) {
        excludedTabs.delete(tab.id);
      } else {
        excludedTabs.add(tab.id);
      }
    }
    updateMuteState();
  }

  async function onStorageChange(/*changes, area*/) {
    log("debug", "onStorageChange");

    mode = await getMode();
    list = await getList();

    excludedTabs.clear();

    updateMuteState();
  }

  // v v v v v v v v v v v v v
  //         S T A R T
  // ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^

  const temporary = browser.runtime.id.endsWith("@temporary-addon"); // debugging?
  const manifest = browser.runtime.getManifest();
  const extname = manifest.name;

  let mode = await getMode();
  let list = await getList();
  let excludedTabs = new Set();

  // add listeners
  browser.browserAction.onClicked.addListener(onClicked);
  browser.tabs.onRemoved.addListener(onRemoved);
  browser.tabs.onActivated.addListener(updateMuteState);
  browser.windows.onFocusChanged.addListener(updateMuteState);
  browser.runtime.onInstalled.addListener(updateMuteState);
  browser.storage.onChanged.addListener(onStorageChange);

  // v v v v v v v v v v v v v
  //         E N D
  // ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^
})();
