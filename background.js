/* global browser */
const temporary = browser.runtime.id.endsWith('@temporary-addon'); // debugging?
const manifest = browser.runtime.getManifest();
const extname = manifest.name;

let tabIdStore = new Set();

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

async function getWhitelisted() {

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

	if( typeof store.selectors === 'undefined') {
		log('debug', 'store.selectors is undefined');
		return [];
	}

	if ( typeof store.selectors.forEach !== 'function' ) {
		log('error', 'store.selectors is not iterable');
		return [];
	}

	const wlist = [];

	store.selectors.forEach( (selector) => {

		// check activ
		if(typeof selector.activ !== 'boolean') { return; }
		if(selector.activ !== true) { return; }

		// check url regex
		if(typeof selector.url_regex !== 'string') { return; }
		selector.url_regex = selector.url_regex.trim();
		if(selector.url_regex === ''){ return; }

		try {
			wlist.push(new RegExp(selector.url_regex));
		} catch(e) {
			log('WARN', 'invalid url regex : ' + selector.url_regex);
			return;
		}

	});

	return wlist;

}


async function updateMuteState() {
	log('debug', 'updateMuteState');
	let tabs = await browser.tabs.query({active: true, currentWindow: true});
	const aid = tabs[0].id;
	const wlist = await getWhitelisted();
	tabs = await browser.tabs.query({});
	let skip = false;
	tabs.forEach( async (tab) => {
		skip = false;
		for (var i=0;i < wlist.length;i++) {
			if(wlist[i].test(tab.url)) {
				if( !tabIdStore.has(tab.id) ){
					tabIdStore.add(tab.id);
				}
				browser.browserAction.setBadgeText({tabId: tab.id, text: "na" }); // forced unmanaged
				skip = true;
			}
		}
		if(!skip) {
			if( tabIdStore.has(tab.id) ) {
				browser.browserAction.setBadgeText({tabId: tab.id, text: "off" }); // unmanaged

			}else{
                setMuted(tab.id, tab.id !== aid);
				browser.browserAction.setBadgeText({tabId: tab.id, text: "on" }); // managed
			}
        }
	});
}

async function onClicked(){
	log('debug', 'onClicked');

	const tabs = await browser.tabs.query({active: true, currentWindow: true});
	const atab = tabs[0];
	const aid = atab.id;

	if( tabIdStore.has(aid) ){
		tabIdStore.delete(aid);
	}else{
		tabIdStore.add(aid);
	}
	updateMuteState();
}

browser.browserAction.setBadgeBackgroundColor({color: 'white'});

// add listeners
browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onRemoved.addListener(onRemoved);
browser.tabs.onActivated.addListener(updateMuteState);
browser.windows.onFocusChanged.addListener(updateMuteState);
browser.runtime.onInstalled.addListener(updateMuteState);

