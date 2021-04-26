
const temporary = browser.runtime.id.endsWith('@temporary-addon'); // debugging?
const manifest = browser.runtime.getManifest();
const extname = manifest.name;

const log = (level, msg) => {
	level = level.trim().toLowerCase();
	if (['error','warn'].includes(level)
		|| ( temporary && ['debug','info','log'].includes(level))
	) {
		console[level](extname + '::' + level.toUpperCase() + '::' + msg);
		return;
	}
};

let unmanaged = new Set();

function onRemoved(tabId, removeInfo) {
	if( unmanaged.has(tabId) ) {
		unmanaged.delete(tabId);
	}
}

async function getWhitelisted() {

	try {
		store = await browser.storage.local.get('selectors');
	}catch(e){
		log('ERROR', 'access to rules storage failed');
		return [];
	}

	if ( typeof store.selectors.forEach !== 'function' ) { 
		log('ERROR', 'rules selectors not iterable');
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
			log('WARN', 'invalid url regex : ' + selectors.url_regex);
			return;
		}

	});

	return wlist;

}

browser.browserAction.setBadgeBackgroundColor(
	{color: 'white'}
)

async function updateMuteState() {
	log('debug', 'updateMuteState');
	let tabs = await browser.tabs.query({active: true, currentWindow: true});
	const aid = tabs[0].id;
	const wlist = await getWhitelisted();
	tabs = await browser.tabs.query({});
	tabs.forEach( (tab) => {
		for (var i=0;i < wlist.length;i++) {
			if(wlist[i].test(tab.url)) {
				browser.browserAction.setBadgeText({tabId: tab.id, text: "n/a"});
				if( unmanaged.has(aid) ){
					unmanaged.delete(aid);
				}
				return;
			}
		}
		if( unmanaged.has(tab.id) ) {
			browser.browserAction.setBadgeText({tabId: tab.id, text: "off"});
		}else{
			browser.browserAction.setBadgeText({tabId: tab.id, text: "on"});
			browser.tabs.update(tab.id, {muted: (tab.id !== aid)}); 
		}
	});
}

async function onClicked(){
	const tabs = await browser.tabs.query({active: true, currentWindow: true});
	const aid = tabs[0].id;
	const wlist = await getWhitelisted();
	let onWL = false;
	for (var i=0;i < wlist.length;i++) {
		if(wlist[i].test(tabs[0].url)) {
			onWL = true;
			return;	
		}
	}
	if( unmanaged.has(aid) ){
		unmanaged.delete(aid);
		browser.browserAction.setBadgeText({tabId: aid, text: "on"});
	}else{
		unmanaged.add(aid);
		browser.browserAction.setBadgeText({tabId: aid, text: "off"});
	}
}

// add listeners
browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onRemoved.addListener(onRemoved);
browser.tabs.onActivated.addListener(updateMuteState); 
browser.tabs.onUpdated.addListener(updateMuteState,{properties:['status']}); 
browser.windows.onFocusChanged.addListener(updateMuteState);
browser.runtime.onInstalled.addListener(updateMuteState); 
