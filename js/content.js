// library
let webBrowser;
if (typeof browser === "undefined")
    webBrowser = chrome;
else
	webBrowser = browser;

Element.prototype.visible = function() {
	return (!window.getComputedStyle(this) || 
			window.getComputedStyle(this).getPropertyValue('display') == '' || 
			window.getComputedStyle(this).getPropertyValue('display') != 'none')
}

// constant
const COMMAND_POPUP_SEARCH 		= `COMMAND_POPUP_SEARCH`;
const COMMAND_CONTENT_RESPONSE 	= `COMMAND_CONTENT_RES`;

const ELEMENT_NODE_TYPE 		= 1;
const TEXT_NODE_TYPE 			= 3;
const UNEXPANDABLE 				= /(script|style|svg|audio|canvas|figure|video|select|input|textarea)/i;
const HIGHLIGHT_TAG 			= 'mark';

const MESSAGE_TAG_COMMAND  		= 'MESSAGE_TAG_COMMAND';// replace all if renamed
const MESSAGE_TAG_AFFIX  		= 'MESSAGE_TAG_AFFIX';	// replace all if renamed
const MESSAGE_TAG_LIMIT  		= 'MESSAGE_TAG_LIMIT';	// replace all if renamed
const MESSAGE_TAG_PATTERN  		= 'MESSAGE_TAG_PATTERN';// replace all if renamed
const MESSAGE_TAG_COUNT  		= 'MESSAGE_TAG_COUNT';	// replace all if renamed
const MESSAGE_TAG_RESULT  		= 'MESSAGE_TAG_RESULT';	// replace all if renamed

// listener
webBrowser.runtime.onMessage.addListener(routeMessage);

// variable
var nodesInfo = [];

(function() {
})();

// message to background
function backgroundMessage(payload) {
	webBrowser.runtime.sendMessage(    // send to popup
		// extensionId,             // optional string
		payload
		// options                  // optional object
		)
}

// Check if the given node is a text node
function isTextNode(node) {
	return node && node.nodeType === TEXT_NODE_TYPE;
}

// Check if the given node is an expandable node that will yield text nodes
function isExpandable(node) {
	return node && node.nodeType === ELEMENT_NODE_TYPE && node.childNodes && 
	!UNEXPANDABLE.test(node.tagName) && node.visible();
}

// Highlight all text that matches regex
function addHighlight(pattern) {
	let re = new RegExp(pattern);
	function recurHighlight(prefix, n, node) {
		if (isTextNode(node)) {
			var index = node.data.search(re);
			if (index >= 0 && node.data.length > 0) {
				var highlightedNode = node.parentNode;				
				// remove highlighted by innerNode
				highlightedNode.innerHTML  = highlightedNode.innerHTML.replace(
					/<\/?mark[^>]*>/g, 
					""
					);
				// clone for removeHighlight()
				var originalNode = highlightedNode.cloneNode(true);
				// highlight
				highlightedNode.innerHTML  = highlightedNode.innerHTML.replace(	
					re, 
					(str) => `<mark>${str}</mark>`
					);
				// save nodes for removeHighlight()
				nodesInfo.push({												
					'originalNode': 	originalNode,
					'highlightedNode': 	highlightedNode
				});
				return 1;
			}
		} else if (isExpandable(node)) {
			let e = 0;
			var children = node.childNodes;
			for (var i = 0; i < children.length; ++i) {
				let nPrefix = `${prefix}${n}.`;
				var child = children[i];
				i += recurHighlight(nPrefix, e, child);
				e++;
			}
		}
		return 0;
	}
	recurHighlight(``, 0, document.getElementsByTagName('body')[0]);
};

// Remove all highlights from page
function removeHighlight(pattern) {
	for(let i = 0; i < nodesInfo.length; i++){
		let highlightedNode = nodesInfo[i].highlightedNode;
		let originalNode 	= nodesInfo[i].originalNode;
		highlightedNode.innerHTML  = originalNode.innerHTML;
	}
	nodesInfo.length = 0;
};

// Regex matches + affix
function computeResults(
	pattern, 
	length,
	src
	){
	pattern = String.raw`([\s\S]{${length}}${pattern}[\s\S]{${length}})`;
	let re = new RegExp(pattern, 'g');
	return src.match(re);
}

// respond to popup
function computeRes(request){
	let pattern 	= request[MESSAGE_TAG_PATTERN];
	let affix 		= request[MESSAGE_TAG_AFFIX];
	let limit 		= request[MESSAGE_TAG_LIMIT];
	let results 	= [];
	let resultCount = 0;
	removeHighlight(pattern);				// reset highlighted content if necessary
	if (pattern){							// valid pattern		
		results = computeResults(
			pattern, 
			affix,
			document.documentElement.innerHTML
			);
		addHighlight(pattern);				// highlight the content if possible					
		if (results == null)		
			results = []            		// empty array
		resultCount = results.length;	// limit number of results
		if (results.length > limit){
			results.length = limit;
		}
	}
	backgroundMessage({						// send result to popup
		MESSAGE_TAG_COMMAND: 	COMMAND_CONTENT_RESPONSE,
		MESSAGE_TAG_COUNT:   	resultCount,
		MESSAGE_TAG_RESULT: 	results
	});
}

// Route message
function routeMessage(request, sender, sendResponse) {
	switch (request[MESSAGE_TAG_COMMAND]) {
		case COMMAND_POPUP_SEARCH:
		computeRes(
			request
		);
		break;
	}
}