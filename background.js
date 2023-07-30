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
    if (manualList.has(tabId)) {
      manualList.delete(tabId);
    }
  }

  // true := unmanaged / aka. all tabs / default
  // false := only managed / selected
  async function getMode() {
    log("debug", "getMode");
    let store = undefined;
    try {
      store = await browser.storage.local.get("mode");
    } catch (e) {
      log("debug", "access to storage failed");
      return true;
    }
    if (typeof store === "undefined") {
      log("debug", "store is undefined");
      return true;
    }
    if (typeof store.mode !== "boolean") {
      log("debug", "store.mode is not boolean");
      return true;
    }
    return !store.mode;
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
    const focusedTab = tabs[0].id;
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
        browser.browserAction.setTitle({ tabId: tab.id, title: "Ignored" });
        browser.browserAction.disable(tab.id);
        return;
      }

      // If automatic mode (mode == true), matching a regex rule will exclude it from
      // being managed by this extension, unless it is also on the manual list.
      //
      // If manual mode (mode == false), matching a regex rule will mean its managed
      // by the extension. Clicking on the extension button adds it to the exemption
      // list, meaning it won't be managed despite matching a regex rule.
      let automaticallyListed = matchesRegexRules(tab.url)
      let manuallyListed = manualList.has(tab.id)
      let isManagedTab = mode != (automaticallyListed != manuallyListed)

      if (isManagedTab) {
        browser.browserAction.setBadgeText({ tabId: tab.id, text: "ON" });
        browser.browserAction.setBadgeBackgroundColor({
          tabId: tab.id,
          color: "green",
        });
        browser.browserAction.setTitle({
          tabId: tab.id,
          title: "Managed. Click to unmanage",
        });
        setMuted(tab.id, tab.id !== focusedTab);
      } else {
        browser.browserAction.setBadgeText({ tabId: tab.id, text: "OFF" });
        browser.browserAction.setBadgeBackgroundColor({
          tabId: tab.id,
          color: "red",
        });
        browser.browserAction.setTitle({
          tabId: tab.id,
          title: "Unmanaged. Click to manage",
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
      if (manualList.has(tab.id)) {
        manualList.delete(tab.id);
      } else {
        manualList.add(tab.id);
      }
    }
    updateMuteState();
  }

  async function onStorageChange(/*changes, area*/) {
    log("debug", "onStorageChange");

    mode = await getMode();
    list = await getList();

    manualList.clear();

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
  let manualList = new Set();

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
