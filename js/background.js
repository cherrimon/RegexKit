// library
let webBrowser;
if (typeof browser === "undefined")
    webBrowser = chrome;
else
	webBrowser = browser;
	
function webStorageSet(o){		// universal storage.local set
	webBrowser.storage.local.set(o);
}

function webStorageGet(ls){		// universal storage.local get
	if (typeof browser === "undefined")
		webBrowser.storage.local.get(ls, onStorageGot);
	else
		webBrowser.storage.local.get(ls).then(onStorageGot, onStorageError);
}

// constant
const COMMAND_POPUP_INITIZATION = `COMMAND_POPUP_INIT`;
const COMMAND_POPUP_SEARCH 		= `COMMAND_POPUP_SEARCH`;
const COMMAND_CONTENT_RESPONSE 	= `COMMAND_CONTENT_RES`;

const DEFAULT_AFFIX    			= 50;
const DEFAULT_LIMIT     		= 10;
const DEFAULT_PATTERN   		= ``;

const MSG_DELAY_NORMAL   		= 300;

const STORAGE_TAG_AFFIX  		= 'STORAGE_TAG_AFFIX';	// replace all if renamed
const STORAGE_TAG_LIMIT  		= 'STORAGE_TAG_LIMIT';	// replace all if renamed
const STORAGE_TAG_PATTERN 		= 'STORAGE_TAG_PATTERN';// replace all if renamed

const MESSAGE_TAG_COMMAND  		= 'MESSAGE_TAG_COMMAND';// replace all if renamed
const MESSAGE_TAG_AFFIX  		= 'MESSAGE_TAG_AFFIX';	// replace all if renamed
const MESSAGE_TAG_LIMIT  		= 'MESSAGE_TAG_LIMIT';	// replace all if renamed
const MESSAGE_TAG_PATTERN  		= 'MESSAGE_TAG_PATTERN';// replace all if renamed
const MESSAGE_TAG_COUNT  		= 'MESSAGE_TAG_COUNT';	// replace all if renamed
const MESSAGE_TAG_RESULT  		= 'MESSAGE_TAG_RESULT';	// replace all if renamed

// listeners
webBrowser.runtime.onMessage.addListener(routeMessage);

// variable
var SAVED_AFFIX    		= DEFAULT_AFFIX;
var SAVED_LIMIT     	= DEFAULT_LIMIT;
var SAVED_PATTERN   	= DEFAULT_PATTERN;

webStorageGet([
	STORAGE_TAG_AFFIX,
	STORAGE_TAG_LIMIT,
	STORAGE_TAG_PATTERN
])

// deliver storage results
function onStorageGot(item) {
	if (STORAGE_TAG_AFFIX in item){
		SAVED_AFFIX = item[STORAGE_TAG_AFFIX]
		if (SAVED_AFFIX === undefined || typeof SAVED_AFFIX == 'undefined')
			SAVED_AFFIX   	= DEFAULT_AFFIX;
	} else {										// first time?
		webStorageSet({
			STORAGE_TAG_AFFIX: SAVED_AFFIX,
		});
	}
	if (STORAGE_TAG_LIMIT in item){
		SAVED_LIMIT = item[STORAGE_TAG_LIMIT]
		if (SAVED_LIMIT === undefined || typeof SAVED_LIMIT == 'undefined')
			SAVED_LIMIT   	= DEFAULT_LIMIT;
	} else {										// first time?
		webStorageSet({
			STORAGE_TAG_LIMIT: SAVED_LIMIT,
		});
	}
	if (STORAGE_TAG_PATTERN in item){				// TODO: necessary?
		SAVED_PATTERN = item[STORAGE_TAG_PATTERN]
		if (SAVED_PATTERN === undefined || typeof SAVED_PATTERN == 'undefined')
			SAVED_PATTERN   = DEFAULT_PATTERN;
	} else {										// first time?
		webStorageSet({
			STORAGE_TAG_PATTERN: SAVED_PATTERN,
		});
	}	
}

function onStorageError(error) {
	console.log(`onStorageError: ${error}`);
}


// message to tab
function tabMessage(payload) {
	webBrowser.tabs.query({
		'active': true,
		'currentWindow': true
		},
		function (tabs) {
			if (typeof tabs[0].id != 'undefined' && tabs[0].id) {
				webBrowser.tabs.sendMessage(
					tabs[0].id, 
					payload
				);
		}
	});
}

// message to popup
function popupMessage(payload) {
	webBrowser.runtime.sendMessage(    // send to popup
		// extensionId,                 // optional string
		payload
		// options                  // optional object
		)
}

// route message
function routeMessage(request, sender, sendResponse) {
	switch (request[MESSAGE_TAG_COMMAND]) {
		case COMMAND_CONTENT_RESPONSE:
			popupMessage({
				MESSAGE_TAG_COMMAND: 	request[MESSAGE_TAG_COMMAND],
				MESSAGE_TAG_COUNT:   	request[MESSAGE_TAG_COUNT],
				MESSAGE_TAG_RESULT: 	request[MESSAGE_TAG_RESULT]
			})
		break;

		case COMMAND_POPUP_INITIZATION:
			if (SAVED_AFFIX === undefined || typeof SAVED_AFFIX == 'undefined')
				SAVED_AFFIX   	= DEFAULT_AFFIX;
			if (SAVED_LIMIT === undefined || typeof SAVED_LIMIT == 'undefined')
				SAVED_LIMIT   	= DEFAULT_LIMIT;
			if (SAVED_PATTERN === undefined || typeof SAVED_PATTERN == 'undefined')
				SAVED_PATTERN   = DEFAULT_PATTERN;
			popupMessage({				// response to startup request
				MESSAGE_TAG_COMMAND: 	COMMAND_POPUP_INITIZATION,
				MESSAGE_TAG_AFFIX:  	SAVED_AFFIX,
				MESSAGE_TAG_LIMIT:   	SAVED_LIMIT,
				MESSAGE_TAG_PATTERN: 	SAVED_PATTERN
			})
			sendTimer = setTimeout(		// fresh request on startup
				function() {
					tabMessage({
						MESSAGE_TAG_COMMAND: 	COMMAND_POPUP_SEARCH,
						MESSAGE_TAG_AFFIX:  	SAVED_AFFIX,
						MESSAGE_TAG_LIMIT:   	SAVED_LIMIT,
						MESSAGE_TAG_PATTERN: 	SAVED_PATTERN
					})
				}, MSG_DELAY_NORMAL
			)
		break;

		case COMMAND_POPUP_SEARCH: 
			SAVED_AFFIX  	= request[MESSAGE_TAG_AFFIX];
			SAVED_LIMIT 	= request[MESSAGE_TAG_LIMIT];
			SAVED_PATTERN 	= request[MESSAGE_TAG_PATTERN];
			webStorageSet({
				STORAGE_TAG_AFFIX: 		SAVED_AFFIX,
				STORAGE_TAG_LIMIT: 		SAVED_LIMIT,
				STORAGE_TAG_PATTERN: 	SAVED_PATTERN
			});

			tabMessage({
				MESSAGE_TAG_COMMAND: 	request[MESSAGE_TAG_COMMAND],
				MESSAGE_TAG_AFFIX:  	request[MESSAGE_TAG_AFFIX],
				MESSAGE_TAG_LIMIT:   	request[MESSAGE_TAG_LIMIT],
				MESSAGE_TAG_PATTERN: 	request[MESSAGE_TAG_PATTERN]
			});
		break;
		// default:  
	}
}
