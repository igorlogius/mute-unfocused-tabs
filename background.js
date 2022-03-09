
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

function setMuted(tab, muted) {
    if (!tab.mutedInfo.muted && tab.mutedInfo.reason === "user") {
        // Never mute a tab that was manually unmuted.
        return;
    }
    borwser.tabs.update(tab.id, {
        muted
    });
}

let unmanaged = new Set();

function onRemoved(tabId, removeInfo) {
	if( unmanaged.has(tabId) ) {
		unmanaged.delete(tabId);
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
			log('WARN', 'invalid url regex : ' + selectors.url_regex);
			return;
		}

	});

	return wlist;

}

browser.browserAction.setBadgeBackgroundColor({color: 'white'});

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
				if( !unmanaged.has(tab.id) ){
					unmanaged.add(tab.id);
				}
				await browser.browserAction.setBadgeText({tabId: tab.id, text: "na" }); // forced unmanaged
				skip = true;
			}
		}
		if(!skip) {
			if( unmanaged.has(tab.id) ) {
				await browser.browserAction.setBadgeText({tabId: tab.id, text: "off" }); // unmanaged

			}else{
                if(tab.id === aid) {
				    await browser.tabs.update(tab.id, {muted: false});
                }else{
                    if(tab.audible) {
				        await browser.tabs.update(tab.id, {muted: true});
                    }else{
				        await browser.tabs.update(tab.id, {muted: false});
                    }
                }
				await browser.browserAction.setBadgeText({tabId: tab.id, text: "on" }); // managed
			}
		}
	});
}


async  function handleAudibleChange(tabId, changeInfo, tabInfo){

	    let tabs = await browser.tabs.query({active: true, currentWindow: true});
	    const aid = tabs[0].id;
	    const wlist = await getWhitelisted();

		let skip = false;
		for (var i=0;i < wlist.length;i++) {
			if(wlist[i].test(tabInfo.url)) {
				if( !unmanaged.has(tabId) ){
					unmanaged.add(tabId);
				}
				await browser.browserAction.setBadgeText({tabId: tabId, text: "na" }); // forced unmanaged
				skip = true;
			}
		}
		if(!skip) {
			if( unmanaged.has(tabId) ) {
				await browser.browserAction.setBadgeText({tabId: tabId, text: "off" }); // unmanaged

			}else{
				await browser.tabs.update(tabId, {muted: (tabId !== aid)});
				await browser.browserAction.setBadgeText({tabId: tabId, text: "on" }); // managed
			}
		}

}

async function onClicked(){

	const tabs = await browser.tabs.query({active: true, currentWindow: true});
	const atab = tabs[0];
	const aid = atab.id;

	if( unmanaged.has(aid) ){
		unmanaged.delete(aid);
	}else{
		unmanaged.add(aid);
	}
	updateMuteState();
}

// add listeners
browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onRemoved.addListener(onRemoved);
browser.tabs.onActivated.addListener(updateMuteState);
browser.tabs.onUpdated.addListener(handleAudibleChange,{properties:['audible']});
browser.windows.onFocusChanged.addListener(updateMuteState);
browser.runtime.onInstalled.addListener(updateMuteState);
