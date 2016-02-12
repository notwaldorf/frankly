(function () {
window.WebComponents = window.WebComponents || { flags: {} };
var file = 'webcomponents-lite.js';
var script = document.querySelector('script[src*="' + file + '"]');
var flags = {};
if (!flags.noOpts) {
location.search.slice(1).split('&').forEach(function (option) {
var parts = option.split('=');
var match;
if (parts[0] && (match = parts[0].match(/wc-(.+)/))) {
flags[match[1]] = parts[1] || true;
}
});
if (script) {
for (var i = 0, a; a = script.attributes[i]; i++) {
if (a.name !== 'src') {
flags[a.name] = a.value || true;
}
}
}
if (flags.log && flags.log.split) {
var parts = flags.log.split(',');
flags.log = {};
parts.forEach(function (f) {
flags.log[f] = true;
});
} else {
flags.log = {};
}
}
if (flags.register) {
window.CustomElements = window.CustomElements || { flags: {} };
window.CustomElements.flags.register = flags.register;
}
WebComponents.flags = flags;
}());
(function (scope) {
'use strict';
var hasWorkingUrl = false;
if (!scope.forceJURL) {
try {
var u = new URL('b', 'http://a');
u.pathname = 'c%20d';
hasWorkingUrl = u.href === 'http://a/c%20d';
} catch (e) {
}
}
if (hasWorkingUrl)
return;
var relative = Object.create(null);
relative['ftp'] = 21;
relative['file'] = 0;
relative['gopher'] = 70;
relative['http'] = 80;
relative['https'] = 443;
relative['ws'] = 80;
relative['wss'] = 443;
var relativePathDotMapping = Object.create(null);
relativePathDotMapping['%2e'] = '.';
relativePathDotMapping['.%2e'] = '..';
relativePathDotMapping['%2e.'] = '..';
relativePathDotMapping['%2e%2e'] = '..';
function isRelativeScheme(scheme) {
return relative[scheme] !== undefined;
}
function invalid() {
clear.call(this);
this._isInvalid = true;
}
function IDNAToASCII(h) {
if ('' == h) {
invalid.call(this);
}
return h.toLowerCase();
}
function percentEscape(c) {
var unicode = c.charCodeAt(0);
if (unicode > 32 && unicode < 127 && [
34,
35,
60,
62,
63,
96
].indexOf(unicode) == -1) {
return c;
}
return encodeURIComponent(c);
}
function percentEscapeQuery(c) {
var unicode = c.charCodeAt(0);
if (unicode > 32 && unicode < 127 && [
34,
35,
60,
62,
96
].indexOf(unicode) == -1) {
return c;
}
return encodeURIComponent(c);
}
var EOF = undefined, ALPHA = /[a-zA-Z]/, ALPHANUMERIC = /[a-zA-Z0-9\+\-\.]/;
function parse(input, stateOverride, base) {
function err(message) {
errors.push(message);
}
var state = stateOverride || 'scheme start', cursor = 0, buffer = '', seenAt = false, seenBracket = false, errors = [];
loop:
while ((input[cursor - 1] != EOF || cursor == 0) && !this._isInvalid) {
var c = input[cursor];
switch (state) {
case 'scheme start':
if (c && ALPHA.test(c)) {
buffer += c.toLowerCase();
state = 'scheme';
} else if (!stateOverride) {
buffer = '';
state = 'no scheme';
continue;
} else {
err('Invalid scheme.');
break loop;
}
break;
case 'scheme':
if (c && ALPHANUMERIC.test(c)) {
buffer += c.toLowerCase();
} else if (':' == c) {
this._scheme = buffer;
buffer = '';
if (stateOverride) {
break loop;
}
if (isRelativeScheme(this._scheme)) {
this._isRelative = true;
}
if ('file' == this._scheme) {
state = 'relative';
} else if (this._isRelative && base && base._scheme == this._scheme) {
state = 'relative or authority';
} else if (this._isRelative) {
state = 'authority first slash';
} else {
state = 'scheme data';
}
} else if (!stateOverride) {
buffer = '';
cursor = 0;
state = 'no scheme';
continue;
} else if (EOF == c) {
break loop;
} else {
err('Code point not allowed in scheme: ' + c);
break loop;
}
break;
case 'scheme data':
if ('?' == c) {
this._query = '?';
state = 'query';
} else if ('#' == c) {
this._fragment = '#';
state = 'fragment';
} else {
if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._schemeData += percentEscape(c);
}
}
break;
case 'no scheme':
if (!base || !isRelativeScheme(base._scheme)) {
err('Missing scheme.');
invalid.call(this);
} else {
state = 'relative';
continue;
}
break;
case 'relative or authority':
if ('/' == c && '/' == input[cursor + 1]) {
state = 'authority ignore slashes';
} else {
err('Expected /, got: ' + c);
state = 'relative';
continue;
}
break;
case 'relative':
this._isRelative = true;
if ('file' != this._scheme)
this._scheme = base._scheme;
if (EOF == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = base._query;
this._username = base._username;
this._password = base._password;
break loop;
} else if ('/' == c || '\\' == c) {
if ('\\' == c)
err('\\ is an invalid code point.');
state = 'relative slash';
} else if ('?' == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = '?';
this._username = base._username;
this._password = base._password;
state = 'query';
} else if ('#' == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = base._query;
this._fragment = '#';
this._username = base._username;
this._password = base._password;
state = 'fragment';
} else {
var nextC = input[cursor + 1];
var nextNextC = input[cursor + 2];
if ('file' != this._scheme || !ALPHA.test(c) || nextC != ':' && nextC != '|' || EOF != nextNextC && '/' != nextNextC && '\\' != nextNextC && '?' != nextNextC && '#' != nextNextC) {
this._host = base._host;
this._port = base._port;
this._username = base._username;
this._password = base._password;
this._path = base._path.slice();
this._path.pop();
}
state = 'relative path';
continue;
}
break;
case 'relative slash':
if ('/' == c || '\\' == c) {
if ('\\' == c) {
err('\\ is an invalid code point.');
}
if ('file' == this._scheme) {
state = 'file host';
} else {
state = 'authority ignore slashes';
}
} else {
if ('file' != this._scheme) {
this._host = base._host;
this._port = base._port;
this._username = base._username;
this._password = base._password;
}
state = 'relative path';
continue;
}
break;
case 'authority first slash':
if ('/' == c) {
state = 'authority second slash';
} else {
err('Expected \'/\', got: ' + c);
state = 'authority ignore slashes';
continue;
}
break;
case 'authority second slash':
state = 'authority ignore slashes';
if ('/' != c) {
err('Expected \'/\', got: ' + c);
continue;
}
break;
case 'authority ignore slashes':
if ('/' != c && '\\' != c) {
state = 'authority';
continue;
} else {
err('Expected authority, got: ' + c);
}
break;
case 'authority':
if ('@' == c) {
if (seenAt) {
err('@ already seen.');
buffer += '%40';
}
seenAt = true;
for (var i = 0; i < buffer.length; i++) {
var cp = buffer[i];
if ('\t' == cp || '\n' == cp || '\r' == cp) {
err('Invalid whitespace in authority.');
continue;
}
if (':' == cp && null === this._password) {
this._password = '';
continue;
}
var tempC = percentEscape(cp);
null !== this._password ? this._password += tempC : this._username += tempC;
}
buffer = '';
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
cursor -= buffer.length;
buffer = '';
state = 'host';
continue;
} else {
buffer += c;
}
break;
case 'file host':
if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
if (buffer.length == 2 && ALPHA.test(buffer[0]) && (buffer[1] == ':' || buffer[1] == '|')) {
state = 'relative path';
} else if (buffer.length == 0) {
state = 'relative path start';
} else {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'relative path start';
}
continue;
} else if ('\t' == c || '\n' == c || '\r' == c) {
err('Invalid whitespace in file host.');
} else {
buffer += c;
}
break;
case 'host':
case 'hostname':
if (':' == c && !seenBracket) {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'port';
if ('hostname' == stateOverride) {
break loop;
}
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'relative path start';
if (stateOverride) {
break loop;
}
continue;
} else if ('\t' != c && '\n' != c && '\r' != c) {
if ('[' == c) {
seenBracket = true;
} else if (']' == c) {
seenBracket = false;
}
buffer += c;
} else {
err('Invalid code point in host/hostname: ' + c);
}
break;
case 'port':
if (/[0-9]/.test(c)) {
buffer += c;
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c || stateOverride) {
if ('' != buffer) {
var temp = parseInt(buffer, 10);
if (temp != relative[this._scheme]) {
this._port = temp + '';
}
buffer = '';
}
if (stateOverride) {
break loop;
}
state = 'relative path start';
continue;
} else if ('\t' == c || '\n' == c || '\r' == c) {
err('Invalid code point in port: ' + c);
} else {
invalid.call(this);
}
break;
case 'relative path start':
if ('\\' == c)
err('\'\\\' not allowed in path.');
state = 'relative path';
if ('/' != c && '\\' != c) {
continue;
}
break;
case 'relative path':
if (EOF == c || '/' == c || '\\' == c || !stateOverride && ('?' == c || '#' == c)) {
if ('\\' == c) {
err('\\ not allowed in relative path.');
}
var tmp;
if (tmp = relativePathDotMapping[buffer.toLowerCase()]) {
buffer = tmp;
}
if ('..' == buffer) {
this._path.pop();
if ('/' != c && '\\' != c) {
this._path.push('');
}
} else if ('.' == buffer && '/' != c && '\\' != c) {
this._path.push('');
} else if ('.' != buffer) {
if ('file' == this._scheme && this._path.length == 0 && buffer.length == 2 && ALPHA.test(buffer[0]) && buffer[1] == '|') {
buffer = buffer[0] + ':';
}
this._path.push(buffer);
}
buffer = '';
if ('?' == c) {
this._query = '?';
state = 'query';
} else if ('#' == c) {
this._fragment = '#';
state = 'fragment';
}
} else if ('\t' != c && '\n' != c && '\r' != c) {
buffer += percentEscape(c);
}
break;
case 'query':
if (!stateOverride && '#' == c) {
this._fragment = '#';
state = 'fragment';
} else if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._query += percentEscapeQuery(c);
}
break;
case 'fragment':
if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._fragment += c;
}
break;
}
cursor++;
}
}
function clear() {
this._scheme = '';
this._schemeData = '';
this._username = '';
this._password = null;
this._host = '';
this._port = '';
this._path = [];
this._query = '';
this._fragment = '';
this._isInvalid = false;
this._isRelative = false;
}
function jURL(url, base) {
if (base !== undefined && !(base instanceof jURL))
base = new jURL(String(base));
this._url = url;
clear.call(this);
var input = url.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, '');
parse.call(this, input, null, base);
}
jURL.prototype = {
toString: function () {
return this.href;
},
get href() {
if (this._isInvalid)
return this._url;
var authority = '';
if ('' != this._username || null != this._password) {
authority = this._username + (null != this._password ? ':' + this._password : '') + '@';
}
return this.protocol + (this._isRelative ? '//' + authority + this.host : '') + this.pathname + this._query + this._fragment;
},
set href(href) {
clear.call(this);
parse.call(this, href);
},
get protocol() {
return this._scheme + ':';
},
set protocol(protocol) {
if (this._isInvalid)
return;
parse.call(this, protocol + ':', 'scheme start');
},
get host() {
return this._isInvalid ? '' : this._port ? this._host + ':' + this._port : this._host;
},
set host(host) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, host, 'host');
},
get hostname() {
return this._host;
},
set hostname(hostname) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, hostname, 'hostname');
},
get port() {
return this._port;
},
set port(port) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, port, 'port');
},
get pathname() {
return this._isInvalid ? '' : this._isRelative ? '/' + this._path.join('/') : this._schemeData;
},
set pathname(pathname) {
if (this._isInvalid || !this._isRelative)
return;
this._path = [];
parse.call(this, pathname, 'relative path start');
},
get search() {
return this._isInvalid || !this._query || '?' == this._query ? '' : this._query;
},
set search(search) {
if (this._isInvalid || !this._isRelative)
return;
this._query = '?';
if ('?' == search[0])
search = search.slice(1);
parse.call(this, search, 'query');
},
get hash() {
return this._isInvalid || !this._fragment || '#' == this._fragment ? '' : this._fragment;
},
set hash(hash) {
if (this._isInvalid)
return;
this._fragment = '#';
if ('#' == hash[0])
hash = hash.slice(1);
parse.call(this, hash, 'fragment');
},
get origin() {
var host;
if (this._isInvalid || !this._scheme) {
return '';
}
switch (this._scheme) {
case 'data':
case 'file':
case 'javascript':
case 'mailto':
return 'null';
}
host = this.host;
if (!host) {
return '';
}
return this._scheme + '://' + host;
}
};
var OriginalURL = scope.URL;
if (OriginalURL) {
jURL.createObjectURL = function (blob) {
return OriginalURL.createObjectURL.apply(OriginalURL, arguments);
};
jURL.revokeObjectURL = function (url) {
OriginalURL.revokeObjectURL(url);
};
}
scope.URL = jURL;
}(self));
if (typeof WeakMap === 'undefined') {
(function () {
var defineProperty = Object.defineProperty;
var counter = Date.now() % 1000000000;
var WeakMap = function () {
this.name = '__st' + (Math.random() * 1000000000 >>> 0) + (counter++ + '__');
};
WeakMap.prototype = {
set: function (key, value) {
var entry = key[this.name];
if (entry && entry[0] === key)
entry[1] = value;
else
defineProperty(key, this.name, {
value: [
key,
value
],
writable: true
});
return this;
},
get: function (key) {
var entry;
return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
},
'delete': function (key) {
var entry = key[this.name];
if (!entry || entry[0] !== key)
return false;
entry[0] = entry[1] = undefined;
return true;
},
has: function (key) {
var entry = key[this.name];
if (!entry)
return false;
return entry[0] === key;
}
};
window.WeakMap = WeakMap;
}());
}
(function (global) {
if (global.JsMutationObserver) {
return;
}
var registrationsTable = new WeakMap();
var setImmediate;
if (/Trident|Edge/.test(navigator.userAgent)) {
setImmediate = setTimeout;
} else if (window.setImmediate) {
setImmediate = window.setImmediate;
} else {
var setImmediateQueue = [];
var sentinel = String(Math.random());
window.addEventListener('message', function (e) {
if (e.data === sentinel) {
var queue = setImmediateQueue;
setImmediateQueue = [];
queue.forEach(function (func) {
func();
});
}
});
setImmediate = function (func) {
setImmediateQueue.push(func);
window.postMessage(sentinel, '*');
};
}
var isScheduled = false;
var scheduledObservers = [];
function scheduleCallback(observer) {
scheduledObservers.push(observer);
if (!isScheduled) {
isScheduled = true;
setImmediate(dispatchCallbacks);
}
}
function wrapIfNeeded(node) {
return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
}
function dispatchCallbacks() {
isScheduled = false;
var observers = scheduledObservers;
scheduledObservers = [];
observers.sort(function (o1, o2) {
return o1.uid_ - o2.uid_;
});
var anyNonEmpty = false;
observers.forEach(function (observer) {
var queue = observer.takeRecords();
removeTransientObserversFor(observer);
if (queue.length) {
observer.callback_(queue, observer);
anyNonEmpty = true;
}
});
if (anyNonEmpty)
dispatchCallbacks();
}
function removeTransientObserversFor(observer) {
observer.nodes_.forEach(function (node) {
var registrations = registrationsTable.get(node);
if (!registrations)
return;
registrations.forEach(function (registration) {
if (registration.observer === observer)
registration.removeTransientObservers();
});
});
}
function forEachAncestorAndObserverEnqueueRecord(target, callback) {
for (var node = target; node; node = node.parentNode) {
var registrations = registrationsTable.get(node);
if (registrations) {
for (var j = 0; j < registrations.length; j++) {
var registration = registrations[j];
var options = registration.options;
if (node !== target && !options.subtree)
continue;
var record = callback(options);
if (record)
registration.enqueue(record);
}
}
}
}
var uidCounter = 0;
function JsMutationObserver(callback) {
this.callback_ = callback;
this.nodes_ = [];
this.records_ = [];
this.uid_ = ++uidCounter;
}
JsMutationObserver.prototype = {
observe: function (target, options) {
target = wrapIfNeeded(target);
if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
throw new SyntaxError();
}
var registrations = registrationsTable.get(target);
if (!registrations)
registrationsTable.set(target, registrations = []);
var registration;
for (var i = 0; i < registrations.length; i++) {
if (registrations[i].observer === this) {
registration = registrations[i];
registration.removeListeners();
registration.options = options;
break;
}
}
if (!registration) {
registration = new Registration(this, target, options);
registrations.push(registration);
this.nodes_.push(target);
}
registration.addListeners();
},
disconnect: function () {
this.nodes_.forEach(function (node) {
var registrations = registrationsTable.get(node);
for (var i = 0; i < registrations.length; i++) {
var registration = registrations[i];
if (registration.observer === this) {
registration.removeListeners();
registrations.splice(i, 1);
break;
}
}
}, this);
this.records_ = [];
},
takeRecords: function () {
var copyOfRecords = this.records_;
this.records_ = [];
return copyOfRecords;
}
};
function MutationRecord(type, target) {
this.type = type;
this.target = target;
this.addedNodes = [];
this.removedNodes = [];
this.previousSibling = null;
this.nextSibling = null;
this.attributeName = null;
this.attributeNamespace = null;
this.oldValue = null;
}
function copyMutationRecord(original) {
var record = new MutationRecord(original.type, original.target);
record.addedNodes = original.addedNodes.slice();
record.removedNodes = original.removedNodes.slice();
record.previousSibling = original.previousSibling;
record.nextSibling = original.nextSibling;
record.attributeName = original.attributeName;
record.attributeNamespace = original.attributeNamespace;
record.oldValue = original.oldValue;
return record;
}
var currentRecord, recordWithOldValue;
function getRecord(type, target) {
return currentRecord = new MutationRecord(type, target);
}
function getRecordWithOldValue(oldValue) {
if (recordWithOldValue)
return recordWithOldValue;
recordWithOldValue = copyMutationRecord(currentRecord);
recordWithOldValue.oldValue = oldValue;
return recordWithOldValue;
}
function clearRecords() {
currentRecord = recordWithOldValue = undefined;
}
function recordRepresentsCurrentMutation(record) {
return record === recordWithOldValue || record === currentRecord;
}
function selectRecord(lastRecord, newRecord) {
if (lastRecord === newRecord)
return lastRecord;
if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord))
return recordWithOldValue;
return null;
}
function Registration(observer, target, options) {
this.observer = observer;
this.target = target;
this.options = options;
this.transientObservedNodes = [];
}
Registration.prototype = {
enqueue: function (record) {
var records = this.observer.records_;
var length = records.length;
if (records.length > 0) {
var lastRecord = records[length - 1];
var recordToReplaceLast = selectRecord(lastRecord, record);
if (recordToReplaceLast) {
records[length - 1] = recordToReplaceLast;
return;
}
} else {
scheduleCallback(this.observer);
}
records[length] = record;
},
addListeners: function () {
this.addListeners_(this.target);
},
addListeners_: function (node) {
var options = this.options;
if (options.attributes)
node.addEventListener('DOMAttrModified', this, true);
if (options.characterData)
node.addEventListener('DOMCharacterDataModified', this, true);
if (options.childList)
node.addEventListener('DOMNodeInserted', this, true);
if (options.childList || options.subtree)
node.addEventListener('DOMNodeRemoved', this, true);
},
removeListeners: function () {
this.removeListeners_(this.target);
},
removeListeners_: function (node) {
var options = this.options;
if (options.attributes)
node.removeEventListener('DOMAttrModified', this, true);
if (options.characterData)
node.removeEventListener('DOMCharacterDataModified', this, true);
if (options.childList)
node.removeEventListener('DOMNodeInserted', this, true);
if (options.childList || options.subtree)
node.removeEventListener('DOMNodeRemoved', this, true);
},
addTransientObserver: function (node) {
if (node === this.target)
return;
this.addListeners_(node);
this.transientObservedNodes.push(node);
var registrations = registrationsTable.get(node);
if (!registrations)
registrationsTable.set(node, registrations = []);
registrations.push(this);
},
removeTransientObservers: function () {
var transientObservedNodes = this.transientObservedNodes;
this.transientObservedNodes = [];
transientObservedNodes.forEach(function (node) {
this.removeListeners_(node);
var registrations = registrationsTable.get(node);
for (var i = 0; i < registrations.length; i++) {
if (registrations[i] === this) {
registrations.splice(i, 1);
break;
}
}
}, this);
},
handleEvent: function (e) {
e.stopImmediatePropagation();
switch (e.type) {
case 'DOMAttrModified':
var name = e.attrName;
var namespace = e.relatedNode.namespaceURI;
var target = e.target;
var record = new getRecord('attributes', target);
record.attributeName = name;
record.attributeNamespace = namespace;
var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
forEachAncestorAndObserverEnqueueRecord(target, function (options) {
if (!options.attributes)
return;
if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
return;
}
if (options.attributeOldValue)
return getRecordWithOldValue(oldValue);
return record;
});
break;
case 'DOMCharacterDataModified':
var target = e.target;
var record = getRecord('characterData', target);
var oldValue = e.prevValue;
forEachAncestorAndObserverEnqueueRecord(target, function (options) {
if (!options.characterData)
return;
if (options.characterDataOldValue)
return getRecordWithOldValue(oldValue);
return record;
});
break;
case 'DOMNodeRemoved':
this.addTransientObserver(e.target);
case 'DOMNodeInserted':
var changedNode = e.target;
var addedNodes, removedNodes;
if (e.type === 'DOMNodeInserted') {
addedNodes = [changedNode];
removedNodes = [];
} else {
addedNodes = [];
removedNodes = [changedNode];
}
var previousSibling = changedNode.previousSibling;
var nextSibling = changedNode.nextSibling;
var record = getRecord('childList', e.target.parentNode);
record.addedNodes = addedNodes;
record.removedNodes = removedNodes;
record.previousSibling = previousSibling;
record.nextSibling = nextSibling;
forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function (options) {
if (!options.childList)
return;
return record;
});
}
clearRecords();
}
};
global.JsMutationObserver = JsMutationObserver;
if (!global.MutationObserver) {
global.MutationObserver = JsMutationObserver;
JsMutationObserver._isPolyfilled = true;
}
}(self));
if (typeof HTMLTemplateElement === 'undefined') {
(function () {
var TEMPLATE_TAG = 'template';
var contentDoc = document.implementation.createHTMLDocument('template');
var canDecorate = true;
HTMLTemplateElement = function () {
};
HTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);
HTMLTemplateElement.decorate = function (template) {
if (template.content) {
return;
}
template.content = contentDoc.createDocumentFragment();
var child;
while (child = template.firstChild) {
template.content.appendChild(child);
}
if (canDecorate) {
try {
Object.defineProperty(template, 'innerHTML', {
get: function () {
var o = '';
for (var e = this.content.firstChild; e; e = e.nextSibling) {
o += e.outerHTML || escapeData(e.data);
}
return o;
},
set: function (text) {
contentDoc.body.innerHTML = text;
HTMLTemplateElement.bootstrap(contentDoc);
while (this.content.firstChild) {
this.content.removeChild(this.content.firstChild);
}
while (contentDoc.body.firstChild) {
this.content.appendChild(contentDoc.body.firstChild);
}
},
configurable: true
});
} catch (err) {
canDecorate = false;
}
}
HTMLTemplateElement.bootstrap(template.content);
};
HTMLTemplateElement.bootstrap = function (doc) {
var templates = doc.querySelectorAll(TEMPLATE_TAG);
for (var i = 0, l = templates.length, t; i < l && (t = templates[i]); i++) {
HTMLTemplateElement.decorate(t);
}
};
document.addEventListener('DOMContentLoaded', function () {
HTMLTemplateElement.bootstrap(document);
});
var createElement = document.createElement;
document.createElement = function () {
'use strict';
var el = createElement.apply(document, arguments);
if (el.localName == 'template') {
HTMLTemplateElement.decorate(el);
}
return el;
};
var escapeDataRegExp = /[&\u00A0<>]/g;
function escapeReplace(c) {
switch (c) {
case '&':
return '&amp;';
case '<':
return '&lt;';
case '>':
return '&gt;';
case '\xA0':
return '&nbsp;';
}
}
function escapeData(s) {
return s.replace(escapeDataRegExp, escapeReplace);
}
}());
}
(function (scope) {
'use strict';
if (!window.performance) {
var start = Date.now();
window.performance = {
now: function () {
return Date.now() - start;
}
};
}
if (!window.requestAnimationFrame) {
window.requestAnimationFrame = function () {
var nativeRaf = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
return nativeRaf ? function (callback) {
return nativeRaf(function () {
callback(performance.now());
});
} : function (callback) {
return window.setTimeout(callback, 1000 / 60);
};
}();
}
if (!window.cancelAnimationFrame) {
window.cancelAnimationFrame = function () {
return window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function (id) {
clearTimeout(id);
};
}();
}
var workingDefaultPrevented = function () {
var e = document.createEvent('Event');
e.initEvent('foo', true, true);
e.preventDefault();
return e.defaultPrevented;
}();
if (!workingDefaultPrevented) {
var origPreventDefault = Event.prototype.preventDefault;
Event.prototype.preventDefault = function () {
if (!this.cancelable) {
return;
}
origPreventDefault.call(this);
Object.defineProperty(this, 'defaultPrevented', {
get: function () {
return true;
},
configurable: true
});
};
}
var isIE = /Trident/.test(navigator.userAgent);
if (!window.CustomEvent || isIE && typeof window.CustomEvent !== 'function') {
window.CustomEvent = function (inType, params) {
params = params || {};
var e = document.createEvent('CustomEvent');
e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
return e;
};
window.CustomEvent.prototype = window.Event.prototype;
}
if (!window.Event || isIE && typeof window.Event !== 'function') {
var origEvent = window.Event;
window.Event = function (inType, params) {
params = params || {};
var e = document.createEvent('Event');
e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
return e;
};
window.Event.prototype = origEvent.prototype;
}
}(window.WebComponents));
window.HTMLImports = window.HTMLImports || { flags: {} };
(function (scope) {
var IMPORT_LINK_TYPE = 'import';
var useNative = Boolean(IMPORT_LINK_TYPE in document.createElement('link'));
var hasShadowDOMPolyfill = Boolean(window.ShadowDOMPolyfill);
var wrap = function (node) {
return hasShadowDOMPolyfill ? window.ShadowDOMPolyfill.wrapIfNeeded(node) : node;
};
var rootDocument = wrap(document);
var currentScriptDescriptor = {
get: function () {
var script = window.HTMLImports.currentScript || document.currentScript || (document.readyState !== 'complete' ? document.scripts[document.scripts.length - 1] : null);
return wrap(script);
},
configurable: true
};
Object.defineProperty(document, '_currentScript', currentScriptDescriptor);
Object.defineProperty(rootDocument, '_currentScript', currentScriptDescriptor);
var isIE = /Trident/.test(navigator.userAgent);
function whenReady(callback, doc) {
doc = doc || rootDocument;
whenDocumentReady(function () {
watchImportsLoad(callback, doc);
}, doc);
}
var requiredReadyState = isIE ? 'complete' : 'interactive';
var READY_EVENT = 'readystatechange';
function isDocumentReady(doc) {
return doc.readyState === 'complete' || doc.readyState === requiredReadyState;
}
function whenDocumentReady(callback, doc) {
if (!isDocumentReady(doc)) {
var checkReady = function () {
if (doc.readyState === 'complete' || doc.readyState === requiredReadyState) {
doc.removeEventListener(READY_EVENT, checkReady);
whenDocumentReady(callback, doc);
}
};
doc.addEventListener(READY_EVENT, checkReady);
} else if (callback) {
callback();
}
}
function markTargetLoaded(event) {
event.target.__loaded = true;
}
function watchImportsLoad(callback, doc) {
var imports = doc.querySelectorAll('link[rel=import]');
var parsedCount = 0, importCount = imports.length, newImports = [], errorImports = [];
function checkDone() {
if (parsedCount == importCount && callback) {
callback({
allImports: imports,
loadedImports: newImports,
errorImports: errorImports
});
}
}
function loadedImport(e) {
markTargetLoaded(e);
newImports.push(this);
parsedCount++;
checkDone();
}
function errorLoadingImport(e) {
errorImports.push(this);
parsedCount++;
checkDone();
}
if (importCount) {
for (var i = 0, imp; i < importCount && (imp = imports[i]); i++) {
if (isImportLoaded(imp)) {
newImports.push(this);
parsedCount++;
checkDone();
} else {
imp.addEventListener('load', loadedImport);
imp.addEventListener('error', errorLoadingImport);
}
}
} else {
checkDone();
}
}
function isImportLoaded(link) {
return useNative ? link.__loaded || link.import && link.import.readyState !== 'loading' : link.__importParsed;
}
if (useNative) {
new MutationObserver(function (mxns) {
for (var i = 0, l = mxns.length, m; i < l && (m = mxns[i]); i++) {
if (m.addedNodes) {
handleImports(m.addedNodes);
}
}
}).observe(document.head, { childList: true });
function handleImports(nodes) {
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
if (isImport(n)) {
handleImport(n);
}
}
}
function isImport(element) {
return element.localName === 'link' && element.rel === 'import';
}
function handleImport(element) {
var loaded = element.import;
if (loaded) {
markTargetLoaded({ target: element });
} else {
element.addEventListener('load', markTargetLoaded);
element.addEventListener('error', markTargetLoaded);
}
}
(function () {
if (document.readyState === 'loading') {
var imports = document.querySelectorAll('link[rel=import]');
for (var i = 0, l = imports.length, imp; i < l && (imp = imports[i]); i++) {
handleImport(imp);
}
}
}());
}
whenReady(function (detail) {
window.HTMLImports.ready = true;
window.HTMLImports.readyTime = new Date().getTime();
var evt = rootDocument.createEvent('CustomEvent');
evt.initCustomEvent('HTMLImportsLoaded', true, true, detail);
rootDocument.dispatchEvent(evt);
});
scope.IMPORT_LINK_TYPE = IMPORT_LINK_TYPE;
scope.useNative = useNative;
scope.rootDocument = rootDocument;
scope.whenReady = whenReady;
scope.isIE = isIE;
}(window.HTMLImports));
(function (scope) {
var modules = [];
var addModule = function (module) {
modules.push(module);
};
var initializeModules = function () {
modules.forEach(function (module) {
module(scope);
});
};
scope.addModule = addModule;
scope.initializeModules = initializeModules;
}(window.HTMLImports));
window.HTMLImports.addModule(function (scope) {
var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;
var path = {
resolveUrlsInStyle: function (style, linkUrl) {
var doc = style.ownerDocument;
var resolver = doc.createElement('a');
style.textContent = this.resolveUrlsInCssText(style.textContent, linkUrl, resolver);
return style;
},
resolveUrlsInCssText: function (cssText, linkUrl, urlObj) {
var r = this.replaceUrls(cssText, urlObj, linkUrl, CSS_URL_REGEXP);
r = this.replaceUrls(r, urlObj, linkUrl, CSS_IMPORT_REGEXP);
return r;
},
replaceUrls: function (text, urlObj, linkUrl, regexp) {
return text.replace(regexp, function (m, pre, url, post) {
var urlPath = url.replace(/["']/g, '');
if (linkUrl) {
urlPath = new URL(urlPath, linkUrl).href;
}
urlObj.href = urlPath;
urlPath = urlObj.href;
return pre + '\'' + urlPath + '\'' + post;
});
}
};
scope.path = path;
});
window.HTMLImports.addModule(function (scope) {
var xhr = {
async: true,
ok: function (request) {
return request.status >= 200 && request.status < 300 || request.status === 304 || request.status === 0;
},
load: function (url, next, nextContext) {
var request = new XMLHttpRequest();
if (scope.flags.debug || scope.flags.bust) {
url += '?' + Math.random();
}
request.open('GET', url, xhr.async);
request.addEventListener('readystatechange', function (e) {
if (request.readyState === 4) {
var redirectedUrl = null;
try {
var locationHeader = request.getResponseHeader('Location');
if (locationHeader) {
redirectedUrl = locationHeader.substr(0, 1) === '/' ? location.origin + locationHeader : locationHeader;
}
} catch (e) {
console.error(e.message);
}
next.call(nextContext, !xhr.ok(request) && request, request.response || request.responseText, redirectedUrl);
}
});
request.send();
return request;
},
loadDocument: function (url, next, nextContext) {
this.load(url, next, nextContext).responseType = 'document';
}
};
scope.xhr = xhr;
});
window.HTMLImports.addModule(function (scope) {
var xhr = scope.xhr;
var flags = scope.flags;
var Loader = function (onLoad, onComplete) {
this.cache = {};
this.onload = onLoad;
this.oncomplete = onComplete;
this.inflight = 0;
this.pending = {};
};
Loader.prototype = {
addNodes: function (nodes) {
this.inflight += nodes.length;
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
this.require(n);
}
this.checkDone();
},
addNode: function (node) {
this.inflight++;
this.require(node);
this.checkDone();
},
require: function (elt) {
var url = elt.src || elt.href;
elt.__nodeUrl = url;
if (!this.dedupe(url, elt)) {
this.fetch(url, elt);
}
},
dedupe: function (url, elt) {
if (this.pending[url]) {
this.pending[url].push(elt);
return true;
}
var resource;
if (this.cache[url]) {
this.onload(url, elt, this.cache[url]);
this.tail();
return true;
}
this.pending[url] = [elt];
return false;
},
fetch: function (url, elt) {
flags.load && console.log('fetch', url, elt);
if (!url) {
setTimeout(function () {
this.receive(url, elt, { error: 'href must be specified' }, null);
}.bind(this), 0);
} else if (url.match(/^data:/)) {
var pieces = url.split(',');
var header = pieces[0];
var body = pieces[1];
if (header.indexOf(';base64') > -1) {
body = atob(body);
} else {
body = decodeURIComponent(body);
}
setTimeout(function () {
this.receive(url, elt, null, body);
}.bind(this), 0);
} else {
var receiveXhr = function (err, resource, redirectedUrl) {
this.receive(url, elt, err, resource, redirectedUrl);
}.bind(this);
xhr.load(url, receiveXhr);
}
},
receive: function (url, elt, err, resource, redirectedUrl) {
this.cache[url] = resource;
var $p = this.pending[url];
for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
this.onload(url, p, resource, err, redirectedUrl);
this.tail();
}
this.pending[url] = null;
},
tail: function () {
--this.inflight;
this.checkDone();
},
checkDone: function () {
if (!this.inflight) {
this.oncomplete();
}
}
};
scope.Loader = Loader;
});
window.HTMLImports.addModule(function (scope) {
var Observer = function (addCallback) {
this.addCallback = addCallback;
this.mo = new MutationObserver(this.handler.bind(this));
};
Observer.prototype = {
handler: function (mutations) {
for (var i = 0, l = mutations.length, m; i < l && (m = mutations[i]); i++) {
if (m.type === 'childList' && m.addedNodes.length) {
this.addedNodes(m.addedNodes);
}
}
},
addedNodes: function (nodes) {
if (this.addCallback) {
this.addCallback(nodes);
}
for (var i = 0, l = nodes.length, n, loading; i < l && (n = nodes[i]); i++) {
if (n.children && n.children.length) {
this.addedNodes(n.children);
}
}
},
observe: function (root) {
this.mo.observe(root, {
childList: true,
subtree: true
});
}
};
scope.Observer = Observer;
});
window.HTMLImports.addModule(function (scope) {
var path = scope.path;
var rootDocument = scope.rootDocument;
var flags = scope.flags;
var isIE = scope.isIE;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = 'link[rel=' + IMPORT_LINK_TYPE + ']';
var importParser = {
documentSelectors: IMPORT_SELECTOR,
importsSelectors: [
IMPORT_SELECTOR,
'link[rel=stylesheet]:not([type])',
'style:not([type])',
'script:not([type])',
'script[type="application/javascript"]',
'script[type="text/javascript"]'
].join(','),
map: {
link: 'parseLink',
script: 'parseScript',
style: 'parseStyle'
},
dynamicElements: [],
parseNext: function () {
var next = this.nextToParse();
if (next) {
this.parse(next);
}
},
parse: function (elt) {
if (this.isParsed(elt)) {
flags.parse && console.log('[%s] is already parsed', elt.localName);
return;
}
var fn = this[this.map[elt.localName]];
if (fn) {
this.markParsing(elt);
fn.call(this, elt);
}
},
parseDynamic: function (elt, quiet) {
this.dynamicElements.push(elt);
if (!quiet) {
this.parseNext();
}
},
markParsing: function (elt) {
flags.parse && console.log('parsing', elt);
this.parsingElement = elt;
},
markParsingComplete: function (elt) {
elt.__importParsed = true;
this.markDynamicParsingComplete(elt);
if (elt.__importElement) {
elt.__importElement.__importParsed = true;
this.markDynamicParsingComplete(elt.__importElement);
}
this.parsingElement = null;
flags.parse && console.log('completed', elt);
},
markDynamicParsingComplete: function (elt) {
var i = this.dynamicElements.indexOf(elt);
if (i >= 0) {
this.dynamicElements.splice(i, 1);
}
},
parseImport: function (elt) {
elt.import = elt.__doc;
if (window.HTMLImports.__importsParsingHook) {
window.HTMLImports.__importsParsingHook(elt);
}
if (elt.import) {
elt.import.__importParsed = true;
}
this.markParsingComplete(elt);
if (elt.__resource && !elt.__error) {
elt.dispatchEvent(new CustomEvent('load', { bubbles: false }));
} else {
elt.dispatchEvent(new CustomEvent('error', { bubbles: false }));
}
if (elt.__pending) {
var fn;
while (elt.__pending.length) {
fn = elt.__pending.shift();
if (fn) {
fn({ target: elt });
}
}
}
this.parseNext();
},
parseLink: function (linkElt) {
if (nodeIsImport(linkElt)) {
this.parseImport(linkElt);
} else {
linkElt.href = linkElt.href;
this.parseGeneric(linkElt);
}
},
parseStyle: function (elt) {
var src = elt;
elt = cloneStyle(elt);
src.__appliedElement = elt;
elt.__importElement = src;
this.parseGeneric(elt);
},
parseGeneric: function (elt) {
this.trackElement(elt);
this.addElementToDocument(elt);
},
rootImportForElement: function (elt) {
var n = elt;
while (n.ownerDocument.__importLink) {
n = n.ownerDocument.__importLink;
}
return n;
},
addElementToDocument: function (elt) {
var port = this.rootImportForElement(elt.__importElement || elt);
port.parentNode.insertBefore(elt, port);
},
trackElement: function (elt, callback) {
var self = this;
var done = function (e) {
elt.removeEventListener('load', done);
elt.removeEventListener('error', done);
if (callback) {
callback(e);
}
self.markParsingComplete(elt);
self.parseNext();
};
elt.addEventListener('load', done);
elt.addEventListener('error', done);
if (isIE && elt.localName === 'style') {
var fakeLoad = false;
if (elt.textContent.indexOf('@import') == -1) {
fakeLoad = true;
} else if (elt.sheet) {
fakeLoad = true;
var csr = elt.sheet.cssRules;
var len = csr ? csr.length : 0;
for (var i = 0, r; i < len && (r = csr[i]); i++) {
if (r.type === CSSRule.IMPORT_RULE) {
fakeLoad = fakeLoad && Boolean(r.styleSheet);
}
}
}
if (fakeLoad) {
setTimeout(function () {
elt.dispatchEvent(new CustomEvent('load', { bubbles: false }));
});
}
}
},
parseScript: function (scriptElt) {
var script = document.createElement('script');
script.__importElement = scriptElt;
script.src = scriptElt.src ? scriptElt.src : generateScriptDataUrl(scriptElt);
scope.currentScript = scriptElt;
this.trackElement(script, function (e) {
if (script.parentNode) {
script.parentNode.removeChild(script);
}
scope.currentScript = null;
});
this.addElementToDocument(script);
},
nextToParse: function () {
this._mayParse = [];
return !this.parsingElement && (this.nextToParseInDoc(rootDocument) || this.nextToParseDynamic());
},
nextToParseInDoc: function (doc, link) {
if (doc && this._mayParse.indexOf(doc) < 0) {
this._mayParse.push(doc);
var nodes = doc.querySelectorAll(this.parseSelectorsForNode(doc));
for (var i = 0, l = nodes.length, p = 0, n; i < l && (n = nodes[i]); i++) {
if (!this.isParsed(n)) {
if (this.hasResource(n)) {
return nodeIsImport(n) ? this.nextToParseInDoc(n.__doc, n) : n;
} else {
return;
}
}
}
}
return link;
},
nextToParseDynamic: function () {
return this.dynamicElements[0];
},
parseSelectorsForNode: function (node) {
var doc = node.ownerDocument || node;
return doc === rootDocument ? this.documentSelectors : this.importsSelectors;
},
isParsed: function (node) {
return node.__importParsed;
},
needsDynamicParsing: function (elt) {
return this.dynamicElements.indexOf(elt) >= 0;
},
hasResource: function (node) {
if (nodeIsImport(node) && node.__doc === undefined) {
return false;
}
return true;
}
};
function nodeIsImport(elt) {
return elt.localName === 'link' && elt.rel === IMPORT_LINK_TYPE;
}
function generateScriptDataUrl(script) {
var scriptContent = generateScriptContent(script);
return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(scriptContent);
}
function generateScriptContent(script) {
return script.textContent + generateSourceMapHint(script);
}
function generateSourceMapHint(script) {
var owner = script.ownerDocument;
owner.__importedScripts = owner.__importedScripts || 0;
var moniker = script.ownerDocument.baseURI;
var num = owner.__importedScripts ? '-' + owner.__importedScripts : '';
owner.__importedScripts++;
return '\n//# sourceURL=' + moniker + num + '.js\n';
}
function cloneStyle(style) {
var clone = style.ownerDocument.createElement('style');
clone.textContent = style.textContent;
path.resolveUrlsInStyle(clone);
return clone;
}
scope.parser = importParser;
scope.IMPORT_SELECTOR = IMPORT_SELECTOR;
});
window.HTMLImports.addModule(function (scope) {
var flags = scope.flags;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = scope.IMPORT_SELECTOR;
var rootDocument = scope.rootDocument;
var Loader = scope.Loader;
var Observer = scope.Observer;
var parser = scope.parser;
var importer = {
documents: {},
documentPreloadSelectors: IMPORT_SELECTOR,
importsPreloadSelectors: [IMPORT_SELECTOR].join(','),
loadNode: function (node) {
importLoader.addNode(node);
},
loadSubtree: function (parent) {
var nodes = this.marshalNodes(parent);
importLoader.addNodes(nodes);
},
marshalNodes: function (parent) {
return parent.querySelectorAll(this.loadSelectorsForNode(parent));
},
loadSelectorsForNode: function (node) {
var doc = node.ownerDocument || node;
return doc === rootDocument ? this.documentPreloadSelectors : this.importsPreloadSelectors;
},
loaded: function (url, elt, resource, err, redirectedUrl) {
flags.load && console.log('loaded', url, elt);
elt.__resource = resource;
elt.__error = err;
if (isImportLink(elt)) {
var doc = this.documents[url];
if (doc === undefined) {
doc = err ? null : makeDocument(resource, redirectedUrl || url);
if (doc) {
doc.__importLink = elt;
this.bootDocument(doc);
}
this.documents[url] = doc;
}
elt.__doc = doc;
}
parser.parseNext();
},
bootDocument: function (doc) {
this.loadSubtree(doc);
this.observer.observe(doc);
parser.parseNext();
},
loadedAll: function () {
parser.parseNext();
}
};
var importLoader = new Loader(importer.loaded.bind(importer), importer.loadedAll.bind(importer));
importer.observer = new Observer();
function isImportLink(elt) {
return isLinkRel(elt, IMPORT_LINK_TYPE);
}
function isLinkRel(elt, rel) {
return elt.localName === 'link' && elt.getAttribute('rel') === rel;
}
function hasBaseURIAccessor(doc) {
return !!Object.getOwnPropertyDescriptor(doc, 'baseURI');
}
function makeDocument(resource, url) {
var doc = document.implementation.createHTMLDocument(IMPORT_LINK_TYPE);
doc._URL = url;
var base = doc.createElement('base');
base.setAttribute('href', url);
if (!doc.baseURI && !hasBaseURIAccessor(doc)) {
Object.defineProperty(doc, 'baseURI', { value: url });
}
var meta = doc.createElement('meta');
meta.setAttribute('charset', 'utf-8');
doc.head.appendChild(meta);
doc.head.appendChild(base);
doc.body.innerHTML = resource;
if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
HTMLTemplateElement.bootstrap(doc);
}
return doc;
}
if (!document.baseURI) {
var baseURIDescriptor = {
get: function () {
var base = document.querySelector('base');
return base ? base.href : window.location.href;
},
configurable: true
};
Object.defineProperty(document, 'baseURI', baseURIDescriptor);
Object.defineProperty(rootDocument, 'baseURI', baseURIDescriptor);
}
scope.importer = importer;
scope.importLoader = importLoader;
});
window.HTMLImports.addModule(function (scope) {
var parser = scope.parser;
var importer = scope.importer;
var dynamic = {
added: function (nodes) {
var owner, parsed, loading;
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
if (!owner) {
owner = n.ownerDocument;
parsed = parser.isParsed(owner);
}
loading = this.shouldLoadNode(n);
if (loading) {
importer.loadNode(n);
}
if (this.shouldParseNode(n) && parsed) {
parser.parseDynamic(n, loading);
}
}
},
shouldLoadNode: function (node) {
return node.nodeType === 1 && matches.call(node, importer.loadSelectorsForNode(node));
},
shouldParseNode: function (node) {
return node.nodeType === 1 && matches.call(node, parser.parseSelectorsForNode(node));
}
};
importer.observer.addCallback = dynamic.added.bind(dynamic);
var matches = HTMLElement.prototype.matches || HTMLElement.prototype.matchesSelector || HTMLElement.prototype.webkitMatchesSelector || HTMLElement.prototype.mozMatchesSelector || HTMLElement.prototype.msMatchesSelector;
});
(function (scope) {
var initializeModules = scope.initializeModules;
var isIE = scope.isIE;
if (scope.useNative) {
return;
}
initializeModules();
var rootDocument = scope.rootDocument;
function bootstrap() {
window.HTMLImports.importer.bootDocument(rootDocument);
}
if (document.readyState === 'complete' || document.readyState === 'interactive' && !window.attachEvent) {
bootstrap();
} else {
document.addEventListener('DOMContentLoaded', bootstrap);
}
}(window.HTMLImports));
window.CustomElements = window.CustomElements || { flags: {} };
(function (scope) {
var flags = scope.flags;
var modules = [];
var addModule = function (module) {
modules.push(module);
};
var initializeModules = function () {
modules.forEach(function (module) {
module(scope);
});
};
scope.addModule = addModule;
scope.initializeModules = initializeModules;
scope.hasNative = Boolean(document.registerElement);
scope.isIE = /Trident/.test(navigator.userAgent);
scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || window.HTMLImports.useNative);
}(window.CustomElements));
window.CustomElements.addModule(function (scope) {
var IMPORT_LINK_TYPE = window.HTMLImports ? window.HTMLImports.IMPORT_LINK_TYPE : 'none';
function forSubtree(node, cb) {
findAllElements(node, function (e) {
if (cb(e)) {
return true;
}
forRoots(e, cb);
});
forRoots(node, cb);
}
function findAllElements(node, find, data) {
var e = node.firstElementChild;
if (!e) {
e = node.firstChild;
while (e && e.nodeType !== Node.ELEMENT_NODE) {
e = e.nextSibling;
}
}
while (e) {
if (find(e, data) !== true) {
findAllElements(e, find, data);
}
e = e.nextElementSibling;
}
return null;
}
function forRoots(node, cb) {
var root = node.shadowRoot;
while (root) {
forSubtree(root, cb);
root = root.olderShadowRoot;
}
}
function forDocumentTree(doc, cb) {
_forDocumentTree(doc, cb, []);
}
function _forDocumentTree(doc, cb, processingDocuments) {
doc = window.wrap(doc);
if (processingDocuments.indexOf(doc) >= 0) {
return;
}
processingDocuments.push(doc);
var imports = doc.querySelectorAll('link[rel=' + IMPORT_LINK_TYPE + ']');
for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
if (n.import) {
_forDocumentTree(n.import, cb, processingDocuments);
}
}
cb(doc);
}
scope.forDocumentTree = forDocumentTree;
scope.forSubtree = forSubtree;
});
window.CustomElements.addModule(function (scope) {
var flags = scope.flags;
var forSubtree = scope.forSubtree;
var forDocumentTree = scope.forDocumentTree;
function addedNode(node, isAttached) {
return added(node, isAttached) || addedSubtree(node, isAttached);
}
function added(node, isAttached) {
if (scope.upgrade(node, isAttached)) {
return true;
}
if (isAttached) {
attached(node);
}
}
function addedSubtree(node, isAttached) {
forSubtree(node, function (e) {
if (added(e, isAttached)) {
return true;
}
});
}
var hasThrottledAttached = window.MutationObserver._isPolyfilled && flags['throttle-attached'];
scope.hasPolyfillMutations = hasThrottledAttached;
scope.hasThrottledAttached = hasThrottledAttached;
var isPendingMutations = false;
var pendingMutations = [];
function deferMutation(fn) {
pendingMutations.push(fn);
if (!isPendingMutations) {
isPendingMutations = true;
setTimeout(takeMutations);
}
}
function takeMutations() {
isPendingMutations = false;
var $p = pendingMutations;
for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
p();
}
pendingMutations = [];
}
function attached(element) {
if (hasThrottledAttached) {
deferMutation(function () {
_attached(element);
});
} else {
_attached(element);
}
}
function _attached(element) {
if (element.__upgraded__ && !element.__attached) {
element.__attached = true;
if (element.attachedCallback) {
element.attachedCallback();
}
}
}
function detachedNode(node) {
detached(node);
forSubtree(node, function (e) {
detached(e);
});
}
function detached(element) {
if (hasThrottledAttached) {
deferMutation(function () {
_detached(element);
});
} else {
_detached(element);
}
}
function _detached(element) {
if (element.__upgraded__ && element.__attached) {
element.__attached = false;
if (element.detachedCallback) {
element.detachedCallback();
}
}
}
function inDocument(element) {
var p = element;
var doc = window.wrap(document);
while (p) {
if (p == doc) {
return true;
}
p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
}
}
function watchShadow(node) {
if (node.shadowRoot && !node.shadowRoot.__watched) {
flags.dom && console.log('watching shadow-root for: ', node.localName);
var root = node.shadowRoot;
while (root) {
observe(root);
root = root.olderShadowRoot;
}
}
}
function handler(root, mutations) {
if (flags.dom) {
var mx = mutations[0];
if (mx && mx.type === 'childList' && mx.addedNodes) {
if (mx.addedNodes) {
var d = mx.addedNodes[0];
while (d && d !== document && !d.host) {
d = d.parentNode;
}
var u = d && (d.URL || d._URL || d.host && d.host.localName) || '';
u = u.split('/?').shift().split('/').pop();
}
}
console.group('mutations (%d) [%s]', mutations.length, u || '');
}
var isAttached = inDocument(root);
mutations.forEach(function (mx) {
if (mx.type === 'childList') {
forEach(mx.addedNodes, function (n) {
if (!n.localName) {
return;
}
addedNode(n, isAttached);
});
forEach(mx.removedNodes, function (n) {
if (!n.localName) {
return;
}
detachedNode(n);
});
}
});
flags.dom && console.groupEnd();
}
function takeRecords(node) {
node = window.wrap(node);
if (!node) {
node = window.wrap(document);
}
while (node.parentNode) {
node = node.parentNode;
}
var observer = node.__observer;
if (observer) {
handler(node, observer.takeRecords());
takeMutations();
}
}
var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
function observe(inRoot) {
if (inRoot.__observer) {
return;
}
var observer = new MutationObserver(handler.bind(this, inRoot));
observer.observe(inRoot, {
childList: true,
subtree: true
});
inRoot.__observer = observer;
}
function upgradeDocument(doc) {
doc = window.wrap(doc);
flags.dom && console.group('upgradeDocument: ', doc.baseURI.split('/').pop());
var isMainDocument = doc === window.wrap(document);
addedNode(doc, isMainDocument);
observe(doc);
flags.dom && console.groupEnd();
}
function upgradeDocumentTree(doc) {
forDocumentTree(doc, upgradeDocument);
}
var originalCreateShadowRoot = Element.prototype.createShadowRoot;
if (originalCreateShadowRoot) {
Element.prototype.createShadowRoot = function () {
var root = originalCreateShadowRoot.call(this);
window.CustomElements.watchShadow(this);
return root;
};
}
scope.watchShadow = watchShadow;
scope.upgradeDocumentTree = upgradeDocumentTree;
scope.upgradeDocument = upgradeDocument;
scope.upgradeSubtree = addedSubtree;
scope.upgradeAll = addedNode;
scope.attached = attached;
scope.takeRecords = takeRecords;
});
window.CustomElements.addModule(function (scope) {
var flags = scope.flags;
function upgrade(node, isAttached) {
if (node.localName === 'template') {
if (window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
HTMLTemplateElement.decorate(node);
}
}
if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
var is = node.getAttribute('is');
var definition = scope.getRegisteredDefinition(node.localName) || scope.getRegisteredDefinition(is);
if (definition) {
if (is && definition.tag == node.localName || !is && !definition.extends) {
return upgradeWithDefinition(node, definition, isAttached);
}
}
}
}
function upgradeWithDefinition(element, definition, isAttached) {
flags.upgrade && console.group('upgrade:', element.localName);
if (definition.is) {
element.setAttribute('is', definition.is);
}
implementPrototype(element, definition);
element.__upgraded__ = true;
created(element);
if (isAttached) {
scope.attached(element);
}
scope.upgradeSubtree(element, isAttached);
flags.upgrade && console.groupEnd();
return element;
}
function implementPrototype(element, definition) {
if (Object.__proto__) {
element.__proto__ = definition.prototype;
} else {
customMixin(element, definition.prototype, definition.native);
element.__proto__ = definition.prototype;
}
}
function customMixin(inTarget, inSrc, inNative) {
var used = {};
var p = inSrc;
while (p !== inNative && p !== HTMLElement.prototype) {
var keys = Object.getOwnPropertyNames(p);
for (var i = 0, k; k = keys[i]; i++) {
if (!used[k]) {
Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
used[k] = 1;
}
}
p = Object.getPrototypeOf(p);
}
}
function created(element) {
if (element.createdCallback) {
element.createdCallback();
}
}
scope.upgrade = upgrade;
scope.upgradeWithDefinition = upgradeWithDefinition;
scope.implementPrototype = implementPrototype;
});
window.CustomElements.addModule(function (scope) {
var isIE = scope.isIE;
var upgradeDocumentTree = scope.upgradeDocumentTree;
var upgradeAll = scope.upgradeAll;
var upgradeWithDefinition = scope.upgradeWithDefinition;
var implementPrototype = scope.implementPrototype;
var useNative = scope.useNative;
function register(name, options) {
var definition = options || {};
if (!name) {
throw new Error('document.registerElement: first argument `name` must not be empty');
}
if (name.indexOf('-') < 0) {
throw new Error('document.registerElement: first argument (\'name\') must contain a dash (\'-\'). Argument provided was \'' + String(name) + '\'.');
}
if (isReservedTag(name)) {
throw new Error('Failed to execute \'registerElement\' on \'Document\': Registration failed for type \'' + String(name) + '\'. The type name is invalid.');
}
if (getRegisteredDefinition(name)) {
throw new Error('DuplicateDefinitionError: a type with name \'' + String(name) + '\' is already registered');
}
if (!definition.prototype) {
definition.prototype = Object.create(HTMLElement.prototype);
}
definition.__name = name.toLowerCase();
definition.lifecycle = definition.lifecycle || {};
definition.ancestry = ancestry(definition.extends);
resolveTagName(definition);
resolvePrototypeChain(definition);
overrideAttributeApi(definition.prototype);
registerDefinition(definition.__name, definition);
definition.ctor = generateConstructor(definition);
definition.ctor.prototype = definition.prototype;
definition.prototype.constructor = definition.ctor;
if (scope.ready) {
upgradeDocumentTree(document);
}
return definition.ctor;
}
function overrideAttributeApi(prototype) {
if (prototype.setAttribute._polyfilled) {
return;
}
var setAttribute = prototype.setAttribute;
prototype.setAttribute = function (name, value) {
changeAttribute.call(this, name, value, setAttribute);
};
var removeAttribute = prototype.removeAttribute;
prototype.removeAttribute = function (name) {
changeAttribute.call(this, name, null, removeAttribute);
};
prototype.setAttribute._polyfilled = true;
}
function changeAttribute(name, value, operation) {
name = name.toLowerCase();
var oldValue = this.getAttribute(name);
operation.apply(this, arguments);
var newValue = this.getAttribute(name);
if (this.attributeChangedCallback && newValue !== oldValue) {
this.attributeChangedCallback(name, oldValue, newValue);
}
}
function isReservedTag(name) {
for (var i = 0; i < reservedTagList.length; i++) {
if (name === reservedTagList[i]) {
return true;
}
}
}
var reservedTagList = [
'annotation-xml',
'color-profile',
'font-face',
'font-face-src',
'font-face-uri',
'font-face-format',
'font-face-name',
'missing-glyph'
];
function ancestry(extnds) {
var extendee = getRegisteredDefinition(extnds);
if (extendee) {
return ancestry(extendee.extends).concat([extendee]);
}
return [];
}
function resolveTagName(definition) {
var baseTag = definition.extends;
for (var i = 0, a; a = definition.ancestry[i]; i++) {
baseTag = a.is && a.tag;
}
definition.tag = baseTag || definition.__name;
if (baseTag) {
definition.is = definition.__name;
}
}
function resolvePrototypeChain(definition) {
if (!Object.__proto__) {
var nativePrototype = HTMLElement.prototype;
if (definition.is) {
var inst = document.createElement(definition.tag);
nativePrototype = Object.getPrototypeOf(inst);
}
var proto = definition.prototype, ancestor;
var foundPrototype = false;
while (proto) {
if (proto == nativePrototype) {
foundPrototype = true;
}
ancestor = Object.getPrototypeOf(proto);
if (ancestor) {
proto.__proto__ = ancestor;
}
proto = ancestor;
}
if (!foundPrototype) {
console.warn(definition.tag + ' prototype not found in prototype chain for ' + definition.is);
}
definition.native = nativePrototype;
}
}
function instantiate(definition) {
return upgradeWithDefinition(domCreateElement(definition.tag), definition);
}
var registry = {};
function getRegisteredDefinition(name) {
if (name) {
return registry[name.toLowerCase()];
}
}
function registerDefinition(name, definition) {
registry[name] = definition;
}
function generateConstructor(definition) {
return function () {
return instantiate(definition);
};
}
var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
function createElementNS(namespace, tag, typeExtension) {
if (namespace === HTML_NAMESPACE) {
return createElement(tag, typeExtension);
} else {
return domCreateElementNS(namespace, tag);
}
}
function createElement(tag, typeExtension) {
if (tag) {
tag = tag.toLowerCase();
}
if (typeExtension) {
typeExtension = typeExtension.toLowerCase();
}
var definition = getRegisteredDefinition(typeExtension || tag);
if (definition) {
if (tag == definition.tag && typeExtension == definition.is) {
return new definition.ctor();
}
if (!typeExtension && !definition.is) {
return new definition.ctor();
}
}
var element;
if (typeExtension) {
element = createElement(tag);
element.setAttribute('is', typeExtension);
return element;
}
element = domCreateElement(tag);
if (tag.indexOf('-') >= 0) {
implementPrototype(element, HTMLElement);
}
return element;
}
var domCreateElement = document.createElement.bind(document);
var domCreateElementNS = document.createElementNS.bind(document);
var isInstance;
if (!Object.__proto__ && !useNative) {
isInstance = function (obj, ctor) {
if (obj instanceof ctor) {
return true;
}
var p = obj;
while (p) {
if (p === ctor.prototype) {
return true;
}
p = p.__proto__;
}
return false;
};
} else {
isInstance = function (obj, base) {
return obj instanceof base;
};
}
function wrapDomMethodToForceUpgrade(obj, methodName) {
var orig = obj[methodName];
obj[methodName] = function () {
var n = orig.apply(this, arguments);
upgradeAll(n);
return n;
};
}
wrapDomMethodToForceUpgrade(Node.prototype, 'cloneNode');
wrapDomMethodToForceUpgrade(document, 'importNode');
if (isIE) {
(function () {
var importNode = document.importNode;
document.importNode = function () {
var n = importNode.apply(document, arguments);
if (n.nodeType == n.DOCUMENT_FRAGMENT_NODE) {
var f = document.createDocumentFragment();
f.appendChild(n);
return f;
} else {
return n;
}
};
}());
}
document.registerElement = register;
document.createElement = createElement;
document.createElementNS = createElementNS;
scope.registry = registry;
scope.instanceof = isInstance;
scope.reservedTagList = reservedTagList;
scope.getRegisteredDefinition = getRegisteredDefinition;
document.register = document.registerElement;
});
(function (scope) {
var useNative = scope.useNative;
var initializeModules = scope.initializeModules;
var isIE = scope.isIE;
if (useNative) {
var nop = function () {
};
scope.watchShadow = nop;
scope.upgrade = nop;
scope.upgradeAll = nop;
scope.upgradeDocumentTree = nop;
scope.upgradeSubtree = nop;
scope.takeRecords = nop;
scope.instanceof = function (obj, base) {
return obj instanceof base;
};
} else {
initializeModules();
}
var upgradeDocumentTree = scope.upgradeDocumentTree;
var upgradeDocument = scope.upgradeDocument;
if (!window.wrap) {
if (window.ShadowDOMPolyfill) {
window.wrap = window.ShadowDOMPolyfill.wrapIfNeeded;
window.unwrap = window.ShadowDOMPolyfill.unwrapIfNeeded;
} else {
window.wrap = window.unwrap = function (node) {
return node;
};
}
}
if (window.HTMLImports) {
window.HTMLImports.__importsParsingHook = function (elt) {
if (elt.import) {
upgradeDocument(wrap(elt.import));
}
};
}
function bootstrap() {
upgradeDocumentTree(window.wrap(document));
window.CustomElements.ready = true;
var requestAnimationFrame = window.requestAnimationFrame || function (f) {
setTimeout(f, 16);
};
requestAnimationFrame(function () {
setTimeout(function () {
window.CustomElements.readyTime = Date.now();
if (window.HTMLImports) {
window.CustomElements.elapsed = window.CustomElements.readyTime - window.HTMLImports.readyTime;
}
document.dispatchEvent(new CustomEvent('WebComponentsReady', { bubbles: true }));
});
});
}
if (document.readyState === 'complete' || scope.flags.eager) {
bootstrap();
} else if (document.readyState === 'interactive' && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
bootstrap();
} else {
var loadEvent = window.HTMLImports && !window.HTMLImports.ready ? 'HTMLImportsLoaded' : 'DOMContentLoaded';
window.addEventListener(loadEvent, bootstrap);
}
}(window.CustomElements));
(function (scope) {
var style = document.createElement('style');
style.textContent = '' + 'body {' + 'transition: opacity ease-in 0.2s;' + ' } \n' + 'body[unresolved] {' + 'opacity: 0; display: block; overflow: hidden; position: relative;' + ' } \n';
var head = document.querySelector('head');
head.insertBefore(style, head.firstChild);
}(window.WebComponents));
(function () {
function resolve() {
document.body.removeAttribute('unresolved');
}
if (window.WebComponents) {
addEventListener('WebComponentsReady', resolve);
} else {
if (document.readyState === 'interactive' || document.readyState === 'complete') {
resolve();
} else {
addEventListener('DOMContentLoaded', resolve);
}
}
}());
window.Polymer = {
Settings: function () {
var user = window.Polymer || {};
var parts = location.search.slice(1).split('&');
for (var i = 0, o; i < parts.length && (o = parts[i]); i++) {
o = o.split('=');
o[0] && (user[o[0]] = o[1] || true);
}
var wantShadow = user.dom === 'shadow';
var hasShadow = Boolean(Element.prototype.createShadowRoot);
var nativeShadow = hasShadow && !window.ShadowDOMPolyfill;
var useShadow = wantShadow && hasShadow;
var hasNativeImports = Boolean('import' in document.createElement('link'));
var useNativeImports = hasNativeImports;
var useNativeCustomElements = !window.CustomElements || window.CustomElements.useNative;
return {
wantShadow: wantShadow,
hasShadow: hasShadow,
nativeShadow: nativeShadow,
useShadow: useShadow,
useNativeShadow: useShadow && nativeShadow,
useNativeImports: useNativeImports,
useNativeCustomElements: useNativeCustomElements
};
}()
};
(function () {
var userPolymer = window.Polymer;
window.Polymer = function (prototype) {
if (typeof prototype === 'function') {
prototype = prototype.prototype;
}
if (!prototype) {
prototype = {};
}
var factory = desugar(prototype);
prototype = factory.prototype;
var options = { prototype: prototype };
if (prototype.extends) {
options.extends = prototype.extends;
}
Polymer.telemetry._registrate(prototype);
document.registerElement(prototype.is, options);
return factory;
};
var desugar = function (prototype) {
var base = Polymer.Base;
if (prototype.extends) {
base = Polymer.Base._getExtendedPrototype(prototype.extends);
}
prototype = Polymer.Base.chainObject(prototype, base);
prototype.registerCallback();
return prototype.constructor;
};
window.Polymer = Polymer;
if (userPolymer) {
for (var i in userPolymer) {
Polymer[i] = userPolymer[i];
}
}
Polymer.Class = desugar;
}());
Polymer.telemetry = {
registrations: [],
_regLog: function (prototype) {
console.log('[' + prototype.is + ']: registered');
},
_registrate: function (prototype) {
this.registrations.push(prototype);
Polymer.log && this._regLog(prototype);
},
dumpRegistrations: function () {
this.registrations.forEach(this._regLog);
}
};
Object.defineProperty(window, 'currentImport', {
enumerable: true,
configurable: true,
get: function () {
return (document._currentScript || document.currentScript).ownerDocument;
}
});
Polymer.RenderStatus = {
_ready: false,
_callbacks: [],
whenReady: function (cb) {
if (this._ready) {
cb();
} else {
this._callbacks.push(cb);
}
},
_makeReady: function () {
this._ready = true;
for (var i = 0; i < this._callbacks.length; i++) {
this._callbacks[i]();
}
this._callbacks = [];
},
_catchFirstRender: function () {
requestAnimationFrame(function () {
Polymer.RenderStatus._makeReady();
});
},
_afterNextRenderQueue: [],
_waitingNextRender: false,
afterNextRender: function (element, fn, args) {
this._watchNextRender();
this._afterNextRenderQueue.push([
element,
fn,
args
]);
},
_watchNextRender: function () {
if (!this._waitingNextRender) {
this._waitingNextRender = true;
var fn = function () {
Polymer.RenderStatus._flushNextRender();
};
if (!this._ready) {
this.whenReady(fn);
} else {
requestAnimationFrame(fn);
}
}
},
_flushNextRender: function () {
var self = this;
setTimeout(function () {
self._flushRenderCallbacks(self._afterNextRenderQueue);
self._afterNextRenderQueue = [];
self._waitingNextRender = false;
});
},
_flushRenderCallbacks: function (callbacks) {
for (var i = 0, h; i < callbacks.length; i++) {
h = callbacks[i];
h[1].apply(h[0], h[2] || Polymer.nar);
}
;
}
};
if (window.HTMLImports) {
HTMLImports.whenReady(function () {
Polymer.RenderStatus._catchFirstRender();
});
} else {
Polymer.RenderStatus._catchFirstRender();
}
Polymer.ImportStatus = Polymer.RenderStatus;
Polymer.ImportStatus.whenLoaded = Polymer.ImportStatus.whenReady;
Polymer.Base = {
__isPolymerInstance__: true,
_addFeature: function (feature) {
this.extend(this, feature);
},
registerCallback: function () {
this._desugarBehaviors();
this._doBehavior('beforeRegister');
this._registerFeatures();
this._doBehavior('registered');
},
createdCallback: function () {
Polymer.telemetry.instanceCount++;
this.root = this;
this._doBehavior('created');
this._initFeatures();
},
attachedCallback: function () {
var self = this;
Polymer.RenderStatus.whenReady(function () {
self.isAttached = true;
self._doBehavior('attached');
});
},
detachedCallback: function () {
this.isAttached = false;
this._doBehavior('detached');
},
attributeChangedCallback: function (name, oldValue, newValue) {
this._attributeChangedImpl(name);
this._doBehavior('attributeChanged', [
name,
oldValue,
newValue
]);
},
_attributeChangedImpl: function (name) {
this._setAttributeToProperty(this, name);
},
extend: function (prototype, api) {
if (prototype && api) {
var n$ = Object.getOwnPropertyNames(api);
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
this.copyOwnProperty(n, api, prototype);
}
}
return prototype || api;
},
mixin: function (target, source) {
for (var i in source) {
target[i] = source[i];
}
return target;
},
copyOwnProperty: function (name, source, target) {
var pd = Object.getOwnPropertyDescriptor(source, name);
if (pd) {
Object.defineProperty(target, name, pd);
}
},
_log: console.log.apply.bind(console.log, console),
_warn: console.warn.apply.bind(console.warn, console),
_error: console.error.apply.bind(console.error, console),
_logf: function () {
return this._logPrefix.concat([this.is]).concat(Array.prototype.slice.call(arguments, 0));
}
};
Polymer.Base._logPrefix = function () {
var color = window.chrome || /firefox/i.test(navigator.userAgent);
return color ? [
'%c[%s::%s]:',
'font-weight: bold; background-color:#EEEE00;'
] : ['[%s::%s]:'];
}();
Polymer.Base.chainObject = function (object, inherited) {
if (object && inherited && object !== inherited) {
if (!Object.__proto__) {
object = Polymer.Base.extend(Object.create(inherited), object);
}
object.__proto__ = inherited;
}
return object;
};
Polymer.Base = Polymer.Base.chainObject(Polymer.Base, HTMLElement.prototype);
if (window.CustomElements) {
Polymer.instanceof = CustomElements.instanceof;
} else {
Polymer.instanceof = function (obj, ctor) {
return obj instanceof ctor;
};
}
Polymer.isInstance = function (obj) {
return Boolean(obj && obj.__isPolymerInstance__);
};
Polymer.telemetry.instanceCount = 0;
(function () {
var modules = {};
var lcModules = {};
var findModule = function (id) {
return modules[id] || lcModules[id.toLowerCase()];
};
var DomModule = function () {
return document.createElement('dom-module');
};
DomModule.prototype = Object.create(HTMLElement.prototype);
Polymer.Base.extend(DomModule.prototype, {
constructor: DomModule,
createdCallback: function () {
this.register();
},
register: function (id) {
var id = id || this.id || this.getAttribute('name') || this.getAttribute('is');
if (id) {
this.id = id;
modules[id] = this;
lcModules[id.toLowerCase()] = this;
}
},
import: function (id, selector) {
if (id) {
var m = findModule(id);
if (!m) {
forceDomModulesUpgrade();
m = findModule(id);
}
if (m && selector) {
m = m.querySelector(selector);
}
return m;
}
}
});
var cePolyfill = window.CustomElements && !CustomElements.useNative;
document.registerElement('dom-module', DomModule);
function forceDomModulesUpgrade() {
if (cePolyfill) {
var script = document._currentScript || document.currentScript;
var doc = script && script.ownerDocument || document;
var modules = doc.querySelectorAll('dom-module');
for (var i = modules.length - 1, m; i >= 0 && (m = modules[i]); i--) {
if (m.__upgraded__) {
return;
} else {
CustomElements.upgrade(m);
}
}
}
}
}());
Polymer.Base._addFeature({
_prepIs: function () {
if (!this.is) {
var module = (document._currentScript || document.currentScript).parentNode;
if (module.localName === 'dom-module') {
var id = module.id || module.getAttribute('name') || module.getAttribute('is');
this.is = id;
}
}
if (this.is) {
this.is = this.is.toLowerCase();
}
}
});
Polymer.Base._addFeature({
behaviors: [],
_desugarBehaviors: function () {
if (this.behaviors.length) {
this.behaviors = this._desugarSomeBehaviors(this.behaviors);
}
},
_desugarSomeBehaviors: function (behaviors) {
behaviors = this._flattenBehaviorsList(behaviors);
for (var i = behaviors.length - 1; i >= 0; i--) {
this._mixinBehavior(behaviors[i]);
}
return behaviors;
},
_flattenBehaviorsList: function (behaviors) {
var flat = [];
for (var i = 0; i < behaviors.length; i++) {
var b = behaviors[i];
if (b instanceof Array) {
flat = flat.concat(this._flattenBehaviorsList(b));
} else if (b) {
flat.push(b);
} else {
this._warn(this._logf('_flattenBehaviorsList', 'behavior is null, check for missing or 404 import'));
}
}
return flat;
},
_mixinBehavior: function (b) {
var n$ = Object.getOwnPropertyNames(b);
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
if (!Polymer.Base._behaviorProperties[n] && !this.hasOwnProperty(n)) {
this.copyOwnProperty(n, b, this);
}
}
},
_prepBehaviors: function () {
this._prepFlattenedBehaviors(this.behaviors);
},
_prepFlattenedBehaviors: function (behaviors) {
for (var i = 0, l = behaviors.length; i < l; i++) {
this._prepBehavior(behaviors[i]);
}
this._prepBehavior(this);
},
_doBehavior: function (name, args) {
for (var i = 0; i < this.behaviors.length; i++) {
this._invokeBehavior(this.behaviors[i], name, args);
}
this._invokeBehavior(this, name, args);
},
_invokeBehavior: function (b, name, args) {
var fn = b[name];
if (fn) {
fn.apply(this, args || Polymer.nar);
}
},
_marshalBehaviors: function () {
for (var i = 0; i < this.behaviors.length; i++) {
this._marshalBehavior(this.behaviors[i]);
}
this._marshalBehavior(this);
}
});
Polymer.Base._behaviorProperties = {
hostAttributes: true,
beforeRegister: true,
registered: true,
properties: true,
observers: true,
listeners: true,
created: true,
attached: true,
detached: true,
attributeChanged: true,
ready: true
};
Polymer.Base._addFeature({
_getExtendedPrototype: function (tag) {
return this._getExtendedNativePrototype(tag);
},
_nativePrototypes: {},
_getExtendedNativePrototype: function (tag) {
var p = this._nativePrototypes[tag];
if (!p) {
var np = this.getNativePrototype(tag);
p = this.extend(Object.create(np), Polymer.Base);
this._nativePrototypes[tag] = p;
}
return p;
},
getNativePrototype: function (tag) {
return Object.getPrototypeOf(document.createElement(tag));
}
});
Polymer.Base._addFeature({
_prepConstructor: function () {
this._factoryArgs = this.extends ? [
this.extends,
this.is
] : [this.is];
var ctor = function () {
return this._factory(arguments);
};
if (this.hasOwnProperty('extends')) {
ctor.extends = this.extends;
}
Object.defineProperty(this, 'constructor', {
value: ctor,
writable: true,
configurable: true
});
ctor.prototype = this;
},
_factory: function (args) {
var elt = document.createElement.apply(document, this._factoryArgs);
if (this.factoryImpl) {
this.factoryImpl.apply(elt, args);
}
return elt;
}
});
Polymer.nob = Object.create(null);
Polymer.Base._addFeature({
properties: {},
getPropertyInfo: function (property) {
var info = this._getPropertyInfo(property, this.properties);
if (!info) {
for (var i = 0; i < this.behaviors.length; i++) {
info = this._getPropertyInfo(property, this.behaviors[i].properties);
if (info) {
return info;
}
}
;
}
return info || Polymer.nob;
},
_getPropertyInfo: function (property, properties) {
var p = properties && properties[property];
if (typeof p === 'function') {
p = properties[property] = { type: p };
}
if (p) {
p.defined = true;
}
return p;
},
_prepPropertyInfo: function () {
this._propertyInfo = {};
for (var i = 0, p; i < this.behaviors.length; i++) {
this._addPropertyInfo(this._propertyInfo, this.behaviors[i].properties);
}
this._addPropertyInfo(this._propertyInfo, this.properties);
this._addPropertyInfo(this._propertyInfo, this._propertyEffects);
},
_addPropertyInfo: function (target, source) {
if (source) {
var t, s;
for (var i in source) {
t = target[i];
s = source[i];
if (i[0] === '_' && !s.readOnly) {
continue;
}
if (!target[i]) {
target[i] = {
type: typeof s === 'function' ? s : s.type,
readOnly: s.readOnly,
attribute: Polymer.CaseMap.camelToDashCase(i)
};
} else {
if (!t.type) {
t.type = s.type;
}
if (!t.readOnly) {
t.readOnly = s.readOnly;
}
}
}
}
}
});
Polymer.CaseMap = {
_caseMap: {},
dashToCamelCase: function (dash) {
var mapped = Polymer.CaseMap._caseMap[dash];
if (mapped) {
return mapped;
}
if (dash.indexOf('-') < 0) {
return Polymer.CaseMap._caseMap[dash] = dash;
}
return Polymer.CaseMap._caseMap[dash] = dash.replace(/-([a-z])/g, function (m) {
return m[1].toUpperCase();
});
},
camelToDashCase: function (camel) {
var mapped = Polymer.CaseMap._caseMap[camel];
if (mapped) {
return mapped;
}
return Polymer.CaseMap._caseMap[camel] = camel.replace(/([a-z][A-Z])/g, function (g) {
return g[0] + '-' + g[1].toLowerCase();
});
}
};
Polymer.Base._addFeature({
_addHostAttributes: function (attributes) {
if (!this._aggregatedAttributes) {
this._aggregatedAttributes = {};
}
if (attributes) {
this.mixin(this._aggregatedAttributes, attributes);
}
},
_marshalHostAttributes: function () {
if (this._aggregatedAttributes) {
this._applyAttributes(this, this._aggregatedAttributes);
}
},
_applyAttributes: function (node, attr$) {
for (var n in attr$) {
if (!this.hasAttribute(n) && n !== 'class') {
var v = attr$[n];
this.serializeValueToAttribute(v, n, this);
}
}
},
_marshalAttributes: function () {
this._takeAttributesToModel(this);
},
_takeAttributesToModel: function (model) {
if (this.hasAttributes()) {
for (var i in this._propertyInfo) {
var info = this._propertyInfo[i];
if (this.hasAttribute(info.attribute)) {
this._setAttributeToProperty(model, info.attribute, i, info);
}
}
}
},
_setAttributeToProperty: function (model, attribute, property, info) {
if (!this._serializing) {
var property = property || Polymer.CaseMap.dashToCamelCase(attribute);
info = info || this._propertyInfo && this._propertyInfo[property];
if (info && !info.readOnly) {
var v = this.getAttribute(attribute);
model[property] = this.deserialize(v, info.type);
}
}
},
_serializing: false,
reflectPropertyToAttribute: function (property, attribute, value) {
this._serializing = true;
value = value === undefined ? this[property] : value;
this.serializeValueToAttribute(value, attribute || Polymer.CaseMap.camelToDashCase(property));
this._serializing = false;
},
serializeValueToAttribute: function (value, attribute, node) {
var str = this.serialize(value);
node = node || this;
if (str === undefined) {
node.removeAttribute(attribute);
} else {
node.setAttribute(attribute, str);
}
},
deserialize: function (value, type) {
switch (type) {
case Number:
value = Number(value);
break;
case Boolean:
value = value !== null;
break;
case Object:
try {
value = JSON.parse(value);
} catch (x) {
}
break;
case Array:
try {
value = JSON.parse(value);
} catch (x) {
value = null;
console.warn('Polymer::Attributes: couldn`t decode Array as JSON');
}
break;
case Date:
value = new Date(value);
break;
case String:
default:
break;
}
return value;
},
serialize: function (value) {
switch (typeof value) {
case 'boolean':
return value ? '' : undefined;
case 'object':
if (value instanceof Date) {
return value;
} else if (value) {
try {
return JSON.stringify(value);
} catch (x) {
return '';
}
}
default:
return value != null ? value : undefined;
}
}
});
Polymer.version = '1.2.4';
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepBehaviors();
this._prepConstructor();
this._prepPropertyInfo();
},
_prepBehavior: function (b) {
this._addHostAttributes(b.hostAttributes);
},
_marshalBehavior: function (b) {
},
_initFeatures: function () {
this._marshalHostAttributes();
this._marshalBehaviors();
}
});
Polymer.Base._addFeature({
_prepTemplate: function () {
if (this._template === undefined) {
this._template = Polymer.DomModule.import(this.is, 'template');
}
if (this._template && this._template.hasAttribute('is')) {
this._warn(this._logf('_prepTemplate', 'top-level Polymer template ' + 'must not be a type-extension, found', this._template, 'Move inside simple <template>.'));
}
if (this._template && !this._template.content && window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
HTMLTemplateElement.decorate(this._template);
}
},
_stampTemplate: function () {
if (this._template) {
this.root = this.instanceTemplate(this._template);
}
},
instanceTemplate: function (template) {
var dom = document.importNode(template._content || template.content, true);
return dom;
}
});
(function () {
var baseAttachedCallback = Polymer.Base.attachedCallback;
Polymer.Base._addFeature({
_hostStack: [],
ready: function () {
},
_registerHost: function (host) {
this.dataHost = host = host || Polymer.Base._hostStack[Polymer.Base._hostStack.length - 1];
if (host && host._clients) {
host._clients.push(this);
}
this._clients = null;
this._clientsReadied = false;
},
_beginHosting: function () {
Polymer.Base._hostStack.push(this);
if (!this._clients) {
this._clients = [];
}
},
_endHosting: function () {
Polymer.Base._hostStack.pop();
},
_tryReady: function () {
this._readied = false;
if (this._canReady()) {
this._ready();
}
},
_canReady: function () {
return !this.dataHost || this.dataHost._clientsReadied;
},
_ready: function () {
this._beforeClientsReady();
if (this._template) {
this._setupRoot();
this._readyClients();
}
this._clientsReadied = true;
this._clients = null;
this._afterClientsReady();
this._readySelf();
},
_readyClients: function () {
this._beginDistribute();
var c$ = this._clients;
if (c$) {
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
c._ready();
}
}
this._finishDistribute();
},
_readySelf: function () {
this._doBehavior('ready');
this._readied = true;
if (this._attachedPending) {
this._attachedPending = false;
this.attachedCallback();
}
},
_beforeClientsReady: function () {
},
_afterClientsReady: function () {
},
_beforeAttached: function () {
},
attachedCallback: function () {
if (this._readied) {
this._beforeAttached();
baseAttachedCallback.call(this);
} else {
this._attachedPending = true;
}
}
});
}());
Polymer.ArraySplice = function () {
function newSplice(index, removed, addedCount) {
return {
index: index,
removed: removed,
addedCount: addedCount
};
}
var EDIT_LEAVE = 0;
var EDIT_UPDATE = 1;
var EDIT_ADD = 2;
var EDIT_DELETE = 3;
function ArraySplice() {
}
ArraySplice.prototype = {
calcEditDistances: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
var rowCount = oldEnd - oldStart + 1;
var columnCount = currentEnd - currentStart + 1;
var distances = new Array(rowCount);
for (var i = 0; i < rowCount; i++) {
distances[i] = new Array(columnCount);
distances[i][0] = i;
}
for (var j = 0; j < columnCount; j++)
distances[0][j] = j;
for (var i = 1; i < rowCount; i++) {
for (var j = 1; j < columnCount; j++) {
if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
distances[i][j] = distances[i - 1][j - 1];
else {
var north = distances[i - 1][j] + 1;
var west = distances[i][j - 1] + 1;
distances[i][j] = north < west ? north : west;
}
}
}
return distances;
},
spliceOperationsFromEditDistances: function (distances) {
var i = distances.length - 1;
var j = distances[0].length - 1;
var current = distances[i][j];
var edits = [];
while (i > 0 || j > 0) {
if (i == 0) {
edits.push(EDIT_ADD);
j--;
continue;
}
if (j == 0) {
edits.push(EDIT_DELETE);
i--;
continue;
}
var northWest = distances[i - 1][j - 1];
var west = distances[i - 1][j];
var north = distances[i][j - 1];
var min;
if (west < north)
min = west < northWest ? west : northWest;
else
min = north < northWest ? north : northWest;
if (min == northWest) {
if (northWest == current) {
edits.push(EDIT_LEAVE);
} else {
edits.push(EDIT_UPDATE);
current = northWest;
}
i--;
j--;
} else if (min == west) {
edits.push(EDIT_DELETE);
i--;
current = west;
} else {
edits.push(EDIT_ADD);
j--;
current = north;
}
}
edits.reverse();
return edits;
},
calcSplices: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
var prefixCount = 0;
var suffixCount = 0;
var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
if (currentStart == 0 && oldStart == 0)
prefixCount = this.sharedPrefix(current, old, minLength);
if (currentEnd == current.length && oldEnd == old.length)
suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
currentStart += prefixCount;
oldStart += prefixCount;
currentEnd -= suffixCount;
oldEnd -= suffixCount;
if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
return [];
if (currentStart == currentEnd) {
var splice = newSplice(currentStart, [], 0);
while (oldStart < oldEnd)
splice.removed.push(old[oldStart++]);
return [splice];
} else if (oldStart == oldEnd)
return [newSplice(currentStart, [], currentEnd - currentStart)];
var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
var splice = undefined;
var splices = [];
var index = currentStart;
var oldIndex = oldStart;
for (var i = 0; i < ops.length; i++) {
switch (ops[i]) {
case EDIT_LEAVE:
if (splice) {
splices.push(splice);
splice = undefined;
}
index++;
oldIndex++;
break;
case EDIT_UPDATE:
if (!splice)
splice = newSplice(index, [], 0);
splice.addedCount++;
index++;
splice.removed.push(old[oldIndex]);
oldIndex++;
break;
case EDIT_ADD:
if (!splice)
splice = newSplice(index, [], 0);
splice.addedCount++;
index++;
break;
case EDIT_DELETE:
if (!splice)
splice = newSplice(index, [], 0);
splice.removed.push(old[oldIndex]);
oldIndex++;
break;
}
}
if (splice) {
splices.push(splice);
}
return splices;
},
sharedPrefix: function (current, old, searchLength) {
for (var i = 0; i < searchLength; i++)
if (!this.equals(current[i], old[i]))
return i;
return searchLength;
},
sharedSuffix: function (current, old, searchLength) {
var index1 = current.length;
var index2 = old.length;
var count = 0;
while (count < searchLength && this.equals(current[--index1], old[--index2]))
count++;
return count;
},
calculateSplices: function (current, previous) {
return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
},
equals: function (currentValue, previousValue) {
return currentValue === previousValue;
}
};
return new ArraySplice();
}();
Polymer.domInnerHTML = function () {
var escapeAttrRegExp = /[&\u00A0"]/g;
var escapeDataRegExp = /[&\u00A0<>]/g;
function escapeReplace(c) {
switch (c) {
case '&':
return '&amp;';
case '<':
return '&lt;';
case '>':
return '&gt;';
case '"':
return '&quot;';
case '\xA0':
return '&nbsp;';
}
}
function escapeAttr(s) {
return s.replace(escapeAttrRegExp, escapeReplace);
}
function escapeData(s) {
return s.replace(escapeDataRegExp, escapeReplace);
}
function makeSet(arr) {
var set = {};
for (var i = 0; i < arr.length; i++) {
set[arr[i]] = true;
}
return set;
}
var voidElements = makeSet([
'area',
'base',
'br',
'col',
'command',
'embed',
'hr',
'img',
'input',
'keygen',
'link',
'meta',
'param',
'source',
'track',
'wbr'
]);
var plaintextParents = makeSet([
'style',
'script',
'xmp',
'iframe',
'noembed',
'noframes',
'plaintext',
'noscript'
]);
function getOuterHTML(node, parentNode, composed) {
switch (node.nodeType) {
case Node.ELEMENT_NODE:
var tagName = node.localName;
var s = '<' + tagName;
var attrs = node.attributes;
for (var i = 0, attr; attr = attrs[i]; i++) {
s += ' ' + attr.name + '="' + escapeAttr(attr.value) + '"';
}
s += '>';
if (voidElements[tagName]) {
return s;
}
return s + getInnerHTML(node, composed) + '</' + tagName + '>';
case Node.TEXT_NODE:
var data = node.data;
if (parentNode && plaintextParents[parentNode.localName]) {
return data;
}
return escapeData(data);
case Node.COMMENT_NODE:
return '<!--' + node.data + '-->';
default:
console.error(node);
throw new Error('not implemented');
}
}
function getInnerHTML(node, composed) {
if (node instanceof HTMLTemplateElement)
node = node.content;
var s = '';
var c$ = Polymer.dom(node).childNodes;
for (var i = 0, l = c$.length, child; i < l && (child = c$[i]); i++) {
s += getOuterHTML(child, node, composed);
}
return s;
}
return { getInnerHTML: getInnerHTML };
}();
(function () {
'use strict';
var nativeInsertBefore = Element.prototype.insertBefore;
var nativeAppendChild = Element.prototype.appendChild;
var nativeRemoveChild = Element.prototype.removeChild;
var TreeApi = Polymer.TreeApi = {
arrayCopyChildNodes: function (parent) {
var copy = [], i = 0;
for (var n = parent.firstChild; n; n = n.nextSibling) {
copy[i++] = n;
}
return copy;
},
arrayCopyChildren: function (parent) {
var copy = [], i = 0;
for (var n = parent.firstElementChild; n; n = n.nextElementSibling) {
copy[i++] = n;
}
return copy;
},
arrayCopy: function (a$) {
var l = a$.length;
var copy = new Array(l);
for (var i = 0; i < l; i++) {
copy[i] = a$[i];
}
return copy;
}
};
Polymer.TreeApi.Logical = {
hasParentNode: function (node) {
return Boolean(node.__dom && node.__dom.parentNode);
},
hasChildNodes: function (node) {
return Boolean(node.__dom && node.__dom.childNodes !== undefined);
},
getChildNodes: function (node) {
return this.hasChildNodes(node) ? this._getChildNodes(node) : node.childNodes;
},
_getChildNodes: function (node) {
if (!node.__dom.childNodes) {
node.__dom.childNodes = [];
for (var n = node.__dom.firstChild; n; n = n.__dom.nextSibling) {
node.__dom.childNodes.push(n);
}
}
return node.__dom.childNodes;
},
getParentNode: function (node) {
return node.__dom && node.__dom.parentNode !== undefined ? node.__dom.parentNode : node.parentNode;
},
getFirstChild: function (node) {
return node.__dom && node.__dom.firstChild !== undefined ? node.__dom.firstChild : node.firstChild;
},
getLastChild: function (node) {
return node.__dom && node.__dom.lastChild !== undefined ? node.__dom.lastChild : node.lastChild;
},
getNextSibling: function (node) {
return node.__dom && node.__dom.nextSibling !== undefined ? node.__dom.nextSibling : node.nextSibling;
},
getPreviousSibling: function (node) {
return node.__dom && node.__dom.previousSibling !== undefined ? node.__dom.previousSibling : node.previousSibling;
},
getFirstElementChild: function (node) {
return node.__dom && node.__dom.firstChild !== undefined ? this._getFirstElementChild(node) : node.firstElementChild;
},
_getFirstElementChild: function (node) {
var n = node.__dom.firstChild;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.nextSibling;
}
return n;
},
getLastElementChild: function (node) {
return node.__dom && node.__dom.lastChild !== undefined ? this._getLastElementChild(node) : node.lastElementChild;
},
_getLastElementChild: function (node) {
var n = node.__dom.lastChild;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.previousSibling;
}
return n;
},
getNextElementSibling: function (node) {
return node.__dom && node.__dom.nextSibling !== undefined ? this._getNextElementSibling(node) : node.nextElementSibling;
},
_getNextElementSibling: function (node) {
var n = node.__dom.nextSibling;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.nextSibling;
}
return n;
},
getPreviousElementSibling: function (node) {
return node.__dom && node.__dom.previousSibling !== undefined ? this._getPreviousElementSibling(node) : node.previousElementSibling;
},
_getPreviousElementSibling: function (node) {
var n = node.__dom.previousSibling;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.previousSibling;
}
return n;
},
saveChildNodes: function (node) {
if (!this.hasChildNodes(node)) {
node.__dom = node.__dom || {};
node.__dom.firstChild = node.firstChild;
node.__dom.lastChild = node.lastChild;
node.__dom.childNodes = [];
for (var n = node.firstChild; n; n = n.nextSibling) {
n.__dom = n.__dom || {};
n.__dom.parentNode = node;
node.__dom.childNodes.push(n);
n.__dom.nextSibling = n.nextSibling;
n.__dom.previousSibling = n.previousSibling;
}
}
},
recordInsertBefore: function (node, container, ref_node) {
container.__dom.childNodes = null;
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
for (var n = node.firstChild; n; n = n.nextSibling) {
this._linkNode(n, container, ref_node);
}
} else {
this._linkNode(node, container, ref_node);
}
},
_linkNode: function (node, container, ref_node) {
node.__dom = node.__dom || {};
container.__dom = container.__dom || {};
if (ref_node) {
ref_node.__dom = ref_node.__dom || {};
}
node.__dom.previousSibling = ref_node ? ref_node.__dom.previousSibling : container.__dom.lastChild;
if (node.__dom.previousSibling) {
node.__dom.previousSibling.__dom.nextSibling = node;
}
node.__dom.nextSibling = ref_node;
if (node.__dom.nextSibling) {
node.__dom.nextSibling.__dom.previousSibling = node;
}
node.__dom.parentNode = container;
if (ref_node) {
if (ref_node === container.__dom.firstChild) {
container.__dom.firstChild = node;
}
} else {
container.__dom.lastChild = node;
if (!container.__dom.firstChild) {
container.__dom.firstChild = node;
}
}
container.__dom.childNodes = null;
},
recordRemoveChild: function (node, container) {
node.__dom = node.__dom || {};
container.__dom = container.__dom || {};
if (node === container.__dom.firstChild) {
container.__dom.firstChild = node.__dom.nextSibling;
}
if (node === container.__dom.lastChild) {
container.__dom.lastChild = node.__dom.previousSibling;
}
var p = node.__dom.previousSibling;
var n = node.__dom.nextSibling;
if (p) {
p.__dom.nextSibling = n;
}
if (n) {
n.__dom.previousSibling = p;
}
node.__dom.parentNode = node.__dom.previousSibling = node.__dom.nextSibling = undefined;
container.__dom.childNodes = null;
}
};
Polymer.TreeApi.Composed = {
getChildNodes: function (node) {
return Polymer.TreeApi.arrayCopyChildNodes(node);
},
getParentNode: function (node) {
return node.parentNode;
},
clearChildNodes: function (node) {
node.textContent = '';
},
insertBefore: function (parentNode, newChild, refChild) {
return nativeInsertBefore.call(parentNode, newChild, refChild || null);
},
appendChild: function (parentNode, newChild) {
return nativeAppendChild.call(parentNode, newChild);
},
removeChild: function (parentNode, node) {
return nativeRemoveChild.call(parentNode, node);
}
};
}());
Polymer.DomApi = function () {
'use strict';
var Settings = Polymer.Settings;
var TreeApi = Polymer.TreeApi;
var DomApi = function (node) {
this.node = needsToWrap ? DomApi.wrap(node) : node;
};
var needsToWrap = Settings.hasShadow && !Settings.nativeShadow;
DomApi.wrap = window.wrap ? window.wrap : function (node) {
return node;
};
DomApi.prototype = {
flush: function () {
Polymer.dom.flush();
},
deepContains: function (node) {
if (this.node.contains(node)) {
return true;
}
var n = node;
var doc = node.ownerDocument;
while (n && n !== doc && n !== this.node) {
n = Polymer.dom(n).parentNode || n.host;
}
return n === this.node;
},
queryDistributedElements: function (selector) {
var c$ = this.getEffectiveChildNodes();
var list = [];
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.nodeType === Node.ELEMENT_NODE && DomApi.matchesSelector.call(c, selector)) {
list.push(c);
}
}
return list;
},
getEffectiveChildNodes: function () {
var list = [];
var c$ = this.childNodes;
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.localName === CONTENT) {
var d$ = dom(c).getDistributedNodes();
for (var j = 0; j < d$.length; j++) {
list.push(d$[j]);
}
} else {
list.push(c);
}
}
return list;
},
observeNodes: function (callback) {
if (callback) {
if (!this.observer) {
this.observer = this.node.localName === CONTENT ? new DomApi.DistributedNodesObserver(this) : new DomApi.EffectiveNodesObserver(this);
}
return this.observer.addListener(callback);
}
},
unobserveNodes: function (handle) {
if (this.observer) {
this.observer.removeListener(handle);
}
},
notifyObserver: function () {
if (this.observer) {
this.observer.notify();
}
},
_query: function (matcher, node, halter) {
node = node || this.node;
var list = [];
this._queryElements(TreeApi.Logical.getChildNodes(node), matcher, halter, list);
return list;
},
_queryElements: function (elements, matcher, halter, list) {
for (var i = 0, l = elements.length, c; i < l && (c = elements[i]); i++) {
if (c.nodeType === Node.ELEMENT_NODE) {
if (this._queryElement(c, matcher, halter, list)) {
return true;
}
}
}
},
_queryElement: function (node, matcher, halter, list) {
var result = matcher(node);
if (result) {
list.push(node);
}
if (halter && halter(result)) {
return result;
}
this._queryElements(TreeApi.Logical.getChildNodes(node), matcher, halter, list);
}
};
var CONTENT = DomApi.CONTENT = 'content';
var dom = DomApi.factory = function (node) {
node = node || document;
if (!node.__domApi) {
node.__domApi = new DomApi.ctor(node);
}
return node.__domApi;
};
DomApi.hasApi = function (node) {
return Boolean(node.__domApi);
};
DomApi.ctor = DomApi;
Polymer.dom = function (obj, patch) {
if (obj instanceof Event) {
return Polymer.EventApi.factory(obj);
} else {
return DomApi.factory(obj, patch);
}
};
var p = Element.prototype;
DomApi.matchesSelector = p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
return DomApi;
}();
(function () {
'use strict';
var Settings = Polymer.Settings;
var DomApi = Polymer.DomApi;
var dom = DomApi.factory;
var TreeApi = Polymer.TreeApi;
var getInnerHTML = Polymer.domInnerHTML.getInnerHTML;
var CONTENT = DomApi.CONTENT;
if (Settings.useShadow) {
return;
}
var nativeCloneNode = Element.prototype.cloneNode;
var nativeImportNode = Document.prototype.importNode;
Polymer.Base.extend(DomApi.prototype, {
_lazyDistribute: function (host) {
if (host.shadyRoot && host.shadyRoot._distributionClean) {
host.shadyRoot._distributionClean = false;
Polymer.dom.addDebouncer(host.debounce('_distribute', host._distributeContent));
}
},
appendChild: function (node) {
return this.insertBefore(node);
},
insertBefore: function (node, ref_node) {
if (ref_node && TreeApi.Logical.getParentNode(ref_node) !== this.node) {
throw Error('The ref_node to be inserted before is not a child ' + 'of this node');
}
if (node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
var parent = TreeApi.Logical.getParentNode(node);
if (parent) {
if (DomApi.hasApi(parent)) {
dom(parent).notifyObserver();
}
this._removeNode(node);
} else {
this._removeOwnerShadyRoot(node);
}
}
if (!this._addNode(node, ref_node)) {
if (ref_node) {
ref_node = ref_node.localName === CONTENT ? this._firstComposedNode(ref_node) : ref_node;
}
var container = this.node._isShadyRoot ? this.node.host : this.node;
if (ref_node) {
TreeApi.Composed.insertBefore(container, node, ref_node);
} else {
TreeApi.Composed.appendChild(container, node);
}
}
this.notifyObserver();
return node;
},
_addNode: function (node, ref_node) {
var root = this.getOwnerRoot();
if (root) {
var ipAdded = this._maybeAddInsertionPoint(node, this.node);
if (!root._invalidInsertionPoints) {
root._invalidInsertionPoints = ipAdded;
}
this._addNodeToHost(root.host, node);
}
if (TreeApi.Logical.hasChildNodes(this.node)) {
TreeApi.Logical.recordInsertBefore(node, this.node, ref_node);
}
var handled = this._maybeDistribute(node) || this.node.shadyRoot;
if (handled) {
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
while (node.firstChild) {
TreeApi.Composed.removeChild(node, node.firstChild);
}
} else {
var parent = TreeApi.Composed.getParentNode(node);
if (parent) {
TreeApi.Composed.removeChild(parent, node);
}
}
}
return handled;
},
removeChild: function (node) {
if (TreeApi.Logical.getParentNode(node) !== this.node) {
throw Error('The node to be removed is not a child of this node: ' + node);
}
if (!this._removeNode(node)) {
var container = this.node._isShadyRoot ? this.node.host : this.node;
var parent = TreeApi.Composed.getParentNode(node);
if (container === parent) {
TreeApi.Composed.removeChild(container, node);
}
}
this.notifyObserver();
return node;
},
_removeNode: function (node) {
var logicalParent = TreeApi.Logical.hasParentNode(node) && TreeApi.Logical.getParentNode(node);
var distributed;
var root = this._ownerShadyRootForNode(node);
if (logicalParent) {
distributed = dom(node)._maybeDistributeParent();
TreeApi.Logical.recordRemoveChild(node, logicalParent);
if (root && this._removeDistributedChildren(root, node)) {
root._invalidInsertionPoints = true;
this._lazyDistribute(root.host);
}
}
this._removeOwnerShadyRoot(node);
if (root) {
this._removeNodeFromHost(root.host, node);
}
return distributed;
},
replaceChild: function (node, ref_node) {
this.insertBefore(node, ref_node);
this.removeChild(ref_node);
return node;
},
_hasCachedOwnerRoot: function (node) {
return Boolean(node._ownerShadyRoot !== undefined);
},
getOwnerRoot: function () {
return this._ownerShadyRootForNode(this.node);
},
_ownerShadyRootForNode: function (node) {
if (!node) {
return;
}
var root = node._ownerShadyRoot;
if (root === undefined) {
if (node._isShadyRoot) {
root = node;
} else {
var parent = TreeApi.Logical.getParentNode(node);
if (parent) {
root = parent._isShadyRoot ? parent : this._ownerShadyRootForNode(parent);
} else {
root = null;
}
}
if (root || document.documentElement.contains(node)) {
node._ownerShadyRoot = root;
}
}
return root;
},
_maybeDistribute: function (node) {
var fragContent = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noContent && dom(node).querySelector(CONTENT);
var wrappedContent = fragContent && TreeApi.Logical.getParentNode(fragContent).nodeType !== Node.DOCUMENT_FRAGMENT_NODE;
var hasContent = fragContent || node.localName === CONTENT;
if (hasContent) {
var root = this.getOwnerRoot();
if (root) {
this._lazyDistribute(root.host);
}
}
var needsDist = this._nodeNeedsDistribution(this.node);
if (needsDist) {
this._lazyDistribute(this.node);
}
return needsDist || hasContent && !wrappedContent;
},
_maybeAddInsertionPoint: function (node, parent) {
var added;
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noContent) {
var c$ = dom(node).querySelectorAll(CONTENT);
for (var i = 0, n, np, na; i < c$.length && (n = c$[i]); i++) {
np = TreeApi.Logical.getParentNode(n);
if (np === node) {
np = parent;
}
na = this._maybeAddInsertionPoint(n, np);
added = added || na;
}
} else if (node.localName === CONTENT) {
TreeApi.Logical.saveChildNodes(parent);
TreeApi.Logical.saveChildNodes(node);
added = true;
}
return added;
},
_updateInsertionPoints: function (host) {
var i$ = host.shadyRoot._insertionPoints = dom(host.shadyRoot).querySelectorAll(CONTENT);
for (var i = 0, c; i < i$.length; i++) {
c = i$[i];
TreeApi.Logical.saveChildNodes(c);
TreeApi.Logical.saveChildNodes(TreeApi.Logical.getParentNode(c));
}
},
_nodeNeedsDistribution: function (node) {
return node && node.shadyRoot && DomApi.hasInsertionPoint(node.shadyRoot);
},
_addNodeToHost: function (host, node) {
if (host._elementAdd) {
host._elementAdd(node);
}
},
_removeNodeFromHost: function (host, node) {
if (host._elementRemove) {
host._elementRemove(node);
}
},
_removeDistributedChildren: function (root, container) {
var hostNeedsDist;
var ip$ = root._insertionPoints;
for (var i = 0; i < ip$.length; i++) {
var content = ip$[i];
if (this._contains(container, content)) {
var dc$ = dom(content).getDistributedNodes();
for (var j = 0; j < dc$.length; j++) {
hostNeedsDist = true;
var node = dc$[j];
var parent = TreeApi.Composed.getParentNode(node);
if (parent) {
TreeApi.Composed.removeChild(parent, node);
}
}
}
}
return hostNeedsDist;
},
_contains: function (container, node) {
while (node) {
if (node == container) {
return true;
}
node = TreeApi.Logical.getParentNode(node);
}
},
_removeOwnerShadyRoot: function (node) {
if (this._hasCachedOwnerRoot(node)) {
var c$ = TreeApi.Logical.getChildNodes(node);
for (var i = 0, l = c$.length, n; i < l && (n = c$[i]); i++) {
this._removeOwnerShadyRoot(n);
}
}
node._ownerShadyRoot = undefined;
},
_firstComposedNode: function (content) {
var n$ = dom(content).getDistributedNodes();
for (var i = 0, l = n$.length, n, p$; i < l && (n = n$[i]); i++) {
p$ = dom(n).getDestinationInsertionPoints();
if (p$[p$.length - 1] === content) {
return n;
}
}
},
querySelector: function (selector) {
var result = this._query(function (n) {
return DomApi.matchesSelector.call(n, selector);
}, this.node, function (n) {
return Boolean(n);
})[0];
return result || null;
},
querySelectorAll: function (selector) {
return this._query(function (n) {
return DomApi.matchesSelector.call(n, selector);
}, this.node);
},
getDestinationInsertionPoints: function () {
return this.node._destinationInsertionPoints || [];
},
getDistributedNodes: function () {
return this.node._distributedNodes || [];
},
_clear: function () {
while (this.childNodes.length) {
this.removeChild(this.childNodes[0]);
}
},
setAttribute: function (name, value) {
this.node.setAttribute(name, value);
this._maybeDistributeParent();
},
removeAttribute: function (name) {
this.node.removeAttribute(name);
this._maybeDistributeParent();
},
_maybeDistributeParent: function () {
if (this._nodeNeedsDistribution(this.parentNode)) {
this._lazyDistribute(this.parentNode);
return true;
}
},
cloneNode: function (deep) {
var n = nativeCloneNode.call(this.node, false);
if (deep) {
var c$ = this.childNodes;
var d = dom(n);
for (var i = 0, nc; i < c$.length; i++) {
nc = dom(c$[i]).cloneNode(true);
d.appendChild(nc);
}
}
return n;
},
importNode: function (externalNode, deep) {
var doc = this.node instanceof Document ? this.node : this.node.ownerDocument;
var n = nativeImportNode.call(doc, externalNode, false);
if (deep) {
var c$ = TreeApi.Logical.getChildNodes(externalNode);
var d = dom(n);
for (var i = 0, nc; i < c$.length; i++) {
nc = dom(doc).importNode(c$[i], true);
d.appendChild(nc);
}
}
return n;
},
_getComposedInnerHTML: function () {
return getInnerHTML(this.node, true);
}
});
Object.defineProperties(DomApi.prototype, {
activeElement: {
get: function () {
var active = document.activeElement;
if (!active) {
return null;
}
var isShadyRoot = !!this.node._isShadyRoot;
if (this.node !== document) {
if (!isShadyRoot) {
return null;
}
if (this.node.host === active || !this.node.host.contains(active)) {
return null;
}
}
var activeRoot = dom(active).getOwnerRoot();
while (activeRoot && activeRoot !== this.node) {
active = activeRoot.host;
activeRoot = dom(active).getOwnerRoot();
}
if (this.node === document) {
return activeRoot ? null : active;
} else {
return activeRoot === this.node ? active : null;
}
},
configurable: true
},
childNodes: {
get: function () {
var c$ = TreeApi.Logical.getChildNodes(this.node);
return Array.isArray(c$) ? c$ : TreeApi.arrayCopyChildNodes(this.node);
},
configurable: true
},
children: {
get: function () {
if (TreeApi.Logical.hasChildNodes(this.node)) {
return Array.prototype.filter.call(this.childNodes, function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
} else {
return TreeApi.arrayCopyChildren(this.node);
}
},
configurable: true
},
parentNode: {
get: function () {
return TreeApi.Logical.getParentNode(this.node);
},
configurable: true
},
firstChild: {
get: function () {
return TreeApi.Logical.getFirstChild(this.node);
},
configurable: true
},
lastChild: {
get: function () {
return TreeApi.Logical.getLastChild(this.node);
},
configurable: true
},
nextSibling: {
get: function () {
return TreeApi.Logical.getNextSibling(this.node);
},
configurable: true
},
previousSibling: {
get: function () {
return TreeApi.Logical.getPreviousSibling(this.node);
},
configurable: true
},
firstElementChild: {
get: function () {
return TreeApi.Logical.getFirstElementChild(this.node);
},
configurable: true
},
lastElementChild: {
get: function () {
return TreeApi.Logical.getLastElementChild(this.node);
},
configurable: true
},
nextElementSibling: {
get: function () {
return TreeApi.Logical.getNextElementSibling(this.node);
},
configurable: true
},
previousElementSibling: {
get: function () {
return TreeApi.Logical.getPreviousElementSibling(this.node);
},
configurable: true
},
textContent: {
get: function () {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
return this.node.textContent;
} else {
var tc = [];
for (var i = 0, cn = this.childNodes, c; c = cn[i]; i++) {
if (c.nodeType !== Node.COMMENT_NODE) {
tc.push(c.textContent);
}
}
return tc.join('');
}
},
set: function (text) {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
this.node.textContent = text;
} else {
this._clear();
if (text) {
this.appendChild(document.createTextNode(text));
}
}
},
configurable: true
},
innerHTML: {
get: function () {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
return null;
} else {
return getInnerHTML(this.node);
}
},
set: function (text) {
var nt = this.node.nodeType;
if (nt !== Node.TEXT_NODE || nt !== Node.COMMENT_NODE) {
this._clear();
var d = document.createElement('div');
d.innerHTML = text;
var c$ = TreeApi.arrayCopyChildNodes(d);
for (var i = 0; i < c$.length; i++) {
this.appendChild(c$[i]);
}
}
},
configurable: true
}
});
DomApi.hasInsertionPoint = function (root) {
return Boolean(root && root._insertionPoints.length);
};
}());
(function () {
'use strict';
var Settings = Polymer.Settings;
var TreeApi = Polymer.TreeApi;
var DomApi = Polymer.DomApi;
if (!Settings.useShadow) {
return;
}
Polymer.Base.extend(DomApi.prototype, {
querySelectorAll: function (selector) {
return TreeApi.arrayCopy(this.node.querySelectorAll(selector));
},
getOwnerRoot: function () {
var n = this.node;
while (n) {
if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE && n.host) {
return n;
}
n = n.parentNode;
}
},
importNode: function (externalNode, deep) {
var doc = this.node instanceof Document ? this.node : this.node.ownerDocument;
return doc.importNode(externalNode, deep);
},
getDestinationInsertionPoints: function () {
var n$ = this.node.getDestinationInsertionPoints && this.node.getDestinationInsertionPoints();
return n$ ? TreeApi.arrayCopy(n$) : [];
},
getDistributedNodes: function () {
var n$ = this.node.getDistributedNodes && this.node.getDistributedNodes();
return n$ ? TreeApi.arrayCopy(n$) : [];
}
});
Object.defineProperties(DomApi.prototype, {
activeElement: {
get: function () {
var node = DomApi.wrap(this.node);
var activeElement = node.activeElement;
return node.contains(activeElement) ? activeElement : null;
},
configurable: true
},
childNodes: {
get: function () {
return TreeApi.arrayCopyChildNodes(this.node);
},
configurable: true
},
children: {
get: function () {
return TreeApi.arrayCopyChildren(this.node);
},
configurable: true
},
textContent: {
get: function () {
return this.node.textContent;
},
set: function (value) {
return this.node.textContent = value;
},
configurable: true
},
innerHTML: {
get: function () {
return this.node.innerHTML;
},
set: function (value) {
return this.node.innerHTML = value;
},
configurable: true
}
});
var forwardMethods = function (m$) {
for (var i = 0; i < m$.length; i++) {
forwardMethod(m$[i]);
}
};
var forwardMethod = function (method) {
DomApi.prototype[method] = function () {
return this.node[method].apply(this.node, arguments);
};
};
forwardMethods([
'cloneNode',
'appendChild',
'insertBefore',
'removeChild',
'replaceChild',
'setAttribute',
'removeAttribute',
'querySelector'
]);
var forwardProperties = function (f$) {
for (var i = 0; i < f$.length; i++) {
forwardProperty(f$[i]);
}
};
var forwardProperty = function (name) {
Object.defineProperty(DomApi.prototype, name, {
get: function () {
return this.node[name];
},
configurable: true
});
};
forwardProperties([
'parentNode',
'firstChild',
'lastChild',
'nextSibling',
'previousSibling',
'firstElementChild',
'lastElementChild',
'nextElementSibling',
'previousElementSibling'
]);
}());
Polymer.Base.extend(Polymer.dom, {
_flushGuard: 0,
_FLUSH_MAX: 100,
_needsTakeRecords: !Polymer.Settings.useNativeCustomElements,
_debouncers: [],
_staticFlushList: [],
_finishDebouncer: null,
flush: function () {
this._flushGuard = 0;
this._prepareFlush();
while (this._debouncers.length && this._flushGuard < this._FLUSH_MAX) {
while (this._debouncers.length) {
this._debouncers.shift().complete();
}
if (this._finishDebouncer) {
this._finishDebouncer.complete();
}
this._prepareFlush();
this._flushGuard++;
}
if (this._flushGuard >= this._FLUSH_MAX) {
console.warn('Polymer.dom.flush aborted. Flush may not be complete.');
}
},
_prepareFlush: function () {
if (this._needsTakeRecords) {
CustomElements.takeRecords();
}
for (var i = 0; i < this._staticFlushList.length; i++) {
this._staticFlushList[i]();
}
},
addStaticFlush: function (fn) {
this._staticFlushList.push(fn);
},
removeStaticFlush: function (fn) {
var i = this._staticFlushList.indexOf(fn);
if (i >= 0) {
this._staticFlushList.splice(i, 1);
}
},
addDebouncer: function (debouncer) {
this._debouncers.push(debouncer);
this._finishDebouncer = Polymer.Debounce(this._finishDebouncer, this._finishFlush);
},
_finishFlush: function () {
Polymer.dom._debouncers = [];
}
});
Polymer.EventApi = function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var Settings = Polymer.Settings;
DomApi.Event = function (event) {
this.event = event;
};
if (Settings.useShadow) {
DomApi.Event.prototype = {
get rootTarget() {
return this.event.path[0];
},
get localTarget() {
return this.event.target;
},
get path() {
return this.event.path;
}
};
} else {
DomApi.Event.prototype = {
get rootTarget() {
return this.event.target;
},
get localTarget() {
var current = this.event.currentTarget;
var currentRoot = current && Polymer.dom(current).getOwnerRoot();
var p$ = this.path;
for (var i = 0; i < p$.length; i++) {
if (Polymer.dom(p$[i]).getOwnerRoot() === currentRoot) {
return p$[i];
}
}
},
get path() {
if (!this.event._path) {
var path = [];
var current = this.rootTarget;
while (current) {
path.push(current);
var insertionPoints = Polymer.dom(current).getDestinationInsertionPoints();
if (insertionPoints.length) {
for (var i = 0; i < insertionPoints.length - 1; i++) {
path.push(insertionPoints[i]);
}
current = insertionPoints[insertionPoints.length - 1];
} else {
current = Polymer.dom(current).parentNode || current.host;
}
}
path.push(window);
this.event._path = path;
}
return this.event._path;
}
};
}
var factory = function (event) {
if (!event.__eventApi) {
event.__eventApi = new DomApi.Event(event);
}
return event.__eventApi;
};
return { factory: factory };
}();
(function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var useShadow = Polymer.Settings.useShadow;
Object.defineProperty(DomApi.prototype, 'classList', {
get: function () {
if (!this._classList) {
this._classList = new DomApi.ClassList(this);
}
return this._classList;
},
configurable: true
});
DomApi.ClassList = function (host) {
this.domApi = host;
this.node = host.node;
};
DomApi.ClassList.prototype = {
add: function () {
this.node.classList.add.apply(this.node.classList, arguments);
this._distributeParent();
},
remove: function () {
this.node.classList.remove.apply(this.node.classList, arguments);
this._distributeParent();
},
toggle: function () {
this.node.classList.toggle.apply(this.node.classList, arguments);
this._distributeParent();
},
_distributeParent: function () {
if (!useShadow) {
this.domApi._maybeDistributeParent();
}
},
contains: function () {
return this.node.classList.contains.apply(this.node.classList, arguments);
}
};
}());
(function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var Settings = Polymer.Settings;
var hasDomApi = Polymer.DomApi.hasDomApi;
DomApi.EffectiveNodesObserver = function (domApi) {
this.domApi = domApi;
this.node = this.domApi.node;
this._listeners = [];
};
DomApi.EffectiveNodesObserver.prototype = {
addListener: function (callback) {
if (!this._isSetup) {
this._setup();
this._isSetup = true;
}
var listener = {
fn: callback,
_nodes: []
};
this._listeners.push(listener);
this._scheduleNotify();
return listener;
},
removeListener: function (handle) {
var i = this._listeners.indexOf(handle);
if (i >= 0) {
this._listeners.splice(i, 1);
handle._nodes = [];
}
if (!this._hasListeners()) {
this._cleanup();
this._isSetup = false;
}
},
_setup: function () {
this._observeContentElements(this.domApi.childNodes);
},
_cleanup: function () {
this._unobserveContentElements(this.domApi.childNodes);
},
_hasListeners: function () {
return Boolean(this._listeners.length);
},
_scheduleNotify: function () {
if (this._debouncer) {
this._debouncer.stop();
}
this._debouncer = Polymer.Debounce(this._debouncer, this._notify);
this._debouncer.context = this;
Polymer.dom.addDebouncer(this._debouncer);
},
notify: function () {
if (this._hasListeners()) {
this._scheduleNotify();
}
},
_notify: function (mxns) {
this._beforeCallListeners();
this._callListeners();
},
_beforeCallListeners: function () {
this._updateContentElements();
},
_updateContentElements: function () {
this._observeContentElements(this.domApi.childNodes);
},
_observeContentElements: function (elements) {
for (var i = 0, n; i < elements.length && (n = elements[i]); i++) {
if (this._isContent(n)) {
n.__observeNodesMap = n.__observeNodesMap || new WeakMap();
if (!n.__observeNodesMap.has(this)) {
n.__observeNodesMap.set(this, this._observeContent(n));
}
}
}
},
_observeContent: function (content) {
var self = this;
var h = Polymer.dom(content).observeNodes(function () {
self._scheduleNotify();
});
h._avoidChangeCalculation = true;
return h;
},
_unobserveContentElements: function (elements) {
for (var i = 0, n, h; i < elements.length && (n = elements[i]); i++) {
if (this._isContent(n)) {
h = n.__observeNodesMap.get(this);
if (h) {
Polymer.dom(n).unobserveNodes(h);
n.__observeNodesMap.delete(this);
}
}
}
},
_isContent: function (node) {
return node.localName === 'content';
},
_callListeners: function () {
var o$ = this._listeners;
var nodes = this._getEffectiveNodes();
for (var i = 0, o; i < o$.length && (o = o$[i]); i++) {
var info = this._generateListenerInfo(o, nodes);
if (info || o._alwaysNotify) {
this._callListener(o, info);
}
}
},
_getEffectiveNodes: function () {
return this.domApi.getEffectiveChildNodes();
},
_generateListenerInfo: function (listener, newNodes) {
if (listener._avoidChangeCalculation) {
return true;
}
var oldNodes = listener._nodes;
var info = {
target: this.node,
addedNodes: [],
removedNodes: []
};
var splices = Polymer.ArraySplice.calculateSplices(newNodes, oldNodes);
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0, n; j < s.removed.length && (n = s.removed[j]); j++) {
info.removedNodes.push(n);
}
}
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = s.index; j < s.index + s.addedCount; j++) {
info.addedNodes.push(newNodes[j]);
}
}
listener._nodes = newNodes;
if (info.addedNodes.length || info.removedNodes.length) {
return info;
}
},
_callListener: function (listener, info) {
return listener.fn.call(this.node, info);
},
enableShadowAttributeTracking: function () {
}
};
if (Settings.useShadow) {
var baseSetup = DomApi.EffectiveNodesObserver.prototype._setup;
var baseCleanup = DomApi.EffectiveNodesObserver.prototype._cleanup;
var beforeCallListeners = DomApi.EffectiveNodesObserver.prototype._beforeCallListeners;
Polymer.Base.extend(DomApi.EffectiveNodesObserver.prototype, {
_setup: function () {
if (!this._observer) {
var self = this;
this._mutationHandler = function (mxns) {
if (mxns && mxns.length) {
self._scheduleNotify();
}
};
this._observer = new MutationObserver(this._mutationHandler);
this._boundFlush = function () {
self._flush();
};
Polymer.dom.addStaticFlush(this._boundFlush);
this._observer.observe(this.node, { childList: true });
}
baseSetup.call(this);
},
_cleanup: function () {
this._observer.disconnect();
this._observer = null;
this._mutationHandler = null;
Polymer.dom.removeStaticFlush(this._boundFlush);
baseCleanup.call(this);
},
_flush: function () {
if (this._observer) {
this._mutationHandler(this._observer.takeRecords());
}
},
enableShadowAttributeTracking: function () {
if (this._observer) {
this._makeContentListenersAlwaysNotify();
this._observer.disconnect();
this._observer.observe(this.node, {
childList: true,
attributes: true,
subtree: true
});
var root = this.domApi.getOwnerRoot();
var host = root && root.host;
if (host && Polymer.dom(host).observer) {
Polymer.dom(host).observer.enableShadowAttributeTracking();
}
}
},
_makeContentListenersAlwaysNotify: function () {
for (var i = 0, h; i < this._listeners.length; i++) {
h = this._listeners[i];
h._alwaysNotify = h._isContentListener;
}
}
});
}
}());
(function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var Settings = Polymer.Settings;
DomApi.DistributedNodesObserver = function (domApi) {
DomApi.EffectiveNodesObserver.call(this, domApi);
};
DomApi.DistributedNodesObserver.prototype = Object.create(DomApi.EffectiveNodesObserver.prototype);
Polymer.Base.extend(DomApi.DistributedNodesObserver.prototype, {
_setup: function () {
},
_cleanup: function () {
},
_beforeCallListeners: function () {
},
_getEffectiveNodes: function () {
return this.domApi.getDistributedNodes();
}
});
if (Settings.useShadow) {
Polymer.Base.extend(DomApi.DistributedNodesObserver.prototype, {
_setup: function () {
if (!this._observer) {
var root = this.domApi.getOwnerRoot();
var host = root && root.host;
if (host) {
var self = this;
this._observer = Polymer.dom(host).observeNodes(function () {
self._scheduleNotify();
});
this._observer._isContentListener = true;
if (this._hasAttrSelect()) {
Polymer.dom(host).observer.enableShadowAttributeTracking();
}
}
}
},
_hasAttrSelect: function () {
var select = this.node.getAttribute('select');
return select && select.match(/[[.]+/);
},
_cleanup: function () {
var root = this.domApi.getOwnerRoot();
var host = root && root.host;
if (host) {
Polymer.dom(host).unobserveNodes(this._observer);
}
this._observer = null;
}
});
}
}());
(function () {
var DomApi = Polymer.DomApi;
var TreeApi = Polymer.TreeApi;
Polymer.Base._addFeature({
_prepShady: function () {
this._useContent = this._useContent || Boolean(this._template);
},
_setupShady: function () {
this.shadyRoot = null;
if (!this.__domApi) {
this.__domApi = null;
}
if (!this.__dom) {
this.__dom = null;
}
if (!this._ownerShadyRoot) {
this._ownerShadyRoot = undefined;
}
},
_poolContent: function () {
if (this._useContent) {
TreeApi.Logical.saveChildNodes(this);
}
},
_setupRoot: function () {
if (this._useContent) {
this._createLocalRoot();
if (!this.dataHost) {
upgradeLogicalChildren(TreeApi.Logical.getChildNodes(this));
}
}
},
_createLocalRoot: function () {
this.shadyRoot = this.root;
this.shadyRoot._distributionClean = false;
this.shadyRoot._hasDistributed = false;
this.shadyRoot._isShadyRoot = true;
this.shadyRoot._dirtyRoots = [];
var i$ = this.shadyRoot._insertionPoints = !this._notes || this._notes._hasContent ? this.shadyRoot.querySelectorAll('content') : [];
TreeApi.Logical.saveChildNodes(this.shadyRoot);
for (var i = 0, c; i < i$.length; i++) {
c = i$[i];
TreeApi.Logical.saveChildNodes(c);
TreeApi.Logical.saveChildNodes(c.parentNode);
}
this.shadyRoot.host = this;
},
get domHost() {
var root = Polymer.dom(this).getOwnerRoot();
return root && root.host;
},
distributeContent: function (updateInsertionPoints) {
if (this.shadyRoot) {
this.shadyRoot._invalidInsertionPoints = this.shadyRoot._invalidInsertionPoints || updateInsertionPoints;
var host = getTopDistributingHost(this);
Polymer.dom(this)._lazyDistribute(host);
}
},
_distributeContent: function () {
if (this._useContent && !this.shadyRoot._distributionClean) {
if (this.shadyRoot._invalidInsertionPoints) {
Polymer.dom(this)._updateInsertionPoints(this);
this.shadyRoot._invalidInsertionPoints = false;
}
this._beginDistribute();
this._distributeDirtyRoots();
this._finishDistribute();
}
},
_beginDistribute: function () {
if (this._useContent && DomApi.hasInsertionPoint(this.shadyRoot)) {
this._resetDistribution();
this._distributePool(this.shadyRoot, this._collectPool());
}
},
_distributeDirtyRoots: function () {
var c$ = this.shadyRoot._dirtyRoots;
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
c._distributeContent();
}
this.shadyRoot._dirtyRoots = [];
},
_finishDistribute: function () {
if (this._useContent) {
this.shadyRoot._distributionClean = true;
if (DomApi.hasInsertionPoint(this.shadyRoot)) {
this._composeTree();
notifyContentObservers(this.shadyRoot);
} else {
if (!this.shadyRoot._hasDistributed) {
TreeApi.Composed.clearChildNodes(this);
this.appendChild(this.shadyRoot);
} else {
var children = this._composeNode(this);
this._updateChildNodes(this, children);
}
}
if (!this.shadyRoot._hasDistributed) {
notifyInitialDistribution(this);
}
this.shadyRoot._hasDistributed = true;
}
},
elementMatches: function (selector, node) {
node = node || this;
return DomApi.matchesSelector.call(node, selector);
},
_resetDistribution: function () {
var children = TreeApi.Logical.getChildNodes(this);
for (var i = 0; i < children.length; i++) {
var child = children[i];
if (child._destinationInsertionPoints) {
child._destinationInsertionPoints = undefined;
}
if (isInsertionPoint(child)) {
clearDistributedDestinationInsertionPoints(child);
}
}
var root = this.shadyRoot;
var p$ = root._insertionPoints;
for (var j = 0; j < p$.length; j++) {
p$[j]._distributedNodes = [];
}
},
_collectPool: function () {
var pool = [];
var children = TreeApi.Logical.getChildNodes(this);
for (var i = 0; i < children.length; i++) {
var child = children[i];
if (isInsertionPoint(child)) {
pool.push.apply(pool, child._distributedNodes);
} else {
pool.push(child);
}
}
return pool;
},
_distributePool: function (node, pool) {
var p$ = node._insertionPoints;
for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
this._distributeInsertionPoint(p, pool);
maybeRedistributeParent(p, this);
}
},
_distributeInsertionPoint: function (content, pool) {
var anyDistributed = false;
for (var i = 0, l = pool.length, node; i < l; i++) {
node = pool[i];
if (!node) {
continue;
}
if (this._matchesContentSelect(node, content)) {
distributeNodeInto(node, content);
pool[i] = undefined;
anyDistributed = true;
}
}
if (!anyDistributed) {
var children = TreeApi.Logical.getChildNodes(content);
for (var j = 0; j < children.length; j++) {
distributeNodeInto(children[j], content);
}
}
},
_composeTree: function () {
this._updateChildNodes(this, this._composeNode(this));
var p$ = this.shadyRoot._insertionPoints;
for (var i = 0, l = p$.length, p, parent; i < l && (p = p$[i]); i++) {
parent = TreeApi.Logical.getParentNode(p);
if (!parent._useContent && parent !== this && parent !== this.shadyRoot) {
this._updateChildNodes(parent, this._composeNode(parent));
}
}
},
_composeNode: function (node) {
var children = [];
var c$ = TreeApi.Logical.getChildNodes(node.shadyRoot || node);
for (var i = 0; i < c$.length; i++) {
var child = c$[i];
if (isInsertionPoint(child)) {
var distributedNodes = child._distributedNodes;
for (var j = 0; j < distributedNodes.length; j++) {
var distributedNode = distributedNodes[j];
if (isFinalDestination(child, distributedNode)) {
children.push(distributedNode);
}
}
} else {
children.push(child);
}
}
return children;
},
_updateChildNodes: function (container, children) {
var composed = TreeApi.Composed.getChildNodes(container);
var splices = Polymer.ArraySplice.calculateSplices(children, composed);
for (var i = 0, d = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0, n; j < s.removed.length && (n = s.removed[j]); j++) {
if (TreeApi.Composed.getParentNode(n) === container) {
TreeApi.Composed.removeChild(container, n);
}
composed.splice(s.index + d, 1);
}
d -= s.addedCount;
}
for (var i = 0, s, next; i < splices.length && (s = splices[i]); i++) {
next = composed[s.index];
for (var j = s.index, n; j < s.index + s.addedCount; j++) {
n = children[j];
TreeApi.Composed.insertBefore(container, n, next);
composed.splice(j, 0, n);
}
}
},
_matchesContentSelect: function (node, contentElement) {
var select = contentElement.getAttribute('select');
if (!select) {
return true;
}
select = select.trim();
if (!select) {
return true;
}
if (!(node instanceof Element)) {
return false;
}
var validSelectors = /^(:not\()?[*.#[a-zA-Z_|]/;
if (!validSelectors.test(select)) {
return false;
}
return this.elementMatches(select, node);
},
_elementAdd: function () {
},
_elementRemove: function () {
}
});
function distributeNodeInto(child, insertionPoint) {
insertionPoint._distributedNodes.push(child);
var points = child._destinationInsertionPoints;
if (!points) {
child._destinationInsertionPoints = [insertionPoint];
} else {
points.push(insertionPoint);
}
}
function clearDistributedDestinationInsertionPoints(content) {
var e$ = content._distributedNodes;
if (e$) {
for (var i = 0; i < e$.length; i++) {
var d = e$[i]._destinationInsertionPoints;
if (d) {
d.splice(d.indexOf(content) + 1, d.length);
}
}
}
}
function maybeRedistributeParent(content, host) {
var parent = TreeApi.Logical.getParentNode(content);
if (parent && parent.shadyRoot && DomApi.hasInsertionPoint(parent.shadyRoot) && parent.shadyRoot._distributionClean) {
parent.shadyRoot._distributionClean = false;
host.shadyRoot._dirtyRoots.push(parent);
}
}
function isFinalDestination(insertionPoint, node) {
var points = node._destinationInsertionPoints;
return points && points[points.length - 1] === insertionPoint;
}
function isInsertionPoint(node) {
return node.localName == 'content';
}
function getTopDistributingHost(host) {
while (host && hostNeedsRedistribution(host)) {
host = host.domHost;
}
return host;
}
function hostNeedsRedistribution(host) {
var c$ = TreeApi.Logical.getChildNodes(host);
for (var i = 0, c; i < c$.length; i++) {
c = c$[i];
if (c.localName && c.localName === 'content') {
return host.domHost;
}
}
}
function notifyContentObservers(root) {
for (var i = 0, c; i < root._insertionPoints.length; i++) {
c = root._insertionPoints[i];
if (DomApi.hasApi(c)) {
Polymer.dom(c).notifyObserver();
}
}
}
function notifyInitialDistribution(host) {
if (DomApi.hasApi(host)) {
Polymer.dom(host).notifyObserver();
}
}
var needsUpgrade = window.CustomElements && !CustomElements.useNative;
function upgradeLogicalChildren(children) {
if (needsUpgrade && children) {
for (var i = 0; i < children.length; i++) {
CustomElements.upgrade(children[i]);
}
}
}
}());
if (Polymer.Settings.useShadow) {
Polymer.Base._addFeature({
_poolContent: function () {
},
_beginDistribute: function () {
},
distributeContent: function () {
},
_distributeContent: function () {
},
_finishDistribute: function () {
},
_createLocalRoot: function () {
this.createShadowRoot();
this.shadowRoot.appendChild(this.root);
this.root = this.shadowRoot;
}
});
}
Polymer.Async = {
_currVal: 0,
_lastVal: 0,
_callbacks: [],
_twiddleContent: 0,
_twiddle: document.createTextNode(''),
run: function (callback, waitTime) {
if (waitTime > 0) {
return ~setTimeout(callback, waitTime);
} else {
this._twiddle.textContent = this._twiddleContent++;
this._callbacks.push(callback);
return this._currVal++;
}
},
cancel: function (handle) {
if (handle < 0) {
clearTimeout(~handle);
} else {
var idx = handle - this._lastVal;
if (idx >= 0) {
if (!this._callbacks[idx]) {
throw 'invalid async handle: ' + handle;
}
this._callbacks[idx] = null;
}
}
},
_atEndOfMicrotask: function () {
var len = this._callbacks.length;
for (var i = 0; i < len; i++) {
var cb = this._callbacks[i];
if (cb) {
try {
cb();
} catch (e) {
i++;
this._callbacks.splice(0, i);
this._lastVal += i;
this._twiddle.textContent = this._twiddleContent++;
throw e;
}
}
}
this._callbacks.splice(0, len);
this._lastVal += len;
}
};
new window.MutationObserver(function () {
Polymer.Async._atEndOfMicrotask();
}).observe(Polymer.Async._twiddle, { characterData: true });
Polymer.Debounce = function () {
var Async = Polymer.Async;
var Debouncer = function (context) {
this.context = context;
var self = this;
this.boundComplete = function () {
self.complete();
};
};
Debouncer.prototype = {
go: function (callback, wait) {
var h;
this.finish = function () {
Async.cancel(h);
};
h = Async.run(this.boundComplete, wait);
this.callback = callback;
},
stop: function () {
if (this.finish) {
this.finish();
this.finish = null;
}
},
complete: function () {
if (this.finish) {
this.stop();
this.callback.call(this.context);
}
}
};
function debounce(debouncer, callback, wait) {
if (debouncer) {
debouncer.stop();
} else {
debouncer = new Debouncer(this);
}
debouncer.go(callback, wait);
return debouncer;
}
return debounce;
}();
Polymer.Base._addFeature({
_setupDebouncers: function () {
this._debouncers = {};
},
debounce: function (jobName, callback, wait) {
return this._debouncers[jobName] = Polymer.Debounce.call(this, this._debouncers[jobName], callback, wait);
},
isDebouncerActive: function (jobName) {
var debouncer = this._debouncers[jobName];
return !!(debouncer && debouncer.finish);
},
flushDebouncer: function (jobName) {
var debouncer = this._debouncers[jobName];
if (debouncer) {
debouncer.complete();
}
},
cancelDebouncer: function (jobName) {
var debouncer = this._debouncers[jobName];
if (debouncer) {
debouncer.stop();
}
}
});
Polymer.DomModule = document.createElement('dom-module');
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepBehaviors();
this._prepConstructor();
this._prepTemplate();
this._prepShady();
this._prepPropertyInfo();
},
_prepBehavior: function (b) {
this._addHostAttributes(b.hostAttributes);
},
_initFeatures: function () {
this._registerHost();
if (this._template) {
this._poolContent();
this._beginHosting();
this._stampTemplate();
this._endHosting();
}
this._marshalHostAttributes();
this._setupDebouncers();
this._marshalBehaviors();
this._tryReady();
},
_marshalBehavior: function (b) {
}
});
Polymer.nar = [];
Polymer.Annotations = {
parseAnnotations: function (template) {
var list = [];
var content = template._content || template.content;
this._parseNodeAnnotations(content, list, template.hasAttribute('strip-whitespace'));
return list;
},
_parseNodeAnnotations: function (node, list, stripWhiteSpace) {
return node.nodeType === Node.TEXT_NODE ? this._parseTextNodeAnnotation(node, list) : this._parseElementAnnotations(node, list, stripWhiteSpace);
},
_bindingRegex: function () {
var IDENT = '(?:' + '[a-zA-Z_$][\\w.:$-*]*' + ')';
var NUMBER = '(?:' + '[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?' + ')';
var SQUOTE_STRING = '(?:' + '\'(?:[^\'\\\\]|\\\\.)*\'' + ')';
var DQUOTE_STRING = '(?:' + '"(?:[^"\\\\]|\\\\.)*"' + ')';
var STRING = '(?:' + SQUOTE_STRING + '|' + DQUOTE_STRING + ')';
var ARGUMENT = '(?:' + IDENT + '|' + NUMBER + '|' + STRING + '\\s*' + ')';
var ARGUMENTS = '(?:' + ARGUMENT + '(?:,\\s*' + ARGUMENT + ')*' + ')';
var ARGUMENT_LIST = '(?:' + '\\(\\s*' + '(?:' + ARGUMENTS + '?' + ')' + '\\)\\s*' + ')';
var BINDING = '(' + IDENT + '\\s*' + ARGUMENT_LIST + '?' + ')';
var OPEN_BRACKET = '(\\[\\[|{{)' + '\\s*';
var CLOSE_BRACKET = '(?:]]|}})';
var NEGATE = '(?:(!)\\s*)?';
var EXPRESSION = OPEN_BRACKET + NEGATE + BINDING + CLOSE_BRACKET;
return new RegExp(EXPRESSION, 'g');
}(),
_parseBindings: function (text) {
var re = this._bindingRegex;
var parts = [];
var lastIndex = 0;
var m;
while ((m = re.exec(text)) !== null) {
if (m.index > lastIndex) {
parts.push({ literal: text.slice(lastIndex, m.index) });
}
var mode = m[1][0];
var negate = Boolean(m[2]);
var value = m[3].trim();
var customEvent, notifyEvent, colon;
if (mode == '{' && (colon = value.indexOf('::')) > 0) {
notifyEvent = value.substring(colon + 2);
value = value.substring(0, colon);
customEvent = true;
}
parts.push({
compoundIndex: parts.length,
value: value,
mode: mode,
negate: negate,
event: notifyEvent,
customEvent: customEvent
});
lastIndex = re.lastIndex;
}
if (lastIndex && lastIndex < text.length) {
var literal = text.substring(lastIndex);
if (literal) {
parts.push({ literal: literal });
}
}
if (parts.length) {
return parts;
}
},
_literalFromParts: function (parts) {
var s = '';
for (var i = 0; i < parts.length; i++) {
var literal = parts[i].literal;
s += literal || '';
}
return s;
},
_parseTextNodeAnnotation: function (node, list) {
var parts = this._parseBindings(node.textContent);
if (parts) {
node.textContent = this._literalFromParts(parts) || ' ';
var annote = {
bindings: [{
kind: 'text',
name: 'textContent',
parts: parts,
isCompound: parts.length !== 1
}]
};
list.push(annote);
return annote;
}
},
_parseElementAnnotations: function (element, list, stripWhiteSpace) {
var annote = {
bindings: [],
events: []
};
if (element.localName === 'content') {
list._hasContent = true;
}
this._parseChildNodesAnnotations(element, annote, list, stripWhiteSpace);
if (element.attributes) {
this._parseNodeAttributeAnnotations(element, annote, list);
if (this.prepElement) {
this.prepElement(element);
}
}
if (annote.bindings.length || annote.events.length || annote.id) {
list.push(annote);
}
return annote;
},
_parseChildNodesAnnotations: function (root, annote, list, stripWhiteSpace) {
if (root.firstChild) {
var node = root.firstChild;
var i = 0;
while (node) {
var next = node.nextSibling;
if (node.localName === 'template' && !node.hasAttribute('preserve-content')) {
this._parseTemplate(node, i, list, annote);
}
if (node.nodeType === Node.TEXT_NODE) {
var n = next;
while (n && n.nodeType === Node.TEXT_NODE) {
node.textContent += n.textContent;
next = n.nextSibling;
root.removeChild(n);
n = next;
}
if (stripWhiteSpace && !node.textContent.trim()) {
root.removeChild(node);
i--;
}
}
if (node.parentNode) {
var childAnnotation = this._parseNodeAnnotations(node, list, stripWhiteSpace);
if (childAnnotation) {
childAnnotation.parent = annote;
childAnnotation.index = i;
}
}
node = next;
i++;
}
}
},
_parseTemplate: function (node, index, list, parent) {
var content = document.createDocumentFragment();
content._notes = this.parseAnnotations(node);
content.appendChild(node.content);
list.push({
bindings: Polymer.nar,
events: Polymer.nar,
templateContent: content,
parent: parent,
index: index
});
},
_parseNodeAttributeAnnotations: function (node, annotation) {
var attrs = Array.prototype.slice.call(node.attributes);
for (var i = attrs.length - 1, a; a = attrs[i]; i--) {
var n = a.name;
var v = a.value;
var b;
if (n.slice(0, 3) === 'on-') {
node.removeAttribute(n);
annotation.events.push({
name: n.slice(3),
value: v
});
} else if (b = this._parseNodeAttributeAnnotation(node, n, v)) {
annotation.bindings.push(b);
} else if (n === 'id') {
annotation.id = v;
}
}
},
_parseNodeAttributeAnnotation: function (node, name, value) {
var parts = this._parseBindings(value);
if (parts) {
var origName = name;
var kind = 'property';
if (name[name.length - 1] == '$') {
name = name.slice(0, -1);
kind = 'attribute';
}
var literal = this._literalFromParts(parts);
if (literal && kind == 'attribute') {
node.setAttribute(name, literal);
}
if (node.localName === 'input' && origName === 'value') {
node.setAttribute(origName, '');
}
node.removeAttribute(origName);
if (kind === 'property') {
name = Polymer.CaseMap.dashToCamelCase(name);
}
return {
kind: kind,
name: name,
parts: parts,
literal: literal,
isCompound: parts.length !== 1
};
}
},
findAnnotatedNode: function (root, annote) {
var parent = annote.parent && Polymer.Annotations.findAnnotatedNode(root, annote.parent);
if (parent) {
for (var n = parent.firstChild, i = 0; n; n = n.nextSibling) {
if (annote.index === i++) {
return n;
}
}
} else {
return root;
}
}
};
(function () {
function resolveCss(cssText, ownerDocument) {
return cssText.replace(CSS_URL_RX, function (m, pre, url, post) {
return pre + '\'' + resolve(url.replace(/["']/g, ''), ownerDocument) + '\'' + post;
});
}
function resolveAttrs(element, ownerDocument) {
for (var name in URL_ATTRS) {
var a$ = URL_ATTRS[name];
for (var i = 0, l = a$.length, a, at, v; i < l && (a = a$[i]); i++) {
if (name === '*' || element.localName === name) {
at = element.attributes[a];
v = at && at.value;
if (v && v.search(BINDING_RX) < 0) {
at.value = a === 'style' ? resolveCss(v, ownerDocument) : resolve(v, ownerDocument);
}
}
}
}
}
function resolve(url, ownerDocument) {
if (url && url[0] === '#') {
return url;
}
var resolver = getUrlResolver(ownerDocument);
resolver.href = url;
return resolver.href || url;
}
var tempDoc;
var tempDocBase;
function resolveUrl(url, baseUri) {
if (!tempDoc) {
tempDoc = document.implementation.createHTMLDocument('temp');
tempDocBase = tempDoc.createElement('base');
tempDoc.head.appendChild(tempDocBase);
}
tempDocBase.href = baseUri;
return resolve(url, tempDoc);
}
function getUrlResolver(ownerDocument) {
return ownerDocument.__urlResolver || (ownerDocument.__urlResolver = ownerDocument.createElement('a'));
}
var CSS_URL_RX = /(url\()([^)]*)(\))/g;
var URL_ATTRS = {
'*': [
'href',
'src',
'style',
'url'
],
form: ['action']
};
var BINDING_RX = /\{\{|\[\[/;
Polymer.ResolveUrl = {
resolveCss: resolveCss,
resolveAttrs: resolveAttrs,
resolveUrl: resolveUrl
};
}());
Polymer.Base._addFeature({
_prepAnnotations: function () {
if (!this._template) {
this._notes = [];
} else {
var self = this;
Polymer.Annotations.prepElement = function (element) {
self._prepElement(element);
};
if (this._template._content && this._template._content._notes) {
this._notes = this._template._content._notes;
} else {
this._notes = Polymer.Annotations.parseAnnotations(this._template);
this._processAnnotations(this._notes);
}
Polymer.Annotations.prepElement = null;
}
},
_processAnnotations: function (notes) {
for (var i = 0; i < notes.length; i++) {
var note = notes[i];
for (var j = 0; j < note.bindings.length; j++) {
var b = note.bindings[j];
for (var k = 0; k < b.parts.length; k++) {
var p = b.parts[k];
if (!p.literal) {
p.signature = this._parseMethod(p.value);
if (!p.signature) {
p.model = this._modelForPath(p.value);
}
}
}
}
if (note.templateContent) {
this._processAnnotations(note.templateContent._notes);
var pp = note.templateContent._parentProps = this._discoverTemplateParentProps(note.templateContent._notes);
var bindings = [];
for (var prop in pp) {
bindings.push({
index: note.index,
kind: 'property',
name: '_parent_' + prop,
parts: [{
mode: '{',
model: prop,
value: prop
}]
});
}
note.bindings = note.bindings.concat(bindings);
}
}
},
_discoverTemplateParentProps: function (notes) {
var pp = {};
for (var i = 0, n; i < notes.length && (n = notes[i]); i++) {
for (var j = 0, b$ = n.bindings, b; j < b$.length && (b = b$[j]); j++) {
for (var k = 0, p$ = b.parts, p; k < p$.length && (p = p$[k]); k++) {
if (p.signature) {
var args = p.signature.args;
for (var kk = 0; kk < args.length; kk++) {
var model = args[kk].model;
if (model) {
pp[model] = true;
}
}
} else {
if (p.model) {
pp[p.model] = true;
}
}
}
}
if (n.templateContent) {
var tpp = n.templateContent._parentProps;
Polymer.Base.mixin(pp, tpp);
}
}
return pp;
},
_prepElement: function (element) {
Polymer.ResolveUrl.resolveAttrs(element, this._template.ownerDocument);
},
_findAnnotatedNode: Polymer.Annotations.findAnnotatedNode,
_marshalAnnotationReferences: function () {
if (this._template) {
this._marshalIdNodes();
this._marshalAnnotatedNodes();
this._marshalAnnotatedListeners();
}
},
_configureAnnotationReferences: function (config) {
var notes = this._notes;
var nodes = this._nodes;
for (var i = 0; i < notes.length; i++) {
var note = notes[i];
var node = nodes[i];
this._configureTemplateContent(note, node);
this._configureCompoundBindings(note, node);
}
},
_configureTemplateContent: function (note, node) {
if (note.templateContent) {
node._content = note.templateContent;
}
},
_configureCompoundBindings: function (note, node) {
var bindings = note.bindings;
for (var i = 0; i < bindings.length; i++) {
var binding = bindings[i];
if (binding.isCompound) {
var storage = node.__compoundStorage__ || (node.__compoundStorage__ = {});
var parts = binding.parts;
var literals = new Array(parts.length);
for (var j = 0; j < parts.length; j++) {
literals[j] = parts[j].literal;
}
var name = binding.name;
storage[name] = literals;
if (binding.literal && binding.kind == 'property') {
if (node._configValue) {
node._configValue(name, binding.literal);
} else {
node[name] = binding.literal;
}
}
}
}
},
_marshalIdNodes: function () {
this.$ = {};
for (var i = 0, l = this._notes.length, a; i < l && (a = this._notes[i]); i++) {
if (a.id) {
this.$[a.id] = this._findAnnotatedNode(this.root, a);
}
}
},
_marshalAnnotatedNodes: function () {
if (this._notes && this._notes.length) {
var r = new Array(this._notes.length);
for (var i = 0; i < this._notes.length; i++) {
r[i] = this._findAnnotatedNode(this.root, this._notes[i]);
}
this._nodes = r;
}
},
_marshalAnnotatedListeners: function () {
for (var i = 0, l = this._notes.length, a; i < l && (a = this._notes[i]); i++) {
if (a.events && a.events.length) {
var node = this._findAnnotatedNode(this.root, a);
for (var j = 0, e$ = a.events, e; j < e$.length && (e = e$[j]); j++) {
this.listen(node, e.name, e.value);
}
}
}
}
});
Polymer.Base._addFeature({
listeners: {},
_listenListeners: function (listeners) {
var node, name, eventName;
for (eventName in listeners) {
if (eventName.indexOf('.') < 0) {
node = this;
name = eventName;
} else {
name = eventName.split('.');
node = this.$[name[0]];
name = name[1];
}
this.listen(node, name, listeners[eventName]);
}
},
listen: function (node, eventName, methodName) {
var handler = this._recallEventHandler(this, eventName, node, methodName);
if (!handler) {
handler = this._createEventHandler(node, eventName, methodName);
}
if (handler._listening) {
return;
}
this._listen(node, eventName, handler);
handler._listening = true;
},
_boundListenerKey: function (eventName, methodName) {
return eventName + ':' + methodName;
},
_recordEventHandler: function (host, eventName, target, methodName, handler) {
var hbl = host.__boundListeners;
if (!hbl) {
hbl = host.__boundListeners = new WeakMap();
}
var bl = hbl.get(target);
if (!bl) {
bl = {};
hbl.set(target, bl);
}
var key = this._boundListenerKey(eventName, methodName);
bl[key] = handler;
},
_recallEventHandler: function (host, eventName, target, methodName) {
var hbl = host.__boundListeners;
if (!hbl) {
return;
}
var bl = hbl.get(target);
if (!bl) {
return;
}
var key = this._boundListenerKey(eventName, methodName);
return bl[key];
},
_createEventHandler: function (node, eventName, methodName) {
var host = this;
var handler = function (e) {
if (host[methodName]) {
host[methodName](e, e.detail);
} else {
host._warn(host._logf('_createEventHandler', 'listener method `' + methodName + '` not defined'));
}
};
handler._listening = false;
this._recordEventHandler(host, eventName, node, methodName, handler);
return handler;
},
unlisten: function (node, eventName, methodName) {
var handler = this._recallEventHandler(this, eventName, node, methodName);
if (handler) {
this._unlisten(node, eventName, handler);
handler._listening = false;
}
},
_listen: function (node, eventName, handler) {
node.addEventListener(eventName, handler);
},
_unlisten: function (node, eventName, handler) {
node.removeEventListener(eventName, handler);
}
});
(function () {
'use strict';
var wrap = Polymer.DomApi.wrap;
var HAS_NATIVE_TA = typeof document.head.style.touchAction === 'string';
var GESTURE_KEY = '__polymerGestures';
var HANDLED_OBJ = '__polymerGesturesHandled';
var TOUCH_ACTION = '__polymerGesturesTouchAction';
var TAP_DISTANCE = 25;
var TRACK_DISTANCE = 5;
var TRACK_LENGTH = 2;
var MOUSE_TIMEOUT = 2500;
var MOUSE_EVENTS = [
'mousedown',
'mousemove',
'mouseup',
'click'
];
var MOUSE_WHICH_TO_BUTTONS = [
0,
1,
4,
2
];
var MOUSE_HAS_BUTTONS = function () {
try {
return new MouseEvent('test', { buttons: 1 }).buttons === 1;
} catch (e) {
return false;
}
}();
var IS_TOUCH_ONLY = navigator.userAgent.match(/iP(?:[oa]d|hone)|Android/);
var mouseCanceller = function (mouseEvent) {
mouseEvent[HANDLED_OBJ] = { skip: true };
if (mouseEvent.type === 'click') {
var path = Polymer.dom(mouseEvent).path;
for (var i = 0; i < path.length; i++) {
if (path[i] === POINTERSTATE.mouse.target) {
return;
}
}
mouseEvent.preventDefault();
mouseEvent.stopPropagation();
}
};
function setupTeardownMouseCanceller(setup) {
for (var i = 0, en; i < MOUSE_EVENTS.length; i++) {
en = MOUSE_EVENTS[i];
if (setup) {
document.addEventListener(en, mouseCanceller, true);
} else {
document.removeEventListener(en, mouseCanceller, true);
}
}
}
function ignoreMouse() {
if (IS_TOUCH_ONLY) {
return;
}
if (!POINTERSTATE.mouse.mouseIgnoreJob) {
setupTeardownMouseCanceller(true);
}
var unset = function () {
setupTeardownMouseCanceller();
POINTERSTATE.mouse.target = null;
POINTERSTATE.mouse.mouseIgnoreJob = null;
};
POINTERSTATE.mouse.mouseIgnoreJob = Polymer.Debounce(POINTERSTATE.mouse.mouseIgnoreJob, unset, MOUSE_TIMEOUT);
}
function hasLeftMouseButton(ev) {
var type = ev.type;
if (MOUSE_EVENTS.indexOf(type) === -1) {
return false;
}
if (type === 'mousemove') {
var buttons = ev.buttons === undefined ? 1 : ev.buttons;
if (ev instanceof window.MouseEvent && !MOUSE_HAS_BUTTONS) {
buttons = MOUSE_WHICH_TO_BUTTONS[ev.which] || 0;
}
return Boolean(buttons & 1);
} else {
var button = ev.button === undefined ? 0 : ev.button;
return button === 0;
}
}
function isSyntheticClick(ev) {
if (ev.type === 'click') {
if (ev.detail === 0) {
return true;
}
var t = Gestures.findOriginalTarget(ev);
var bcr = t.getBoundingClientRect();
var x = ev.pageX, y = ev.pageY;
return !(x >= bcr.left && x <= bcr.right && (y >= bcr.top && y <= bcr.bottom));
}
return false;
}
var POINTERSTATE = {
mouse: {
target: null,
mouseIgnoreJob: null
},
touch: {
x: 0,
y: 0,
id: -1,
scrollDecided: false
}
};
function firstTouchAction(ev) {
var path = Polymer.dom(ev).path;
var ta = 'auto';
for (var i = 0, n; i < path.length; i++) {
n = path[i];
if (n[TOUCH_ACTION]) {
ta = n[TOUCH_ACTION];
break;
}
}
return ta;
}
function trackDocument(stateObj, movefn, upfn) {
stateObj.movefn = movefn;
stateObj.upfn = upfn;
document.addEventListener('mousemove', movefn);
document.addEventListener('mouseup', upfn);
}
function untrackDocument(stateObj) {
document.removeEventListener('mousemove', stateObj.movefn);
document.removeEventListener('mouseup', stateObj.upfn);
stateObj.movefn = null;
stateObj.upfn = null;
}
var Gestures = {
gestures: {},
recognizers: [],
deepTargetFind: function (x, y) {
var node = document.elementFromPoint(x, y);
var next = node;
while (next && next.shadowRoot) {
next = next.shadowRoot.elementFromPoint(x, y);
if (next) {
node = next;
}
}
return node;
},
findOriginalTarget: function (ev) {
if (ev.path) {
return ev.path[0];
}
return ev.target;
},
handleNative: function (ev) {
var handled;
var type = ev.type;
var node = wrap(ev.currentTarget);
var gobj = node[GESTURE_KEY];
if (!gobj) {
return;
}
var gs = gobj[type];
if (!gs) {
return;
}
if (!ev[HANDLED_OBJ]) {
ev[HANDLED_OBJ] = {};
if (type.slice(0, 5) === 'touch') {
var t = ev.changedTouches[0];
if (type === 'touchstart') {
if (ev.touches.length === 1) {
POINTERSTATE.touch.id = t.identifier;
}
}
if (POINTERSTATE.touch.id !== t.identifier) {
return;
}
if (!HAS_NATIVE_TA) {
if (type === 'touchstart' || type === 'touchmove') {
Gestures.handleTouchAction(ev);
}
}
if (type === 'touchend') {
POINTERSTATE.mouse.target = Polymer.dom(ev).rootTarget;
ignoreMouse(true);
}
}
}
handled = ev[HANDLED_OBJ];
if (handled.skip) {
return;
}
var recognizers = Gestures.recognizers;
for (var i = 0, r; i < recognizers.length; i++) {
r = recognizers[i];
if (gs[r.name] && !handled[r.name]) {
if (r.flow && r.flow.start.indexOf(ev.type) > -1) {
if (r.reset) {
r.reset();
}
}
}
}
for (var i = 0, r; i < recognizers.length; i++) {
r = recognizers[i];
if (gs[r.name] && !handled[r.name]) {
handled[r.name] = true;
r[type](ev);
}
}
},
handleTouchAction: function (ev) {
var t = ev.changedTouches[0];
var type = ev.type;
if (type === 'touchstart') {
POINTERSTATE.touch.x = t.clientX;
POINTERSTATE.touch.y = t.clientY;
POINTERSTATE.touch.scrollDecided = false;
} else if (type === 'touchmove') {
if (POINTERSTATE.touch.scrollDecided) {
return;
}
POINTERSTATE.touch.scrollDecided = true;
var ta = firstTouchAction(ev);
var prevent = false;
var dx = Math.abs(POINTERSTATE.touch.x - t.clientX);
var dy = Math.abs(POINTERSTATE.touch.y - t.clientY);
if (!ev.cancelable) {
} else if (ta === 'none') {
prevent = true;
} else if (ta === 'pan-x') {
prevent = dy > dx;
} else if (ta === 'pan-y') {
prevent = dx > dy;
}
if (prevent) {
ev.preventDefault();
} else {
Gestures.prevent('track');
}
}
},
add: function (node, evType, handler) {
node = wrap(node);
var recognizer = this.gestures[evType];
var deps = recognizer.deps;
var name = recognizer.name;
var gobj = node[GESTURE_KEY];
if (!gobj) {
node[GESTURE_KEY] = gobj = {};
}
for (var i = 0, dep, gd; i < deps.length; i++) {
dep = deps[i];
if (IS_TOUCH_ONLY && MOUSE_EVENTS.indexOf(dep) > -1) {
continue;
}
gd = gobj[dep];
if (!gd) {
gobj[dep] = gd = { _count: 0 };
}
if (gd._count === 0) {
node.addEventListener(dep, this.handleNative);
}
gd[name] = (gd[name] || 0) + 1;
gd._count = (gd._count || 0) + 1;
}
node.addEventListener(evType, handler);
if (recognizer.touchAction) {
this.setTouchAction(node, recognizer.touchAction);
}
},
remove: function (node, evType, handler) {
node = wrap(node);
var recognizer = this.gestures[evType];
var deps = recognizer.deps;
var name = recognizer.name;
var gobj = node[GESTURE_KEY];
if (gobj) {
for (var i = 0, dep, gd; i < deps.length; i++) {
dep = deps[i];
gd = gobj[dep];
if (gd && gd[name]) {
gd[name] = (gd[name] || 1) - 1;
gd._count = (gd._count || 1) - 1;
if (gd._count === 0) {
node.removeEventListener(dep, this.handleNative);
}
}
}
}
node.removeEventListener(evType, handler);
},
register: function (recog) {
this.recognizers.push(recog);
for (var i = 0; i < recog.emits.length; i++) {
this.gestures[recog.emits[i]] = recog;
}
},
findRecognizerByEvent: function (evName) {
for (var i = 0, r; i < this.recognizers.length; i++) {
r = this.recognizers[i];
for (var j = 0, n; j < r.emits.length; j++) {
n = r.emits[j];
if (n === evName) {
return r;
}
}
}
return null;
},
setTouchAction: function (node, value) {
if (HAS_NATIVE_TA) {
node.style.touchAction = value;
}
node[TOUCH_ACTION] = value;
},
fire: function (target, type, detail) {
var ev = Polymer.Base.fire(type, detail, {
node: target,
bubbles: true,
cancelable: true
});
if (ev.defaultPrevented) {
var se = detail.sourceEvent;
if (se && se.preventDefault) {
se.preventDefault();
}
}
},
prevent: function (evName) {
var recognizer = this.findRecognizerByEvent(evName);
if (recognizer.info) {
recognizer.info.prevent = true;
}
}
};
Gestures.register({
name: 'downup',
deps: [
'mousedown',
'touchstart',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'mouseup',
'touchend'
]
},
emits: [
'down',
'up'
],
info: {
movefn: null,
upfn: null
},
reset: function () {
untrackDocument(this.info);
},
mousedown: function (e) {
if (!hasLeftMouseButton(e)) {
return;
}
var t = Gestures.findOriginalTarget(e);
var self = this;
var movefn = function movefn(e) {
if (!hasLeftMouseButton(e)) {
self.fire('up', t, e);
untrackDocument(self.info);
}
};
var upfn = function upfn(e) {
if (hasLeftMouseButton(e)) {
self.fire('up', t, e);
}
untrackDocument(self.info);
};
trackDocument(this.info, movefn, upfn);
this.fire('down', t, e);
},
touchstart: function (e) {
this.fire('down', Gestures.findOriginalTarget(e), e.changedTouches[0]);
},
touchend: function (e) {
this.fire('up', Gestures.findOriginalTarget(e), e.changedTouches[0]);
},
fire: function (type, target, event) {
Gestures.fire(target, type, {
x: event.clientX,
y: event.clientY,
sourceEvent: event,
prevent: function (e) {
return Gestures.prevent(e);
}
});
}
});
Gestures.register({
name: 'track',
touchAction: 'none',
deps: [
'mousedown',
'touchstart',
'touchmove',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'mouseup',
'touchend'
]
},
emits: ['track'],
info: {
x: 0,
y: 0,
state: 'start',
started: false,
moves: [],
addMove: function (move) {
if (this.moves.length > TRACK_LENGTH) {
this.moves.shift();
}
this.moves.push(move);
},
movefn: null,
upfn: null,
prevent: false
},
reset: function () {
this.info.state = 'start';
this.info.started = false;
this.info.moves = [];
this.info.x = 0;
this.info.y = 0;
this.info.prevent = false;
untrackDocument(this.info);
},
hasMovedEnough: function (x, y) {
if (this.info.prevent) {
return false;
}
if (this.info.started) {
return true;
}
var dx = Math.abs(this.info.x - x);
var dy = Math.abs(this.info.y - y);
return dx >= TRACK_DISTANCE || dy >= TRACK_DISTANCE;
},
mousedown: function (e) {
if (!hasLeftMouseButton(e)) {
return;
}
var t = Gestures.findOriginalTarget(e);
var self = this;
var movefn = function movefn(e) {
var x = e.clientX, y = e.clientY;
if (self.hasMovedEnough(x, y)) {
self.info.state = self.info.started ? e.type === 'mouseup' ? 'end' : 'track' : 'start';
self.info.addMove({
x: x,
y: y
});
if (!hasLeftMouseButton(e)) {
self.info.state = 'end';
untrackDocument(self.info);
}
self.fire(t, e);
self.info.started = true;
}
};
var upfn = function upfn(e) {
if (self.info.started) {
Gestures.prevent('tap');
movefn(e);
}
untrackDocument(self.info);
};
trackDocument(this.info, movefn, upfn);
this.info.x = e.clientX;
this.info.y = e.clientY;
},
touchstart: function (e) {
var ct = e.changedTouches[0];
this.info.x = ct.clientX;
this.info.y = ct.clientY;
},
touchmove: function (e) {
var t = Gestures.findOriginalTarget(e);
var ct = e.changedTouches[0];
var x = ct.clientX, y = ct.clientY;
if (this.hasMovedEnough(x, y)) {
this.info.addMove({
x: x,
y: y
});
this.fire(t, ct);
this.info.state = 'track';
this.info.started = true;
}
},
touchend: function (e) {
var t = Gestures.findOriginalTarget(e);
var ct = e.changedTouches[0];
if (this.info.started) {
Gestures.prevent('tap');
this.info.state = 'end';
this.info.addMove({
x: ct.clientX,
y: ct.clientY
});
this.fire(t, ct);
}
},
fire: function (target, touch) {
var secondlast = this.info.moves[this.info.moves.length - 2];
var lastmove = this.info.moves[this.info.moves.length - 1];
var dx = lastmove.x - this.info.x;
var dy = lastmove.y - this.info.y;
var ddx, ddy = 0;
if (secondlast) {
ddx = lastmove.x - secondlast.x;
ddy = lastmove.y - secondlast.y;
}
return Gestures.fire(target, 'track', {
state: this.info.state,
x: touch.clientX,
y: touch.clientY,
dx: dx,
dy: dy,
ddx: ddx,
ddy: ddy,
sourceEvent: touch,
hover: function () {
return Gestures.deepTargetFind(touch.clientX, touch.clientY);
}
});
}
});
Gestures.register({
name: 'tap',
deps: [
'mousedown',
'click',
'touchstart',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'click',
'touchend'
]
},
emits: ['tap'],
info: {
x: NaN,
y: NaN,
prevent: false
},
reset: function () {
this.info.x = NaN;
this.info.y = NaN;
this.info.prevent = false;
},
save: function (e) {
this.info.x = e.clientX;
this.info.y = e.clientY;
},
mousedown: function (e) {
if (hasLeftMouseButton(e)) {
this.save(e);
}
},
click: function (e) {
if (hasLeftMouseButton(e)) {
this.forward(e);
}
},
touchstart: function (e) {
this.save(e.changedTouches[0]);
},
touchend: function (e) {
this.forward(e.changedTouches[0]);
},
forward: function (e) {
var dx = Math.abs(e.clientX - this.info.x);
var dy = Math.abs(e.clientY - this.info.y);
var t = Gestures.findOriginalTarget(e);
if (isNaN(dx) || isNaN(dy) || dx <= TAP_DISTANCE && dy <= TAP_DISTANCE || isSyntheticClick(e)) {
if (!this.info.prevent) {
Gestures.fire(t, 'tap', {
x: e.clientX,
y: e.clientY,
sourceEvent: e
});
}
}
}
});
var DIRECTION_MAP = {
x: 'pan-x',
y: 'pan-y',
none: 'none',
all: 'auto'
};
Polymer.Base._addFeature({
_setupGestures: function () {
this.__polymerGestures = null;
},
_listen: function (node, eventName, handler) {
if (Gestures.gestures[eventName]) {
Gestures.add(node, eventName, handler);
} else {
node.addEventListener(eventName, handler);
}
},
_unlisten: function (node, eventName, handler) {
if (Gestures.gestures[eventName]) {
Gestures.remove(node, eventName, handler);
} else {
node.removeEventListener(eventName, handler);
}
},
setScrollDirection: function (direction, node) {
node = node || this;
Gestures.setTouchAction(node, DIRECTION_MAP[direction] || 'auto');
}
});
Polymer.Gestures = Gestures;
}());
Polymer.Base._addFeature({
$$: function (slctr) {
return Polymer.dom(this.root).querySelector(slctr);
},
toggleClass: function (name, bool, node) {
node = node || this;
if (arguments.length == 1) {
bool = !node.classList.contains(name);
}
if (bool) {
Polymer.dom(node).classList.add(name);
} else {
Polymer.dom(node).classList.remove(name);
}
},
toggleAttribute: function (name, bool, node) {
node = node || this;
if (arguments.length == 1) {
bool = !node.hasAttribute(name);
}
if (bool) {
Polymer.dom(node).setAttribute(name, '');
} else {
Polymer.dom(node).removeAttribute(name);
}
},
classFollows: function (name, toElement, fromElement) {
if (fromElement) {
Polymer.dom(fromElement).classList.remove(name);
}
if (toElement) {
Polymer.dom(toElement).classList.add(name);
}
},
attributeFollows: function (name, toElement, fromElement) {
if (fromElement) {
Polymer.dom(fromElement).removeAttribute(name);
}
if (toElement) {
Polymer.dom(toElement).setAttribute(name, '');
}
},
getEffectiveChildNodes: function () {
return Polymer.dom(this).getEffectiveChildNodes();
},
getEffectiveChildren: function () {
var list = Polymer.dom(this).getEffectiveChildNodes();
return list.filter(function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
},
getEffectiveTextContent: function () {
var cn = this.getEffectiveChildNodes();
var tc = [];
for (var i = 0, c; c = cn[i]; i++) {
if (c.nodeType !== Node.COMMENT_NODE) {
tc.push(Polymer.dom(c).textContent);
}
}
return tc.join('');
},
queryEffectiveChildren: function (slctr) {
var e$ = Polymer.dom(this).queryDistributedElements(slctr);
return e$ && e$[0];
},
queryAllEffectiveChildren: function (slctr) {
return Polymer.dom(this).queryDistributedElements(slctr);
},
getContentChildNodes: function (slctr) {
var content = Polymer.dom(this.root).querySelector(slctr || 'content');
return content ? Polymer.dom(content).getDistributedNodes() : [];
},
getContentChildren: function (slctr) {
return this.getContentChildNodes(slctr).filter(function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
},
fire: function (type, detail, options) {
options = options || Polymer.nob;
var node = options.node || this;
var detail = detail === null || detail === undefined ? {} : detail;
var bubbles = options.bubbles === undefined ? true : options.bubbles;
var cancelable = Boolean(options.cancelable);
var useCache = options._useCache;
var event = this._getEvent(type, bubbles, cancelable, useCache);
event.detail = detail;
if (useCache) {
this.__eventCache[type] = null;
}
node.dispatchEvent(event);
if (useCache) {
this.__eventCache[type] = event;
}
return event;
},
__eventCache: {},
_getEvent: function (type, bubbles, cancelable, useCache) {
var event = useCache && this.__eventCache[type];
if (!event || (event.bubbles != bubbles || event.cancelable != cancelable)) {
event = new Event(type, {
bubbles: Boolean(bubbles),
cancelable: cancelable
});
}
return event;
},
async: function (callback, waitTime) {
var self = this;
return Polymer.Async.run(function () {
callback.call(self);
}, waitTime);
},
cancelAsync: function (handle) {
Polymer.Async.cancel(handle);
},
arrayDelete: function (path, item) {
var index;
if (Array.isArray(path)) {
index = path.indexOf(item);
if (index >= 0) {
return path.splice(index, 1);
}
} else {
var arr = this._get(path);
index = arr.indexOf(item);
if (index >= 0) {
return this.splice(path, index, 1);
}
}
},
transform: function (transform, node) {
node = node || this;
node.style.webkitTransform = transform;
node.style.transform = transform;
},
translate3d: function (x, y, z, node) {
node = node || this;
this.transform('translate3d(' + x + ',' + y + ',' + z + ')', node);
},
importHref: function (href, onload, onerror, optAsync) {
var l = document.createElement('link');
l.rel = 'import';
l.href = href;
optAsync = Boolean(optAsync);
if (optAsync) {
l.setAttribute('async', '');
}
var self = this;
if (onload) {
l.onload = function (e) {
return onload.call(self, e);
};
}
if (onerror) {
l.onerror = function (e) {
return onerror.call(self, e);
};
}
document.head.appendChild(l);
return l;
},
create: function (tag, props) {
var elt = document.createElement(tag);
if (props) {
for (var n in props) {
elt[n] = props[n];
}
}
return elt;
},
isLightDescendant: function (node) {
return this !== node && this.contains(node) && Polymer.dom(this).getOwnerRoot() === Polymer.dom(node).getOwnerRoot();
},
isLocalDescendant: function (node) {
return this.root === Polymer.dom(node).getOwnerRoot();
}
});
Polymer.Bind = {
_dataEventCache: {},
prepareModel: function (model) {
Polymer.Base.mixin(model, this._modelApi);
},
_modelApi: {
_notifyChange: function (source, event, value) {
value = value === undefined ? this[source] : value;
event = event || Polymer.CaseMap.camelToDashCase(source) + '-changed';
this.fire(event, { value: value }, {
bubbles: false,
cancelable: false,
_useCache: true
});
},
_propertySetter: function (property, value, effects, fromAbove) {
var old = this.__data__[property];
if (old !== value && (old === old || value === value)) {
this.__data__[property] = value;
if (typeof value == 'object') {
this._clearPath(property);
}
if (this._propertyChanged) {
this._propertyChanged(property, value, old);
}
if (effects) {
this._effectEffects(property, value, effects, old, fromAbove);
}
}
return old;
},
__setProperty: function (property, value, quiet, node) {
node = node || this;
var effects = node._propertyEffects && node._propertyEffects[property];
if (effects) {
node._propertySetter(property, value, effects, quiet);
} else {
node[property] = value;
}
},
_effectEffects: function (property, value, effects, old, fromAbove) {
for (var i = 0, l = effects.length, fx; i < l && (fx = effects[i]); i++) {
fx.fn.call(this, property, value, fx.effect, old, fromAbove);
}
},
_clearPath: function (path) {
for (var prop in this.__data__) {
if (prop.indexOf(path + '.') === 0) {
this.__data__[prop] = undefined;
}
}
}
},
ensurePropertyEffects: function (model, property) {
if (!model._propertyEffects) {
model._propertyEffects = {};
}
var fx = model._propertyEffects[property];
if (!fx) {
fx = model._propertyEffects[property] = [];
}
return fx;
},
addPropertyEffect: function (model, property, kind, effect) {
var fx = this.ensurePropertyEffects(model, property);
var propEffect = {
kind: kind,
effect: effect,
fn: Polymer.Bind['_' + kind + 'Effect']
};
fx.push(propEffect);
return propEffect;
},
createBindings: function (model) {
var fx$ = model._propertyEffects;
if (fx$) {
for (var n in fx$) {
var fx = fx$[n];
fx.sort(this._sortPropertyEffects);
this._createAccessors(model, n, fx);
}
}
},
_sortPropertyEffects: function () {
var EFFECT_ORDER = {
'compute': 0,
'annotation': 1,
'computedAnnotation': 2,
'reflect': 3,
'notify': 4,
'observer': 5,
'complexObserver': 6,
'function': 7
};
return function (a, b) {
return EFFECT_ORDER[a.kind] - EFFECT_ORDER[b.kind];
};
}(),
_createAccessors: function (model, property, effects) {
var defun = {
get: function () {
return this.__data__[property];
}
};
var setter = function (value) {
this._propertySetter(property, value, effects);
};
var info = model.getPropertyInfo && model.getPropertyInfo(property);
if (info && info.readOnly) {
if (!info.computed) {
model['_set' + this.upper(property)] = setter;
}
} else {
defun.set = setter;
}
Object.defineProperty(model, property, defun);
},
upper: function (name) {
return name[0].toUpperCase() + name.substring(1);
},
_addAnnotatedListener: function (model, index, property, path, event) {
if (!model._bindListeners) {
model._bindListeners = [];
}
var fn = this._notedListenerFactory(property, path, this._isStructured(path));
var eventName = event || Polymer.CaseMap.camelToDashCase(property) + '-changed';
model._bindListeners.push({
index: index,
property: property,
path: path,
changedFn: fn,
event: eventName
});
},
_isStructured: function (path) {
return path.indexOf('.') > 0;
},
_isEventBogus: function (e, target) {
return e.path && e.path[0] !== target;
},
_notedListenerFactory: function (property, path, isStructured) {
return function (target, value, targetPath) {
if (targetPath) {
this._notifyPath(this._fixPath(path, property, targetPath), value);
} else {
value = target[property];
if (!isStructured) {
this[path] = value;
} else {
if (this.__data__[path] != value) {
this.set(path, value);
}
}
}
};
},
prepareInstance: function (inst) {
inst.__data__ = Object.create(null);
},
setupBindListeners: function (inst) {
var b$ = inst._bindListeners;
for (var i = 0, l = b$.length, info; i < l && (info = b$[i]); i++) {
var node = inst._nodes[info.index];
this._addNotifyListener(node, inst, info.event, info.changedFn);
}
;
},
_addNotifyListener: function (element, context, event, changedFn) {
element.addEventListener(event, function (e) {
return context._notifyListener(changedFn, e);
});
}
};
Polymer.Base.extend(Polymer.Bind, {
_shouldAddListener: function (effect) {
return effect.name && effect.kind != 'attribute' && effect.kind != 'text' && !effect.isCompound && effect.parts[0].mode === '{' && !effect.parts[0].negate;
},
_annotationEffect: function (source, value, effect) {
if (source != effect.value) {
value = this._get(effect.value);
this.__data__[effect.value] = value;
}
var calc = effect.negate ? !value : value;
if (!effect.customEvent || this._nodes[effect.index][effect.name] !== calc) {
return this._applyEffectValue(effect, calc);
}
},
_reflectEffect: function (source, value, effect) {
this.reflectPropertyToAttribute(source, effect.attribute, value);
},
_notifyEffect: function (source, value, effect, old, fromAbove) {
if (!fromAbove) {
this._notifyChange(source, effect.event, value);
}
},
_functionEffect: function (source, value, fn, old, fromAbove) {
fn.call(this, source, value, old, fromAbove);
},
_observerEffect: function (source, value, effect, old) {
var fn = this[effect.method];
if (fn) {
fn.call(this, value, old);
} else {
this._warn(this._logf('_observerEffect', 'observer method `' + effect.method + '` not defined'));
}
},
_complexObserverEffect: function (source, value, effect) {
var fn = this[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
fn.apply(this, args);
}
} else {
this._warn(this._logf('_complexObserverEffect', 'observer method `' + effect.method + '` not defined'));
}
},
_computeEffect: function (source, value, effect) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
var fn = this[effect.method];
if (fn) {
this.__setProperty(effect.name, fn.apply(this, args));
} else {
this._warn(this._logf('_computeEffect', 'compute method `' + effect.method + '` not defined'));
}
}
},
_annotatedComputationEffect: function (source, value, effect) {
var computedHost = this._rootDataHost || this;
var fn = computedHost[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
var computedvalue = fn.apply(computedHost, args);
if (effect.negate) {
computedvalue = !computedvalue;
}
this._applyEffectValue(effect, computedvalue);
}
} else {
computedHost._warn(computedHost._logf('_annotatedComputationEffect', 'compute method `' + effect.method + '` not defined'));
}
},
_marshalArgs: function (model, effect, path, value) {
var values = [];
var args = effect.args;
for (var i = 0, l = args.length; i < l; i++) {
var arg = args[i];
var name = arg.name;
var v;
if (arg.literal) {
v = arg.value;
} else if (arg.structured) {
v = Polymer.Base._get(name, model);
} else {
v = model[name];
}
if (args.length > 1 && v === undefined) {
return;
}
if (arg.wildcard) {
var baseChanged = name.indexOf(path + '.') === 0;
var matches = effect.trigger.name.indexOf(name) === 0 && !baseChanged;
values[i] = {
path: matches ? path : name,
value: matches ? value : v,
base: v
};
} else {
values[i] = v;
}
}
return values;
}
});
Polymer.Base._addFeature({
_addPropertyEffect: function (property, kind, effect) {
var prop = Polymer.Bind.addPropertyEffect(this, property, kind, effect);
prop.pathFn = this['_' + prop.kind + 'PathEffect'];
},
_prepEffects: function () {
Polymer.Bind.prepareModel(this);
this._addAnnotationEffects(this._notes);
},
_prepBindings: function () {
Polymer.Bind.createBindings(this);
},
_addPropertyEffects: function (properties) {
if (properties) {
for (var p in properties) {
var prop = properties[p];
if (prop.observer) {
this._addObserverEffect(p, prop.observer);
}
if (prop.computed) {
prop.readOnly = true;
this._addComputedEffect(p, prop.computed);
}
if (prop.notify) {
this._addPropertyEffect(p, 'notify', { event: Polymer.CaseMap.camelToDashCase(p) + '-changed' });
}
if (prop.reflectToAttribute) {
this._addPropertyEffect(p, 'reflect', { attribute: Polymer.CaseMap.camelToDashCase(p) });
}
if (prop.readOnly) {
Polymer.Bind.ensurePropertyEffects(this, p);
}
}
}
},
_addComputedEffect: function (name, expression) {
var sig = this._parseMethod(expression);
for (var i = 0, arg; i < sig.args.length && (arg = sig.args[i]); i++) {
this._addPropertyEffect(arg.model, 'compute', {
method: sig.method,
args: sig.args,
trigger: arg,
name: name
});
}
},
_addObserverEffect: function (property, observer) {
this._addPropertyEffect(property, 'observer', {
method: observer,
property: property
});
},
_addComplexObserverEffects: function (observers) {
if (observers) {
for (var i = 0, o; i < observers.length && (o = observers[i]); i++) {
this._addComplexObserverEffect(o);
}
}
},
_addComplexObserverEffect: function (observer) {
var sig = this._parseMethod(observer);
if (!sig) {
throw new Error('Malformed observer expression \'' + observer + '\'');
}
for (var i = 0, arg; i < sig.args.length && (arg = sig.args[i]); i++) {
this._addPropertyEffect(arg.model, 'complexObserver', {
method: sig.method,
args: sig.args,
trigger: arg
});
}
},
_addAnnotationEffects: function (notes) {
for (var i = 0, note; i < notes.length && (note = notes[i]); i++) {
var b$ = note.bindings;
for (var j = 0, binding; j < b$.length && (binding = b$[j]); j++) {
this._addAnnotationEffect(binding, i);
}
}
},
_addAnnotationEffect: function (note, index) {
if (Polymer.Bind._shouldAddListener(note)) {
Polymer.Bind._addAnnotatedListener(this, index, note.name, note.parts[0].value, note.parts[0].event);
}
for (var i = 0; i < note.parts.length; i++) {
var part = note.parts[i];
if (part.signature) {
this._addAnnotatedComputationEffect(note, part, index);
} else if (!part.literal) {
this._addPropertyEffect(part.model, 'annotation', {
kind: note.kind,
index: index,
name: note.name,
value: part.value,
isCompound: note.isCompound,
compoundIndex: part.compoundIndex,
event: part.event,
customEvent: part.customEvent,
negate: part.negate
});
}
}
},
_addAnnotatedComputationEffect: function (note, part, index) {
var sig = part.signature;
if (sig.static) {
this.__addAnnotatedComputationEffect('__static__', index, note, part, null);
} else {
for (var i = 0, arg; i < sig.args.length && (arg = sig.args[i]); i++) {
if (!arg.literal) {
this.__addAnnotatedComputationEffect(arg.model, index, note, part, arg);
}
}
}
},
__addAnnotatedComputationEffect: function (property, index, note, part, trigger) {
this._addPropertyEffect(property, 'annotatedComputation', {
index: index,
isCompound: note.isCompound,
compoundIndex: part.compoundIndex,
kind: note.kind,
name: note.name,
negate: part.negate,
method: part.signature.method,
args: part.signature.args,
trigger: trigger
});
},
_parseMethod: function (expression) {
var m = expression.match(/([^\s]+?)\((.*)\)/);
if (m) {
var sig = {
method: m[1],
static: true
};
if (m[2].trim()) {
var args = m[2].replace(/\\,/g, '&comma;').split(',');
return this._parseArgs(args, sig);
} else {
sig.args = Polymer.nar;
return sig;
}
}
},
_parseArgs: function (argList, sig) {
sig.args = argList.map(function (rawArg) {
var arg = this._parseArg(rawArg);
if (!arg.literal) {
sig.static = false;
}
return arg;
}, this);
return sig;
},
_parseArg: function (rawArg) {
var arg = rawArg.trim().replace(/&comma;/g, ',').replace(/\\(.)/g, '$1');
var a = { name: arg };
var fc = arg[0];
if (fc === '-') {
fc = arg[1];
}
if (fc >= '0' && fc <= '9') {
fc = '#';
}
switch (fc) {
case '\'':
case '"':
a.value = arg.slice(1, -1);
a.literal = true;
break;
case '#':
a.value = Number(arg);
a.literal = true;
break;
}
if (!a.literal) {
a.model = this._modelForPath(arg);
a.structured = arg.indexOf('.') > 0;
if (a.structured) {
a.wildcard = arg.slice(-2) == '.*';
if (a.wildcard) {
a.name = arg.slice(0, -2);
}
}
}
return a;
},
_marshalInstanceEffects: function () {
Polymer.Bind.prepareInstance(this);
if (this._bindListeners) {
Polymer.Bind.setupBindListeners(this);
}
},
_applyEffectValue: function (info, value) {
var node = this._nodes[info.index];
var property = info.name;
if (info.isCompound) {
var storage = node.__compoundStorage__[property];
storage[info.compoundIndex] = value;
value = storage.join('');
}
if (info.kind == 'attribute') {
this.serializeValueToAttribute(value, property, node);
} else {
if (property === 'className') {
value = this._scopeElementClass(node, value);
}
if (property === 'textContent' || node.localName == 'input' && property == 'value') {
value = value == undefined ? '' : value;
}
var pinfo;
if (!node._propertyInfo || !(pinfo = node._propertyInfo[property]) || !pinfo.readOnly) {
this.__setProperty(property, value, false, node);
}
}
},
_executeStaticEffects: function () {
if (this._propertyEffects && this._propertyEffects.__static__) {
this._effectEffects('__static__', null, this._propertyEffects.__static__);
}
}
});
Polymer.Base._addFeature({
_setupConfigure: function (initialConfig) {
this._config = {};
this._handlers = [];
this._aboveConfig = null;
if (initialConfig) {
for (var i in initialConfig) {
if (initialConfig[i] !== undefined) {
this._config[i] = initialConfig[i];
}
}
}
},
_marshalAttributes: function () {
this._takeAttributesToModel(this._config);
},
_attributeChangedImpl: function (name) {
var model = this._clientsReadied ? this : this._config;
this._setAttributeToProperty(model, name);
},
_configValue: function (name, value) {
var info = this._propertyInfo[name];
if (!info || !info.readOnly) {
this._config[name] = value;
}
},
_beforeClientsReady: function () {
this._configure();
},
_configure: function () {
this._configureAnnotationReferences();
this._aboveConfig = this.mixin({}, this._config);
var config = {};
for (var i = 0; i < this.behaviors.length; i++) {
this._configureProperties(this.behaviors[i].properties, config);
}
this._configureProperties(this.properties, config);
this.mixin(config, this._aboveConfig);
this._config = config;
if (this._clients && this._clients.length) {
this._distributeConfig(this._config);
}
},
_configureProperties: function (properties, config) {
for (var i in properties) {
var c = properties[i];
if (c.value !== undefined) {
var value = c.value;
if (typeof value == 'function') {
value = value.call(this, this._config);
}
config[i] = value;
}
}
},
_distributeConfig: function (config) {
var fx$ = this._propertyEffects;
if (fx$) {
for (var p in config) {
var fx = fx$[p];
if (fx) {
for (var i = 0, l = fx.length, x; i < l && (x = fx[i]); i++) {
if (x.kind === 'annotation' && !x.isCompound) {
var node = this._nodes[x.effect.index];
if (node._configValue) {
var value = p === x.effect.value ? config[p] : this._get(x.effect.value, config);
node._configValue(x.effect.name, value);
}
}
}
}
}
}
},
_afterClientsReady: function () {
this._executeStaticEffects();
this._applyConfig(this._config, this._aboveConfig);
this._flushHandlers();
},
_applyConfig: function (config, aboveConfig) {
for (var n in config) {
if (this[n] === undefined) {
this.__setProperty(n, config[n], n in aboveConfig);
}
}
},
_notifyListener: function (fn, e) {
if (!Polymer.Bind._isEventBogus(e, e.target)) {
var value, path;
if (e.detail) {
value = e.detail.value;
path = e.detail.path;
}
if (!this._clientsReadied) {
this._queueHandler([
fn,
e.target,
value,
path
]);
} else {
return fn.call(this, e.target, value, path);
}
}
},
_queueHandler: function (args) {
this._handlers.push(args);
},
_flushHandlers: function () {
var h$ = this._handlers;
for (var i = 0, l = h$.length, h; i < l && (h = h$[i]); i++) {
h[0].call(this, h[1], h[2], h[3]);
}
this._handlers = [];
}
});
(function () {
'use strict';
Polymer.Base._addFeature({
notifyPath: function (path, value, fromAbove) {
var info = {};
this._get(path, this, info);
if (info.path) {
this._notifyPath(info.path, value, fromAbove);
}
},
_notifyPath: function (path, value, fromAbove) {
var old = this._propertySetter(path, value);
if (old !== value && (old === old || value === value)) {
this._pathEffector(path, value);
if (!fromAbove) {
this._notifyPathUp(path, value);
}
return true;
}
},
_getPathParts: function (path) {
if (Array.isArray(path)) {
var parts = [];
for (var i = 0; i < path.length; i++) {
var args = path[i].toString().split('.');
for (var j = 0; j < args.length; j++) {
parts.push(args[j]);
}
}
return parts;
} else {
return path.toString().split('.');
}
},
set: function (path, value, root) {
var prop = root || this;
var parts = this._getPathParts(path);
var array;
var last = parts[parts.length - 1];
if (parts.length > 1) {
for (var i = 0; i < parts.length - 1; i++) {
var part = parts[i];
if (array && part[0] == '#') {
prop = Polymer.Collection.get(array).getItem(part);
} else {
prop = prop[part];
if (array && parseInt(part, 10) == part) {
parts[i] = Polymer.Collection.get(array).getKey(prop);
}
}
if (!prop) {
return;
}
array = Array.isArray(prop) ? prop : null;
}
if (array) {
var coll = Polymer.Collection.get(array);
if (last[0] == '#') {
var key = last;
var old = coll.getItem(key);
last = array.indexOf(old);
coll.setItem(key, value);
} else if (parseInt(last, 10) == last) {
var old = prop[last];
var key = coll.getKey(old);
parts[i] = key;
coll.setItem(key, value);
}
}
prop[last] = value;
if (!root) {
this._notifyPath(parts.join('.'), value);
}
} else {
prop[path] = value;
}
},
get: function (path, root) {
return this._get(path, root);
},
_get: function (path, root, info) {
var prop = root || this;
var parts = this._getPathParts(path);
var array;
for (var i = 0; i < parts.length; i++) {
if (!prop) {
return;
}
var part = parts[i];
if (array && part[0] == '#') {
prop = Polymer.Collection.get(array).getItem(part);
} else {
prop = prop[part];
if (info && array && parseInt(part, 10) == part) {
parts[i] = Polymer.Collection.get(array).getKey(prop);
}
}
array = Array.isArray(prop) ? prop : null;
}
if (info) {
info.path = parts.join('.');
}
return prop;
},
_pathEffector: function (path, value) {
var model = this._modelForPath(path);
var fx$ = this._propertyEffects && this._propertyEffects[model];
if (fx$) {
for (var i = 0, fx; i < fx$.length && (fx = fx$[i]); i++) {
var fxFn = fx.pathFn;
if (fxFn) {
fxFn.call(this, path, value, fx.effect);
}
}
}
if (this._boundPaths) {
this._notifyBoundPaths(path, value);
}
},
_annotationPathEffect: function (path, value, effect) {
if (effect.value === path || effect.value.indexOf(path + '.') === 0) {
Polymer.Bind._annotationEffect.call(this, path, value, effect);
} else if (path.indexOf(effect.value + '.') === 0 && !effect.negate) {
var node = this._nodes[effect.index];
if (node && node._notifyPath) {
var p = this._fixPath(effect.name, effect.value, path);
node._notifyPath(p, value, true);
}
}
},
_complexObserverPathEffect: function (path, value, effect) {
if (this._pathMatchesEffect(path, effect)) {
Polymer.Bind._complexObserverEffect.call(this, path, value, effect);
}
},
_computePathEffect: function (path, value, effect) {
if (this._pathMatchesEffect(path, effect)) {
Polymer.Bind._computeEffect.call(this, path, value, effect);
}
},
_annotatedComputationPathEffect: function (path, value, effect) {
if (this._pathMatchesEffect(path, effect)) {
Polymer.Bind._annotatedComputationEffect.call(this, path, value, effect);
}
},
_pathMatchesEffect: function (path, effect) {
var effectArg = effect.trigger.name;
return effectArg == path || effectArg.indexOf(path + '.') === 0 || effect.trigger.wildcard && path.indexOf(effectArg) === 0;
},
linkPaths: function (to, from) {
this._boundPaths = this._boundPaths || {};
if (from) {
this._boundPaths[to] = from;
} else {
this.unlinkPaths(to);
}
},
unlinkPaths: function (path) {
if (this._boundPaths) {
delete this._boundPaths[path];
}
},
_notifyBoundPaths: function (path, value) {
for (var a in this._boundPaths) {
var b = this._boundPaths[a];
if (path.indexOf(a + '.') == 0) {
this._notifyPath(this._fixPath(b, a, path), value);
} else if (path.indexOf(b + '.') == 0) {
this._notifyPath(this._fixPath(a, b, path), value);
}
}
},
_fixPath: function (property, root, path) {
return property + path.slice(root.length);
},
_notifyPathUp: function (path, value) {
var rootName = this._modelForPath(path);
var dashCaseName = Polymer.CaseMap.camelToDashCase(rootName);
var eventName = dashCaseName + this._EVENT_CHANGED;
this.fire(eventName, {
path: path,
value: value
}, {
bubbles: false,
_useCache: true
});
},
_modelForPath: function (path) {
var dot = path.indexOf('.');
return dot < 0 ? path : path.slice(0, dot);
},
_EVENT_CHANGED: '-changed',
notifySplices: function (path, splices) {
var info = {};
var array = this._get(path, this, info);
this._notifySplices(array, info.path, splices);
},
_notifySplices: function (array, path, splices) {
var change = {
keySplices: Polymer.Collection.applySplices(array, splices),
indexSplices: splices
};
if (!array.hasOwnProperty('splices')) {
Object.defineProperty(array, 'splices', {
configurable: true,
writable: true
});
}
array.splices = change;
this._notifyPath(path + '.splices', change);
this._notifyPath(path + '.length', array.length);
change.keySplices = null;
change.indexSplices = null;
},
_notifySplice: function (array, path, index, added, removed) {
this._notifySplices(array, path, [{
index: index,
addedCount: added,
removed: removed,
object: array,
type: 'splice'
}]);
},
push: function (path) {
var info = {};
var array = this._get(path, this, info);
var args = Array.prototype.slice.call(arguments, 1);
var len = array.length;
var ret = array.push.apply(array, args);
if (args.length) {
this._notifySplice(array, info.path, len, args.length, []);
}
return ret;
},
pop: function (path) {
var info = {};
var array = this._get(path, this, info);
var hadLength = Boolean(array.length);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.pop.apply(array, args);
if (hadLength) {
this._notifySplice(array, info.path, array.length, 0, [ret]);
}
return ret;
},
splice: function (path, start, deleteCount) {
var info = {};
var array = this._get(path, this, info);
if (start < 0) {
start = array.length - Math.floor(-start);
} else {
start = Math.floor(start);
}
if (!start) {
start = 0;
}
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.splice.apply(array, args);
var addedCount = Math.max(args.length - 2, 0);
if (addedCount || ret.length) {
this._notifySplice(array, info.path, start, addedCount, ret);
}
return ret;
},
shift: function (path) {
var info = {};
var array = this._get(path, this, info);
var hadLength = Boolean(array.length);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.shift.apply(array, args);
if (hadLength) {
this._notifySplice(array, info.path, 0, 0, [ret]);
}
return ret;
},
unshift: function (path) {
var info = {};
var array = this._get(path, this, info);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.unshift.apply(array, args);
if (args.length) {
this._notifySplice(array, info.path, 0, args.length, []);
}
return ret;
},
prepareModelNotifyPath: function (model) {
this.mixin(model, {
fire: Polymer.Base.fire,
_getEvent: Polymer.Base._getEvent,
__eventCache: Polymer.Base.__eventCache,
notifyPath: Polymer.Base.notifyPath,
_get: Polymer.Base._get,
_EVENT_CHANGED: Polymer.Base._EVENT_CHANGED,
_notifyPath: Polymer.Base._notifyPath,
_notifyPathUp: Polymer.Base._notifyPathUp,
_pathEffector: Polymer.Base._pathEffector,
_annotationPathEffect: Polymer.Base._annotationPathEffect,
_complexObserverPathEffect: Polymer.Base._complexObserverPathEffect,
_annotatedComputationPathEffect: Polymer.Base._annotatedComputationPathEffect,
_computePathEffect: Polymer.Base._computePathEffect,
_modelForPath: Polymer.Base._modelForPath,
_pathMatchesEffect: Polymer.Base._pathMatchesEffect,
_notifyBoundPaths: Polymer.Base._notifyBoundPaths,
_getPathParts: Polymer.Base._getPathParts
});
}
});
}());
Polymer.Base._addFeature({
resolveUrl: function (url) {
var module = Polymer.DomModule.import(this.is);
var root = '';
if (module) {
var assetPath = module.getAttribute('assetpath') || '';
root = Polymer.ResolveUrl.resolveUrl(assetPath, module.ownerDocument.baseURI);
}
return Polymer.ResolveUrl.resolveUrl(url, root);
}
});
Polymer.CssParse = function () {
return {
parse: function (text) {
text = this._clean(text);
return this._parseCss(this._lex(text), text);
},
_clean: function (cssText) {
return cssText.replace(this._rx.comments, '').replace(this._rx.port, '');
},
_lex: function (text) {
var root = {
start: 0,
end: text.length
};
var n = root;
for (var i = 0, l = text.length; i < l; i++) {
switch (text[i]) {
case this.OPEN_BRACE:
if (!n.rules) {
n.rules = [];
}
var p = n;
var previous = p.rules[p.rules.length - 1];
n = {
start: i + 1,
parent: p,
previous: previous
};
p.rules.push(n);
break;
case this.CLOSE_BRACE:
n.end = i + 1;
n = n.parent || root;
break;
}
}
return root;
},
_parseCss: function (node, text) {
var t = text.substring(node.start, node.end - 1);
node.parsedCssText = node.cssText = t.trim();
if (node.parent) {
var ss = node.previous ? node.previous.end : node.parent.start;
t = text.substring(ss, node.start - 1);
t = this._expandUnicodeEscapes(t);
t = t.replace(this._rx.multipleSpaces, ' ');
t = t.substring(t.lastIndexOf(';') + 1);
var s = node.parsedSelector = node.selector = t.trim();
node.atRule = s.indexOf(this.AT_START) === 0;
if (node.atRule) {
if (s.indexOf(this.MEDIA_START) === 0) {
node.type = this.types.MEDIA_RULE;
} else if (s.match(this._rx.keyframesRule)) {
node.type = this.types.KEYFRAMES_RULE;
}
} else {
if (s.indexOf(this.VAR_START) === 0) {
node.type = this.types.MIXIN_RULE;
} else {
node.type = this.types.STYLE_RULE;
}
}
}
var r$ = node.rules;
if (r$) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
this._parseCss(r, text);
}
}
return node;
},
_expandUnicodeEscapes: function (s) {
return s.replace(/\\([0-9a-f]{1,6})\s/gi, function () {
var code = arguments[1], repeat = 6 - code.length;
while (repeat--) {
code = '0' + code;
}
return '\\' + code;
});
},
stringify: function (node, preserveProperties, text) {
text = text || '';
var cssText = '';
if (node.cssText || node.rules) {
var r$ = node.rules;
if (r$ && (preserveProperties || !this._hasMixinRules(r$))) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
cssText = this.stringify(r, preserveProperties, cssText);
}
} else {
cssText = preserveProperties ? node.cssText : this.removeCustomProps(node.cssText);
cssText = cssText.trim();
if (cssText) {
cssText = '  ' + cssText + '\n';
}
}
}
if (cssText) {
if (node.selector) {
text += node.selector + ' ' + this.OPEN_BRACE + '\n';
}
text += cssText;
if (node.selector) {
text += this.CLOSE_BRACE + '\n\n';
}
}
return text;
},
_hasMixinRules: function (rules) {
return rules[0].selector.indexOf(this.VAR_START) === 0;
},
removeCustomProps: function (cssText) {
cssText = this.removeCustomPropAssignment(cssText);
return this.removeCustomPropApply(cssText);
},
removeCustomPropAssignment: function (cssText) {
return cssText.replace(this._rx.customProp, '').replace(this._rx.mixinProp, '');
},
removeCustomPropApply: function (cssText) {
return cssText.replace(this._rx.mixinApply, '').replace(this._rx.varApply, '');
},
types: {
STYLE_RULE: 1,
KEYFRAMES_RULE: 7,
MEDIA_RULE: 4,
MIXIN_RULE: 1000
},
OPEN_BRACE: '{',
CLOSE_BRACE: '}',
_rx: {
comments: /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//gim,
port: /@import[^;]*;/gim,
customProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim,
mixinProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim,
mixinApply: /@apply[\s]*\([^)]*?\)[\s]*(?:[;\n]|$)?/gim,
varApply: /[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim,
keyframesRule: /^@[^\s]*keyframes/,
multipleSpaces: /\s+/g
},
VAR_START: '--',
MEDIA_START: '@media',
AT_START: '@'
};
}();
Polymer.StyleUtil = function () {
return {
MODULE_STYLES_SELECTOR: 'style, link[rel=import][type~=css], template',
INCLUDE_ATTR: 'include',
toCssText: function (rules, callback, preserveProperties) {
if (typeof rules === 'string') {
rules = this.parser.parse(rules);
}
if (callback) {
this.forEachStyleRule(rules, callback);
}
return this.parser.stringify(rules, preserveProperties);
},
forRulesInStyles: function (styles, callback) {
if (styles) {
for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
this.forEachStyleRule(this.rulesForStyle(s), callback);
}
}
},
rulesForStyle: function (style) {
if (!style.__cssRules && style.textContent) {
style.__cssRules = this.parser.parse(style.textContent);
}
return style.__cssRules;
},
forEachStyleRule: function (node, callback) {
if (!node) {
return;
}
var skipRules = false;
if (node.type === this.ruleTypes.STYLE_RULE) {
callback(node);
} else if (node.type === this.ruleTypes.KEYFRAMES_RULE || node.type === this.ruleTypes.MIXIN_RULE) {
skipRules = true;
}
var r$ = node.rules;
if (r$ && !skipRules) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
this.forEachStyleRule(r, callback);
}
}
},
applyCss: function (cssText, moniker, target, afterNode) {
var style = document.createElement('style');
if (moniker) {
style.setAttribute('scope', moniker);
}
style.textContent = cssText;
target = target || document.head;
if (!afterNode) {
var n$ = target.querySelectorAll('style[scope]');
afterNode = n$[n$.length - 1];
}
target.insertBefore(style, afterNode && afterNode.nextSibling || target.firstChild);
return style;
},
cssFromModules: function (moduleIds, warnIfNotFound) {
var modules = moduleIds.trim().split(' ');
var cssText = '';
for (var i = 0; i < modules.length; i++) {
cssText += this.cssFromModule(modules[i], warnIfNotFound);
}
return cssText;
},
cssFromModule: function (moduleId, warnIfNotFound) {
var m = Polymer.DomModule.import(moduleId);
if (m && !m._cssText) {
m._cssText = this.cssFromElement(m);
}
if (!m && warnIfNotFound) {
console.warn('Could not find style data in module named', moduleId);
}
return m && m._cssText || '';
},
cssFromElement: function (element) {
var cssText = '';
var content = element.content || element;
var e$ = Polymer.TreeApi.arrayCopy(content.querySelectorAll(this.MODULE_STYLES_SELECTOR));
for (var i = 0, e; i < e$.length; i++) {
e = e$[i];
if (e.localName === 'template') {
cssText += this.cssFromElement(e);
} else {
if (e.localName === 'style') {
var include = e.getAttribute(this.INCLUDE_ATTR);
if (include) {
cssText += this.cssFromModules(include, true);
}
e = e.__appliedElement || e;
e.parentNode.removeChild(e);
cssText += this.resolveCss(e.textContent, element.ownerDocument);
} else if (e.import && e.import.body) {
cssText += this.resolveCss(e.import.body.textContent, e.import);
}
}
}
return cssText;
},
resolveCss: Polymer.ResolveUrl.resolveCss,
parser: Polymer.CssParse,
ruleTypes: Polymer.CssParse.types
};
}();
Polymer.StyleTransformer = function () {
var nativeShadow = Polymer.Settings.useNativeShadow;
var styleUtil = Polymer.StyleUtil;
var api = {
dom: function (node, scope, useAttr, shouldRemoveScope) {
this._transformDom(node, scope || '', useAttr, shouldRemoveScope);
},
_transformDom: function (node, selector, useAttr, shouldRemoveScope) {
if (node.setAttribute) {
this.element(node, selector, useAttr, shouldRemoveScope);
}
var c$ = Polymer.dom(node).childNodes;
for (var i = 0; i < c$.length; i++) {
this._transformDom(c$[i], selector, useAttr, shouldRemoveScope);
}
},
element: function (element, scope, useAttr, shouldRemoveScope) {
if (useAttr) {
if (shouldRemoveScope) {
element.removeAttribute(SCOPE_NAME);
} else {
element.setAttribute(SCOPE_NAME, scope);
}
} else {
if (scope) {
if (element.classList) {
if (shouldRemoveScope) {
element.classList.remove(SCOPE_NAME);
element.classList.remove(scope);
} else {
element.classList.add(SCOPE_NAME);
element.classList.add(scope);
}
} else if (element.getAttribute) {
var c = element.getAttribute(CLASS);
if (shouldRemoveScope) {
if (c) {
element.setAttribute(CLASS, c.replace(SCOPE_NAME, '').replace(scope, ''));
}
} else {
element.setAttribute(CLASS, (c ? c + ' ' : '') + SCOPE_NAME + ' ' + scope);
}
}
}
}
},
elementStyles: function (element, callback) {
var styles = element._styles;
var cssText = '';
for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
var rules = styleUtil.rulesForStyle(s);
cssText += nativeShadow ? styleUtil.toCssText(rules, callback) : this.css(rules, element.is, element.extends, callback, element._scopeCssViaAttr) + '\n\n';
}
return cssText.trim();
},
css: function (rules, scope, ext, callback, useAttr) {
var hostScope = this._calcHostScope(scope, ext);
scope = this._calcElementScope(scope, useAttr);
var self = this;
return styleUtil.toCssText(rules, function (rule) {
if (!rule.isScoped) {
self.rule(rule, scope, hostScope);
rule.isScoped = true;
}
if (callback) {
callback(rule, scope, hostScope);
}
});
},
_calcElementScope: function (scope, useAttr) {
if (scope) {
return useAttr ? CSS_ATTR_PREFIX + scope + CSS_ATTR_SUFFIX : CSS_CLASS_PREFIX + scope;
} else {
return '';
}
},
_calcHostScope: function (scope, ext) {
return ext ? '[is=' + scope + ']' : scope;
},
rule: function (rule, scope, hostScope) {
this._transformRule(rule, this._transformComplexSelector, scope, hostScope);
},
_transformRule: function (rule, transformer, scope, hostScope) {
var p$ = rule.selector.split(COMPLEX_SELECTOR_SEP);
for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
p$[i] = transformer.call(this, p, scope, hostScope);
}
rule.selector = rule.transformedSelector = p$.join(COMPLEX_SELECTOR_SEP);
},
_transformComplexSelector: function (selector, scope, hostScope) {
var stop = false;
var hostContext = false;
var self = this;
selector = selector.replace(SIMPLE_SELECTOR_SEP, function (m, c, s) {
if (!stop) {
var info = self._transformCompoundSelector(s, c, scope, hostScope);
stop = stop || info.stop;
hostContext = hostContext || info.hostContext;
c = info.combinator;
s = info.value;
} else {
s = s.replace(SCOPE_JUMP, ' ');
}
return c + s;
});
if (hostContext) {
selector = selector.replace(HOST_CONTEXT_PAREN, function (m, pre, paren, post) {
return pre + paren + ' ' + hostScope + post + COMPLEX_SELECTOR_SEP + ' ' + pre + hostScope + paren + post;
});
}
return selector;
},
_transformCompoundSelector: function (selector, combinator, scope, hostScope) {
var jumpIndex = selector.search(SCOPE_JUMP);
var hostContext = false;
if (selector.indexOf(HOST_CONTEXT) >= 0) {
hostContext = true;
} else if (selector.indexOf(HOST) >= 0) {
selector = selector.replace(HOST_PAREN, function (m, host, paren) {
return hostScope + paren;
});
selector = selector.replace(HOST, hostScope);
} else if (jumpIndex !== 0) {
selector = scope ? this._transformSimpleSelector(selector, scope) : selector;
}
if (selector.indexOf(CONTENT) >= 0) {
combinator = '';
}
var stop;
if (jumpIndex >= 0) {
selector = selector.replace(SCOPE_JUMP, ' ');
stop = true;
}
return {
value: selector,
combinator: combinator,
stop: stop,
hostContext: hostContext
};
},
_transformSimpleSelector: function (selector, scope) {
var p$ = selector.split(PSEUDO_PREFIX);
p$[0] += scope;
return p$.join(PSEUDO_PREFIX);
},
documentRule: function (rule) {
rule.selector = rule.parsedSelector;
this.normalizeRootSelector(rule);
if (!nativeShadow) {
this._transformRule(rule, this._transformDocumentSelector);
}
},
normalizeRootSelector: function (rule) {
if (rule.selector === ROOT) {
rule.selector = 'body';
}
},
_transformDocumentSelector: function (selector) {
return selector.match(SCOPE_JUMP) ? this._transformComplexSelector(selector, SCOPE_DOC_SELECTOR) : this._transformSimpleSelector(selector.trim(), SCOPE_DOC_SELECTOR);
},
SCOPE_NAME: 'style-scope'
};
var SCOPE_NAME = api.SCOPE_NAME;
var SCOPE_DOC_SELECTOR = ':not([' + SCOPE_NAME + '])' + ':not(.' + SCOPE_NAME + ')';
var COMPLEX_SELECTOR_SEP = ',';
var SIMPLE_SELECTOR_SEP = /(^|[\s>+~]+)([^\s>+~]+)/g;
var HOST = ':host';
var ROOT = ':root';
var HOST_PAREN = /(\:host)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/g;
var HOST_CONTEXT = ':host-context';
var HOST_CONTEXT_PAREN = /(.*)(?::host-context)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))(.*)/;
var CONTENT = '::content';
var SCOPE_JUMP = /::content|::shadow|\/deep\//;
var CSS_CLASS_PREFIX = '.';
var CSS_ATTR_PREFIX = '[' + SCOPE_NAME + '~=';
var CSS_ATTR_SUFFIX = ']';
var PSEUDO_PREFIX = ':';
var CLASS = 'class';
return api;
}();
Polymer.StyleExtends = function () {
var styleUtil = Polymer.StyleUtil;
return {
hasExtends: function (cssText) {
return Boolean(cssText.match(this.rx.EXTEND));
},
transform: function (style) {
var rules = styleUtil.rulesForStyle(style);
var self = this;
styleUtil.forEachStyleRule(rules, function (rule) {
var map = self._mapRule(rule);
if (rule.parent) {
var m;
while (m = self.rx.EXTEND.exec(rule.cssText)) {
var extend = m[1];
var extendor = self._findExtendor(extend, rule);
if (extendor) {
self._extendRule(rule, extendor);
}
}
}
rule.cssText = rule.cssText.replace(self.rx.EXTEND, '');
});
return styleUtil.toCssText(rules, function (rule) {
if (rule.selector.match(self.rx.STRIP)) {
rule.cssText = '';
}
}, true);
},
_mapRule: function (rule) {
if (rule.parent) {
var map = rule.parent.map || (rule.parent.map = {});
var parts = rule.selector.split(',');
for (var i = 0, p; i < parts.length; i++) {
p = parts[i];
map[p.trim()] = rule;
}
return map;
}
},
_findExtendor: function (extend, rule) {
return rule.parent && rule.parent.map && rule.parent.map[extend] || this._findExtendor(extend, rule.parent);
},
_extendRule: function (target, source) {
if (target.parent !== source.parent) {
this._cloneAndAddRuleToParent(source, target.parent);
}
target.extends = target.extends || [];
target.extends.push(source);
source.selector = source.selector.replace(this.rx.STRIP, '');
source.selector = (source.selector && source.selector + ',\n') + target.selector;
if (source.extends) {
source.extends.forEach(function (e) {
this._extendRule(target, e);
}, this);
}
},
_cloneAndAddRuleToParent: function (rule, parent) {
rule = Object.create(rule);
rule.parent = parent;
if (rule.extends) {
rule.extends = rule.extends.slice();
}
parent.rules.push(rule);
},
rx: {
EXTEND: /@extends\(([^)]*)\)\s*?;/gim,
STRIP: /%[^,]*$/
}
};
}();
(function () {
var prepElement = Polymer.Base._prepElement;
var nativeShadow = Polymer.Settings.useNativeShadow;
var styleUtil = Polymer.StyleUtil;
var styleTransformer = Polymer.StyleTransformer;
var styleExtends = Polymer.StyleExtends;
Polymer.Base._addFeature({
_prepElement: function (element) {
if (this._encapsulateStyle) {
styleTransformer.element(element, this.is, this._scopeCssViaAttr);
}
prepElement.call(this, element);
},
_prepStyles: function () {
if (this._encapsulateStyle === undefined) {
this._encapsulateStyle = !nativeShadow && Boolean(this._template);
}
if (this._template) {
this._styles = this._collectStyles();
var cssText = styleTransformer.elementStyles(this);
if (cssText) {
var style = styleUtil.applyCss(cssText, this.is, nativeShadow ? this._template.content : null);
if (!nativeShadow) {
this._scopeStyle = style;
}
}
} else {
this._styles = [];
}
},
_collectStyles: function () {
var styles = [];
var cssText = '', m$ = this.styleModules;
if (m$) {
for (var i = 0, l = m$.length, m; i < l && (m = m$[i]); i++) {
cssText += styleUtil.cssFromModule(m);
}
}
cssText += styleUtil.cssFromModule(this.is);
var p = this._template && this._template.parentNode;
if (this._template && (!p || p.id.toLowerCase() !== this.is)) {
cssText += styleUtil.cssFromElement(this._template);
}
if (cssText) {
var style = document.createElement('style');
style.textContent = cssText;
if (styleExtends.hasExtends(style.textContent)) {
cssText = styleExtends.transform(style);
}
styles.push(style);
}
return styles;
},
_elementAdd: function (node) {
if (this._encapsulateStyle) {
if (node.__styleScoped) {
node.__styleScoped = false;
} else {
styleTransformer.dom(node, this.is, this._scopeCssViaAttr);
}
}
},
_elementRemove: function (node) {
if (this._encapsulateStyle) {
styleTransformer.dom(node, this.is, this._scopeCssViaAttr, true);
}
},
scopeSubtree: function (container, shouldObserve) {
if (nativeShadow) {
return;
}
var self = this;
var scopify = function (node) {
if (node.nodeType === Node.ELEMENT_NODE) {
var className = node.getAttribute('class');
node.setAttribute('class', self._scopeElementClass(node, className));
var n$ = node.querySelectorAll('*');
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
className = n.getAttribute('class');
n.setAttribute('class', self._scopeElementClass(n, className));
}
}
};
scopify(container);
if (shouldObserve) {
var mo = new MutationObserver(function (mxns) {
for (var i = 0, m; i < mxns.length && (m = mxns[i]); i++) {
if (m.addedNodes) {
for (var j = 0; j < m.addedNodes.length; j++) {
scopify(m.addedNodes[j]);
}
}
}
});
mo.observe(container, {
childList: true,
subtree: true
});
return mo;
}
}
});
}());
Polymer.StyleProperties = function () {
'use strict';
var nativeShadow = Polymer.Settings.useNativeShadow;
var matchesSelector = Polymer.DomApi.matchesSelector;
var styleUtil = Polymer.StyleUtil;
var styleTransformer = Polymer.StyleTransformer;
return {
decorateStyles: function (styles) {
var self = this, props = {};
styleUtil.forRulesInStyles(styles, function (rule) {
self.decorateRule(rule);
self.collectPropertiesInCssText(rule.propertyInfo.cssText, props);
});
var names = [];
for (var i in props) {
names.push(i);
}
return names;
},
decorateRule: function (rule) {
if (rule.propertyInfo) {
return rule.propertyInfo;
}
var info = {}, properties = {};
var hasProperties = this.collectProperties(rule, properties);
if (hasProperties) {
info.properties = properties;
rule.rules = null;
}
info.cssText = this.collectCssText(rule);
rule.propertyInfo = info;
return info;
},
collectProperties: function (rule, properties) {
var info = rule.propertyInfo;
if (info) {
if (info.properties) {
Polymer.Base.mixin(properties, info.properties);
return true;
}
} else {
var m, rx = this.rx.VAR_ASSIGN;
var cssText = rule.parsedCssText;
var any;
while (m = rx.exec(cssText)) {
properties[m[1]] = (m[2] || m[3]).trim();
any = true;
}
return any;
}
},
collectCssText: function (rule) {
var customCssText = '';
var cssText = rule.parsedCssText;
cssText = cssText.replace(this.rx.BRACKETED, '').replace(this.rx.VAR_ASSIGN, '');
var parts = cssText.split(';');
for (var i = 0, p; i < parts.length; i++) {
p = parts[i];
if (p.match(this.rx.MIXIN_MATCH) || p.match(this.rx.VAR_MATCH)) {
customCssText += p + ';\n';
}
}
return customCssText;
},
collectPropertiesInCssText: function (cssText, props) {
var m;
while (m = this.rx.VAR_CAPTURE.exec(cssText)) {
props[m[1]] = true;
var def = m[2];
if (def && def.match(this.rx.IS_VAR)) {
props[def] = true;
}
}
},
reify: function (props) {
var names = Object.getOwnPropertyNames(props);
for (var i = 0, n; i < names.length; i++) {
n = names[i];
props[n] = this.valueForProperty(props[n], props);
}
},
valueForProperty: function (property, props) {
if (property) {
if (property.indexOf(';') >= 0) {
property = this.valueForProperties(property, props);
} else {
var self = this;
var fn = function (all, prefix, value, fallback) {
var propertyValue = self.valueForProperty(props[value], props) || (props[fallback] ? self.valueForProperty(props[fallback], props) : fallback);
return prefix + (propertyValue || '');
};
property = property.replace(this.rx.VAR_MATCH, fn);
}
}
return property && property.trim() || '';
},
valueForProperties: function (property, props) {
var parts = property.split(';');
for (var i = 0, p, m; i < parts.length; i++) {
if (p = parts[i]) {
m = p.match(this.rx.MIXIN_MATCH);
if (m) {
p = this.valueForProperty(props[m[1]], props);
} else {
var pp = p.split(':');
if (pp[1]) {
pp[1] = pp[1].trim();
pp[1] = this.valueForProperty(pp[1], props) || pp[1];
}
p = pp.join(':');
}
parts[i] = p && p.lastIndexOf(';') === p.length - 1 ? p.slice(0, -1) : p || '';
}
}
return parts.join(';');
},
applyProperties: function (rule, props) {
var output = '';
if (!rule.propertyInfo) {
this.decorateRule(rule);
}
if (rule.propertyInfo.cssText) {
output = this.valueForProperties(rule.propertyInfo.cssText, props);
}
rule.cssText = output;
},
propertyDataFromStyles: function (styles, element) {
var props = {}, self = this;
var o = [], i = 0;
styleUtil.forRulesInStyles(styles, function (rule) {
if (!rule.propertyInfo) {
self.decorateRule(rule);
}
if (element && rule.propertyInfo.properties && matchesSelector.call(element, rule.transformedSelector || rule.parsedSelector)) {
self.collectProperties(rule, props);
addToBitMask(i, o);
}
i++;
});
return {
properties: props,
key: o
};
},
scopePropertiesFromStyles: function (styles) {
if (!styles._scopeStyleProperties) {
styles._scopeStyleProperties = this.selectedPropertiesFromStyles(styles, this.SCOPE_SELECTORS);
}
return styles._scopeStyleProperties;
},
hostPropertiesFromStyles: function (styles) {
if (!styles._hostStyleProperties) {
styles._hostStyleProperties = this.selectedPropertiesFromStyles(styles, this.HOST_SELECTORS);
}
return styles._hostStyleProperties;
},
selectedPropertiesFromStyles: function (styles, selectors) {
var props = {}, self = this;
styleUtil.forRulesInStyles(styles, function (rule) {
if (!rule.propertyInfo) {
self.decorateRule(rule);
}
for (var i = 0; i < selectors.length; i++) {
if (rule.parsedSelector === selectors[i]) {
self.collectProperties(rule, props);
return;
}
}
});
return props;
},
transformStyles: function (element, properties, scopeSelector) {
var self = this;
var hostSelector = styleTransformer._calcHostScope(element.is, element.extends);
var rxHostSelector = element.extends ? '\\' + hostSelector.slice(0, -1) + '\\]' : hostSelector;
var hostRx = new RegExp(this.rx.HOST_PREFIX + rxHostSelector + this.rx.HOST_SUFFIX);
return styleTransformer.elementStyles(element, function (rule) {
self.applyProperties(rule, properties);
if (rule.cssText && !nativeShadow) {
self._scopeSelector(rule, hostRx, hostSelector, element._scopeCssViaAttr, scopeSelector);
}
});
},
_scopeSelector: function (rule, hostRx, hostSelector, viaAttr, scopeId) {
rule.transformedSelector = rule.transformedSelector || rule.selector;
var selector = rule.transformedSelector;
var scope = viaAttr ? '[' + styleTransformer.SCOPE_NAME + '~=' + scopeId + ']' : '.' + scopeId;
var parts = selector.split(',');
for (var i = 0, l = parts.length, p; i < l && (p = parts[i]); i++) {
parts[i] = p.match(hostRx) ? p.replace(hostSelector, hostSelector + scope) : scope + ' ' + p;
}
rule.selector = parts.join(',');
},
applyElementScopeSelector: function (element, selector, old, viaAttr) {
var c = viaAttr ? element.getAttribute(styleTransformer.SCOPE_NAME) : element.getAttribute('class') || '';
var v = old ? c.replace(old, selector) : (c ? c + ' ' : '') + this.XSCOPE_NAME + ' ' + selector;
if (c !== v) {
if (viaAttr) {
element.setAttribute(styleTransformer.SCOPE_NAME, v);
} else {
element.setAttribute('class', v);
}
}
},
applyElementStyle: function (element, properties, selector, style) {
var cssText = style ? style.textContent || '' : this.transformStyles(element, properties, selector);
var s = element._customStyle;
if (s && !nativeShadow && s !== style) {
s._useCount--;
if (s._useCount <= 0 && s.parentNode) {
s.parentNode.removeChild(s);
}
}
if (nativeShadow || (!style || !style.parentNode)) {
if (nativeShadow && element._customStyle) {
element._customStyle.textContent = cssText;
style = element._customStyle;
} else if (cssText) {
style = styleUtil.applyCss(cssText, selector, nativeShadow ? element.root : null, element._scopeStyle);
}
}
if (style) {
style._useCount = style._useCount || 0;
if (element._customStyle != style) {
style._useCount++;
}
element._customStyle = style;
}
return style;
},
mixinCustomStyle: function (props, customStyle) {
var v;
for (var i in customStyle) {
v = customStyle[i];
if (v || v === 0) {
props[i] = v;
}
}
},
rx: {
VAR_ASSIGN: /(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:([^;{]*)|{([^}]*)})(?:(?=[;\s}])|$)/gi,
MIXIN_MATCH: /(?:^|\W+)@apply[\s]*\(([^)]*)\)/i,
VAR_MATCH: /(^|\W+)var\([\s]*([^,)]*)[\s]*,?[\s]*((?:[^,)]*)|(?:[^;]*\([^;)]*\)))[\s]*?\)/gi,
VAR_CAPTURE: /\([\s]*(--[^,\s)]*)(?:,[\s]*(--[^,\s)]*))?(?:\)|,)/gi,
IS_VAR: /^--/,
BRACKETED: /\{[^}]*\}/g,
HOST_PREFIX: '(?:^|[^.#[:])',
HOST_SUFFIX: '($|[.:[\\s>+~])'
},
HOST_SELECTORS: [':host'],
SCOPE_SELECTORS: [':root'],
XSCOPE_NAME: 'x-scope'
};
function addToBitMask(n, bits) {
var o = parseInt(n / 32);
var v = 1 << n % 32;
bits[o] = (bits[o] || 0) | v;
}
}();
(function () {
Polymer.StyleCache = function () {
this.cache = {};
};
Polymer.StyleCache.prototype = {
MAX: 100,
store: function (is, data, keyValues, keyStyles) {
data.keyValues = keyValues;
data.styles = keyStyles;
var s$ = this.cache[is] = this.cache[is] || [];
s$.push(data);
if (s$.length > this.MAX) {
s$.shift();
}
},
retrieve: function (is, keyValues, keyStyles) {
var cache = this.cache[is];
if (cache) {
for (var i = cache.length - 1, data; i >= 0; i--) {
data = cache[i];
if (keyStyles === data.styles && this._objectsEqual(keyValues, data.keyValues)) {
return data;
}
}
}
},
clear: function () {
this.cache = {};
},
_objectsEqual: function (target, source) {
var t, s;
for (var i in target) {
t = target[i], s = source[i];
if (!(typeof t === 'object' && t ? this._objectsStrictlyEqual(t, s) : t === s)) {
return false;
}
}
if (Array.isArray(target)) {
return target.length === source.length;
}
return true;
},
_objectsStrictlyEqual: function (target, source) {
return this._objectsEqual(target, source) && this._objectsEqual(source, target);
}
};
}());
Polymer.StyleDefaults = function () {
var styleProperties = Polymer.StyleProperties;
var styleUtil = Polymer.StyleUtil;
var StyleCache = Polymer.StyleCache;
var api = {
_styles: [],
_properties: null,
customStyle: {},
_styleCache: new StyleCache(),
addStyle: function (style) {
this._styles.push(style);
this._properties = null;
},
get _styleProperties() {
if (!this._properties) {
styleProperties.decorateStyles(this._styles);
this._styles._scopeStyleProperties = null;
this._properties = styleProperties.scopePropertiesFromStyles(this._styles);
styleProperties.mixinCustomStyle(this._properties, this.customStyle);
styleProperties.reify(this._properties);
}
return this._properties;
},
_needsStyleProperties: function () {
},
_computeStyleProperties: function () {
return this._styleProperties;
},
updateStyles: function (properties) {
this._properties = null;
if (properties) {
Polymer.Base.mixin(this.customStyle, properties);
}
this._styleCache.clear();
for (var i = 0, s; i < this._styles.length; i++) {
s = this._styles[i];
s = s.__importElement || s;
s._apply();
}
}
};
return api;
}();
(function () {
'use strict';
var serializeValueToAttribute = Polymer.Base.serializeValueToAttribute;
var propertyUtils = Polymer.StyleProperties;
var styleTransformer = Polymer.StyleTransformer;
var styleUtil = Polymer.StyleUtil;
var styleDefaults = Polymer.StyleDefaults;
var nativeShadow = Polymer.Settings.useNativeShadow;
Polymer.Base._addFeature({
_prepStyleProperties: function () {
this._ownStylePropertyNames = this._styles ? propertyUtils.decorateStyles(this._styles) : null;
},
customStyle: null,
getComputedStyleValue: function (property) {
return this._styleProperties && this._styleProperties[property] || getComputedStyle(this).getPropertyValue(property);
},
_setupStyleProperties: function () {
this.customStyle = {};
this._styleCache = null;
this._styleProperties = null;
this._scopeSelector = null;
this._ownStyleProperties = null;
this._customStyle = null;
},
_needsStyleProperties: function () {
return Boolean(this._ownStylePropertyNames && this._ownStylePropertyNames.length);
},
_beforeAttached: function () {
if (!this._scopeSelector && this._needsStyleProperties()) {
this._updateStyleProperties();
}
},
_findStyleHost: function () {
var e = this, root;
while (root = Polymer.dom(e).getOwnerRoot()) {
if (Polymer.isInstance(root.host)) {
return root.host;
}
e = root.host;
}
return styleDefaults;
},
_updateStyleProperties: function () {
var info, scope = this._findStyleHost();
if (!scope._styleCache) {
scope._styleCache = new Polymer.StyleCache();
}
var scopeData = propertyUtils.propertyDataFromStyles(scope._styles, this);
scopeData.key.customStyle = this.customStyle;
info = scope._styleCache.retrieve(this.is, scopeData.key, this._styles);
var scopeCached = Boolean(info);
if (scopeCached) {
this._styleProperties = info._styleProperties;
} else {
this._computeStyleProperties(scopeData.properties);
}
this._computeOwnStyleProperties();
if (!scopeCached) {
info = styleCache.retrieve(this.is, this._ownStyleProperties, this._styles);
}
var globalCached = Boolean(info) && !scopeCached;
var style = this._applyStyleProperties(info);
if (!scopeCached) {
style = style && nativeShadow ? style.cloneNode(true) : style;
info = {
style: style,
_scopeSelector: this._scopeSelector,
_styleProperties: this._styleProperties
};
scopeData.key.customStyle = {};
this.mixin(scopeData.key.customStyle, this.customStyle);
scope._styleCache.store(this.is, info, scopeData.key, this._styles);
if (!globalCached) {
styleCache.store(this.is, Object.create(info), this._ownStyleProperties, this._styles);
}
}
},
_computeStyleProperties: function (scopeProps) {
var scope = this._findStyleHost();
if (!scope._styleProperties) {
scope._computeStyleProperties();
}
var props = Object.create(scope._styleProperties);
this.mixin(props, propertyUtils.hostPropertiesFromStyles(this._styles));
scopeProps = scopeProps || propertyUtils.propertyDataFromStyles(scope._styles, this).properties;
this.mixin(props, scopeProps);
this.mixin(props, propertyUtils.scopePropertiesFromStyles(this._styles));
propertyUtils.mixinCustomStyle(props, this.customStyle);
propertyUtils.reify(props);
this._styleProperties = props;
},
_computeOwnStyleProperties: function () {
var props = {};
for (var i = 0, n; i < this._ownStylePropertyNames.length; i++) {
n = this._ownStylePropertyNames[i];
props[n] = this._styleProperties[n];
}
this._ownStyleProperties = props;
},
_scopeCount: 0,
_applyStyleProperties: function (info) {
var oldScopeSelector = this._scopeSelector;
this._scopeSelector = info ? info._scopeSelector : this.is + '-' + this.__proto__._scopeCount++;
var style = propertyUtils.applyElementStyle(this, this._styleProperties, this._scopeSelector, info && info.style);
if (!nativeShadow) {
propertyUtils.applyElementScopeSelector(this, this._scopeSelector, oldScopeSelector, this._scopeCssViaAttr);
}
return style;
},
serializeValueToAttribute: function (value, attribute, node) {
node = node || this;
if (attribute === 'class' && !nativeShadow) {
var host = node === this ? this.domHost || this.dataHost : this;
if (host) {
value = host._scopeElementClass(node, value);
}
}
node = this.shadyRoot && this.shadyRoot._hasDistributed ? Polymer.dom(node) : node;
serializeValueToAttribute.call(this, value, attribute, node);
},
_scopeElementClass: function (element, selector) {
if (!nativeShadow && !this._scopeCssViaAttr) {
selector += (selector ? ' ' : '') + SCOPE_NAME + ' ' + this.is + (element._scopeSelector ? ' ' + XSCOPE_NAME + ' ' + element._scopeSelector : '');
}
return selector;
},
updateStyles: function (properties) {
if (this.isAttached) {
if (properties) {
this.mixin(this.customStyle, properties);
}
if (this._needsStyleProperties()) {
this._updateStyleProperties();
} else {
this._styleProperties = null;
}
if (this._styleCache) {
this._styleCache.clear();
}
this._updateRootStyles();
}
},
_updateRootStyles: function (root) {
root = root || this.root;
var c$ = Polymer.dom(root)._query(function (e) {
return e.shadyRoot || e.shadowRoot;
});
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.updateStyles) {
c.updateStyles();
}
}
}
});
Polymer.updateStyles = function (properties) {
styleDefaults.updateStyles(properties);
Polymer.Base._updateRootStyles(document);
};
var styleCache = new Polymer.StyleCache();
Polymer.customStyleCache = styleCache;
var SCOPE_NAME = styleTransformer.SCOPE_NAME;
var XSCOPE_NAME = propertyUtils.XSCOPE_NAME;
}());
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepConstructor();
this._prepTemplate();
this._prepStyles();
this._prepStyleProperties();
this._prepAnnotations();
this._prepEffects();
this._prepBehaviors();
this._prepPropertyInfo();
this._prepBindings();
this._prepShady();
},
_prepBehavior: function (b) {
this._addPropertyEffects(b.properties);
this._addComplexObserverEffects(b.observers);
this._addHostAttributes(b.hostAttributes);
},
_initFeatures: function () {
this._setupGestures();
this._setupConfigure();
this._setupStyleProperties();
this._setupDebouncers();
this._setupShady();
this._registerHost();
if (this._template) {
this._poolContent();
this._beginHosting();
this._stampTemplate();
this._endHosting();
this._marshalAnnotationReferences();
}
this._marshalInstanceEffects();
this._marshalBehaviors();
this._marshalHostAttributes();
this._marshalAttributes();
this._tryReady();
},
_marshalBehavior: function (b) {
if (b.listeners) {
this._listenListeners(b.listeners);
}
}
});
(function () {
var nativeShadow = Polymer.Settings.useNativeShadow;
var propertyUtils = Polymer.StyleProperties;
var styleUtil = Polymer.StyleUtil;
var cssParse = Polymer.CssParse;
var styleDefaults = Polymer.StyleDefaults;
var styleTransformer = Polymer.StyleTransformer;
Polymer({
is: 'custom-style',
extends: 'style',
_template: null,
properties: { include: String },
ready: function () {
this._tryApply();
},
attached: function () {
this._tryApply();
},
_tryApply: function () {
if (!this._appliesToDocument) {
if (this.parentNode && this.parentNode.localName !== 'dom-module') {
this._appliesToDocument = true;
var e = this.__appliedElement || this;
styleDefaults.addStyle(e);
if (e.textContent || this.include) {
this._apply(true);
} else {
var self = this;
var observer = new MutationObserver(function () {
observer.disconnect();
self._apply(true);
});
observer.observe(e, { childList: true });
}
}
}
},
_apply: function (deferProperties) {
var e = this.__appliedElement || this;
if (this.include) {
e.textContent = styleUtil.cssFromModules(this.include, true) + e.textContent;
}
if (e.textContent) {
styleUtil.forEachStyleRule(styleUtil.rulesForStyle(e), function (rule) {
styleTransformer.documentRule(rule);
});
var self = this;
var fn = function fn() {
self._applyCustomProperties(e);
};
if (this._pendingApplyProperties) {
cancelAnimationFrame(this._pendingApplyProperties);
this._pendingApplyProperties = null;
}
if (deferProperties) {
this._pendingApplyProperties = requestAnimationFrame(fn);
} else {
fn();
}
}
},
_applyCustomProperties: function (element) {
this._computeStyleProperties();
var props = this._styleProperties;
var rules = styleUtil.rulesForStyle(element);
element.textContent = styleUtil.toCssText(rules, function (rule) {
var css = rule.cssText = rule.parsedCssText;
if (rule.propertyInfo && rule.propertyInfo.cssText) {
css = cssParse.removeCustomPropAssignment(css);
rule.cssText = propertyUtils.valueForProperties(css, props);
}
});
}
});
}());
Polymer.Templatizer = {
properties: { __hideTemplateChildren__: { observer: '_showHideChildren' } },
_instanceProps: Polymer.nob,
_parentPropPrefix: '_parent_',
templatize: function (template) {
this._templatized = template;
if (!template._content) {
template._content = template.content;
}
if (template._content._ctor) {
this.ctor = template._content._ctor;
this._prepParentProperties(this.ctor.prototype, template);
return;
}
var archetype = Object.create(Polymer.Base);
this._customPrepAnnotations(archetype, template);
this._prepParentProperties(archetype, template);
archetype._prepEffects();
this._customPrepEffects(archetype);
archetype._prepBehaviors();
archetype._prepPropertyInfo();
archetype._prepBindings();
archetype._notifyPathUp = this._notifyPathUpImpl;
archetype._scopeElementClass = this._scopeElementClassImpl;
archetype.listen = this._listenImpl;
archetype._showHideChildren = this._showHideChildrenImpl;
archetype.__setPropertyOrig = this.__setProperty;
archetype.__setProperty = this.__setPropertyImpl;
var _constructor = this._constructorImpl;
var ctor = function TemplateInstance(model, host) {
_constructor.call(this, model, host);
};
ctor.prototype = archetype;
archetype.constructor = ctor;
template._content._ctor = ctor;
this.ctor = ctor;
},
_getRootDataHost: function () {
return this.dataHost && this.dataHost._rootDataHost || this.dataHost;
},
_showHideChildrenImpl: function (hide) {
var c = this._children;
for (var i = 0; i < c.length; i++) {
var n = c[i];
if (Boolean(hide) != Boolean(n.__hideTemplateChildren__)) {
if (n.nodeType === Node.TEXT_NODE) {
if (hide) {
n.__polymerTextContent__ = n.textContent;
n.textContent = '';
} else {
n.textContent = n.__polymerTextContent__;
}
} else if (n.style) {
if (hide) {
n.__polymerDisplay__ = n.style.display;
n.style.display = 'none';
} else {
n.style.display = n.__polymerDisplay__;
}
}
}
n.__hideTemplateChildren__ = hide;
}
},
__setPropertyImpl: function (property, value, fromAbove, node) {
if (node && node.__hideTemplateChildren__ && property == 'textContent') {
property = '__polymerTextContent__';
}
this.__setPropertyOrig(property, value, fromAbove, node);
},
_debounceTemplate: function (fn) {
Polymer.dom.addDebouncer(this.debounce('_debounceTemplate', fn));
},
_flushTemplates: function (debouncerExpired) {
Polymer.dom.flush();
},
_customPrepEffects: function (archetype) {
var parentProps = archetype._parentProps;
for (var prop in parentProps) {
archetype._addPropertyEffect(prop, 'function', this._createHostPropEffector(prop));
}
for (var prop in this._instanceProps) {
archetype._addPropertyEffect(prop, 'function', this._createInstancePropEffector(prop));
}
},
_customPrepAnnotations: function (archetype, template) {
archetype._template = template;
var c = template._content;
if (!c._notes) {
var rootDataHost = archetype._rootDataHost;
if (rootDataHost) {
Polymer.Annotations.prepElement = function () {
rootDataHost._prepElement();
};
}
c._notes = Polymer.Annotations.parseAnnotations(template);
Polymer.Annotations.prepElement = null;
this._processAnnotations(c._notes);
}
archetype._notes = c._notes;
archetype._parentProps = c._parentProps;
},
_prepParentProperties: function (archetype, template) {
var parentProps = this._parentProps = archetype._parentProps;
if (this._forwardParentProp && parentProps) {
var proto = archetype._parentPropProto;
var prop;
if (!proto) {
for (prop in this._instanceProps) {
delete parentProps[prop];
}
proto = archetype._parentPropProto = Object.create(null);
if (template != this) {
Polymer.Bind.prepareModel(proto);
Polymer.Base.prepareModelNotifyPath(proto);
}
for (prop in parentProps) {
var parentProp = this._parentPropPrefix + prop;
var effects = [
{
kind: 'function',
effect: this._createForwardPropEffector(prop),
fn: Polymer.Bind._functionEffect
},
{
kind: 'notify',
fn: Polymer.Bind._notifyEffect,
effect: { event: Polymer.CaseMap.camelToDashCase(parentProp) + '-changed' }
}
];
Polymer.Bind._createAccessors(proto, parentProp, effects);
}
}
var self = this;
if (template != this) {
Polymer.Bind.prepareInstance(template);
template._forwardParentProp = function (source, value) {
self._forwardParentProp(source, value);
};
}
this._extendTemplate(template, proto);
template._pathEffector = function (path, value, fromAbove) {
return self._pathEffectorImpl(path, value, fromAbove);
};
}
},
_createForwardPropEffector: function (prop) {
return function (source, value) {
this._forwardParentProp(prop, value);
};
},
_createHostPropEffector: function (prop) {
var prefix = this._parentPropPrefix;
return function (source, value) {
this.dataHost._templatized[prefix + prop] = value;
};
},
_createInstancePropEffector: function (prop) {
return function (source, value, old, fromAbove) {
if (!fromAbove) {
this.dataHost._forwardInstanceProp(this, prop, value);
}
};
},
_extendTemplate: function (template, proto) {
var n$ = Object.getOwnPropertyNames(proto);
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
var val = template[n];
var pd = Object.getOwnPropertyDescriptor(proto, n);
Object.defineProperty(template, n, pd);
if (val !== undefined) {
template._propertySetter(n, val);
}
}
},
_showHideChildren: function (hidden) {
},
_forwardInstancePath: function (inst, path, value) {
},
_forwardInstanceProp: function (inst, prop, value) {
},
_notifyPathUpImpl: function (path, value) {
var dataHost = this.dataHost;
var dot = path.indexOf('.');
var root = dot < 0 ? path : path.slice(0, dot);
dataHost._forwardInstancePath.call(dataHost, this, path, value);
if (root in dataHost._parentProps) {
dataHost._templatized.notifyPath(dataHost._parentPropPrefix + path, value);
}
},
_pathEffectorImpl: function (path, value, fromAbove) {
if (this._forwardParentPath) {
if (path.indexOf(this._parentPropPrefix) === 0) {
var subPath = path.substring(this._parentPropPrefix.length);
var model = this._modelForPath(subPath);
if (model in this._parentProps) {
this._forwardParentPath(subPath, value);
}
}
}
Polymer.Base._pathEffector.call(this._templatized, path, value, fromAbove);
},
_constructorImpl: function (model, host) {
this._rootDataHost = host._getRootDataHost();
this._setupConfigure(model);
this._registerHost(host);
this._beginHosting();
this.root = this.instanceTemplate(this._template);
this.root.__noContent = !this._notes._hasContent;
this.root.__styleScoped = true;
this._endHosting();
this._marshalAnnotatedNodes();
this._marshalInstanceEffects();
this._marshalAnnotatedListeners();
var children = [];
for (var n = this.root.firstChild; n; n = n.nextSibling) {
children.push(n);
n._templateInstance = this;
}
this._children = children;
if (host.__hideTemplateChildren__) {
this._showHideChildren(true);
}
this._tryReady();
},
_listenImpl: function (node, eventName, methodName) {
var model = this;
var host = this._rootDataHost;
var handler = host._createEventHandler(node, eventName, methodName);
var decorated = function (e) {
e.model = model;
handler(e);
};
host._listen(node, eventName, decorated);
},
_scopeElementClassImpl: function (node, value) {
var host = this._rootDataHost;
if (host) {
return host._scopeElementClass(node, value);
}
},
stamp: function (model) {
model = model || {};
if (this._parentProps) {
var templatized = this._templatized;
for (var prop in this._parentProps) {
model[prop] = templatized[this._parentPropPrefix + prop];
}
}
return new this.ctor(model, this);
},
modelForElement: function (el) {
var model;
while (el) {
if (model = el._templateInstance) {
if (model.dataHost != this) {
el = model.dataHost;
} else {
return model;
}
} else {
el = el.parentNode;
}
}
}
};
Polymer({
is: 'dom-template',
extends: 'template',
_template: null,
behaviors: [Polymer.Templatizer],
ready: function () {
this.templatize(this);
}
});
Polymer._collections = new WeakMap();
Polymer.Collection = function (userArray) {
Polymer._collections.set(userArray, this);
this.userArray = userArray;
this.store = userArray.slice();
this.initMap();
};
Polymer.Collection.prototype = {
constructor: Polymer.Collection,
initMap: function () {
var omap = this.omap = new WeakMap();
var pmap = this.pmap = {};
var s = this.store;
for (var i = 0; i < s.length; i++) {
var item = s[i];
if (item && typeof item == 'object') {
omap.set(item, i);
} else {
pmap[item] = i;
}
}
},
add: function (item) {
var key = this.store.push(item) - 1;
if (item && typeof item == 'object') {
this.omap.set(item, key);
} else {
this.pmap[item] = key;
}
return '#' + key;
},
removeKey: function (key) {
if (key = this._parseKey(key)) {
this._removeFromMap(this.store[key]);
delete this.store[key];
}
},
_removeFromMap: function (item) {
if (item && typeof item == 'object') {
this.omap.delete(item);
} else {
delete this.pmap[item];
}
},
remove: function (item) {
var key = this.getKey(item);
this.removeKey(key);
return key;
},
getKey: function (item) {
var key;
if (item && typeof item == 'object') {
key = this.omap.get(item);
} else {
key = this.pmap[item];
}
if (key != undefined) {
return '#' + key;
}
},
getKeys: function () {
return Object.keys(this.store).map(function (key) {
return '#' + key;
});
},
_parseKey: function (key) {
if (key && key[0] == '#') {
return key.slice(1);
}
},
setItem: function (key, item) {
if (key = this._parseKey(key)) {
var old = this.store[key];
if (old) {
this._removeFromMap(old);
}
if (item && typeof item == 'object') {
this.omap.set(item, key);
} else {
this.pmap[item] = key;
}
this.store[key] = item;
}
},
getItem: function (key) {
if (key = this._parseKey(key)) {
return this.store[key];
}
},
getItems: function () {
var items = [], store = this.store;
for (var key in store) {
items.push(store[key]);
}
return items;
},
_applySplices: function (splices) {
var keyMap = {}, key;
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
s.addedKeys = [];
for (var j = 0; j < s.removed.length; j++) {
key = this.getKey(s.removed[j]);
keyMap[key] = keyMap[key] ? null : -1;
}
for (var j = 0; j < s.addedCount; j++) {
var item = this.userArray[s.index + j];
key = this.getKey(item);
key = key === undefined ? this.add(item) : key;
keyMap[key] = keyMap[key] ? null : 1;
s.addedKeys.push(key);
}
}
var removed = [];
var added = [];
for (var key in keyMap) {
if (keyMap[key] < 0) {
this.removeKey(key);
removed.push(key);
}
if (keyMap[key] > 0) {
added.push(key);
}
}
return [{
removed: removed,
added: added
}];
}
};
Polymer.Collection.get = function (userArray) {
return Polymer._collections.get(userArray) || new Polymer.Collection(userArray);
};
Polymer.Collection.applySplices = function (userArray, splices) {
var coll = Polymer._collections.get(userArray);
return coll ? coll._applySplices(splices) : null;
};
Polymer({
is: 'dom-repeat',
extends: 'template',
_template: null,
properties: {
items: { type: Array },
as: {
type: String,
value: 'item'
},
indexAs: {
type: String,
value: 'index'
},
sort: {
type: Function,
observer: '_sortChanged'
},
filter: {
type: Function,
observer: '_filterChanged'
},
observe: {
type: String,
observer: '_observeChanged'
},
delay: Number,
renderedItemCount: {
type: Number,
notify: true,
readOnly: true
},
initialCount: {
type: Number,
observer: '_initializeChunking'
},
targetFramerate: {
type: Number,
value: 20
},
_targetFrameTime: {
type: Number,
computed: '_computeFrameTime(targetFramerate)'
}
},
behaviors: [Polymer.Templatizer],
observers: ['_itemsChanged(items.*)'],
created: function () {
this._instances = [];
this._pool = [];
this._limit = Infinity;
var self = this;
this._boundRenderChunk = function () {
self._renderChunk();
};
},
detached: function () {
this.__isDetached = true;
for (var i = 0; i < this._instances.length; i++) {
this._detachInstance(i);
}
},
attached: function () {
if (this.__isDetached) {
this.__isDetached = false;
var parent = Polymer.dom(Polymer.dom(this).parentNode);
for (var i = 0; i < this._instances.length; i++) {
this._attachInstance(i, parent);
}
}
},
ready: function () {
this._instanceProps = { __key__: true };
this._instanceProps[this.as] = true;
this._instanceProps[this.indexAs] = true;
if (!this.ctor) {
this.templatize(this);
}
},
_sortChanged: function (sort) {
var dataHost = this._getRootDataHost();
this._sortFn = sort && (typeof sort == 'function' ? sort : function () {
return dataHost[sort].apply(dataHost, arguments);
});
this._needFullRefresh = true;
if (this.items) {
this._debounceTemplate(this._render);
}
},
_filterChanged: function (filter) {
var dataHost = this._getRootDataHost();
this._filterFn = filter && (typeof filter == 'function' ? filter : function () {
return dataHost[filter].apply(dataHost, arguments);
});
this._needFullRefresh = true;
if (this.items) {
this._debounceTemplate(this._render);
}
},
_computeFrameTime: function (rate) {
return Math.ceil(1000 / rate);
},
_initializeChunking: function () {
if (this.initialCount) {
this._limit = this.initialCount;
this._chunkCount = this.initialCount;
this._lastChunkTime = performance.now();
}
},
_tryRenderChunk: function () {
if (this.items && this._limit < this.items.length) {
this.debounce('renderChunk', this._requestRenderChunk);
}
},
_requestRenderChunk: function () {
requestAnimationFrame(this._boundRenderChunk);
},
_renderChunk: function () {
var currChunkTime = performance.now();
var ratio = this._targetFrameTime / (currChunkTime - this._lastChunkTime);
this._chunkCount = Math.round(this._chunkCount * ratio) || 1;
this._limit += this._chunkCount;
this._lastChunkTime = currChunkTime;
this._debounceTemplate(this._render);
},
_observeChanged: function () {
this._observePaths = this.observe && this.observe.replace('.*', '.').split(' ');
},
_itemsChanged: function (change) {
if (change.path == 'items') {
if (Array.isArray(this.items)) {
this.collection = Polymer.Collection.get(this.items);
} else if (!this.items) {
this.collection = null;
} else {
this._error(this._logf('dom-repeat', 'expected array for `items`,' + ' found', this.items));
}
this._keySplices = [];
this._indexSplices = [];
this._needFullRefresh = true;
this._initializeChunking();
this._debounceTemplate(this._render);
} else if (change.path == 'items.splices') {
this._keySplices = this._keySplices.concat(change.value.keySplices);
this._indexSplices = this._indexSplices.concat(change.value.indexSplices);
this._debounceTemplate(this._render);
} else {
var subpath = change.path.slice(6);
this._forwardItemPath(subpath, change.value);
this._checkObservedPaths(subpath);
}
},
_checkObservedPaths: function (path) {
if (this._observePaths) {
path = path.substring(path.indexOf('.') + 1);
var paths = this._observePaths;
for (var i = 0; i < paths.length; i++) {
if (path.indexOf(paths[i]) === 0) {
this._needFullRefresh = true;
if (this.delay) {
this.debounce('render', this._render, this.delay);
} else {
this._debounceTemplate(this._render);
}
return;
}
}
}
},
render: function () {
this._needFullRefresh = true;
this._debounceTemplate(this._render);
this._flushTemplates();
},
_render: function () {
var c = this.collection;
if (this._needFullRefresh) {
this._applyFullRefresh();
this._needFullRefresh = false;
} else if (this._keySplices.length) {
if (this._sortFn) {
this._applySplicesUserSort(this._keySplices);
} else {
if (this._filterFn) {
this._applyFullRefresh();
} else {
this._applySplicesArrayOrder(this._indexSplices);
}
}
} else {
}
this._keySplices = [];
this._indexSplices = [];
var keyToIdx = this._keyToInstIdx = {};
for (var i = this._instances.length - 1; i >= 0; i--) {
var inst = this._instances[i];
if (inst.isPlaceholder && i < this._limit) {
inst = this._insertInstance(i, inst.__key__);
} else if (!inst.isPlaceholder && i >= this._limit) {
inst = this._downgradeInstance(i, inst.__key__);
}
keyToIdx[inst.__key__] = i;
if (!inst.isPlaceholder) {
inst.__setProperty(this.indexAs, i, true);
}
}
this._pool.length = 0;
this._setRenderedItemCount(this._instances.length);
this.fire('dom-change');
this._tryRenderChunk();
},
_applyFullRefresh: function () {
var c = this.collection;
var keys;
if (this._sortFn) {
keys = c ? c.getKeys() : [];
} else {
keys = [];
var items = this.items;
if (items) {
for (var i = 0; i < items.length; i++) {
keys.push(c.getKey(items[i]));
}
}
}
var self = this;
if (this._filterFn) {
keys = keys.filter(function (a) {
return self._filterFn(c.getItem(a));
});
}
if (this._sortFn) {
keys.sort(function (a, b) {
return self._sortFn(c.getItem(a), c.getItem(b));
});
}
for (var i = 0; i < keys.length; i++) {
var key = keys[i];
var inst = this._instances[i];
if (inst) {
inst.__key__ = key;
if (!inst.isPlaceholder && i < this._limit) {
inst.__setProperty(this.as, c.getItem(key), true);
}
} else if (i < this._limit) {
this._insertInstance(i, key);
} else {
this._insertPlaceholder(i, key);
}
}
for (var j = this._instances.length - 1; j >= i; j--) {
this._detachAndRemoveInstance(j);
}
},
_numericSort: function (a, b) {
return a - b;
},
_applySplicesUserSort: function (splices) {
var c = this.collection;
var instances = this._instances;
var keyMap = {};
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0; j < s.removed.length; j++) {
var key = s.removed[j];
keyMap[key] = keyMap[key] ? null : -1;
}
for (var j = 0; j < s.added.length; j++) {
var key = s.added[j];
keyMap[key] = keyMap[key] ? null : 1;
}
}
var removedIdxs = [];
var addedKeys = [];
for (var key in keyMap) {
if (keyMap[key] === -1) {
removedIdxs.push(this._keyToInstIdx[key]);
}
if (keyMap[key] === 1) {
addedKeys.push(key);
}
}
if (removedIdxs.length) {
removedIdxs.sort(this._numericSort);
for (var i = removedIdxs.length - 1; i >= 0; i--) {
var idx = removedIdxs[i];
if (idx !== undefined) {
this._detachAndRemoveInstance(idx);
}
}
}
var self = this;
if (addedKeys.length) {
if (this._filterFn) {
addedKeys = addedKeys.filter(function (a) {
return self._filterFn(c.getItem(a));
});
}
addedKeys.sort(function (a, b) {
return self._sortFn(c.getItem(a), c.getItem(b));
});
var start = 0;
for (var i = 0; i < addedKeys.length; i++) {
start = this._insertRowUserSort(start, addedKeys[i]);
}
}
},
_insertRowUserSort: function (start, key) {
var c = this.collection;
var item = c.getItem(key);
var end = this._instances.length - 1;
var idx = -1;
while (start <= end) {
var mid = start + end >> 1;
var midKey = this._instances[mid].__key__;
var cmp = this._sortFn(c.getItem(midKey), item);
if (cmp < 0) {
start = mid + 1;
} else if (cmp > 0) {
end = mid - 1;
} else {
idx = mid;
break;
}
}
if (idx < 0) {
idx = end + 1;
}
this._insertPlaceholder(idx, key);
return idx;
},
_applySplicesArrayOrder: function (splices) {
var c = this.collection;
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0; j < s.removed.length; j++) {
this._detachAndRemoveInstance(s.index);
}
for (var j = 0; j < s.addedKeys.length; j++) {
this._insertPlaceholder(s.index + j, s.addedKeys[j]);
}
}
},
_detachInstance: function (idx) {
var inst = this._instances[idx];
if (!inst.isPlaceholder) {
for (var i = 0; i < inst._children.length; i++) {
var el = inst._children[i];
Polymer.dom(inst.root).appendChild(el);
}
return inst;
}
},
_attachInstance: function (idx, parent) {
var inst = this._instances[idx];
if (!inst.isPlaceholder) {
parent.insertBefore(inst.root, this);
}
},
_detachAndRemoveInstance: function (idx) {
var inst = this._detachInstance(idx);
if (inst) {
this._pool.push(inst);
}
this._instances.splice(idx, 1);
},
_insertPlaceholder: function (idx, key) {
this._instances.splice(idx, 0, {
isPlaceholder: true,
__key__: key
});
},
_stampInstance: function (idx, key) {
var model = { __key__: key };
model[this.as] = this.collection.getItem(key);
model[this.indexAs] = idx;
return this.stamp(model);
},
_insertInstance: function (idx, key) {
var inst = this._pool.pop();
if (inst) {
inst.__setProperty(this.as, this.collection.getItem(key), true);
inst.__setProperty('__key__', key, true);
} else {
inst = this._stampInstance(idx, key);
}
var beforeRow = this._instances[idx + 1];
var beforeNode = beforeRow && !beforeRow.isPlaceholder ? beforeRow._children[0] : this;
var parentNode = Polymer.dom(this).parentNode;
Polymer.dom(parentNode).insertBefore(inst.root, beforeNode);
this._instances[idx] = inst;
return inst;
},
_downgradeInstance: function (idx, key) {
var inst = this._detachInstance(idx);
if (inst) {
this._pool.push(inst);
}
inst = {
isPlaceholder: true,
__key__: key
};
this._instances[idx] = inst;
return inst;
},
_showHideChildren: function (hidden) {
for (var i = 0; i < this._instances.length; i++) {
this._instances[i]._showHideChildren(hidden);
}
},
_forwardInstanceProp: function (inst, prop, value) {
if (prop == this.as) {
var idx;
if (this._sortFn || this._filterFn) {
idx = this.items.indexOf(this.collection.getItem(inst.__key__));
} else {
idx = inst[this.indexAs];
}
this.set('items.' + idx, value);
}
},
_forwardInstancePath: function (inst, path, value) {
if (path.indexOf(this.as + '.') === 0) {
this._notifyPath('items.' + inst.__key__ + '.' + path.slice(this.as.length + 1), value);
}
},
_forwardParentProp: function (prop, value) {
var i$ = this._instances;
for (var i = 0, inst; i < i$.length && (inst = i$[i]); i++) {
if (!inst.isPlaceholder) {
inst.__setProperty(prop, value, true);
}
}
},
_forwardParentPath: function (path, value) {
var i$ = this._instances;
for (var i = 0, inst; i < i$.length && (inst = i$[i]); i++) {
if (!inst.isPlaceholder) {
inst._notifyPath(path, value, true);
}
}
},
_forwardItemPath: function (path, value) {
if (this._keyToInstIdx) {
var dot = path.indexOf('.');
var key = path.substring(0, dot < 0 ? path.length : dot);
var idx = this._keyToInstIdx[key];
var inst = this._instances[idx];
if (inst && !inst.isPlaceholder) {
if (dot >= 0) {
path = this.as + '.' + path.substring(dot + 1);
inst._notifyPath(path, value, true);
} else {
inst.__setProperty(this.as, value, true);
}
}
}
},
itemForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance[this.as];
},
keyForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance.__key__;
},
indexForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance[this.indexAs];
}
});
Polymer({
is: 'array-selector',
_template: null,
properties: {
items: {
type: Array,
observer: 'clearSelection'
},
multi: {
type: Boolean,
value: false,
observer: 'clearSelection'
},
selected: {
type: Object,
notify: true
},
selectedItem: {
type: Object,
notify: true
},
toggle: {
type: Boolean,
value: false
}
},
clearSelection: function () {
if (Array.isArray(this.selected)) {
for (var i = 0; i < this.selected.length; i++) {
this.unlinkPaths('selected.' + i);
}
} else {
this.unlinkPaths('selected');
this.unlinkPaths('selectedItem');
}
if (this.multi) {
if (!this.selected || this.selected.length) {
this.selected = [];
this._selectedColl = Polymer.Collection.get(this.selected);
}
} else {
this.selected = null;
this._selectedColl = null;
}
this.selectedItem = null;
},
isSelected: function (item) {
if (this.multi) {
return this._selectedColl.getKey(item) !== undefined;
} else {
return this.selected == item;
}
},
deselect: function (item) {
if (this.multi) {
if (this.isSelected(item)) {
var skey = this._selectedColl.getKey(item);
this.arrayDelete('selected', item);
this.unlinkPaths('selected.' + skey);
}
} else {
this.selected = null;
this.selectedItem = null;
this.unlinkPaths('selected');
this.unlinkPaths('selectedItem');
}
},
select: function (item) {
var icol = Polymer.Collection.get(this.items);
var key = icol.getKey(item);
if (this.multi) {
if (this.isSelected(item)) {
if (this.toggle) {
this.deselect(item);
}
} else {
this.push('selected', item);
var skey = this._selectedColl.getKey(item);
this.linkPaths('selected.' + skey, 'items.' + key);
}
} else {
if (this.toggle && item == this.selected) {
this.deselect();
} else {
this.selected = item;
this.selectedItem = item;
this.linkPaths('selected', 'items.' + key);
this.linkPaths('selectedItem', 'items.' + key);
}
}
}
});
Polymer({
is: 'dom-if',
extends: 'template',
_template: null,
properties: {
'if': {
type: Boolean,
value: false,
observer: '_queueRender'
},
restamp: {
type: Boolean,
value: false,
observer: '_queueRender'
}
},
behaviors: [Polymer.Templatizer],
_queueRender: function () {
this._debounceTemplate(this._render);
},
detached: function () {
if (!this.parentNode || this.parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE && (!Polymer.Settings.hasShadow || !(this.parentNode instanceof ShadowRoot))) {
this._teardownInstance();
}
},
attached: function () {
if (this.if && this.ctor) {
this.async(this._ensureInstance);
}
},
render: function () {
this._flushTemplates();
},
_render: function () {
if (this.if) {
if (!this.ctor) {
this.templatize(this);
}
this._ensureInstance();
this._showHideChildren();
} else if (this.restamp) {
this._teardownInstance();
}
if (!this.restamp && this._instance) {
this._showHideChildren();
}
if (this.if != this._lastIf) {
this.fire('dom-change');
this._lastIf = this.if;
}
},
_ensureInstance: function () {
var parentNode = Polymer.dom(this).parentNode;
if (parentNode) {
var parent = Polymer.dom(parentNode);
if (!this._instance) {
this._instance = this.stamp();
var root = this._instance.root;
parent.insertBefore(root, this);
} else {
var c$ = this._instance._children;
if (c$ && c$.length) {
var lastChild = Polymer.dom(this).previousSibling;
if (lastChild !== c$[c$.length - 1]) {
for (var i = 0, n; i < c$.length && (n = c$[i]); i++) {
parent.insertBefore(n, this);
}
}
}
}
}
},
_teardownInstance: function () {
if (this._instance) {
var c$ = this._instance._children;
if (c$ && c$.length) {
var parent = Polymer.dom(Polymer.dom(c$[0]).parentNode);
for (var i = 0, n; i < c$.length && (n = c$[i]); i++) {
parent.removeChild(n);
}
}
this._instance = null;
}
},
_showHideChildren: function () {
var hidden = this.__hideTemplateChildren__ || !this.if;
if (this._instance) {
this._instance._showHideChildren(hidden);
}
},
_forwardParentProp: function (prop, value) {
if (this._instance) {
this._instance[prop] = value;
}
},
_forwardParentPath: function (path, value) {
if (this._instance) {
this._instance._notifyPath(path, value, true);
}
}
});
Polymer({
is: 'dom-bind',
extends: 'template',
_template: null,
created: function () {
var self = this;
Polymer.RenderStatus.whenReady(function () {
self._markImportsReady();
});
},
_ensureReady: function () {
if (!this._readied) {
this._readySelf();
}
},
_markImportsReady: function () {
this._importsReady = true;
this._ensureReady();
},
_registerFeatures: function () {
this._prepConstructor();
},
_insertChildren: function () {
var parentDom = Polymer.dom(Polymer.dom(this).parentNode);
parentDom.insertBefore(this.root, this);
},
_removeChildren: function () {
if (this._children) {
for (var i = 0; i < this._children.length; i++) {
this.root.appendChild(this._children[i]);
}
}
},
_initFeatures: function () {
},
_scopeElementClass: function (element, selector) {
if (this.dataHost) {
return this.dataHost._scopeElementClass(element, selector);
} else {
return selector;
}
},
_prepConfigure: function () {
var config = {};
for (var prop in this._propertyEffects) {
config[prop] = this[prop];
}
var setupConfigure = this._setupConfigure;
this._setupConfigure = function () {
setupConfigure.call(this, config);
};
},
attached: function () {
if (this._importsReady) {
this.render();
}
},
detached: function () {
this._removeChildren();
},
render: function () {
this._ensureReady();
if (!this._children) {
this._template = this;
this._prepAnnotations();
this._prepEffects();
this._prepBehaviors();
this._prepConfigure();
this._prepBindings();
this._prepPropertyInfo();
Polymer.Base._initFeatures.call(this);
this._children = Polymer.TreeApi.arrayCopyChildNodes(this.root);
}
this._insertChildren();
this.fire('dom-change');
}
});
Polymer({
is: 'frankly-results',
properties: {
organization: { type: String },
repos: { type: Array },
fullRepoNames: { type: Boolean },
labels: { type: Array },
travisBadge: {
type: Boolean,
value: false
},
githubUser: { type: Object }
},
observers: ['_refresh(githubUser)'],
ready: function () {
this._requestQueue = null;
},
refresh: function () {
this._refresh(this.githubUser);
},
_refresh: function (user) {
if (!user)
return;
if (!this.organization)
this.organization = user.github.username;
if (this.repos && this.repos.length > 0) {
this._fetchAllRepos();
return;
}
this.repos = [];
var url = 'https://api.github.com/users/' + user.github.username + '/subscriptions';
var xhr = new XMLHttpRequest();
xhr.open('GET', url);
xhr.send();
xhr.addEventListener('load', function () {
response = JSON.parse(xhr.responseText);
for (var i = 0; i < response.length; i++) {
this.repos.push(response[i].name);
}
this._fetchAllRepos();
}.bind(this));
xhr.addEventListener('error', function () {
this.status = 'Error: ' + xhr.status;
}.bind(this));
},
_fetchAllRepos: function () {
var requestQueue = [];
for (var i = 0; i < this.repos.length; i++) {
requestQueue.push({ 'name': this.repos[i] });
}
this.all = {};
this.set(['repos'], []);
this.set([
'all',
'labels'
], []);
this._requestQueue = requestQueue;
this._makeNextRequest();
},
_makeNextRequest: function () {
var repo = this._requestQueue[0];
if (!repo) {
this.status = 'Done!';
return;
}
var name = this._getFullRepoName(repo.name);
var base = repo.next || 'https://api.github.com/repos/' + name + '/issues?state=open';
var url = base + '&access_token=' + this.githubUser.github.accessToken;
var xhr = new XMLHttpRequest();
xhr.open('GET', url);
xhr.send();
this.status = 'Fetching issues for \'' + name + '\'';
xhr.addEventListener('load', function () {
this._handleResponse(xhr, repo);
}.bind(this));
xhr.addEventListener('error', function () {
this.status = 'Error: ' + xhr.status;
this.shift('_requestQueue');
this._makeNextRequest();
}.bind(this));
},
_handleResponse: function (xhr, repo) {
if (xhr.status / 100 != 2) {
this.status = 'Error: ' + xhr.status;
this.shift('_requestQueue');
this._makeNextRequest();
} else {
var response = JSON.parse(xhr.responseText);
var repoIssues = this._getAllIssues(response);
var repoUntriaged = this._filterIssuesByLabel(repoIssues, /^.+/i, true);
var repoPRs = this._getAllPRs(response);
var repoLabels = this._addLabelStatsToSummary(repoIssues);
this._updateModelPath([
'all',
'issues'
], repoIssues);
this._updateModelPath([
'all',
'untriaged'
], repoUntriaged);
this._updateModelPath([
'all',
'prs'
], repoPRs);
this._updateRepoRow(this._getFullRepoName(repo.name), repoLabels, repoIssues, repoUntriaged, repoPRs);
var link = xhr.getResponseHeader('Link');
var matches = link && link.match(/<([^>]*)>; rel="next"/);
repo.next = matches && matches[1];
if (!repo.next) {
this.shift('_requestQueue');
}
this._makeNextRequest();
}
},
_getAllIssues: function (items) {
items = items.filter(function (item) {
return Boolean(item.pull_request) === false;
});
return items;
},
_getAllPRs: function (items) {
items = items.filter(function (item) {
return Boolean(item.pull_request) === true;
});
return items;
},
_filterIssuesByLabel: function (items, label, negate) {
items = this._getAllIssues(items);
items = items.filter(function (item) {
var matches = false;
for (var i = 0; i < item.labels.length; i++) {
if (item.labels[i].name.match(label)) {
matches = matches || true;
}
}
return negate ? !matches : matches;
});
return items;
},
_addLabelStatsToSummary: function (issues) {
var stats = [];
for (var i = 0; i < this.labels.length; i++) {
var regex = new RegExp('^' + this.labels[i], 'i');
var items = this._filterIssuesByLabel(issues, regex, false);
stats.push({
'name': this.labels[i],
'count': items.length
});
if (this.all.labels[i]) {
this._updateModelPath([
'all.labels',
i,
'items'
], items);
} else {
this.push('all.labels', {
'name': this.labels[i],
'items': items
});
}
}
return stats;
},
_updateRepoRow: function (repo, repoLabels, repoIssues, repoUntriaged, repoPRs) {
var found = false;
for (var i = 0; i < this.repos.length; i++) {
if (this.repos[i].name === repo) {
found = true;
this.set([
'repos',
i,
'issues'
], this.get([
'repos',
i,
'issues'
]) + repoIssues.length);
this.set([
'repos',
i,
'untriaged'
], this.get([
'repos',
i,
'untriaged'
]) + repoUntriaged.length);
this.set([
'repos',
i,
'prs'
], this.get([
'repos',
i,
'prs'
]) + repoPRs.length);
for (var j = 0; j < this.labels.length; j++) {
this.set([
'repos',
i,
'labels',
j,
'count'
], this.get([
'repos',
i,
'labels',
j,
'count'
]) + repoLabels[j].count);
}
break;
}
}
if (!found) {
this.push('repos', {
'name': repo,
'issues': repoIssues.length,
'untriaged': repoUntriaged.length,
'prs': repoPRs.length
});
this.set([
'repos',
this.repos.length - 1,
'labels'
], repoLabels);
}
},
_updateModelPath: function (path, newItems) {
var currentItems = this.get(path) || [];
this.set(path, currentItems.concat(newItems));
},
_getStatusClass: function (status) {
return status === 'Done!' ? 'hidden' : '';
},
_isLoggedIn: function (user) {
return !!user;
},
_getFullRepoName: function (name) {
return this.fullRepoNames ? name : this.organization + '/' + name;
}
});
(function () {
var h, n = this;
function p(a) {
return void 0 !== a;
}
function aa() {
}
function ba(a) {
a.yb = function () {
return a.zf ? a.zf : a.zf = new a();
};
}
function ca(a) {
var b = typeof a;
if ('object' == b)
if (a) {
if (a instanceof Array)
return 'array';
if (a instanceof Object)
return b;
var c = Object.prototype.toString.call(a);
if ('[object Window]' == c)
return 'object';
if ('[object Array]' == c || 'number' == typeof a.length && 'undefined' != typeof a.splice && 'undefined' != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable('splice'))
return 'array';
if ('[object Function]' == c || 'undefined' != typeof a.call && 'undefined' != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable('call'))
return 'function';
} else
return 'null';
else if ('function' == b && 'undefined' == typeof a.call)
return 'object';
return b;
}
function da(a) {
return 'array' == ca(a);
}
function ea(a) {
var b = ca(a);
return 'array' == b || 'object' == b && 'number' == typeof a.length;
}
function q(a) {
return 'string' == typeof a;
}
function fa(a) {
return 'number' == typeof a;
}
function r(a) {
return 'function' == ca(a);
}
function ga(a) {
var b = typeof a;
return 'object' == b && null != a || 'function' == b;
}
function ha(a, b, c) {
return a.call.apply(a.bind, arguments);
}
function ia(a, b, c) {
if (!a)
throw Error();
if (2 < arguments.length) {
var d = Array.prototype.slice.call(arguments, 2);
return function () {
var c = Array.prototype.slice.call(arguments);
Array.prototype.unshift.apply(c, d);
return a.apply(b, c);
};
}
return function () {
return a.apply(b, arguments);
};
}
function u(a, b, c) {
u = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf('native code') ? ha : ia;
return u.apply(null, arguments);
}
var ja = Date.now || function () {
return +new Date();
};
function ka(a, b) {
function c() {
}
c.prototype = b.prototype;
a.nh = b.prototype;
a.prototype = new c();
a.prototype.constructor = a;
a.jh = function (a, c, f) {
for (var g = Array(arguments.length - 2), k = 2; k < arguments.length; k++)
g[k - 2] = arguments[k];
return b.prototype[c].apply(a, g);
};
}
;
function la(a) {
if (Error.captureStackTrace)
Error.captureStackTrace(this, la);
else {
var b = Error().stack;
b && (this.stack = b);
}
a && (this.message = String(a));
}
ka(la, Error);
la.prototype.name = 'CustomError';
function v(a, b) {
for (var c in a)
b.call(void 0, a[c], c, a);
}
function ma(a, b) {
var c = {}, d;
for (d in a)
c[d] = b.call(void 0, a[d], d, a);
return c;
}
function na(a, b) {
for (var c in a)
if (!b.call(void 0, a[c], c, a))
return !1;
return !0;
}
function oa(a) {
var b = 0, c;
for (c in a)
b++;
return b;
}
function pa(a) {
for (var b in a)
return b;
}
function qa(a) {
var b = [], c = 0, d;
for (d in a)
b[c++] = a[d];
return b;
}
function ra(a) {
var b = [], c = 0, d;
for (d in a)
b[c++] = d;
return b;
}
function sa(a, b) {
for (var c in a)
if (a[c] == b)
return !0;
return !1;
}
function ta(a, b, c) {
for (var d in a)
if (b.call(c, a[d], d, a))
return d;
}
function ua(a, b) {
var c = ta(a, b, void 0);
return c && a[c];
}
function va(a) {
for (var b in a)
return !1;
return !0;
}
function wa(a) {
var b = {}, c;
for (c in a)
b[c] = a[c];
return b;
}
var xa = 'constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf'.split(' ');
function ya(a, b) {
for (var c, d, e = 1; e < arguments.length; e++) {
d = arguments[e];
for (c in d)
a[c] = d[c];
for (var f = 0; f < xa.length; f++)
c = xa[f], Object.prototype.hasOwnProperty.call(d, c) && (a[c] = d[c]);
}
}
;
function za(a) {
a = String(a);
if (/^\s*$/.test(a) ? 0 : /^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, '')))
try {
return eval('(' + a + ')');
} catch (b) {
}
throw Error('Invalid JSON string: ' + a);
}
function Aa() {
this.Vd = void 0;
}
function Ba(a, b, c) {
switch (typeof b) {
case 'string':
Ca(b, c);
break;
case 'number':
c.push(isFinite(b) && !isNaN(b) ? b : 'null');
break;
case 'boolean':
c.push(b);
break;
case 'undefined':
c.push('null');
break;
case 'object':
if (null == b) {
c.push('null');
break;
}
if (da(b)) {
var d = b.length;
c.push('[');
for (var e = '', f = 0; f < d; f++)
c.push(e), e = b[f], Ba(a, a.Vd ? a.Vd.call(b, String(f), e) : e, c), e = ',';
c.push(']');
break;
}
c.push('{');
d = '';
for (f in b)
Object.prototype.hasOwnProperty.call(b, f) && (e = b[f], 'function' != typeof e && (c.push(d), Ca(f, c), c.push(':'), Ba(a, a.Vd ? a.Vd.call(b, f, e) : e, c), d = ','));
c.push('}');
break;
case 'function':
break;
default:
throw Error('Unknown type: ' + typeof b);
}
}
var Da = {
'"': '\\"',
'\\': '\\\\',
'/': '\\/',
'\b': '\\b',
'\f': '\\f',
'\n': '\\n',
'\r': '\\r',
'\t': '\\t',
'\x0B': '\\u000b'
}, Ea = /\uffff/.test('\uFFFF') ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
function Ca(a, b) {
b.push('"', a.replace(Ea, function (a) {
if (a in Da)
return Da[a];
var b = a.charCodeAt(0), e = '\\u';
16 > b ? e += '000' : 256 > b ? e += '00' : 4096 > b && (e += '0');
return Da[a] = e + b.toString(16);
}), '"');
}
;
function Fa() {
return Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ ja()).toString(36);
}
;
var w;
a: {
var Ga = n.navigator;
if (Ga) {
var Ha = Ga.userAgent;
if (Ha) {
w = Ha;
break a;
}
}
w = '';
}
;
function Ia() {
this.Ya = -1;
}
;
function Ja() {
this.Ya = -1;
this.Ya = 64;
this.P = [];
this.pe = [];
this.eg = [];
this.Od = [];
this.Od[0] = 128;
for (var a = 1; a < this.Ya; ++a)
this.Od[a] = 0;
this.ge = this.ec = 0;
this.reset();
}
ka(Ja, Ia);
Ja.prototype.reset = function () {
this.P[0] = 1732584193;
this.P[1] = 4023233417;
this.P[2] = 2562383102;
this.P[3] = 271733878;
this.P[4] = 3285377520;
this.ge = this.ec = 0;
};
function Ka(a, b, c) {
c || (c = 0);
var d = a.eg;
if (q(b))
for (var e = 0; 16 > e; e++)
d[e] = b.charCodeAt(c) << 24 | b.charCodeAt(c + 1) << 16 | b.charCodeAt(c + 2) << 8 | b.charCodeAt(c + 3), c += 4;
else
for (e = 0; 16 > e; e++)
d[e] = b[c] << 24 | b[c + 1] << 16 | b[c + 2] << 8 | b[c + 3], c += 4;
for (e = 16; 80 > e; e++) {
var f = d[e - 3] ^ d[e - 8] ^ d[e - 14] ^ d[e - 16];
d[e] = (f << 1 | f >>> 31) & 4294967295;
}
b = a.P[0];
c = a.P[1];
for (var g = a.P[2], k = a.P[3], m = a.P[4], l, e = 0; 80 > e; e++)
40 > e ? 20 > e ? (f = k ^ c & (g ^ k), l = 1518500249) : (f = c ^ g ^ k, l = 1859775393) : 60 > e ? (f = c & g | k & (c | g), l = 2400959708) : (f = c ^ g ^ k, l = 3395469782), f = (b << 5 | b >>> 27) + f + m + l + d[e] & 4294967295, m = k, k = g, g = (c << 30 | c >>> 2) & 4294967295, c = b, b = f;
a.P[0] = a.P[0] + b & 4294967295;
a.P[1] = a.P[1] + c & 4294967295;
a.P[2] = a.P[2] + g & 4294967295;
a.P[3] = a.P[3] + k & 4294967295;
a.P[4] = a.P[4] + m & 4294967295;
}
Ja.prototype.update = function (a, b) {
if (null != a) {
p(b) || (b = a.length);
for (var c = b - this.Ya, d = 0, e = this.pe, f = this.ec; d < b;) {
if (0 == f)
for (; d <= c;)
Ka(this, a, d), d += this.Ya;
if (q(a))
for (; d < b;) {
if (e[f] = a.charCodeAt(d), ++f, ++d, f == this.Ya) {
Ka(this, e);
f = 0;
break;
}
}
else
for (; d < b;)
if (e[f] = a[d], ++f, ++d, f == this.Ya) {
Ka(this, e);
f = 0;
break;
}
}
this.ec = f;
this.ge += b;
}
};
var x = Array.prototype, La = x.indexOf ? function (a, b, c) {
return x.indexOf.call(a, b, c);
} : function (a, b, c) {
c = null == c ? 0 : 0 > c ? Math.max(0, a.length + c) : c;
if (q(a))
return q(b) && 1 == b.length ? a.indexOf(b, c) : -1;
for (; c < a.length; c++)
if (c in a && a[c] === b)
return c;
return -1;
}, Ma = x.forEach ? function (a, b, c) {
x.forEach.call(a, b, c);
} : function (a, b, c) {
for (var d = a.length, e = q(a) ? a.split('') : a, f = 0; f < d; f++)
f in e && b.call(c, e[f], f, a);
}, Na = x.filter ? function (a, b, c) {
return x.filter.call(a, b, c);
} : function (a, b, c) {
for (var d = a.length, e = [], f = 0, g = q(a) ? a.split('') : a, k = 0; k < d; k++)
if (k in g) {
var m = g[k];
b.call(c, m, k, a) && (e[f++] = m);
}
return e;
}, Oa = x.map ? function (a, b, c) {
return x.map.call(a, b, c);
} : function (a, b, c) {
for (var d = a.length, e = Array(d), f = q(a) ? a.split('') : a, g = 0; g < d; g++)
g in f && (e[g] = b.call(c, f[g], g, a));
return e;
}, Pa = x.reduce ? function (a, b, c, d) {
for (var e = [], f = 1, g = arguments.length; f < g; f++)
e.push(arguments[f]);
d && (e[0] = u(b, d));
return x.reduce.apply(a, e);
} : function (a, b, c, d) {
var e = c;
Ma(a, function (c, g) {
e = b.call(d, e, c, g, a);
});
return e;
}, Qa = x.every ? function (a, b, c) {
return x.every.call(a, b, c);
} : function (a, b, c) {
for (var d = a.length, e = q(a) ? a.split('') : a, f = 0; f < d; f++)
if (f in e && !b.call(c, e[f], f, a))
return !1;
return !0;
};
function Ra(a, b) {
var c = Sa(a, b, void 0);
return 0 > c ? null : q(a) ? a.charAt(c) : a[c];
}
function Sa(a, b, c) {
for (var d = a.length, e = q(a) ? a.split('') : a, f = 0; f < d; f++)
if (f in e && b.call(c, e[f], f, a))
return f;
return -1;
}
function Ta(a, b) {
var c = La(a, b);
0 <= c && x.splice.call(a, c, 1);
}
function Ua(a, b, c) {
return 2 >= arguments.length ? x.slice.call(a, b) : x.slice.call(a, b, c);
}
function Va(a, b) {
a.sort(b || Wa);
}
function Wa(a, b) {
return a > b ? 1 : a < b ? -1 : 0;
}
;
function Xa(a) {
n.setTimeout(function () {
throw a;
}, 0);
}
var Ya;
function Za() {
var a = n.MessageChannel;
'undefined' === typeof a && 'undefined' !== typeof window && window.postMessage && window.addEventListener && -1 == w.indexOf('Presto') && (a = function () {
var a = document.createElement('iframe');
a.style.display = 'none';
a.src = '';
document.documentElement.appendChild(a);
var b = a.contentWindow, a = b.document;
a.open();
a.write('');
a.close();
var c = 'callImmediate' + Math.random(), d = 'file:' == b.location.protocol ? '*' : b.location.protocol + '//' + b.location.host, a = u(function (a) {
if (('*' == d || a.origin == d) && a.data == c)
this.port1.onmessage();
}, this);
b.addEventListener('message', a, !1);
this.port1 = {};
this.port2 = {
postMessage: function () {
b.postMessage(c, d);
}
};
});
if ('undefined' !== typeof a && -1 == w.indexOf('Trident') && -1 == w.indexOf('MSIE')) {
var b = new a(), c = {}, d = c;
b.port1.onmessage = function () {
if (p(c.next)) {
c = c.next;
var a = c.hb;
c.hb = null;
a();
}
};
return function (a) {
d.next = { hb: a };
d = d.next;
b.port2.postMessage(0);
};
}
return 'undefined' !== typeof document && 'onreadystatechange' in document.createElement('script') ? function (a) {
var b = document.createElement('script');
b.onreadystatechange = function () {
b.onreadystatechange = null;
b.parentNode.removeChild(b);
b = null;
a();
a = null;
};
document.documentElement.appendChild(b);
} : function (a) {
n.setTimeout(a, 0);
};
}
;
function $a(a, b) {
ab || bb();
cb || (ab(), cb = !0);
db.push(new eb(a, b));
}
var ab;
function bb() {
if (n.Promise && n.Promise.resolve) {
var a = n.Promise.resolve();
ab = function () {
a.then(fb);
};
} else
ab = function () {
var a = fb;
!r(n.setImmediate) || n.Window && n.Window.prototype && n.Window.prototype.setImmediate == n.setImmediate ? (Ya || (Ya = Za()), Ya(a)) : n.setImmediate(a);
};
}
var cb = !1, db = [];
[].push(function () {
cb = !1;
db = [];
});
function fb() {
for (; db.length;) {
var a = db;
db = [];
for (var b = 0; b < a.length; b++) {
var c = a[b];
try {
c.yg.call(c.scope);
} catch (d) {
Xa(d);
}
}
}
cb = !1;
}
function eb(a, b) {
this.yg = a;
this.scope = b;
}
;
var gb = -1 != w.indexOf('Opera') || -1 != w.indexOf('OPR'), hb = -1 != w.indexOf('Trident') || -1 != w.indexOf('MSIE'), ib = -1 != w.indexOf('Gecko') && -1 == w.toLowerCase().indexOf('webkit') && !(-1 != w.indexOf('Trident') || -1 != w.indexOf('MSIE')), jb = -1 != w.toLowerCase().indexOf('webkit');
(function () {
var a = '', b;
if (gb && n.opera)
return a = n.opera.version, r(a) ? a() : a;
ib ? b = /rv\:([^\);]+)(\)|;)/ : hb ? b = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/ : jb && (b = /WebKit\/(\S+)/);
b && (a = (a = b.exec(w)) ? a[1] : '');
return hb && (b = (b = n.document) ? b.documentMode : void 0, b > parseFloat(a)) ? String(b) : a;
}());
var kb = null, lb = null, mb = null;
function nb(a, b) {
if (!ea(a))
throw Error('encodeByteArray takes an array as a parameter');
ob();
for (var c = b ? lb : kb, d = [], e = 0; e < a.length; e += 3) {
var f = a[e], g = e + 1 < a.length, k = g ? a[e + 1] : 0, m = e + 2 < a.length, l = m ? a[e + 2] : 0, t = f >> 2, f = (f & 3) << 4 | k >> 4, k = (k & 15) << 2 | l >> 6, l = l & 63;
m || (l = 64, g || (k = 64));
d.push(c[t], c[f], c[k], c[l]);
}
return d.join('');
}
function ob() {
if (!kb) {
kb = {};
lb = {};
mb = {};
for (var a = 0; 65 > a; a++)
kb[a] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.charAt(a), lb[a] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.'.charAt(a), mb[lb[a]] = a, 62 <= a && (mb['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.charAt(a)] = a);
}
}
;
function pb(a, b) {
this.N = qb;
this.Rf = void 0;
this.Ba = this.Ha = null;
this.yd = this.ye = !1;
if (a == rb)
sb(this, tb, b);
else
try {
var c = this;
a.call(b, function (a) {
sb(c, tb, a);
}, function (a) {
if (!(a instanceof ub))
try {
if (a instanceof Error)
throw a;
throw Error('Promise rejected.');
} catch (b) {
}
sb(c, vb, a);
});
} catch (d) {
sb(this, vb, d);
}
}
var qb = 0, tb = 2, vb = 3;
function rb() {
}
pb.prototype.then = function (a, b, c) {
return wb(this, r(a) ? a : null, r(b) ? b : null, c);
};
pb.prototype.then = pb.prototype.then;
pb.prototype.$goog_Thenable = !0;
pb.prototype.cancel = function (a) {
this.N == qb && $a(function () {
var b = new ub(a);
xb(this, b);
}, this);
};
function xb(a, b) {
if (a.N == qb)
if (a.Ha) {
var c = a.Ha;
if (c.Ba) {
for (var d = 0, e = -1, f = 0, g; g = c.Ba[f]; f++)
if (g = g.o)
if (d++, g == a && (e = f), 0 <= e && 1 < d)
break;
0 <= e && (c.N == qb && 1 == d ? xb(c, b) : (d = c.Ba.splice(e, 1)[0], yb(c, d, vb, b)));
}
a.Ha = null;
} else
sb(a, vb, b);
}
function zb(a, b) {
a.Ba && a.Ba.length || a.N != tb && a.N != vb || Ab(a);
a.Ba || (a.Ba = []);
a.Ba.push(b);
}
function wb(a, b, c, d) {
var e = {
o: null,
Hf: null,
Jf: null
};
e.o = new pb(function (a, g) {
e.Hf = b ? function (c) {
try {
var e = b.call(d, c);
a(e);
} catch (l) {
g(l);
}
} : a;
e.Jf = c ? function (b) {
try {
var e = c.call(d, b);
!p(e) && b instanceof ub ? g(b) : a(e);
} catch (l) {
g(l);
}
} : g;
});
e.o.Ha = a;
zb(a, e);
return e.o;
}
pb.prototype.Yf = function (a) {
this.N = qb;
sb(this, tb, a);
};
pb.prototype.Zf = function (a) {
this.N = qb;
sb(this, vb, a);
};
function sb(a, b, c) {
if (a.N == qb) {
if (a == c)
b = vb, c = new TypeError('Promise cannot resolve to itself');
else {
var d;
if (c)
try {
d = !!c.$goog_Thenable;
} catch (e) {
d = !1;
}
else
d = !1;
if (d) {
a.N = 1;
c.then(a.Yf, a.Zf, a);
return;
}
if (ga(c))
try {
var f = c.then;
if (r(f)) {
Bb(a, c, f);
return;
}
} catch (g) {
b = vb, c = g;
}
}
a.Rf = c;
a.N = b;
a.Ha = null;
Ab(a);
b != vb || c instanceof ub || Cb(a, c);
}
}
function Bb(a, b, c) {
function d(b) {
f || (f = !0, a.Zf(b));
}
function e(b) {
f || (f = !0, a.Yf(b));
}
a.N = 1;
var f = !1;
try {
c.call(b, e, d);
} catch (g) {
d(g);
}
}
function Ab(a) {
a.ye || (a.ye = !0, $a(a.wg, a));
}
pb.prototype.wg = function () {
for (; this.Ba && this.Ba.length;) {
var a = this.Ba;
this.Ba = null;
for (var b = 0; b < a.length; b++)
yb(this, a[b], this.N, this.Rf);
}
this.ye = !1;
};
function yb(a, b, c, d) {
if (c == tb)
b.Hf(d);
else {
if (b.o)
for (; a && a.yd; a = a.Ha)
a.yd = !1;
b.Jf(d);
}
}
function Cb(a, b) {
a.yd = !0;
$a(function () {
a.yd && Db.call(null, b);
});
}
var Db = Xa;
function ub(a) {
la.call(this, a);
}
ka(ub, la);
ub.prototype.name = 'cancel';
var Eb = Eb || '2.4.0';
function y(a, b) {
return Object.prototype.hasOwnProperty.call(a, b);
}
function z(a, b) {
if (Object.prototype.hasOwnProperty.call(a, b))
return a[b];
}
function Fb(a, b) {
for (var c in a)
Object.prototype.hasOwnProperty.call(a, c) && b(c, a[c]);
}
function Gb(a) {
var b = {};
Fb(a, function (a, d) {
b[a] = d;
});
return b;
}
function Hb(a) {
return 'object' === typeof a && null !== a;
}
;
function Ib(a) {
var b = [];
Fb(a, function (a, d) {
da(d) ? Ma(d, function (d) {
b.push(encodeURIComponent(a) + '=' + encodeURIComponent(d));
}) : b.push(encodeURIComponent(a) + '=' + encodeURIComponent(d));
});
return b.length ? '&' + b.join('&') : '';
}
function Jb(a) {
var b = {};
a = a.replace(/^\?/, '').split('&');
Ma(a, function (a) {
a && (a = a.split('='), b[a[0]] = a[1]);
});
return b;
}
;
function Kb(a, b) {
if (!a)
throw Lb(b);
}
function Lb(a) {
return Error('Firebase (' + Eb + ') INTERNAL ASSERT FAILED: ' + a);
}
;
var Mb = n.Promise || pb;
function B() {
var a = this;
this.reject = this.resolve = null;
this.D = new Mb(function (b, c) {
a.resolve = b;
a.reject = c;
});
}
function C(a, b) {
return function (c, d) {
c ? a.reject(c) : a.resolve(d);
r(b) && (Nb(a.D), 1 === b.length ? b(c) : b(c, d));
};
}
function Nb(a) {
a.then(void 0, aa);
}
;
function Ob(a) {
for (var b = [], c = 0, d = 0; d < a.length; d++) {
var e = a.charCodeAt(d);
55296 <= e && 56319 >= e && (e -= 55296, d++, Kb(d < a.length, 'Surrogate pair missing trail surrogate.'), e = 65536 + (e << 10) + (a.charCodeAt(d) - 56320));
128 > e ? b[c++] = e : (2048 > e ? b[c++] = e >> 6 | 192 : (65536 > e ? b[c++] = e >> 12 | 224 : (b[c++] = e >> 18 | 240, b[c++] = e >> 12 & 63 | 128), b[c++] = e >> 6 & 63 | 128), b[c++] = e & 63 | 128);
}
return b;
}
function Pb(a) {
for (var b = 0, c = 0; c < a.length; c++) {
var d = a.charCodeAt(c);
128 > d ? b++ : 2048 > d ? b += 2 : 55296 <= d && 56319 >= d ? (b += 4, c++) : b += 3;
}
return b;
}
;
function D(a, b, c, d) {
var e;
d < b ? e = 'at least ' + b : d > c && (e = 0 === c ? 'none' : 'no more than ' + c);
if (e)
throw Error(a + ' failed: Was called with ' + d + (1 === d ? ' argument.' : ' arguments.') + ' Expects ' + e + '.');
}
function E(a, b, c) {
var d = '';
switch (b) {
case 1:
d = c ? 'first' : 'First';
break;
case 2:
d = c ? 'second' : 'Second';
break;
case 3:
d = c ? 'third' : 'Third';
break;
case 4:
d = c ? 'fourth' : 'Fourth';
break;
default:
throw Error('errorPrefix called with argumentNumber > 4.  Need to update it?');
}
return a = a + ' failed: ' + (d + ' argument ');
}
function F(a, b, c, d) {
if ((!d || p(c)) && !r(c))
throw Error(E(a, b, d) + 'must be a valid function.');
}
function Qb(a, b, c) {
if (p(c) && (!ga(c) || null === c))
throw Error(E(a, b, !0) + 'must be a valid context object.');
}
;
function Rb(a) {
return 'undefined' !== typeof JSON && p(JSON.parse) ? JSON.parse(a) : za(a);
}
function G(a) {
if ('undefined' !== typeof JSON && p(JSON.stringify))
a = JSON.stringify(a);
else {
var b = [];
Ba(new Aa(), a, b);
a = b.join('');
}
return a;
}
;
function Sb() {
this.Zd = H;
}
Sb.prototype.j = function (a) {
return this.Zd.S(a);
};
Sb.prototype.toString = function () {
return this.Zd.toString();
};
function Tb() {
}
Tb.prototype.uf = function () {
return null;
};
Tb.prototype.Ce = function () {
return null;
};
var Ub = new Tb();
function Vb(a, b, c) {
this.bg = a;
this.Oa = b;
this.Nd = c;
}
Vb.prototype.uf = function (a) {
var b = this.Oa.Q;
if (Wb(b, a))
return b.j().T(a);
b = null != this.Nd ? new Xb(this.Nd, !0, !1) : this.Oa.w();
return this.bg.Bc(a, b);
};
Vb.prototype.Ce = function (a, b, c) {
var d = null != this.Nd ? this.Nd : Yb(this.Oa);
a = this.bg.qe(d, b, 1, c, a);
return 0 === a.length ? null : a[0];
};
function Zb() {
this.xb = [];
}
function $b(a, b) {
for (var c = null, d = 0; d < b.length; d++) {
var e = b[d], f = e.cc();
null === c || f.ea(c.cc()) || (a.xb.push(c), c = null);
null === c && (c = new ac(f));
c.add(e);
}
c && a.xb.push(c);
}
function bc(a, b, c) {
$b(a, c);
cc(a, function (a) {
return a.ea(b);
});
}
function dc(a, b, c) {
$b(a, c);
cc(a, function (a) {
return a.contains(b) || b.contains(a);
});
}
function cc(a, b) {
for (var c = !0, d = 0; d < a.xb.length; d++) {
var e = a.xb[d];
if (e)
if (e = e.cc(), b(e)) {
for (var e = a.xb[d], f = 0; f < e.xd.length; f++) {
var g = e.xd[f];
if (null !== g) {
e.xd[f] = null;
var k = g.Zb();
ec && fc('event: ' + g.toString());
gc(k);
}
}
a.xb[d] = null;
} else
c = !1;
}
c && (a.xb = []);
}
function ac(a) {
this.ta = a;
this.xd = [];
}
ac.prototype.add = function (a) {
this.xd.push(a);
};
ac.prototype.cc = function () {
return this.ta;
};
function J(a, b, c, d) {
this.type = a;
this.Na = b;
this.Za = c;
this.Oe = d;
this.Td = void 0;
}
function hc(a) {
return new J(ic, a);
}
var ic = 'value';
function jc(a, b, c, d) {
this.xe = b;
this.be = c;
this.Td = d;
this.wd = a;
}
jc.prototype.cc = function () {
var a = this.be.Mb();
return 'value' === this.wd ? a.path : a.parent().path;
};
jc.prototype.De = function () {
return this.wd;
};
jc.prototype.Zb = function () {
return this.xe.Zb(this);
};
jc.prototype.toString = function () {
return this.cc().toString() + ':' + this.wd + ':' + G(this.be.qf());
};
function kc(a, b, c) {
this.xe = a;
this.error = b;
this.path = c;
}
kc.prototype.cc = function () {
return this.path;
};
kc.prototype.De = function () {
return 'cancel';
};
kc.prototype.Zb = function () {
return this.xe.Zb(this);
};
kc.prototype.toString = function () {
return this.path.toString() + ':cancel';
};
function Xb(a, b, c) {
this.A = a;
this.ga = b;
this.Yb = c;
}
function lc(a) {
return a.ga;
}
function mc(a) {
return a.Yb;
}
function nc(a, b) {
return b.e() ? a.ga && !a.Yb : Wb(a, K(b));
}
function Wb(a, b) {
return a.ga && !a.Yb || a.A.Fa(b);
}
Xb.prototype.j = function () {
return this.A;
};
function oc(a) {
this.pg = a;
this.Gd = null;
}
oc.prototype.get = function () {
var a = this.pg.get(), b = wa(a);
if (this.Gd)
for (var c in this.Gd)
b[c] -= this.Gd[c];
this.Gd = a;
return b;
};
function pc(a, b) {
this.Vf = {};
this.hd = new oc(a);
this.da = b;
var c = 10000 + 20000 * Math.random();
setTimeout(u(this.Of, this), Math.floor(c));
}
pc.prototype.Of = function () {
var a = this.hd.get(), b = {}, c = !1, d;
for (d in a)
0 < a[d] && y(this.Vf, d) && (b[d] = a[d], c = !0);
c && this.da.Ye(b);
setTimeout(u(this.Of, this), Math.floor(600000 * Math.random()));
};
function qc() {
this.Hc = {};
}
function rc(a, b, c) {
p(c) || (c = 1);
y(a.Hc, b) || (a.Hc[b] = 0);
a.Hc[b] += c;
}
qc.prototype.get = function () {
return wa(this.Hc);
};
var sc = {}, tc = {};
function uc(a) {
a = a.toString();
sc[a] || (sc[a] = new qc());
return sc[a];
}
function vc(a, b) {
var c = a.toString();
tc[c] || (tc[c] = b());
return tc[c];
}
;
function L(a, b) {
this.name = a;
this.U = b;
}
function wc(a, b) {
return new L(a, b);
}
;
function xc(a, b) {
return yc(a.name, b.name);
}
function zc(a, b) {
return yc(a, b);
}
;
function Ac(a, b, c) {
this.type = Bc;
this.source = a;
this.path = b;
this.Ja = c;
}
Ac.prototype.$c = function (a) {
return this.path.e() ? new Ac(this.source, M, this.Ja.T(a)) : new Ac(this.source, N(this.path), this.Ja);
};
Ac.prototype.toString = function () {
return 'Operation(' + this.path + ': ' + this.source.toString() + ' overwrite: ' + this.Ja.toString() + ')';
};
function Cc(a, b) {
this.type = Dc;
this.source = a;
this.path = b;
}
Cc.prototype.$c = function () {
return this.path.e() ? new Cc(this.source, M) : new Cc(this.source, N(this.path));
};
Cc.prototype.toString = function () {
return 'Operation(' + this.path + ': ' + this.source.toString() + ' listen_complete)';
};
function Ec(a, b) {
this.Pa = a;
this.xa = b ? b : Fc;
}
h = Ec.prototype;
h.Sa = function (a, b) {
return new Ec(this.Pa, this.xa.Sa(a, b, this.Pa).$(null, null, !1, null, null));
};
h.remove = function (a) {
return new Ec(this.Pa, this.xa.remove(a, this.Pa).$(null, null, !1, null, null));
};
h.get = function (a) {
for (var b, c = this.xa; !c.e();) {
b = this.Pa(a, c.key);
if (0 === b)
return c.value;
0 > b ? c = c.left : 0 < b && (c = c.right);
}
return null;
};
function Gc(a, b) {
for (var c, d = a.xa, e = null; !d.e();) {
c = a.Pa(b, d.key);
if (0 === c) {
if (d.left.e())
return e ? e.key : null;
for (d = d.left; !d.right.e();)
d = d.right;
return d.key;
}
0 > c ? d = d.left : 0 < c && (e = d, d = d.right);
}
throw Error('Attempted to find predecessor key for a nonexistent key.  What gives?');
}
h.e = function () {
return this.xa.e();
};
h.count = function () {
return this.xa.count();
};
h.Vc = function () {
return this.xa.Vc();
};
h.jc = function () {
return this.xa.jc();
};
h.ka = function (a) {
return this.xa.ka(a);
};
h.ac = function (a) {
return new Hc(this.xa, null, this.Pa, !1, a);
};
h.bc = function (a, b) {
return new Hc(this.xa, a, this.Pa, !1, b);
};
h.dc = function (a, b) {
return new Hc(this.xa, a, this.Pa, !0, b);
};
h.xf = function (a) {
return new Hc(this.xa, null, this.Pa, !0, a);
};
function Hc(a, b, c, d, e) {
this.Xd = e || null;
this.Je = d;
this.Ta = [];
for (e = 1; !a.e();)
if (e = b ? c(a.key, b) : 1, d && (e *= -1), 0 > e)
a = this.Je ? a.left : a.right;
else if (0 === e) {
this.Ta.push(a);
break;
} else
this.Ta.push(a), a = this.Je ? a.right : a.left;
}
function Ic(a) {
if (0 === a.Ta.length)
return null;
var b = a.Ta.pop(), c;
c = a.Xd ? a.Xd(b.key, b.value) : {
key: b.key,
value: b.value
};
if (a.Je)
for (b = b.left; !b.e();)
a.Ta.push(b), b = b.right;
else
for (b = b.right; !b.e();)
a.Ta.push(b), b = b.left;
return c;
}
function Jc(a) {
if (0 === a.Ta.length)
return null;
var b;
b = a.Ta;
b = b[b.length - 1];
return a.Xd ? a.Xd(b.key, b.value) : {
key: b.key,
value: b.value
};
}
function Kc(a, b, c, d, e) {
this.key = a;
this.value = b;
this.color = null != c ? c : !0;
this.left = null != d ? d : Fc;
this.right = null != e ? e : Fc;
}
h = Kc.prototype;
h.$ = function (a, b, c, d, e) {
return new Kc(null != a ? a : this.key, null != b ? b : this.value, null != c ? c : this.color, null != d ? d : this.left, null != e ? e : this.right);
};
h.count = function () {
return this.left.count() + 1 + this.right.count();
};
h.e = function () {
return !1;
};
h.ka = function (a) {
return this.left.ka(a) || a(this.key, this.value) || this.right.ka(a);
};
function Lc(a) {
return a.left.e() ? a : Lc(a.left);
}
h.Vc = function () {
return Lc(this).key;
};
h.jc = function () {
return this.right.e() ? this.key : this.right.jc();
};
h.Sa = function (a, b, c) {
var d, e;
e = this;
d = c(a, e.key);
e = 0 > d ? e.$(null, null, null, e.left.Sa(a, b, c), null) : 0 === d ? e.$(null, b, null, null, null) : e.$(null, null, null, null, e.right.Sa(a, b, c));
return Mc(e);
};
function Nc(a) {
if (a.left.e())
return Fc;
a.left.ha() || a.left.left.ha() || (a = Oc(a));
a = a.$(null, null, null, Nc(a.left), null);
return Mc(a);
}
h.remove = function (a, b) {
var c, d;
c = this;
if (0 > b(a, c.key))
c.left.e() || c.left.ha() || c.left.left.ha() || (c = Oc(c)), c = c.$(null, null, null, c.left.remove(a, b), null);
else {
c.left.ha() && (c = Pc(c));
c.right.e() || c.right.ha() || c.right.left.ha() || (c = Qc(c), c.left.left.ha() && (c = Pc(c), c = Qc(c)));
if (0 === b(a, c.key)) {
if (c.right.e())
return Fc;
d = Lc(c.right);
c = c.$(d.key, d.value, null, null, Nc(c.right));
}
c = c.$(null, null, null, null, c.right.remove(a, b));
}
return Mc(c);
};
h.ha = function () {
return this.color;
};
function Mc(a) {
a.right.ha() && !a.left.ha() && (a = Rc(a));
a.left.ha() && a.left.left.ha() && (a = Pc(a));
a.left.ha() && a.right.ha() && (a = Qc(a));
return a;
}
function Oc(a) {
a = Qc(a);
a.right.left.ha() && (a = a.$(null, null, null, null, Pc(a.right)), a = Rc(a), a = Qc(a));
return a;
}
function Rc(a) {
return a.right.$(null, null, a.color, a.$(null, null, !0, null, a.right.left), null);
}
function Pc(a) {
return a.left.$(null, null, a.color, null, a.$(null, null, !0, a.left.right, null));
}
function Qc(a) {
return a.$(null, null, !a.color, a.left.$(null, null, !a.left.color, null, null), a.right.$(null, null, !a.right.color, null, null));
}
function Sc() {
}
h = Sc.prototype;
h.$ = function () {
return this;
};
h.Sa = function (a, b) {
return new Kc(a, b, null);
};
h.remove = function () {
return this;
};
h.count = function () {
return 0;
};
h.e = function () {
return !0;
};
h.ka = function () {
return !1;
};
h.Vc = function () {
return null;
};
h.jc = function () {
return null;
};
h.ha = function () {
return !1;
};
var Fc = new Sc();
function Tc(a, b) {
return a && 'object' === typeof a ? (O('.sv' in a, 'Unexpected leaf node or priority contents'), b[a['.sv']]) : a;
}
function Uc(a, b) {
var c = new Vc();
Wc(a, new P(''), function (a, e) {
c.rc(a, Xc(e, b));
});
return c;
}
function Xc(a, b) {
var c = a.C().J(), c = Tc(c, b), d;
if (a.L()) {
var e = Tc(a.Ea(), b);
return e !== a.Ea() || c !== a.C().J() ? new Yc(e, Q(c)) : a;
}
d = a;
c !== a.C().J() && (d = d.ia(new Yc(c)));
a.R(R, function (a, c) {
var e = Xc(c, b);
e !== c && (d = d.W(a, e));
});
return d;
}
;
function Zc() {
this.Ac = {};
}
Zc.prototype.set = function (a, b) {
null == b ? delete this.Ac[a] : this.Ac[a] = b;
};
Zc.prototype.get = function (a) {
return y(this.Ac, a) ? this.Ac[a] : null;
};
Zc.prototype.remove = function (a) {
delete this.Ac[a];
};
Zc.prototype.Af = !0;
function $c(a) {
this.Ic = a;
this.Sd = 'firebase:';
}
h = $c.prototype;
h.set = function (a, b) {
null == b ? this.Ic.removeItem(this.Sd + a) : this.Ic.setItem(this.Sd + a, G(b));
};
h.get = function (a) {
a = this.Ic.getItem(this.Sd + a);
return null == a ? null : Rb(a);
};
h.remove = function (a) {
this.Ic.removeItem(this.Sd + a);
};
h.Af = !1;
h.toString = function () {
return this.Ic.toString();
};
function ad(a) {
try {
if ('undefined' !== typeof window && 'undefined' !== typeof window[a]) {
var b = window[a];
b.setItem('firebase:sentinel', 'cache');
b.removeItem('firebase:sentinel');
return new $c(b);
}
} catch (c) {
}
return new Zc();
}
var bd = ad('localStorage'), cd = ad('sessionStorage');
function dd(a, b, c, d, e) {
this.host = a.toLowerCase();
this.domain = this.host.substr(this.host.indexOf('.') + 1);
this.ob = b;
this.lc = c;
this.hh = d;
this.Rd = e || '';
this.ab = bd.get('host:' + a) || this.host;
}
function ed(a, b) {
b !== a.ab && (a.ab = b, 's-' === a.ab.substr(0, 2) && bd.set('host:' + a.host, a.ab));
}
function fd(a, b, c) {
O('string' === typeof b, 'typeof type must == string');
O('object' === typeof c, 'typeof params must == object');
if (b === gd)
b = (a.ob ? 'wss://' : 'ws://') + a.ab + '/.ws?';
else if (b === hd)
b = (a.ob ? 'https://' : 'http://') + a.ab + '/.lp?';
else
throw Error('Unknown connection type: ' + b);
a.host !== a.ab && (c.ns = a.lc);
var d = [];
v(c, function (a, b) {
d.push(b + '=' + a);
});
return b + d.join('&');
}
dd.prototype.toString = function () {
var a = (this.ob ? 'https://' : 'http://') + this.host;
this.Rd && (a += '<' + this.Rd + '>');
return a;
};
var id = function () {
var a = 1;
return function () {
return a++;
};
}(), O = Kb, jd = Lb;
function kd(a) {
try {
var b;
if ('undefined' !== typeof atob)
b = atob(a);
else {
ob();
for (var c = mb, d = [], e = 0; e < a.length;) {
var f = c[a.charAt(e++)], g = e < a.length ? c[a.charAt(e)] : 0;
++e;
var k = e < a.length ? c[a.charAt(e)] : 64;
++e;
var m = e < a.length ? c[a.charAt(e)] : 64;
++e;
if (null == f || null == g || null == k || null == m)
throw Error();
d.push(f << 2 | g >> 4);
64 != k && (d.push(g << 4 & 240 | k >> 2), 64 != m && d.push(k << 6 & 192 | m));
}
if (8192 > d.length)
b = String.fromCharCode.apply(null, d);
else {
a = '';
for (c = 0; c < d.length; c += 8192)
a += String.fromCharCode.apply(null, Ua(d, c, c + 8192));
b = a;
}
}
return b;
} catch (l) {
fc('base64Decode failed: ', l);
}
return null;
}
function ld(a) {
var b = Ob(a);
a = new Ja();
a.update(b);
var b = [], c = 8 * a.ge;
56 > a.ec ? a.update(a.Od, 56 - a.ec) : a.update(a.Od, a.Ya - (a.ec - 56));
for (var d = a.Ya - 1; 56 <= d; d--)
a.pe[d] = c & 255, c /= 256;
Ka(a, a.pe);
for (d = c = 0; 5 > d; d++)
for (var e = 24; 0 <= e; e -= 8)
b[c] = a.P[d] >> e & 255, ++c;
return nb(b);
}
function md(a) {
for (var b = '', c = 0; c < arguments.length; c++)
b = ea(arguments[c]) ? b + md.apply(null, arguments[c]) : 'object' === typeof arguments[c] ? b + G(arguments[c]) : b + arguments[c], b += ' ';
return b;
}
var ec = null, nd = !0;
function od(a, b) {
Kb(!b || !0 === a || !1 === a, 'Can\'t turn on custom loggers persistently.');
!0 === a ? ('undefined' !== typeof console && ('function' === typeof console.log ? ec = u(console.log, console) : 'object' === typeof console.log && (ec = function (a) {
console.log(a);
})), b && cd.set('logging_enabled', !0)) : r(a) ? ec = a : (ec = null, cd.remove('logging_enabled'));
}
function fc(a) {
!0 === nd && (nd = !1, null === ec && !0 === cd.get('logging_enabled') && od(!0));
if (ec) {
var b = md.apply(null, arguments);
ec(b);
}
}
function pd(a) {
return function () {
fc(a, arguments);
};
}
function qd(a) {
if ('undefined' !== typeof console) {
var b = 'FIREBASE INTERNAL ERROR: ' + md.apply(null, arguments);
'undefined' !== typeof console.error ? console.error(b) : console.log(b);
}
}
function rd(a) {
var b = md.apply(null, arguments);
throw Error('FIREBASE FATAL ERROR: ' + b);
}
function S(a) {
if ('undefined' !== typeof console) {
var b = 'FIREBASE WARNING: ' + md.apply(null, arguments);
'undefined' !== typeof console.warn ? console.warn(b) : console.log(b);
}
}
function sd(a) {
var b = '', c = '', d = '', e = '', f = !0, g = 'https', k = 443;
if (q(a)) {
var m = a.indexOf('//');
0 <= m && (g = a.substring(0, m - 1), a = a.substring(m + 2));
m = a.indexOf('/');
-1 === m && (m = a.length);
b = a.substring(0, m);
e = '';
a = a.substring(m).split('/');
for (m = 0; m < a.length; m++)
if (0 < a[m].length) {
var l = a[m];
try {
l = decodeURIComponent(l.replace(/\+/g, ' '));
} catch (t) {
}
e += '/' + l;
}
a = b.split('.');
3 === a.length ? (c = a[1], d = a[0].toLowerCase()) : 2 === a.length && (c = a[0]);
m = b.indexOf(':');
0 <= m && (f = 'https' === g || 'wss' === g, k = b.substring(m + 1), isFinite(k) && (k = String(k)), k = q(k) ? /^\s*-?0x/i.test(k) ? parseInt(k, 16) : parseInt(k, 10) : NaN);
}
return {
host: b,
port: k,
domain: c,
eh: d,
ob: f,
scheme: g,
bd: e
};
}
function td(a) {
return fa(a) && (a != a || a == Number.POSITIVE_INFINITY || a == Number.NEGATIVE_INFINITY);
}
function ud(a) {
if ('complete' === document.readyState)
a();
else {
var b = !1, c = function () {
document.body ? b || (b = !0, a()) : setTimeout(c, Math.floor(10));
};
document.addEventListener ? (document.addEventListener('DOMContentLoaded', c, !1), window.addEventListener('load', c, !1)) : document.attachEvent && (document.attachEvent('onreadystatechange', function () {
'complete' === document.readyState && c();
}), window.attachEvent('onload', c));
}
}
function yc(a, b) {
if (a === b)
return 0;
if ('[MIN_NAME]' === a || '[MAX_NAME]' === b)
return -1;
if ('[MIN_NAME]' === b || '[MAX_NAME]' === a)
return 1;
var c = vd(a), d = vd(b);
return null !== c ? null !== d ? 0 == c - d ? a.length - b.length : c - d : -1 : null !== d ? 1 : a < b ? -1 : 1;
}
function wd(a, b) {
if (b && a in b)
return b[a];
throw Error('Missing required key (' + a + ') in object: ' + G(b));
}
function xd(a) {
if ('object' !== typeof a || null === a)
return G(a);
var b = [], c;
for (c in a)
b.push(c);
b.sort();
c = '{';
for (var d = 0; d < b.length; d++)
0 !== d && (c += ','), c += G(b[d]), c += ':', c += xd(a[b[d]]);
return c + '}';
}
function yd(a, b) {
if (a.length <= b)
return [a];
for (var c = [], d = 0; d < a.length; d += b)
d + b > a ? c.push(a.substring(d, a.length)) : c.push(a.substring(d, d + b));
return c;
}
function zd(a, b) {
if (da(a))
for (var c = 0; c < a.length; ++c)
b(c, a[c]);
else
v(a, b);
}
function Ad(a) {
O(!td(a), 'Invalid JSON number');
var b, c, d, e;
0 === a ? (d = c = 0, b = -Infinity === 1 / a ? 1 : 0) : (b = 0 > a, a = Math.abs(a), a >= Math.pow(2, -1022) ? (d = Math.min(Math.floor(Math.log(a) / Math.LN2), 1023), c = d + 1023, d = Math.round(a * Math.pow(2, 52 - d) - Math.pow(2, 52))) : (c = 0, d = Math.round(a / Math.pow(2, -1074))));
e = [];
for (a = 52; a; --a)
e.push(d % 2 ? 1 : 0), d = Math.floor(d / 2);
for (a = 11; a; --a)
e.push(c % 2 ? 1 : 0), c = Math.floor(c / 2);
e.push(b ? 1 : 0);
e.reverse();
b = e.join('');
c = '';
for (a = 0; 64 > a; a += 8)
d = parseInt(b.substr(a, 8), 2).toString(16), 1 === d.length && (d = '0' + d), c += d;
return c.toLowerCase();
}
var Bd = /^-?\d{1,10}$/;
function vd(a) {
return Bd.test(a) && (a = Number(a), -2147483648 <= a && 2147483647 >= a) ? a : null;
}
function gc(a) {
try {
a();
} catch (b) {
setTimeout(function () {
S('Exception was thrown by user callback.', b.stack || '');
throw b;
}, Math.floor(0));
}
}
function T(a, b) {
if (r(a)) {
var c = Array.prototype.slice.call(arguments, 1).slice();
gc(function () {
a.apply(null, c);
});
}
}
;
function Cd(a) {
var b = {}, c = {}, d = {}, e = '';
try {
var f = a.split('.'), b = Rb(kd(f[0]) || ''), c = Rb(kd(f[1]) || ''), e = f[2], d = c.d || {};
delete c.d;
} catch (g) {
}
return {
kh: b,
Ec: c,
data: d,
ah: e
};
}
function Dd(a) {
a = Cd(a).Ec;
return 'object' === typeof a && a.hasOwnProperty('iat') ? z(a, 'iat') : null;
}
function Ed(a) {
a = Cd(a);
var b = a.Ec;
return !!a.ah && !!b && 'object' === typeof b && b.hasOwnProperty('iat');
}
;
function Fd(a) {
this.Y = a;
this.g = a.n.g;
}
function Gd(a, b, c, d) {
var e = [], f = [];
Ma(b, function (b) {
'child_changed' === b.type && a.g.Dd(b.Oe, b.Na) && f.push(new J('child_moved', b.Na, b.Za));
});
Hd(a, e, 'child_removed', b, d, c);
Hd(a, e, 'child_added', b, d, c);
Hd(a, e, 'child_moved', f, d, c);
Hd(a, e, 'child_changed', b, d, c);
Hd(a, e, ic, b, d, c);
return e;
}
function Hd(a, b, c, d, e, f) {
d = Na(d, function (a) {
return a.type === c;
});
Va(d, u(a.qg, a));
Ma(d, function (c) {
var d = Id(a, c, f);
Ma(e, function (e) {
e.Qf(c.type) && b.push(e.createEvent(d, a.Y));
});
});
}
function Id(a, b, c) {
'value' !== b.type && 'child_removed' !== b.type && (b.Td = c.wf(b.Za, b.Na, a.g));
return b;
}
Fd.prototype.qg = function (a, b) {
if (null == a.Za || null == b.Za)
throw jd('Should only compare child_ events.');
return this.g.compare(new L(a.Za, a.Na), new L(b.Za, b.Na));
};
function Jd() {
this.ib = {};
}
function Kd(a, b) {
var c = b.type, d = b.Za;
O('child_added' == c || 'child_changed' == c || 'child_removed' == c, 'Only child changes supported for tracking');
O('.priority' !== d, 'Only non-priority child changes can be tracked.');
var e = z(a.ib, d);
if (e) {
var f = e.type;
if ('child_added' == c && 'child_removed' == f)
a.ib[d] = new J('child_changed', b.Na, d, e.Na);
else if ('child_removed' == c && 'child_added' == f)
delete a.ib[d];
else if ('child_removed' == c && 'child_changed' == f)
a.ib[d] = new J('child_removed', e.Oe, d);
else if ('child_changed' == c && 'child_added' == f)
a.ib[d] = new J('child_added', b.Na, d);
else if ('child_changed' == c && 'child_changed' == f)
a.ib[d] = new J('child_changed', b.Na, d, e.Oe);
else
throw jd('Illegal combination of changes: ' + b + ' occurred after ' + e);
} else
a.ib[d] = b;
}
;
function Ld(a) {
this.g = a;
}
h = Ld.prototype;
h.H = function (a, b, c, d, e, f) {
O(a.Mc(this.g), 'A node must be indexed if only a child is updated');
e = a.T(b);
if (e.S(d).ea(c.S(d)) && e.e() == c.e())
return a;
null != f && (c.e() ? a.Fa(b) ? Kd(f, new J('child_removed', e, b)) : O(a.L(), 'A child remove without an old child only makes sense on a leaf node') : e.e() ? Kd(f, new J('child_added', c, b)) : Kd(f, new J('child_changed', c, b, e)));
return a.L() && c.e() ? a : a.W(b, c).pb(this.g);
};
h.ya = function (a, b, c) {
null != c && (a.L() || a.R(R, function (a, e) {
b.Fa(a) || Kd(c, new J('child_removed', e, a));
}), b.L() || b.R(R, function (b, e) {
if (a.Fa(b)) {
var f = a.T(b);
f.ea(e) || Kd(c, new J('child_changed', e, b, f));
} else
Kd(c, new J('child_added', e, b));
}));
return b.pb(this.g);
};
h.ia = function (a, b) {
return a.e() ? H : a.ia(b);
};
h.Ra = function () {
return !1;
};
h.$b = function () {
return this;
};
function Md(a) {
this.Fe = new Ld(a.g);
this.g = a.g;
var b;
a.oa ? (b = Nd(a), b = a.g.Sc(Od(a), b)) : b = a.g.Wc();
this.gd = b;
a.ra ? (b = Pd(a), a = a.g.Sc(Rd(a), b)) : a = a.g.Tc();
this.Jc = a;
}
h = Md.prototype;
h.matches = function (a) {
return 0 >= this.g.compare(this.gd, a) && 0 >= this.g.compare(a, this.Jc);
};
h.H = function (a, b, c, d, e, f) {
this.matches(new L(b, c)) || (c = H);
return this.Fe.H(a, b, c, d, e, f);
};
h.ya = function (a, b, c) {
b.L() && (b = H);
var d = b.pb(this.g), d = d.ia(H), e = this;
b.R(R, function (a, b) {
e.matches(new L(a, b)) || (d = d.W(a, H));
});
return this.Fe.ya(a, d, c);
};
h.ia = function (a) {
return a;
};
h.Ra = function () {
return !0;
};
h.$b = function () {
return this.Fe;
};
function Sd(a) {
this.ua = new Md(a);
this.g = a.g;
O(a.la, 'Only valid if limit has been set');
this.ma = a.ma;
this.Nb = !Td(a);
}
h = Sd.prototype;
h.H = function (a, b, c, d, e, f) {
this.ua.matches(new L(b, c)) || (c = H);
return a.T(b).ea(c) ? a : a.Hb() < this.ma ? this.ua.$b().H(a, b, c, d, e, f) : Ud(this, a, b, c, e, f);
};
h.ya = function (a, b, c) {
var d;
if (b.L() || b.e())
d = H.pb(this.g);
else if (2 * this.ma < b.Hb() && b.Mc(this.g)) {
d = H.pb(this.g);
b = this.Nb ? b.dc(this.ua.Jc, this.g) : b.bc(this.ua.gd, this.g);
for (var e = 0; 0 < b.Ta.length && e < this.ma;) {
var f = Ic(b), g;
if (g = this.Nb ? 0 >= this.g.compare(this.ua.gd, f) : 0 >= this.g.compare(f, this.ua.Jc))
d = d.W(f.name, f.U), e++;
else
break;
}
} else {
d = b.pb(this.g);
d = d.ia(H);
var k, m, l;
if (this.Nb) {
b = d.xf(this.g);
k = this.ua.Jc;
m = this.ua.gd;
var t = Vd(this.g);
l = function (a, b) {
return t(b, a);
};
} else
b = d.ac(this.g), k = this.ua.gd, m = this.ua.Jc, l = Vd(this.g);
for (var e = 0, A = !1; 0 < b.Ta.length;)
f = Ic(b), !A && 0 >= l(k, f) && (A = !0), (g = A && e < this.ma && 0 >= l(f, m)) ? e++ : d = d.W(f.name, H);
}
return this.ua.$b().ya(a, d, c);
};
h.ia = function (a) {
return a;
};
h.Ra = function () {
return !0;
};
h.$b = function () {
return this.ua.$b();
};
function Ud(a, b, c, d, e, f) {
var g;
if (a.Nb) {
var k = Vd(a.g);
g = function (a, b) {
return k(b, a);
};
} else
g = Vd(a.g);
O(b.Hb() == a.ma, '');
var m = new L(c, d), l = a.Nb ? Wd(b, a.g) : Xd(b, a.g), t = a.ua.matches(m);
if (b.Fa(c)) {
for (var A = b.T(c), l = e.Ce(a.g, l, a.Nb); null != l && (l.name == c || b.Fa(l.name));)
l = e.Ce(a.g, l, a.Nb);
e = null == l ? 1 : g(l, m);
if (t && !d.e() && 0 <= e)
return null != f && Kd(f, new J('child_changed', d, c, A)), b.W(c, d);
null != f && Kd(f, new J('child_removed', A, c));
b = b.W(c, H);
return null != l && a.ua.matches(l) ? (null != f && Kd(f, new J('child_added', l.U, l.name)), b.W(l.name, l.U)) : b;
}
return d.e() ? b : t && 0 <= g(l, m) ? (null != f && (Kd(f, new J('child_removed', l.U, l.name)), Kd(f, new J('child_added', d, c))), b.W(c, d).W(l.name, H)) : b;
}
;
function Yd(a, b) {
this.me = a;
this.og = b;
}
function Zd(a) {
this.X = a;
}
Zd.prototype.gb = function (a, b, c, d) {
var e = new Jd(), f;
if (b.type === Bc)
b.source.Ae ? c = $d(this, a, b.path, b.Ja, c, d, e) : (O(b.source.tf, 'Unknown source.'), f = b.source.ef || mc(a.w()) && !b.path.e(), c = ae(this, a, b.path, b.Ja, c, d, f, e));
else if (b.type === be)
b.source.Ae ? c = ce(this, a, b.path, b.children, c, d, e) : (O(b.source.tf, 'Unknown source.'), f = b.source.ef || mc(a.w()), c = de(this, a, b.path, b.children, c, d, f, e));
else if (b.type === ee)
if (b.Yd)
if (b = b.path, null != c.xc(b))
c = a;
else {
f = new Vb(c, a, d);
d = a.Q.j();
if (b.e() || '.priority' === K(b))
lc(a.w()) ? b = c.Aa(Yb(a)) : (b = a.w().j(), O(b instanceof fe, 'serverChildren would be complete if leaf node'), b = c.Cc(b)), b = this.X.ya(d, b, e);
else {
var g = K(b), k = c.Bc(g, a.w());
null == k && Wb(a.w(), g) && (k = d.T(g));
b = null != k ? this.X.H(d, g, k, N(b), f, e) : a.Q.j().Fa(g) ? this.X.H(d, g, H, N(b), f, e) : d;
b.e() && lc(a.w()) && (d = c.Aa(Yb(a)), d.L() && (b = this.X.ya(b, d, e)));
}
d = lc(a.w()) || null != c.xc(M);
c = ge(a, b, d, this.X.Ra());
}
else
c = he(this, a, b.path, b.Ub, c, d, e);
else if (b.type === Dc)
d = b.path, b = a.w(), f = b.j(), g = b.ga || d.e(), c = ie(this, new je(a.Q, new Xb(f, g, b.Yb)), d, c, Ub, e);
else
throw jd('Unknown operation type: ' + b.type);
e = qa(e.ib);
d = c;
b = d.Q;
b.ga && (f = b.j().L() || b.j().e(), g = ke(a), (0 < e.length || !a.Q.ga || f && !b.j().ea(g) || !b.j().C().ea(g.C())) && e.push(hc(ke(d))));
return new Yd(c, e);
};
function ie(a, b, c, d, e, f) {
var g = b.Q;
if (null != d.xc(c))
return b;
var k;
if (c.e())
O(lc(b.w()), 'If change path is empty, we must have complete server data'), mc(b.w()) ? (e = Yb(b), d = d.Cc(e instanceof fe ? e : H)) : d = d.Aa(Yb(b)), f = a.X.ya(b.Q.j(), d, f);
else {
var m = K(c);
if ('.priority' == m)
O(1 == le(c), 'Can\'t have a priority with additional path components'), f = g.j(), k = b.w().j(), d = d.nd(c, f, k), f = null != d ? a.X.ia(f, d) : g.j();
else {
var l = N(c);
Wb(g, m) ? (k = b.w().j(), d = d.nd(c, g.j(), k), d = null != d ? g.j().T(m).H(l, d) : g.j().T(m)) : d = d.Bc(m, b.w());
f = null != d ? a.X.H(g.j(), m, d, l, e, f) : g.j();
}
}
return ge(b, f, g.ga || c.e(), a.X.Ra());
}
function ae(a, b, c, d, e, f, g, k) {
var m = b.w();
g = g ? a.X : a.X.$b();
if (c.e())
d = g.ya(m.j(), d, null);
else if (g.Ra() && !m.Yb)
d = m.j().H(c, d), d = g.ya(m.j(), d, null);
else {
var l = K(c);
if (!nc(m, c) && 1 < le(c))
return b;
var t = N(c);
d = m.j().T(l).H(t, d);
d = '.priority' == l ? g.ia(m.j(), d) : g.H(m.j(), l, d, t, Ub, null);
}
m = m.ga || c.e();
b = new je(b.Q, new Xb(d, m, g.Ra()));
return ie(a, b, c, e, new Vb(e, b, f), k);
}
function $d(a, b, c, d, e, f, g) {
var k = b.Q;
e = new Vb(e, b, f);
if (c.e())
g = a.X.ya(b.Q.j(), d, g), a = ge(b, g, !0, a.X.Ra());
else if (f = K(c), '.priority' === f)
g = a.X.ia(b.Q.j(), d), a = ge(b, g, k.ga, k.Yb);
else {
c = N(c);
var m = k.j().T(f);
if (!c.e()) {
var l = e.uf(f);
d = null != l ? '.priority' === me(c) && l.S(c.parent()).e() ? l : l.H(c, d) : H;
}
m.ea(d) ? a = b : (g = a.X.H(k.j(), f, d, c, e, g), a = ge(b, g, k.ga, a.X.Ra()));
}
return a;
}
function ce(a, b, c, d, e, f, g) {
var k = b;
ne(d, function (d, l) {
var t = c.o(d);
Wb(b.Q, K(t)) && (k = $d(a, k, t, l, e, f, g));
});
ne(d, function (d, l) {
var t = c.o(d);
Wb(b.Q, K(t)) || (k = $d(a, k, t, l, e, f, g));
});
return k;
}
function oe(a, b) {
ne(b, function (b, d) {
a = a.H(b, d);
});
return a;
}
function de(a, b, c, d, e, f, g, k) {
if (b.w().j().e() && !lc(b.w()))
return b;
var m = b;
c = c.e() ? d : pe(qe, c, d);
var l = b.w().j();
c.children.ka(function (c, d) {
if (l.Fa(c)) {
var I = b.w().j().T(c), I = oe(I, d);
m = ae(a, m, new P(c), I, e, f, g, k);
}
});
c.children.ka(function (c, d) {
var I = !Wb(b.w(), c) && null == d.value;
l.Fa(c) || I || (I = b.w().j().T(c), I = oe(I, d), m = ae(a, m, new P(c), I, e, f, g, k));
});
return m;
}
function he(a, b, c, d, e, f, g) {
if (null != e.xc(c))
return b;
var k = mc(b.w()), m = b.w();
if (null != d.value) {
if (c.e() && m.ga || nc(m, c))
return ae(a, b, c, m.j().S(c), e, f, k, g);
if (c.e()) {
var l = qe;
m.j().R(re, function (a, b) {
l = l.set(new P(a), b);
});
return de(a, b, c, l, e, f, k, g);
}
return b;
}
l = qe;
ne(d, function (a) {
var b = c.o(a);
nc(m, b) && (l = l.set(a, m.j().S(b)));
});
return de(a, b, c, l, e, f, k, g);
}
;
function se() {
}
var te = {};
function Vd(a) {
return u(a.compare, a);
}
se.prototype.Dd = function (a, b) {
return 0 !== this.compare(new L('[MIN_NAME]', a), new L('[MIN_NAME]', b));
};
se.prototype.Wc = function () {
return ue;
};
function ve(a) {
O(!a.e() && '.priority' !== K(a), 'Can\'t create PathIndex with empty path or .priority key');
this.gc = a;
}
ka(ve, se);
h = ve.prototype;
h.Lc = function (a) {
return !a.S(this.gc).e();
};
h.compare = function (a, b) {
var c = a.U.S(this.gc), d = b.U.S(this.gc), c = c.Gc(d);
return 0 === c ? yc(a.name, b.name) : c;
};
h.Sc = function (a, b) {
var c = Q(a), c = H.H(this.gc, c);
return new L(b, c);
};
h.Tc = function () {
var a = H.H(this.gc, we);
return new L('[MAX_NAME]', a);
};
h.toString = function () {
return this.gc.slice().join('/');
};
function xe() {
}
ka(xe, se);
h = xe.prototype;
h.compare = function (a, b) {
var c = a.U.C(), d = b.U.C(), c = c.Gc(d);
return 0 === c ? yc(a.name, b.name) : c;
};
h.Lc = function (a) {
return !a.C().e();
};
h.Dd = function (a, b) {
return !a.C().ea(b.C());
};
h.Wc = function () {
return ue;
};
h.Tc = function () {
return new L('[MAX_NAME]', new Yc('[PRIORITY-POST]', we));
};
h.Sc = function (a, b) {
var c = Q(a);
return new L(b, new Yc('[PRIORITY-POST]', c));
};
h.toString = function () {
return '.priority';
};
var R = new xe();
function ye() {
}
ka(ye, se);
h = ye.prototype;
h.compare = function (a, b) {
return yc(a.name, b.name);
};
h.Lc = function () {
throw jd('KeyIndex.isDefinedOn not expected to be called.');
};
h.Dd = function () {
return !1;
};
h.Wc = function () {
return ue;
};
h.Tc = function () {
return new L('[MAX_NAME]', H);
};
h.Sc = function (a) {
O(q(a), 'KeyIndex indexValue must always be a string.');
return new L(a, H);
};
h.toString = function () {
return '.key';
};
var re = new ye();
function ze() {
}
ka(ze, se);
h = ze.prototype;
h.compare = function (a, b) {
var c = a.U.Gc(b.U);
return 0 === c ? yc(a.name, b.name) : c;
};
h.Lc = function () {
return !0;
};
h.Dd = function (a, b) {
return !a.ea(b);
};
h.Wc = function () {
return ue;
};
h.Tc = function () {
return Ae;
};
h.Sc = function (a, b) {
var c = Q(a);
return new L(b, c);
};
h.toString = function () {
return '.value';
};
var Be = new ze();
function Ce() {
this.Xb = this.ra = this.Pb = this.oa = this.la = !1;
this.ma = 0;
this.Rb = '';
this.ic = null;
this.Bb = '';
this.fc = null;
this.zb = '';
this.g = R;
}
var De = new Ce();
function Td(a) {
return '' === a.Rb ? a.oa : 'l' === a.Rb;
}
function Od(a) {
O(a.oa, 'Only valid if start has been set');
return a.ic;
}
function Nd(a) {
O(a.oa, 'Only valid if start has been set');
return a.Pb ? a.Bb : '[MIN_NAME]';
}
function Rd(a) {
O(a.ra, 'Only valid if end has been set');
return a.fc;
}
function Pd(a) {
O(a.ra, 'Only valid if end has been set');
return a.Xb ? a.zb : '[MAX_NAME]';
}
function Ee(a) {
var b = new Ce();
b.la = a.la;
b.ma = a.ma;
b.oa = a.oa;
b.ic = a.ic;
b.Pb = a.Pb;
b.Bb = a.Bb;
b.ra = a.ra;
b.fc = a.fc;
b.Xb = a.Xb;
b.zb = a.zb;
b.g = a.g;
return b;
}
h = Ce.prototype;
h.Le = function (a) {
var b = Ee(this);
b.la = !0;
b.ma = a;
b.Rb = '';
return b;
};
h.Me = function (a) {
var b = Ee(this);
b.la = !0;
b.ma = a;
b.Rb = 'l';
return b;
};
h.Ne = function (a) {
var b = Ee(this);
b.la = !0;
b.ma = a;
b.Rb = 'r';
return b;
};
h.ce = function (a, b) {
var c = Ee(this);
c.oa = !0;
p(a) || (a = null);
c.ic = a;
null != b ? (c.Pb = !0, c.Bb = b) : (c.Pb = !1, c.Bb = '');
return c;
};
h.vd = function (a, b) {
var c = Ee(this);
c.ra = !0;
p(a) || (a = null);
c.fc = a;
p(b) ? (c.Xb = !0, c.zb = b) : (c.mh = !1, c.zb = '');
return c;
};
function Fe(a, b) {
var c = Ee(a);
c.g = b;
return c;
}
function Ge(a) {
var b = {};
a.oa && (b.sp = a.ic, a.Pb && (b.sn = a.Bb));
a.ra && (b.ep = a.fc, a.Xb && (b.en = a.zb));
if (a.la) {
b.l = a.ma;
var c = a.Rb;
'' === c && (c = Td(a) ? 'l' : 'r');
b.vf = c;
}
a.g !== R && (b.i = a.g.toString());
return b;
}
function He(a) {
return !(a.oa || a.ra || a.la);
}
function Ie(a) {
return He(a) && a.g == R;
}
function Je(a) {
var b = {};
if (Ie(a))
return b;
var c;
a.g === R ? c = '$priority' : a.g === Be ? c = '$value' : a.g === re ? c = '$key' : (O(a.g instanceof ve, 'Unrecognized index type!'), c = a.g.toString());
b.orderBy = G(c);
a.oa && (b.startAt = G(a.ic), a.Pb && (b.startAt += ',' + G(a.Bb)));
a.ra && (b.endAt = G(a.fc), a.Xb && (b.endAt += ',' + G(a.zb)));
a.la && (Td(a) ? b.limitToFirst = a.ma : b.limitToLast = a.ma);
return b;
}
h.toString = function () {
return G(Ge(this));
};
function Ke(a, b) {
this.Ed = a;
this.hc = b;
}
Ke.prototype.get = function (a) {
var b = z(this.Ed, a);
if (!b)
throw Error('No index defined for ' + a);
return b === te ? null : b;
};
function Le(a, b, c) {
var d = ma(a.Ed, function (d, f) {
var g = z(a.hc, f);
O(g, 'Missing index implementation for ' + f);
if (d === te) {
if (g.Lc(b.U)) {
for (var k = [], m = c.ac(wc), l = Ic(m); l;)
l.name != b.name && k.push(l), l = Ic(m);
k.push(b);
return Me(k, Vd(g));
}
return te;
}
g = c.get(b.name);
k = d;
g && (k = k.remove(new L(b.name, g)));
return k.Sa(b, b.U);
});
return new Ke(d, a.hc);
}
function Ne(a, b, c) {
var d = ma(a.Ed, function (a) {
if (a === te)
return a;
var d = c.get(b.name);
return d ? a.remove(new L(b.name, d)) : a;
});
return new Ke(d, a.hc);
}
var Oe = new Ke({ '.priority': te }, { '.priority': R });
function Yc(a, b) {
this.B = a;
O(p(this.B) && null !== this.B, 'LeafNode shouldn\'t be created with null/undefined value.');
this.ca = b || H;
Pe(this.ca);
this.Gb = null;
}
var Qe = [
'object',
'boolean',
'number',
'string'
];
h = Yc.prototype;
h.L = function () {
return !0;
};
h.C = function () {
return this.ca;
};
h.ia = function (a) {
return new Yc(this.B, a);
};
h.T = function (a) {
return '.priority' === a ? this.ca : H;
};
h.S = function (a) {
return a.e() ? this : '.priority' === K(a) ? this.ca : H;
};
h.Fa = function () {
return !1;
};
h.wf = function () {
return null;
};
h.W = function (a, b) {
return '.priority' === a ? this.ia(b) : b.e() && '.priority' !== a ? this : H.W(a, b).ia(this.ca);
};
h.H = function (a, b) {
var c = K(a);
if (null === c)
return b;
if (b.e() && '.priority' !== c)
return this;
O('.priority' !== c || 1 === le(a), '.priority must be the last token in a path');
return this.W(c, H.H(N(a), b));
};
h.e = function () {
return !1;
};
h.Hb = function () {
return 0;
};
h.R = function () {
return !1;
};
h.J = function (a) {
return a && !this.C().e() ? {
'.value': this.Ea(),
'.priority': this.C().J()
} : this.Ea();
};
h.hash = function () {
if (null === this.Gb) {
var a = '';
this.ca.e() || (a += 'priority:' + Re(this.ca.J()) + ':');
var b = typeof this.B, a = a + (b + ':'), a = 'number' === b ? a + Ad(this.B) : a + this.B;
this.Gb = ld(a);
}
return this.Gb;
};
h.Ea = function () {
return this.B;
};
h.Gc = function (a) {
if (a === H)
return 1;
if (a instanceof fe)
return -1;
O(a.L(), 'Unknown node type');
var b = typeof a.B, c = typeof this.B, d = La(Qe, b), e = La(Qe, c);
O(0 <= d, 'Unknown leaf type: ' + b);
O(0 <= e, 'Unknown leaf type: ' + c);
return d === e ? 'object' === c ? 0 : this.B < a.B ? -1 : this.B === a.B ? 0 : 1 : e - d;
};
h.pb = function () {
return this;
};
h.Mc = function () {
return !0;
};
h.ea = function (a) {
return a === this ? !0 : a.L() ? this.B === a.B && this.ca.ea(a.ca) : !1;
};
h.toString = function () {
return G(this.J(!0));
};
function fe(a, b, c) {
this.m = a;
(this.ca = b) && Pe(this.ca);
a.e() && O(!this.ca || this.ca.e(), 'An empty node cannot have a priority');
this.Ab = c;
this.Gb = null;
}
h = fe.prototype;
h.L = function () {
return !1;
};
h.C = function () {
return this.ca || H;
};
h.ia = function (a) {
return this.m.e() ? this : new fe(this.m, a, this.Ab);
};
h.T = function (a) {
if ('.priority' === a)
return this.C();
a = this.m.get(a);
return null === a ? H : a;
};
h.S = function (a) {
var b = K(a);
return null === b ? this : this.T(b).S(N(a));
};
h.Fa = function (a) {
return null !== this.m.get(a);
};
h.W = function (a, b) {
O(b, 'We should always be passing snapshot nodes');
if ('.priority' === a)
return this.ia(b);
var c = new L(a, b), d, e;
b.e() ? (d = this.m.remove(a), c = Ne(this.Ab, c, this.m)) : (d = this.m.Sa(a, b), c = Le(this.Ab, c, this.m));
e = d.e() ? H : this.ca;
return new fe(d, e, c);
};
h.H = function (a, b) {
var c = K(a);
if (null === c)
return b;
O('.priority' !== K(a) || 1 === le(a), '.priority must be the last token in a path');
var d = this.T(c).H(N(a), b);
return this.W(c, d);
};
h.e = function () {
return this.m.e();
};
h.Hb = function () {
return this.m.count();
};
var Se = /^(0|[1-9]\d*)$/;
h = fe.prototype;
h.J = function (a) {
if (this.e())
return null;
var b = {}, c = 0, d = 0, e = !0;
this.R(R, function (f, g) {
b[f] = g.J(a);
c++;
e && Se.test(f) ? d = Math.max(d, Number(f)) : e = !1;
});
if (!a && e && d < 2 * c) {
var f = [], g;
for (g in b)
f[g] = b[g];
return f;
}
a && !this.C().e() && (b['.priority'] = this.C().J());
return b;
};
h.hash = function () {
if (null === this.Gb) {
var a = '';
this.C().e() || (a += 'priority:' + Re(this.C().J()) + ':');
this.R(R, function (b, c) {
var d = c.hash();
'' !== d && (a += ':' + b + ':' + d);
});
this.Gb = '' === a ? '' : ld(a);
}
return this.Gb;
};
h.wf = function (a, b, c) {
return (c = Te(this, c)) ? (a = Gc(c, new L(a, b))) ? a.name : null : Gc(this.m, a);
};
function Wd(a, b) {
var c;
c = (c = Te(a, b)) ? (c = c.Vc()) && c.name : a.m.Vc();
return c ? new L(c, a.m.get(c)) : null;
}
function Xd(a, b) {
var c;
c = (c = Te(a, b)) ? (c = c.jc()) && c.name : a.m.jc();
return c ? new L(c, a.m.get(c)) : null;
}
h.R = function (a, b) {
var c = Te(this, a);
return c ? c.ka(function (a) {
return b(a.name, a.U);
}) : this.m.ka(b);
};
h.ac = function (a) {
return this.bc(a.Wc(), a);
};
h.bc = function (a, b) {
var c = Te(this, b);
if (c)
return c.bc(a, function (a) {
return a;
});
for (var c = this.m.bc(a.name, wc), d = Jc(c); null != d && 0 > b.compare(d, a);)
Ic(c), d = Jc(c);
return c;
};
h.xf = function (a) {
return this.dc(a.Tc(), a);
};
h.dc = function (a, b) {
var c = Te(this, b);
if (c)
return c.dc(a, function (a) {
return a;
});
for (var c = this.m.dc(a.name, wc), d = Jc(c); null != d && 0 < b.compare(d, a);)
Ic(c), d = Jc(c);
return c;
};
h.Gc = function (a) {
return this.e() ? a.e() ? 0 : -1 : a.L() || a.e() ? 1 : a === we ? -1 : 0;
};
h.pb = function (a) {
if (a === re || sa(this.Ab.hc, a.toString()))
return this;
var b = this.Ab, c = this.m;
O(a !== re, 'KeyIndex always exists and isn\'t meant to be added to the IndexMap.');
for (var d = [], e = !1, c = c.ac(wc), f = Ic(c); f;)
e = e || a.Lc(f.U), d.push(f), f = Ic(c);
d = e ? Me(d, Vd(a)) : te;
e = a.toString();
c = wa(b.hc);
c[e] = a;
a = wa(b.Ed);
a[e] = d;
return new fe(this.m, this.ca, new Ke(a, c));
};
h.Mc = function (a) {
return a === re || sa(this.Ab.hc, a.toString());
};
h.ea = function (a) {
if (a === this)
return !0;
if (a.L())
return !1;
if (this.C().ea(a.C()) && this.m.count() === a.m.count()) {
var b = this.ac(R);
a = a.ac(R);
for (var c = Ic(b), d = Ic(a); c && d;) {
if (c.name !== d.name || !c.U.ea(d.U))
return !1;
c = Ic(b);
d = Ic(a);
}
return null === c && null === d;
}
return !1;
};
function Te(a, b) {
return b === re ? null : a.Ab.get(b.toString());
}
h.toString = function () {
return G(this.J(!0));
};
function Q(a, b) {
if (null === a)
return H;
var c = null;
'object' === typeof a && '.priority' in a ? c = a['.priority'] : 'undefined' !== typeof b && (c = b);
O(null === c || 'string' === typeof c || 'number' === typeof c || 'object' === typeof c && '.sv' in c, 'Invalid priority type found: ' + typeof c);
'object' === typeof a && '.value' in a && null !== a['.value'] && (a = a['.value']);
if ('object' !== typeof a || '.sv' in a)
return new Yc(a, Q(c));
if (a instanceof Array) {
var d = H, e = a;
v(e, function (a, b) {
if (y(e, b) && '.' !== b.substring(0, 1)) {
var c = Q(a);
if (c.L() || !c.e())
d = d.W(b, c);
}
});
return d.ia(Q(c));
}
var f = [], g = !1, k = a;
Fb(k, function (a) {
if ('string' !== typeof a || '.' !== a.substring(0, 1)) {
var b = Q(k[a]);
b.e() || (g = g || !b.C().e(), f.push(new L(a, b)));
}
});
if (0 == f.length)
return H;
var m = Me(f, xc, function (a) {
return a.name;
}, zc);
if (g) {
var l = Me(f, Vd(R));
return new fe(m, Q(c), new Ke({ '.priority': l }, { '.priority': R }));
}
return new fe(m, Q(c), Oe);
}
var Ue = Math.log(2);
function Ve(a) {
this.count = parseInt(Math.log(a + 1) / Ue, 10);
this.nf = this.count - 1;
this.ng = a + 1 & parseInt(Array(this.count + 1).join('1'), 2);
}
function We(a) {
var b = !(a.ng & 1 << a.nf);
a.nf--;
return b;
}
function Me(a, b, c, d) {
function e(b, d) {
var f = d - b;
if (0 == f)
return null;
if (1 == f) {
var l = a[b], t = c ? c(l) : l;
return new Kc(t, l.U, !1, null, null);
}
var l = parseInt(f / 2, 10) + b, f = e(b, l), A = e(l + 1, d), l = a[l], t = c ? c(l) : l;
return new Kc(t, l.U, !1, f, A);
}
a.sort(b);
var f = function (b) {
function d(b, g) {
var k = t - b, A = t;
t -= b;
var A = e(k + 1, A), k = a[k], I = c ? c(k) : k, A = new Kc(I, k.U, g, null, A);
f ? f.left = A : l = A;
f = A;
}
for (var f = null, l = null, t = a.length, A = 0; A < b.count; ++A) {
var I = We(b), Qd = Math.pow(2, b.count - (A + 1));
I ? d(Qd, !1) : (d(Qd, !1), d(Qd, !0));
}
return l;
}(new Ve(a.length));
return null !== f ? new Ec(d || b, f) : new Ec(d || b);
}
function Re(a) {
return 'number' === typeof a ? 'number:' + Ad(a) : 'string:' + a;
}
function Pe(a) {
if (a.L()) {
var b = a.J();
O('string' === typeof b || 'number' === typeof b || 'object' === typeof b && y(b, '.sv'), 'Priority must be a string or number.');
} else
O(a === we || a.e(), 'priority of unexpected type.');
O(a === we || a.C().e(), 'Priority nodes can\'t have a priority of their own.');
}
var H = new fe(new Ec(zc), null, Oe);
function Xe() {
fe.call(this, new Ec(zc), H, Oe);
}
ka(Xe, fe);
h = Xe.prototype;
h.Gc = function (a) {
return a === this ? 0 : 1;
};
h.ea = function (a) {
return a === this;
};
h.C = function () {
return this;
};
h.T = function () {
return H;
};
h.e = function () {
return !1;
};
var we = new Xe(), ue = new L('[MIN_NAME]', H), Ae = new L('[MAX_NAME]', we);
function je(a, b) {
this.Q = a;
this.ae = b;
}
function ge(a, b, c, d) {
return new je(new Xb(b, c, d), a.ae);
}
function ke(a) {
return a.Q.ga ? a.Q.j() : null;
}
je.prototype.w = function () {
return this.ae;
};
function Yb(a) {
return a.ae.ga ? a.ae.j() : null;
}
;
function Ye(a, b) {
this.Y = a;
var c = a.n, d = new Ld(c.g), c = He(c) ? new Ld(c.g) : c.la ? new Sd(c) : new Md(c);
this.Nf = new Zd(c);
var e = b.w(), f = b.Q, g = d.ya(H, e.j(), null), k = c.ya(H, f.j(), null);
this.Oa = new je(new Xb(k, f.ga, c.Ra()), new Xb(g, e.ga, d.Ra()));
this.$a = [];
this.ug = new Fd(a);
}
function Ze(a) {
return a.Y;
}
h = Ye.prototype;
h.w = function () {
return this.Oa.w().j();
};
h.kb = function (a) {
var b = Yb(this.Oa);
return b && (He(this.Y.n) || !a.e() && !b.T(K(a)).e()) ? b.S(a) : null;
};
h.e = function () {
return 0 === this.$a.length;
};
h.Tb = function (a) {
this.$a.push(a);
};
h.nb = function (a, b) {
var c = [];
if (b) {
O(null == a, 'A cancel should cancel all event registrations.');
var d = this.Y.path;
Ma(this.$a, function (a) {
(a = a.lf(b, d)) && c.push(a);
});
}
if (a) {
for (var e = [], f = 0; f < this.$a.length; ++f) {
var g = this.$a[f];
if (!g.matches(a))
e.push(g);
else if (a.yf()) {
e = e.concat(this.$a.slice(f + 1));
break;
}
}
this.$a = e;
} else
this.$a = [];
return c;
};
h.gb = function (a, b, c) {
a.type === be && null !== a.source.Lb && (O(Yb(this.Oa), 'We should always have a full cache before handling merges'), O(ke(this.Oa), 'Missing event cache, even though we have a server cache'));
var d = this.Oa;
a = this.Nf.gb(d, a, b, c);
b = this.Nf;
c = a.me;
O(c.Q.j().Mc(b.X.g), 'Event snap not indexed');
O(c.w().j().Mc(b.X.g), 'Server snap not indexed');
O(lc(a.me.w()) || !lc(d.w()), 'Once a server snap is complete, it should never go back');
this.Oa = a.me;
return $e(this, a.og, a.me.Q.j(), null);
};
function af(a, b) {
var c = a.Oa.Q, d = [];
c.j().L() || c.j().R(R, function (a, b) {
d.push(new J('child_added', b, a));
});
c.ga && d.push(hc(c.j()));
return $e(a, d, c.j(), b);
}
function $e(a, b, c, d) {
return Gd(a.ug, b, c, d ? [d] : a.$a);
}
;
function bf(a, b, c) {
this.type = be;
this.source = a;
this.path = b;
this.children = c;
}
bf.prototype.$c = function (a) {
if (this.path.e())
return a = this.children.subtree(new P(a)), a.e() ? null : a.value ? new Ac(this.source, M, a.value) : new bf(this.source, M, a);
O(K(this.path) === a, 'Can\'t get a merge for a child not on the path of the operation');
return new bf(this.source, N(this.path), this.children);
};
bf.prototype.toString = function () {
return 'Operation(' + this.path + ': ' + this.source.toString() + ' merge: ' + this.children.toString() + ')';
};
function cf(a, b) {
this.f = pd('p:rest:');
this.G = a;
this.Kb = b;
this.Ca = null;
this.ba = {};
}
function df(a, b) {
if (p(b))
return 'tag$' + b;
O(Ie(a.n), 'should have a tag if it\'s not a default query.');
return a.path.toString();
}
h = cf.prototype;
h.Cf = function (a, b, c, d) {
var e = a.path.toString();
this.f('Listen called for ' + e + ' ' + a.wa());
var f = df(a, c), g = {};
this.ba[f] = g;
a = Je(a.n);
var k = this;
ef(this, e + '.json', a, function (a, b) {
var t = b;
404 === a && (a = t = null);
null === a && k.Kb(e, t, !1, c);
z(k.ba, f) === g && d(a ? 401 == a ? 'permission_denied' : 'rest_error:' + a : 'ok', null);
});
};
h.$f = function (a, b) {
var c = df(a, b);
delete this.ba[c];
};
h.O = function (a, b) {
this.Ca = a;
var c = Cd(a), d = c.data, c = c.Ec && c.Ec.exp;
b && b('ok', {
auth: d,
expires: c
});
};
h.je = function (a) {
this.Ca = null;
a('ok', null);
};
h.Qe = function () {
};
h.Gf = function () {
};
h.Md = function () {
};
h.put = function () {
};
h.Df = function () {
};
h.Ye = function () {
};
function ef(a, b, c, d) {
c = c || {};
c.format = 'export';
a.Ca && (c.auth = a.Ca);
var e = (a.G.ob ? 'https://' : 'http://') + a.G.host + b + '?' + Ib(c);
a.f('Sending REST request for ' + e);
var f = new XMLHttpRequest();
f.onreadystatechange = function () {
if (d && 4 === f.readyState) {
a.f('REST Response for ' + e + ' received. status:', f.status, 'response:', f.responseText);
var b = null;
if (200 <= f.status && 300 > f.status) {
try {
b = Rb(f.responseText);
} catch (c) {
S('Failed to parse JSON response for ' + e + ': ' + f.responseText);
}
d(null, b);
} else
401 !== f.status && 404 !== f.status && S('Got unsuccessful REST response for ' + e + ' Status: ' + f.status), d(f.status);
d = null;
}
};
f.open('GET', e, !0);
f.send();
}
;
function ff(a) {
O(da(a) && 0 < a.length, 'Requires a non-empty array');
this.fg = a;
this.Rc = {};
}
ff.prototype.ie = function (a, b) {
var c;
c = this.Rc[a] || [];
var d = c.length;
if (0 < d) {
for (var e = Array(d), f = 0; f < d; f++)
e[f] = c[f];
c = e;
} else
c = [];
for (d = 0; d < c.length; d++)
c[d].Dc.apply(c[d].Qa, Array.prototype.slice.call(arguments, 1));
};
ff.prototype.Ib = function (a, b, c) {
gf(this, a);
this.Rc[a] = this.Rc[a] || [];
this.Rc[a].push({
Dc: b,
Qa: c
});
(a = this.Ee(a)) && b.apply(c, a);
};
ff.prototype.mc = function (a, b, c) {
gf(this, a);
a = this.Rc[a] || [];
for (var d = 0; d < a.length; d++)
if (a[d].Dc === b && (!c || c === a[d].Qa)) {
a.splice(d, 1);
break;
}
};
function gf(a, b) {
O(Ra(a.fg, function (a) {
return a === b;
}), 'Unknown event: ' + b);
}
;
var hf = function () {
var a = 0, b = [];
return function (c) {
var d = c === a;
a = c;
for (var e = Array(8), f = 7; 0 <= f; f--)
e[f] = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'.charAt(c % 64), c = Math.floor(c / 64);
O(0 === c, 'Cannot push at time == 0');
c = e.join('');
if (d) {
for (f = 11; 0 <= f && 63 === b[f]; f--)
b[f] = 0;
b[f]++;
} else
for (f = 0; 12 > f; f++)
b[f] = Math.floor(64 * Math.random());
for (f = 0; 12 > f; f++)
c += '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'.charAt(b[f]);
O(20 === c.length, 'nextPushId: Length should be 20.');
return c;
};
}();
function jf() {
ff.call(this, ['online']);
this.oc = !0;
if ('undefined' !== typeof window && 'undefined' !== typeof window.addEventListener) {
var a = this;
window.addEventListener('online', function () {
a.oc || (a.oc = !0, a.ie('online', !0));
}, !1);
window.addEventListener('offline', function () {
a.oc && (a.oc = !1, a.ie('online', !1));
}, !1);
}
}
ka(jf, ff);
jf.prototype.Ee = function (a) {
O('online' === a, 'Unknown event type: ' + a);
return [this.oc];
};
ba(jf);
function kf() {
ff.call(this, ['visible']);
var a, b;
'undefined' !== typeof document && 'undefined' !== typeof document.addEventListener && ('undefined' !== typeof document.hidden ? (b = 'visibilitychange', a = 'hidden') : 'undefined' !== typeof document.mozHidden ? (b = 'mozvisibilitychange', a = 'mozHidden') : 'undefined' !== typeof document.msHidden ? (b = 'msvisibilitychange', a = 'msHidden') : 'undefined' !== typeof document.webkitHidden && (b = 'webkitvisibilitychange', a = 'webkitHidden'));
this.Sb = !0;
if (b) {
var c = this;
document.addEventListener(b, function () {
var b = !document[a];
b !== c.Sb && (c.Sb = b, c.ie('visible', b));
}, !1);
}
}
ka(kf, ff);
kf.prototype.Ee = function (a) {
O('visible' === a, 'Unknown event type: ' + a);
return [this.Sb];
};
ba(kf);
function P(a, b) {
if (1 == arguments.length) {
this.u = a.split('/');
for (var c = 0, d = 0; d < this.u.length; d++)
0 < this.u[d].length && (this.u[c] = this.u[d], c++);
this.u.length = c;
this.aa = 0;
} else
this.u = a, this.aa = b;
}
function lf(a, b) {
var c = K(a);
if (null === c)
return b;
if (c === K(b))
return lf(N(a), N(b));
throw Error('INTERNAL ERROR: innerPath (' + b + ') is not within outerPath (' + a + ')');
}
function mf(a, b) {
for (var c = a.slice(), d = b.slice(), e = 0; e < c.length && e < d.length; e++) {
var f = yc(c[e], d[e]);
if (0 !== f)
return f;
}
return c.length === d.length ? 0 : c.length < d.length ? -1 : 1;
}
function K(a) {
return a.aa >= a.u.length ? null : a.u[a.aa];
}
function le(a) {
return a.u.length - a.aa;
}
function N(a) {
var b = a.aa;
b < a.u.length && b++;
return new P(a.u, b);
}
function me(a) {
return a.aa < a.u.length ? a.u[a.u.length - 1] : null;
}
h = P.prototype;
h.toString = function () {
for (var a = '', b = this.aa; b < this.u.length; b++)
'' !== this.u[b] && (a += '/' + this.u[b]);
return a || '/';
};
h.slice = function (a) {
return this.u.slice(this.aa + (a || 0));
};
h.parent = function () {
if (this.aa >= this.u.length)
return null;
for (var a = [], b = this.aa; b < this.u.length - 1; b++)
a.push(this.u[b]);
return new P(a, 0);
};
h.o = function (a) {
for (var b = [], c = this.aa; c < this.u.length; c++)
b.push(this.u[c]);
if (a instanceof P)
for (c = a.aa; c < a.u.length; c++)
b.push(a.u[c]);
else
for (a = a.split('/'), c = 0; c < a.length; c++)
0 < a[c].length && b.push(a[c]);
return new P(b, 0);
};
h.e = function () {
return this.aa >= this.u.length;
};
h.ea = function (a) {
if (le(this) !== le(a))
return !1;
for (var b = this.aa, c = a.aa; b <= this.u.length; b++, c++)
if (this.u[b] !== a.u[c])
return !1;
return !0;
};
h.contains = function (a) {
var b = this.aa, c = a.aa;
if (le(this) > le(a))
return !1;
for (; b < this.u.length;) {
if (this.u[b] !== a.u[c])
return !1;
++b;
++c;
}
return !0;
};
var M = new P('');
function nf(a, b) {
this.Ua = a.slice();
this.Ka = Math.max(1, this.Ua.length);
this.pf = b;
for (var c = 0; c < this.Ua.length; c++)
this.Ka += Pb(this.Ua[c]);
of(this);
}
nf.prototype.push = function (a) {
0 < this.Ua.length && (this.Ka += 1);
this.Ua.push(a);
this.Ka += Pb(a);
of(this);
};
nf.prototype.pop = function () {
var a = this.Ua.pop();
this.Ka -= Pb(a);
0 < this.Ua.length && --this.Ka;
};
function of(a) {
if (768 < a.Ka)
throw Error(a.pf + 'has a key path longer than 768 bytes (' + a.Ka + ').');
if (32 < a.Ua.length)
throw Error(a.pf + 'path specified exceeds the maximum depth that can be written (32) or object contains a cycle ' + pf(a));
}
function pf(a) {
return 0 == a.Ua.length ? '' : 'in property \'' + a.Ua.join('.') + '\'';
}
;
function qf(a, b) {
this.value = a;
this.children = b || rf;
}
var rf = new Ec(function (a, b) {
return a === b ? 0 : a < b ? -1 : 1;
});
function sf(a) {
var b = qe;
v(a, function (a, d) {
b = b.set(new P(d), a);
});
return b;
}
h = qf.prototype;
h.e = function () {
return null === this.value && this.children.e();
};
function tf(a, b, c) {
if (null != a.value && c(a.value))
return {
path: M,
value: a.value
};
if (b.e())
return null;
var d = K(b);
a = a.children.get(d);
return null !== a ? (b = tf(a, N(b), c), null != b ? {
path: new P(d).o(b.path),
value: b.value
} : null) : null;
}
function uf(a, b) {
return tf(a, b, function () {
return !0;
});
}
h.subtree = function (a) {
if (a.e())
return this;
var b = this.children.get(K(a));
return null !== b ? b.subtree(N(a)) : qe;
};
h.set = function (a, b) {
if (a.e())
return new qf(b, this.children);
var c = K(a), d = (this.children.get(c) || qe).set(N(a), b), c = this.children.Sa(c, d);
return new qf(this.value, c);
};
h.remove = function (a) {
if (a.e())
return this.children.e() ? qe : new qf(null, this.children);
var b = K(a), c = this.children.get(b);
return c ? (a = c.remove(N(a)), b = a.e() ? this.children.remove(b) : this.children.Sa(b, a), null === this.value && b.e() ? qe : new qf(this.value, b)) : this;
};
h.get = function (a) {
if (a.e())
return this.value;
var b = this.children.get(K(a));
return b ? b.get(N(a)) : null;
};
function pe(a, b, c) {
if (b.e())
return c;
var d = K(b);
b = pe(a.children.get(d) || qe, N(b), c);
d = b.e() ? a.children.remove(d) : a.children.Sa(d, b);
return new qf(a.value, d);
}
function vf(a, b) {
return wf(a, M, b);
}
function wf(a, b, c) {
var d = {};
a.children.ka(function (a, f) {
d[a] = wf(f, b.o(a), c);
});
return c(b, a.value, d);
}
function xf(a, b, c) {
return yf(a, b, M, c);
}
function yf(a, b, c, d) {
var e = a.value ? d(c, a.value) : !1;
if (e)
return e;
if (b.e())
return null;
e = K(b);
return (a = a.children.get(e)) ? yf(a, N(b), c.o(e), d) : null;
}
function zf(a, b, c) {
Af(a, b, M, c);
}
function Af(a, b, c, d) {
if (b.e())
return a;
a.value && d(c, a.value);
var e = K(b);
return (a = a.children.get(e)) ? Af(a, N(b), c.o(e), d) : qe;
}
function ne(a, b) {
Bf(a, M, b);
}
function Bf(a, b, c) {
a.children.ka(function (a, e) {
Bf(e, b.o(a), c);
});
a.value && c(b, a.value);
}
function Cf(a, b) {
a.children.ka(function (a, d) {
d.value && b(a, d.value);
});
}
var qe = new qf(null);
qf.prototype.toString = function () {
var a = {};
ne(this, function (b, c) {
a[b.toString()] = c.toString();
});
return G(a);
};
function Df(a, b, c) {
this.type = ee;
this.source = Ef;
this.path = a;
this.Ub = b;
this.Yd = c;
}
Df.prototype.$c = function (a) {
if (this.path.e()) {
if (null != this.Ub.value)
return O(this.Ub.children.e(), 'affectedTree should not have overlapping affected paths.'), this;
a = this.Ub.subtree(new P(a));
return new Df(M, a, this.Yd);
}
O(K(this.path) === a, 'operationForChild called for unrelated child.');
return new Df(N(this.path), this.Ub, this.Yd);
};
Df.prototype.toString = function () {
return 'Operation(' + this.path + ': ' + this.source.toString() + ' ack write revert=' + this.Yd + ' affectedTree=' + this.Ub + ')';
};
var Bc = 0, be = 1, ee = 2, Dc = 3;
function Ff(a, b, c, d) {
this.Ae = a;
this.tf = b;
this.Lb = c;
this.ef = d;
O(!d || b, 'Tagged queries must be from server.');
}
var Ef = new Ff(!0, !1, null, !1), Gf = new Ff(!1, !0, null, !1);
Ff.prototype.toString = function () {
return this.Ae ? 'user' : this.ef ? 'server(queryID=' + this.Lb + ')' : 'server';
};
function Hf(a) {
this.Z = a;
}
var If = new Hf(new qf(null));
function Jf(a, b, c) {
if (b.e())
return new Hf(new qf(c));
var d = uf(a.Z, b);
if (null != d) {
var e = d.path, d = d.value;
b = lf(e, b);
d = d.H(b, c);
return new Hf(a.Z.set(e, d));
}
a = pe(a.Z, b, new qf(c));
return new Hf(a);
}
function Kf(a, b, c) {
var d = a;
Fb(c, function (a, c) {
d = Jf(d, b.o(a), c);
});
return d;
}
Hf.prototype.Ud = function (a) {
if (a.e())
return If;
a = pe(this.Z, a, qe);
return new Hf(a);
};
function Lf(a, b) {
var c = uf(a.Z, b);
return null != c ? a.Z.get(c.path).S(lf(c.path, b)) : null;
}
function Mf(a) {
var b = [], c = a.Z.value;
null != c ? c.L() || c.R(R, function (a, c) {
b.push(new L(a, c));
}) : a.Z.children.ka(function (a, c) {
null != c.value && b.push(new L(a, c.value));
});
return b;
}
function Nf(a, b) {
if (b.e())
return a;
var c = Lf(a, b);
return null != c ? new Hf(new qf(c)) : new Hf(a.Z.subtree(b));
}
Hf.prototype.e = function () {
return this.Z.e();
};
Hf.prototype.apply = function (a) {
return Of(M, this.Z, a);
};
function Of(a, b, c) {
if (null != b.value)
return c.H(a, b.value);
var d = null;
b.children.ka(function (b, f) {
'.priority' === b ? (O(null !== f.value, 'Priority writes must always be leaf nodes'), d = f.value) : c = Of(a.o(b), f, c);
});
c.S(a).e() || null === d || (c = c.H(a.o('.priority'), d));
return c;
}
;
function Pf() {
this.V = If;
this.pa = [];
this.Pc = -1;
}
function Qf(a, b) {
for (var c = 0; c < a.pa.length; c++) {
var d = a.pa[c];
if (d.md === b)
return d;
}
return null;
}
h = Pf.prototype;
h.Ud = function (a) {
var b = Sa(this.pa, function (b) {
return b.md === a;
});
O(0 <= b, 'removeWrite called with nonexistent writeId.');
var c = this.pa[b];
this.pa.splice(b, 1);
for (var d = c.visible, e = !1, f = this.pa.length - 1; d && 0 <= f;) {
var g = this.pa[f];
g.visible && (f >= b && Rf(g, c.path) ? d = !1 : c.path.contains(g.path) && (e = !0));
f--;
}
if (d) {
if (e)
this.V = Sf(this.pa, Tf, M), this.Pc = 0 < this.pa.length ? this.pa[this.pa.length - 1].md : -1;
else if (c.Ja)
this.V = this.V.Ud(c.path);
else {
var k = this;
v(c.children, function (a, b) {
k.V = k.V.Ud(c.path.o(b));
});
}
return !0;
}
return !1;
};
h.Aa = function (a, b, c, d) {
if (c || d) {
var e = Nf(this.V, a);
return !d && e.e() ? b : d || null != b || null != Lf(e, M) ? (e = Sf(this.pa, function (b) {
return (b.visible || d) && (!c || !(0 <= La(c, b.md))) && (b.path.contains(a) || a.contains(b.path));
}, a), b = b || H, e.apply(b)) : null;
}
e = Lf(this.V, a);
if (null != e)
return e;
e = Nf(this.V, a);
return e.e() ? b : null != b || null != Lf(e, M) ? (b = b || H, e.apply(b)) : null;
};
h.Cc = function (a, b) {
var c = H, d = Lf(this.V, a);
if (d)
d.L() || d.R(R, function (a, b) {
c = c.W(a, b);
});
else if (b) {
var e = Nf(this.V, a);
b.R(R, function (a, b) {
var d = Nf(e, new P(a)).apply(b);
c = c.W(a, d);
});
Ma(Mf(e), function (a) {
c = c.W(a.name, a.U);
});
} else
e = Nf(this.V, a), Ma(Mf(e), function (a) {
c = c.W(a.name, a.U);
});
return c;
};
h.nd = function (a, b, c, d) {
O(c || d, 'Either existingEventSnap or existingServerSnap must exist');
a = a.o(b);
if (null != Lf(this.V, a))
return null;
a = Nf(this.V, a);
return a.e() ? d.S(b) : a.apply(d.S(b));
};
h.Bc = function (a, b, c) {
a = a.o(b);
var d = Lf(this.V, a);
return null != d ? d : Wb(c, b) ? Nf(this.V, a).apply(c.j().T(b)) : null;
};
h.xc = function (a) {
return Lf(this.V, a);
};
h.qe = function (a, b, c, d, e, f) {
var g;
a = Nf(this.V, a);
g = Lf(a, M);
if (null == g)
if (null != b)
g = a.apply(b);
else
return [];
g = g.pb(f);
if (g.e() || g.L())
return [];
b = [];
a = Vd(f);
e = e ? g.dc(c, f) : g.bc(c, f);
for (f = Ic(e); f && b.length < d;)
0 !== a(f, c) && b.push(f), f = Ic(e);
return b;
};
function Rf(a, b) {
return a.Ja ? a.path.contains(b) : !!ta(a.children, function (c, d) {
return a.path.o(d).contains(b);
});
}
function Tf(a) {
return a.visible;
}
function Sf(a, b, c) {
for (var d = If, e = 0; e < a.length; ++e) {
var f = a[e];
if (b(f)) {
var g = f.path;
if (f.Ja)
c.contains(g) ? (g = lf(c, g), d = Jf(d, g, f.Ja)) : g.contains(c) && (g = lf(g, c), d = Jf(d, M, f.Ja.S(g)));
else if (f.children)
if (c.contains(g))
g = lf(c, g), d = Kf(d, g, f.children);
else {
if (g.contains(c))
if (g = lf(g, c), g.e())
d = Kf(d, M, f.children);
else if (f = z(f.children, K(g)))
f = f.S(N(g)), d = Jf(d, M, f);
}
else
throw jd('WriteRecord should have .snap or .children');
}
}
return d;
}
function Uf(a, b) {
this.Qb = a;
this.Z = b;
}
h = Uf.prototype;
h.Aa = function (a, b, c) {
return this.Z.Aa(this.Qb, a, b, c);
};
h.Cc = function (a) {
return this.Z.Cc(this.Qb, a);
};
h.nd = function (a, b, c) {
return this.Z.nd(this.Qb, a, b, c);
};
h.xc = function (a) {
return this.Z.xc(this.Qb.o(a));
};
h.qe = function (a, b, c, d, e) {
return this.Z.qe(this.Qb, a, b, c, d, e);
};
h.Bc = function (a, b) {
return this.Z.Bc(this.Qb, a, b);
};
h.o = function (a) {
return new Uf(this.Qb.o(a), this.Z);
};
function Vf() {
this.children = {};
this.pd = 0;
this.value = null;
}
function Wf(a, b, c) {
this.Jd = a ? a : '';
this.Ha = b ? b : null;
this.A = c ? c : new Vf();
}
function Xf(a, b) {
for (var c = b instanceof P ? b : new P(b), d = a, e; null !== (e = K(c));)
d = new Wf(e, d, z(d.A.children, e) || new Vf()), c = N(c);
return d;
}
h = Wf.prototype;
h.Ea = function () {
return this.A.value;
};
function Yf(a, b) {
O('undefined' !== typeof b, 'Cannot set value to undefined');
a.A.value = b;
Zf(a);
}
h.clear = function () {
this.A.value = null;
this.A.children = {};
this.A.pd = 0;
Zf(this);
};
h.zd = function () {
return 0 < this.A.pd;
};
h.e = function () {
return null === this.Ea() && !this.zd();
};
h.R = function (a) {
var b = this;
v(this.A.children, function (c, d) {
a(new Wf(d, b, c));
});
};
function $f(a, b, c, d) {
c && !d && b(a);
a.R(function (a) {
$f(a, b, !0, d);
});
c && d && b(a);
}
function ag(a, b) {
for (var c = a.parent(); null !== c && !b(c);)
c = c.parent();
}
h.path = function () {
return new P(null === this.Ha ? this.Jd : this.Ha.path() + '/' + this.Jd);
};
h.name = function () {
return this.Jd;
};
h.parent = function () {
return this.Ha;
};
function Zf(a) {
if (null !== a.Ha) {
var b = a.Ha, c = a.Jd, d = a.e(), e = y(b.A.children, c);
d && e ? (delete b.A.children[c], b.A.pd--, Zf(b)) : d || e || (b.A.children[c] = a.A, b.A.pd++, Zf(b));
}
}
;
var bg = /[\[\].#$\/\u0000-\u001F\u007F]/, cg = /[\[\].#$\u0000-\u001F\u007F]/, dg = /^[a-zA-Z][a-zA-Z._\-+]+$/;
function eg(a) {
return q(a) && 0 !== a.length && !bg.test(a);
}
function fg(a) {
return null === a || q(a) || fa(a) && !td(a) || ga(a) && y(a, '.sv');
}
function gg(a, b, c, d) {
d && !p(b) || hg(E(a, 1, d), b, c);
}
function hg(a, b, c) {
c instanceof P && (c = new nf(c, a));
if (!p(b))
throw Error(a + 'contains undefined ' + pf(c));
if (r(b))
throw Error(a + 'contains a function ' + pf(c) + ' with contents: ' + b.toString());
if (td(b))
throw Error(a + 'contains ' + b.toString() + ' ' + pf(c));
if (q(b) && b.length > 10485760 / 3 && 10485760 < Pb(b))
throw Error(a + 'contains a string greater than 10485760 utf8 bytes ' + pf(c) + ' (\'' + b.substring(0, 50) + '...\')');
if (ga(b)) {
var d = !1, e = !1;
Fb(b, function (b, g) {
if ('.value' === b)
d = !0;
else if ('.priority' !== b && '.sv' !== b && (e = !0, !eg(b)))
throw Error(a + ' contains an invalid key (' + b + ') ' + pf(c) + '.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');
c.push(b);
hg(a, g, c);
c.pop();
});
if (d && e)
throw Error(a + ' contains ".value" child ' + pf(c) + ' in addition to actual children.');
}
}
function ig(a, b) {
var c, d;
for (c = 0; c < b.length; c++) {
d = b[c];
for (var e = d.slice(), f = 0; f < e.length; f++)
if (('.priority' !== e[f] || f !== e.length - 1) && !eg(e[f]))
throw Error(a + 'contains an invalid key (' + e[f] + ') in path ' + d.toString() + '. Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');
}
b.sort(mf);
e = null;
for (c = 0; c < b.length; c++) {
d = b[c];
if (null !== e && e.contains(d))
throw Error(a + 'contains a path ' + e.toString() + ' that is ancestor of another path ' + d.toString());
e = d;
}
}
function jg(a, b, c) {
var d = E(a, 1, !1);
if (!ga(b) || da(b))
throw Error(d + ' must be an object containing the children to replace.');
var e = [];
Fb(b, function (a, b) {
var k = new P(a);
hg(d, b, c.o(k));
if ('.priority' === me(k) && !fg(b))
throw Error(d + 'contains an invalid value for \'' + k.toString() + '\', which must be a valid Firebase priority (a string, finite number, server value, or null).');
e.push(k);
});
ig(d, e);
}
function kg(a, b, c) {
if (td(c))
throw Error(E(a, b, !1) + 'is ' + c.toString() + ', but must be a valid Firebase priority (a string, finite number, server value, or null).');
if (!fg(c))
throw Error(E(a, b, !1) + 'must be a valid Firebase priority (a string, finite number, server value, or null).');
}
function lg(a, b, c) {
if (!c || p(b))
switch (b) {
case 'value':
case 'child_added':
case 'child_removed':
case 'child_changed':
case 'child_moved':
break;
default:
throw Error(E(a, 1, c) + 'must be a valid event type: "value", "child_added", "child_removed", "child_changed", or "child_moved".');
}
}
function mg(a, b) {
if (p(b) && !eg(b))
throw Error(E(a, 2, !0) + 'was an invalid key: "' + b + '".  Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]").');
}
function ng(a, b) {
if (!q(b) || 0 === b.length || cg.test(b))
throw Error(E(a, 1, !1) + 'was an invalid path: "' + b + '". Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"');
}
function og(a, b) {
if ('.info' === K(b))
throw Error(a + ' failed: Can\'t modify data under /.info/');
}
function pg(a, b) {
if (!q(b))
throw Error(E(a, 1, !1) + 'must be a valid credential (a string).');
}
function qg(a, b, c) {
if (!q(c))
throw Error(E(a, b, !1) + 'must be a valid string.');
}
function rg(a, b) {
qg(a, 1, b);
if (!dg.test(b))
throw Error(E(a, 1, !1) + '\'' + b + '\' is not a valid authentication provider.');
}
function sg(a, b, c, d) {
if (!d || p(c))
if (!ga(c) || null === c)
throw Error(E(a, b, d) + 'must be a valid object.');
}
function tg(a, b, c) {
if (!ga(b) || !y(b, c))
throw Error(E(a, 1, !1) + 'must contain the key "' + c + '"');
if (!q(z(b, c)))
throw Error(E(a, 1, !1) + 'must contain the key "' + c + '" with type "string"');
}
;
function ug() {
this.set = {};
}
h = ug.prototype;
h.add = function (a, b) {
this.set[a] = null !== b ? b : !0;
};
h.contains = function (a) {
return y(this.set, a);
};
h.get = function (a) {
return this.contains(a) ? this.set[a] : void 0;
};
h.remove = function (a) {
delete this.set[a];
};
h.clear = function () {
this.set = {};
};
h.e = function () {
return va(this.set);
};
h.count = function () {
return oa(this.set);
};
function vg(a, b) {
v(a.set, function (a, d) {
b(d, a);
});
}
h.keys = function () {
var a = [];
v(this.set, function (b, c) {
a.push(c);
});
return a;
};
function Vc() {
this.m = this.B = null;
}
Vc.prototype.find = function (a) {
if (null != this.B)
return this.B.S(a);
if (a.e() || null == this.m)
return null;
var b = K(a);
a = N(a);
return this.m.contains(b) ? this.m.get(b).find(a) : null;
};
Vc.prototype.rc = function (a, b) {
if (a.e())
this.B = b, this.m = null;
else if (null !== this.B)
this.B = this.B.H(a, b);
else {
null == this.m && (this.m = new ug());
var c = K(a);
this.m.contains(c) || this.m.add(c, new Vc());
c = this.m.get(c);
a = N(a);
c.rc(a, b);
}
};
function wg(a, b) {
if (b.e())
return a.B = null, a.m = null, !0;
if (null !== a.B) {
if (a.B.L())
return !1;
var c = a.B;
a.B = null;
c.R(R, function (b, c) {
a.rc(new P(b), c);
});
return wg(a, b);
}
return null !== a.m ? (c = K(b), b = N(b), a.m.contains(c) && wg(a.m.get(c), b) && a.m.remove(c), a.m.e() ? (a.m = null, !0) : !1) : !0;
}
function Wc(a, b, c) {
null !== a.B ? c(b, a.B) : a.R(function (a, e) {
var f = new P(b.toString() + '/' + a);
Wc(e, f, c);
});
}
Vc.prototype.R = function (a) {
null !== this.m && vg(this.m, function (b, c) {
a(b, c);
});
};
var xg = 'auth.firebase.com';
function yg(a, b, c) {
this.qd = a || {};
this.he = b || {};
this.fb = c || {};
this.qd.remember || (this.qd.remember = 'default');
}
var zg = [
'remember',
'redirectTo'
];
function Ag(a) {
var b = {}, c = {};
Fb(a || {}, function (a, e) {
0 <= La(zg, a) ? b[a] = e : c[a] = e;
});
return new yg(b, {}, c);
}
;
function Bg(a, b) {
this.Ue = [
'session',
a.Rd,
a.lc
].join(':');
this.ee = b;
}
Bg.prototype.set = function (a, b) {
if (!b)
if (this.ee.length)
b = this.ee[0];
else
throw Error('fb.login.SessionManager : No storage options available!');
b.set(this.Ue, a);
};
Bg.prototype.get = function () {
var a = Oa(this.ee, u(this.Bg, this)), a = Na(a, function (a) {
return null !== a;
});
Va(a, function (a, c) {
return Dd(c.token) - Dd(a.token);
});
return 0 < a.length ? a.shift() : null;
};
Bg.prototype.Bg = function (a) {
try {
var b = a.get(this.Ue);
if (b && b.token)
return b;
} catch (c) {
}
return null;
};
Bg.prototype.clear = function () {
var a = this;
Ma(this.ee, function (b) {
b.remove(a.Ue);
});
};
function Cg() {
return 'undefined' !== typeof navigator && 'string' === typeof navigator.userAgent ? navigator.userAgent : '';
}
function Dg() {
return 'undefined' !== typeof window && !!(window.cordova || window.phonegap || window.PhoneGap) && /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(Cg());
}
function Eg() {
return 'undefined' !== typeof location && /^file:\//.test(location.href);
}
function Fg(a) {
var b = Cg();
if ('' === b)
return !1;
if ('Microsoft Internet Explorer' === navigator.appName) {
if ((b = b.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/)) && 1 < b.length)
return parseFloat(b[1]) >= a;
} else if (-1 < b.indexOf('Trident') && (b = b.match(/rv:([0-9]{2,2}[\.0-9]{0,})/)) && 1 < b.length)
return parseFloat(b[1]) >= a;
return !1;
}
;
function Gg() {
var a = window.opener.frames, b;
for (b = a.length - 1; 0 <= b; b--)
try {
if (a[b].location.protocol === window.location.protocol && a[b].location.host === window.location.host && '__winchan_relay_frame' === a[b].name)
return a[b];
} catch (c) {
}
return null;
}
function Hg(a, b, c) {
a.attachEvent ? a.attachEvent('on' + b, c) : a.addEventListener && a.addEventListener(b, c, !1);
}
function Ig(a, b, c) {
a.detachEvent ? a.detachEvent('on' + b, c) : a.removeEventListener && a.removeEventListener(b, c, !1);
}
function Jg(a) {
/^https?:\/\//.test(a) || (a = window.location.href);
var b = /^(https?:\/\/[\-_a-zA-Z\.0-9:]+)/.exec(a);
return b ? b[1] : a;
}
function Kg(a) {
var b = '';
try {
a = a.replace(/.*\?/, '');
var c = Jb(a);
c && y(c, '__firebase_request_key') && (b = z(c, '__firebase_request_key'));
} catch (d) {
}
return b;
}
function Lg() {
var a = sd(xg);
return a.scheme + '://' + a.host + '/v2';
}
function Mg(a) {
return Lg() + '/' + a + '/auth/channel';
}
;
function Ng(a) {
var b = this;
this.hb = a;
this.fe = '*';
Fg(8) ? this.Uc = this.Cd = Gg() : (this.Uc = window.opener, this.Cd = window);
if (!b.Uc)
throw 'Unable to find relay frame';
Hg(this.Cd, 'message', u(this.nc, this));
Hg(this.Cd, 'message', u(this.Ff, this));
try {
Og(this, { a: 'ready' });
} catch (c) {
Hg(this.Uc, 'load', function () {
Og(b, { a: 'ready' });
});
}
Hg(window, 'unload', u(this.Mg, this));
}
function Og(a, b) {
b = G(b);
Fg(8) ? a.Uc.doPost(b, a.fe) : a.Uc.postMessage(b, a.fe);
}
Ng.prototype.nc = function (a) {
var b = this, c;
try {
c = Rb(a.data);
} catch (d) {
}
c && 'request' === c.a && (Ig(window, 'message', this.nc), this.fe = a.origin, this.hb && setTimeout(function () {
b.hb(b.fe, c.d, function (a, c) {
b.mg = !c;
b.hb = void 0;
Og(b, {
a: 'response',
d: a,
forceKeepWindowOpen: c
});
});
}, 0));
};
Ng.prototype.Mg = function () {
try {
Ig(this.Cd, 'message', this.Ff);
} catch (a) {
}
this.hb && (Og(this, {
a: 'error',
d: 'unknown closed window'
}), this.hb = void 0);
try {
window.close();
} catch (b) {
}
};
Ng.prototype.Ff = function (a) {
if (this.mg && 'die' === a.data)
try {
window.close();
} catch (b) {
}
};
function Pg(a) {
this.tc = Fa() + Fa() + Fa();
this.Kf = a;
}
Pg.prototype.open = function (a, b) {
cd.set('redirect_request_id', this.tc);
cd.set('redirect_request_id', this.tc);
b.requestId = this.tc;
b.redirectTo = b.redirectTo || window.location.href;
a += (/\?/.test(a) ? '' : '?') + Ib(b);
window.location = a;
};
Pg.isAvailable = function () {
return !Eg() && !Dg();
};
Pg.prototype.Fc = function () {
return 'redirect';
};
var Qg = {
NETWORK_ERROR: 'Unable to contact the Firebase server.',
SERVER_ERROR: 'An unknown server error occurred.',
TRANSPORT_UNAVAILABLE: 'There are no login transports available for the requested method.',
REQUEST_INTERRUPTED: 'The browser redirected the page before the login request could complete.',
USER_CANCELLED: 'The user cancelled authentication.'
};
function Rg(a) {
var b = Error(z(Qg, a), a);
b.code = a;
return b;
}
;
function Sg(a) {
var b;
(b = !a.window_features) || (b = Cg(), b = -1 !== b.indexOf('Fennec/') || -1 !== b.indexOf('Firefox/') && -1 !== b.indexOf('Android'));
b && (a.window_features = void 0);
a.window_name || (a.window_name = '_blank');
this.options = a;
}
Sg.prototype.open = function (a, b, c) {
function d(a) {
g && (document.body.removeChild(g), g = void 0);
t && (t = clearInterval(t));
Ig(window, 'message', e);
Ig(window, 'unload', d);
if (l && !a)
try {
l.close();
} catch (b) {
k.postMessage('die', m);
}
l = k = void 0;
}
function e(a) {
if (a.origin === m)
try {
var b = Rb(a.data);
'ready' === b.a ? k.postMessage(A, m) : 'error' === b.a ? (d(!1), c && (c(b.d), c = null)) : 'response' === b.a && (d(b.forceKeepWindowOpen), c && (c(null, b.d), c = null));
} catch (e) {
}
}
var f = Fg(8), g, k;
if (!this.options.relay_url)
return c(Error('invalid arguments: origin of url and relay_url must match'));
var m = Jg(a);
if (m !== Jg(this.options.relay_url))
c && setTimeout(function () {
c(Error('invalid arguments: origin of url and relay_url must match'));
}, 0);
else {
f && (g = document.createElement('iframe'), g.setAttribute('src', this.options.relay_url), g.style.display = 'none', g.setAttribute('name', '__winchan_relay_frame'), document.body.appendChild(g), k = g.contentWindow);
a += (/\?/.test(a) ? '' : '?') + Ib(b);
var l = window.open(a, this.options.window_name, this.options.window_features);
k || (k = l);
var t = setInterval(function () {
l && l.closed && (d(!1), c && (c(Rg('USER_CANCELLED')), c = null));
}, 500), A = G({
a: 'request',
d: b
});
Hg(window, 'unload', d);
Hg(window, 'message', e);
}
};
Sg.isAvailable = function () {
var a;
if (a = 'postMessage' in window && !Eg())
(a = Dg() || 'undefined' !== typeof navigator && (!!Cg().match(/Windows Phone/) || !!window.Windows && /^ms-appx:/.test(location.href))) || (a = Cg(), a = 'undefined' !== typeof navigator && 'undefined' !== typeof window && !!(a.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i) || a.match(/CriOS/) || a.match(/Twitter for iPhone/) || a.match(/FBAN\/FBIOS/) || window.navigator.standalone)), a = !a;
return a && !Cg().match(/PhantomJS/);
};
Sg.prototype.Fc = function () {
return 'popup';
};
function Tg(a) {
a.method || (a.method = 'GET');
a.headers || (a.headers = {});
a.headers.content_type || (a.headers.content_type = 'application/json');
a.headers.content_type = a.headers.content_type.toLowerCase();
this.options = a;
}
Tg.prototype.open = function (a, b, c) {
function d() {
c && (c(Rg('REQUEST_INTERRUPTED')), c = null);
}
var e = new XMLHttpRequest(), f = this.options.method.toUpperCase(), g;
Hg(window, 'beforeunload', d);
e.onreadystatechange = function () {
if (c && 4 === e.readyState) {
var a;
if (200 <= e.status && 300 > e.status) {
try {
a = Rb(e.responseText);
} catch (b) {
}
c(null, a);
} else
500 <= e.status && 600 > e.status ? c(Rg('SERVER_ERROR')) : c(Rg('NETWORK_ERROR'));
c = null;
Ig(window, 'beforeunload', d);
}
};
if ('GET' === f)
a += (/\?/.test(a) ? '' : '?') + Ib(b), g = null;
else {
var k = this.options.headers.content_type;
'application/json' === k && (g = G(b));
'application/x-www-form-urlencoded' === k && (g = Ib(b));
}
e.open(f, a, !0);
a = {
'X-Requested-With': 'XMLHttpRequest',
Accept: 'application/json;text/plain'
};
ya(a, this.options.headers);
for (var m in a)
e.setRequestHeader(m, a[m]);
e.send(g);
};
Tg.isAvailable = function () {
var a;
if (a = !!window.XMLHttpRequest)
a = Cg(), a = !(a.match(/MSIE/) || a.match(/Trident/)) || Fg(10);
return a;
};
Tg.prototype.Fc = function () {
return 'json';
};
function Ug(a) {
this.tc = Fa() + Fa() + Fa();
this.Kf = a;
}
Ug.prototype.open = function (a, b, c) {
function d() {
c && (c(Rg('USER_CANCELLED')), c = null);
}
var e = this, f = sd(xg), g;
b.requestId = this.tc;
b.redirectTo = f.scheme + '://' + f.host + '/blank/page.html';
a += /\?/.test(a) ? '' : '?';
a += Ib(b);
(g = window.open(a, '_blank', 'location=no')) && r(g.addEventListener) ? (g.addEventListener('loadstart', function (a) {
var b;
if (b = a && a.url)
a: {
try {
var l = document.createElement('a');
l.href = a.url;
b = l.host === f.host && '/blank/page.html' === l.pathname;
break a;
} catch (t) {
}
b = !1;
}
b && (a = Kg(a.url), g.removeEventListener('exit', d), g.close(), a = new yg(null, null, {
requestId: e.tc,
requestKey: a
}), e.Kf.requestWithCredential('/auth/session', a, c), c = null);
}), g.addEventListener('exit', d)) : c(Rg('TRANSPORT_UNAVAILABLE'));
};
Ug.isAvailable = function () {
return Dg();
};
Ug.prototype.Fc = function () {
return 'redirect';
};
function Vg(a) {
a.callback_parameter || (a.callback_parameter = 'callback');
this.options = a;
window.__firebase_auth_jsonp = window.__firebase_auth_jsonp || {};
}
Vg.prototype.open = function (a, b, c) {
function d() {
c && (c(Rg('REQUEST_INTERRUPTED')), c = null);
}
function e() {
setTimeout(function () {
window.__firebase_auth_jsonp[f] = void 0;
va(window.__firebase_auth_jsonp) && (window.__firebase_auth_jsonp = void 0);
try {
var a = document.getElementById(f);
a && a.parentNode.removeChild(a);
} catch (b) {
}
}, 1);
Ig(window, 'beforeunload', d);
}
var f = 'fn' + new Date().getTime() + Math.floor(99999 * Math.random());
b[this.options.callback_parameter] = '__firebase_auth_jsonp.' + f;
a += (/\?/.test(a) ? '' : '?') + Ib(b);
Hg(window, 'beforeunload', d);
window.__firebase_auth_jsonp[f] = function (a) {
c && (c(null, a), c = null);
e();
};
Wg(f, a, c);
};
function Wg(a, b, c) {
setTimeout(function () {
try {
var d = document.createElement('script');
d.type = 'text/javascript';
d.id = a;
d.async = !0;
d.src = b;
d.onerror = function () {
var b = document.getElementById(a);
null !== b && b.parentNode.removeChild(b);
c && c(Rg('NETWORK_ERROR'));
};
var e = document.getElementsByTagName('head');
(e && 0 != e.length ? e[0] : document.documentElement).appendChild(d);
} catch (f) {
c && c(Rg('NETWORK_ERROR'));
}
}, 0);
}
Vg.isAvailable = function () {
return 'undefined' !== typeof document && null != document.createElement;
};
Vg.prototype.Fc = function () {
return 'json';
};
function Xg(a, b, c, d) {
ff.call(this, ['auth_status']);
this.G = a;
this.hf = b;
this.gh = c;
this.Pe = d;
this.wc = new Bg(a, [
bd,
cd
]);
this.qb = null;
this.We = !1;
Yg(this);
}
ka(Xg, ff);
h = Xg.prototype;
h.Be = function () {
return this.qb || null;
};
function Yg(a) {
cd.get('redirect_request_id') && Zg(a);
var b = a.wc.get();
b && b.token ? ($g(a, b), a.hf(b.token, function (c, d) {
ah(a, c, d, !1, b.token, b);
}, function (b, d) {
bh(a, 'resumeSession()', b, d);
})) : $g(a, null);
}
function ch(a, b, c, d, e, f) {
'firebaseio-demo.com' === a.G.domain && S('Firebase authentication is not supported on demo Firebases (*.firebaseio-demo.com). To secure your Firebase, create a production Firebase at https://www.firebase.com.');
a.hf(b, function (f, k) {
ah(a, f, k, !0, b, c, d || {}, e);
}, function (b, c) {
bh(a, 'auth()', b, c, f);
});
}
function dh(a, b) {
a.wc.clear();
$g(a, null);
a.gh(function (a, d) {
if ('ok' === a)
T(b, null);
else {
var e = (a || 'error').toUpperCase(), f = e;
d && (f += ': ' + d);
f = Error(f);
f.code = e;
T(b, f);
}
});
}
function ah(a, b, c, d, e, f, g, k) {
'ok' === b ? (d && (b = c.auth, f.auth = b, f.expires = c.expires, f.token = Ed(e) ? e : '', c = null, b && y(b, 'uid') ? c = z(b, 'uid') : y(f, 'uid') && (c = z(f, 'uid')), f.uid = c, c = 'custom', b && y(b, 'provider') ? c = z(b, 'provider') : y(f, 'provider') && (c = z(f, 'provider')), f.provider = c, a.wc.clear(), Ed(e) && (g = g || {}, c = bd, 'sessionOnly' === g.remember && (c = cd), 'none' !== g.remember && a.wc.set(f, c)), $g(a, f)), T(k, null, f)) : (a.wc.clear(), $g(a, null), f = a = (b || 'error').toUpperCase(), c && (f += ': ' + c), f = Error(f), f.code = a, T(k, f));
}
function bh(a, b, c, d, e) {
S(b + ' was canceled: ' + d);
a.wc.clear();
$g(a, null);
a = Error(d);
a.code = c.toUpperCase();
T(e, a);
}
function eh(a, b, c, d, e) {
fh(a);
c = new yg(d || {}, {}, c || {});
gh(a, [
Tg,
Vg
], '/auth/' + b, c, e);
}
function hh(a, b, c, d) {
fh(a);
var e = [
Sg,
Ug
];
c = Ag(c);
'anonymous' === b || 'password' === b ? setTimeout(function () {
T(d, Rg('TRANSPORT_UNAVAILABLE'));
}, 0) : (c.he.window_features = 'menubar=yes,modal=yes,alwaysRaised=yeslocation=yes,resizable=yes,scrollbars=yes,status=yes,height=625,width=625,top=' + ('object' === typeof screen ? 0.5 * (screen.height - 625) : 0) + ',left=' + ('object' === typeof screen ? 0.5 * (screen.width - 625) : 0), c.he.relay_url = Mg(a.G.lc), c.he.requestWithCredential = u(a.uc, a), gh(a, e, '/auth/' + b, c, d));
}
function Zg(a) {
var b = cd.get('redirect_request_id');
if (b) {
var c = cd.get('redirect_client_options');
cd.remove('redirect_request_id');
cd.remove('redirect_client_options');
var d = [
Tg,
Vg
], b = {
requestId: b,
requestKey: Kg(document.location.hash)
}, c = new yg(c, {}, b);
a.We = !0;
try {
document.location.hash = document.location.hash.replace(/&__firebase_request_key=([a-zA-z0-9]*)/, '');
} catch (e) {
}
gh(a, d, '/auth/session', c, function () {
this.We = !1;
}.bind(a));
}
}
h.ve = function (a, b) {
fh(this);
var c = Ag(a);
c.fb._method = 'POST';
this.uc('/users', c, function (a, c) {
a ? T(b, a) : T(b, a, c);
});
};
h.Xe = function (a, b) {
var c = this;
fh(this);
var d = '/users/' + encodeURIComponent(a.email), e = Ag(a);
e.fb._method = 'DELETE';
this.uc(d, e, function (a, d) {
!a && d && d.uid && c.qb && c.qb.uid && c.qb.uid === d.uid && dh(c);
T(b, a);
});
};
h.se = function (a, b) {
fh(this);
var c = '/users/' + encodeURIComponent(a.email) + '/password', d = Ag(a);
d.fb._method = 'PUT';
d.fb.password = a.newPassword;
this.uc(c, d, function (a) {
T(b, a);
});
};
h.re = function (a, b) {
fh(this);
var c = '/users/' + encodeURIComponent(a.oldEmail) + '/email', d = Ag(a);
d.fb._method = 'PUT';
d.fb.email = a.newEmail;
d.fb.password = a.password;
this.uc(c, d, function (a) {
T(b, a);
});
};
h.Ze = function (a, b) {
fh(this);
var c = '/users/' + encodeURIComponent(a.email) + '/password', d = Ag(a);
d.fb._method = 'POST';
this.uc(c, d, function (a) {
T(b, a);
});
};
h.uc = function (a, b, c) {
ih(this, [
Tg,
Vg
], a, b, c);
};
function gh(a, b, c, d, e) {
ih(a, b, c, d, function (b, c) {
!b && c && c.token && c.uid ? ch(a, c.token, c, d.qd, function (a, b) {
a ? T(e, a) : T(e, null, b);
}) : T(e, b || Rg('UNKNOWN_ERROR'));
});
}
function ih(a, b, c, d, e) {
b = Na(b, function (a) {
return 'function' === typeof a.isAvailable && a.isAvailable();
});
0 === b.length ? setTimeout(function () {
T(e, Rg('TRANSPORT_UNAVAILABLE'));
}, 0) : (b = new (b.shift())(d.he), d = Gb(d.fb), d.v = 'js-' + Eb, d.transport = b.Fc(), d.suppress_status_codes = !0, a = Lg() + '/' + a.G.lc + c, b.open(a, d, function (a, b) {
if (a)
T(e, a);
else if (b && b.error) {
var c = Error(b.error.message);
c.code = b.error.code;
c.details = b.error.details;
T(e, c);
} else
T(e, null, b);
}));
}
function $g(a, b) {
var c = null !== a.qb || null !== b;
a.qb = b;
c && a.ie('auth_status', b);
a.Pe(null !== b);
}
h.Ee = function (a) {
O('auth_status' === a, 'initial event must be of type "auth_status"');
return this.We ? null : [this.qb];
};
function fh(a) {
var b = a.G;
if ('firebaseio.com' !== b.domain && 'firebaseio-demo.com' !== b.domain && 'auth.firebase.com' === xg)
throw Error('This custom Firebase server (\'' + a.G.domain + '\') does not support delegated login.');
}
;
var gd = 'websocket', hd = 'long_polling';
function jh(a) {
this.nc = a;
this.Qd = [];
this.Wb = 0;
this.te = -1;
this.Jb = null;
}
function kh(a, b, c) {
a.te = b;
a.Jb = c;
a.te < a.Wb && (a.Jb(), a.Jb = null);
}
function lh(a, b, c) {
for (a.Qd[b] = c; a.Qd[a.Wb];) {
var d = a.Qd[a.Wb];
delete a.Qd[a.Wb];
for (var e = 0; e < d.length; ++e)
if (d[e]) {
var f = a;
gc(function () {
f.nc(d[e]);
});
}
if (a.Wb === a.te) {
a.Jb && (clearTimeout(a.Jb), a.Jb(), a.Jb = null);
break;
}
a.Wb++;
}
}
;
function mh(a, b, c, d) {
this.ue = a;
this.f = pd(a);
this.rb = this.sb = 0;
this.Xa = uc(b);
this.Xf = c;
this.Kc = !1;
this.Fb = d;
this.ld = function (a) {
return fd(b, hd, a);
};
}
var nh, oh;
mh.prototype.open = function (a, b) {
this.mf = 0;
this.na = b;
this.Ef = new jh(a);
this.Db = !1;
var c = this;
this.ub = setTimeout(function () {
c.f('Timed out trying to connect.');
c.bb();
c.ub = null;
}, Math.floor(30000));
ud(function () {
if (!c.Db) {
c.Wa = new ph(function (a, b, d, k, m) {
qh(c, arguments);
if (c.Wa)
if (c.ub && (clearTimeout(c.ub), c.ub = null), c.Kc = !0, 'start' == a)
c.id = b, c.Mf = d;
else if ('close' === a)
b ? (c.Wa.$d = !1, kh(c.Ef, b, function () {
c.bb();
})) : c.bb();
else
throw Error('Unrecognized command received: ' + a);
}, function (a, b) {
qh(c, arguments);
lh(c.Ef, a, b);
}, function () {
c.bb();
}, c.ld);
var a = { start: 't' };
a.ser = Math.floor(100000000 * Math.random());
c.Wa.ke && (a.cb = c.Wa.ke);
a.v = '5';
c.Xf && (a.s = c.Xf);
c.Fb && (a.ls = c.Fb);
'undefined' !== typeof location && location.href && -1 !== location.href.indexOf('firebaseio.com') && (a.r = 'f');
a = c.ld(a);
c.f('Connecting via long-poll to ' + a);
rh(c.Wa, a, function () {
});
}
});
};
mh.prototype.start = function () {
var a = this.Wa, b = this.Mf;
a.Fg = this.id;
a.Gg = b;
for (a.oe = !0; sh(a););
a = this.id;
b = this.Mf;
this.kc = document.createElement('iframe');
var c = { dframe: 't' };
c.id = a;
c.pw = b;
this.kc.src = this.ld(c);
this.kc.style.display = 'none';
document.body.appendChild(this.kc);
};
mh.isAvailable = function () {
return nh || !oh && 'undefined' !== typeof document && null != document.createElement && !('object' === typeof window && window.chrome && window.chrome.extension && !/^chrome/.test(window.location.href)) && !('object' === typeof Windows && 'object' === typeof Windows.ih) && !0;
};
h = mh.prototype;
h.Hd = function () {
};
h.fd = function () {
this.Db = !0;
this.Wa && (this.Wa.close(), this.Wa = null);
this.kc && (document.body.removeChild(this.kc), this.kc = null);
this.ub && (clearTimeout(this.ub), this.ub = null);
};
h.bb = function () {
this.Db || (this.f('Longpoll is closing itself'), this.fd(), this.na && (this.na(this.Kc), this.na = null));
};
h.close = function () {
this.Db || (this.f('Longpoll is being closed.'), this.fd());
};
h.send = function (a) {
a = G(a);
this.sb += a.length;
rc(this.Xa, 'bytes_sent', a.length);
a = Ob(a);
a = nb(a, !0);
a = yd(a, 1840);
for (var b = 0; b < a.length; b++) {
var c = this.Wa;
c.cd.push({
Xg: this.mf,
fh: a.length,
of: a[b]
});
c.oe && sh(c);
this.mf++;
}
};
function qh(a, b) {
var c = G(b).length;
a.rb += c;
rc(a.Xa, 'bytes_received', c);
}
function ph(a, b, c, d) {
this.ld = d;
this.lb = c;
this.Te = new ug();
this.cd = [];
this.we = Math.floor(100000000 * Math.random());
this.$d = !0;
this.ke = id();
window['pLPCommand' + this.ke] = a;
window['pRTLPCB' + this.ke] = b;
a = document.createElement('iframe');
a.style.display = 'none';
if (document.body) {
document.body.appendChild(a);
try {
a.contentWindow.document || fc('No IE domain setting required');
} catch (e) {
a.src = 'javascript:void((function(){document.open();document.domain=\'' + document.domain + '\';document.close();})())';
}
} else
throw 'Document body has not initialized. Wait to initialize Firebase until after the document is ready.';
a.contentDocument ? a.jb = a.contentDocument : a.contentWindow ? a.jb = a.contentWindow.document : a.document && (a.jb = a.document);
this.Ga = a;
a = '';
this.Ga.src && 'javascript:' === this.Ga.src.substr(0, 11) && (a = '<script>document.domain="' + document.domain + '";</scr' + 'ipt>');
a = '<html><body>' + a + '</body></html>';
try {
this.Ga.jb.open(), this.Ga.jb.write(a), this.Ga.jb.close();
} catch (f) {
fc('frame writing exception'), f.stack && fc(f.stack), fc(f);
}
}
ph.prototype.close = function () {
this.oe = !1;
if (this.Ga) {
this.Ga.jb.body.innerHTML = '';
var a = this;
setTimeout(function () {
null !== a.Ga && (document.body.removeChild(a.Ga), a.Ga = null);
}, Math.floor(0));
}
var b = this.lb;
b && (this.lb = null, b());
};
function sh(a) {
if (a.oe && a.$d && a.Te.count() < (0 < a.cd.length ? 2 : 1)) {
a.we++;
var b = {};
b.id = a.Fg;
b.pw = a.Gg;
b.ser = a.we;
for (var b = a.ld(b), c = '', d = 0; 0 < a.cd.length;)
if (1870 >= a.cd[0].of.length + 30 + c.length) {
var e = a.cd.shift(), c = c + '&seg' + d + '=' + e.Xg + '&ts' + d + '=' + e.fh + '&d' + d + '=' + e.of;
d++;
} else
break;
th(a, b + c, a.we);
return !0;
}
return !1;
}
function th(a, b, c) {
function d() {
a.Te.remove(c);
sh(a);
}
a.Te.add(c, 1);
var e = setTimeout(d, Math.floor(25000));
rh(a, b, function () {
clearTimeout(e);
d();
});
}
function rh(a, b, c) {
setTimeout(function () {
try {
if (a.$d) {
var d = a.Ga.jb.createElement('script');
d.type = 'text/javascript';
d.async = !0;
d.src = b;
d.onload = d.onreadystatechange = function () {
var a = d.readyState;
a && 'loaded' !== a && 'complete' !== a || (d.onload = d.onreadystatechange = null, d.parentNode && d.parentNode.removeChild(d), c());
};
d.onerror = function () {
fc('Long-poll script failed to load: ' + b);
a.$d = !1;
a.close();
};
a.Ga.jb.body.appendChild(d);
}
} catch (e) {
}
}, Math.floor(1));
}
;
var uh = null;
'undefined' !== typeof MozWebSocket ? uh = MozWebSocket : 'undefined' !== typeof WebSocket && (uh = WebSocket);
function vh(a, b, c, d) {
this.ue = a;
this.f = pd(this.ue);
this.frames = this.Nc = null;
this.rb = this.sb = this.ff = 0;
this.Xa = uc(b);
a = { v: '5' };
'undefined' !== typeof location && location.href && -1 !== location.href.indexOf('firebaseio.com') && (a.r = 'f');
c && (a.s = c);
d && (a.ls = d);
this.jf = fd(b, gd, a);
}
var wh;
vh.prototype.open = function (a, b) {
this.lb = b;
this.Kg = a;
this.f('Websocket connecting to ' + this.jf);
this.Kc = !1;
bd.set('previous_websocket_failure', !0);
try {
this.La = new uh(this.jf);
} catch (c) {
this.f('Error instantiating WebSocket.');
var d = c.message || c.data;
d && this.f(d);
this.bb();
return;
}
var e = this;
this.La.onopen = function () {
e.f('Websocket connected.');
e.Kc = !0;
};
this.La.onclose = function () {
e.f('Websocket connection was disconnected.');
e.La = null;
e.bb();
};
this.La.onmessage = function (a) {
if (null !== e.La)
if (a = a.data, e.rb += a.length, rc(e.Xa, 'bytes_received', a.length), xh(e), null !== e.frames)
yh(e, a);
else {
a: {
O(null === e.frames, 'We already have a frame buffer');
if (6 >= a.length) {
var b = Number(a);
if (!isNaN(b)) {
e.ff = b;
e.frames = [];
a = null;
break a;
}
}
e.ff = 1;
e.frames = [];
}
null !== a && yh(e, a);
}
};
this.La.onerror = function (a) {
e.f('WebSocket error.  Closing connection.');
(a = a.message || a.data) && e.f(a);
e.bb();
};
};
vh.prototype.start = function () {
};
vh.isAvailable = function () {
var a = !1;
if ('undefined' !== typeof navigator && navigator.userAgent) {
var b = navigator.userAgent.match(/Android ([0-9]{0,}\.[0-9]{0,})/);
b && 1 < b.length && 4.4 > parseFloat(b[1]) && (a = !0);
}
return !a && null !== uh && !wh;
};
vh.responsesRequiredToBeHealthy = 2;
vh.healthyTimeout = 30000;
h = vh.prototype;
h.Hd = function () {
bd.remove('previous_websocket_failure');
};
function yh(a, b) {
a.frames.push(b);
if (a.frames.length == a.ff) {
var c = a.frames.join('');
a.frames = null;
c = Rb(c);
a.Kg(c);
}
}
h.send = function (a) {
xh(this);
a = G(a);
this.sb += a.length;
rc(this.Xa, 'bytes_sent', a.length);
a = yd(a, 16384);
1 < a.length && zh(this, String(a.length));
for (var b = 0; b < a.length; b++)
zh(this, a[b]);
};
h.fd = function () {
this.Db = !0;
this.Nc && (clearInterval(this.Nc), this.Nc = null);
this.La && (this.La.close(), this.La = null);
};
h.bb = function () {
this.Db || (this.f('WebSocket is closing itself'), this.fd(), this.lb && (this.lb(this.Kc), this.lb = null));
};
h.close = function () {
this.Db || (this.f('WebSocket is being closed'), this.fd());
};
function xh(a) {
clearInterval(a.Nc);
a.Nc = setInterval(function () {
a.La && zh(a, '0');
xh(a);
}, Math.floor(45000));
}
function zh(a, b) {
try {
a.La.send(b);
} catch (c) {
a.f('Exception thrown from WebSocket.send():', c.message || c.data, 'Closing connection.'), setTimeout(u(a.bb, a), 0);
}
}
;
function Ah(a) {
Bh(this, a);
}
var Ch = [
mh,
vh
];
function Bh(a, b) {
var c = vh && vh.isAvailable(), d = c && !(bd.Af || !0 === bd.get('previous_websocket_failure'));
b.hh && (c || S('wss:// URL used, but browser isn\'t known to support websockets.  Trying anyway.'), d = !0);
if (d)
a.jd = [vh];
else {
var e = a.jd = [];
zd(Ch, function (a, b) {
b && b.isAvailable() && e.push(b);
});
}
}
function Dh(a) {
if (0 < a.jd.length)
return a.jd[0];
throw Error('No transports available');
}
;
function Eh(a, b, c, d, e, f, g) {
this.id = a;
this.f = pd('c:' + this.id + ':');
this.nc = c;
this.Zc = d;
this.na = e;
this.Re = f;
this.G = b;
this.Pd = [];
this.kf = 0;
this.Wf = new Ah(b);
this.N = 0;
this.Fb = g;
this.f('Connection created');
Fh(this);
}
function Fh(a) {
var b = Dh(a.Wf);
a.K = new b('c:' + a.id + ':' + a.kf++, a.G, void 0, a.Fb);
a.Ve = b.responsesRequiredToBeHealthy || 0;
var c = Gh(a, a.K), d = Hh(a, a.K);
a.kd = a.K;
a.ed = a.K;
a.F = null;
a.Eb = !1;
setTimeout(function () {
a.K && a.K.open(c, d);
}, Math.floor(0));
b = b.healthyTimeout || 0;
0 < b && (a.Bd = setTimeout(function () {
a.Bd = null;
a.Eb || (a.K && 102400 < a.K.rb ? (a.f('Connection exceeded healthy timeout but has received ' + a.K.rb + ' bytes.  Marking connection healthy.'), a.Eb = !0, a.K.Hd()) : a.K && 10240 < a.K.sb ? a.f('Connection exceeded healthy timeout but has sent ' + a.K.sb + ' bytes.  Leaving connection alive.') : (a.f('Closing unhealthy connection after timeout.'), a.close()));
}, Math.floor(b)));
}
function Hh(a, b) {
return function (c) {
b === a.K ? (a.K = null, c || 0 !== a.N ? 1 === a.N && a.f('Realtime connection lost.') : (a.f('Realtime connection failed.'), 's-' === a.G.ab.substr(0, 2) && (bd.remove('host:' + a.G.host), a.G.ab = a.G.host)), a.close()) : b === a.F ? (a.f('Secondary connection lost.'), c = a.F, a.F = null, a.kd !== c && a.ed !== c || a.close()) : a.f('closing an old connection');
};
}
function Gh(a, b) {
return function (c) {
if (2 != a.N)
if (b === a.ed) {
var d = wd('t', c);
c = wd('d', c);
if ('c' == d) {
if (d = wd('t', c), 'd' in c)
if (c = c.d, 'h' === d) {
var d = c.ts, e = c.v, f = c.h;
a.Uf = c.s;
ed(a.G, f);
0 == a.N && (a.K.start(), Ih(a, a.K, d), '5' !== e && S('Protocol version mismatch detected'), c = a.Wf, (c = 1 < c.jd.length ? c.jd[1] : null) && Jh(a, c));
} else if ('n' === d) {
a.f('recvd end transmission on primary');
a.ed = a.F;
for (c = 0; c < a.Pd.length; ++c)
a.Ld(a.Pd[c]);
a.Pd = [];
Kh(a);
} else
's' === d ? (a.f('Connection shutdown command received. Shutting down...'), a.Re && (a.Re(c), a.Re = null), a.na = null, a.close()) : 'r' === d ? (a.f('Reset packet received.  New host: ' + c), ed(a.G, c), 1 === a.N ? a.close() : (Lh(a), Fh(a))) : 'e' === d ? qd('Server Error: ' + c) : 'o' === d ? (a.f('got pong on primary.'), Mh(a), Nh(a)) : qd('Unknown control packet command: ' + d);
} else
'd' == d && a.Ld(c);
} else if (b === a.F)
if (d = wd('t', c), c = wd('d', c), 'c' == d)
't' in c && (c = c.t, 'a' === c ? Oh(a) : 'r' === c ? (a.f('Got a reset on secondary, closing it'), a.F.close(), a.kd !== a.F && a.ed !== a.F || a.close()) : 'o' === c && (a.f('got pong on secondary.'), a.Tf--, Oh(a)));
else if ('d' == d)
a.Pd.push(c);
else
throw Error('Unknown protocol layer: ' + d);
else
a.f('message on old connection');
};
}
Eh.prototype.Ia = function (a) {
Ph(this, {
t: 'd',
d: a
});
};
function Kh(a) {
a.kd === a.F && a.ed === a.F && (a.f('cleaning up and promoting a connection: ' + a.F.ue), a.K = a.F, a.F = null);
}
function Oh(a) {
0 >= a.Tf ? (a.f('Secondary connection is healthy.'), a.Eb = !0, a.F.Hd(), a.F.start(), a.f('sending client ack on secondary'), a.F.send({
t: 'c',
d: {
t: 'a',
d: {}
}
}), a.f('Ending transmission on primary'), a.K.send({
t: 'c',
d: {
t: 'n',
d: {}
}
}), a.kd = a.F, Kh(a)) : (a.f('sending ping on secondary.'), a.F.send({
t: 'c',
d: {
t: 'p',
d: {}
}
}));
}
Eh.prototype.Ld = function (a) {
Mh(this);
this.nc(a);
};
function Mh(a) {
a.Eb || (a.Ve--, 0 >= a.Ve && (a.f('Primary connection is healthy.'), a.Eb = !0, a.K.Hd()));
}
function Jh(a, b) {
a.F = new b('c:' + a.id + ':' + a.kf++, a.G, a.Uf);
a.Tf = b.responsesRequiredToBeHealthy || 0;
a.F.open(Gh(a, a.F), Hh(a, a.F));
setTimeout(function () {
a.F && (a.f('Timed out trying to upgrade.'), a.F.close());
}, Math.floor(60000));
}
function Ih(a, b, c) {
a.f('Realtime connection established.');
a.K = b;
a.N = 1;
a.Zc && (a.Zc(c, a.Uf), a.Zc = null);
0 === a.Ve ? (a.f('Primary connection is healthy.'), a.Eb = !0) : setTimeout(function () {
Nh(a);
}, Math.floor(5000));
}
function Nh(a) {
a.Eb || 1 !== a.N || (a.f('sending ping on primary.'), Ph(a, {
t: 'c',
d: {
t: 'p',
d: {}
}
}));
}
function Ph(a, b) {
if (1 !== a.N)
throw 'Connection is not connected';
a.kd.send(b);
}
Eh.prototype.close = function () {
2 !== this.N && (this.f('Closing realtime connection.'), this.N = 2, Lh(this), this.na && (this.na(), this.na = null));
};
function Lh(a) {
a.f('Shutting down all connections');
a.K && (a.K.close(), a.K = null);
a.F && (a.F.close(), a.F = null);
a.Bd && (clearTimeout(a.Bd), a.Bd = null);
}
;
function Qh(a, b, c, d) {
this.id = Rh++;
this.f = pd('p:' + this.id + ':');
this.Bf = this.Ie = !1;
this.ba = {};
this.sa = [];
this.ad = 0;
this.Yc = [];
this.qa = !1;
this.eb = 1000;
this.Id = 300000;
this.Kb = b;
this.Xc = c;
this.Se = d;
this.G = a;
this.wb = this.Ca = this.Ma = this.Fb = this.$e = null;
this.Sb = !1;
this.Wd = {};
this.Wg = 0;
this.rf = !0;
this.Oc = this.Ke = null;
Sh(this, 0);
kf.yb().Ib('visible', this.Ng, this);
-1 === a.host.indexOf('fblocal') && jf.yb().Ib('online', this.Lg, this);
}
var Rh = 0, Th = 0;
h = Qh.prototype;
h.Ia = function (a, b, c) {
var d = ++this.Wg;
a = {
r: d,
a: a,
b: b
};
this.f(G(a));
O(this.qa, 'sendRequest call when we\'re not connected not allowed.');
this.Ma.Ia(a);
c && (this.Wd[d] = c);
};
h.Cf = function (a, b, c, d) {
var e = a.wa(), f = a.path.toString();
this.f('Listen called for ' + f + ' ' + e);
this.ba[f] = this.ba[f] || {};
O(Ie(a.n) || !He(a.n), 'listen() called for non-default but complete query');
O(!this.ba[f][e], 'listen() called twice for same path/queryId.');
a = {
I: d,
Ad: b,
Tg: a,
tag: c
};
this.ba[f][e] = a;
this.qa && Uh(this, a);
};
function Uh(a, b) {
var c = b.Tg, d = c.path.toString(), e = c.wa();
a.f('Listen on ' + d + ' for ' + e);
var f = { p: d };
b.tag && (f.q = Ge(c.n), f.t = b.tag);
f.h = b.Ad();
a.Ia('q', f, function (f) {
var k = f.d, m = f.s;
if (k && 'object' === typeof k && y(k, 'w')) {
var l = z(k, 'w');
da(l) && 0 <= La(l, 'no_index') && S('Using an unspecified index. Consider adding ' + ('".indexOn": "' + c.n.g.toString() + '"') + ' at ' + c.path.toString() + ' to your security rules for better performance');
}
(a.ba[d] && a.ba[d][e]) === b && (a.f('listen response', f), 'ok' !== m && Vh(a, d, e), b.I && b.I(m, k));
});
}
h.O = function (a, b, c) {
this.Ca = {
rg: a,
sf: !1,
Dc: b,
od: c
};
this.f('Authenticating using credential: ' + a);
Wh(this);
(b = 40 == a.length) || (a = Cd(a).Ec, b = 'object' === typeof a && !0 === z(a, 'admin'));
b && (this.f('Admin auth credential detected.  Reducing max reconnect time.'), this.Id = 30000);
};
h.je = function (a) {
delete this.Ca;
this.qa && this.Ia('unauth', {}, function (b) {
a(b.s, b.d);
});
};
function Wh(a) {
var b = a.Ca;
a.qa && b && a.Ia('auth', { cred: b.rg }, function (c) {
var d = c.s;
c = c.d || 'error';
'ok' !== d && a.Ca === b && delete a.Ca;
b.sf ? 'ok' !== d && b.od && b.od(d, c) : (b.sf = !0, b.Dc && b.Dc(d, c));
});
}
h.$f = function (a, b) {
var c = a.path.toString(), d = a.wa();
this.f('Unlisten called for ' + c + ' ' + d);
O(Ie(a.n) || !He(a.n), 'unlisten() called for non-default but complete query');
if (Vh(this, c, d) && this.qa) {
var e = Ge(a.n);
this.f('Unlisten on ' + c + ' for ' + d);
c = { p: c };
b && (c.q = e, c.t = b);
this.Ia('n', c);
}
};
h.Qe = function (a, b, c) {
this.qa ? Xh(this, 'o', a, b, c) : this.Yc.push({
bd: a,
action: 'o',
data: b,
I: c
});
};
h.Gf = function (a, b, c) {
this.qa ? Xh(this, 'om', a, b, c) : this.Yc.push({
bd: a,
action: 'om',
data: b,
I: c
});
};
h.Md = function (a, b) {
this.qa ? Xh(this, 'oc', a, null, b) : this.Yc.push({
bd: a,
action: 'oc',
data: null,
I: b
});
};
function Xh(a, b, c, d, e) {
c = {
p: c,
d: d
};
a.f('onDisconnect ' + b, c);
a.Ia(b, c, function (a) {
e && setTimeout(function () {
e(a.s, a.d);
}, Math.floor(0));
});
}
h.put = function (a, b, c, d) {
Yh(this, 'p', a, b, c, d);
};
h.Df = function (a, b, c, d) {
Yh(this, 'm', a, b, c, d);
};
function Yh(a, b, c, d, e, f) {
d = {
p: c,
d: d
};
p(f) && (d.h = f);
a.sa.push({
action: b,
Pf: d,
I: e
});
a.ad++;
b = a.sa.length - 1;
a.qa ? Zh(a, b) : a.f('Buffering put: ' + c);
}
function Zh(a, b) {
var c = a.sa[b].action, d = a.sa[b].Pf, e = a.sa[b].I;
a.sa[b].Ug = a.qa;
a.Ia(c, d, function (d) {
a.f(c + ' response', d);
delete a.sa[b];
a.ad--;
0 === a.ad && (a.sa = []);
e && e(d.s, d.d);
});
}
h.Ye = function (a) {
this.qa && (a = { c: a }, this.f('reportStats', a), this.Ia('s', a, function (a) {
'ok' !== a.s && this.f('reportStats', 'Error sending stats: ' + a.d);
}));
};
h.Ld = function (a) {
if ('r' in a) {
this.f('from server: ' + G(a));
var b = a.r, c = this.Wd[b];
c && (delete this.Wd[b], c(a.b));
} else {
if ('error' in a)
throw 'A server-side error has occurred: ' + a.error;
'a' in a && (b = a.a, c = a.b, this.f('handleServerMessage', b, c), 'd' === b ? this.Kb(c.p, c.d, !1, c.t) : 'm' === b ? this.Kb(c.p, c.d, !0, c.t) : 'c' === b ? $h(this, c.p, c.q) : 'ac' === b ? (a = c.s, b = c.d, c = this.Ca, delete this.Ca, c && c.od && c.od(a, b)) : 'sd' === b ? this.$e ? this.$e(c) : 'msg' in c && 'undefined' !== typeof console && console.log('FIREBASE: ' + c.msg.replace('\n', '\nFIREBASE: ')) : qd('Unrecognized action received from server: ' + G(b) + '\nAre you using the latest client?'));
}
};
h.Zc = function (a, b) {
this.f('connection ready');
this.qa = !0;
this.Oc = new Date().getTime();
this.Se({ serverTimeOffset: a - new Date().getTime() });
this.Fb = b;
if (this.rf) {
var c = {};
c['sdk.js.' + Eb.replace(/\./g, '-')] = 1;
Dg() ? c['framework.cordova'] = 1 : 'object' === typeof navigator && 'ReactNative' === navigator.product && (c['framework.reactnative'] = 1);
this.Ye(c);
}
ai(this);
this.rf = !1;
this.Xc(!0);
};
function Sh(a, b) {
O(!a.Ma, 'Scheduling a connect when we\'re already connected/ing?');
a.wb && clearTimeout(a.wb);
a.wb = setTimeout(function () {
a.wb = null;
bi(a);
}, Math.floor(b));
}
h.Ng = function (a) {
a && !this.Sb && this.eb === this.Id && (this.f('Window became visible.  Reducing delay.'), this.eb = 1000, this.Ma || Sh(this, 0));
this.Sb = a;
};
h.Lg = function (a) {
a ? (this.f('Browser went online.'), this.eb = 1000, this.Ma || Sh(this, 0)) : (this.f('Browser went offline.  Killing connection.'), this.Ma && this.Ma.close());
};
h.If = function () {
this.f('data client disconnected');
this.qa = !1;
this.Ma = null;
for (var a = 0; a < this.sa.length; a++) {
var b = this.sa[a];
b && 'h' in b.Pf && b.Ug && (b.I && b.I('disconnect'), delete this.sa[a], this.ad--);
}
0 === this.ad && (this.sa = []);
this.Wd = {};
ci(this) && (this.Sb ? this.Oc && (30000 < new Date().getTime() - this.Oc && (this.eb = 1000), this.Oc = null) : (this.f('Window isn\'t visible.  Delaying reconnect.'), this.eb = this.Id, this.Ke = new Date().getTime()), a = Math.max(0, this.eb - (new Date().getTime() - this.Ke)), a *= Math.random(), this.f('Trying to reconnect in ' + a + 'ms'), Sh(this, a), this.eb = Math.min(this.Id, 1.3 * this.eb));
this.Xc(!1);
};
function bi(a) {
if (ci(a)) {
a.f('Making a connection attempt');
a.Ke = new Date().getTime();
a.Oc = null;
var b = u(a.Ld, a), c = u(a.Zc, a), d = u(a.If, a), e = a.id + ':' + Th++;
a.Ma = new Eh(e, a.G, b, c, d, function (b) {
S(b + ' (' + a.G.toString() + ')');
a.Bf = !0;
}, a.Fb);
}
}
h.Cb = function () {
this.Ie = !0;
this.Ma ? this.Ma.close() : (this.wb && (clearTimeout(this.wb), this.wb = null), this.qa && this.If());
};
h.vc = function () {
this.Ie = !1;
this.eb = 1000;
this.Ma || Sh(this, 0);
};
function $h(a, b, c) {
c = c ? Oa(c, function (a) {
return xd(a);
}).join('$') : 'default';
(a = Vh(a, b, c)) && a.I && a.I('permission_denied');
}
function Vh(a, b, c) {
b = new P(b).toString();
var d;
p(a.ba[b]) ? (d = a.ba[b][c], delete a.ba[b][c], 0 === oa(a.ba[b]) && delete a.ba[b]) : d = void 0;
return d;
}
function ai(a) {
Wh(a);
v(a.ba, function (b) {
v(b, function (b) {
Uh(a, b);
});
});
for (var b = 0; b < a.sa.length; b++)
a.sa[b] && Zh(a, b);
for (; a.Yc.length;)
b = a.Yc.shift(), Xh(a, b.action, b.bd, b.data, b.I);
}
function ci(a) {
var b;
b = jf.yb().oc;
return !a.Bf && !a.Ie && b;
}
;
var U = {
zg: function () {
nh = wh = !0;
}
};
U.forceLongPolling = U.zg;
U.Ag = function () {
oh = !0;
};
U.forceWebSockets = U.Ag;
U.$g = function (a, b) {
a.k.Va.$e = b;
};
U.setSecurityDebugCallback = U.$g;
U.bf = function (a, b) {
a.k.bf(b);
};
U.stats = U.bf;
U.cf = function (a, b) {
a.k.cf(b);
};
U.statsIncrementCounter = U.cf;
U.ud = function (a) {
return a.k.ud;
};
U.dataUpdateCount = U.ud;
U.Dg = function (a, b) {
a.k.He = b;
};
U.interceptServerData = U.Dg;
U.Jg = function (a) {
new Ng(a);
};
U.onPopupOpen = U.Jg;
U.Yg = function (a) {
xg = a;
};
U.setAuthenticationServer = U.Yg;
function di(a, b) {
this.committed = a;
this.snapshot = b;
}
;
function V(a, b) {
this.dd = a;
this.ta = b;
}
V.prototype.cancel = function (a) {
D('Firebase.onDisconnect().cancel', 0, 1, arguments.length);
F('Firebase.onDisconnect().cancel', 1, a, !0);
var b = new B();
this.dd.Md(this.ta, C(b, a));
return b.D;
};
V.prototype.cancel = V.prototype.cancel;
V.prototype.remove = function (a) {
D('Firebase.onDisconnect().remove', 0, 1, arguments.length);
og('Firebase.onDisconnect().remove', this.ta);
F('Firebase.onDisconnect().remove', 1, a, !0);
var b = new B();
ei(this.dd, this.ta, null, C(b, a));
return b.D;
};
V.prototype.remove = V.prototype.remove;
V.prototype.set = function (a, b) {
D('Firebase.onDisconnect().set', 1, 2, arguments.length);
og('Firebase.onDisconnect().set', this.ta);
gg('Firebase.onDisconnect().set', a, this.ta, !1);
F('Firebase.onDisconnect().set', 2, b, !0);
var c = new B();
ei(this.dd, this.ta, a, C(c, b));
return c.D;
};
V.prototype.set = V.prototype.set;
V.prototype.Ob = function (a, b, c) {
D('Firebase.onDisconnect().setWithPriority', 2, 3, arguments.length);
og('Firebase.onDisconnect().setWithPriority', this.ta);
gg('Firebase.onDisconnect().setWithPriority', a, this.ta, !1);
kg('Firebase.onDisconnect().setWithPriority', 2, b);
F('Firebase.onDisconnect().setWithPriority', 3, c, !0);
var d = new B();
fi(this.dd, this.ta, a, b, C(d, c));
return d.D;
};
V.prototype.setWithPriority = V.prototype.Ob;
V.prototype.update = function (a, b) {
D('Firebase.onDisconnect().update', 1, 2, arguments.length);
og('Firebase.onDisconnect().update', this.ta);
if (da(a)) {
for (var c = {}, d = 0; d < a.length; ++d)
c['' + d] = a[d];
a = c;
S('Passing an Array to Firebase.onDisconnect().update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.');
}
jg('Firebase.onDisconnect().update', a, this.ta);
F('Firebase.onDisconnect().update', 2, b, !0);
c = new B();
gi(this.dd, this.ta, a, C(c, b));
return c.D;
};
V.prototype.update = V.prototype.update;
function W(a, b, c) {
this.A = a;
this.Y = b;
this.g = c;
}
W.prototype.J = function () {
D('Firebase.DataSnapshot.val', 0, 0, arguments.length);
return this.A.J();
};
W.prototype.val = W.prototype.J;
W.prototype.qf = function () {
D('Firebase.DataSnapshot.exportVal', 0, 0, arguments.length);
return this.A.J(!0);
};
W.prototype.exportVal = W.prototype.qf;
W.prototype.xg = function () {
D('Firebase.DataSnapshot.exists', 0, 0, arguments.length);
return !this.A.e();
};
W.prototype.exists = W.prototype.xg;
W.prototype.o = function (a) {
D('Firebase.DataSnapshot.child', 0, 1, arguments.length);
fa(a) && (a = String(a));
ng('Firebase.DataSnapshot.child', a);
var b = new P(a), c = this.Y.o(b);
return new W(this.A.S(b), c, R);
};
W.prototype.child = W.prototype.o;
W.prototype.Fa = function (a) {
D('Firebase.DataSnapshot.hasChild', 1, 1, arguments.length);
ng('Firebase.DataSnapshot.hasChild', a);
var b = new P(a);
return !this.A.S(b).e();
};
W.prototype.hasChild = W.prototype.Fa;
W.prototype.C = function () {
D('Firebase.DataSnapshot.getPriority', 0, 0, arguments.length);
return this.A.C().J();
};
W.prototype.getPriority = W.prototype.C;
W.prototype.forEach = function (a) {
D('Firebase.DataSnapshot.forEach', 1, 1, arguments.length);
F('Firebase.DataSnapshot.forEach', 1, a, !1);
if (this.A.L())
return !1;
var b = this;
return !!this.A.R(this.g, function (c, d) {
return a(new W(d, b.Y.o(c), R));
});
};
W.prototype.forEach = W.prototype.forEach;
W.prototype.zd = function () {
D('Firebase.DataSnapshot.hasChildren', 0, 0, arguments.length);
return this.A.L() ? !1 : !this.A.e();
};
W.prototype.hasChildren = W.prototype.zd;
W.prototype.name = function () {
S('Firebase.DataSnapshot.name() being deprecated. Please use Firebase.DataSnapshot.key() instead.');
D('Firebase.DataSnapshot.name', 0, 0, arguments.length);
return this.key();
};
W.prototype.name = W.prototype.name;
W.prototype.key = function () {
D('Firebase.DataSnapshot.key', 0, 0, arguments.length);
return this.Y.key();
};
W.prototype.key = W.prototype.key;
W.prototype.Hb = function () {
D('Firebase.DataSnapshot.numChildren', 0, 0, arguments.length);
return this.A.Hb();
};
W.prototype.numChildren = W.prototype.Hb;
W.prototype.Mb = function () {
D('Firebase.DataSnapshot.ref', 0, 0, arguments.length);
return this.Y;
};
W.prototype.ref = W.prototype.Mb;
function hi(a, b, c) {
this.Vb = a;
this.tb = b;
this.vb = c || null;
}
h = hi.prototype;
h.Qf = function (a) {
return 'value' === a;
};
h.createEvent = function (a, b) {
var c = b.n.g;
return new jc('value', this, new W(a.Na, b.Mb(), c));
};
h.Zb = function (a) {
var b = this.vb;
if ('cancel' === a.De()) {
O(this.tb, 'Raising a cancel event on a listener with no cancel callback');
var c = this.tb;
return function () {
c.call(b, a.error);
};
}
var d = this.Vb;
return function () {
d.call(b, a.be);
};
};
h.lf = function (a, b) {
return this.tb ? new kc(this, a, b) : null;
};
h.matches = function (a) {
return a instanceof hi ? a.Vb && this.Vb ? a.Vb === this.Vb && a.vb === this.vb : !0 : !1;
};
h.yf = function () {
return null !== this.Vb;
};
function ii(a, b, c) {
this.ja = a;
this.tb = b;
this.vb = c;
}
h = ii.prototype;
h.Qf = function (a) {
a = 'children_added' === a ? 'child_added' : a;
return ('children_removed' === a ? 'child_removed' : a) in this.ja;
};
h.lf = function (a, b) {
return this.tb ? new kc(this, a, b) : null;
};
h.createEvent = function (a, b) {
O(null != a.Za, 'Child events should have a childName.');
var c = b.Mb().o(a.Za);
return new jc(a.type, this, new W(a.Na, c, b.n.g), a.Td);
};
h.Zb = function (a) {
var b = this.vb;
if ('cancel' === a.De()) {
O(this.tb, 'Raising a cancel event on a listener with no cancel callback');
var c = this.tb;
return function () {
c.call(b, a.error);
};
}
var d = this.ja[a.wd];
return function () {
d.call(b, a.be, a.Td);
};
};
h.matches = function (a) {
if (a instanceof ii) {
if (!this.ja || !a.ja)
return !0;
if (this.vb === a.vb) {
var b = oa(a.ja);
if (b === oa(this.ja)) {
if (1 === b) {
var b = pa(a.ja), c = pa(this.ja);
return c === b && (!a.ja[b] || !this.ja[c] || a.ja[b] === this.ja[c]);
}
return na(this.ja, function (b, c) {
return a.ja[c] === b;
});
}
}
}
return !1;
};
h.yf = function () {
return null !== this.ja;
};
function ji() {
this.za = {};
}
h = ji.prototype;
h.e = function () {
return va(this.za);
};
h.gb = function (a, b, c) {
var d = a.source.Lb;
if (null !== d)
return d = z(this.za, d), O(null != d, 'SyncTree gave us an op for an invalid query.'), d.gb(a, b, c);
var e = [];
v(this.za, function (d) {
e = e.concat(d.gb(a, b, c));
});
return e;
};
h.Tb = function (a, b, c, d, e) {
var f = a.wa(), g = z(this.za, f);
if (!g) {
var g = c.Aa(e ? d : null), k = !1;
g ? k = !0 : (g = d instanceof fe ? c.Cc(d) : H, k = !1);
g = new Ye(a, new je(new Xb(g, k, !1), new Xb(d, e, !1)));
this.za[f] = g;
}
g.Tb(b);
return af(g, b);
};
h.nb = function (a, b, c) {
var d = a.wa(), e = [], f = [], g = null != ki(this);
if ('default' === d) {
var k = this;
v(this.za, function (a, d) {
f = f.concat(a.nb(b, c));
a.e() && (delete k.za[d], He(a.Y.n) || e.push(a.Y));
});
} else {
var m = z(this.za, d);
m && (f = f.concat(m.nb(b, c)), m.e() && (delete this.za[d], He(m.Y.n) || e.push(m.Y)));
}
g && null == ki(this) && e.push(new X(a.k, a.path));
return {
Vg: e,
vg: f
};
};
function li(a) {
return Na(qa(a.za), function (a) {
return !He(a.Y.n);
});
}
h.kb = function (a) {
var b = null;
v(this.za, function (c) {
b = b || c.kb(a);
});
return b;
};
function mi(a, b) {
if (He(b.n))
return ki(a);
var c = b.wa();
return z(a.za, c);
}
function ki(a) {
return ua(a.za, function (a) {
return He(a.Y.n);
}) || null;
}
;
function ni(a) {
this.va = qe;
this.mb = new Pf();
this.df = {};
this.qc = {};
this.Qc = a;
}
function oi(a, b, c, d, e) {
var f = a.mb, g = e;
O(d > f.Pc, 'Stacking an older write on top of newer ones');
p(g) || (g = !0);
f.pa.push({
path: b,
Ja: c,
md: d,
visible: g
});
g && (f.V = Jf(f.V, b, c));
f.Pc = d;
return e ? pi(a, new Ac(Ef, b, c)) : [];
}
function qi(a, b, c, d) {
var e = a.mb;
O(d > e.Pc, 'Stacking an older merge on top of newer ones');
e.pa.push({
path: b,
children: c,
md: d,
visible: !0
});
e.V = Kf(e.V, b, c);
e.Pc = d;
c = sf(c);
return pi(a, new bf(Ef, b, c));
}
function ri(a, b, c) {
c = c || !1;
var d = Qf(a.mb, b);
if (a.mb.Ud(b)) {
var e = qe;
null != d.Ja ? e = e.set(M, !0) : Fb(d.children, function (a, b) {
e = e.set(new P(a), b);
});
return pi(a, new Df(d.path, e, c));
}
return [];
}
function si(a, b, c) {
c = sf(c);
return pi(a, new bf(Gf, b, c));
}
function ti(a, b, c, d) {
d = ui(a, d);
if (null != d) {
var e = vi(d);
d = e.path;
e = e.Lb;
b = lf(d, b);
c = new Ac(new Ff(!1, !0, e, !0), b, c);
return wi(a, d, c);
}
return [];
}
function xi(a, b, c, d) {
if (d = ui(a, d)) {
var e = vi(d);
d = e.path;
e = e.Lb;
b = lf(d, b);
c = sf(c);
c = new bf(new Ff(!1, !0, e, !0), b, c);
return wi(a, d, c);
}
return [];
}
ni.prototype.Tb = function (a, b) {
var c = a.path, d = null, e = !1;
zf(this.va, c, function (a, b) {
var f = lf(a, c);
d = d || b.kb(f);
e = e || null != ki(b);
});
var f = this.va.get(c);
f ? (e = e || null != ki(f), d = d || f.kb(M)) : (f = new ji(), this.va = this.va.set(c, f));
var g;
null != d ? g = !0 : (g = !1, d = H, Cf(this.va.subtree(c), function (a, b) {
var c = b.kb(M);
c && (d = d.W(a, c));
}));
var k = null != mi(f, a);
if (!k && !He(a.n)) {
var m = yi(a);
O(!(m in this.qc), 'View does not exist, but we have a tag');
var l = zi++;
this.qc[m] = l;
this.df['_' + l] = m;
}
g = f.Tb(a, b, new Uf(c, this.mb), d, g);
k || e || (f = mi(f, a), g = g.concat(Ai(this, a, f)));
return g;
};
ni.prototype.nb = function (a, b, c) {
var d = a.path, e = this.va.get(d), f = [];
if (e && ('default' === a.wa() || null != mi(e, a))) {
f = e.nb(a, b, c);
e.e() && (this.va = this.va.remove(d));
e = f.Vg;
f = f.vg;
b = -1 !== Sa(e, function (a) {
return He(a.n);
});
var g = xf(this.va, d, function (a, b) {
return null != ki(b);
});
if (b && !g && (d = this.va.subtree(d), !d.e()))
for (var d = Bi(d), k = 0; k < d.length; ++k) {
var m = d[k], l = m.Y, m = Ci(this, m);
this.Qc.af(Di(l), Ei(this, l), m.Ad, m.I);
}
if (!g && 0 < e.length && !c)
if (b)
this.Qc.de(Di(a), null);
else {
var t = this;
Ma(e, function (a) {
a.wa();
var b = t.qc[yi(a)];
t.Qc.de(Di(a), b);
});
}
Fi(this, e);
}
return f;
};
ni.prototype.Aa = function (a, b) {
var c = this.mb, d = xf(this.va, a, function (b, c) {
var d = lf(b, a);
if (d = c.kb(d))
return d;
});
return c.Aa(a, d, b, !0);
};
function Bi(a) {
return vf(a, function (a, c, d) {
if (c && null != ki(c))
return [ki(c)];
var e = [];
c && (e = li(c));
v(d, function (a) {
e = e.concat(a);
});
return e;
});
}
function Fi(a, b) {
for (var c = 0; c < b.length; ++c) {
var d = b[c];
if (!He(d.n)) {
var d = yi(d), e = a.qc[d];
delete a.qc[d];
delete a.df['_' + e];
}
}
}
function Di(a) {
return He(a.n) && !Ie(a.n) ? a.Mb() : a;
}
function Ai(a, b, c) {
var d = b.path, e = Ei(a, b);
c = Ci(a, c);
b = a.Qc.af(Di(b), e, c.Ad, c.I);
d = a.va.subtree(d);
if (e)
O(null == ki(d.value), 'If we\'re adding a query, it shouldn\'t be shadowed');
else
for (e = vf(d, function (a, b, c) {
if (!a.e() && b && null != ki(b))
return [Ze(ki(b))];
var d = [];
b && (d = d.concat(Oa(li(b), function (a) {
return a.Y;
})));
v(c, function (a) {
d = d.concat(a);
});
return d;
}), d = 0; d < e.length; ++d)
c = e[d], a.Qc.de(Di(c), Ei(a, c));
return b;
}
function Ci(a, b) {
var c = b.Y, d = Ei(a, c);
return {
Ad: function () {
return (b.w() || H).hash();
},
I: function (b) {
if ('ok' === b) {
if (d) {
var f = c.path;
if (b = ui(a, d)) {
var g = vi(b);
b = g.path;
g = g.Lb;
f = lf(b, f);
f = new Cc(new Ff(!1, !0, g, !0), f);
b = wi(a, b, f);
} else
b = [];
} else
b = pi(a, new Cc(Gf, c.path));
return b;
}
f = 'Unknown Error';
'too_big' === b ? f = 'The data requested exceeds the maximum size that can be accessed with a single request.' : 'permission_denied' == b ? f = 'Client doesn\'t have permission to access the desired data.' : 'unavailable' == b && (f = 'The service is unavailable');
f = Error(b + ': ' + f);
f.code = b.toUpperCase();
return a.nb(c, null, f);
}
};
}
function yi(a) {
return a.path.toString() + '$' + a.wa();
}
function vi(a) {
var b = a.indexOf('$');
O(-1 !== b && b < a.length - 1, 'Bad queryKey.');
return {
Lb: a.substr(b + 1),
path: new P(a.substr(0, b))
};
}
function ui(a, b) {
var c = a.df, d = '_' + b;
return d in c ? c[d] : void 0;
}
function Ei(a, b) {
var c = yi(b);
return z(a.qc, c);
}
var zi = 1;
function wi(a, b, c) {
var d = a.va.get(b);
O(d, 'Missing sync point for query tag that we\'re tracking');
return d.gb(c, new Uf(b, a.mb), null);
}
function pi(a, b) {
return Gi(a, b, a.va, null, new Uf(M, a.mb));
}
function Gi(a, b, c, d, e) {
if (b.path.e())
return Hi(a, b, c, d, e);
var f = c.get(M);
null == d && null != f && (d = f.kb(M));
var g = [], k = K(b.path), m = b.$c(k);
if ((c = c.children.get(k)) && m)
var l = d ? d.T(k) : null, k = e.o(k), g = g.concat(Gi(a, m, c, l, k));
f && (g = g.concat(f.gb(b, e, d)));
return g;
}
function Hi(a, b, c, d, e) {
var f = c.get(M);
null == d && null != f && (d = f.kb(M));
var g = [];
c.children.ka(function (c, f) {
var l = d ? d.T(c) : null, t = e.o(c), A = b.$c(c);
A && (g = g.concat(Hi(a, A, f, l, t)));
});
f && (g = g.concat(f.gb(b, e, d)));
return g;
}
;
function Ii(a, b) {
this.G = a;
this.Xa = uc(a);
this.hd = null;
this.fa = new Zb();
this.Kd = 1;
this.Va = null;
b || 0 <= ('object' === typeof window && window.navigator && window.navigator.userAgent || '').search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i) ? (this.da = new cf(this.G, u(this.Kb, this)), setTimeout(u(this.Xc, this, !0), 0)) : this.da = this.Va = new Qh(this.G, u(this.Kb, this), u(this.Xc, this), u(this.Se, this));
this.dh = vc(a, u(function () {
return new pc(this.Xa, this.da);
}, this));
this.yc = new Wf();
this.Ge = new Sb();
var c = this;
this.Fd = new ni({
af: function (a, b, f, g) {
b = [];
f = c.Ge.j(a.path);
f.e() || (b = pi(c.Fd, new Ac(Gf, a.path, f)), setTimeout(function () {
g('ok');
}, 0));
return b;
},
de: aa
});
Ji(this, 'connected', !1);
this.na = new Vc();
this.O = new Xg(a, u(this.da.O, this.da), u(this.da.je, this.da), u(this.Pe, this));
this.ud = 0;
this.He = null;
this.M = new ni({
af: function (a, b, f, g) {
c.da.Cf(a, f, b, function (b, e) {
var f = g(b, e);
dc(c.fa, a.path, f);
});
return [];
},
de: function (a, b) {
c.da.$f(a, b);
}
});
}
h = Ii.prototype;
h.toString = function () {
return (this.G.ob ? 'https://' : 'http://') + this.G.host;
};
h.name = function () {
return this.G.lc;
};
function Ki(a) {
a = a.Ge.j(new P('.info/serverTimeOffset')).J() || 0;
return new Date().getTime() + a;
}
function Li(a) {
a = a = { timestamp: Ki(a) };
a.timestamp = a.timestamp || new Date().getTime();
return a;
}
h.Kb = function (a, b, c, d) {
this.ud++;
var e = new P(a);
b = this.He ? this.He(a, b) : b;
a = [];
d ? c ? (b = ma(b, function (a) {
return Q(a);
}), a = xi(this.M, e, b, d)) : (b = Q(b), a = ti(this.M, e, b, d)) : c ? (d = ma(b, function (a) {
return Q(a);
}), a = si(this.M, e, d)) : (d = Q(b), a = pi(this.M, new Ac(Gf, e, d)));
d = e;
0 < a.length && (d = Mi(this, e));
dc(this.fa, d, a);
};
h.Xc = function (a) {
Ji(this, 'connected', a);
!1 === a && Ni(this);
};
h.Se = function (a) {
var b = this;
zd(a, function (a, d) {
Ji(b, d, a);
});
};
h.Pe = function (a) {
Ji(this, 'authenticated', a);
};
function Ji(a, b, c) {
b = new P('/.info/' + b);
c = Q(c);
var d = a.Ge;
d.Zd = d.Zd.H(b, c);
c = pi(a.Fd, new Ac(Gf, b, c));
dc(a.fa, b, c);
}
h.Ob = function (a, b, c, d) {
this.f('set', {
path: a.toString(),
value: b,
lh: c
});
var e = Li(this);
b = Q(b, c);
var e = Xc(b, e), f = this.Kd++, e = oi(this.M, a, e, f, !0);
$b(this.fa, e);
var g = this;
this.da.put(a.toString(), b.J(!0), function (b, c) {
var e = 'ok' === b;
e || S('set at ' + a + ' failed: ' + b);
e = ri(g.M, f, !e);
dc(g.fa, a, e);
Oi(d, b, c);
});
e = Pi(this, a);
Mi(this, e);
dc(this.fa, e, []);
};
h.update = function (a, b, c) {
this.f('update', {
path: a.toString(),
value: b
});
var d = !0, e = Li(this), f = {};
v(b, function (a, b) {
d = !1;
var c = Q(a);
f[b] = Xc(c, e);
});
if (d)
fc('update() called with empty data.  Don\'t do anything.'), Oi(c, 'ok');
else {
var g = this.Kd++, k = qi(this.M, a, f, g);
$b(this.fa, k);
var m = this;
this.da.Df(a.toString(), b, function (b, d) {
var e = 'ok' === b;
e || S('update at ' + a + ' failed: ' + b);
var e = ri(m.M, g, !e), f = a;
0 < e.length && (f = Mi(m, a));
dc(m.fa, f, e);
Oi(c, b, d);
});
b = Pi(this, a);
Mi(this, b);
dc(this.fa, a, []);
}
};
function Ni(a) {
a.f('onDisconnectEvents');
var b = Li(a), c = [];
Wc(Uc(a.na, b), M, function (b, e) {
c = c.concat(pi(a.M, new Ac(Gf, b, e)));
var f = Pi(a, b);
Mi(a, f);
});
a.na = new Vc();
dc(a.fa, M, c);
}
h.Md = function (a, b) {
var c = this;
this.da.Md(a.toString(), function (d, e) {
'ok' === d && wg(c.na, a);
Oi(b, d, e);
});
};
function ei(a, b, c, d) {
var e = Q(c);
a.da.Qe(b.toString(), e.J(!0), function (c, g) {
'ok' === c && a.na.rc(b, e);
Oi(d, c, g);
});
}
function fi(a, b, c, d, e) {
var f = Q(c, d);
a.da.Qe(b.toString(), f.J(!0), function (c, d) {
'ok' === c && a.na.rc(b, f);
Oi(e, c, d);
});
}
function gi(a, b, c, d) {
var e = !0, f;
for (f in c)
e = !1;
e ? (fc('onDisconnect().update() called with empty data.  Don\'t do anything.'), Oi(d, 'ok')) : a.da.Gf(b.toString(), c, function (e, f) {
if ('ok' === e)
for (var m in c) {
var l = Q(c[m]);
a.na.rc(b.o(m), l);
}
Oi(d, e, f);
});
}
function Qi(a, b, c) {
c = '.info' === K(b.path) ? a.Fd.Tb(b, c) : a.M.Tb(b, c);
bc(a.fa, b.path, c);
}
h.Cb = function () {
this.Va && this.Va.Cb();
};
h.vc = function () {
this.Va && this.Va.vc();
};
h.bf = function (a) {
if ('undefined' !== typeof console) {
a ? (this.hd || (this.hd = new oc(this.Xa)), a = this.hd.get()) : a = this.Xa.get();
var b = Pa(ra(a), function (a, b) {
return Math.max(b.length, a);
}, 0), c;
for (c in a) {
for (var d = a[c], e = c.length; e < b + 2; e++)
c += ' ';
console.log(c + d);
}
}
};
h.cf = function (a) {
rc(this.Xa, a);
this.dh.Vf[a] = !0;
};
h.f = function (a) {
var b = '';
this.Va && (b = this.Va.id + ':');
fc(b, arguments);
};
function Oi(a, b, c) {
a && gc(function () {
if ('ok' == b)
a(null);
else {
var d = (b || 'error').toUpperCase(), e = d;
c && (e += ': ' + c);
e = Error(e);
e.code = d;
a(e);
}
});
}
;
function Ri(a, b, c, d, e) {
function f() {
}
a.f('transaction on ' + b);
var g = new X(a, b);
g.Ib('value', f);
c = {
path: b,
update: c,
I: d,
status: null,
Lf: id(),
gf: e,
Sf: 0,
le: function () {
g.mc('value', f);
},
ne: null,
Da: null,
rd: null,
sd: null,
td: null
};
d = a.M.Aa(b, void 0) || H;
c.rd = d;
d = c.update(d.J());
if (p(d)) {
hg('transaction failed: Data returned ', d, c.path);
c.status = 1;
e = Xf(a.yc, b);
var k = e.Ea() || [];
k.push(c);
Yf(e, k);
'object' === typeof d && null !== d && y(d, '.priority') ? (k = z(d, '.priority'), O(fg(k), 'Invalid priority returned by transaction. Priority must be a valid string, finite number, server value, or null.')) : k = (a.M.Aa(b) || H).C().J();
e = Li(a);
d = Q(d, k);
e = Xc(d, e);
c.sd = d;
c.td = e;
c.Da = a.Kd++;
c = oi(a.M, b, e, c.Da, c.gf);
dc(a.fa, b, c);
Si(a);
} else
c.le(), c.sd = null, c.td = null, c.I && (a = new W(c.rd, new X(a, c.path), R), c.I(null, !1, a));
}
function Si(a, b) {
var c = b || a.yc;
b || Ti(a, c);
if (null !== c.Ea()) {
var d = Ui(a, c);
O(0 < d.length, 'Sending zero length transaction queue');
Qa(d, function (a) {
return 1 === a.status;
}) && Vi(a, c.path(), d);
} else
c.zd() && c.R(function (b) {
Si(a, b);
});
}
function Vi(a, b, c) {
for (var d = Oa(c, function (a) {
return a.Da;
}), e = a.M.Aa(b, d) || H, d = e, e = e.hash(), f = 0; f < c.length; f++) {
var g = c[f];
O(1 === g.status, 'tryToSendTransactionQueue_: items in queue should all be run.');
g.status = 2;
g.Sf++;
var k = lf(b, g.path), d = d.H(k, g.sd);
}
d = d.J(!0);
a.da.put(b.toString(), d, function (d) {
a.f('transaction put response', {
path: b.toString(),
status: d
});
var e = [];
if ('ok' === d) {
d = [];
for (f = 0; f < c.length; f++) {
c[f].status = 3;
e = e.concat(ri(a.M, c[f].Da));
if (c[f].I) {
var g = c[f].td, k = new X(a, c[f].path);
d.push(u(c[f].I, null, null, !0, new W(g, k, R)));
}
c[f].le();
}
Ti(a, Xf(a.yc, b));
Si(a);
dc(a.fa, b, e);
for (f = 0; f < d.length; f++)
gc(d[f]);
} else {
if ('datastale' === d)
for (f = 0; f < c.length; f++)
c[f].status = 4 === c[f].status ? 5 : 1;
else
for (S('transaction at ' + b.toString() + ' failed: ' + d), f = 0; f < c.length; f++)
c[f].status = 5, c[f].ne = d;
Mi(a, b);
}
}, e);
}
function Mi(a, b) {
var c = Wi(a, b), d = c.path(), c = Ui(a, c);
Xi(a, c, d);
return d;
}
function Xi(a, b, c) {
if (0 !== b.length) {
for (var d = [], e = [], f = Oa(b, function (a) {
return a.Da;
}), g = 0; g < b.length; g++) {
var k = b[g], m = lf(c, k.path), l = !1, t;
O(null !== m, 'rerunTransactionsUnderNode_: relativePath should not be null.');
if (5 === k.status)
l = !0, t = k.ne, e = e.concat(ri(a.M, k.Da, !0));
else if (1 === k.status)
if (25 <= k.Sf)
l = !0, t = 'maxretry', e = e.concat(ri(a.M, k.Da, !0));
else {
var A = a.M.Aa(k.path, f) || H;
k.rd = A;
var I = b[g].update(A.J());
p(I) ? (hg('transaction failed: Data returned ', I, k.path), m = Q(I), 'object' === typeof I && null != I && y(I, '.priority') || (m = m.ia(A.C())), A = k.Da, I = Li(a), I = Xc(m, I), k.sd = m, k.td = I, k.Da = a.Kd++, Ta(f, A), e = e.concat(oi(a.M, k.path, I, k.Da, k.gf)), e = e.concat(ri(a.M, A, !0))) : (l = !0, t = 'nodata', e = e.concat(ri(a.M, k.Da, !0)));
}
dc(a.fa, c, e);
e = [];
l && (b[g].status = 3, setTimeout(b[g].le, Math.floor(0)), b[g].I && ('nodata' === t ? (k = new X(a, b[g].path), d.push(u(b[g].I, null, null, !1, new W(b[g].rd, k, R)))) : d.push(u(b[g].I, null, Error(t), !1, null))));
}
Ti(a, a.yc);
for (g = 0; g < d.length; g++)
gc(d[g]);
Si(a);
}
}
function Wi(a, b) {
for (var c, d = a.yc; null !== (c = K(b)) && null === d.Ea();)
d = Xf(d, c), b = N(b);
return d;
}
function Ui(a, b) {
var c = [];
Yi(a, b, c);
c.sort(function (a, b) {
return a.Lf - b.Lf;
});
return c;
}
function Yi(a, b, c) {
var d = b.Ea();
if (null !== d)
for (var e = 0; e < d.length; e++)
c.push(d[e]);
b.R(function (b) {
Yi(a, b, c);
});
}
function Ti(a, b) {
var c = b.Ea();
if (c) {
for (var d = 0, e = 0; e < c.length; e++)
3 !== c[e].status && (c[d] = c[e], d++);
c.length = d;
Yf(b, 0 < c.length ? c : null);
}
b.R(function (b) {
Ti(a, b);
});
}
function Pi(a, b) {
var c = Wi(a, b).path(), d = Xf(a.yc, b);
ag(d, function (b) {
Zi(a, b);
});
Zi(a, d);
$f(d, function (b) {
Zi(a, b);
});
return c;
}
function Zi(a, b) {
var c = b.Ea();
if (null !== c) {
for (var d = [], e = [], f = -1, g = 0; g < c.length; g++)
4 !== c[g].status && (2 === c[g].status ? (O(f === g - 1, 'All SENT items should be at beginning of queue.'), f = g, c[g].status = 4, c[g].ne = 'set') : (O(1 === c[g].status, 'Unexpected transaction status in abort'), c[g].le(), e = e.concat(ri(a.M, c[g].Da, !0)), c[g].I && d.push(u(c[g].I, null, Error('set'), !1, null))));
-1 === f ? Yf(b, null) : c.length = f + 1;
dc(a.fa, b.path(), e);
for (g = 0; g < d.length; g++)
gc(d[g]);
}
}
;
function $i() {
this.sc = {};
this.ag = !1;
}
$i.prototype.Cb = function () {
for (var a in this.sc)
this.sc[a].Cb();
};
$i.prototype.vc = function () {
for (var a in this.sc)
this.sc[a].vc();
};
$i.prototype.ze = function () {
this.ag = !0;
};
ba($i);
$i.prototype.interrupt = $i.prototype.Cb;
$i.prototype.resume = $i.prototype.vc;
function Y(a, b, c, d) {
this.k = a;
this.path = b;
this.n = c;
this.pc = d;
}
function aj(a) {
var b = null, c = null;
a.oa && (b = Od(a));
a.ra && (c = Rd(a));
if (a.g === re) {
if (a.oa) {
if ('[MIN_NAME]' != Nd(a))
throw Error('Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().');
if ('string' !== typeof b)
throw Error('Query: When ordering by key, the argument passed to startAt(), endAt(),or equalTo() must be a string.');
}
if (a.ra) {
if ('[MAX_NAME]' != Pd(a))
throw Error('Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().');
if ('string' !== typeof c)
throw Error('Query: When ordering by key, the argument passed to startAt(), endAt(),or equalTo() must be a string.');
}
} else if (a.g === R) {
if (null != b && !fg(b) || null != c && !fg(c))
throw Error('Query: When ordering by priority, the first argument passed to startAt(), endAt(), or equalTo() must be a valid priority value (null, a number, or a string).');
} else if (O(a.g instanceof ve || a.g === Be, 'unknown index type.'), null != b && 'object' === typeof b || null != c && 'object' === typeof c)
throw Error('Query: First argument passed to startAt(), endAt(), or equalTo() cannot be an object.');
}
function bj(a) {
if (a.oa && a.ra && a.la && (!a.la || '' === a.Rb))
throw Error('Query: Can\'t combine startAt(), endAt(), and limit(). Use limitToFirst() or limitToLast() instead.');
}
function cj(a, b) {
if (!0 === a.pc)
throw Error(b + ': You can\'t combine multiple orderBy calls.');
}
h = Y.prototype;
h.Mb = function () {
D('Query.ref', 0, 0, arguments.length);
return new X(this.k, this.path);
};
h.Ib = function (a, b, c, d) {
D('Query.on', 2, 4, arguments.length);
lg('Query.on', a, !1);
F('Query.on', 2, b, !1);
var e = dj('Query.on', c, d);
if ('value' === a)
Qi(this.k, this, new hi(b, e.cancel || null, e.Qa || null));
else {
var f = {};
f[a] = b;
Qi(this.k, this, new ii(f, e.cancel, e.Qa));
}
return b;
};
h.mc = function (a, b, c) {
D('Query.off', 0, 3, arguments.length);
lg('Query.off', a, !0);
F('Query.off', 2, b, !0);
Qb('Query.off', 3, c);
var d = null, e = null;
'value' === a ? d = new hi(b || null, null, c || null) : a && (b && (e = {}, e[a] = b), d = new ii(e, null, c || null));
e = this.k;
d = '.info' === K(this.path) ? e.Fd.nb(this, d) : e.M.nb(this, d);
bc(e.fa, this.path, d);
};
h.Og = function (a, b) {
function c(k) {
f && (f = !1, e.mc(a, c), b && b.call(d.Qa, k), g.resolve(k));
}
D('Query.once', 1, 4, arguments.length);
lg('Query.once', a, !1);
F('Query.once', 2, b, !0);
var d = dj('Query.once', arguments[2], arguments[3]), e = this, f = !0, g = new B();
Nb(g.D);
this.Ib(a, c, function (b) {
e.mc(a, c);
d.cancel && d.cancel.call(d.Qa, b);
g.reject(b);
});
return g.D;
};
h.Le = function (a) {
S('Query.limit() being deprecated. Please use Query.limitToFirst() or Query.limitToLast() instead.');
D('Query.limit', 1, 1, arguments.length);
if (!fa(a) || Math.floor(a) !== a || 0 >= a)
throw Error('Query.limit: First argument must be a positive integer.');
if (this.n.la)
throw Error('Query.limit: Limit was already set (by another call to limit, limitToFirst, orlimitToLast.');
var b = this.n.Le(a);
bj(b);
return new Y(this.k, this.path, b, this.pc);
};
h.Me = function (a) {
D('Query.limitToFirst', 1, 1, arguments.length);
if (!fa(a) || Math.floor(a) !== a || 0 >= a)
throw Error('Query.limitToFirst: First argument must be a positive integer.');
if (this.n.la)
throw Error('Query.limitToFirst: Limit was already set (by another call to limit, limitToFirst, or limitToLast).');
return new Y(this.k, this.path, this.n.Me(a), this.pc);
};
h.Ne = function (a) {
D('Query.limitToLast', 1, 1, arguments.length);
if (!fa(a) || Math.floor(a) !== a || 0 >= a)
throw Error('Query.limitToLast: First argument must be a positive integer.');
if (this.n.la)
throw Error('Query.limitToLast: Limit was already set (by another call to limit, limitToFirst, or limitToLast).');
return new Y(this.k, this.path, this.n.Ne(a), this.pc);
};
h.Pg = function (a) {
D('Query.orderByChild', 1, 1, arguments.length);
if ('$key' === a)
throw Error('Query.orderByChild: "$key" is invalid.  Use Query.orderByKey() instead.');
if ('$priority' === a)
throw Error('Query.orderByChild: "$priority" is invalid.  Use Query.orderByPriority() instead.');
if ('$value' === a)
throw Error('Query.orderByChild: "$value" is invalid.  Use Query.orderByValue() instead.');
ng('Query.orderByChild', a);
cj(this, 'Query.orderByChild');
var b = new P(a);
if (b.e())
throw Error('Query.orderByChild: cannot pass in empty path.  Use Query.orderByValue() instead.');
b = new ve(b);
b = Fe(this.n, b);
aj(b);
return new Y(this.k, this.path, b, !0);
};
h.Qg = function () {
D('Query.orderByKey', 0, 0, arguments.length);
cj(this, 'Query.orderByKey');
var a = Fe(this.n, re);
aj(a);
return new Y(this.k, this.path, a, !0);
};
h.Rg = function () {
D('Query.orderByPriority', 0, 0, arguments.length);
cj(this, 'Query.orderByPriority');
var a = Fe(this.n, R);
aj(a);
return new Y(this.k, this.path, a, !0);
};
h.Sg = function () {
D('Query.orderByValue', 0, 0, arguments.length);
cj(this, 'Query.orderByValue');
var a = Fe(this.n, Be);
aj(a);
return new Y(this.k, this.path, a, !0);
};
h.ce = function (a, b) {
D('Query.startAt', 0, 2, arguments.length);
gg('Query.startAt', a, this.path, !0);
mg('Query.startAt', b);
var c = this.n.ce(a, b);
bj(c);
aj(c);
if (this.n.oa)
throw Error('Query.startAt: Starting point was already set (by another call to startAt or equalTo).');
p(a) || (b = a = null);
return new Y(this.k, this.path, c, this.pc);
};
h.vd = function (a, b) {
D('Query.endAt', 0, 2, arguments.length);
gg('Query.endAt', a, this.path, !0);
mg('Query.endAt', b);
var c = this.n.vd(a, b);
bj(c);
aj(c);
if (this.n.ra)
throw Error('Query.endAt: Ending point was already set (by another call to endAt or equalTo).');
return new Y(this.k, this.path, c, this.pc);
};
h.tg = function (a, b) {
D('Query.equalTo', 1, 2, arguments.length);
gg('Query.equalTo', a, this.path, !1);
mg('Query.equalTo', b);
if (this.n.oa)
throw Error('Query.equalTo: Starting point was already set (by another call to endAt or equalTo).');
if (this.n.ra)
throw Error('Query.equalTo: Ending point was already set (by another call to endAt or equalTo).');
return this.ce(a, b).vd(a, b);
};
h.toString = function () {
D('Query.toString', 0, 0, arguments.length);
for (var a = this.path, b = '', c = a.aa; c < a.u.length; c++)
'' !== a.u[c] && (b += '/' + encodeURIComponent(String(a.u[c])));
return this.k.toString() + (b || '/');
};
h.wa = function () {
var a = xd(Ge(this.n));
return '{}' === a ? 'default' : a;
};
function dj(a, b, c) {
var d = {
cancel: null,
Qa: null
};
if (b && c)
d.cancel = b, F(a, 3, d.cancel, !0), d.Qa = c, Qb(a, 4, d.Qa);
else if (b)
if ('object' === typeof b && null !== b)
d.Qa = b;
else if ('function' === typeof b)
d.cancel = b;
else
throw Error(E(a, 3, !0) + ' must either be a cancel callback or a context object.');
return d;
}
Y.prototype.ref = Y.prototype.Mb;
Y.prototype.on = Y.prototype.Ib;
Y.prototype.off = Y.prototype.mc;
Y.prototype.once = Y.prototype.Og;
Y.prototype.limit = Y.prototype.Le;
Y.prototype.limitToFirst = Y.prototype.Me;
Y.prototype.limitToLast = Y.prototype.Ne;
Y.prototype.orderByChild = Y.prototype.Pg;
Y.prototype.orderByKey = Y.prototype.Qg;
Y.prototype.orderByPriority = Y.prototype.Rg;
Y.prototype.orderByValue = Y.prototype.Sg;
Y.prototype.startAt = Y.prototype.ce;
Y.prototype.endAt = Y.prototype.vd;
Y.prototype.equalTo = Y.prototype.tg;
Y.prototype.toString = Y.prototype.toString;
var Z = {};
Z.zc = Qh;
Z.DataConnection = Z.zc;
Qh.prototype.bh = function (a, b) {
this.Ia('q', { p: a }, b);
};
Z.zc.prototype.simpleListen = Z.zc.prototype.bh;
Qh.prototype.sg = function (a, b) {
this.Ia('echo', { d: a }, b);
};
Z.zc.prototype.echo = Z.zc.prototype.sg;
Qh.prototype.interrupt = Qh.prototype.Cb;
Z.dg = Eh;
Z.RealTimeConnection = Z.dg;
Eh.prototype.sendRequest = Eh.prototype.Ia;
Eh.prototype.close = Eh.prototype.close;
Z.Cg = function (a) {
var b = Qh.prototype.put;
Qh.prototype.put = function (c, d, e, f) {
p(f) && (f = a());
b.call(this, c, d, e, f);
};
return function () {
Qh.prototype.put = b;
};
};
Z.hijackHash = Z.Cg;
Z.cg = dd;
Z.ConnectionTarget = Z.cg;
Z.wa = function (a) {
return a.wa();
};
Z.queryIdentifier = Z.wa;
Z.Eg = function (a) {
return a.k.Va.ba;
};
Z.listens = Z.Eg;
Z.ze = function (a) {
a.ze();
};
Z.forceRestClient = Z.ze;
function X(a, b) {
var c, d, e;
if (a instanceof Ii)
c = a, d = b;
else {
D('new Firebase', 1, 2, arguments.length);
d = sd(arguments[0]);
c = d.eh;
'firebase' === d.domain && rd(d.host + ' is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead');
c && 'undefined' != c || rd('Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com');
d.ob || 'undefined' !== typeof window && window.location && window.location.protocol && -1 !== window.location.protocol.indexOf('https:') && S('Insecure Firebase access from a secure page. Please use https in calls to new Firebase().');
c = new dd(d.host, d.ob, c, 'ws' === d.scheme || 'wss' === d.scheme);
d = new P(d.bd);
e = d.toString();
var f;
!(f = !q(c.host) || 0 === c.host.length || !eg(c.lc)) && (f = 0 !== e.length) && (e && (e = e.replace(/^\/*\.info(\/|$)/, '/')), f = !(q(e) && 0 !== e.length && !cg.test(e)));
if (f)
throw Error(E('new Firebase', 1, !1) + 'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".');
if (b)
if (b instanceof $i)
e = b;
else if (q(b))
e = $i.yb(), c.Rd = b;
else
throw Error('Expected a valid Firebase.Context for second argument to new Firebase()');
else
e = $i.yb();
f = c.toString();
var g = z(e.sc, f);
g || (g = new Ii(c, e.ag), e.sc[f] = g);
c = g;
}
Y.call(this, c, d, De, !1);
this.then = void 0;
this['catch'] = void 0;
}
ka(X, Y);
var ej = X, fj = ['Firebase'], gj = n;
fj[0] in gj || !gj.execScript || gj.execScript('var ' + fj[0]);
for (var hj; fj.length && (hj = fj.shift());)
!fj.length && p(ej) ? gj[hj] = ej : gj = gj[hj] ? gj[hj] : gj[hj] = {};
X.goOffline = function () {
D('Firebase.goOffline', 0, 0, arguments.length);
$i.yb().Cb();
};
X.goOnline = function () {
D('Firebase.goOnline', 0, 0, arguments.length);
$i.yb().vc();
};
X.enableLogging = od;
X.ServerValue = { TIMESTAMP: { '.sv': 'timestamp' } };
X.SDK_VERSION = Eb;
X.INTERNAL = U;
X.Context = $i;
X.TEST_ACCESS = Z;
X.prototype.name = function () {
S('Firebase.name() being deprecated. Please use Firebase.key() instead.');
D('Firebase.name', 0, 0, arguments.length);
return this.key();
};
X.prototype.name = X.prototype.name;
X.prototype.key = function () {
D('Firebase.key', 0, 0, arguments.length);
return this.path.e() ? null : me(this.path);
};
X.prototype.key = X.prototype.key;
X.prototype.o = function (a) {
D('Firebase.child', 1, 1, arguments.length);
if (fa(a))
a = String(a);
else if (!(a instanceof P))
if (null === K(this.path)) {
var b = a;
b && (b = b.replace(/^\/*\.info(\/|$)/, '/'));
ng('Firebase.child', b);
} else
ng('Firebase.child', a);
return new X(this.k, this.path.o(a));
};
X.prototype.child = X.prototype.o;
X.prototype.parent = function () {
D('Firebase.parent', 0, 0, arguments.length);
var a = this.path.parent();
return null === a ? null : new X(this.k, a);
};
X.prototype.parent = X.prototype.parent;
X.prototype.root = function () {
D('Firebase.ref', 0, 0, arguments.length);
for (var a = this; null !== a.parent();)
a = a.parent();
return a;
};
X.prototype.root = X.prototype.root;
X.prototype.set = function (a, b) {
D('Firebase.set', 1, 2, arguments.length);
og('Firebase.set', this.path);
gg('Firebase.set', a, this.path, !1);
F('Firebase.set', 2, b, !0);
var c = new B();
this.k.Ob(this.path, a, null, C(c, b));
return c.D;
};
X.prototype.set = X.prototype.set;
X.prototype.update = function (a, b) {
D('Firebase.update', 1, 2, arguments.length);
og('Firebase.update', this.path);
if (da(a)) {
for (var c = {}, d = 0; d < a.length; ++d)
c['' + d] = a[d];
a = c;
S('Passing an Array to Firebase.update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.');
}
jg('Firebase.update', a, this.path);
F('Firebase.update', 2, b, !0);
c = new B();
this.k.update(this.path, a, C(c, b));
return c.D;
};
X.prototype.update = X.prototype.update;
X.prototype.Ob = function (a, b, c) {
D('Firebase.setWithPriority', 2, 3, arguments.length);
og('Firebase.setWithPriority', this.path);
gg('Firebase.setWithPriority', a, this.path, !1);
kg('Firebase.setWithPriority', 2, b);
F('Firebase.setWithPriority', 3, c, !0);
if ('.length' === this.key() || '.keys' === this.key())
throw 'Firebase.setWithPriority failed: ' + this.key() + ' is a read-only object.';
var d = new B();
this.k.Ob(this.path, a, b, C(d, c));
return d.D;
};
X.prototype.setWithPriority = X.prototype.Ob;
X.prototype.remove = function (a) {
D('Firebase.remove', 0, 1, arguments.length);
og('Firebase.remove', this.path);
F('Firebase.remove', 1, a, !0);
return this.set(null, a);
};
X.prototype.remove = X.prototype.remove;
X.prototype.transaction = function (a, b, c) {
D('Firebase.transaction', 1, 3, arguments.length);
og('Firebase.transaction', this.path);
F('Firebase.transaction', 1, a, !1);
F('Firebase.transaction', 2, b, !0);
if (p(c) && 'boolean' != typeof c)
throw Error(E('Firebase.transaction', 3, !0) + 'must be a boolean.');
if ('.length' === this.key() || '.keys' === this.key())
throw 'Firebase.transaction failed: ' + this.key() + ' is a read-only object.';
'undefined' === typeof c && (c = !0);
var d = new B();
r(b) && Nb(d.D);
Ri(this.k, this.path, a, function (a, c, g) {
a ? d.reject(a) : d.resolve(new di(c, g));
r(b) && b(a, c, g);
}, c);
return d.D;
};
X.prototype.transaction = X.prototype.transaction;
X.prototype.Zg = function (a, b) {
D('Firebase.setPriority', 1, 2, arguments.length);
og('Firebase.setPriority', this.path);
kg('Firebase.setPriority', 1, a);
F('Firebase.setPriority', 2, b, !0);
var c = new B();
this.k.Ob(this.path.o('.priority'), a, null, C(c, b));
return c.D;
};
X.prototype.setPriority = X.prototype.Zg;
X.prototype.push = function (a, b) {
D('Firebase.push', 0, 2, arguments.length);
og('Firebase.push', this.path);
gg('Firebase.push', a, this.path, !0);
F('Firebase.push', 2, b, !0);
var c = Ki(this.k), d = hf(c), c = this.o(d);
if (null != a) {
var e = this, f = c.set(a, b).then(function () {
return e.o(d);
});
c.then = u(f.then, f);
c['catch'] = u(f.then, f, void 0);
r(b) && Nb(f);
}
return c;
};
X.prototype.push = X.prototype.push;
X.prototype.lb = function () {
og('Firebase.onDisconnect', this.path);
return new V(this.k, this.path);
};
X.prototype.onDisconnect = X.prototype.lb;
X.prototype.O = function (a, b, c) {
S('FirebaseRef.auth() being deprecated. Please use FirebaseRef.authWithCustomToken() instead.');
D('Firebase.auth', 1, 3, arguments.length);
pg('Firebase.auth', a);
F('Firebase.auth', 2, b, !0);
F('Firebase.auth', 3, b, !0);
var d = new B();
ch(this.k.O, a, {}, { remember: 'none' }, C(d, b), c);
return d.D;
};
X.prototype.auth = X.prototype.O;
X.prototype.je = function (a) {
D('Firebase.unauth', 0, 1, arguments.length);
F('Firebase.unauth', 1, a, !0);
var b = new B();
dh(this.k.O, C(b, a));
return b.D;
};
X.prototype.unauth = X.prototype.je;
X.prototype.Be = function () {
D('Firebase.getAuth', 0, 0, arguments.length);
return this.k.O.Be();
};
X.prototype.getAuth = X.prototype.Be;
X.prototype.Ig = function (a, b) {
D('Firebase.onAuth', 1, 2, arguments.length);
F('Firebase.onAuth', 1, a, !1);
Qb('Firebase.onAuth', 2, b);
this.k.O.Ib('auth_status', a, b);
};
X.prototype.onAuth = X.prototype.Ig;
X.prototype.Hg = function (a, b) {
D('Firebase.offAuth', 1, 2, arguments.length);
F('Firebase.offAuth', 1, a, !1);
Qb('Firebase.offAuth', 2, b);
this.k.O.mc('auth_status', a, b);
};
X.prototype.offAuth = X.prototype.Hg;
X.prototype.hg = function (a, b, c) {
D('Firebase.authWithCustomToken', 1, 3, arguments.length);
2 === arguments.length && Hb(b) && (c = b, b = void 0);
pg('Firebase.authWithCustomToken', a);
F('Firebase.authWithCustomToken', 2, b, !0);
sg('Firebase.authWithCustomToken', 3, c, !0);
var d = new B();
ch(this.k.O, a, {}, c || {}, C(d, b));
return d.D;
};
X.prototype.authWithCustomToken = X.prototype.hg;
X.prototype.ig = function (a, b, c) {
D('Firebase.authWithOAuthPopup', 1, 3, arguments.length);
2 === arguments.length && Hb(b) && (c = b, b = void 0);
rg('Firebase.authWithOAuthPopup', a);
F('Firebase.authWithOAuthPopup', 2, b, !0);
sg('Firebase.authWithOAuthPopup', 3, c, !0);
var d = new B();
hh(this.k.O, a, c, C(d, b));
return d.D;
};
X.prototype.authWithOAuthPopup = X.prototype.ig;
X.prototype.jg = function (a, b, c) {
D('Firebase.authWithOAuthRedirect', 1, 3, arguments.length);
2 === arguments.length && Hb(b) && (c = b, b = void 0);
rg('Firebase.authWithOAuthRedirect', a);
F('Firebase.authWithOAuthRedirect', 2, b, !1);
sg('Firebase.authWithOAuthRedirect', 3, c, !0);
var d = new B(), e = this.k.O, f = c, g = C(d, b);
fh(e);
var k = [Pg], f = Ag(f);
'anonymous' === a || 'firebase' === a ? T(g, Rg('TRANSPORT_UNAVAILABLE')) : (cd.set('redirect_client_options', f.qd), gh(e, k, '/auth/' + a, f, g));
return d.D;
};
X.prototype.authWithOAuthRedirect = X.prototype.jg;
X.prototype.kg = function (a, b, c, d) {
D('Firebase.authWithOAuthToken', 2, 4, arguments.length);
3 === arguments.length && Hb(c) && (d = c, c = void 0);
rg('Firebase.authWithOAuthToken', a);
F('Firebase.authWithOAuthToken', 3, c, !0);
sg('Firebase.authWithOAuthToken', 4, d, !0);
var e = new B();
q(b) ? (qg('Firebase.authWithOAuthToken', 2, b), eh(this.k.O, a + '/token', { access_token: b }, d, C(e, c))) : (sg('Firebase.authWithOAuthToken', 2, b, !1), eh(this.k.O, a + '/token', b, d, C(e, c)));
return e.D;
};
X.prototype.authWithOAuthToken = X.prototype.kg;
X.prototype.gg = function (a, b) {
D('Firebase.authAnonymously', 0, 2, arguments.length);
1 === arguments.length && Hb(a) && (b = a, a = void 0);
F('Firebase.authAnonymously', 1, a, !0);
sg('Firebase.authAnonymously', 2, b, !0);
var c = new B();
eh(this.k.O, 'anonymous', {}, b, C(c, a));
return c.D;
};
X.prototype.authAnonymously = X.prototype.gg;
X.prototype.lg = function (a, b, c) {
D('Firebase.authWithPassword', 1, 3, arguments.length);
2 === arguments.length && Hb(b) && (c = b, b = void 0);
sg('Firebase.authWithPassword', 1, a, !1);
tg('Firebase.authWithPassword', a, 'email');
tg('Firebase.authWithPassword', a, 'password');
F('Firebase.authWithPassword', 2, b, !0);
sg('Firebase.authWithPassword', 3, c, !0);
var d = new B();
eh(this.k.O, 'password', a, c, C(d, b));
return d.D;
};
X.prototype.authWithPassword = X.prototype.lg;
X.prototype.ve = function (a, b) {
D('Firebase.createUser', 1, 2, arguments.length);
sg('Firebase.createUser', 1, a, !1);
tg('Firebase.createUser', a, 'email');
tg('Firebase.createUser', a, 'password');
F('Firebase.createUser', 2, b, !0);
var c = new B();
this.k.O.ve(a, C(c, b));
return c.D;
};
X.prototype.createUser = X.prototype.ve;
X.prototype.Xe = function (a, b) {
D('Firebase.removeUser', 1, 2, arguments.length);
sg('Firebase.removeUser', 1, a, !1);
tg('Firebase.removeUser', a, 'email');
tg('Firebase.removeUser', a, 'password');
F('Firebase.removeUser', 2, b, !0);
var c = new B();
this.k.O.Xe(a, C(c, b));
return c.D;
};
X.prototype.removeUser = X.prototype.Xe;
X.prototype.se = function (a, b) {
D('Firebase.changePassword', 1, 2, arguments.length);
sg('Firebase.changePassword', 1, a, !1);
tg('Firebase.changePassword', a, 'email');
tg('Firebase.changePassword', a, 'oldPassword');
tg('Firebase.changePassword', a, 'newPassword');
F('Firebase.changePassword', 2, b, !0);
var c = new B();
this.k.O.se(a, C(c, b));
return c.D;
};
X.prototype.changePassword = X.prototype.se;
X.prototype.re = function (a, b) {
D('Firebase.changeEmail', 1, 2, arguments.length);
sg('Firebase.changeEmail', 1, a, !1);
tg('Firebase.changeEmail', a, 'oldEmail');
tg('Firebase.changeEmail', a, 'newEmail');
tg('Firebase.changeEmail', a, 'password');
F('Firebase.changeEmail', 2, b, !0);
var c = new B();
this.k.O.re(a, C(c, b));
return c.D;
};
X.prototype.changeEmail = X.prototype.re;
X.prototype.Ze = function (a, b) {
D('Firebase.resetPassword', 1, 2, arguments.length);
sg('Firebase.resetPassword', 1, a, !1);
tg('Firebase.resetPassword', a, 'email');
F('Firebase.resetPassword', 2, b, !0);
var c = new B();
this.k.O.Ze(a, C(c, b));
return c.D;
};
X.prototype.resetPassword = X.prototype.Ze;
}());
Polymer({
is: 'firebase-auth',
properties: {
location: {
type: String,
reflectToAttribute: true,
observer: '_locationChanged'
},
provider: {
type: String,
reflectToAttribute: true,
value: 'anonymous'
},
user: {
type: Object,
readOnly: true,
notify: true
},
autoLogin: {
type: Boolean,
value: false,
reflectToAttribute: true
},
statusKnown: {
type: Boolean,
value: false,
notify: true,
readOnly: true,
reflectToAttribute: true
},
redirect: {
type: Boolean,
value: false,
reflectToAttribute: true
},
params: { type: Object },
options: { type: Object },
ref: {
type: Object,
readOnly: true,
notify: true
},
_boundAuthHandler: {
value: function () {
return this._authHandler.bind(this);
}
},
_boundOnlineHandler: {
value: function () {
return this._onlineHandler.bind(this);
}
},
_queuedLogin: { type: Object }
},
attached: function () {
window.addEventListener('online', this._boundOnlineHandler);
},
detached: function () {
window.removeEventListener('online', this._boundOnlineHandler);
this.ref.offAuth(this._boundAuthHandler);
},
_locationChanged: function (location) {
this.debounce('locationChanged', function () {
if (this.ref) {
this.ref.offAuth(this._boundAuthHandler);
}
if (location) {
this._setRef(new Firebase(location));
this.ref.onAuth(this._boundAuthHandler);
} else {
this._setRef(null);
}
}, 1);
},
_loginHandler: function (error, user) {
if (error) {
this.fire('error', error);
}
},
_authHandler: function (user) {
if (user) {
this._setUser(user);
this._setStatusKnown(true);
this.fire('login', { user: user });
} else {
this._setUser(null);
if (this.statusKnown) {
this._setStatusKnown(false);
this.fire('logout');
}
if (this._queuedLogin) {
this.login(this._queuedLogin.params, this._queuedLogin.options);
this._queuedLogin = null;
} else if (!this.statusKnown && this.autoLogin) {
this.login();
}
this._setStatusKnown(true);
}
},
login: function (params, options) {
if (!this.ref || navigator.onLine === false) {
this._queuedLogin = {
params: params,
options: options
};
} else {
params = params || this.params || undefined;
options = options || this.options || undefined;
switch (this.provider) {
case 'password':
this.ref.authWithPassword(params, this._loginHandler.bind(this), options);
break;
case 'anonymous':
this.ref.authAnonymously(this._loginHandler.bind(this), params);
break;
case 'custom':
this.ref.authWithCustomToken(params.token, this._loginHandler.bind(this));
break;
case 'facebook':
case 'google':
case 'github':
case 'twitter':
if (params && params.token) {
this.ref.authWithOAuthToken(this.provider, params.token, this._loginHandler.bind(this), params);
} else if (this.redirect) {
this.ref.authWithOAuthRedirect(this.provider, this._loginHandler.bind(this), params);
} else {
this.ref.authWithOAuthPopup(this.provider, this._loginHandler.bind(this), params);
}
break;
default:
throw 'Unknown provider: ' + this.provider;
}
}
},
logout: function () {
if (navigator.onLine === false) {
this.queuedLogout = true;
} else {
this.ref.unauth();
}
},
_onlineHandler: function () {
if (this.queuedLogout) {
this.queuedLogout = false;
this.logout();
} else if (this.queuedLogin) {
this.login(this.queuedLogin.params, this.queuedLogin.options);
this.queuedLogin = null;
}
},
createUser: function (email, password) {
this.ref.createUser({
email: email,
password: password
}, function (error, user) {
if (!error) {
this.fire('user-created', { user: user });
} else {
this.fire('error', error);
}
}.bind(this));
},
changePassword: function (email, oldPassword, newPassword) {
this.ref.changePassword({
email: email,
oldPassword: oldPassword,
newPassword: newPassword
}, function (error) {
if (!error) {
this.fire('password-changed');
} else {
this.fire('error', error);
}
}.bind(this));
},
sendPasswordResetEmail: function (email) {
this.ref.resetPassword({ email: email }, function (error) {
if (!error) {
this.fire('password-reset');
} else {
this.fire('error', error);
}
}.bind(this));
},
changeEmail: function (oldEmail, newEmail, password) {
this.ref.changeEmail({
oldEmail: oldEmail,
newEmail: newEmail,
password: password
}, function (error) {
if (!error) {
this.fire('email-changed');
} else {
this.fire('error', error);
}
}.bind(this));
},
removeUser: function (email, password) {
this.ref.removeUser({
email: email,
password: password
}, function (error, success) {
if (!error) {
this.fire('user-removed');
} else {
this.fire('error', error);
}
}.bind(this));
}
});
Polymer({
is: 'paper-material',
properties: {
elevation: {
type: Number,
reflectToAttribute: true,
value: 1
},
animated: {
type: Boolean,
reflectToAttribute: true,
value: false
}
}
});
(function () {
'use strict';
var KEY_IDENTIFIER = {
'U+0008': 'backspace',
'U+0009': 'tab',
'U+001B': 'esc',
'U+0020': 'space',
'U+007F': 'del'
};
var KEY_CODE = {
8: 'backspace',
9: 'tab',
13: 'enter',
27: 'esc',
33: 'pageup',
34: 'pagedown',
35: 'end',
36: 'home',
32: 'space',
37: 'left',
38: 'up',
39: 'right',
40: 'down',
46: 'del',
106: '*'
};
var MODIFIER_KEYS = {
'shift': 'shiftKey',
'ctrl': 'ctrlKey',
'alt': 'altKey',
'meta': 'metaKey'
};
var KEY_CHAR = /[a-z0-9*]/;
var IDENT_CHAR = /U\+/;
var ARROW_KEY = /^arrow/;
var SPACE_KEY = /^space(bar)?/;
function transformKey(key, noSpecialChars) {
var validKey = '';
if (key) {
var lKey = key.toLowerCase();
if (lKey === ' ' || SPACE_KEY.test(lKey)) {
validKey = 'space';
} else if (lKey.length == 1) {
if (!noSpecialChars || KEY_CHAR.test(lKey)) {
validKey = lKey;
}
} else if (ARROW_KEY.test(lKey)) {
validKey = lKey.replace('arrow', '');
} else if (lKey == 'multiply') {
validKey = '*';
} else {
validKey = lKey;
}
}
return validKey;
}
function transformKeyIdentifier(keyIdent) {
var validKey = '';
if (keyIdent) {
if (keyIdent in KEY_IDENTIFIER) {
validKey = KEY_IDENTIFIER[keyIdent];
} else if (IDENT_CHAR.test(keyIdent)) {
keyIdent = parseInt(keyIdent.replace('U+', '0x'), 16);
validKey = String.fromCharCode(keyIdent).toLowerCase();
} else {
validKey = keyIdent.toLowerCase();
}
}
return validKey;
}
function transformKeyCode(keyCode) {
var validKey = '';
if (Number(keyCode)) {
if (keyCode >= 65 && keyCode <= 90) {
validKey = String.fromCharCode(32 + keyCode);
} else if (keyCode >= 112 && keyCode <= 123) {
validKey = 'f' + (keyCode - 112);
} else if (keyCode >= 48 && keyCode <= 57) {
validKey = String(48 - keyCode);
} else if (keyCode >= 96 && keyCode <= 105) {
validKey = String(96 - keyCode);
} else {
validKey = KEY_CODE[keyCode];
}
}
return validKey;
}
function normalizedKeyForEvent(keyEvent, noSpecialChars) {
return transformKey(keyEvent.key, noSpecialChars) || transformKeyIdentifier(keyEvent.keyIdentifier) || transformKeyCode(keyEvent.keyCode) || transformKey(keyEvent.detail.key, noSpecialChars) || '';
}
function keyComboMatchesEvent(keyCombo, event) {
var keyEvent = normalizedKeyForEvent(event, keyCombo.hasModifiers);
return keyEvent === keyCombo.key && (!keyCombo.hasModifiers || !!event.shiftKey === !!keyCombo.shiftKey && !!event.ctrlKey === !!keyCombo.ctrlKey && !!event.altKey === !!keyCombo.altKey && !!event.metaKey === !!keyCombo.metaKey);
}
function parseKeyComboString(keyComboString) {
if (keyComboString.length === 1) {
return {
combo: keyComboString,
key: keyComboString,
event: 'keydown'
};
}
return keyComboString.split('+').reduce(function (parsedKeyCombo, keyComboPart) {
var eventParts = keyComboPart.split(':');
var keyName = eventParts[0];
var event = eventParts[1];
if (keyName in MODIFIER_KEYS) {
parsedKeyCombo[MODIFIER_KEYS[keyName]] = true;
parsedKeyCombo.hasModifiers = true;
} else {
parsedKeyCombo.key = keyName;
parsedKeyCombo.event = event || 'keydown';
}
return parsedKeyCombo;
}, { combo: keyComboString.split(':').shift() });
}
function parseEventString(eventString) {
return eventString.trim().split(' ').map(function (keyComboString) {
return parseKeyComboString(keyComboString);
});
}
Polymer.IronA11yKeysBehavior = {
properties: {
keyEventTarget: {
type: Object,
value: function () {
return this;
}
},
stopKeyboardEventPropagation: {
type: Boolean,
value: false
},
_boundKeyHandlers: {
type: Array,
value: function () {
return [];
}
},
_imperativeKeyBindings: {
type: Object,
value: function () {
return {};
}
}
},
observers: ['_resetKeyEventListeners(keyEventTarget, _boundKeyHandlers)'],
keyBindings: {},
registered: function () {
this._prepKeyBindings();
},
attached: function () {
this._listenKeyEventListeners();
},
detached: function () {
this._unlistenKeyEventListeners();
},
addOwnKeyBinding: function (eventString, handlerName) {
this._imperativeKeyBindings[eventString] = handlerName;
this._prepKeyBindings();
this._resetKeyEventListeners();
},
removeOwnKeyBindings: function () {
this._imperativeKeyBindings = {};
this._prepKeyBindings();
this._resetKeyEventListeners();
},
keyboardEventMatchesKeys: function (event, eventString) {
var keyCombos = parseEventString(eventString);
for (var i = 0; i < keyCombos.length; ++i) {
if (keyComboMatchesEvent(keyCombos[i], event)) {
return true;
}
}
return false;
},
_collectKeyBindings: function () {
var keyBindings = this.behaviors.map(function (behavior) {
return behavior.keyBindings;
});
if (keyBindings.indexOf(this.keyBindings) === -1) {
keyBindings.push(this.keyBindings);
}
return keyBindings;
},
_prepKeyBindings: function () {
this._keyBindings = {};
this._collectKeyBindings().forEach(function (keyBindings) {
for (var eventString in keyBindings) {
this._addKeyBinding(eventString, keyBindings[eventString]);
}
}, this);
for (var eventString in this._imperativeKeyBindings) {
this._addKeyBinding(eventString, this._imperativeKeyBindings[eventString]);
}
for (var eventName in this._keyBindings) {
this._keyBindings[eventName].sort(function (kb1, kb2) {
var b1 = kb1[0].hasModifiers;
var b2 = kb2[0].hasModifiers;
return b1 === b2 ? 0 : b1 ? -1 : 1;
});
}
},
_addKeyBinding: function (eventString, handlerName) {
parseEventString(eventString).forEach(function (keyCombo) {
this._keyBindings[keyCombo.event] = this._keyBindings[keyCombo.event] || [];
this._keyBindings[keyCombo.event].push([
keyCombo,
handlerName
]);
}, this);
},
_resetKeyEventListeners: function () {
this._unlistenKeyEventListeners();
if (this.isAttached) {
this._listenKeyEventListeners();
}
},
_listenKeyEventListeners: function () {
Object.keys(this._keyBindings).forEach(function (eventName) {
var keyBindings = this._keyBindings[eventName];
var boundKeyHandler = this._onKeyBindingEvent.bind(this, keyBindings);
this._boundKeyHandlers.push([
this.keyEventTarget,
eventName,
boundKeyHandler
]);
this.keyEventTarget.addEventListener(eventName, boundKeyHandler);
}, this);
},
_unlistenKeyEventListeners: function () {
var keyHandlerTuple;
var keyEventTarget;
var eventName;
var boundKeyHandler;
while (this._boundKeyHandlers.length) {
keyHandlerTuple = this._boundKeyHandlers.pop();
keyEventTarget = keyHandlerTuple[0];
eventName = keyHandlerTuple[1];
boundKeyHandler = keyHandlerTuple[2];
keyEventTarget.removeEventListener(eventName, boundKeyHandler);
}
},
_onKeyBindingEvent: function (keyBindings, event) {
if (this.stopKeyboardEventPropagation) {
event.stopPropagation();
}
if (event.defaultPrevented) {
return;
}
for (var i = 0; i < keyBindings.length; i++) {
var keyCombo = keyBindings[i][0];
var handlerName = keyBindings[i][1];
if (keyComboMatchesEvent(keyCombo, event)) {
this._triggerKeyHandler(keyCombo, handlerName, event);
if (event.defaultPrevented) {
return;
}
}
}
},
_triggerKeyHandler: function (keyCombo, handlerName, keyboardEvent) {
var detail = Object.create(keyCombo);
detail.keyboardEvent = keyboardEvent;
var event = new CustomEvent(keyCombo.event, {
detail: detail,
cancelable: true
});
this[handlerName].call(this, event);
if (event.defaultPrevented) {
keyboardEvent.preventDefault();
}
}
};
}());
(function () {
var Utility = {
distance: function (x1, y1, x2, y2) {
var xDelta = x1 - x2;
var yDelta = y1 - y2;
return Math.sqrt(xDelta * xDelta + yDelta * yDelta);
},
now: window.performance && window.performance.now ? window.performance.now.bind(window.performance) : Date.now
};
function ElementMetrics(element) {
this.element = element;
this.width = this.boundingRect.width;
this.height = this.boundingRect.height;
this.size = Math.max(this.width, this.height);
}
ElementMetrics.prototype = {
get boundingRect() {
return this.element.getBoundingClientRect();
},
furthestCornerDistanceFrom: function (x, y) {
var topLeft = Utility.distance(x, y, 0, 0);
var topRight = Utility.distance(x, y, this.width, 0);
var bottomLeft = Utility.distance(x, y, 0, this.height);
var bottomRight = Utility.distance(x, y, this.width, this.height);
return Math.max(topLeft, topRight, bottomLeft, bottomRight);
}
};
function Ripple(element) {
this.element = element;
this.color = window.getComputedStyle(element).color;
this.wave = document.createElement('div');
this.waveContainer = document.createElement('div');
this.wave.style.backgroundColor = this.color;
this.wave.classList.add('wave');
this.waveContainer.classList.add('wave-container');
Polymer.dom(this.waveContainer).appendChild(this.wave);
this.resetInteractionState();
}
Ripple.MAX_RADIUS = 300;
Ripple.prototype = {
get recenters() {
return this.element.recenters;
},
get center() {
return this.element.center;
},
get mouseDownElapsed() {
var elapsed;
if (!this.mouseDownStart) {
return 0;
}
elapsed = Utility.now() - this.mouseDownStart;
if (this.mouseUpStart) {
elapsed -= this.mouseUpElapsed;
}
return elapsed;
},
get mouseUpElapsed() {
return this.mouseUpStart ? Utility.now() - this.mouseUpStart : 0;
},
get mouseDownElapsedSeconds() {
return this.mouseDownElapsed / 1000;
},
get mouseUpElapsedSeconds() {
return this.mouseUpElapsed / 1000;
},
get mouseInteractionSeconds() {
return this.mouseDownElapsedSeconds + this.mouseUpElapsedSeconds;
},
get initialOpacity() {
return this.element.initialOpacity;
},
get opacityDecayVelocity() {
return this.element.opacityDecayVelocity;
},
get radius() {
var width2 = this.containerMetrics.width * this.containerMetrics.width;
var height2 = this.containerMetrics.height * this.containerMetrics.height;
var waveRadius = Math.min(Math.sqrt(width2 + height2), Ripple.MAX_RADIUS) * 1.1 + 5;
var duration = 1.1 - 0.2 * (waveRadius / Ripple.MAX_RADIUS);
var timeNow = this.mouseInteractionSeconds / duration;
var size = waveRadius * (1 - Math.pow(80, -timeNow));
return Math.abs(size);
},
get opacity() {
if (!this.mouseUpStart) {
return this.initialOpacity;
}
return Math.max(0, this.initialOpacity - this.mouseUpElapsedSeconds * this.opacityDecayVelocity);
},
get outerOpacity() {
var outerOpacity = this.mouseUpElapsedSeconds * 0.3;
var waveOpacity = this.opacity;
return Math.max(0, Math.min(outerOpacity, waveOpacity));
},
get isOpacityFullyDecayed() {
return this.opacity < 0.01 && this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
},
get isRestingAtMaxRadius() {
return this.opacity >= this.initialOpacity && this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
},
get isAnimationComplete() {
return this.mouseUpStart ? this.isOpacityFullyDecayed : this.isRestingAtMaxRadius;
},
get translationFraction() {
return Math.min(1, this.radius / this.containerMetrics.size * 2 / Math.sqrt(2));
},
get xNow() {
if (this.xEnd) {
return this.xStart + this.translationFraction * (this.xEnd - this.xStart);
}
return this.xStart;
},
get yNow() {
if (this.yEnd) {
return this.yStart + this.translationFraction * (this.yEnd - this.yStart);
}
return this.yStart;
},
get isMouseDown() {
return this.mouseDownStart && !this.mouseUpStart;
},
resetInteractionState: function () {
this.maxRadius = 0;
this.mouseDownStart = 0;
this.mouseUpStart = 0;
this.xStart = 0;
this.yStart = 0;
this.xEnd = 0;
this.yEnd = 0;
this.slideDistance = 0;
this.containerMetrics = new ElementMetrics(this.element);
},
draw: function () {
var scale;
var translateString;
var dx;
var dy;
this.wave.style.opacity = this.opacity;
scale = this.radius / (this.containerMetrics.size / 2);
dx = this.xNow - this.containerMetrics.width / 2;
dy = this.yNow - this.containerMetrics.height / 2;
this.waveContainer.style.webkitTransform = 'translate(' + dx + 'px, ' + dy + 'px)';
this.waveContainer.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0)';
this.wave.style.webkitTransform = 'scale(' + scale + ',' + scale + ')';
this.wave.style.transform = 'scale3d(' + scale + ',' + scale + ',1)';
},
downAction: function (event) {
var xCenter = this.containerMetrics.width / 2;
var yCenter = this.containerMetrics.height / 2;
this.resetInteractionState();
this.mouseDownStart = Utility.now();
if (this.center) {
this.xStart = xCenter;
this.yStart = yCenter;
this.slideDistance = Utility.distance(this.xStart, this.yStart, this.xEnd, this.yEnd);
} else {
this.xStart = event ? event.detail.x - this.containerMetrics.boundingRect.left : this.containerMetrics.width / 2;
this.yStart = event ? event.detail.y - this.containerMetrics.boundingRect.top : this.containerMetrics.height / 2;
}
if (this.recenters) {
this.xEnd = xCenter;
this.yEnd = yCenter;
this.slideDistance = Utility.distance(this.xStart, this.yStart, this.xEnd, this.yEnd);
}
this.maxRadius = this.containerMetrics.furthestCornerDistanceFrom(this.xStart, this.yStart);
this.waveContainer.style.top = (this.containerMetrics.height - this.containerMetrics.size) / 2 + 'px';
this.waveContainer.style.left = (this.containerMetrics.width - this.containerMetrics.size) / 2 + 'px';
this.waveContainer.style.width = this.containerMetrics.size + 'px';
this.waveContainer.style.height = this.containerMetrics.size + 'px';
},
upAction: function (event) {
if (!this.isMouseDown) {
return;
}
this.mouseUpStart = Utility.now();
},
remove: function () {
Polymer.dom(this.waveContainer.parentNode).removeChild(this.waveContainer);
}
};
Polymer({
is: 'paper-ripple',
behaviors: [Polymer.IronA11yKeysBehavior],
properties: {
initialOpacity: {
type: Number,
value: 0.25
},
opacityDecayVelocity: {
type: Number,
value: 0.8
},
recenters: {
type: Boolean,
value: false
},
center: {
type: Boolean,
value: false
},
ripples: {
type: Array,
value: function () {
return [];
}
},
animating: {
type: Boolean,
readOnly: true,
reflectToAttribute: true,
value: false
},
holdDown: {
type: Boolean,
value: false,
observer: '_holdDownChanged'
},
noink: {
type: Boolean,
value: false
},
_animating: { type: Boolean },
_boundAnimate: {
type: Function,
value: function () {
return this.animate.bind(this);
}
}
},
get target() {
var ownerRoot = Polymer.dom(this).getOwnerRoot();
var target;
if (this.parentNode.nodeType == 11) {
target = ownerRoot.host;
} else {
target = this.parentNode;
}
return target;
},
keyBindings: {
'enter:keydown': '_onEnterKeydown',
'space:keydown': '_onSpaceKeydown',
'space:keyup': '_onSpaceKeyup'
},
attached: function () {
this.keyEventTarget = this.target;
this.listen(this.target, 'up', 'uiUpAction');
this.listen(this.target, 'down', 'uiDownAction');
},
detached: function () {
this.unlisten(this.target, 'up', 'uiUpAction');
this.unlisten(this.target, 'down', 'uiDownAction');
},
get shouldKeepAnimating() {
for (var index = 0; index < this.ripples.length; ++index) {
if (!this.ripples[index].isAnimationComplete) {
return true;
}
}
return false;
},
simulatedRipple: function () {
this.downAction(null);
this.async(function () {
this.upAction();
}, 1);
},
uiDownAction: function (event) {
if (!this.noink) {
this.downAction(event);
}
},
downAction: function (event) {
if (this.holdDown && this.ripples.length > 0) {
return;
}
var ripple = this.addRipple();
ripple.downAction(event);
if (!this._animating) {
this.animate();
}
},
uiUpAction: function (event) {
if (!this.noink) {
this.upAction(event);
}
},
upAction: function (event) {
if (this.holdDown) {
return;
}
this.ripples.forEach(function (ripple) {
ripple.upAction(event);
});
this.animate();
},
onAnimationComplete: function () {
this._animating = false;
this.$.background.style.backgroundColor = null;
this.fire('transitionend');
},
addRipple: function () {
var ripple = new Ripple(this);
Polymer.dom(this.$.waves).appendChild(ripple.waveContainer);
this.$.background.style.backgroundColor = ripple.color;
this.ripples.push(ripple);
this._setAnimating(true);
return ripple;
},
removeRipple: function (ripple) {
var rippleIndex = this.ripples.indexOf(ripple);
if (rippleIndex < 0) {
return;
}
this.ripples.splice(rippleIndex, 1);
ripple.remove();
if (!this.ripples.length) {
this._setAnimating(false);
}
},
animate: function () {
var index;
var ripple;
this._animating = true;
for (index = 0; index < this.ripples.length; ++index) {
ripple = this.ripples[index];
ripple.draw();
this.$.background.style.opacity = ripple.outerOpacity;
if (ripple.isOpacityFullyDecayed && !ripple.isRestingAtMaxRadius) {
this.removeRipple(ripple);
}
}
if (!this.shouldKeepAnimating && this.ripples.length === 0) {
this.onAnimationComplete();
} else {
window.requestAnimationFrame(this._boundAnimate);
}
},
_onEnterKeydown: function () {
this.uiDownAction();
this.async(this.uiUpAction, 1);
},
_onSpaceKeydown: function () {
this.uiDownAction();
},
_onSpaceKeyup: function () {
this.uiUpAction();
},
_holdDownChanged: function (newVal, oldVal) {
if (oldVal === undefined) {
return;
}
if (newVal) {
this.downAction();
} else {
this.upAction();
}
}
});
}());
Polymer.IronControlState = {
properties: {
focused: {
type: Boolean,
value: false,
notify: true,
readOnly: true,
reflectToAttribute: true
},
disabled: {
type: Boolean,
value: false,
notify: true,
observer: '_disabledChanged',
reflectToAttribute: true
},
_oldTabIndex: { type: Number },
_boundFocusBlurHandler: {
type: Function,
value: function () {
return this._focusBlurHandler.bind(this);
}
}
},
observers: ['_changedControlState(focused, disabled)'],
ready: function () {
this.addEventListener('focus', this._boundFocusBlurHandler, true);
this.addEventListener('blur', this._boundFocusBlurHandler, true);
},
_focusBlurHandler: function (event) {
if (event.target === this) {
this._setFocused(event.type === 'focus');
} else if (!this.shadowRoot && !this.isLightDescendant(event.target)) {
this.fire(event.type, { sourceEvent: event }, {
node: this,
bubbles: event.bubbles,
cancelable: event.cancelable
});
}
},
_disabledChanged: function (disabled, old) {
this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
this.style.pointerEvents = disabled ? 'none' : '';
if (disabled) {
this._oldTabIndex = this.tabIndex;
this.focused = false;
this.tabIndex = -1;
} else if (this._oldTabIndex !== undefined) {
this.tabIndex = this._oldTabIndex;
}
},
_changedControlState: function () {
if (this._controlStateChanged) {
this._controlStateChanged();
}
}
};
Polymer.IronButtonStateImpl = {
properties: {
pressed: {
type: Boolean,
readOnly: true,
value: false,
reflectToAttribute: true,
observer: '_pressedChanged'
},
toggles: {
type: Boolean,
value: false,
reflectToAttribute: true
},
active: {
type: Boolean,
value: false,
notify: true,
reflectToAttribute: true
},
pointerDown: {
type: Boolean,
readOnly: true,
value: false
},
receivedFocusFromKeyboard: {
type: Boolean,
readOnly: true
},
ariaActiveAttribute: {
type: String,
value: 'aria-pressed',
observer: '_ariaActiveAttributeChanged'
}
},
listeners: {
down: '_downHandler',
up: '_upHandler',
tap: '_tapHandler'
},
observers: [
'_detectKeyboardFocus(focused)',
'_activeChanged(active, ariaActiveAttribute)'
],
keyBindings: {
'enter:keydown': '_asyncClick',
'space:keydown': '_spaceKeyDownHandler',
'space:keyup': '_spaceKeyUpHandler'
},
_mouseEventRe: /^mouse/,
_tapHandler: function () {
if (this.toggles) {
this._userActivate(!this.active);
} else {
this.active = false;
}
},
_detectKeyboardFocus: function (focused) {
this._setReceivedFocusFromKeyboard(!this.pointerDown && focused);
},
_userActivate: function (active) {
if (this.active !== active) {
this.active = active;
this.fire('change');
}
},
_downHandler: function (event) {
this._setPointerDown(true);
this._setPressed(true);
this._setReceivedFocusFromKeyboard(false);
},
_upHandler: function () {
this._setPointerDown(false);
this._setPressed(false);
},
_spaceKeyDownHandler: function (event) {
var keyboardEvent = event.detail.keyboardEvent;
var target = Polymer.dom(keyboardEvent).localTarget;
if (this.isLightDescendant(target))
return;
keyboardEvent.preventDefault();
keyboardEvent.stopImmediatePropagation();
this._setPressed(true);
},
_spaceKeyUpHandler: function (event) {
var keyboardEvent = event.detail.keyboardEvent;
var target = Polymer.dom(keyboardEvent).localTarget;
if (this.isLightDescendant(target))
return;
if (this.pressed) {
this._asyncClick();
}
this._setPressed(false);
},
_asyncClick: function () {
this.async(function () {
this.click();
}, 1);
},
_pressedChanged: function (pressed) {
this._changedButtonState();
},
_ariaActiveAttributeChanged: function (value, oldValue) {
if (oldValue && oldValue != value && this.hasAttribute(oldValue)) {
this.removeAttribute(oldValue);
}
},
_activeChanged: function (active, ariaActiveAttribute) {
if (this.toggles) {
this.setAttribute(this.ariaActiveAttribute, active ? 'true' : 'false');
} else {
this.removeAttribute(this.ariaActiveAttribute);
}
this._changedButtonState();
},
_controlStateChanged: function () {
if (this.disabled) {
this._setPressed(false);
} else {
this._changedButtonState();
}
},
_changedButtonState: function () {
if (this._buttonStateChanged) {
this._buttonStateChanged();
}
}
};
Polymer.IronButtonState = [
Polymer.IronA11yKeysBehavior,
Polymer.IronButtonStateImpl
];
Polymer.PaperRippleBehavior = {
properties: {
noink: {
type: Boolean,
observer: '_noinkChanged'
},
_rippleContainer: { type: Object }
},
_buttonStateChanged: function () {
if (this.focused) {
this.ensureRipple();
}
},
_downHandler: function (event) {
Polymer.IronButtonStateImpl._downHandler.call(this, event);
if (this.pressed) {
this.ensureRipple(event);
}
},
ensureRipple: function (optTriggeringEvent) {
if (!this.hasRipple()) {
this._ripple = this._createRipple();
this._ripple.noink = this.noink;
var rippleContainer = this._rippleContainer || this.root;
if (rippleContainer) {
Polymer.dom(rippleContainer).appendChild(this._ripple);
}
if (optTriggeringEvent) {
var domContainer = Polymer.dom(this._rippleContainer || this);
var target = Polymer.dom(optTriggeringEvent).rootTarget;
if (domContainer.deepContains(target)) {
this._ripple.uiDownAction(optTriggeringEvent);
}
}
}
},
getRipple: function () {
this.ensureRipple();
return this._ripple;
},
hasRipple: function () {
return Boolean(this._ripple);
},
_createRipple: function () {
return document.createElement('paper-ripple');
},
_noinkChanged: function (noink) {
if (this.hasRipple()) {
this._ripple.noink = noink;
}
}
};
Polymer.PaperButtonBehaviorImpl = {
properties: {
elevation: {
type: Number,
reflectToAttribute: true,
readOnly: true
}
},
observers: [
'_calculateElevation(focused, disabled, active, pressed, receivedFocusFromKeyboard)',
'_computeKeyboardClass(receivedFocusFromKeyboard)'
],
hostAttributes: {
role: 'button',
tabindex: '0',
animated: true
},
_calculateElevation: function () {
var e = 1;
if (this.disabled) {
e = 0;
} else if (this.active || this.pressed) {
e = 4;
} else if (this.receivedFocusFromKeyboard) {
e = 3;
}
this._setElevation(e);
},
_computeKeyboardClass: function (receivedFocusFromKeyboard) {
this.toggleClass('keyboard-focus', receivedFocusFromKeyboard);
},
_spaceKeyDownHandler: function (event) {
Polymer.IronButtonStateImpl._spaceKeyDownHandler.call(this, event);
if (this.hasRipple() && this.getRipple().ripples.length < 1) {
this._ripple.uiDownAction();
}
},
_spaceKeyUpHandler: function (event) {
Polymer.IronButtonStateImpl._spaceKeyUpHandler.call(this, event);
if (this.hasRipple()) {
this._ripple.uiUpAction();
}
}
};
Polymer.PaperButtonBehavior = [
Polymer.IronButtonState,
Polymer.IronControlState,
Polymer.PaperRippleBehavior,
Polymer.PaperButtonBehaviorImpl
];
Polymer({
is: 'paper-button',
behaviors: [Polymer.PaperButtonBehavior],
properties: {
raised: {
type: Boolean,
reflectToAttribute: true,
value: false,
observer: '_calculateElevation'
}
},
_calculateElevation: function () {
if (!this.raised) {
this._setElevation(0);
} else {
Polymer.PaperButtonBehaviorImpl._calculateElevation.apply(this);
}
}
});
Polymer({
is: 'paper-toolbar',
hostAttributes: { 'role': 'toolbar' },
properties: {
bottomJustify: {
type: String,
value: ''
},
justify: {
type: String,
value: ''
},
middleJustify: {
type: String,
value: ''
}
},
attached: function () {
this._observer = this._observe(this);
this._updateAriaLabelledBy();
},
detached: function () {
if (this._observer) {
this._observer.disconnect();
}
},
_observe: function (node) {
var observer = new MutationObserver(function () {
this._updateAriaLabelledBy();
}.bind(this));
observer.observe(node, {
childList: true,
subtree: true
});
return observer;
},
_updateAriaLabelledBy: function () {
var labelledBy = [];
var contents = Polymer.dom(this.root).querySelectorAll('content');
for (var content, index = 0; content = contents[index]; index++) {
var nodes = Polymer.dom(content).getDistributedNodes();
for (var node, jndex = 0; node = nodes[jndex]; jndex++) {
if (node.classList && node.classList.contains('title')) {
if (node.id) {
labelledBy.push(node.id);
} else {
var id = 'paper-toolbar-label-' + Math.floor(Math.random() * 10000);
node.id = id;
labelledBy.push(id);
}
}
}
}
if (labelledBy.length > 0) {
this.setAttribute('aria-labelledby', labelledBy.join(' '));
}
},
_computeBarExtraClasses: function (barJustify) {
if (!barJustify)
return '';
return barJustify + (barJustify === 'justified' ? '' : '-justified');
}
});
Polymer({
is: 'frankly-header',
properties: {
header: { type: String },
githubUser: {
type: Object,
notify: true
}
},
_onLoginTap: function () {
if (this.githubUser) {
this.$.githubAuth.logout();
} else {
this.$.githubAuth.login();
}
},
_buttonText: function (user) {
return user ? 'Sign out' : 'Sign in with GitHub';
},
_isLoggedIn: function (user) {
return !!user;
}
});
Polymer({
is: 'frank-ly',
properties: {
header: { type: String },
organization: { type: String },
repos: { type: Array },
fullRepoNames: { type: Boolean },
labels: { type: Array },
travisBadge: {
type: Boolean,
value: false
}
}
});