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

const INPUT_PATTERN   			= document.getElementById("pattern");
const DROPDOWN_HISTORY 			= document.getElementById("history");
const BTN_SEARCH				= document.getElementById("send");

const BTN_AFFIX_DN 				= document.getElementById("affix-");
const INPUT_AFFIX   			= document.getElementById("affix");
const BTN_AFFIX_UP 				= document.getElementById("affix+");

const BTN_LIMIT_DN  			= document.getElementById("limit-");
const INPUT_LIMIT    			= document.getElementById("limit");
const BTN_LIMIT_UP  			= document.getElementById("limit+");

const TEXT_COUNT 				= document.getElementById("count");
const TBL_RESULT   				= document.getElementById('result');

const MSG_DELAY_INIT   			= 50;
const MSG_DELAY_NORMAL   		= 300;

const MISTORY_COUNT_MAX   		= 300;

const STORAGE_TAG_HISTORY  		= 'STORAGE_TAG_HISTORY';// replace all if renamed

const MESSAGE_TAG_COMMAND  		= 'MESSAGE_TAG_COMMAND';// replace all if renamed
const MESSAGE_TAG_AFFIX  		= 'MESSAGE_TAG_AFFIX';	// replace all if renamed
const MESSAGE_TAG_LIMIT  		= 'MESSAGE_TAG_LIMIT';	// replace all if renamed
const MESSAGE_TAG_PATTERN  		= 'MESSAGE_TAG_PATTERN';// replace all if renamed
const MESSAGE_TAG_COUNT  		= 'MESSAGE_TAG_COUNT';	// replace all if renamed
const MESSAGE_TAG_RESULT  		= 'MESSAGE_TAG_RESULT';	// replace all if renamed

// listener
INPUT_PATTERN.addEventListener(	"input", 	handleInput);
INPUT_PATTERN.addEventListener(	"keypress",	handleKeyPress);
BTN_SEARCH.addEventListener(	"click", 	handleBtn);

BTN_AFFIX_DN.addEventListener(	"click", 	handleBtn);
INPUT_AFFIX.addEventListener(	"input", 	handleInput);
BTN_AFFIX_UP.addEventListener(	"click", 	handleBtn);

BTN_LIMIT_DN.addEventListener(	"click", 	handleBtn);
INPUT_LIMIT.addEventListener(	"input", 	handleInput);
BTN_LIMIT_UP.addEventListener(	"click", 	handleBtn);

webBrowser.runtime.onMessage.addListener(routeMessage);

// variable  
let delayCommand = COMMAND_POPUP_INITIZATION;
let messageTimer = setTimeout(
	function() {
		backgroundMessage({
			MESSAGE_TAG_COMMAND:  	delayCommand,
			MESSAGE_TAG_AFFIX:  	INPUT_AFFIX.value,
			MESSAGE_TAG_LIMIT:    	INPUT_LIMIT.value,
			MESSAGE_TAG_PATTERN:  	INPUT_PATTERN.value,
			})
		}, MSG_DELAY_INIT
)

let savedResults  = [];
let history = [];
webStorageGet([
	STORAGE_TAG_HISTORY
])

// deliver storage results
function onStorageGot(item) {
	if (STORAGE_TAG_HISTORY in item){
		console.log(`onStorageGot: ${STORAGE_TAG_HISTORY}`);
		history.length = 0;
		history = JSON.parse(item[STORAGE_TAG_HISTORY])
		DROPDOWN_HISTORY.innerHTML = "";
		console.log(`onStorageGot: ${history}`);
		history.forEach((v) => {

			var container = document.createElement("div");
			let table 	= document.createElement('table');	// prepare for output
			let header	= table.createTHead();;
			let row     = header.insertRow();
			let cellA 	= row.insertCell();
			cellA.style.width 		= "3000px"
			cellA.style.overflow 	= "auto"
			cellA.setAttribute('id', v);
			cellA.textContent = v;
			cellA.addEventListener(	"click", 	handleHistorySelect);

			let cellB 	= row.insertCell();
			let btn = document.createElement('button');
			btn.setAttribute('id', v);
			btn.textContent = 'x';
			btn.addEventListener(	"click", 	handleHistoryDelete);
			cellB.appendChild(btn)
			container.append(table);
			DROPDOWN_HISTORY.appendChild(container);

		})
	}
}

function onStorageError(error) {
	console.log(`onStorageError: ${error}`);
}

// update history in both storage and UI
function updateHistory(){
}

// add search content to storage
function addHistory(){
	console.log(`addHistory: ${history}`);
	let v = INPUT_PATTERN.value;
	history = history.filter(function(item) {	// remove result with same content
		return item !== v
	});
	history.unshift(v)							// add to array head
	console.log(`added ${history}`);
	if (history.length > MISTORY_COUNT_MAX)		// limit maximum # of results
		history.length = MISTORY_COUNT_MAX
	webStorageSet({								// update history
		STORAGE_TAG_HISTORY: JSON.stringify(history),
	});
	webStorageGet([								// refresh history in UI
		STORAGE_TAG_HISTORY
		]);
}
// add search content to storage
function handleHistoryDelete(e){
	console.log(`handleHistoryDelete ${e.target.id} ${e.target.textContent}`)
	let v = e.target.id;
	history = history.filter(function(item) {	// remove result with same content
		return item !== v
	});
	webStorageSet({								// update history
		STORAGE_TAG_HISTORY: JSON.stringify(history),
	});
	webStorageGet([								// refresh history in UI
		STORAGE_TAG_HISTORY
		]);
}

// action when selected history
function handleHistorySelect(e){
	console.log(`handleHistorySelect ${e.target.id} ${e.target.textContent}`)
	INPUT_PATTERN.value = e.target.textContent;
	addHistory();
	handleInput();
}

// action when button pressed
function handleBtn(e){
	let val = 0;
	switch (e.target.id) {
		case BTN_AFFIX_DN.id: 
			val = parseInt(INPUT_AFFIX.value, 10);
			val = val - 1;
			if (val <= 0)
				val = 0;
			INPUT_AFFIX.value = val;
		break;
		
		case BTN_AFFIX_UP.id: 
			val = parseInt(INPUT_AFFIX.value, 10);  
			val = val + 1;
			INPUT_AFFIX.value = val;
		break;
		
		case BTN_LIMIT_DN.id: 
			val = parseInt(INPUT_LIMIT.value, 10);
			val = val - 1;
			if (val <= 0)
				val = 0;
			INPUT_LIMIT.value = val;
		break;

		case BTN_LIMIT_UP.id: 
			val = parseInt(INPUT_LIMIT.value, 10);  
			val = val + 1;
			INPUT_LIMIT.value = val;
		break;

		case BTN_SEARCH.id:
			addHistory();
		break;
		// // default:  
	}
	handleInput();
}

// action when key pressed
function handleKeyPress(e){
	if (e.key === 'Enter') {
		addHistory();
	}
	handleInput();
}

// prepare message to send
function handleInput() {
	delayCommand = COMMAND_POPUP_SEARCH;
	clearTimeout(messageTimer);

	messageTimer = setTimeout(
		function() { 
			backgroundMessage({
				MESSAGE_TAG_COMMAND:  	delayCommand,
				MESSAGE_TAG_AFFIX:   	INPUT_AFFIX.value,
				MESSAGE_TAG_LIMIT:    	INPUT_LIMIT.value,
				MESSAGE_TAG_PATTERN:  	INPUT_PATTERN.value,
			}) 
		}, MSG_DELAY_NORMAL
	)
	// if (INPUT_PATTERN.value){             	// have input
	// 	messageTimer = setTimeout(
	// 	function() { 
	// 		backgroundMessage({
	// 			MESSAGE_TAG_COMMAND:  	delayCommand,
	// 			MESSAGE_TAG_AFFIX:   	INPUT_AFFIX.value,
	// 			MESSAGE_TAG_LIMIT:    	INPUT_LIMIT.value,
	// 			MESSAGE_TAG_PATTERN:  	INPUT_PATTERN.value,
	// 		}) 
	// 	}, MSG_DELAY_NORMAL
	// 	)
	// }
}


// message to background
function backgroundMessage(payload) {
	webBrowser.runtime.sendMessage(payload);
}

// create captured group list
function capturedList(pattern, data){
	var container = document.createElement("div");
	container.style.width 		= "80px"
	container.style.overflow 	= "auto"
	let table 	= document.createElement('table');	// prepare for output
	let header	= table.createTHead();;
	const re = new RegExp(pattern, 'g');
	let match = re.exec(data);
	if (match.length > 1){							// skip the whole result
		for (let i = 1; i < match.length; i++){		// compute captured list
			let row     = header.insertRow();
			let cell 	= row.insertCell();
			let cg  	= document.createTextNode(match[i]);
			cell.appendChild(cg);
		}
	}
	container.append(table);
	return container;
}

// format result: set affix font to gray
function formatResult(length, data){
	var container = document.createElement("div");
	container.style.overflow = "auto"
	var s1 = document.createElement("span");
	var s2 = document.createElement("span");
	var s3 = document.createElement("span");
	s1.textContent = data.substring(0, length);
	s2.textContent = data.substring(length, data.length - length);
	s3.textContent = data.substring(data.length - length);
	s1.style.color = "gray";
	s3.style.color = "gray";
	container.append(s1, s2, s3);
	return container;
}

// refresh table
function refreshTbl(data) {
	TBL_RESULT.innerHTML 		= "";
	TBL_RESULT.style.margin 	= "0px 0px 0px 10px"
	TBL_RESULT.style.fontSize	= "smaller"
	let header      	= TBL_RESULT.createTHead();
	let row         	= header.insertRow(0);
	let resultHead 		= row.insertCell();
	let rh  = document.createTextNode(`${INPUT_AFFIX.value} + Pattern + ${INPUT_AFFIX.value}`);
	resultHead.appendChild(rh);

	let captureHead = row.insertCell();
	let ch  = document.createTextNode("(?)");
	captureHead.appendChild(ch);

	for (let i = 0; i < data.length; i++) {
		row     	= header.insertRow(i + 1);
		resultCol 	= row.insertCell();
		capturedCol = row.insertCell();
		
		let innerResult  = formatResult(
			INPUT_AFFIX.value, 
			data[i]
			);
		resultCol.appendChild(innerResult);

		let innerTable = capturedList(
			INPUT_PATTERN.value, 
			data[i]
			)
		capturedCol.appendChild(innerTable);
	}
}

// route message
function routeMessage(request, sender, sendResponse) {	
	if (request[MESSAGE_TAG_COMMAND] == COMMAND_POPUP_INITIZATION){	// popup requires initialization
		INPUT_AFFIX.value 		= request[MESSAGE_TAG_AFFIX];
		INPUT_LIMIT.value 		= request[MESSAGE_TAG_LIMIT];
		INPUT_PATTERN.value 	= request[MESSAGE_TAG_PATTERN];
	// } else if (request.command == COMMAND_CONTENT_RESPONSE){
	} else {								// upon response from content
		TEXT_COUNT.innerText 	= request[MESSAGE_TAG_COUNT];
		savedResults    		= request[MESSAGE_TAG_RESULT];
		refreshTbl(savedResults)
	}
}