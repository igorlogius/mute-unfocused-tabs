
const extId = 'mute-unfocused-tabs';
let locked = {};

async function updateMuteState() {
	let tabs = await browser.tabs.query({active: true, currentWindow:true});
	const aid = tabs[0].id;
	tabs = await browser.tabs.query({});
	tabs.forEach( (tab) => {
		if(typeof tab.id !== 'undefined') {
			if( typeof locked[tab.id] === 'boolean' ) {
				browser.browserAction.setIcon({tabId: tab.id, path: "icon-locked.png"});
				browser.tabs.update(tab.id, {muted: locked[tab.id]});
			}else{
				browser.browserAction.setIcon({tabId: tab.id, path: "icon.png"});
				if ( tab.id !== aid) {
					browser.tabs.update(tab.id, {muted: true});
				}else{
					browser.tabs.update(tab.id, {muted: false});
				}

			}
		}
	});
}

async function onClicked(){
	let tabs = await browser.tabs.query({active: true, currentWindow: true}); 
	const aid = tabs[0].id;
	if(typeof locked[aid] === 'boolean'){
		delete locked[aid]
		browser.browserAction.setIcon({tabId: aid, path: "icon.png"});
	}else{
		locked[aid] = tabs[0].mutedInfo.muted;
		browser.browserAction.setIcon({tabId: aid, path: "icon-locked.png"});
	}
}

function onRemoved(tabId, removeInfo) {
	if( typeof locked[tabId] === 'boolean') ) {
		delete locked[tabId];
	}
}

// add listeners
browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onActivated.addListener(updateMuteState); 
browser.tabs.onUpdated.addListener(updateMuteState,/**/{properties: ["status"]}/**/); 
browser.windows.onFocusChanged.addListener(updateMuteState);
browser.runtime.onInstalled.addListener(updateMuteState);
browser.tabs.onRemoved.addListener(onRemoved);
