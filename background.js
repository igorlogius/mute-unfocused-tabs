
const extId = 'mute-unfocused-tabs';
let locked = new Set();

async function onUpdated(tabId, changeInfo, tabInfo) { 
	let tabs = await browser.tabs.query({active: true, currentWindow: true});
	const atab = tabs[0];
	tabs = await browser.tabs.query({});
	tabs.forEach( (tab) => {
		if(typeof tab.id !== 'undefined') {
			if( !locked.has(tab.id) ) {
				if ( tab.id !== atab.id) {
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
	const atab = tabs[0];
	if(locked.has(atab.id)){
		locked.delete(atab.id);
		//console.log(extId + 'unlocked', atab.id)
		browser.browserAction.setIcon({"path": "icon.png"});
	}else{
		locked.add(atab.id);
		//console.log(extId + 'locked', atab.id)
		browser.browserAction.setIcon({"path": "icon-locked.png"});
	}
}

browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onUpdated.addListener(onUpdated); 

