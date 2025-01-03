/* global browser */

(async () => {
  const url_regex = new RegExp("^https?://");

  async function getFromStorage(type, id, fallback) {
    let tmp = await browser.storage.local.get(id);
    return typeof tmp[id] === type ? tmp[id] : fallback;
  }

  async function setToStorage(id, value) {
    let obj = {};
    obj[id] = value;
    return browser.storage.local.set(obj);
  }

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
    if (taggedManually.has(tabId)) {
      taggedManually.delete(tabId);
    }
  }

  async function getRegexList() {
    log("debug", "getRegexList");

    let tmp = await getFromStorage("string", "listmatchers", "");

    let l = [];

    tmp.split("\n").forEach((line) => {
      line = line.trim();
      if (line === "") {
        return;
      }

      try {
        l.push(new RegExp(line));
      } catch (e) {
        log("WARN", "invalid url regex : " + line);
        return;
      }
    });

    return l;
  }

  function isRegexExcluded(url) {
    for (let i = 0; i < regexList.length; i++) {
      if (regexList[i].test(url)) {
        log("debug", "isRegexExcluded: " + url);
        return true;
      }
    }
    return false;
  }

  async function updateMuteState() {
    log("debug", "updateMuteState");
    let tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activTabId = tabs[0].id;
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

      browser.browserAction.enable(tab.id);

      const _taggedManually = taggedManually.has(tab.id);
      const _regexList = isRegexExcluded(tab.url);

      // The 4 cases where a tab is managed
      const managed =
        (!mode && !_regexList && !_taggedManually) ||
        (!mode && _regexList && _taggedManually) ||
        (mode && _regexList && !_taggedManually) ||
        (mode && !_regexList && _taggedManually);

      if (managed) {
        setMuted(tab.id, tab.id !== activTabId);
        browser.browserAction.setBadgeText({ tabId: tab.id, text: "ON" });
        browser.browserAction.setBadgeBackgroundColor({
          tabId: tab.id,
          color: "green",
        });
        browser.browserAction.setTitle({
          tabId: tab.id,
          title: "managed, click to unmanage",
        });
        return;
      }
      browser.browserAction.setBadgeText({ tabId: tab.id, text: "OFF" });
      browser.browserAction.setBadgeBackgroundColor({
        tabId: tab.id,
        color: "red",
      });
      browser.browserAction.setTitle({
        tabId: tab.id,
        title: "unmanaged, click to manage",
      });
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
      if (taggedManually.has(tab.id)) {
        taggedManually.delete(tab.id);
      } else {
        taggedManually.add(tab.id);
      }
    }
    updateMuteState();
  }

  async function onStorageChange(/*changes, area*/) {
    log("debug", "onStorageChange");

    mode = await getFromStorage("boolean", "mode", false);

    browser.menus.update("mmme", {
      checked: mode,
    });

    regexList = await getRegexList();

    taggedManually.clear();

    await updateMuteState();
  }

  async function migrateOldData(details) {
    if (details.reason === "update") {
      let tmp = await getFromStorage("object", "selectors", []);

      let out = "";
      for (let t of tmp) {
        if (typeof t.url_regex === "string") {
          out += t.url_regex.trim() + "\n";
        }
      }

      if (out !== "") {
        setToStorage("listmatchers", out);
      }
    }
  }

  // v v v v v v v v v v v v v
  //         S T A R T
  // ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^

  const temporary = browser.runtime.id.endsWith("@temporary-addon"); // debugging?
  const manifest = browser.runtime.getManifest();
  const extname = manifest.name;

  let mode = await getFromStorage("boolean", "mode", false);
  let regexList = await getRegexList();
  let taggedManually = new Set();

  // add listeners
  browser.browserAction.onClicked.addListener(onClicked);
  browser.tabs.onRemoved.addListener(onRemoved);
  browser.tabs.onActivated.addListener(updateMuteState);
  browser.windows.onFocusChanged.addListener(updateMuteState);
  browser.runtime.onInstalled.addListener(updateMuteState);
  browser.storage.onChanged.addListener(onStorageChange);
  browser.runtime.onInstalled.addListener(migrateOldData);

  browser.menus.create({
    id: "unmanage",
    title: "unmanage",
    contexts: ["tab"],
    onclick: async () => {
      // get all selected
      const tabs = await browser.tabs.query({
        highlighted: true,
        hidden: false,
        currentWindow: true,
      });
      for (const tab of tabs) {
        taggedManually.add(tab.id);
      }
      updateMuteState();
    },
  });

  browser.menus.create({
    id: "manage",
    title: "manage",
    contexts: ["tab"],
    onclick: async () => {
      // get all selected
      const tabs = await browser.tabs.query({
        highlighted: true,
        hidden: false,
        currentWindow: true,
      });
      for (const tab of tabs) {
        taggedManually.delete(tab.id);
      }
      updateMuteState();
    },
  });

  browser.menus.create({
    id: "mmme",
    title: "Manual Mode",
    contexts: ["browser_action"],
    type: "checkbox",
    checked: mode,
    onclick: async (info, tab) => {
      console.debug(info);
      if (mode !== info.checked) {
        browser.storage.local.set({ mode: info.checked }).catch(console.error);
      }
    },
  });

  // v v v v v v v v v v v v v
  //         E N D
  // ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^
})();
