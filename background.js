/* global browser */

(async () => {

    const url_regex = new RegExp("^https?://");

    const log = (level, msg) => {
        level = level.trim().toLowerCase();
        if (['error','warn'].includes(level)
            || ( temporary && ['debug','info','log'].includes(level))
        ) {
            console[level](extname + '::' + level.toUpperCase() + '::' + msg);
            return;
        }
    };

    function setMuted(tabId, muted) {
        browser.tabs.update(tabId, { muted });
    }

    function onRemoved(tabId /*, removeInfo*/) {
        if( tabIdStore.has(tabId) ) {
            tabIdStore.delete(tabId);
        }
    }

    // false := unmanaged / aka. all tabs / default
    // true := only managed / selected
    async function getMode() {

        log('debug', 'getMode');
        let store = undefined;
        try {
            store = await browser.storage.local.get('mode');
        }catch(e){
            log('debug', 'access to storage failed');
            return false;
        }
        if( typeof store === 'undefined') {
            log('debug', 'store is undefined');
            return false;
        }
        if( typeof store.mode !== 'boolean') {
            log('debug', 'store.mode is not boolean');
            return false;
        }
        return store.mode;
    }

    async function getList() {
        log('debug', 'getList');

        let store = undefined;
        try {
            store = await browser.storage.local.get('selectors');
        }catch(e){
            log('debug', 'access to storage failed');
            return [];
        }

        if( typeof store === 'undefined') {
            log('debug', 'store is undefined');
            return [];
        }

        if( typeof store.excluded === 'undefined') {
            log('debug', 'store.selectors is undefined');
            return [];
        }

        if ( typeof store.excluded.forEach !== 'function' ) {
            log('error', 'store.selectors is not iterable');
            return [];
        }

        const l = [];

        store.selectors.forEach( (e) => {

            // check activ
            if(typeof e.activ !== 'boolean') { return; }
            if(e.activ !== true) { return; }

            // check url regex
            if(typeof e.url_regex !== 'string') { return; }
            e.url_regex = e.url_regex.trim();
            if(e.url_regex === ''){ return; }

            try {
                list.push(new RegExp(e.url_regex));
            } catch(e) {
                log('WARN', 'invalid url regex : ' + e.url_regex);
                return;
            }

        });

        return l;
    }

    function isListed(url) {
        for (var i=0;i < list.length;i++) {
            if(list[i].test(url)) {
                return true;
            }
        }
        return false;
    }

    async function updateMuteState() {
        log('debug', 'updateMuteState');
        let tabs = await browser.tabs.query({active: true, currentWindow: true});
        const aid = tabs[0].id;
        tabs = (await browser.tabs.query({/*url: "<all_urls>"*/}));
        tabs.forEach( async (tab) => {

            // ignore not https? urls
            if(!url_regex.test(tab.url)){
                browser.browserAction.setBadgeText({tabId: tab.id, text: "NA" });
                browser.browserAction.setBadgeBackgroundColor({tabId: tab.id, color: 'gray'});
                browser.browserAction.setTitle({tabId: tab.id, title: 'unmanaged'});
                browser.browserAction.disable(tab.id);
                return;
            }

            if(mode){
                // manual
                if(isListed(tab.url)){
                    browser.browserAction.setBadgeText({tabId: tab.id, text: "ON" });
                    browser.browserAction.setBadgeBackgroundColor({tabId: tab.id, color: 'yellow'});
                    browser.browserAction.setTitle({tabId: tab.id, title: 'managed, by list'});
                    browser.browserAction.disable(tab.id);
                    return;
                }
                if( tabIdStore.has(tab.id) ) {
                    setMuted(tab.id, tab.id !== aid);
                    browser.browserAction.setBadgeText({tabId: tab.id, text: "ON" });
                    browser.browserAction.setBadgeBackgroundColor({tabId: tab.id, color: 'green'});
                    browser.browserAction.setTitle({tabId: tab.id, title: 'managed, click to unmanage'});
                } else {
                    browser.browserAction.setBadgeText({tabId: tab.id, text: "OFF" });
                    browser.browserAction.setBadgeBackgroundColor({tabId: tab.id, color: 'red'});
                    browser.browserAction.setTitle({tabId: tab.id, title: 'unmanaged, click to manage'});
                }
            }else{
                // automatic
                if(isListed(tab.url)){
                    browser.browserAction.setBadgeText({tabId: tab.id, text: "OFF" });
                    browser.browserAction.setBadgeBackgroundColor({tabId: tab.id, color: 'yellow'});
                    browser.browserAction.setTitle({tabId: tab.id, title: 'unmanaged, by list'});
                    browser.browserAction.disable(tab.id);
                    return;
                }
                if( tabIdStore.has(tab.id) ) {
                    browser.browserAction.setBadgeText({tabId: tab.id, text: "OFF" });
                    browser.browserAction.setBadgeBackgroundColor({tabId: tab.id, color: 'red'});
                    browser.browserAction.setTitle({tabId: tab.id, title: 'unmanaged, click to manage'});
                } else {
                    setMuted(tab.id, tab.id !== aid);
                    browser.browserAction.setBadgeText({tabId: tab.id, text: "ON" });
                    browser.browserAction.setBadgeBackgroundColor({tabId: tab.id, color: 'green'});
                    browser.browserAction.setTitle({tabId: tab.id, title: 'managed, click to unmanage'});
                }
            }
            browser.browserAction.enable(tab.id);
        });
    }

    async function onClicked(tab /*,data*/){
        log('debug', 'onClicked');

        if(mode) { // manual
            if( tabIdStore.has(tab.id) ){
                tabIdStore.delete(tab.id);
            }else{
                tabIdStore.add(tab.id);
            }
        }else {  // automatic - default
            if( tabIdStore.has(tab.id) ){
                tabIdStore.delete(tab.id);
            }else{
                tabIdStore.add(tab.id);
            }
        }
        updateMuteState();
    }

    async function onStorageChange(/*changes, area*/){
        log('debug', 'onStorageChange');

        mode = await getMode();
        list = await getList();

        tabIdStore.clear();

        updateMuteState();
    }


    // v v v v v v v v v v v v v
    //         S T A R T
    // ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^

    const temporary = browser.runtime.id.endsWith('@temporary-addon'); // debugging?
    const manifest = browser.runtime.getManifest();
    const extname = manifest.name;

    let mode = await getMode();
    let list = await getList();
    let tabIdStore = new Set();

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
