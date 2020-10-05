
const extId = 'mute-unfocused-tabs';
let unmanaged = new Set()

function setPageAction(id,path,title){
	browser.browserAction.setIcon({tabId: id, path: path});
	browser.browserAction.setTitle({tabId: id, title: title});
}

function onRemoved(tabId, removeInfo) {
	if( unmanaged.has(tabId) ) {
		unmanaged.delete(tabId);
	}
}

async function updateMuteState() {
	let tabs = await browser.tabs.query({active: true, currentWindow: true});
	const aid = tabs[0].id;
	tabs = await browser.tabs.query({});
	tabs.forEach( (tab) => {
		if( unmanaged.has(tab.id) ) {
			setPageAction(tab.id,'icon-locked.png', 'enable unfocus mute');
		}else{
			setPageAction(tab.id,'icon.png', 'disable unfocus mute');
			// mute all managed, except the active tab
			browser.tabs.update(tab.id, {muted: (tab.id !== aid)}); 
		}
	});
}

async function onClicked(){
	let tabs = await browser.tabs.query({active: true, currentWindow: true}); 
	const aid = tabs[0].id;
	if( unmanaged.has(aid) ){
		unmanaged.delete(aid);
		setPageAction(aid,'icon.png', 'disable unfocus mute');
	}else{
		unmanaged.add(aid);
		setPageAction(aid,'icon-locked.png', 'enable unfocus mute');
	}
}

// add listeners
browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onRemoved.addListener(onRemoved);
browser.tabs.onActivated.addListener(updateMuteState); 
browser.tabs.onUpdated.addListener(updateMuteState,{properties:['status']}); 
browser.windows.onFocusChanged.addListener(updateMuteState);
browser.runtime.onInstalled.addListener(updateMuteState); 
