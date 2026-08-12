(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("configcat", [], factory);
	else if(typeof exports === 'object')
		exports["configcat"] = factory();
	else
		root["configcat"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 426
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  $clients: () => (/* binding */ $clients),
  $pollConfig: () => (/* binding */ $pollConfig),
  $snapshots: () => (/* binding */ $snapshots),
  ClientCacheState: () => (/* reexport */ ClientCacheState),
  ClientSideFetchApiConfigFetcher: () => (/* reexport */ ClientSideFetchApiConfigFetcher),
  ConfigJson: () => (/* reexport */ ConfigJson_namespaceObject),
  DataGovernance: () => (/* reexport */ DataGovernance),
  EvaluationErrorCode: () => (/* reexport */ EvaluationErrorCode),
  FetchError: () => (/* reexport */ FetchError),
  FetchRequest: () => (/* reexport */ FetchRequest),
  FetchResponse: () => (/* reexport */ FetchResponse),
  FormattableLogMessage: () => (/* reexport */ FormattableLogMessage),
  IndexedDBConfigCache: () => (/* reexport */ IndexedDBConfigCache),
  LocalStorageConfigCache: () => (/* reexport */ LocalStorageConfigCache),
  LogLevel: () => (/* reexport */ LogLevel),
  OverrideBehaviour: () => (/* reexport */ OverrideBehaviour),
  PollingMode: () => (/* reexport */ PollingMode),
  PrerequisiteFlagComparator: () => (/* reexport */ PrerequisiteFlagComparator),
  RefreshErrorCode: () => (/* reexport */ RefreshErrorCode),
  SegmentComparator: () => (/* reexport */ SegmentComparator),
  SettingType: () => (/* reexport */ SettingType),
  User: () => (/* reexport */ User),
  UserComparator: () => (/* reexport */ UserComparator),
  XmlHttpRequestConfigFetcher: () => (/* reexport */ XmlHttpRequestConfigFetcher),
  createConsoleLogger: () => (/* reexport */ createConsoleLogger),
  createFlagOverridesFromMap: () => (/* reexport */ createFlagOverridesFromMap),
  createFlagOverridesFromQueryParams: () => (/* reexport */ createFlagOverridesFromQueryParams),
  createSettingFromValue: () => (/* reexport */ createSettingFromValue),
  deserializeConfig: () => (/* reexport */ deserializeConfig),
  disposeAllClients: () => (/* reexport */ disposeAllClients),
  getClient: () => (/* reexport */ browser_getClient),
  prepareConfig: () => (/* reexport */ prepareConfig)
});

// NAMESPACE OBJECT: ./src/ConfigJson.ts
var ConfigJson_namespaceObject = {};
__webpack_require__.r(ConfigJson_namespaceObject);
__webpack_require__.d(ConfigJson_namespaceObject, {
  PrerequisiteFlagComparator: () => (PrerequisiteFlagComparator),
  RedirectMode: () => (RedirectMode),
  SegmentComparator: () => (SegmentComparator),
  SettingType: () => (SettingType),
  UserComparator: () => (UserComparator)
});

;// ./src/Utils.ts
var hexDigits = "0123456789abcdef";
var AbortToken = (function () {
    function AbortToken() {
        this.callbacks = [];
    }
    Object.defineProperty(AbortToken.prototype, "aborted", {
        get: function () { return !this.callbacks; },
        enumerable: false,
        configurable: true
    });
    AbortToken.prototype.abort = function () {
        if (!this.aborted) {
            var callbacks = this.callbacks;
            this.callbacks = void 0;
            for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
                var callback = callbacks_1[_i];
                callback();
            }
        }
    };
    AbortToken.prototype.registerCallback = function (callback) {
        var _this = this;
        if (this.aborted) {
            callback();
            return function () { };
        }
        this.callbacks.push(callback);
        return function () {
            var callbacks = _this.callbacks;
            var index;
            if (callbacks && (index = callbacks.indexOf(callback)) >= 0) {
                callbacks.splice(index, 1);
            }
        };
    };
    return AbortToken;
}());

function delay(delayMs, abortToken) {
    var timerId;
    return new Promise(function (resolve) {
        var unregisterAbortCallback = abortToken === null || abortToken === void 0 ? void 0 : abortToken.registerCallback(function () {
            clearTimeout(timerId);
            resolve(false);
        });
        timerId = setTimeout(function () {
            unregisterAbortCallback === null || unregisterAbortCallback === void 0 ? void 0 : unregisterAbortCallback();
            resolve(true);
        }, delayMs);
    });
}
var getMonotonicTimeMs = typeof performance !== "undefined" && isFunction(performance === null || performance === void 0 ? void 0 : performance.now)
    ? function () { return performance.now(); }
    : function () { return new Date().getTime(); };
var randomUUID = typeof crypto !== "undefined" && isFunction(crypto === null || crypto === void 0 ? void 0 : crypto.randomUUID)
    ? function () { return crypto.randomUUID(); }
    : function () {
        var charCodes = new Array(36);
        for (var i = 0; i < charCodes.length; i++) {
            var r = void 0;
            charCodes[i] =
                i === 8 || i === 13 || i === 18 || i === 23 ? 0x2d
                    : i === 14 ? 0x34
                        : (r = Math.random() * 16 | 0, hexDigits.charCodeAt(i === 19 ? r & 0x3 | 0x8 : r));
        }
        return String.fromCharCode.apply(String, charCodes);
    };
function createWeakRef(target) {
    return new weakRefConstructor(target);
}
var weakRefConstructor = typeof WeakRef === "function" ? WeakRef : getWeakRefStub();
function getWeakRefStub() {
    var WeakRef = function (target) {
        this.target = target;
    };
    WeakRef.prototype.deref = function () {
        return this.target;
    };
    WeakRef.isFallback = true;
    return WeakRef;
}
function toStringSafe(value) {
    try {
        return typeof value === "symbol" ? "[symbol]"
            : typeof value === "object" && value !== null && !isFunction(value.toString) ? Object.prototype.toString.call(value)
                : String(value);
    }
    catch (_a) {
        return "[unknown]";
    }
}
function indexOfAny(s, chars, position) {
    for (var i = position == null ? 0 : Math.max(position, 0); i < s.length; i++) {
        var ch = s.charCodeAt(i);
        for (var j = 0; j < chars.length; j++) {
            if (chars.charCodeAt(j) === ch)
                return i;
        }
    }
    return -1;
}
function startsWith(s, searchString) {
    return s.lastIndexOf(searchString, 0) >= 0;
}
function endsWith(s, searchString) {
    return s.indexOf(searchString, s.length - searchString.length) >= 0;
}
function errorToString(err, includeStackTrace) {
    if (includeStackTrace === void 0) { includeStackTrace = false; }
    return err instanceof Error ? visit(err, "") : toStringSafe(err);
    function visit(err, indent, visited) {
        var errString = err.toString();
        var s = (!indent ? indent : indent.substring(4) + "--> ") + errString;
        if (includeStackTrace && err.stack) {
            var stack = err.stack.trim();
            if (startsWith(stack, errString)) {
                stack = stack.substring(errString.length).trim();
            }
            s += "\n" + stack.replace(/^\s*(?:at\s)?/gm, indent + "    at ");
        }
        if (typeof AggregateError === "function" && err instanceof AggregateError) {
            (visited !== null && visited !== void 0 ? visited : (visited = [])).push(err);
            for (var _i = 0, _a = err.errors; _i < _a.length; _i++) {
                var innerErr = _a[_i];
                if (innerErr instanceof Error) {
                    if (visited.indexOf(innerErr) >= 0) {
                        continue;
                    }
                    s += "\n" + visit(innerErr, indent + "    ", visited);
                }
                else {
                    s += "\n" + indent + "--> " + toStringSafe(innerErr);
                }
            }
            visited.pop();
        }
        return s;
    }
}
function createMap() {
    return Object.create(null);
}
var setPrototypeOf = isFunction(Object.setPrototypeOf)
    ? Object.setPrototypeOf
    : function (obj, proto) { return (obj.__proto__ = proto, obj); };
function ensurePrototype(obj, ctor) {
    if (!(obj instanceof ctor)) {
        setPrototypeOf(obj, ctor.prototype);
    }
}
function Utils_hasOwnProperty(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
function hasAnyOwnProperties(obj) {
    for (var key in obj) {
        if (Utils_hasOwnProperty(obj, key)) {
            return true;
        }
    }
    return false;
}
function shallowClone(obj, propertyReplacer) {
    var clone = {};
    for (var key in obj) {
        if (Utils_hasOwnProperty(obj, key)) {
            var value = obj[key];
            clone[key] = propertyReplacer ? propertyReplacer(key, value) : value;
        }
    }
    return clone;
}
function isBoolean(value) {
    return typeof value === "boolean";
}
function isNumber(value) {
    return typeof value === "number";
}
function isNumberInRange(value, minValue, maxValue) {
    return isNumber(value) && minValue <= value && value <= maxValue;
}
var isInteger = isFunction(Number.isSafeInteger)
    ? Number.isSafeInteger
    : function (value) { return isNumber(value) && isFinite(value) && Math.floor(value) === value && Math.abs(value) <= 9007199254740991; };
function isIntegerInRange(value, minValue, maxValue) {
    return isInteger(value) && minValue <= value && value <= maxValue;
}
function isString(value) {
    return typeof value === "string";
}
function isObject(value) {
    return typeof value === "object" && value !== null && !isArray(value);
}
function isArray(value) {
    return Array.isArray(value);
}
function isStringArray(value) {
    return isArray(value) && !value.some(function (item) { return !isString(item); });
}
function isFunction(value) {
    return typeof value === "function";
}
function isPromiseLike(obj) {
    return isFunction(obj === null || obj === void 0 ? void 0 : obj.then);
}
function ensureBooleanArg(value, argName, memberPath) {
    isBoolean(value) || throwUnexpectedArgType(value, argName, "boolean", memberPath);
    return value;
}
function ensureNumberArg(value, argName, memberPath) {
    isNumber(value) || throwUnexpectedArgType(value, argName, "number", memberPath);
    return value;
}
function ensureNumberArgInRange(value, argName, rangeDescription, isInRange, memberPath) {
    ensureNumberArg(value, argName, memberPath);
    isInRange(value) || throwInvalidArg(argName, "Expected a value ".concat(rangeDescription, ", got ").concat(value, "."), memberPath, RangeError);
    return value;
}
function ensureEnumArg(value, argName, enumName, isValidEnum, memberPath) {
    ensureNumberArg(value, argName, memberPath);
    isValidEnum(value) || throwInvalidArg(argName, "Expected a valid `".concat(enumName, "` value, got '").concat(value, "'."), memberPath, RangeError);
    return value;
}
function ensureStringArg(value, argName, requireNonEmpty, memberPath) {
    isString(value) || throwUnexpectedArgType(value, argName, "string", memberPath);
    (value.length || !requireNonEmpty) || throwInvalidArg(argName, "Expected a non-empty string.", memberPath);
    return value;
}
function ensureFunctionArg(value, argName, memberPath) {
    isFunction(value) || throwUnexpectedArgType(value, argName, "function", memberPath);
    return value;
}
function ensureObjectArg(value, argName, requiredProps, memberPath) {
    isObject(value) || throwUnexpectedArgType(value, argName, "object", memberPath);
    if (requiredProps) {
        for (var key in requiredProps) {
            var isMethod = requiredProps[key];
            if (!(key in value)
                || (isMethod && !isFunction(value[key]))) {
                throwInvalidArg(argName, "Expected an object with ".concat(isMethod ? "method" : "property", " `").concat(key, "`."), memberPath, TypeError);
            }
        }
    }
    return value;
}
function throwUnexpectedArgType(value, argName, expectedType, memberPath) {
    var actualType = value === null ? "null" : typeof value;
    throwInvalidArg(argName, "Expected a value of type ".concat(expectedType, ", got ").concat(actualType, "."), memberPath, TypeError);
}
function throwInvalidArg(argName, reason, memberPath, errorConstructor) {
    var argKind = !memberPath ? (memberPath = "", "argument") : "property";
    throw (errorConstructor !== null && errorConstructor !== void 0 ? errorConstructor : Error)("Invalid ".concat(argKind, " `").concat(argName).concat(memberPath, "`. ").concat(reason));
}
function formatStringList(items, maxLength, getOmittedItemsText, separator) {
    if (maxLength === void 0) { maxLength = 0; }
    if (separator === void 0) { separator = ", "; }
    var length = items.length;
    if (!length) {
        return "";
    }
    var appendix = "";
    if (maxLength > 0 && length > maxLength) {
        items = items.slice(0, maxLength);
        if (getOmittedItemsText) {
            appendix = getOmittedItemsText(length - maxLength);
        }
    }
    return "'" + items.join("'" + separator + "'") + "'" + appendix;
}
function utf8Encode(text) {
    function codePointAt(text, index) {
        var ch = text.charCodeAt(index);
        if (0xD800 <= ch && ch < 0xDC00) {
            var nextCh = text.charCodeAt(index + 1);
            if (0xDC00 <= nextCh && nextCh <= 0xDFFF) {
                return (ch << 10) + nextCh - 0x35FDC00;
            }
        }
        return ch;
    }
    var utf8text = "", chunkStart = 0;
    var fromCharCode = String.fromCharCode;
    var i;
    for (i = 0; i < text.length; i++) {
        var cp = codePointAt(text, i);
        if (cp <= 0x7F) {
            continue;
        }
        utf8text += text.slice(chunkStart, i);
        if (cp <= 0x7FF) {
            utf8text += fromCharCode(0xC0 | (cp >> 6));
            utf8text += fromCharCode(0x80 | (cp & 0x3F));
        }
        else if (cp <= 0xFFFF) {
            utf8text += fromCharCode(0xE0 | (cp >> 12));
            utf8text += fromCharCode(0x80 | ((cp >> 6) & 0x3F));
            utf8text += fromCharCode(0x80 | (cp & 0x3F));
        }
        else {
            utf8text += fromCharCode(0xF0 | (cp >> 18));
            utf8text += fromCharCode(0x80 | ((cp >> 12) & 0x3F));
            utf8text += fromCharCode(0x80 | ((cp >> 6) & 0x3F));
            utf8text += fromCharCode(0x80 | (cp & 0x3F));
            ++i;
        }
        chunkStart = i + 1;
    }
    return utf8text += text.slice(chunkStart, i);
}
function toHexString(int32Array, count) {
    var result = "";
    count !== null && count !== void 0 ? count : (count = int32Array.length);
    for (var i = 0; i < count; i++) {
        for (var j = 3; j >= 0; j--) {
            var b = (int32Array[i] >> (j << 3)) & 0xFF;
            result += hexDigits[b >> 4];
            result += hexDigits[b & 0xF];
        }
    }
    return result;
}
function parseIntStrict(value) {
    if (!value.length || !/^\s*[+-]?\d+\s*$/.test(value)) {
        return NaN;
    }
    var number = +value;
    return isInteger(number) ? number : NaN;
}
function parseFloatStrict(value) {
    if (!value.length || /^\s*$|^\s*0[^\d.eE]/.test(value)) {
        return NaN;
    }
    return +value;
}
var LazyString = (function () {
    function LazyString(state, factory) {
        this.state = state;
        this.factoryOrValue = factory;
    }
    LazyString.prototype.toString = function () {
        var factoryOrValue = this.factoryOrValue;
        if (!isString(factoryOrValue)) {
            this.factoryOrValue = factoryOrValue = factoryOrValue(this.state);
            this.state = (void 0);
        }
        return factoryOrValue;
    };
    return LazyString;
}());


;// ./src/DefaultEventEmitter.ts

var DefaultEventEmitter = (function () {
    function DefaultEventEmitter() {
        this.events = createMap();
        this.eventCount = 0;
    }
    DefaultEventEmitter.prototype.addListenerCore = function (eventName, fn, once) {
        if (!isFunction(fn)) {
            throw TypeError("Listener must be a function");
        }
        var listeners = this.events[eventName];
        var listener = { fn: fn, once: once };
        if (!listeners) {
            this.events[eventName] = listener;
            this.eventCount++;
        }
        else if (!isArray(listeners)) {
            this.events[eventName] = [listeners, listener];
        }
        else {
            listeners.push(listener);
        }
        return this;
    };
    DefaultEventEmitter.prototype.removeListenerCore = function (eventName, state, isMatch) {
        var listeners = this.events[eventName];
        if (!listeners) {
            return this;
        }
        if (isArray(listeners)) {
            for (var i = listeners.length - 1; i >= 0; i--) {
                if (isMatch(listeners[i], state)) {
                    listeners.splice(i, 1);
                    if (!listeners.length) {
                        this.removeEvent(eventName);
                    }
                    else if (listeners.length === 1) {
                        this.events[eventName] = listeners[0];
                    }
                    break;
                }
            }
        }
        else if (isMatch(listeners, state)) {
            this.removeEvent(eventName);
        }
        return this;
    };
    DefaultEventEmitter.prototype.removeEvent = function (eventName) {
        if (--this.eventCount === 0) {
            this.events = createMap();
        }
        else {
            delete this.events[eventName];
        }
    };
    DefaultEventEmitter.prototype.on = function (eventName, listener) {
        return this.addListenerCore(eventName, listener, false);
    };
    DefaultEventEmitter.prototype.once = function (eventName, listener) {
        return this.addListenerCore(eventName, listener, true);
    };
    DefaultEventEmitter.prototype.removeListener = function (eventName, listener) {
        if (!isFunction(listener)) {
            throw TypeError("Listener must be a function");
        }
        return this.removeListenerCore(eventName, listener, function (listener, fn) { return listener.fn === fn; });
    };
    DefaultEventEmitter.prototype.removeAllListeners = function (eventName) {
        if (!arguments.length) {
            this.events = createMap();
            this.eventCount = 0;
        }
        else if (this.events[eventName]) {
            this.removeEvent(eventName);
        }
        return this;
    };
    DefaultEventEmitter.prototype.listeners = function (eventName) {
        var listeners = this.events[eventName];
        if (!listeners) {
            return [];
        }
        if (!isArray(listeners)) {
            return [listeners.fn];
        }
        var length = listeners.length, fns = Array(length);
        for (var i = 0; i < length; i++) {
            fns[i] = listeners[i].fn;
        }
        return fns;
    };
    DefaultEventEmitter.prototype.listenerCount = function (eventName) {
        var listeners = this.events[eventName];
        if (!listeners) {
            return 0;
        }
        if (!isArray(listeners)) {
            return 1;
        }
        return listeners.length;
    };
    DefaultEventEmitter.prototype.eventNames = function () {
        var names = [];
        if (this.eventCount === 0) {
            return names;
        }
        var events = this.events;
        for (var name_1 in events) {
            names.push(name_1);
        }
        if (isFunction(Object.getOwnPropertySymbols)) {
            return names.concat(Object.getOwnPropertySymbols(events));
        }
        return names;
    };
    DefaultEventEmitter.prototype.emit = function (eventName, arg0, arg1, arg2, arg3) {
        var _a, _b;
        var moreArgs = [];
        for (var _i = 5; _i < arguments.length; _i++) {
            moreArgs[_i - 5] = arguments[_i];
        }
        var listeners = this.events[eventName];
        if (!listeners) {
            return false;
        }
        var listener, length;
        if (!isArray(listeners)) {
            _a = [listeners, 1], listener = _a[0], length = _a[1];
        }
        else {
            listeners = listeners.slice();
            _b = [listeners[0], listeners.length], listener = _b[0], length = _b[1];
        }
        var argCount = arguments.length - 1;
        for (var i = 0;;) {
            if (listener.once) {
                this.removeListenerCore(eventName, listener, function (listener, toRemove) { return listener === toRemove; });
            }
            switch (argCount) {
                case 0:
                    listener.fn.call(this);
                    break;
                case 1:
                    listener.fn.call(this, arg0);
                    break;
                case 2:
                    listener.fn.call(this, arg0, arg1);
                    break;
                case 3:
                    listener.fn.call(this, arg0, arg1, arg2);
                    break;
                case 4:
                    listener.fn.call(this, arg0, arg1, arg2, arg3);
                    break;
                default:
                    var args = Array(argCount);
                    for (var j = 0; j < argCount; j++) {
                        args[j] = arguments[j + 1];
                    }
                    listener.fn.apply(this, args);
                    break;
            }
            if (++i >= length) {
                break;
            }
            listener = listeners[i];
        }
        return true;
    };
    return DefaultEventEmitter;
}());

var defaultEventEmitterPrototype = DefaultEventEmitter.prototype;
defaultEventEmitterPrototype.addListener = defaultEventEmitterPrototype.on;
defaultEventEmitterPrototype.off = defaultEventEmitterPrototype.removeListener;

;// ./node_modules/tslib/tslib.es6.mjs
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */

var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
  return extendStatics(d, b);
};

function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() { this.constructor = d; }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
  __assign = Object.assign || function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
  }
  return __assign.apply(this, arguments);
}

function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
              t[p[i]] = s[p[i]];
      }
  return t;
}

function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
  return function (target, key) { decorator(target, key, paramIndex); }
}

function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
      var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
      if (kind === "accessor") {
          if (result === void 0) continue;
          if (result === null || typeof result !== "object") throw new TypeError("Object expected");
          if (_ = accept(result.get)) descriptor.get = _;
          if (_ = accept(result.set)) descriptor.set = _;
          if (_ = accept(result.init)) initializers.unshift(_);
      }
      else if (_ = accept(result)) {
          if (kind === "field") initializers.unshift(_);
          else descriptor[key] = _;
      }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};

function __runInitializers(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};

function __propKey(x) {
  return typeof x === "symbol" ? x : "".concat(x);
};

function __setFunctionName(f, name, prefix) {
  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};

function __metadata(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
              case 0: case 1: t = op; break;
              case 4: _.label++; return { value: op[1], done: false };
              case 5: _.label++; y = op[1]; op = [0]; continue;
              case 7: op = _.ops.pop(); _.trys.pop(); continue;
              default:
                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                  if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                  if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                  if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                  if (t[2]) _.ops.pop();
                  _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
      } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
      if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
  }
  Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

function __exportStar(m, o) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
      next: function () {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
      }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  }
  catch (error) { e = { error: error }; }
  finally {
      try {
          if (r && !r.done && (m = i["return"])) m.call(i);
      }
      finally { if (e) throw e.error; }
  }
  return ar;
}

/** @deprecated */
function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
  return ar;
}

/** @deprecated */
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
          r[k] = a[j];
  return r;
}

function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
      }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
  function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
  function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
  function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
  function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
  function fulfill(value) { resume("next", value); }
  function reject(value) { resume("throw", value); }
  function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
  function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
  function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
  function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
  return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
  o["default"] = v;
};

function __importStar(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
}

function __importDefault(mod) {
  return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

function __classPrivateFieldIn(state, receiver) {
  if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
  return typeof state === "function" ? receiver === state : state.has(receiver);
}

function __addDisposableResource(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
    env.stack.push({ value: value, dispose: dispose, async: async });
  }
  else if (async) {
    env.stack.push({ async: true });
  }
  return value;
}

var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function __disposeResources(env) {
  function fail(e) {
    env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
    env.hasError = true;
  }
  var r, s = 0;
  function next() {
    while (r = env.stack.pop()) {
      try {
        if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
        if (r.dispose) {
          var result = r.dispose.call(r.value);
          if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
        }
        else s |= 1;
      }
      catch (e) {
        fail(e);
      }
    }
    if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
    if (env.hasError) throw env.error;
  }
  return next();
}

/* harmony default export */ const tslib_es6 = ({
  __extends,
  __assign,
  __rest,
  __decorate,
  __param,
  __metadata,
  __awaiter,
  __generator,
  __createBinding,
  __exportStar,
  __values,
  __read,
  __spread,
  __spreadArrays,
  __spreadArray,
  __await,
  __asyncGenerator,
  __asyncDelegator,
  __asyncValues,
  __makeTemplateObject,
  __importStar,
  __importDefault,
  __classPrivateFieldGet,
  __classPrivateFieldSet,
  __classPrivateFieldIn,
  __addDisposableResource,
  __disposeResources,
});

;// ./src/ConfigCatLogger.ts


var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 4] = "Debug";
    LogLevel[LogLevel["Info"] = 3] = "Info";
    LogLevel[LogLevel["Warn"] = 2] = "Warn";
    LogLevel[LogLevel["Error"] = 1] = "Error";
    LogLevel[LogLevel["Off"] = -1] = "Off";
})(LogLevel || (LogLevel = {}));
function nameOfLogLevel(value) {
    return LogLevel[value];
}
var FormattableLogMessage = (function () {
    function FormattableLogMessage(strings, argNames, argValues) {
        this.strings = strings;
        this.argNames = argNames;
        this.argValues = argValues;
        this.cachedDefaultFormattedMessage = void 0;
    }
    FormattableLogMessage.from = function () {
        var argNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            argNames[_i] = arguments[_i];
        }
        return function (strings) {
            var argValues = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                argValues[_i - 1] = arguments[_i];
            }
            return new FormattableLogMessage(strings, argNames, argValues);
        };
    };
    Object.defineProperty(FormattableLogMessage.prototype, "defaultFormattedMessage", {
        get: function () {
            var cachedMessage = this.cachedDefaultFormattedMessage;
            if (!isString(cachedMessage)) {
                cachedMessage = "";
                var _a = this, strings = _a.strings, argValues = _a.argValues;
                var i = 0;
                for (; i < strings.length - 1; i++) {
                    cachedMessage += strings[i];
                    cachedMessage += toStringSafe(argValues[i]);
                }
                cachedMessage += strings[i];
                this.cachedDefaultFormattedMessage = cachedMessage;
            }
            return cachedMessage;
        },
        enumerable: false,
        configurable: true
    });
    FormattableLogMessage.prototype.toString = function () { return this.defaultFormattedMessage; };
    return FormattableLogMessage;
}());

function toMessage(logMessage) {
    var _a;
    if (isString(logMessage)) {
        return logMessage;
    }
    return (_a = logMessage["cachedDefaultFormattedMessage"]) !== null && _a !== void 0 ? _a : new LazyString(logMessage, function (logMessage) { return logMessage.defaultFormattedMessage; });
}
var LoggerWrapper = (function () {
    function LoggerWrapper(logger, filter, hooks) {
        this.logger = logger;
        this.filter = filter;
        this.hooks = hooks;
    }
    Object.defineProperty(LoggerWrapper.prototype, "level", {
        get: function () {
            var _a;
            return (_a = this.logger.level) !== null && _a !== void 0 ? _a : 2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LoggerWrapper.prototype, "eol", {
        get: function () {
            var _a;
            return (_a = this.logger.eol) !== null && _a !== void 0 ? _a : "\n";
        },
        enumerable: false,
        configurable: true
    });
    LoggerWrapper.prototype.isEnabled = function (logLevel) {
        return this.level >= logLevel;
    };
    LoggerWrapper.prototype.log = function (level, eventId, message, exception) {
        var _a;
        if (this.isEnabled(level)
            && (!this.filter || this.filter(level, eventId, message, exception))) {
            this.logger.log(level, eventId, message, exception);
        }
        if (level === 1) {
            (_a = this.hooks) === null || _a === void 0 ? void 0 : _a.emit("clientError", toMessage(message), exception);
        }
        return message;
    };
    LoggerWrapper.prototype.debug = function (message, exception) {
        this.log(4, 0, message, exception);
    };
    Object.defineProperty(LoggerWrapper.prototype, "ifDebug", {
        get: function () { return this.isEnabled(4) ? this : void 0; },
        enumerable: false,
        configurable: true
    });
    LoggerWrapper.prototype.configJsonIsNotPresent = function (defaultReturnValue) {
        return this.log(1, 1000, FormattableLogMessage.from("DEFAULT_RETURN_VALUE")(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Config JSON is not present. Returning ", "."], ["Config JSON is not present. Returning ", "."])), defaultReturnValue));
    };
    LoggerWrapper.prototype.configJsonIsNotPresentSingle = function (key, defaultParamName, defaultParamValue) {
        return this.log(1, 1000, FormattableLogMessage.from("KEY", "DEFAULT_PARAM_NAME", "DEFAULT_PARAM_VALUE")(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Config JSON is not present when evaluating setting '", "'. Returning the `", "` parameter that you specified in your application: '", "'."], ["Config JSON is not present when evaluating setting '", "'. Returning the \\`", "\\` parameter that you specified in your application: '", "'."])), key, defaultParamName, defaultParamValue));
    };
    LoggerWrapper.prototype.settingEvaluationFailedDueToMissingKey = function (key, defaultParamName, defaultParamValue, availableKeys) {
        return this.log(1, 1001, FormattableLogMessage.from("KEY", "DEFAULT_PARAM_NAME", "DEFAULT_PARAM_VALUE", "AVAILABLE_KEYS")(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Failed to evaluate setting '", "' (the key was not found in config JSON). Returning the `", "` parameter that you specified in your application: '", "'. Available keys: [", "]."], ["Failed to evaluate setting '", "' (the key was not found in config JSON). Returning the \\`", "\\` parameter that you specified in your application: '", "'. Available keys: [", "]."])), key, defaultParamName, defaultParamValue, availableKeys));
    };
    LoggerWrapper.prototype.settingEvaluationError = function (methodName, defaultReturnValue, ex) {
        return this.log(1, 1002, FormattableLogMessage.from("METHOD_NAME", "DEFAULT_RETURN_VALUE")(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Error occurred in the `", "` method. Returning ", "."], ["Error occurred in the \\`", "\\` method. Returning ", "."])), methodName, defaultReturnValue), ex);
    };
    LoggerWrapper.prototype.settingEvaluationErrorSingle = function (methodName, key, defaultParamName, defaultParamValue, ex) {
        return this.log(1, 1002, FormattableLogMessage.from("METHOD_NAME", "KEY", "DEFAULT_PARAM_NAME", "DEFAULT_PARAM_VALUE")(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Error occurred in the `", "` method while evaluating setting '", "'. Returning the `", "` parameter that you specified in your application: '", "'."], ["Error occurred in the \\`", "\\` method while evaluating setting '", "'. Returning the \\`", "\\` parameter that you specified in your application: '", "'."])), methodName, key, defaultParamName, defaultParamValue), ex);
    };
    LoggerWrapper.prototype.clientMethodError = function (methodName, ex) {
        return this.log(1, 1003, FormattableLogMessage.from("METHOD_NAME")(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Error occurred in the `", "` method."], ["Error occurred in the \\`", "\\` method."])), methodName), ex);
    };
    LoggerWrapper.prototype.fetchFailedDueToInvalidSdkKey = function (sdkKey, rayId) {
        sdkKey = maskSdkKey(sdkKey);
        return this.log(1, 1100, rayId == null
            ? FormattableLogMessage.from("SDK_KEY")(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Your SDK Key seems to be wrong: '", "'. You can find the valid SDK Key at https://app.configcat.com/sdkkey"], ["Your SDK Key seems to be wrong: '", "'. You can find the valid SDK Key at https://app.configcat.com/sdkkey"])), sdkKey) : FormattableLogMessage.from("SDK_KEY", "RAY_ID")(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Your SDK Key seems to be wrong: '", "'. You can find the valid SDK Key at https://app.configcat.com/sdkkey (Ray ID: ", ")"], ["Your SDK Key seems to be wrong: '", "'. You can find the valid SDK Key at https://app.configcat.com/sdkkey (Ray ID: ", ")"])), sdkKey, rayId));
    };
    LoggerWrapper.prototype.fetchFailedDueToUnexpectedHttpResponse = function (statusCode, reasonPhrase, rayId) {
        return this.log(1, 1101, rayId == null
            ? FormattableLogMessage.from("STATUS_CODE", "REASON_PHRASE")(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Unexpected HTTP response was received while trying to fetch config JSON: ", " ", ""], ["Unexpected HTTP response was received while trying to fetch config JSON: ", " ", ""])), statusCode, reasonPhrase) : FormattableLogMessage.from("STATUS_CODE", "REASON_PHRASE", "RAY_ID")(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Unexpected HTTP response was received while trying to fetch config JSON: ", " ", " (Ray ID: ", ")"], ["Unexpected HTTP response was received while trying to fetch config JSON: ", " ", " (Ray ID: ", ")"])), statusCode, reasonPhrase, rayId));
    };
    LoggerWrapper.prototype.fetchFailedDueToRequestTimeout = function (timeoutMs, ex, rayId) {
        return this.log(1, 1102, rayId == null
            ? FormattableLogMessage.from("TIMEOUT")(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Request timed out while trying to fetch config JSON. Timeout value: ", "ms"], ["Request timed out while trying to fetch config JSON. Timeout value: ", "ms"])), timeoutMs) : FormattableLogMessage.from("TIMEOUT", "RAY_ID")(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Request timed out while trying to fetch config JSON. Timeout value: ", "ms (Ray ID: ", ")"], ["Request timed out while trying to fetch config JSON. Timeout value: ", "ms (Ray ID: ", ")"])), timeoutMs, rayId), ex);
    };
    LoggerWrapper.prototype.fetchFailedDueToUnexpectedError = function (ex, rayId) {
        return this.log(1, 1103, rayId == null
            ? "Unexpected error occurred while trying to fetch config JSON. It is most likely due to a local network issue. Please make sure your application can reach the ConfigCat CDN servers (or your proxy server) over HTTP."
            : FormattableLogMessage.from("RAY_ID")(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Unexpected error occurred while trying to fetch config JSON. It is most likely due to a local network issue. Please make sure your application can reach the ConfigCat CDN servers (or your proxy server) over HTTP. (Ray ID: ", ")"], ["Unexpected error occurred while trying to fetch config JSON. It is most likely due to a local network issue. Please make sure your application can reach the ConfigCat CDN servers (or your proxy server) over HTTP. (Ray ID: ", ")"])), rayId), ex);
    };
    LoggerWrapper.prototype.fetchFailedDueToRedirectLoop = function (rayId) {
        return this.log(1, 1104, rayId == null
            ? "Redirection loop encountered while trying to fetch config JSON. Please contact us at https://configcat.com/support/"
            : FormattableLogMessage.from("RAY_ID")(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Redirection loop encountered while trying to fetch config JSON. Please contact us at https://configcat.com/support/ (Ray ID: ", ")"], ["Redirection loop encountered while trying to fetch config JSON. Please contact us at https://configcat.com/support/ (Ray ID: ", ")"])), rayId));
    };
    LoggerWrapper.prototype.fetchReceived200WithInvalidBody = function (rayId, ex) {
        return this.log(1, 1105, rayId == null
            ? "Fetching config JSON was successful but the HTTP response content was invalid."
            : FormattableLogMessage.from("RAY_ID")(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Fetching config JSON was successful but the HTTP response content was invalid. (Ray ID: ", ")"], ["Fetching config JSON was successful but the HTTP response content was invalid. (Ray ID: ", ")"])), rayId), ex);
    };
    LoggerWrapper.prototype.fetchReceived304WhenLocalCacheIsEmpty = function (statusCode, reasonPhrase, rayId) {
        return this.log(1, 1106, rayId == null
            ? FormattableLogMessage.from("STATUS_CODE", "REASON_PHRASE")(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Unexpected HTTP response was received when no config JSON is cached locally: ", " ", ""], ["Unexpected HTTP response was received when no config JSON is cached locally: ", " ", ""])), statusCode, reasonPhrase) : FormattableLogMessage.from("STATUS_CODE", "REASON_PHRASE", "RAY_ID")(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Unexpected HTTP response was received when no config JSON is cached locally: ", " ", " (Ray ID: ", ")"], ["Unexpected HTTP response was received when no config JSON is cached locally: ", " ", " (Ray ID: ", ")"])), statusCode, reasonPhrase, rayId));
    };
    LoggerWrapper.prototype.autoPollConfigServiceErrorDuringPolling = function (ex) {
        return this.log(1, 1200, "Error occurred during auto polling.", ex);
    };
    LoggerWrapper.prototype.settingForVariationIdIsNotPresent = function (variationId) {
        return this.log(1, 2011, FormattableLogMessage.from("VARIATION_ID")(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Could not find the setting for the specified variation ID: '", "'."], ["Could not find the setting for the specified variation ID: '", "'."])), variationId));
    };
    LoggerWrapper.prototype.configServiceCacheReadError = function (ex) {
        return this.log(1, 2200, "Error occurred while reading the cache.", ex);
    };
    LoggerWrapper.prototype.configServiceCacheWriteError = function (ex) {
        return this.log(1, 2201, "Error occurred while writing the cache.", ex);
    };
    LoggerWrapper.prototype.clientIsAlreadyCreated = function (sdkKey) {
        sdkKey = maskSdkKey(sdkKey);
        return this.log(2, 3000, FormattableLogMessage.from("SDK_KEY")(templateObject_19 || (templateObject_19 = __makeTemplateObject(["There is an existing client instance for the specified SDK Key. No new client instance will be created and the specified options are ignored. Returning the existing client instance. SDK Key: '", "'."], ["There is an existing client instance for the specified SDK Key. No new client instance will be created and the specified options are ignored. Returning the existing client instance. SDK Key: '", "'."])), sdkKey));
    };
    LoggerWrapper.prototype.userObjectIsMissing = function (key) {
        return this.log(2, 3001, FormattableLogMessage.from("KEY")(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Cannot evaluate targeting rules and % options for setting '", "' (User Object is missing). You should pass a User Object to the evaluation methods like `getValueAsync()` in order to make targeting work properly. Read more: https://configcat.com/docs/advanced/user-object/"], ["Cannot evaluate targeting rules and % options for setting '", "' (User Object is missing). You should pass a User Object to the evaluation methods like \\`getValueAsync()\\` in order to make targeting work properly. Read more: https://configcat.com/docs/advanced/user-object/"])), key));
    };
    LoggerWrapper.prototype.dataGovernanceIsOutOfSync = function () {
        return this.log(2, 3002, "The `dataGovernance` parameter specified at the client initialization is not in sync with the preferences on the ConfigCat Dashboard. Read more: https://configcat.com/docs/advanced/data-governance/");
    };
    LoggerWrapper.prototype.userObjectAttributeIsMissingPercentage = function (key, attributeName) {
        return this.log(2, 3003, FormattableLogMessage.from("KEY", "ATTRIBUTE_NAME", "ATTRIBUTE_NAME")(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Cannot evaluate % options for setting '", "' (the User.", " attribute is missing). You should set the User.", " attribute in order to make targeting work properly. Read more: https://configcat.com/docs/advanced/user-object/"], ["Cannot evaluate % options for setting '", "' (the User.", " attribute is missing). You should set the User.", " attribute in order to make targeting work properly. Read more: https://configcat.com/docs/advanced/user-object/"])), key, attributeName, attributeName));
    };
    LoggerWrapper.prototype.userObjectAttributeIsMissingCondition = function (condition, key, attributeName) {
        return this.log(2, 3003, FormattableLogMessage.from("CONDITION", "KEY", "ATTRIBUTE_NAME", "ATTRIBUTE_NAME")(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Cannot evaluate condition (", ") for setting '", "' (the User.", " attribute is missing). You should set the User.", " attribute in order to make targeting work properly. Read more: https://configcat.com/docs/advanced/user-object/"], ["Cannot evaluate condition (", ") for setting '", "' (the User.", " attribute is missing). You should set the User.", " attribute in order to make targeting work properly. Read more: https://configcat.com/docs/advanced/user-object/"])), condition, key, attributeName, attributeName));
    };
    LoggerWrapper.prototype.userObjectAttributeIsInvalid = function (condition, key, reason, attributeName) {
        return this.log(2, 3004, FormattableLogMessage.from("CONDITION", "KEY", "REASON", "ATTRIBUTE_NAME")(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Cannot evaluate condition (", ") for setting '", "' (", "). Please check the User.", " attribute and make sure that its value corresponds to the comparison operator."], ["Cannot evaluate condition (", ") for setting '", "' (", "). Please check the User.", " attribute and make sure that its value corresponds to the comparison operator."])), condition, key, reason, attributeName));
    };
    LoggerWrapper.prototype.userObjectAttributeIsAutoConverted = function (condition, key, attributeName, attributeValue) {
        return this.log(2, 3005, FormattableLogMessage.from("CONDITION", "KEY", "ATTRIBUTE_NAME", "ATTRIBUTE_VALUE")(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Evaluation of condition (", ") for setting '", "' may not produce the expected result (the User.", " attribute is not a string value, thus it was automatically converted to the string value '", "'). Please make sure that using a non-string value was intended."], ["Evaluation of condition (", ") for setting '", "' may not produce the expected result (the User.", " attribute is not a string value, thus it was automatically converted to the string value '", "'). Please make sure that using a non-string value was intended."])), condition, key, attributeName, attributeValue));
    };
    LoggerWrapper.prototype.configServiceCannotInitiateHttpCalls = function () {
        return this.log(2, 3200, "Client is in offline mode, it cannot initiate HTTP calls.");
    };
    LoggerWrapper.prototype.configServiceMethodHasNoEffectDueToDisposedClient = function (methodName) {
        return this.log(2, 3201, FormattableLogMessage.from("METHOD_NAME")(templateObject_25 || (templateObject_25 = __makeTemplateObject(["The client object is already disposed, thus `", "()` has no effect."], ["The client object is already disposed, thus \\`", "()\\` has no effect."])), methodName));
    };
    LoggerWrapper.prototype.configServiceMethodHasNoEffectDueToOverrideBehavior = function (overrideBehavior, methodName) {
        return this.log(2, 3202, FormattableLogMessage.from("OVERRIDE_BEHAVIOR", "METHOD_NAME")(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Client is configured to use the `", "` override behavior, thus `", "()` has no effect."], ["Client is configured to use the \\`", "\\` override behavior, thus \\`", "()\\` has no effect."])), overrideBehavior, methodName));
    };
    LoggerWrapper.prototype.settingEvaluated = function (evaluateLog) {
        return this.log(3, 5000, FormattableLogMessage.from("EVALUATE_LOG")(templateObject_27 || (templateObject_27 = __makeTemplateObject(["", ""], ["", ""])), evaluateLog));
    };
    LoggerWrapper.prototype.configServiceStatusChanged = function (status) {
        return this.log(3, 5200, FormattableLogMessage.from("MODE")(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Switched to ", " mode."], ["Switched to ", " mode."])), status.toUpperCase()));
    };
    return LoggerWrapper;
}());

function logMethodDebug(logger, methodName, message) {
    logger === null || logger === void 0 ? void 0 : logger.debug("".concat(methodName, "()").concat(message ? ":" : "", " ").concat(message !== null && message !== void 0 ? message : "called."));
}
var ConfigCatConsoleLogger = (function () {
    function ConfigCatConsoleLogger(level, eol) {
        if (level === void 0) { level = 2; }
        if (eol === void 0) { eol = "\n"; }
        this.level = level;
        this.eol = eol;
        this.SOURCE = "ConfigCat";
    }
    ConfigCatConsoleLogger.prototype.log = function (level, eventId, message, exception) {
        var _a = level === 4 ? [console.info, "DEBUG"]
            : level === 3 ? [console.info, "INFO"]
                : level === 2 ? [console.warn, "WARN"]
                    : level === 1 ? [console.error, "ERROR"]
                        : [console.log, nameOfLogLevel(level).toUpperCase()], logMethod = _a[0], levelString = _a[1];
        var exceptionString = exception !== void 0 ? this.eol + errorToString(exception, true) : "";
        logMethod("".concat(this.SOURCE, " - ").concat(levelString, " - [").concat(eventId, "] ").concat(message).concat(exceptionString));
    };
    return ConfigCatConsoleLogger;
}());

function maskSdkKey(sdkKey) {
    var numCharsToKeep = 6;
    return sdkKey.substring(0, sdkKey.length - numCharsToKeep).replace(/[^/]/g, "*") + sdkKey.substring(sdkKey.length - numCharsToKeep);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28;

;// ./src/ConfigFetcher.ts


var USER_AGENT_HEADER_NAME = "User-Agent";
var CONFIGCAT_USER_AGENT_HEADER_NAME = "X-ConfigCat-UserAgent";
var SDK_QUERYPARAM_NAME = "sdk";
var ETAG_QUERYPARAM_NAME = "ccetag";
var FetchStatus;
(function (FetchStatus) {
    FetchStatus[FetchStatus["Fetched"] = 0] = "Fetched";
    FetchStatus[FetchStatus["NotModified"] = 1] = "NotModified";
    FetchStatus[FetchStatus["Errored"] = 2] = "Errored";
})(FetchStatus || (FetchStatus = {}));
function fetchResultFromSuccess(config) {
    return { status: 0, config: config, errorCode: 0 };
}
function fetchResultFromNotModified(config) {
    return { status: 1, config: config, errorCode: 0 };
}
function fetchResultFromError(config, errorCode, errorMessage, errorException) {
    return { status: 2, config: config, errorCode: errorCode, errorMessage: errorMessage, errorException: errorException };
}
var FetchRequest = (function () {
    function FetchRequest(url, lastETag, headers, timeoutMs) {
        this.url = url;
        this.lastETag = lastETag;
        this.headers = headers;
        this.timeoutMs = timeoutMs;
    }
    return FetchRequest;
}());

var FetchResponse = (function () {
    function FetchResponse(statusCode, reasonPhrase, headers, body) {
        this.statusCode = statusCode;
        this.reasonPhrase = reasonPhrase;
        this.body = body;
        this.eTag = void 0;
        this.rayId = void 0;
        var eTag, rayId;
        for (var _i = 0, headers_1 = headers; _i < headers_1.length; _i++) {
            var _a = headers_1[_i], name_1 = _a[0], value = _a[1];
            var normalizedName = name_1.toLowerCase();
            if (eTag == null && normalizedName === "etag") {
                this.eTag = eTag = value;
                if (rayId != null)
                    break;
            }
            else if (rayId == null && normalizedName === "cf-ray") {
                this.rayId = rayId = value;
                if (eTag != null)
                    break;
            }
        }
    }
    FetchResponse.prototype.isExpected = function () {
        switch (this.statusCode) {
            case 200:
            case 304:
            case 403:
            case 404:
                return true;
        }
        return false;
    };
    return FetchResponse;
}());

var FetchError = (function (_super) {
    __extends(FetchError, _super);
    function FetchError(cause) {
        var _a, _b;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var _this = this;
        var message, rayId;
        switch (cause) {
            case "abort":
                rayId = args[0];
                message = "Request was aborted.";
                break;
            case "timeout":
                var timeoutMs = void 0;
                _a = args, timeoutMs = _a[0], rayId = _a[1];
                message = "Request timed out. Timeout value: ".concat(timeoutMs, "ms");
                break;
            case "failure":
                var err = void 0;
                _b = args, err = _b[0], rayId = _b[1];
                message = "Request failed due to a network or protocol error.";
                message = err
                    ? message + " " + (err instanceof Error ? err.message : toStringSafe(err))
                    : message;
                break;
        }
        _this = _super.call(this, message) || this;
        _this.cause = cause;
        _this.name = FetchError.name;
        ensurePrototype(_this, FetchError);
        _this.args = args;
        _this.rayId = rayId;
        return _this;
    }
    return FetchError;
}(Error));

function getRequestHeaders(clientVersion) {
    return [
        [USER_AGENT_HEADER_NAME, clientVersion],
        [CONFIGCAT_USER_AGENT_HEADER_NAME, clientVersion],
    ];
}
var normalizedUserAgentHeaderName;
var normalizedConfigCatUserAgentHeaderName;
function adjustUrlForBrowser(url, request) {
    var lastETag = request.lastETag, headers = request.headers;
    normalizedUserAgentHeaderName !== null && normalizedUserAgentHeaderName !== void 0 ? normalizedUserAgentHeaderName : (normalizedUserAgentHeaderName = USER_AGENT_HEADER_NAME.toLowerCase());
    normalizedConfigCatUserAgentHeaderName !== null && normalizedConfigCatUserAgentHeaderName !== void 0 ? normalizedConfigCatUserAgentHeaderName : (normalizedConfigCatUserAgentHeaderName = CONFIGCAT_USER_AGENT_HEADER_NAME.toLowerCase());
    var userAgentHeaderValue;
    for (var _i = 0, headers_2 = headers; _i < headers_2.length; _i++) {
        var _a = headers_2[_i], key = _a[0], value = _a[1];
        var normalizedKey = key.toLowerCase();
        if (normalizedKey === normalizedUserAgentHeaderName || normalizedKey === normalizedConfigCatUserAgentHeaderName) {
            userAgentHeaderValue = value;
            break;
        }
    }
    var sdkQueryParamValue = encodeURIComponent(userAgentHeaderValue !== null && userAgentHeaderValue !== void 0 ? userAgentHeaderValue : "");
    var endIndex;
    var index = indexOfAny(url, "?#");
    var query = index < 0 || url.charCodeAt(index) !== 0x3F
        ? ""
        : (endIndex = url.indexOf("#", index + 1), url.substring(index + 1, endIndex < 0 ? url.length : endIndex));
    url = index < 0 ? url : url.substring(0, index);
    return query ? "".concat(url, "?").concat(SDK_QUERYPARAM_NAME, "=").concat(sdkQueryParamValue, "&").concat(ETAG_QUERYPARAM_NAME, "=").concat(encodeURIComponent(lastETag !== null && lastETag !== void 0 ? lastETag : ""), "&").concat(query)
        : lastETag ? "".concat(url, "?").concat(SDK_QUERYPARAM_NAME, "=").concat(sdkQueryParamValue, "&").concat(ETAG_QUERYPARAM_NAME, "=").concat(encodeURIComponent(lastETag))
            : "".concat(url, "?").concat(SDK_QUERYPARAM_NAME, "=").concat(sdkQueryParamValue);
}
var fetchInternalAsyncMethodName = "fetchInternalAsync";
var FETCH_RETRY_LIMIT = 1;
var FETCH_RETRY_DELAY_MS = 50;
var CONNECTIONPOOL_RESET_THRESHOLD_MS = 30000;
var REQUEST_ID_ARG_NAME = "REQUEST_ID";

;// ./src/ConfigJson.ts
var RedirectMode;
(function (RedirectMode) {
    RedirectMode[RedirectMode["No"] = 0] = "No";
    RedirectMode[RedirectMode["Should"] = 1] = "Should";
    RedirectMode[RedirectMode["Force"] = 2] = "Force";
})(RedirectMode || (RedirectMode = {}));
var SettingType;
(function (SettingType) {
    SettingType[SettingType["Boolean"] = 0] = "Boolean";
    SettingType[SettingType["String"] = 1] = "String";
    SettingType[SettingType["Int"] = 2] = "Int";
    SettingType[SettingType["Double"] = 3] = "Double";
})(SettingType || (SettingType = {}));
var UserComparator;
(function (UserComparator) {
    UserComparator[UserComparator["TextIsOneOf"] = 0] = "TextIsOneOf";
    UserComparator[UserComparator["TextIsNotOneOf"] = 1] = "TextIsNotOneOf";
    UserComparator[UserComparator["TextContainsAnyOf"] = 2] = "TextContainsAnyOf";
    UserComparator[UserComparator["TextNotContainsAnyOf"] = 3] = "TextNotContainsAnyOf";
    UserComparator[UserComparator["SemVerIsOneOf"] = 4] = "SemVerIsOneOf";
    UserComparator[UserComparator["SemVerIsNotOneOf"] = 5] = "SemVerIsNotOneOf";
    UserComparator[UserComparator["SemVerLess"] = 6] = "SemVerLess";
    UserComparator[UserComparator["SemVerLessOrEquals"] = 7] = "SemVerLessOrEquals";
    UserComparator[UserComparator["SemVerGreater"] = 8] = "SemVerGreater";
    UserComparator[UserComparator["SemVerGreaterOrEquals"] = 9] = "SemVerGreaterOrEquals";
    UserComparator[UserComparator["NumberEquals"] = 10] = "NumberEquals";
    UserComparator[UserComparator["NumberNotEquals"] = 11] = "NumberNotEquals";
    UserComparator[UserComparator["NumberLess"] = 12] = "NumberLess";
    UserComparator[UserComparator["NumberLessOrEquals"] = 13] = "NumberLessOrEquals";
    UserComparator[UserComparator["NumberGreater"] = 14] = "NumberGreater";
    UserComparator[UserComparator["NumberGreaterOrEquals"] = 15] = "NumberGreaterOrEquals";
    UserComparator[UserComparator["SensitiveTextIsOneOf"] = 16] = "SensitiveTextIsOneOf";
    UserComparator[UserComparator["SensitiveTextIsNotOneOf"] = 17] = "SensitiveTextIsNotOneOf";
    UserComparator[UserComparator["DateTimeBefore"] = 18] = "DateTimeBefore";
    UserComparator[UserComparator["DateTimeAfter"] = 19] = "DateTimeAfter";
    UserComparator[UserComparator["SensitiveTextEquals"] = 20] = "SensitiveTextEquals";
    UserComparator[UserComparator["SensitiveTextNotEquals"] = 21] = "SensitiveTextNotEquals";
    UserComparator[UserComparator["SensitiveTextStartsWithAnyOf"] = 22] = "SensitiveTextStartsWithAnyOf";
    UserComparator[UserComparator["SensitiveTextNotStartsWithAnyOf"] = 23] = "SensitiveTextNotStartsWithAnyOf";
    UserComparator[UserComparator["SensitiveTextEndsWithAnyOf"] = 24] = "SensitiveTextEndsWithAnyOf";
    UserComparator[UserComparator["SensitiveTextNotEndsWithAnyOf"] = 25] = "SensitiveTextNotEndsWithAnyOf";
    UserComparator[UserComparator["SensitiveArrayContainsAnyOf"] = 26] = "SensitiveArrayContainsAnyOf";
    UserComparator[UserComparator["SensitiveArrayNotContainsAnyOf"] = 27] = "SensitiveArrayNotContainsAnyOf";
    UserComparator[UserComparator["TextEquals"] = 28] = "TextEquals";
    UserComparator[UserComparator["TextNotEquals"] = 29] = "TextNotEquals";
    UserComparator[UserComparator["TextStartsWithAnyOf"] = 30] = "TextStartsWithAnyOf";
    UserComparator[UserComparator["TextNotStartsWithAnyOf"] = 31] = "TextNotStartsWithAnyOf";
    UserComparator[UserComparator["TextEndsWithAnyOf"] = 32] = "TextEndsWithAnyOf";
    UserComparator[UserComparator["TextNotEndsWithAnyOf"] = 33] = "TextNotEndsWithAnyOf";
    UserComparator[UserComparator["ArrayContainsAnyOf"] = 34] = "ArrayContainsAnyOf";
    UserComparator[UserComparator["ArrayNotContainsAnyOf"] = 35] = "ArrayNotContainsAnyOf";
})(UserComparator || (UserComparator = {}));
var PrerequisiteFlagComparator;
(function (PrerequisiteFlagComparator) {
    PrerequisiteFlagComparator[PrerequisiteFlagComparator["Equals"] = 0] = "Equals";
    PrerequisiteFlagComparator[PrerequisiteFlagComparator["NotEquals"] = 1] = "NotEquals";
})(PrerequisiteFlagComparator || (PrerequisiteFlagComparator = {}));
var SegmentComparator;
(function (SegmentComparator) {
    SegmentComparator[SegmentComparator["IsIn"] = 0] = "IsIn";
    SegmentComparator[SegmentComparator["IsNotIn"] = 1] = "IsNotIn";
})(SegmentComparator || (SegmentComparator = {}));

;// ./src/ProjectConfig.ts




var ProjectConfig = (function () {
    function ProjectConfig(configJson, config, timestamp, httpETag) {
        this.configJson = configJson;
        this.config = config;
        this.timestamp = timestamp;
        this.httpETag = httpETag;
    }
    ProjectConfig.contentEquals = function (projectConfig1, projectConfig2) {
        return projectConfig1.httpETag && projectConfig2.httpETag
            ? projectConfig1.httpETag === projectConfig2.httpETag
            : projectConfig1.configJson === projectConfig2.configJson;
    };
    ProjectConfig.prototype.with = function (timestamp) { return new ProjectConfig(this.configJson, this.config, timestamp, this.httpETag); };
    Object.defineProperty(ProjectConfig.prototype, "isEmpty", {
        get: function () { return !this.config; },
        enumerable: false,
        configurable: true
    });
    ProjectConfig.prototype.isExpired = function (expirationMs) {
        return this === ProjectConfig.empty || this.timestamp + expirationMs < ProjectConfig.generateTimestamp();
    };
    ProjectConfig.generateTimestamp = function () {
        return new Date().getTime();
    };
    ProjectConfig.serialize = function (config) {
        var _a, _b;
        return config.timestamp + "\n"
            + ((_a = config.httpETag) !== null && _a !== void 0 ? _a : "") + "\n"
            + ((_b = config.configJson) !== null && _b !== void 0 ? _b : "");
    };
    ProjectConfig.deserialize = function (value) {
        var separatorIndices = Array(2);
        var index = 0;
        for (var i = 0; i < separatorIndices.length; i++) {
            index = value.indexOf("\n", index);
            if (index < 0) {
                throw Error("Number of values is fewer than expected.");
            }
            separatorIndices[i] = index++;
        }
        var endIndex = separatorIndices[0];
        var slice = value.substring(0, endIndex);
        var fetchTime = parseInt(slice);
        if (isNaN(fetchTime)) {
            throw Error("Invalid fetch time: " + slice);
        }
        index = endIndex + 1;
        endIndex = separatorIndices[1];
        slice = value.substring(index, endIndex);
        var httpETag = slice.length > 0 ? slice : void 0;
        index = endIndex + 1;
        slice = value.substring(index);
        var config;
        var configJson;
        if (slice.length > 0) {
            config = deserializeConfig(slice);
            configJson = slice;
        }
        return new ProjectConfig(configJson, config, fetchTime, httpETag);
    };
    ProjectConfig.serializationFormatVersion = "v2";
    ProjectConfig.empty = new ProjectConfig(void 0, void 0, 0, void 0);
    return ProjectConfig;
}());

function getTimestampAsDate(projectConfig) {
    return projectConfig ? new Date(projectConfig.timestamp) : void 0;
}
function deserializeConfig(configJson) {
    ensureStringArg(configJson, "configJson", true);
    var configJsonParsed = JSON.parse(configJson);
    return prepareConfig(configJsonParsed);
}
function prepareConfig(config) {
    var _a;
    checkConfig(config, ["$"]);
    var settings = config.f;
    if (settings) {
        var salt = (_a = config.p) === null || _a === void 0 ? void 0 : _a.s;
        var segments = config.s;
        for (var key in settings) {
            if (Utils_hasOwnProperty(settings, key)) {
                var setting = settings[key];
                setting["_configJsonSalt"] = salt;
                setting["_configSegments"] = segments;
            }
        }
    }
    return config;
}
function createSettingFromValue(value) {
    var setting = Object.create(objectMapPrototype);
    setting.t = -1;
    setting.v = value;
    return setting;
}
var objectMapPrototype = Object.create(null);
objectMapPrototype.toString = function () { return Object.prototype.toString.call(this); };
function checkConfig(config, path) {
    if (config == null) {
        throwConfigJsonMissingRequiredValue(path);
    }
    ensureObject(config, path);
    checkObjectProperty(config, "p", path, checkPreferences);
    checkObjectProperty(config, "s", path, checkSegments);
    checkObjectProperty(config, "f", path, checkSettings);
}
function checkPreferences(preferences, path) {
    ensureObject(preferences, path);
    checkObjectProperty(preferences, "r", path, ensureInteger);
    checkObjectProperty(preferences, "u", path, ensureString);
    checkObjectProperty(preferences, "s", path, ensureString);
}
function checkSegments(segments, path) {
    ensureArray(segments, path);
    for (var i = 0; i < segments.length; i++) {
        checkArrayElement(segments, i, path, checkSegment);
    }
}
function checkSegment(segment, path) {
    ensureObject(segment, path);
    checkObjectProperty(segment, "n", path, ensureString, true);
    checkObjectProperty(segment, "r", path, checkSegmentConditions);
}
function checkSettings(settings, path) {
    ensureObject(settings, path);
    for (var key in settings) {
        if (Utils_hasOwnProperty(settings, key)) {
            checkObjectProperty(settings, key, path, checkSetting, true);
        }
    }
}
function checkSetting(setting, path) {
    ensureObject(setting, path);
    checkObjectProperty(setting, "t", path, ensureInteger, true);
    checkObjectProperty(setting, "a", path, ensureString);
    checkObjectProperty(setting, "r", path, checkTargetingRules);
    checkObjectProperty(setting, "p", path, checkPercentageOptions);
    checkServedValue(setting, path);
}
function checkTargetingRules(targetingRules, path) {
    ensureArray(targetingRules, path);
    for (var i = 0; i < targetingRules.length; i++) {
        checkArrayElement(targetingRules, i, path, checkTargetingRule);
    }
}
function checkTargetingRule(targetingRule, path) {
    ensureObject(targetingRule, path);
    checkObjectProperty(targetingRule, "c", path, checkConditions);
    checkObjectProperty(targetingRule, "s", path, checkServedValue);
    checkObjectProperty(targetingRule, "p", path, checkPercentageOptions);
}
function checkConditions(conditions, path) {
    ensureArray(conditions, path);
    for (var i = 0; i < conditions.length; i++) {
        checkArrayElement(conditions, i, path, checkCondition);
    }
}
function checkSegmentConditions(conditions, path) {
    ensureArray(conditions, path);
    for (var i = 0; i < conditions.length; i++) {
        checkArrayElement(conditions, i, path, checkUserCondition);
    }
}
function checkCondition(condition, path) {
    ensureObject(condition, path);
    checkObjectProperty(condition, "u", path, checkUserCondition);
    checkObjectProperty(condition, "p", path, checkPrerequisiteFlagCondition);
    checkObjectProperty(condition, "s", path, checkSegmentCondition);
}
function checkUserCondition(condition, path) {
    ensureObject(condition, path);
    checkObjectProperty(condition, "a", path, ensureString, true);
    checkObjectProperty(condition, "c", path, ensureInteger, true);
    checkObjectProperty(condition, "s", path, ensureString);
    checkObjectProperty(condition, "d", path, ensureNumber);
    checkObjectProperty(condition, "l", path, checkComparisonValues);
}
function checkComparisonValues(comparisonValues, path) {
    ensureArray(comparisonValues, path);
    for (var i = 0; i < comparisonValues.length; i++) {
        checkArrayElement(comparisonValues, i, path, ensureString);
    }
}
function checkPrerequisiteFlagCondition(condition, path) {
    ensureObject(condition, path);
    checkObjectProperty(condition, "f", path, ensureString, true);
    checkObjectProperty(condition, "c", path, ensureInteger, true);
    checkObjectProperty(condition, "v", path, checkSettingValue, true);
}
function checkSegmentCondition(condition, path) {
    ensureObject(condition, path);
    checkObjectProperty(condition, "s", path, ensureInteger, true);
    checkObjectProperty(condition, "c", path, ensureInteger, true);
}
function checkPercentageOptions(percentageOptions, path) {
    ensureArray(percentageOptions, path);
    for (var i = 0; i < percentageOptions.length; i++) {
        checkArrayElement(percentageOptions, i, path, checkPercentageOption);
    }
}
function checkPercentageOption(percentageOption, path) {
    ensureObject(percentageOption, path);
    checkObjectProperty(percentageOption, "p", path, ensureInteger, true);
    checkServedValue(percentageOption, path);
}
function checkServedValue(servedValue, path) {
    ensureObject(servedValue, path);
    checkObjectProperty(servedValue, "v", path, checkSettingValue, true);
    checkObjectProperty(servedValue, "i", path, ensureString);
}
function checkSettingValue(settingValue, path) {
    ensureObject(settingValue, path);
    checkObjectProperty(settingValue, "b", path, ensureBoolean);
    checkObjectProperty(settingValue, "s", path, ensureString);
    checkObjectProperty(settingValue, "i", path, ensureInteger);
    checkObjectProperty(settingValue, "d", path, ensureNumber);
}
function checkArrayElement(obj, index, path, callback) {
    var item = obj[index];
    path.push("[".concat(index, "]"));
    if (item == null) {
        throwConfigJsonMissingRequiredValue(path);
    }
    callback(item, path);
    path.pop();
}
function checkObjectProperty(obj, property, path, callback, isRequired) {
    var propertyValue = obj[property];
    path.push(".".concat(property));
    if (propertyValue == null) {
        if (isRequired) {
            throwConfigJsonMissingRequiredValue(path);
        }
    }
    else {
        callback(propertyValue, path);
    }
    path.pop();
}
function ensureArray(value, path) {
    isArray(value) || throwConfigJsonTypeMismatchError(path);
}
function ensureObject(value, path) {
    isObject(value) || throwConfigJsonTypeMismatchError(path);
    setPrototypeOf(value, objectMapPrototype);
}
function ensureBoolean(value, path) {
    isBoolean(value) || throwConfigJsonTypeMismatchError(path);
}
function ensureString(value, path) {
    isString(value) || throwConfigJsonTypeMismatchError(path);
}
function ensureInteger(value, path) {
    isInteger(value) || throwConfigJsonTypeMismatchError(path);
}
function ensureNumber(value, path) {
    isNumber(value) || throwConfigJsonTypeMismatchError(path);
}
function throwConfigJsonMissingRequiredValue(path) {
    throw TypeError("Invalid config JSON content. Missing required value at ".concat(path.join("")));
}
function throwConfigJsonTypeMismatchError(path) {
    throw TypeError("Invalid config JSON content. Type mismatch at ".concat(path.join("")));
}
function nameOfSettingType(value) {
    return SettingType[value];
}
function getSettingType(setting) {
    var settingType = setting.t;
    if (isIntegerInRange(settingType, 0, 3)
        || settingType === -1 && isSettingWithSimpleValue(setting)) {
        return settingType;
    }
    throwInvalidConfigModelError("Setting type is invalid.");
}
function inferSettingType(value) {
    switch (typeof value) {
        case "boolean": return 0;
        case "string": return 1;
        case "number": return 3;
    }
}
function isCompatibleValue(value, settingType) {
    switch (settingType) {
        case 0: return isBoolean(value);
        case 1: return isString(value);
        case 2:
        case 3: return isNumber(value);
        default: return false;
    }
}
function isAllowedValue(value) {
    return inferSettingType(value) !== void 0;
}
function isSettingWithSimpleValue(setting) {
    var _a, _b;
    return !((_a = setting.r) === null || _a === void 0 ? void 0 : _a.length) && !((_b = setting.p) === null || _b === void 0 ? void 0 : _b.length);
}
function hasPercentageOptions(targetingRule, ignoreIfInvalid) {
    var simpleValue = targetingRule.s;
    var percentageOptions = targetingRule.p;
    if (simpleValue != null) {
        if (percentageOptions == null) {
            return false;
        }
    }
    else if (percentageOptions === null || percentageOptions === void 0 ? void 0 : percentageOptions.length) {
        return true;
    }
    if (!ignoreIfInvalid) {
        throwInvalidConfigModelError("Targeting rule THEN part is missing or invalid.");
    }
}
function getConditionType(container) {
    var type, condition;
    condition = container.u;
    if (condition != null) {
        type = "u";
    }
    condition = container.p;
    if (condition != null) {
        type = !type ? "p" : false;
    }
    condition = container.s;
    if (condition != null) {
        type = !type ? "s" : false;
    }
    if (!type) {
        throwInvalidConfigModelError("Condition is missing or invalid.");
    }
    return type;
}
function unwrapValue(settingValue, settingType, ignoreIfInvalid) {
    switch (settingType) {
        case 0: {
            var value = settingValue.b;
            if (value != null)
                return value;
            break;
        }
        case 1: {
            var value = settingValue.s;
            if (value != null)
                return value;
            break;
        }
        case 2: {
            var value = settingValue.i;
            if (value != null)
                return value;
            break;
        }
        case 3: {
            var value = settingValue.d;
            if (value != null)
                return value;
            break;
        }
        case -1:
            if (isAllowedValue(settingValue)) {
                return settingValue;
            }
        default:
            if (!ignoreIfInvalid) {
                throwInvalidConfigModelError(settingValue === null ? "Setting value is null."
                    : settingValue === void 0 ? "Setting value is undefined."
                        : "Setting value '".concat(toStringSafe(settingValue), "' is of an unsupported type (").concat(typeof settingValue, ")."));
            }
            return;
    }
    if (!ignoreIfInvalid) {
        throwInvalidConfigModelError("Setting value is missing or invalid.");
    }
}
function throwInvalidConfigModelError(message) {
    throw new InvalidConfigModelError(message);
}
var InvalidConfigModelError = (function (_super) {
    __extends(InvalidConfigModelError, _super);
    function InvalidConfigModelError(message) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.name = InvalidConfigModelError.name;
        ensurePrototype(_this, InvalidConfigModelError);
        return _this;
    }
    return InvalidConfigModelError;
}(Error));


;// ./src/ConfigCatCache.ts



var InMemoryConfigCache = (function () {
    function InMemoryConfigCache() {
        this.cachedConfig = ProjectConfig.empty;
    }
    InMemoryConfigCache.prototype.set = function (_key, config) {
        this.cachedConfig = config;
    };
    InMemoryConfigCache.prototype.get = function (_key) {
        return this.cachedConfig;
    };
    InMemoryConfigCache.prototype.getInMemory = function () {
        return this.cachedConfig;
    };
    return InMemoryConfigCache;
}());

var ExternalConfigCache = (function () {
    function ExternalConfigCache(cache, logger) {
        this.cache = cache;
        this.logger = logger;
        this.cachedConfig = ProjectConfig.empty;
        this.cachedSerializedConfig = void 0;
    }
    ExternalConfigCache.prototype.set = function (key, config) {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!config.isEmpty) {
                            this.cachedSerializedConfig = ProjectConfig.serialize(config);
                            this.cachedConfig = config;
                        }
                        else {
                            this.cachedSerializedConfig = void 0;
                            this.cachedConfig = config;
                            return [2];
                        }
                        return [4, this.cache.set(key, this.cachedSerializedConfig)];
                    case 1:
                        _a.sent();
                        return [3, 3];
                    case 2:
                        err_1 = _a.sent();
                        this.logger.configServiceCacheWriteError(err_1);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    ExternalConfigCache.prototype.updateCachedConfig = function (externalSerializedConfig) {
        if (externalSerializedConfig == null || externalSerializedConfig === this.cachedSerializedConfig) {
            return this.cachedConfig;
        }
        var externalConfig = ProjectConfig.deserialize(externalSerializedConfig);
        var hasChanged = !ProjectConfig.contentEquals(externalConfig, this.cachedConfig);
        this.cachedConfig = externalConfig;
        this.cachedSerializedConfig = externalSerializedConfig;
        return hasChanged ? [this.cachedConfig] : this.cachedConfig;
    };
    ExternalConfigCache.prototype.get = function (key) {
        var _this = this;
        var cacheSyncResult;
        try {
            var cacheGetResult = this.cache.get(key);
            if (isPromiseLike(cacheGetResult)) {
                return (function (cacheGetPromise) { return __awaiter(_this, void 0, void 0, function () {
                    var cacheSyncResult, _a, err_2;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 2, , 3]);
                                _a = this.updateCachedConfig;
                                return [4, cacheGetPromise];
                            case 1:
                                cacheSyncResult = _a.apply(this, [_b.sent()]);
                                return [3, 3];
                            case 2:
                                err_2 = _b.sent();
                                cacheSyncResult = this.cachedConfig;
                                this.logger.configServiceCacheReadError(err_2);
                                return [3, 3];
                            case 3: return [2, cacheSyncResult];
                        }
                    });
                }); })(cacheGetResult);
            }
            cacheSyncResult = this.updateCachedConfig(cacheGetResult);
        }
        catch (err) {
            cacheSyncResult = this.cachedConfig;
            this.logger.configServiceCacheReadError(err);
        }
        return cacheSyncResult;
    };
    ExternalConfigCache.prototype.getInMemory = function () {
        return this.cachedConfig;
    };
    return ExternalConfigCache;
}());


;// ./src/ConfigServiceBase.ts






var RefreshErrorCode;
(function (RefreshErrorCode) {
    RefreshErrorCode[RefreshErrorCode["UnexpectedError"] = -1] = "UnexpectedError";
    RefreshErrorCode[RefreshErrorCode["None"] = 0] = "None";
    RefreshErrorCode[RefreshErrorCode["LocalOnlyClient"] = 1] = "LocalOnlyClient";
    RefreshErrorCode[RefreshErrorCode["OfflineClient"] = 3200] = "OfflineClient";
    RefreshErrorCode[RefreshErrorCode["InvalidSdkKey"] = 1100] = "InvalidSdkKey";
    RefreshErrorCode[RefreshErrorCode["UnexpectedHttpResponse"] = 1101] = "UnexpectedHttpResponse";
    RefreshErrorCode[RefreshErrorCode["HttpRequestTimeout"] = 1102] = "HttpRequestTimeout";
    RefreshErrorCode[RefreshErrorCode["HttpRequestFailure"] = 1103] = "HttpRequestFailure";
    RefreshErrorCode[RefreshErrorCode["InvalidHttpResponseContent"] = 1105] = "InvalidHttpResponseContent";
    RefreshErrorCode[RefreshErrorCode["InvalidHttpResponseWhenLocalCacheIsEmpty"] = 1106] = "InvalidHttpResponseWhenLocalCacheIsEmpty";
})(RefreshErrorCode || (RefreshErrorCode = {}));
function refreshResultFromSuccess() {
    return { isSuccess: true, errorCode: 0 };
}
function refreshResultFromFailure(errorCode, errorMessage, errorException) {
    var _a;
    return _a = {
            isSuccess: false,
            errorCode: errorCode
        },
        _a["_errorMessage"] = errorMessage,
        Object.defineProperty(_a, "errorMessage", {
            get: function () { var _a; return (_a = this._errorMessage) === null || _a === void 0 ? void 0 : _a.toString(); },
            enumerable: false,
            configurable: true
        }),
        _a.errorException = errorException,
        _a;
}
function refreshResultFromFetchResult(fetchResult) {
    return fetchResult.status !== 2
        ? refreshResultFromSuccess()
        : refreshResultFromFailure(fetchResult.errorCode, fetchResult.errorMessage, fetchResult.errorException);
}
var ClientCacheState;
(function (ClientCacheState) {
    ClientCacheState[ClientCacheState["NoFlagData"] = 0] = "NoFlagData";
    ClientCacheState[ClientCacheState["HasLocalOverrideFlagDataOnly"] = 1] = "HasLocalOverrideFlagDataOnly";
    ClientCacheState[ClientCacheState["HasCachedFlagDataOnly"] = 2] = "HasCachedFlagDataOnly";
    ClientCacheState[ClientCacheState["HasUpToDateFlagData"] = 3] = "HasUpToDateFlagData";
})(ClientCacheState || (ClientCacheState = {}));
var ConfigServiceStatus;
(function (ConfigServiceStatus) {
    ConfigServiceStatus[ConfigServiceStatus["Online"] = 0] = "Online";
    ConfigServiceStatus[ConfigServiceStatus["Offline"] = 1] = "Offline";
    ConfigServiceStatus[ConfigServiceStatus["Disposed"] = 2] = "Disposed";
})(ConfigServiceStatus || (ConfigServiceStatus = {}));
function nameOfConfigServiceStatus(value) {
    return ConfigServiceStatus[value];
}
var ConfigServiceBase = (function () {
    function ConfigServiceBase(options) {
        this.options = options;
        this.pendingCacheSyncUp = null;
        this.pendingConfigRefresh = null;
        this.cacheKey = options.getCacheKey();
        this.configFetcher = options.configFetcher;
        this.ownsConfigFetcher = options.ownsConfigFetcher;
        this.requestHeaders = getRequestHeaders(options.clientVersion);
        this.status = options.offline ? 1 : 0;
    }
    ConfigServiceBase.prototype.prepareClientForEvents = function () {
        var _a;
        var client = (_a = this.options.hooks.unwrap()) === null || _a === void 0 ? void 0 : _a.configCatClient;
        var initConfigService = client === null || client === void 0 ? void 0 : client["initConfigService"];
        if (isFunction(initConfigService)) {
            initConfigService.call(client, this);
        }
    };
    ConfigServiceBase.prototype.dispose = function () {
        var _a, _b;
        logMethodDebug(this.options.logger, "ConfigServiceBase.dispose");
        if (this.status !== 2) {
            this.status = 2;
            if (this.ownsConfigFetcher) {
                (_b = (_a = this.configFetcher).dispose) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
        }
    };
    Object.defineProperty(ConfigServiceBase.prototype, "disposed", {
        get: function () {
            return this.status === 2;
        },
        enumerable: false,
        configurable: true
    });
    ConfigServiceBase.prototype.refreshConfigAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var latestConfig, _a, fetchResult, config, errorMessage;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.syncUpWithCache()];
                    case 1:
                        latestConfig = _b.sent();
                        if (!!this.isOffline) return [3, 3];
                        return [4, this.refreshConfigCoreAsync(latestConfig, true)];
                    case 2:
                        _a = _b.sent(), fetchResult = _a[0], config = _a[1];
                        return [2, [refreshResultFromFetchResult(fetchResult), config]];
                    case 3:
                        if (this.options.cache instanceof ExternalConfigCache) {
                            return [2, [refreshResultFromSuccess(), latestConfig]];
                        }
                        else {
                            errorMessage = this.options.logger.configServiceCannotInitiateHttpCalls();
                            return [2, [refreshResultFromFailure(3200, toMessage(errorMessage)), latestConfig]];
                        }
                        // removed by dead control flow

                    case 4: return [2];
                }
            });
        });
    };
    ConfigServiceBase.prototype.refreshConfigCoreAsync = function (latestConfig, isInitiatedByUser) {
        return __awaiter(this, void 0, void 0, function () {
            var fetchResult, err;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.beginConfigRefreshOrJoinPending(latestConfig, isInitiatedByUser)];
                    case 1:
                        _a = _b.sent(), fetchResult = _a[0], latestConfig = _a[1], err = _a[2];
                        if (fetchResult) {
                            return [2, [fetchResult, latestConfig]];
                        }
                        else {
                            throw err;
                        }
                        // removed by dead control flow

                }
            });
        });
    };
    ConfigServiceBase.prototype.beginConfigRefreshOrJoinPending = function (latestConfig, isInitiatedByUser) {
        var _this = this;
        if (this.pendingConfigRefresh) {
            return this.pendingConfigRefresh;
        }
        var configRefreshPromise = (function (latestConfig) { return __awaiter(_this, void 0, void 0, function () {
            var fetchResult, shouldUpdateCache, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4, this.fetchAsync(latestConfig)];
                    case 1:
                        fetchResult = _a.sent();
                        shouldUpdateCache = fetchResult.status === 0
                            || fetchResult.status === 1
                            || fetchResult.config.timestamp > latestConfig.timestamp
                                && (!fetchResult.config.isEmpty || this.options.cache.getInMemory().isEmpty);
                        if (!shouldUpdateCache) return [3, 3];
                        return [4, this.options.cache.set(this.cacheKey, fetchResult.config)];
                    case 2:
                        _a.sent();
                        latestConfig = fetchResult.config;
                        _a.label = 3;
                    case 3:
                        this.onConfigFetched(fetchResult, isInitiatedByUser);
                        if (fetchResult.status === 0) {
                            this.onConfigChanged(fetchResult.config);
                        }
                        return [2, [fetchResult, latestConfig]];
                    case 4:
                        err_1 = _a.sent();
                        return [2, [, latestConfig, err_1]];
                    case 5: return [2];
                }
            });
        }); })(latestConfig);
        this.pendingConfigRefresh = configRefreshPromise;
        try {
            configRefreshPromise.finally(function () { return _this.pendingConfigRefresh = null; });
        }
        catch (err) {
            this.pendingConfigRefresh = null;
            throw err;
        }
        return configRefreshPromise;
    };
    ConfigServiceBase.prototype.onConfigFetched = function (fetchResult, isInitiatedByUser) {
        this.options.logger.debug("config fetched");
        this.options.hooks.emit("configFetched", refreshResultFromFetchResult(fetchResult), isInitiatedByUser);
    };
    ConfigServiceBase.prototype.onConfigChanged = function (newConfig) {
        var _a;
        this.options.logger.debug("config changed");
        this.options.hooks.emit("configChanged", (_a = newConfig.config) !== null && _a !== void 0 ? _a : prepareConfig({}));
    };
    ConfigServiceBase.prototype.fetchAsync = function (lastConfig) {
        return __awaiter(this, void 0, void 0, function () {
            var options, methodName, debugLogger, errorMessage, _a, response, config, error, err_2, errorCode, fetchError;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        options = this.options;
                        methodName = "ConfigServiceBase.fetchAsync";
                        debugLogger = this.options.logger.ifDebug;
                        logMethodDebug(debugLogger, methodName);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4, this.fetchRequestAsync(lastConfig.httpETag)];
                    case 2:
                        _a = _b.sent(), response = _a[0], config = _a[1], error = _a[2];
                        switch (response.statusCode) {
                            case 200:
                                if (!config) {
                                    errorMessage = options.logger.fetchReceived200WithInvalidBody(response["rayId"], error);
                                    logMethodDebug(debugLogger, methodName, "".concat(response.statusCode, " ").concat(response.reasonPhrase, " was received but the HTTP response content was invalid. Returning null."));
                                    return [2, fetchResultFromError(lastConfig, 1105, toMessage(errorMessage), error)];
                                }
                                logMethodDebug(debugLogger, methodName, "fetch was successful. Returning new config.");
                                return [2, fetchResultFromSuccess(new ProjectConfig(response.body, config, ProjectConfig.generateTimestamp(), response.eTag))];
                            case 304:
                                if (lastConfig.isEmpty) {
                                    errorMessage = options.logger.fetchReceived304WhenLocalCacheIsEmpty(response.statusCode, response.reasonPhrase, response["rayId"]);
                                    logMethodDebug(debugLogger, methodName, "".concat(response.statusCode, " ").concat(response.reasonPhrase, " was received when no config is cached locally. Returning null."));
                                    return [2, fetchResultFromError(lastConfig, 1106, toMessage(errorMessage))];
                                }
                                logMethodDebug(debugLogger, methodName, "content was not modified. Returning last config with updated timestamp.");
                                return [2, fetchResultFromNotModified(lastConfig.with(ProjectConfig.generateTimestamp()))];
                            case 403:
                            case 404:
                                errorMessage = options.logger.fetchFailedDueToInvalidSdkKey(options.sdkKey, response["rayId"]);
                                logMethodDebug(debugLogger, methodName, "fetch was unsuccessful. Returning last config (if any) with updated timestamp.");
                                return [2, fetchResultFromError(lastConfig.with(ProjectConfig.generateTimestamp()), 1100, toMessage(errorMessage))];
                            default:
                                errorMessage = options.logger.fetchFailedDueToUnexpectedHttpResponse(response.statusCode, response.reasonPhrase, response["rayId"]);
                                logMethodDebug(debugLogger, methodName, "fetch was unsuccessful. Returning last config.");
                                return [2, fetchResultFromError(lastConfig, 1101, toMessage(errorMessage))];
                        }
                        return [3, 4];
                    case 3:
                        err_2 = _b.sent();
                        errorCode = void 0;
                        fetchError = err_2 instanceof FetchError ? err_2 : void 0;
                        switch (fetchError === null || fetchError === void 0 ? void 0 : fetchError.cause) {
                            case "abort":
                                logMethodDebug(debugLogger, methodName, "fetch was aborted. Propagating error.");
                                throw err_2;
                            case "timeout":
                                errorMessage = options.logger.fetchFailedDueToRequestTimeout(fetchError.args[0], err_2, fetchError["rayId"]);
                                errorCode = 1102;
                                break;
                            default:
                                errorMessage = options.logger.fetchFailedDueToUnexpectedError(err_2, fetchError === null || fetchError === void 0 ? void 0 : fetchError["rayId"]);
                                errorCode = 1103;
                                break;
                        }
                        logMethodDebug(debugLogger, methodName, "fetch was unsuccessful. Returning last config.");
                        return [2, fetchResultFromError(lastConfig, errorCode, toMessage(errorMessage), err_2)];
                    case 4: return [2];
                }
            });
        });
    };
    ConfigServiceBase.prototype.fetchRequestAsync = function (lastETag_1) {
        return __awaiter(this, arguments, void 0, function (lastETag, maxRetryCount) {
            var options, methodName, debugLogger, retryNumber, request, response, config, preferences, baseUrl, redirect;
            if (maxRetryCount === void 0) { maxRetryCount = 2; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = this.options;
                        methodName = "ConfigServiceBase.fetchRequestAsync";
                        debugLogger = this.options.logger.ifDebug;
                        logMethodDebug(debugLogger, methodName);
                        retryNumber = 0;
                        _a.label = 1;
                    case 1:
                        logMethodDebug(debugLogger, methodName, retryNumber > 0
                            ? "calling fetchLogic(), retry ".concat(retryNumber, "/").concat(maxRetryCount, ".")
                            : "calling fetchLogic().");
                        request = new FetchRequest(options.getUrl(), lastETag, this.requestHeaders, options.requestTimeoutMs);
                        return [4, (this.configFetcher[fetchInternalAsyncMethodName]
                                ? this.configFetcher[fetchInternalAsyncMethodName](request, this.options.logger)
                                : this.configFetcher.fetchAsync(request))];
                    case 2:
                        response = _a.sent();
                        if (response.statusCode !== 200) {
                            return [2, [response]];
                        }
                        if (!response.body) {
                            logMethodDebug(debugLogger, methodName, "no response body.");
                            return [2, [response, void 0, Error("No response body.")]];
                        }
                        config = void 0;
                        try {
                            config = deserializeConfig(response.body);
                        }
                        catch (err) {
                            logMethodDebug(debugLogger, methodName, "invalid response body.");
                            return [2, [response, void 0, err]];
                        }
                        preferences = config.p;
                        if (!preferences) {
                            logMethodDebug(debugLogger, methodName, "preferences are missing or invalid.");
                            return [2, [response, config]];
                        }
                        baseUrl = preferences.u;
                        if (baseUrl == null || baseUrl === options.baseUrl) {
                            logMethodDebug(debugLogger, methodName, "baseUrl OK.");
                            return [2, [response, config]];
                        }
                        redirect = preferences.r;
                        if (options.baseUrlOverriden && redirect !== 2) {
                            logMethodDebug(debugLogger, methodName, "options.baseUrlOverriden && redirect !== RedirectMode.Force.");
                            return [2, [response, config]];
                        }
                        options.baseUrl = baseUrl;
                        if (redirect === 0) {
                            return [2, [response, config]];
                        }
                        if (redirect === 1) {
                            options.logger.dataGovernanceIsOutOfSync();
                        }
                        if (retryNumber >= maxRetryCount) {
                            options.logger.fetchFailedDueToRedirectLoop(response["rayId"]);
                            return [2, [response, config]];
                        }
                        _a.label = 3;
                    case 3:
                        retryNumber++;
                        return [3, 1];
                    case 4: return [2];
                }
            });
        });
    };
    Object.defineProperty(ConfigServiceBase.prototype, "isOffline", {
        get: function () {
            return this.status !== 0;
        },
        enumerable: false,
        configurable: true
    });
    ConfigServiceBase.prototype.goOnline = function () { };
    ConfigServiceBase.prototype.setOnline = function () {
        if (this.status === 1) {
            this.goOnline();
            this.status = 0;
            this.options.logger.configServiceStatusChanged(nameOfConfigServiceStatus(this.status));
        }
        else if (this.disposed) {
            this.options.logger.configServiceMethodHasNoEffectDueToDisposedClient("setOnline");
        }
    };
    ConfigServiceBase.prototype.setOffline = function () {
        if (this.status === 0) {
            this.status = 1;
            this.options.logger.configServiceStatusChanged(nameOfConfigServiceStatus(this.status));
        }
        else if (this.disposed) {
            this.options.logger.configServiceMethodHasNoEffectDueToDisposedClient("setOffline");
        }
    };
    ConfigServiceBase.prototype.syncUpWithCache = function () {
        var _this = this;
        var cache = this.options.cache;
        if (cache instanceof InMemoryConfigCache) {
            return cache.get(this.cacheKey);
        }
        var cacheSyncUpPromise = this.pendingCacheSyncUp;
        if (!cacheSyncUpPromise) {
            var syncResult = cache.get(this.cacheKey);
            if (!isPromiseLike(syncResult)) {
                return this.onCacheSynced(syncResult);
            }
            cacheSyncUpPromise = syncResult
                .then(function (syncResult) { return [_this.onCacheSynced(syncResult)]; })
                .catch(function (err) {
                return [, err];
            });
            this.pendingCacheSyncUp = cacheSyncUpPromise;
            try {
                cacheSyncUpPromise.finally(function () { return _this.pendingCacheSyncUp = null; });
            }
            catch (err) {
                this.pendingCacheSyncUp = null;
                throw err;
            }
        }
        return cacheSyncUpPromise.then(function (_a) {
            var projectConfig = _a[0], err = _a[1];
            if (projectConfig) {
                return projectConfig;
            }
            else {
                throw err;
            }
        });
    };
    ConfigServiceBase.prototype.onCacheSynced = function (syncResult) {
        if (!isArray(syncResult)) {
            return syncResult;
        }
        var newConfig = syncResult[0];
        if (!newConfig.isEmpty) {
            this.onConfigChanged(newConfig);
        }
        return newConfig;
    };
    ConfigServiceBase.prototype.waitForReadyAsync = function (initialCacheSyncUp) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.getCacheState;
                        return [4, initialCacheSyncUp];
                    case 1: return [2, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    ConfigServiceBase.prototype.getReadyPromise = function (initialCacheSyncUp) {
        var _this = this;
        return this.waitForReadyAsync(initialCacheSyncUp).then(function (cacheState) {
            _this.options.hooks.emit("clientReady", cacheState);
            return cacheState;
        });
    };
    return ConfigServiceBase;
}());


;// ./src/AutoPollConfigService.ts





var POLL_EXPIRATION_TOLERANCE_MS = 500;
var AutoPollConfigService = (function (_super) {
    __extends(AutoPollConfigService, _super);
    function AutoPollConfigService(options) {
        var _this = _super.call(this, options) || this;
        _this.signalInitialization = function () { };
        _this.stopToken = new AbortToken();
        _this.pollIntervalMs = options.pollIntervalSeconds * 1000;
        _this.pollExpirationMs = _this.pollIntervalMs - POLL_EXPIRATION_TOLERANCE_MS;
        _this.prepareClientForEvents();
        var initialCacheSyncUp = _this.syncUpWithCache();
        if (options.maxInitWaitTimeSeconds !== 0) {
            _this.initialized = false;
            var initSignalPromise = new Promise(function (resolve) { return _this.signalInitialization = resolve; });
            _this.initializationPromise = _this.waitForInitializationAsync(initSignalPromise).then(function (success) {
                _this.initialized = true;
                return success;
            });
        }
        else {
            _this.initialized = true;
            _this.initializationPromise = Promise.resolve(false);
        }
        _this.readyPromise = _this.getReadyPromise(initialCacheSyncUp);
        _this.startRefreshWorker(initialCacheSyncUp, _this.stopToken);
        return _this;
    }
    AutoPollConfigService.prototype.waitForInitializationAsync = function (initSignalPromise) {
        return __awaiter(this, void 0, void 0, function () {
            var abortToken, success;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.options.maxInitWaitTimeSeconds < 0)) return [3, 2];
                        return [4, initSignalPromise];
                    case 1:
                        _a.sent();
                        return [2, true];
                    case 2:
                        abortToken = new AbortToken();
                        return [4, Promise.race([
                                initSignalPromise.then(function () { return true; }),
                                delay(this.options.maxInitWaitTimeSeconds * 1000, abortToken).then(function () { return false; }),
                            ])];
                    case 3:
                        success = _a.sent();
                        abortToken.abort();
                        return [2, success];
                }
            });
        });
    };
    AutoPollConfigService.prototype.waitForReadyAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.initializationPromise];
                    case 1:
                        _a.sent();
                        return [2, this.getCacheState(this.options.cache.getInMemory())];
                }
            });
        });
    };
    AutoPollConfigService.prototype.getConfigAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var methodName, debugLogger, cachedConfig;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        methodName = "AutoPollConfigService.getConfigAsync";
                        debugLogger = this.options.logger.ifDebug;
                        logMethodDebug(debugLogger, methodName);
                        return [4, this.syncUpWithCache()];
                    case 1:
                        cachedConfig = _a.sent();
                        if (!!cachedConfig.isExpired(this.pollIntervalMs)) return [3, 2];
                        this.signalInitialization();
                        return [3, 5];
                    case 2:
                        if (!(!this.isOffline && !this.initialized)) return [3, 4];
                        logMethodDebug(debugLogger, methodName, "cache is empty or expired, waiting for initialization.");
                        return [4, this.initializationPromise];
                    case 3:
                        _a.sent();
                        cachedConfig = this.options.cache.getInMemory();
                        return [3, 5];
                    case 4:
                        logMethodDebug(debugLogger, methodName, "cache is empty or expired.");
                        return [2, cachedConfig];
                    case 5:
                        logMethodDebug(debugLogger, methodName, "returning value from cache.");
                        return [2, cachedConfig];
                }
            });
        });
    };
    AutoPollConfigService.prototype.refreshConfigAsync = function () {
        logMethodDebug(this.options.logger, "AutoPollConfigService.refreshConfigAsync");
        return _super.prototype.refreshConfigAsync.call(this);
    };
    AutoPollConfigService.prototype.dispose = function () {
        logMethodDebug(this.options.logger, "AutoPollConfigService.dispose");
        _super.prototype.dispose.call(this);
        if (!this.stopToken.aborted) {
            this.stopRefreshWorker();
        }
    };
    AutoPollConfigService.prototype.onConfigFetched = function (fetchResult, isInitiatedByUser) {
        this.signalInitialization();
        _super.prototype.onConfigFetched.call(this, fetchResult, isInitiatedByUser);
    };
    AutoPollConfigService.prototype.goOnline = function () {
        this.stopRefreshWorker();
        this.stopToken = new AbortToken();
        this.startRefreshWorker(null, this.stopToken);
    };
    AutoPollConfigService.prototype.startRefreshWorker = function (initialCacheSyncUp, stopToken) {
        return __awaiter(this, void 0, void 0, function () {
            var scheduledNextTimeMs, err_1, timeToWaitMs, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "AutoPollConfigService.startRefreshWorker");
                        _a.label = 1;
                    case 1:
                        if (!!stopToken.aborted) return [3, 12];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 9, 10, 11]);
                        scheduledNextTimeMs = getMonotonicTimeMs() + this.pollIntervalMs;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4, this.refreshWorkerLogic(initialCacheSyncUp)];
                    case 4:
                        _a.sent();
                        return [3, 6];
                    case 5:
                        err_1 = _a.sent();
                        if (err_1 instanceof FetchError && err_1.cause === "abort") {
                            return [3, 1];
                        }
                        this.options.logger.autoPollConfigServiceErrorDuringPolling(err_1);
                        return [3, 6];
                    case 6:
                        timeToWaitMs = scheduledNextTimeMs - getMonotonicTimeMs();
                        if (!(timeToWaitMs > 0)) return [3, 8];
                        return [4, delay(timeToWaitMs, stopToken)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3, 11];
                    case 9:
                        err_2 = _a.sent();
                        this.options.logger.autoPollConfigServiceErrorDuringPolling(err_2);
                        return [3, 11];
                    case 10:
                        initialCacheSyncUp = null;
                        return [7];
                    case 11: return [3, 1];
                    case 12: return [2];
                }
            });
        });
    };
    AutoPollConfigService.prototype.stopRefreshWorker = function () {
        logMethodDebug(this.options.logger, "AutoPollConfigService.stopRefreshWorker");
        this.stopToken.abort();
    };
    AutoPollConfigService.prototype.refreshWorkerLogic = function (initialCacheSyncUp) {
        return __awaiter(this, void 0, void 0, function () {
            var latestConfig;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "AutoPollConfigService.refreshWorkerLogic");
                        return [4, (initialCacheSyncUp !== null && initialCacheSyncUp !== void 0 ? initialCacheSyncUp : this.syncUpWithCache())];
                    case 1:
                        latestConfig = _a.sent();
                        if (!latestConfig.isExpired(this.pollExpirationMs)) return [3, 3];
                        if (!!this.isOffline) return [3, 3];
                        return [4, this.refreshConfigCoreAsync(latestConfig, false)];
                    case 2:
                        _a.sent();
                        return [2];
                    case 3:
                        this.signalInitialization();
                        return [2];
                }
            });
        });
    };
    AutoPollConfigService.prototype.getCacheState = function (cachedConfig) {
        if (cachedConfig.isEmpty) {
            return 0;
        }
        if (cachedConfig.isExpired(this.pollIntervalMs)) {
            return 2;
        }
        return 3;
    };
    return AutoPollConfigService;
}(ConfigServiceBase));


;// ./src/EventEmitter.ts
var NullEventEmitter = (function () {
    function NullEventEmitter() {
    }
    NullEventEmitter.prototype.on = function () { return this; };
    NullEventEmitter.prototype.once = function () { return this; };
    NullEventEmitter.prototype.removeListener = function () { return this; };
    NullEventEmitter.prototype.removeAllListeners = function () { return this; };
    NullEventEmitter.prototype.listeners = function () { return []; };
    NullEventEmitter.prototype.listenerCount = function () { return 0; };
    NullEventEmitter.prototype.eventNames = function () { return []; };
    NullEventEmitter.prototype.emit = function () { return false; };
    return NullEventEmitter;
}());

var nullEventEmitterPrototype = NullEventEmitter.prototype;
nullEventEmitterPrototype.addListener = nullEventEmitterPrototype.on;
nullEventEmitterPrototype.off = nullEventEmitterPrototype.removeListener;

;// ./src/FlagOverrides.ts


var OverrideBehaviour;
(function (OverrideBehaviour) {
    OverrideBehaviour[OverrideBehaviour["LocalOnly"] = 0] = "LocalOnly";
    OverrideBehaviour[OverrideBehaviour["LocalOverRemote"] = 1] = "LocalOverRemote";
    OverrideBehaviour[OverrideBehaviour["RemoteOverLocal"] = 2] = "RemoteOverLocal";
})(OverrideBehaviour || (OverrideBehaviour = {}));
function nameOfOverrideBehaviour(value) {
    return OverrideBehaviour[value];
}
var MapOverrideDataSource = (function () {
    function MapOverrideDataSource(map, watchChanges) {
        this.initialSettings = getSettingsFromMap(map);
        this.map = watchChanges ? map : null;
    }
    MapOverrideDataSource.prototype.getOverrides = function () {
        return this.map
            ? getSettingsFromMap(this.map)
            : this.initialSettings;
    };
    return MapOverrideDataSource;
}());

function getSettingsFromMap(map) {
    var settings = {};
    for (var key in map) {
        if (Utils_hasOwnProperty(map, key)) {
            settings[key] = createSettingFromValue(map[key]);
        }
    }
    return settings;
}
var DEFAULT_PARAM_PREFIX = "cc-";
var FORCE_STRING_VALUE_SUFFIX = ";str";
var DefaultQueryStringProvider = (function () {
    function DefaultQueryStringProvider() {
    }
    Object.defineProperty(DefaultQueryStringProvider.prototype, "currentValue", {
        get: function () {
            if (typeof location === "undefined" || location === null)
                return;
            return location.search;
        },
        enumerable: false,
        configurable: true
    });
    return DefaultQueryStringProvider;
}());
var defaultQueryStringProvider;
var QueryParamsOverrideDataSource = (function () {
    function QueryParamsOverrideDataSource(watchChanges, paramPrefix, queryStringProvider) {
        this.watchChanges = !!watchChanges;
        this.paramPrefix = paramPrefix !== null && paramPrefix !== void 0 ? paramPrefix : DEFAULT_PARAM_PREFIX;
        queryStringProvider !== null && queryStringProvider !== void 0 ? queryStringProvider : (queryStringProvider = defaultQueryStringProvider !== null && defaultQueryStringProvider !== void 0 ? defaultQueryStringProvider : (defaultQueryStringProvider = new DefaultQueryStringProvider()));
        this.queryStringProvider = queryStringProvider;
        var currentQueryStringOrParams = queryStringProvider.currentValue;
        this.settings = getSettingsFromQueryString(currentQueryStringOrParams, this.paramPrefix);
        this.queryString = getQueryString(currentQueryStringOrParams);
    }
    QueryParamsOverrideDataSource.prototype.getOverrides = function () {
        if (this.watchChanges) {
            var currentQueryStringOrParams = this.queryStringProvider.currentValue;
            var currentQueryString = getQueryString(currentQueryStringOrParams);
            if (this.queryString !== currentQueryString) {
                this.settings = getSettingsFromQueryString(currentQueryStringOrParams, this.paramPrefix);
                this.queryString = currentQueryString;
            }
        }
        return this.settings;
    };
    return QueryParamsOverrideDataSource;
}());

function getQueryString(queryStringOrParams) {
    if (queryStringOrParams == null) {
        return "";
    }
    if (isString(queryStringOrParams)) {
        return queryStringOrParams;
    }
    var queryString = "", separator = "?";
    for (var key in queryStringOrParams) {
        if (!Utils_hasOwnProperty(queryStringOrParams, key))
            continue;
        var values = queryStringOrParams[key];
        var value = void 0, length_1 = void 0;
        if (!isArray(values))
            value = values, length_1 = 1;
        else if (values.length)
            value = values[0], length_1 = values.length;
        else
            continue;
        for (var i = 0;;) {
            queryString += separator + encodeURIComponent(key) + "=" + encodeURIComponent(value);
            if (++i >= length_1)
                break;
            separator = "&";
            value = values[i];
        }
    }
    return queryString;
}
function getSettingsFromQueryString(queryStringOrParams, paramPrefix) {
    var settings = {};
    if (isString(queryStringOrParams)) {
        extractSettingFromQueryString(queryStringOrParams, paramPrefix, settings);
    }
    else if (queryStringOrParams != null) {
        extractSettingsFromQueryParams(queryStringOrParams, paramPrefix, settings);
    }
    return settings;
}
function extractSettingsFromQueryParams(queryParams, paramPrefix, settings) {
    for (var key in queryParams) {
        if (!Utils_hasOwnProperty(queryParams, key))
            continue;
        var values = queryParams[key];
        var value = void 0, length_2 = void 0;
        if (!isArray(values))
            value = values, length_2 = 1;
        else if (values.length)
            value = values[0], length_2 = values.length;
        else
            continue;
        for (var i = 0;;) {
            extractSettingFromQueryParam(key, value, paramPrefix, settings);
            if (++i >= length_2)
                break;
            value = values[i];
        }
    }
}
function extractSettingFromQueryString(queryString, paramPrefix, settings) {
    if (!queryString
        || !startsWith(queryString, "?")) {
        return;
    }
    var parts = queryString.substring(1).split("&");
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        part = part.replace(/\+/g, " ");
        var index = part.indexOf("=");
        var key = decodeURIComponent(index >= 0 ? part.substring(0, index) : part);
        var value = index >= 0 ? decodeURIComponent(part.substring(index + 1)) : "";
        extractSettingFromQueryParam(key, value, paramPrefix, settings);
    }
}
function extractSettingFromQueryParam(key, value, paramPrefix, settings) {
    if (!key
        || key.length <= paramPrefix.length
        || !startsWith(key, paramPrefix)) {
        return;
    }
    key = key.substring(paramPrefix.length);
    var interpretValueAsString = key.length > FORCE_STRING_VALUE_SUFFIX.length
        && endsWith(key, FORCE_STRING_VALUE_SUFFIX);
    if (interpretValueAsString) {
        key = key.substring(0, key.length - FORCE_STRING_VALUE_SUFFIX.length);
    }
    else {
        value = parseSettingValue(value);
    }
    settings[key] = createSettingFromValue(value);
}
function parseSettingValue(value) {
    switch (value.toLowerCase()) {
        case "false":
            return false;
        case "true":
            return true;
        default:
            var number = parseFloatStrict(value);
            return !isNaN(number) ? number : value;
    }
}

;// ./src/Hash.ts

function sha1(msg) {
    function rotate_left(n, s) {
        var t4 = (n << s) | (n >>> (32 - s));
        return t4;
    }
    ;
    var blockstart;
    var i, j;
    var W = Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;
    msg = utf8Encode(msg);
    var msg_len = msg.length;
    var word_array = Array();
    for (i = 0; i < msg_len - 3; i += 4) {
        j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 |
            msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3);
        word_array.push(j);
    }
    switch (msg_len % 4) {
        case 0:
            i = 0x080000000;
            break;
        case 1:
            i = msg.charCodeAt(msg_len - 1) << 24 | 0x0800000;
            break;
        case 2:
            i = msg.charCodeAt(msg_len - 2) << 24 | msg.charCodeAt(msg_len - 1) << 16 | 0x08000;
            break;
        case 3:
            i = msg.charCodeAt(msg_len - 3) << 24 | msg.charCodeAt(msg_len - 2) << 16 | msg.charCodeAt(msg_len - 1) << 8 | 0x80;
            break;
    }
    word_array.push(i);
    while ((word_array.length % 16) != 14)
        word_array.push(0);
    word_array.push(msg_len >>> 29);
    word_array.push((msg_len << 3) & 0x0ffffffff);
    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
        for (i = 0; i < 16; i++)
            W[i] = word_array[blockstart + i];
        for (i = 16; i <= 79; i++)
            W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;
        for (i = 0; i <= 19; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }
        for (i = 20; i <= 39; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }
        for (i = 40; i <= 59; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }
        for (i = 60; i <= 79; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }
        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }
    return toHexString([H0, H1, H2, H3, H4]);
}
var sha256PrecomputedData = Object.create(null);
function sha256(msgUtf8) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    ;
    var lengthProperty = "length";
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var i, j;
    var precomputedData = sha256PrecomputedData;
    var hash = precomputedData.h;
    var k = precomputedData.k;
    if (!k) {
        hash = [];
        k = [];
        var isComposite = createMap();
        for (var candidate = 2, primeCounter = 0; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 313; i += candidate) {
                    isComposite[i] = candidate;
                }
                hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }
        precomputedData.h = hash = hash.slice(0, 8);
        precomputedData.k = k;
    }
    var asciiBitLength = msgUtf8[lengthProperty] * 8;
    msgUtf8 += '\x80';
    var words = [];
    while (msgUtf8[lengthProperty] % 64 - 56)
        msgUtf8 += '\x00';
    for (i = 0; i < msgUtf8[lengthProperty]; i++) {
        j = msgUtf8.charCodeAt(i);
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength);
    for (j = 0; j < words[lengthProperty];) {
        var w = words.slice(j, j += 16);
        var oldHash = hash;
        hash = hash.slice(0, 8);
        for (i = 0; i < 64; i++) {
            var w15 = w[i - 15], w2 = w[i - 2];
            var a = hash[0], e = hash[4];
            var temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                + ((e & hash[5]) ^ ((~e) & hash[6]))
                + k[i]
                + (w[i] = (i < 16) ? w[i] : (w[i - 16]
                    + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                    + w[i - 7]
                    + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
            var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }
    return toHexString(hash, 8);
}

;// ./src/Hooks.ts


var disconnectedEventEmitter = new NullEventEmitter();
var Hooks = (function () {
    function Hooks(eventEmitter) {
        var _this = this;
        this.eventEmitter = eventEmitter;
        var propertyDescriptor = Object.create(null);
        propertyDescriptor.get = function () { return _this.configCatClient; };
        propertyDescriptor.enumerable = true;
        Object.defineProperty(eventEmitter, "configCatClient", propertyDescriptor);
    }
    Hooks.prototype.tryDisconnect = function () {
        var originalEventEmitter = this.eventEmitter;
        this.eventEmitter = disconnectedEventEmitter;
        return originalEventEmitter !== disconnectedEventEmitter;
    };
    Hooks.prototype.on = function (eventName, listener) {
        this.eventEmitter.on(eventName, listener);
        return this;
    };
    Hooks.prototype.once = function (eventName, listener) {
        this.eventEmitter.once(eventName, listener);
        return this;
    };
    Hooks.prototype.removeListener = function (eventName, listener) {
        this.eventEmitter.removeListener(eventName, listener);
        return this;
    };
    Hooks.prototype.removeAllListeners = function (eventName) {
        this.eventEmitter.removeAllListeners(eventName);
        return this;
    };
    Hooks.prototype.listeners = function (eventName) {
        return this.eventEmitter.listeners(eventName);
    };
    Hooks.prototype.listenerCount = function (eventName) {
        return this.eventEmitter.listenerCount(eventName);
    };
    Hooks.prototype.eventNames = function () {
        return this.eventEmitter.eventNames();
    };
    Hooks.prototype.emit = function (eventName) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return (_a = this.eventEmitter).emit.apply(_a, __spreadArray([eventName], args, false));
    };
    return Hooks;
}());

var hooksPrototype = Hooks.prototype;
hooksPrototype.addListener = hooksPrototype.on;
hooksPrototype.off = hooksPrototype.removeListener;

;// ./src/LazyLoadConfigService.ts



var LazyLoadConfigService = (function (_super) {
    __extends(LazyLoadConfigService, _super);
    function LazyLoadConfigService(options) {
        var _this = _super.call(this, options) || this;
        _this.cacheTimeToLiveMs = options.cacheTimeToLiveSeconds * 1000;
        _this.prepareClientForEvents();
        var initialCacheSyncUp = _this.syncUpWithCache();
        _this.readyPromise = _this.getReadyPromise(initialCacheSyncUp);
        return _this;
    }
    LazyLoadConfigService.prototype.getConfigAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var methodName, debugLogger, cachedConfig;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        methodName = "LazyLoadConfigService.getConfigAsync";
                        debugLogger = this.options.logger.ifDebug;
                        logMethodDebug(debugLogger, methodName);
                        return [4, this.syncUpWithCache()];
                    case 1:
                        cachedConfig = _b.sent();
                        if (!cachedConfig.isExpired(this.cacheTimeToLiveMs)) return [3, 5];
                        if (!!this.isOffline) return [3, 3];
                        logMethodDebug(debugLogger, methodName, "cache is empty or expired, calling refreshConfigCoreAsync().");
                        return [4, this.refreshConfigCoreAsync(cachedConfig, false)];
                    case 2:
                        _a = _b.sent(), cachedConfig = _a[1];
                        return [3, 4];
                    case 3:
                        logMethodDebug(debugLogger, methodName, "cache is empty or expired.");
                        _b.label = 4;
                    case 4: return [2, cachedConfig];
                    case 5:
                        logMethodDebug(debugLogger, methodName, "cache is valid, returning from cache.");
                        return [2, cachedConfig];
                }
            });
        });
    };
    LazyLoadConfigService.prototype.refreshConfigAsync = function () {
        logMethodDebug(this.options.logger, "LazyLoadConfigService.refreshConfigAsync");
        return _super.prototype.refreshConfigAsync.call(this);
    };
    LazyLoadConfigService.prototype.getCacheState = function (cachedConfig) {
        if (cachedConfig.isEmpty) {
            return 0;
        }
        if (cachedConfig.isExpired(this.cacheTimeToLiveMs)) {
            return 2;
        }
        return 3;
    };
    return LazyLoadConfigService;
}(ConfigServiceBase));


;// ./src/ManualPollConfigService.ts



var ManualPollConfigService = (function (_super) {
    __extends(ManualPollConfigService, _super);
    function ManualPollConfigService(options) {
        var _this = _super.call(this, options) || this;
        _this.prepareClientForEvents();
        var initialCacheSyncUp = _this.syncUpWithCache();
        _this.readyPromise = _this.getReadyPromise(initialCacheSyncUp);
        return _this;
    }
    ManualPollConfigService.prototype.getCacheState = function (cachedConfig) {
        if (cachedConfig.isEmpty) {
            return 0;
        }
        return 2;
    };
    ManualPollConfigService.prototype.getConfigAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "ManualPollService.getConfigAsync");
                        return [4, this.syncUpWithCache()];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    ManualPollConfigService.prototype.refreshConfigAsync = function () {
        logMethodDebug(this.options.logger, "ManualPollService.refreshConfigAsync");
        return _super.prototype.refreshConfigAsync.call(this);
    };
    return ManualPollConfigService;
}(ConfigServiceBase));


;// ./src/ConfigCatClientOptions.ts












var PROXY_SDKKEY_PREFIX = "configcat-proxy/";
var PollingMode;
(function (PollingMode) {
    PollingMode[PollingMode["AutoPoll"] = 0] = "AutoPoll";
    PollingMode[PollingMode["LazyLoad"] = 1] = "LazyLoad";
    PollingMode[PollingMode["ManualPoll"] = 2] = "ManualPoll";
})(PollingMode || (PollingMode = {}));
var DataGovernance;
(function (DataGovernance) {
    DataGovernance[DataGovernance["Global"] = 0] = "Global";
    DataGovernance[DataGovernance["EuOnly"] = 1] = "EuOnly";
})(DataGovernance || (DataGovernance = {}));
function nameOfDataGovernance(value) {
    return DataGovernance[value];
}
var OptionsBase = (function () {
    function OptionsBase(sdkKey, kernel, clientVersion, options) {
        var _a, _b, _c, _d;
        this.requestTimeoutMs = 30000;
        this.dataGovernance = 0;
        this.flagOverrides = null;
        this.defaultUser = void 0;
        this.offline = false;
        this.sdkKey = sdkKey;
        this.clientVersion = clientVersion;
        var eventEmitter = (_b = (_a = kernel.eventEmitterFactory) === null || _a === void 0 ? void 0 : _a.call(kernel)) !== null && _b !== void 0 ? _b : new NullEventEmitter();
        var hooks = new Hooks(eventEmitter);
        this.hooks = {
            hooks: hooks,
            unwrap: function () { return this.hooks; },
            emit: function (eventName) {
                var _a, _b;
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return (_b = (_a = this.unwrap()) === null || _a === void 0 ? void 0 : _a.emit.apply(_a, __spreadArray([eventName], args, false))) !== null && _b !== void 0 ? _b : false;
            },
        };
        var logFilter;
        var logger;
        var cache;
        var configFetcher;
        var baseUrl;
        if (options) {
            var optionsArgName = "options";
            if (options.logFilter != null) {
                logFilter = ensureFunctionArg(options.logFilter, optionsArgName, ".logFilter");
            }
            if (options.logger != null) {
                var requiredProps = createMap();
                requiredProps.log = true;
                logger = ensureObjectArg(options.logger, optionsArgName, requiredProps, ".logger");
            }
            if (options.cache != null) {
                var requiredProps = createMap();
                requiredProps.get = requiredProps.set = true;
                cache = ensureObjectArg(options.cache, optionsArgName, requiredProps, ".cache");
            }
            if (options.configFetcher != null) {
                var requiredProps = createMap();
                requiredProps.fetchAsync = true;
                configFetcher = ensureObjectArg(options.configFetcher, optionsArgName, requiredProps, ".configFetcher");
            }
            if (options.requestTimeoutMs != null) {
                this.requestTimeoutMs = ensureNumberArgInRange(options.requestTimeoutMs, optionsArgName, "greater than 0", function (value) { return value > 0; }, ".requestTimeoutMs");
            }
            if (options.dataGovernance != null) {
                this.dataGovernance = ensureEnumArg(options.dataGovernance, optionsArgName, "DataGovernance", function (value) { return nameOfDataGovernance(value) !== void 0; }, ".dataGovernance");
            }
            if (options.baseUrl != null) {
                baseUrl = ensureStringArg(options.baseUrl, optionsArgName, true, ".baseUrl");
            }
            if (options.flagOverrides != null) {
                var requiredProps = createMap();
                requiredProps.behaviour = requiredProps.dataSource = false;
                var flagOverrides = ensureObjectArg(options.flagOverrides, optionsArgName, requiredProps, ".flagOverrides");
                ensureEnumArg(flagOverrides.behaviour, optionsArgName, "OverrideBehaviour", function (value) { return nameOfOverrideBehaviour(value) !== void 0; }, ".flagOverrides.behaviour");
                var dataSourceRequiredProps = createMap();
                dataSourceRequiredProps.getOverrides = true;
                ensureObjectArg(flagOverrides.dataSource, optionsArgName, dataSourceRequiredProps, ".flagOverrides.dataSource");
                this.flagOverrides = flagOverrides;
            }
            if (options.defaultUser != null) {
                this.defaultUser = ensureObjectArg(options.defaultUser, optionsArgName, void 0, ".defaultUser");
            }
            if (options.offline != null) {
                this.offline = ensureBooleanArg(options.offline, optionsArgName, ".offline");
            }
            if (options.setupHooks != null) {
                var setupHooks = ensureFunctionArg(options.setupHooks, optionsArgName, ".setupHooks");
                setupHooks(hooks);
            }
        }
        if ((this.baseUrlOverriden = baseUrl != null)) {
            var index = indexOfAny(baseUrl, "?#");
            this.baseUrl = index < 0 ? baseUrl : baseUrl.substring(0, index);
        }
        else {
            this.baseUrl = this.dataGovernance === 1
                ? "https://cdn-eu.configcat.com"
                : "https://cdn-global.configcat.com";
        }
        this.logger = new LoggerWrapper(logger !== null && logger !== void 0 ? logger : new ConfigCatConsoleLogger(), logFilter, this.hooks);
        this.cache = cache
            ? new ExternalConfigCache(cache, this.logger)
            : ((_d = (_c = kernel.defaultCacheFactory) === null || _c === void 0 ? void 0 : _c.call(kernel, this)) !== null && _d !== void 0 ? _d : new InMemoryConfigCache());
        this.configFetcher = configFetcher !== null && configFetcher !== void 0 ? configFetcher : kernel.configFetcherFactory(this);
        this.ownsConfigFetcher = !configFetcher;
    }
    OptionsBase.prototype.yieldHooks = function () {
        var _a;
        var hooksWrapper = this.hooks;
        var hooks = (_a = hooksWrapper.unwrap()) !== null && _a !== void 0 ? _a : new Hooks(new NullEventEmitter());
        hooksWrapper.hooks = createWeakRef(hooks);
        hooksWrapper.unwrap = function () { return this.hooks.deref(); };
        return hooks;
    };
    OptionsBase.prototype.getUrl = function () {
        var baseUrl = this.baseUrl;
        return baseUrl
            + (baseUrl.charCodeAt(baseUrl.length - 1) !== 0x2F ? "/" : "")
            + "configuration-files/" + this.sdkKey + "/" + OptionsBase.configFileName;
    };
    OptionsBase.prototype.getCacheKey = function () {
        return sha1("".concat(this.sdkKey, "_").concat(OptionsBase.configFileName, "_").concat(ProjectConfig.serializationFormatVersion));
    };
    OptionsBase.configFileName = "config_v6.json";
    return OptionsBase;
}());

var PROXY_PATH_SEGMENT = "/" + PROXY_SDKKEY_PREFIX;
var CDN_BASEURL_REGEXP = /^https?:\/\/(?:[a-z0-9-]+\.)+configcat\.com\.?(?:[:/]|$)/i;
function isCdnUrl(url) {
    if (!CDN_BASEURL_REGEXP.test(url)) {
        return false;
    }
    var index = indexOfAny(url, "?#");
    if (index >= 0)
        url = url.substring(0, index);
    index = url.indexOf("/", url.indexOf("://") + 3);
    if (index < 0)
        return true;
    if (url.indexOf("%", index + 1) < 0) {
        index = url.lastIndexOf(PROXY_PATH_SEGMENT, url.length - PROXY_PATH_SEGMENT.length);
        return index < 0;
    }
    else {
        var decodedPathSegments = url.substring(index + 1).split("/").map(function (item) { return decodeURIComponent(item); });
        return decodedPathSegments.indexOf(PROXY_PATH_SEGMENT.slice(1, PROXY_PATH_SEGMENT.length - 1)) < 0;
    }
}
var AutoPollOptions = (function (_super) {
    __extends(AutoPollOptions, _super);
    function AutoPollOptions(sdkKey, kernel, options) {
        var _this = _super.call(this, sdkKey, kernel, kernel.sdkType + "/a-" + kernel.sdkVersion, options) || this;
        _this.pollIntervalSeconds = 60;
        _this.maxInitWaitTimeSeconds = 5;
        if (options) {
            var optionsArgName = "options";
            var maxSetTimeoutIntervalSecs = 2147483;
            if (options.pollIntervalSeconds != null) {
                var minValue_1 = 1, maxValue_1 = maxSetTimeoutIntervalSecs;
                _this.pollIntervalSeconds = ensureNumberArgInRange(options.pollIntervalSeconds, optionsArgName, "between ".concat(minValue_1, " and ").concat(maxValue_1), function (value) { return isNumberInRange(value, minValue_1, maxValue_1); }, ".pollIntervalSeconds");
            }
            if (options.maxInitWaitTimeSeconds != null) {
                var maxValue_2 = maxSetTimeoutIntervalSecs;
                _this.maxInitWaitTimeSeconds = ensureNumberArgInRange(options.maxInitWaitTimeSeconds, optionsArgName, "less than or equal to ".concat(maxValue_2), function (value) { return value <= maxValue_2; }, ".maxInitWaitTimeSeconds");
            }
        }
        return _this;
    }
    AutoPollOptions.prototype.createConfigService = function () {
        return new AutoPollConfigService(this);
    };
    return AutoPollOptions;
}(OptionsBase));

var ManualPollOptions = (function (_super) {
    __extends(ManualPollOptions, _super);
    function ManualPollOptions(sdkKey, kernel, options) {
        return _super.call(this, sdkKey, kernel, kernel.sdkType + "/m-" + kernel.sdkVersion, options) || this;
    }
    ManualPollOptions.prototype.createConfigService = function () {
        return new ManualPollConfigService(this);
    };
    return ManualPollOptions;
}(OptionsBase));

var LazyLoadOptions = (function (_super) {
    __extends(LazyLoadOptions, _super);
    function LazyLoadOptions(sdkKey, kernel, options) {
        var _this = _super.call(this, sdkKey, kernel, kernel.sdkType + "/l-" + kernel.sdkVersion, options) || this;
        _this.cacheTimeToLiveSeconds = 60;
        if (options) {
            var optionsArgName = "options";
            if (options.cacheTimeToLiveSeconds != null) {
                var minValue_2 = 1, maxValue_3 = 2147483647;
                _this.cacheTimeToLiveSeconds = ensureNumberArgInRange(options.cacheTimeToLiveSeconds, optionsArgName, "between ".concat(minValue_2, " and ").concat(maxValue_3), function (value) { return isNumberInRange(value, minValue_2, maxValue_3); }, ".cacheTimeToLiveSeconds");
            }
            if (options.cacheTimeToLiveSeconds != null) {
                _this.cacheTimeToLiveSeconds = options.cacheTimeToLiveSeconds;
            }
        }
        return _this;
    }
    LazyLoadOptions.prototype.createConfigService = function () {
        return new LazyLoadConfigService(this);
    };
    return LazyLoadOptions;
}(OptionsBase));


;// ./src/EvaluateLogBuilder.ts


var invalidValuePlaceholder = "<invalid value>";
var invalidNamePlaceholder = "<invalid name>";
var invalidOperatorPlaceholder = "<invalid operator>";
var invalidReferencePlaceholder = "<invalid reference>";
var stringListMaxLength = 10;
var EvaluateLogBuilder = (function () {
    function EvaluateLogBuilder(eol) {
        this.eol = eol;
        this.log = "";
        this.indent = "";
    }
    EvaluateLogBuilder.prototype.resetIndent = function () {
        this.indent = "";
        return this;
    };
    EvaluateLogBuilder.prototype.increaseIndent = function () {
        this.indent += "  ";
        return this;
    };
    EvaluateLogBuilder.prototype.decreaseIndent = function () {
        this.indent = this.indent.slice(0, -2);
        return this;
    };
    EvaluateLogBuilder.prototype.newLine = function (text) {
        this.log += this.eol + this.indent + (text !== null && text !== void 0 ? text : "");
        return this;
    };
    EvaluateLogBuilder.prototype.append = function (text) {
        this.log += text;
        return this;
    };
    EvaluateLogBuilder.prototype.toString = function () {
        return this.log;
    };
    EvaluateLogBuilder.prototype.appendUserConditionCore = function (comparisonAttribute, comparator, comparisonValue) {
        return this.append("User.".concat(comparisonAttribute, " ").concat(formatUserComparator(comparator), " '").concat(comparisonValue !== null && comparisonValue !== void 0 ? comparisonValue : invalidValuePlaceholder, "'"));
    };
    EvaluateLogBuilder.prototype.appendUserConditionString = function (comparisonAttribute, comparator, comparisonValue, isSensitive) {
        if (comparisonValue == null) {
            return this.appendUserConditionCore(comparisonAttribute, comparator);
        }
        return this.appendUserConditionCore(comparisonAttribute, comparator, !isSensitive ? comparisonValue : "<hashed value>");
    };
    EvaluateLogBuilder.prototype.appendUserConditionStringList = function (comparisonAttribute, comparator, comparisonValue, isSensitive) {
        if (comparisonValue == null) {
            return this.appendUserConditionCore(comparisonAttribute, comparator);
        }
        var valueText = "value", valuesText = "values";
        var comparatorFormatted = formatUserComparator(comparator);
        if (isSensitive) {
            return this.append("User.".concat(comparisonAttribute, " ").concat(comparatorFormatted, " [<").concat(comparisonValue.length, " hashed ").concat(comparisonValue.length === 1 ? valueText : valuesText, ">]"));
        }
        else {
            var comparisonValueFormatted = formatStringList(comparisonValue, stringListMaxLength, function (count) { return ", ... <".concat(count, " more ").concat(count === 1 ? valueText : valuesText, ">"); });
            return this.append("User.".concat(comparisonAttribute, " ").concat(comparatorFormatted, " [").concat(comparisonValueFormatted, "]"));
        }
    };
    EvaluateLogBuilder.prototype.appendUserConditionNumber = function (comparisonAttribute, comparator, comparisonValue, isDateTime) {
        if (comparisonValue == null) {
            return this.appendUserConditionCore(comparisonAttribute, comparator);
        }
        var comparatorFormatted = formatUserComparator(comparator);
        var date;
        return isDateTime && !isNaN((date = new Date(comparisonValue * 1000)))
            ? this.append("User.".concat(comparisonAttribute, " ").concat(comparatorFormatted, " '").concat(comparisonValue, "' (").concat(date.toISOString(), " UTC)"))
            : this.append("User.".concat(comparisonAttribute, " ").concat(comparatorFormatted, " '").concat(comparisonValue, "'"));
    };
    EvaluateLogBuilder.prototype.appendUserCondition = function (condition) {
        var comparisonAttribute = condition.a;
        var comparator = condition.c;
        switch (comparator) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 30:
            case 31:
            case 32:
            case 33:
            case 34:
            case 35:
                return this.appendUserConditionStringList(comparisonAttribute, comparator, condition.l, false);
            case 6:
            case 7:
            case 8:
            case 9:
            case 28:
            case 29:
                return this.appendUserConditionString(comparisonAttribute, comparator, condition.s, false);
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
                return this.appendUserConditionNumber(comparisonAttribute, comparator, condition.d);
            case 16:
            case 17:
            case 22:
            case 23:
            case 24:
            case 25:
            case 26:
            case 27:
                return this.appendUserConditionStringList(comparisonAttribute, comparator, condition.l, true);
            case 18:
            case 19:
                return this.appendUserConditionNumber(comparisonAttribute, comparator, condition.d, true);
            case 20:
            case 21:
                return this.appendUserConditionString(comparisonAttribute, comparator, condition.s, true);
            default: {
                var comparisonValue = inferUserConditionComparisonValue(condition);
                if (isString(comparisonValue)) {
                    return this.appendUserConditionString(comparisonAttribute, comparator, comparisonValue, false);
                }
                else if (isNumber(comparisonValue)) {
                    return this.appendUserConditionNumber(comparisonAttribute, comparator, comparisonValue);
                }
                else if (!comparisonValue) {
                    return this.appendUserConditionStringList(comparisonAttribute, comparator, comparisonValue, false);
                }
                else {
                    return this.appendUserConditionCore(comparisonAttribute, comparator);
                }
            }
        }
    };
    EvaluateLogBuilder.prototype.appendPrerequisiteFlagCondition = function (condition, settings) {
        var prerequisiteFlagKey = Utils_hasOwnProperty(settings, condition.f)
            ? condition.f
            : invalidReferencePlaceholder;
        var comparator = condition.c;
        var comparisonValue = inferValue(condition.v);
        return this.append("Flag '".concat(prerequisiteFlagKey, "' ").concat(formatPrerequisiteFlagComparator(comparator), " '").concat(valueToString(comparisonValue), "'"));
    };
    EvaluateLogBuilder.prototype.appendSegmentCondition = function (condition, segments) {
        var segmentIndex = condition.s;
        var segmentName;
        if (segments && isIntegerInRange(segmentIndex, 0, segments.length - 1)) {
            segmentName = segments[segmentIndex].n;
            if (!segmentName.length) {
                segmentName = invalidNamePlaceholder;
            }
        }
        else {
            segmentName = invalidReferencePlaceholder;
        }
        var comparator = condition.c;
        return this.append("User ".concat(formatSegmentComparator(comparator), " '").concat(segmentName, "'"));
    };
    EvaluateLogBuilder.prototype.appendConditionResult = function (result) {
        return this.append("".concat(result));
    };
    EvaluateLogBuilder.prototype.appendConditionConsequence = function (result) {
        this.append(" => ").appendConditionResult(result);
        return result ? this : this.append(", skipping the remaining AND conditions");
    };
    EvaluateLogBuilder.prototype.appendTargetingRuleThenPart = function (targetingRule, settingType, newLine) {
        (newLine ? this.newLine() : this.append(" "))
            .append("THEN");
        if (!hasPercentageOptions(targetingRule, true)) {
            var simpleValue = targetingRule.s;
            var value = unwrapValue(simpleValue.v, settingType, true);
            return this.append(" '".concat(valueToString(value), "'"));
        }
        return this.append(" % options");
    };
    EvaluateLogBuilder.prototype.appendTargetingRuleConsequence = function (targetingRule, settingType, isMatchOrError, newLine) {
        this.increaseIndent();
        this.appendTargetingRuleThenPart(targetingRule, settingType, newLine)
            .append(" => ").append(isMatchOrError === true ? "MATCH, applying rule" : isMatchOrError === false ? "no match" : isMatchOrError);
        return this.decreaseIndent();
    };
    return EvaluateLogBuilder;
}());

function formatUserComparator(comparator) {
    switch (comparator) {
        case 0:
        case 16:
        case 4: return "IS ONE OF";
        case 1:
        case 17:
        case 5: return "IS NOT ONE OF";
        case 2: return "CONTAINS ANY OF";
        case 3: return "NOT CONTAINS ANY OF";
        case 6:
        case 12: return "<";
        case 7:
        case 13: return "<=";
        case 8:
        case 14: return ">";
        case 9:
        case 15: return ">=";
        case 10: return "=";
        case 11: return "!=";
        case 18: return "BEFORE";
        case 19: return "AFTER";
        case 28:
        case 20: return "EQUALS";
        case 29:
        case 21: return "NOT EQUALS";
        case 30:
        case 22: return "STARTS WITH ANY OF";
        case 31:
        case 23: return "NOT STARTS WITH ANY OF";
        case 32:
        case 24: return "ENDS WITH ANY OF";
        case 33:
        case 25: return "NOT ENDS WITH ANY OF";
        case 34:
        case 26: return "ARRAY CONTAINS ANY OF";
        case 35:
        case 27: return "ARRAY NOT CONTAINS ANY OF";
        default: return invalidOperatorPlaceholder;
    }
}
function formatUserCondition(condition) {
    return new EvaluateLogBuilder("").appendUserCondition(condition).toString();
}
function formatPrerequisiteFlagComparator(comparator) {
    switch (comparator) {
        case 0: return "EQUALS";
        case 1: return "NOT EQUALS";
        default: return invalidOperatorPlaceholder;
    }
}
function formatSegmentComparator(comparator) {
    switch (comparator) {
        case 0: return "IS IN SEGMENT";
        case 1: return "IS NOT IN SEGMENT";
        default: return invalidOperatorPlaceholder;
    }
}
function valueToString(value) {
    return isAllowedValue(value) ? value.toString() : invalidValuePlaceholder;
}
function inferValue(settingValue) {
    var value, currentValue;
    value = settingValue.b;
    currentValue = settingValue.s;
    if (currentValue != null) {
        if (value != null)
            return;
        value = currentValue;
    }
    currentValue = settingValue.i;
    if (currentValue != null) {
        if (value != null)
            return;
        value = currentValue;
    }
    currentValue = settingValue.d;
    if (currentValue != null) {
        if (value != null)
            return;
        value = currentValue;
    }
    return value !== null && value !== void 0 ? value : void 0;
}
function inferUserConditionComparisonValue(condition) {
    var value, currentValue;
    value = condition.s;
    currentValue = condition.d;
    if (currentValue != null) {
        if (value != null)
            return;
        value = currentValue;
    }
    currentValue = condition.l;
    if (currentValue != null) {
        if (value != null)
            return;
        value = currentValue;
    }
    return value !== null && value !== void 0 ? value : void 0;
}

;// ./src/Semver.ts
var numeric = /^[0-9]+$/;
var compareIdentifiers = function (a, b) {
    var anum = numeric.test(a);
    var bnum = numeric.test(b);
    if (anum && bnum) {
        a = +a;
        b = +b;
    }
    return a === b ? 0
        : (anum && !bnum) ? -1
            : (bnum && !anum) ? 1
                : a < b ? -1
                    : 1;
};
var rcompareIdentifiers = function (a, b) { return compareIdentifiers(b, a); };
var SEMVER_SPEC_VERSION = '2.0.0';
var MAX_LENGTH = 256;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
    9007199254740991;
var MAX_SAFE_COMPONENT_LENGTH = 16;
var re = [];
var src = [];
var t = {};
var R = 0;
var createToken = function (name, value) {
    var index = R++;
    t[name] = index;
    src[index] = value;
    re[index] = new RegExp(value);
};
createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
createToken('NUMERICIDENTIFIERLOOSE', '[0-9]+');
createToken('NONNUMERICIDENTIFIER', '\\d*[a-zA-Z-][a-zA-Z0-9-]*');
createToken('MAINVERSION', "(".concat(src[t['NUMERICIDENTIFIER']], ")\\.") +
    "(".concat(src[t['NUMERICIDENTIFIER']], ")\\.") +
    "(".concat(src[t['NUMERICIDENTIFIER']], ")"));
createToken('MAINVERSIONLOOSE', "(".concat(src[t['NUMERICIDENTIFIERLOOSE']], ")\\.") +
    "(".concat(src[t['NUMERICIDENTIFIERLOOSE']], ")\\.") +
    "(".concat(src[t['NUMERICIDENTIFIERLOOSE']], ")"));
createToken('PRERELEASEIDENTIFIER', "(?:".concat(src[t['NUMERICIDENTIFIER']], "|").concat(src[t['NONNUMERICIDENTIFIER']], ")"));
createToken('PRERELEASEIDENTIFIERLOOSE', "(?:".concat(src[t['NUMERICIDENTIFIERLOOSE']], "|").concat(src[t['NONNUMERICIDENTIFIER']], ")"));
createToken('PRERELEASE', "(?:-(".concat(src[t['PRERELEASEIDENTIFIER']], "(?:\\.").concat(src[t['PRERELEASEIDENTIFIER']], ")*))"));
createToken('PRERELEASELOOSE', "(?:-?(".concat(src[t['PRERELEASEIDENTIFIERLOOSE']], "(?:\\.").concat(src[t['PRERELEASEIDENTIFIERLOOSE']], ")*))"));
createToken('BUILDIDENTIFIER', '[0-9A-Za-z-]+');
createToken('BUILD', "(?:\\+(".concat(src[t['BUILDIDENTIFIER']], "(?:\\.").concat(src[t['BUILDIDENTIFIER']], ")*))"));
createToken('FULLPLAIN', "v?".concat(src[t['MAINVERSION']]).concat(src[t['PRERELEASE']], "?").concat(src[t['BUILD']], "?"));
createToken('FULL', "^".concat(src[t['FULLPLAIN']], "$"));
createToken('LOOSEPLAIN', "[v=\\s]*".concat(src[t['MAINVERSIONLOOSE']]).concat(src[t['PRERELEASELOOSE']], "?").concat(src[t['BUILD']], "?"));
createToken('LOOSE', "^".concat(src[t['LOOSEPLAIN']], "$"));
var SemVer = (function () {
    function SemVer(version, options) {
        if (!options || typeof options !== 'object') {
            options = {
                loose: !!options,
                includePrerelease: false
            };
        }
        if (version instanceof SemVer) {
            if (version.loose === !!options.loose &&
                version.includePrerelease === !!options.includePrerelease) {
                return version;
            }
            else {
                version = version.version;
            }
        }
        else if (typeof version !== 'string') {
            throw TypeError("Invalid Version: ".concat(version));
        }
        if (version.length > MAX_LENGTH) {
            throw TypeError("version is longer than ".concat(MAX_LENGTH, " characters"));
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        var m = version.trim().match(options.loose ? re[t['LOOSE']] : re[t['FULL']]);
        if (!m) {
            throw TypeError("Invalid Version: ".concat(version));
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
            throw TypeError('Invalid major version');
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
            throw TypeError('Invalid minor version');
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
            throw TypeError('Invalid patch version');
        }
        if (!m[4]) {
            this.prerelease = [];
        }
        else {
            this.prerelease = m[4].split('.').map(function (id) {
                if (/^[0-9]+$/.test(id)) {
                    var num = +id;
                    if (num >= 0 && num < MAX_SAFE_INTEGER) {
                        return num;
                    }
                }
                return id;
            });
        }
        this.build = m[5] ? m[5].split('.') : [];
        this.format();
    }
    SemVer.prototype.format = function () {
        this.version = "".concat(this.major, ".").concat(this.minor, ".").concat(this.patch);
        if (this.prerelease.length) {
            this.version += "-".concat(this.prerelease.join('.'));
        }
        return this.version;
    };
    SemVer.prototype.toString = function () {
        return this.version;
    };
    SemVer.prototype.compare = function (other) {
        if (!(other instanceof SemVer)) {
            if (typeof other === 'string' && other === this.version) {
                return 0;
            }
            other = new SemVer(other, this.options);
        }
        if (other.version === this.version) {
            return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
    };
    SemVer.prototype.compareMain = function (other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        return (compareIdentifiers(this.major, other.major) ||
            compareIdentifiers(this.minor, other.minor) ||
            compareIdentifiers(this.patch, other.patch));
    };
    SemVer.prototype.comparePre = function (other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
            return -1;
        }
        else if (!this.prerelease.length && other.prerelease.length) {
            return 1;
        }
        else if (!this.prerelease.length && !other.prerelease.length) {
            return 0;
        }
        var i = 0;
        do {
            var a = this.prerelease[i];
            var b = other.prerelease[i];
            if (a === void 0 && b === void 0) {
                return 0;
            }
            else if (b === void 0) {
                return 1;
            }
            else if (a === void 0) {
                return -1;
            }
            else if (a === b) {
                continue;
            }
            else {
                return compareIdentifiers(a, b);
            }
        } while (++i);
    };
    SemVer.prototype.compareBuild = function (other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        var i = 0;
        do {
            var a = this.build[i];
            var b = other.build[i];
            if (a === void 0 && b === void 0) {
                return 0;
            }
            else if (b === void 0) {
                return 1;
            }
            else if (a === void 0) {
                return -1;
            }
            else if (a === b) {
                continue;
            }
            else {
                return compareIdentifiers(a, b);
            }
        } while (++i);
    };
    SemVer.prototype.inc = function (release, identifier) {
        switch (release) {
            case 'premajor':
                this.prerelease.length = 0;
                this.patch = 0;
                this.minor = 0;
                this.major++;
                this.inc('pre', identifier);
                break;
            case 'preminor':
                this.prerelease.length = 0;
                this.patch = 0;
                this.minor++;
                this.inc('pre', identifier);
                break;
            case 'prepatch':
                this.prerelease.length = 0;
                this.inc('patch', identifier);
                this.inc('pre', identifier);
                break;
            case 'prerelease':
                if (this.prerelease.length === 0) {
                    this.inc('patch', identifier);
                }
                this.inc('pre', identifier);
                break;
            case 'major':
                if (this.minor !== 0 ||
                    this.patch !== 0 ||
                    this.prerelease.length === 0) {
                    this.major++;
                }
                this.minor = 0;
                this.patch = 0;
                this.prerelease = [];
                break;
            case 'minor':
                if (this.patch !== 0 || this.prerelease.length === 0) {
                    this.minor++;
                }
                this.patch = 0;
                this.prerelease = [];
                break;
            case 'patch':
                if (this.prerelease.length === 0) {
                    this.patch++;
                }
                this.prerelease = [];
                break;
            case 'pre':
                if (this.prerelease.length === 0) {
                    this.prerelease = [0];
                }
                else {
                    var i = this.prerelease.length;
                    while (--i >= 0) {
                        if (typeof this.prerelease[i] === 'number') {
                            this.prerelease[i]++;
                            i = -2;
                        }
                    }
                    if (i === -1) {
                        this.prerelease.push(0);
                    }
                }
                if (identifier) {
                    if (this.prerelease[0] === identifier) {
                        if (isNaN(this.prerelease[1])) {
                            this.prerelease = [identifier, 0];
                        }
                    }
                    else {
                        this.prerelease = [identifier, 0];
                    }
                }
                break;
            default:
                throw Error("invalid increment argument: ".concat(release));
        }
        this.format();
        this.raw = this.version;
        return this;
    };
    return SemVer;
}());
var parse = function (version, options) {
    if (!options || typeof options !== 'object') {
        options = {
            loose: !!options,
            includePrerelease: false
        };
    }
    if (version instanceof SemVer) {
        return version;
    }
    if (typeof version !== 'string') {
        return null;
    }
    if (version.length > MAX_LENGTH) {
        return null;
    }
    var r = options.loose ? re[t['LOOSE']] : re[t['FULL']];
    if (!r.test(version)) {
        return null;
    }
    try {
        return new SemVer(version, options);
    }
    catch (er) {
        return null;
    }
};

;// ./src/User.ts

var User = (function () {
    function User(identifier, email, country, custom) {
        if (custom === void 0) { custom = {}; }
        this.identifier = identifier;
        this.email = email;
        this.country = country;
        this.custom = custom;
    }
    return User;
}());

function getUserIdentifier(user) {
    var _a;
    return (_a = user.identifier) !== null && _a !== void 0 ? _a : "";
}
function getUserAttribute(user, name) {
    switch (name) {
        case "Identifier": return getUserIdentifier(user);
        case "Email": return user.email;
        case "Country": return user.country;
        default: return user.custom && Utils_hasOwnProperty(user.custom, name) ? user.custom[name] : void 0;
    }
}
function getUserAttributes(user) {
    var _a;
    var result = createMap();
    var identifierAttribute = "Identifier";
    var emailAttribute = "Email";
    var countryAttribute = "Country";
    result[identifierAttribute] = (_a = user.identifier) !== null && _a !== void 0 ? _a : "";
    if (user.email != null) {
        result[emailAttribute] = user.email;
    }
    if (user.country != null) {
        result[countryAttribute] = user.country;
    }
    if (user.custom != null) {
        var wellKnownAttributes = [identifierAttribute, emailAttribute, countryAttribute];
        for (var attributeName in user.custom) {
            var attributeValue = void 0;
            if (Utils_hasOwnProperty(user.custom, attributeName)
                && (attributeValue = user.custom[attributeName]) != null
                && wellKnownAttributes.indexOf(attributeName) < 0) {
                result[attributeName] = attributeValue;
            }
        }
    }
    return result;
}

;// ./src/RolloutEvaluator.ts








var EvaluateContext = (function () {
    function EvaluateContext(key, setting, user, settings) {
        this.key = key;
        this.setting = setting;
        this.user = user;
        this.settings = settings;
        this._settingType = void 0;
        this._visitedFlags = void 0;
        this.isMissingUserObjectLogged = false;
        this.isMissingUserObjectAttributeLogged = false;
    }
    Object.defineProperty(EvaluateContext.prototype, "settingType", {
        get: function () { var _a; return (_a = this._settingType) !== null && _a !== void 0 ? _a : (this._settingType = getSettingType(this.setting)); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(EvaluateContext.prototype, "visitedFlags", {
        get: function () { var _a; return (_a = this._visitedFlags) !== null && _a !== void 0 ? _a : (this._visitedFlags = []); },
        enumerable: false,
        configurable: true
    });
    EvaluateContext.forPrerequisiteFlag = function (key, setting, dependentFlagContext) {
        var context = new EvaluateContext(key, setting, dependentFlagContext.user, dependentFlagContext.settings);
        context._visitedFlags = dependentFlagContext.visitedFlags;
        context.logBuilder = dependentFlagContext.logBuilder;
        return context;
    };
    return EvaluateContext;
}());

var targetingRuleIgnoredMessage = "The current targeting rule is ignored and the evaluation continues with the next rule.";
var missingUserObjectError = "cannot evaluate, User Object is missing";
var missingUserAttributeError = function (attributeName) { return "cannot evaluate, the User.".concat(attributeName, " attribute is missing"); };
var invalidUserAttributeError = function (attributeName, reason) { return "cannot evaluate, the User.".concat(attributeName, " attribute is invalid (").concat(reason, ")"); };
var RolloutEvaluator = (function () {
    function RolloutEvaluator(logger) {
        this.logger = logger;
    }
    RolloutEvaluator.prototype.evaluate = function (defaultValue, context) {
        logMethodDebug(this.logger, "RolloutEvaluator.evaluate");
        var logBuilder = context.logBuilder = this.logger.isEnabled(3)
            ? new EvaluateLogBuilder(this.logger.eol)
            : null;
        if (logBuilder) {
            logBuilder.append("Evaluating '".concat(context.key, "'"));
            if (context.user) {
                logBuilder.append(" for User '".concat(JSON.stringify(getUserAttributes(context.user)), "'"));
            }
            logBuilder.increaseIndent();
        }
        var returnValue;
        try {
            var settingType = context.settingType;
            var inferredSettingType = settingType !== -1
                ? settingType
                : inferSettingType(context.setting.v);
            if (defaultValue != null
                && inferredSettingType !== void 0
                && !isCompatibleValue(defaultValue, inferredSettingType)) {
                var settingTypeName = nameOfSettingType(inferredSettingType);
                throw new EvaluationError(2, "The type of a setting must match the type of the specified default value. "
                    + "Setting's type was ".concat(settingTypeName, " but the default value's type was ").concat(typeof defaultValue, ". ")
                    + "Please use a default value which corresponds to the setting type ".concat(settingTypeName, ". ")
                    + "Learn more: https://configcat.com/docs/sdk-reference/js/overview/#setting-type-mapping");
            }
            var result = this.evaluateSetting(context);
            result.returnValue = returnValue = unwrapValue(result.selectedValue.v, settingType);
            return result;
        }
        catch (err) {
            logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.resetIndent().increaseIndent();
            returnValue = defaultValue;
            throw err;
        }
        finally {
            if (logBuilder) {
                logBuilder.newLine("Returning '".concat(returnValue, "'."))
                    .decreaseIndent();
                this.logger.settingEvaluated(logBuilder.toString());
            }
        }
    };
    RolloutEvaluator.prototype.evaluateSetting = function (context) {
        var evaluateResult;
        var targetingRules = context.setting.r;
        if ((targetingRules === null || targetingRules === void 0 ? void 0 : targetingRules.length) && (evaluateResult = this.evaluateTargetingRules(targetingRules, context))) {
            return evaluateResult;
        }
        var percentageOptions = context.setting.p;
        if ((percentageOptions === null || percentageOptions === void 0 ? void 0 : percentageOptions.length) && (evaluateResult = this.evaluatePercentageOptions(percentageOptions, void 0, context))) {
            return evaluateResult;
        }
        return evaluateResultFrom(context.setting);
    };
    RolloutEvaluator.prototype.evaluateTargetingRules = function (targetingRules, context) {
        var logBuilder = context.logBuilder;
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine("Evaluating targeting rules and applying the first match if any:");
        for (var i = 0; i < targetingRules.length; i++) {
            var targetingRule = targetingRules[i];
            var conditions = targetingRule.c;
            var isMatchOrError = this.evaluateConditions(conditions, void 0, targetingRule, context.key, context);
            if (isMatchOrError !== true) {
                if (isString(isMatchOrError)) {
                    logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.increaseIndent().newLine(targetingRuleIgnoredMessage).decreaseIndent();
                }
                continue;
            }
            if (!hasPercentageOptions(targetingRule)) {
                return evaluateResultFrom(targetingRule.s, targetingRule);
            }
            var percentageOptions = targetingRule.p;
            logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.increaseIndent();
            var evaluateResult = this.evaluatePercentageOptions(percentageOptions, targetingRule, context);
            if (evaluateResult) {
                logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.decreaseIndent();
                return evaluateResult;
            }
            logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine(targetingRuleIgnoredMessage).decreaseIndent();
        }
    };
    RolloutEvaluator.prototype.evaluatePercentageOptions = function (percentageOptions, matchedTargetingRule, context) {
        var logBuilder = context.logBuilder;
        if (!context.user) {
            logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine("Skipping % options because the User Object is missing.");
            if (!context.isMissingUserObjectLogged) {
                this.logger.userObjectIsMissing(context.key);
                context.isMissingUserObjectLogged = true;
            }
            return;
        }
        var percentageOptionsAttributeName = context.setting.a;
        var percentageOptionsAttributeValue;
        if (percentageOptionsAttributeName == null) {
            percentageOptionsAttributeName = "Identifier";
            percentageOptionsAttributeValue = getUserIdentifier(context.user);
        }
        else {
            percentageOptionsAttributeValue = getUserAttribute(context.user, percentageOptionsAttributeName);
        }
        if (percentageOptionsAttributeValue == null) {
            logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine("Skipping % options because the User.".concat(percentageOptionsAttributeName, " attribute is missing."));
            if (!context.isMissingUserObjectAttributeLogged) {
                this.logger.userObjectAttributeIsMissingPercentage(context.key, percentageOptionsAttributeName);
                context.isMissingUserObjectAttributeLogged = true;
            }
            return;
        }
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine("Evaluating % options based on the User.".concat(percentageOptionsAttributeName, " attribute:"));
        var sha1Hash = sha1(context.key + userAttributeValueToString(percentageOptionsAttributeValue));
        var hashValue = parseInt(sha1Hash.substring(0, 7), 16) % 100;
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine("- Computing hash in the [0..99] range from User.".concat(percentageOptionsAttributeName, " => ").concat(hashValue, " (this value is sticky and consistent across all SDKs)"));
        var bucket = 0;
        for (var i = 0; i < percentageOptions.length; i++) {
            var percentageOption = percentageOptions[i];
            var percentage = percentageOption.p;
            if (percentage < 0) {
                throwInvalidConfigModelError("Percentage option percentage is invalid.");
            }
            bucket += percentage;
            if (hashValue >= bucket) {
                continue;
            }
            if (logBuilder) {
                var percentageOptionValue = unwrapValue(percentageOption.v, context.settingType, true);
                logBuilder.newLine("- Hash value ".concat(hashValue, " selects % option ").concat(i + 1, " (").concat(percentage, "%), '").concat(valueToString(percentageOptionValue), "'."));
            }
            return evaluateResultFrom(percentageOption, matchedTargetingRule, percentageOption);
        }
        throwInvalidConfigModelError("Sum of percentage option percentages is less than 100.");
    };
    RolloutEvaluator.prototype.evaluateConditions = function (conditions, conditionType, targetingRule, contextSalt, context) {
        var _a;
        var result = true;
        var logBuilder = context.logBuilder;
        var newLineBeforeThen = false;
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine("- ");
        var unwrapCondition = !conditionType;
        for (var i = 0, conditionCount = (_a = conditions === null || conditions === void 0 ? void 0 : conditions.length) !== null && _a !== void 0 ? _a : 0; i < conditionCount; i++) {
            var condition = void 0;
            if (unwrapCondition) {
                var container = conditions[i];
                conditionType = getConditionType(container);
                condition = container[conditionType];
            }
            else {
                condition = conditions[i];
            }
            if (logBuilder) {
                if (!i) {
                    logBuilder.append("IF ")
                        .increaseIndent();
                }
                else {
                    logBuilder.increaseIndent()
                        .newLine("AND ");
                }
            }
            switch (conditionType) {
                case "u":
                    result = this.evaluateUserCondition(condition, contextSalt, context);
                    newLineBeforeThen = conditionCount > 1;
                    break;
                case "p":
                    result = this.evaluatePrerequisiteFlagCondition(condition, context);
                    newLineBeforeThen = true;
                    break;
                case "s":
                    result = this.evaluateSegmentCondition(condition, context);
                    newLineBeforeThen = !isString(result) || result !== missingUserObjectError || conditionCount > 1;
                    break;
                default:
                    throw Error();
            }
            var success = result === true;
            if (logBuilder) {
                if (!targetingRule || conditionCount > 1) {
                    logBuilder.appendConditionConsequence(success);
                }
                logBuilder.decreaseIndent();
            }
            if (!success) {
                break;
            }
        }
        if (targetingRule) {
            logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.appendTargetingRuleConsequence(targetingRule, context.settingType, result, newLineBeforeThen);
        }
        return result;
    };
    RolloutEvaluator.prototype.evaluateUserCondition = function (condition, contextSalt, context) {
        var logBuilder = context.logBuilder;
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.appendUserCondition(condition);
        if (!context.user) {
            if (!context.isMissingUserObjectLogged) {
                this.logger.userObjectIsMissing(context.key);
                context.isMissingUserObjectLogged = true;
            }
            return missingUserObjectError;
        }
        var userAttributeName = condition.a;
        var userAttributeValue = getUserAttribute(context.user, userAttributeName);
        if (userAttributeValue == null || userAttributeValue === "") {
            var conditionString = new LazyString(condition, function (condition) { return formatUserCondition(condition); });
            this.logger.userObjectAttributeIsMissingCondition(conditionString, context.key, userAttributeName);
            return missingUserAttributeError(userAttributeName);
        }
        var text, versionOrError, numberOrError, arrayOrError;
        var comparator = condition.c;
        switch (comparator) {
            case 28:
            case 29:
                text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return this.evaluateTextEquals(text, ensureComparisonValue(condition.s), comparator === 29);
            case 20:
            case 21:
                text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return this.evaluateSensitiveTextEquals(text, ensureComparisonValue(condition.s), getConfigJsonSalt(context.setting), contextSalt, comparator === 21);
            case 0:
            case 1:
                text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return this.evaluateTextIsOneOf(text, ensureComparisonValue(condition.l), comparator === 1);
            case 16:
            case 17:
                text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return this.evaluateSensitiveTextIsOneOf(text, ensureComparisonValue(condition.l), getConfigJsonSalt(context.setting), contextSalt, comparator === 17);
            case 30:
            case 31:
                text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return this.evaluateTextSliceEqualsAnyOf(text, ensureComparisonValue(condition.l), true, comparator === 31);
            case 22:
            case 23:
                text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return this.evaluateSensitiveTextSliceEqualsAnyOf(text, ensureComparisonValue(condition.l), getConfigJsonSalt(context.setting), contextSalt, true, comparator === 23);
            case 32:
            case 33:
                text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return this.evaluateTextSliceEqualsAnyOf(text, ensureComparisonValue(condition.l), false, comparator === 33);
            case 24:
            case 25:
                text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return this.evaluateSensitiveTextSliceEqualsAnyOf(text, ensureComparisonValue(condition.l), getConfigJsonSalt(context.setting), contextSalt, false, comparator === 25);
            case 2:
            case 3:
                text = getUserAttributeValueAsText(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return this.evaluateTextContainsAnyOf(text, ensureComparisonValue(condition.l), comparator === 3);
            case 4:
            case 5:
                versionOrError = getUserAttributeValueAsSemVer(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return !isString(versionOrError)
                    ? this.evaluateSemVerIsOneOf(versionOrError, ensureComparisonValue(condition.l), comparator === 5)
                    : versionOrError;
            case 6:
            case 7:
            case 8:
            case 9:
                versionOrError = getUserAttributeValueAsSemVer(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return !isString(versionOrError)
                    ? this.evaluateSemVerRelation(versionOrError, comparator, ensureComparisonValue(condition.s))
                    : versionOrError;
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
                numberOrError = getUserAttributeValueAsNumber(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return !isString(numberOrError)
                    ? this.evaluateNumberRelation(numberOrError, comparator, ensureComparisonValue(condition.d))
                    : numberOrError;
            case 18:
            case 19:
                numberOrError = getUserAttributeValueAsUnixTimeSeconds(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return !isString(numberOrError)
                    ? this.evaluateDateTimeRelation(numberOrError, ensureComparisonValue(condition.d), comparator === 18)
                    : numberOrError;
            case 34:
            case 35:
                arrayOrError = getUserAttributeValueAsStringArray(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return !isString(arrayOrError)
                    ? this.evaluateArrayContainsAnyOf(arrayOrError, ensureComparisonValue(condition.l), comparator === 35)
                    : arrayOrError;
            case 26:
            case 27:
                arrayOrError = getUserAttributeValueAsStringArray(userAttributeName, userAttributeValue, condition, context.key, this.logger);
                return !isString(arrayOrError)
                    ? this.evaluateSensitiveArrayContainsAnyOf(arrayOrError, ensureComparisonValue(condition.l), getConfigJsonSalt(context.setting), contextSalt, comparator === 27)
                    : arrayOrError;
            default:
                throwInvalidConfigModelError("Comparison operator is invalid.");
        }
    };
    RolloutEvaluator.prototype.evaluateTextEquals = function (text, comparisonValue, negate) {
        return (text === comparisonValue) !== negate;
    };
    RolloutEvaluator.prototype.evaluateSensitiveTextEquals = function (text, comparisonValue, configJsonSalt, contextSalt, negate) {
        var hash = hashComparisonValue(text, configJsonSalt, contextSalt);
        return (hash === comparisonValue) !== negate;
    };
    RolloutEvaluator.prototype.evaluateTextIsOneOf = function (text, comparisonValues, negate) {
        var result = comparisonValues.indexOf(text) >= 0;
        return result !== negate;
    };
    RolloutEvaluator.prototype.evaluateSensitiveTextIsOneOf = function (text, comparisonValues, configJsonSalt, contextSalt, negate) {
        var hash = hashComparisonValue(text, configJsonSalt, contextSalt);
        var result = comparisonValues.indexOf(hash) >= 0;
        return result !== negate;
    };
    RolloutEvaluator.prototype.evaluateTextSliceEqualsAnyOf = function (text, comparisonValues, isStartsWith, negate) {
        for (var i = 0; i < comparisonValues.length; i++) {
            var item = comparisonValues[i];
            if (text.length < item.length) {
                continue;
            }
            var result = isStartsWith ? startsWith(text, item) : endsWith(text, item);
            if (result) {
                return !negate;
            }
        }
        return negate;
    };
    RolloutEvaluator.prototype.evaluateSensitiveTextSliceEqualsAnyOf = function (text, comparisonValues, configJsonSalt, contextSalt, startsWith, negate) {
        var textUtf8 = utf8Encode(text);
        for (var i = 0; i < comparisonValues.length; i++) {
            var item = comparisonValues[i];
            var sliceLength = void 0, hash2 = void 0;
            var index = item.indexOf("_");
            if (index < 0
                || isNaN(sliceLength = parseIntStrict(item.slice(0, index)))
                || sliceLength < 0
                || !(hash2 = item.slice(index + 1))) {
                throwInvalidConfigModelError("Comparison value is invalid.");
            }
            if (textUtf8.length < sliceLength) {
                continue;
            }
            var sliceUtf8 = startsWith ? textUtf8.slice(0, sliceLength) : textUtf8.slice(textUtf8.length - sliceLength);
            var hash = hashComparisonValueSlice(sliceUtf8, configJsonSalt, contextSalt);
            var result = hash === hash2;
            if (result) {
                return !negate;
            }
        }
        return negate;
    };
    RolloutEvaluator.prototype.evaluateTextContainsAnyOf = function (text, comparisonValues, negate) {
        for (var i = 0; i < comparisonValues.length; i++) {
            if (text.indexOf(comparisonValues[i]) >= 0) {
                return !negate;
            }
        }
        return negate;
    };
    RolloutEvaluator.prototype.evaluateSemVerIsOneOf = function (version, comparisonValues, negate) {
        var result = false;
        for (var i = 0; i < comparisonValues.length; i++) {
            var item = comparisonValues[i];
            if (!item.length) {
                continue;
            }
            var version2 = parse(item.trim());
            if (!version2) {
                return false;
            }
            if (!result && version.compare(version2) === 0) {
                result = true;
            }
        }
        return result !== negate;
    };
    RolloutEvaluator.prototype.evaluateSemVerRelation = function (version, comparator, comparisonValue) {
        var version2 = parse(comparisonValue.trim());
        if (!version2) {
            return false;
        }
        var comparisonResult = version.compare(version2);
        switch (comparator) {
            case 6: return comparisonResult < 0;
            case 7: return comparisonResult <= 0;
            case 8: return comparisonResult > 0;
            case 9: return comparisonResult >= 0;
        }
    };
    RolloutEvaluator.prototype.evaluateNumberRelation = function (number, comparator, comparisonValue) {
        switch (comparator) {
            case 10: return number === comparisonValue;
            case 11: return number !== comparisonValue;
            case 12: return number < comparisonValue;
            case 13: return number <= comparisonValue;
            case 14: return number > comparisonValue;
            case 15: return number >= comparisonValue;
        }
    };
    RolloutEvaluator.prototype.evaluateDateTimeRelation = function (number, comparisonValue, before) {
        return before ? number < comparisonValue : number > comparisonValue;
    };
    RolloutEvaluator.prototype.evaluateArrayContainsAnyOf = function (array, comparisonValues, negate) {
        for (var i = 0; i < array.length; i++) {
            var result = comparisonValues.indexOf(array[i]) >= 0;
            if (result) {
                return !negate;
            }
        }
        return negate;
    };
    RolloutEvaluator.prototype.evaluateSensitiveArrayContainsAnyOf = function (array, comparisonValues, configJsonSalt, contextSalt, negate) {
        for (var i = 0; i < array.length; i++) {
            var hash = hashComparisonValue(array[i], configJsonSalt, contextSalt);
            var result = comparisonValues.indexOf(hash) >= 0;
            if (result) {
                return !negate;
            }
        }
        return negate;
    };
    RolloutEvaluator.prototype.evaluatePrerequisiteFlagCondition = function (condition, context) {
        var logBuilder = context.logBuilder;
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.appendPrerequisiteFlagCondition(condition, context.settings);
        var prerequisiteFlagKey = condition.f;
        var prerequisiteFlag = Utils_hasOwnProperty(context.settings, prerequisiteFlagKey)
            ? context.settings[prerequisiteFlagKey]
            : throwInvalidConfigModelError("Prerequisite flag is missing.");
        var prerequisiteFlagType = getSettingType(prerequisiteFlag);
        var inferredPrerequisiteFlagType;
        var comparisonValue;
        if (prerequisiteFlagType !== -1) {
            inferredPrerequisiteFlagType = prerequisiteFlagType;
            comparisonValue = unwrapValue(condition.v, prerequisiteFlagType, true);
        }
        else {
            inferredPrerequisiteFlagType = inferSettingType(prerequisiteFlag.v);
            if (inferredPrerequisiteFlagType !== void 0) {
                comparisonValue = unwrapValue(condition.v, inferredPrerequisiteFlagType, true);
                if (inferredPrerequisiteFlagType === 3) {
                    var intComparisonValue = unwrapValue(condition.v, 2, true);
                    if (comparisonValue === void 0) {
                        comparisonValue = intComparisonValue;
                    }
                    else if (intComparisonValue !== void 0) {
                        comparisonValue = void 0;
                    }
                }
            }
        }
        if (comparisonValue === void 0
            && inferredPrerequisiteFlagType !== void 0) {
            comparisonValue = inferValue(condition.v);
            throwInvalidConfigModelError("Type mismatch between comparison value '".concat(valueToString(comparisonValue), "' and prerequisite flag '").concat(prerequisiteFlagKey, "'."));
        }
        var visitedFlags = context.visitedFlags;
        visitedFlags.push(context.key);
        if (visitedFlags.indexOf(prerequisiteFlagKey) >= 0) {
            visitedFlags.push(prerequisiteFlagKey);
            var dependencyCycle = formatStringList(visitedFlags, void 0, void 0, " -> ");
            throwInvalidConfigModelError("Circular dependency detected between the following depending flags: ".concat(dependencyCycle, "."));
        }
        var prerequisiteFlagContext = EvaluateContext.forPrerequisiteFlag(prerequisiteFlagKey, prerequisiteFlag, context);
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine("(").increaseIndent().newLine("Evaluating prerequisite flag '".concat(prerequisiteFlagKey, "':"));
        var prerequisiteFlagEvaluateResult = this.evaluateSetting(prerequisiteFlagContext);
        visitedFlags.pop();
        var prerequisiteFlagValue = unwrapValue(prerequisiteFlagEvaluateResult.selectedValue.v, prerequisiteFlagType);
        var result;
        switch (condition.c) {
            case 0:
                result = prerequisiteFlagValue === comparisonValue;
                break;
            case 1:
                result = prerequisiteFlagValue !== comparisonValue;
                break;
            default:
                throwInvalidConfigModelError("Comparison operator is invalid.");
        }
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine("Prerequisite flag evaluation result: '".concat(valueToString(prerequisiteFlagValue), "'.")).newLine("Condition (").appendPrerequisiteFlagCondition(condition, context.settings).append(") evaluates to ").appendConditionResult(result).append(".").decreaseIndent().newLine(")");
        return result;
    };
    RolloutEvaluator.prototype.evaluateSegmentCondition = function (condition, context) {
        var segments = context.setting["_configSegments"];
        var logBuilder = context.logBuilder;
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.appendSegmentCondition(condition, segments);
        if (!context.user) {
            if (!context.isMissingUserObjectLogged) {
                this.logger.userObjectIsMissing(context.key);
                context.isMissingUserObjectLogged = true;
            }
            return missingUserObjectError;
        }
        var segmentIndex = condition === null || condition === void 0 ? void 0 : condition.s;
        if (!segments || !isIntegerInRange(segmentIndex, 0, segments.length - 1)) {
            throwInvalidConfigModelError("Segment reference is invalid.");
        }
        var segment = segments[segmentIndex];
        var segmentName = segment === null || segment === void 0 ? void 0 : segment.n;
        if (!segmentName.length) {
            throwInvalidConfigModelError("Segment name is missing.");
        }
        logBuilder === null || logBuilder === void 0 ? void 0 : logBuilder.newLine("(").increaseIndent().newLine("Evaluating segment '".concat(segmentName, "':"));
        var conditions = segment === null || segment === void 0 ? void 0 : segment.r;
        var segmentResult = this.evaluateConditions(conditions, "u", void 0, segmentName, context);
        var result = segmentResult;
        if (!isString(result)) {
            switch (condition.c) {
                case 0:
                    break;
                case 1:
                    result = !result;
                    break;
                default:
                    throwInvalidConfigModelError("Comparison operator is invalid.");
            }
        }
        if (logBuilder) {
            logBuilder.newLine("Segment evaluation result: ");
            (!isString(result)
                ? logBuilder.append("User ".concat(formatSegmentComparator(segmentResult ? 0 : 1)))
                : logBuilder.append(result))
                .append(".");
            logBuilder.newLine("Condition (").appendSegmentCondition(condition, segments).append(")");
            (!isString(result)
                ? logBuilder.append(" evaluates to ").appendConditionResult(result)
                : logBuilder.append(" failed to evaluate"))
                .append(".");
            logBuilder
                .decreaseIndent()
                .newLine(")");
        }
        return result;
    };
    return RolloutEvaluator;
}());

function evaluateResultFrom(selectedValue, matchedTargetingRule, matchedPercentageOption) {
    return { selectedValue: selectedValue, matchedTargetingRule: matchedTargetingRule, matchedPercentageOption: matchedPercentageOption };
}
function hashComparisonValue(value, configJsonSalt, contextSalt) {
    return hashComparisonValueSlice(utf8Encode(value), configJsonSalt, contextSalt);
}
function hashComparisonValueSlice(sliceUtf8, configJsonSalt, contextSalt) {
    return sha256(sliceUtf8 + utf8Encode(configJsonSalt) + utf8Encode(contextSalt));
}
function userAttributeValueToString(userAttributeValue) {
    return isString(userAttributeValue) ? userAttributeValue
        : userAttributeValue instanceof Date ? String(userAttributeValue.getTime() / 1000)
            : isStringArray(userAttributeValue) ? JSON.stringify(userAttributeValue)
                : toStringSafe(userAttributeValue);
}
function getUserAttributeValueAsText(attributeName, attributeValue, condition, key, logger) {
    if (isString(attributeValue)) {
        return attributeValue;
    }
    attributeValue = userAttributeValueToString(attributeValue);
    var conditionString = new LazyString(condition, function (condition) { return formatUserCondition(condition); });
    logger.userObjectAttributeIsAutoConverted(conditionString, key, attributeName, attributeValue);
    return attributeValue;
}
function getUserAttributeValueAsSemVer(attributeName, attributeValue, condition, key, logger) {
    var version;
    if (isString(attributeValue) && (version = parse(attributeValue.trim()))) {
        return version;
    }
    return handleInvalidUserAttribute(logger, condition, key, attributeName, "'".concat(toStringSafe(attributeValue), "' is not a valid semantic version"));
}
function getUserAttributeValueAsNumber(attributeName, attributeValue, condition, key, logger) {
    if (isNumber(attributeValue)) {
        return attributeValue;
    }
    var number;
    if (isString(attributeValue)
        && (!isNaN(number = parseFloatStrict(attributeValue.replace(",", "."))) || attributeValue.trim() === "NaN")) {
        return number;
    }
    return handleInvalidUserAttribute(logger, condition, key, attributeName, "'".concat(toStringSafe(attributeValue), "' is not a valid decimal number"));
}
function getUserAttributeValueAsUnixTimeSeconds(attributeName, attributeValue, condition, key, logger) {
    if (attributeValue instanceof Date) {
        return attributeValue.getTime() / 1000;
    }
    if (isNumber(attributeValue)) {
        return attributeValue;
    }
    var number;
    if (isString(attributeValue)
        && (!isNaN(number = parseFloatStrict(attributeValue.replace(",", "."))) || attributeValue.trim() === "NaN")) {
        return number;
    }
    return handleInvalidUserAttribute(logger, condition, key, attributeName, "'".concat(toStringSafe(attributeValue), "' is not a valid Unix timestamp (number of seconds elapsed since Unix epoch)"));
}
function getUserAttributeValueAsStringArray(attributeName, attributeValue, condition, key, logger) {
    var stringArray = attributeValue;
    if (isString(stringArray)) {
        try {
            stringArray = JSON.parse(stringArray);
        }
        catch (_a) { }
    }
    if (isStringArray(stringArray)) {
        return stringArray;
    }
    return handleInvalidUserAttribute(logger, condition, key, attributeName, "'".concat(toStringSafe(attributeValue), "' is not a valid string array"));
}
function handleInvalidUserAttribute(logger, condition, key, attributeName, reason) {
    var conditionString = new LazyString(condition, function (condition) { return formatUserCondition(condition); });
    logger.userObjectAttributeIsInvalid(conditionString, key, reason, attributeName);
    return invalidUserAttributeError(attributeName, reason);
}
function getConfigJsonSalt(setting) {
    var _a;
    return (_a = setting["_configJsonSalt"]) !== null && _a !== void 0 ? _a : throwInvalidConfigModelError("Config JSON salt is missing.");
}
function ensureComparisonValue(comparisonValue) {
    return comparisonValue !== null && comparisonValue !== void 0 ? comparisonValue : throwInvalidConfigModelError("Comparison value is missing.");
}
var EvaluationErrorCode;
(function (EvaluationErrorCode) {
    EvaluationErrorCode[EvaluationErrorCode["UnexpectedError"] = -1] = "UnexpectedError";
    EvaluationErrorCode[EvaluationErrorCode["None"] = 0] = "None";
    EvaluationErrorCode[EvaluationErrorCode["InvalidConfigModel"] = 1] = "InvalidConfigModel";
    EvaluationErrorCode[EvaluationErrorCode["SettingValueTypeMismatch"] = 2] = "SettingValueTypeMismatch";
    EvaluationErrorCode[EvaluationErrorCode["ConfigJsonNotAvailable"] = 1000] = "ConfigJsonNotAvailable";
    EvaluationErrorCode[EvaluationErrorCode["SettingKeyMissing"] = 1001] = "SettingKeyMissing";
})(EvaluationErrorCode || (EvaluationErrorCode = {}));
function evaluationDetailsFromEvaluateResult(key, evaluateResult, fetchTime, user) {
    return {
        key: key,
        value: evaluateResult.returnValue,
        variationId: evaluateResult.selectedValue.i,
        fetchTime: fetchTime,
        user: user,
        isDefaultValue: false,
        matchedTargetingRule: evaluateResult.matchedTargetingRule,
        matchedPercentageOption: evaluateResult.matchedPercentageOption,
        errorCode: 0,
    };
}
function evaluationDetailsFromDefaultValue(key, defaultValue, fetchTime, user, errorMessage, errorException, errorCode) {
    var _a;
    if (errorCode === void 0) { errorCode = -1; }
    return _a = {
            key: key,
            value: defaultValue,
            fetchTime: fetchTime,
            user: user,
            isDefaultValue: true,
            errorCode: errorCode
        },
        _a["_errorMessage"] = errorMessage,
        Object.defineProperty(_a, "errorMessage", {
            get: function () { var _a; return (_a = this._errorMessage) === null || _a === void 0 ? void 0 : _a.toString(); },
            enumerable: false,
            configurable: true
        }),
        _a.errorException = errorException,
        _a;
}
function evaluate(evaluator, settings, key, defaultValue, user, remoteConfig, logger) {
    var errorMessage;
    if (!settings) {
        errorMessage = logger.configJsonIsNotPresentSingle(key, "defaultValue", defaultValue);
        return evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(remoteConfig), user, toMessage(errorMessage), void 0, 1000);
    }
    if (!Utils_hasOwnProperty(settings, key)) {
        var availableKeys = new LazyString(settings, function (settings) { return formatStringList(Object.keys(settings)); });
        errorMessage = logger.settingEvaluationFailedDueToMissingKey(key, "defaultValue", defaultValue, availableKeys);
        return evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(remoteConfig), user, toMessage(errorMessage), void 0, 1001);
    }
    var evaluateResult = evaluator.evaluate(defaultValue, new EvaluateContext(key, settings[key], user, settings));
    return evaluationDetailsFromEvaluateResult(key, evaluateResult, getTimestampAsDate(remoteConfig), user);
}
function evaluateAll(evaluator, settings, user, remoteConfig, logger, defaultReturnValue) {
    var errors;
    if (!checkSettingsAvailable(settings, logger, defaultReturnValue)) {
        return [[], errors];
    }
    var evaluationDetailsArray = [];
    for (var key in settings) {
        if (!Utils_hasOwnProperty(settings, key))
            continue;
        var setting = settings[key];
        var evaluationDetails = void 0;
        try {
            var evaluateResult = evaluator.evaluate(null, new EvaluateContext(key, setting, user, settings));
            evaluationDetails = evaluationDetailsFromEvaluateResult(key, evaluateResult, getTimestampAsDate(remoteConfig), user);
        }
        catch (err) {
            errors !== null && errors !== void 0 ? errors : (errors = []);
            errors.push(err);
            evaluationDetails = evaluationDetailsFromDefaultValue(key, null, getTimestampAsDate(remoteConfig), user, errorToString(err), err, getEvaluationErrorCode(err));
        }
        evaluationDetailsArray.push(evaluationDetails);
    }
    return [evaluationDetailsArray, errors];
}
function checkSettingsAvailable(settings, logger, defaultReturnValue) {
    if (!settings) {
        logger.configJsonIsNotPresent(defaultReturnValue);
        return false;
    }
    return true;
}
function findKeyAndValue(settings, variationId, logger, defaultReturnValue) {
    if (!checkSettingsAvailable(settings, logger, defaultReturnValue)) {
        return null;
    }
    for (var settingKey in settings) {
        if (!Utils_hasOwnProperty(settings, settingKey))
            continue;
        var setting = settings[settingKey];
        var settingType = getSettingType(setting);
        if (variationId === setting.i) {
            return { settingKey: settingKey, settingValue: unwrapValue(setting.v, settingType) };
        }
        var targetingRules = setting.r;
        if (targetingRules === null || targetingRules === void 0 ? void 0 : targetingRules.length) {
            for (var i = 0; i < targetingRules.length; i++) {
                var targetingRule = targetingRules[i];
                if (hasPercentageOptions(targetingRule)) {
                    var percentageOptions_1 = targetingRule.p;
                    for (var j = 0; j < percentageOptions_1.length; j++) {
                        var percentageOption = percentageOptions_1[j];
                        if (variationId === percentageOption.i) {
                            return { settingKey: settingKey, settingValue: unwrapValue(percentageOption.v, settingType) };
                        }
                    }
                }
                else {
                    var simpleValue = targetingRule.s;
                    if (variationId === simpleValue.i) {
                        return { settingKey: settingKey, settingValue: unwrapValue(simpleValue.v, settingType) };
                    }
                }
            }
        }
        var percentageOptions = setting.p;
        if (percentageOptions === null || percentageOptions === void 0 ? void 0 : percentageOptions.length) {
            for (var i = 0; i < percentageOptions.length; i++) {
                var percentageOption = percentageOptions[i];
                if (variationId === percentageOption.i) {
                    return { settingKey: settingKey, settingValue: unwrapValue(percentageOption.v, settingType) };
                }
            }
        }
    }
    logger.settingForVariationIdIsNotPresent(variationId);
    return null;
}
var EvaluationError = (function (_super) {
    __extends(EvaluationError, _super);
    function EvaluationError(errorCode, message) {
        var _this = _super.call(this, message) || this;
        _this.errorCode = errorCode;
        _this.message = message;
        _this.name = EvaluationError.name;
        ensurePrototype(_this, EvaluationError);
        return _this;
    }
    return EvaluationError;
}(Error));

function getEvaluationErrorCode(err) {
    return !(err instanceof Error) ? -1
        : err instanceof EvaluationError ? err.errorCode
            : err instanceof InvalidConfigModelError ? 1
                : -1;
}

;// ./src/ConfigCatClient.ts









var ConfigCatClientCache = (function () {
    function ConfigCatClientCache() {
        this.instances = createMap();
    }
    ConfigCatClientCache.prototype.getOrCreate = function (options) {
        var instance;
        var cachedInstance = this.instances[options.sdkKey];
        if (cachedInstance) {
            var weakRef = cachedInstance[0];
            instance = weakRef.deref();
            if (instance) {
                return [instance, true];
            }
        }
        var token = {};
        instance = new ConfigCatClient(options, token);
        this.instances[options.sdkKey] = [createWeakRef(instance), token];
        return [instance, false];
    };
    ConfigCatClientCache.prototype.remove = function (sdkKey, cacheToken) {
        var cachedInstance = this.instances[sdkKey];
        if (cachedInstance) {
            var weakRef = cachedInstance[0], token = cachedInstance[1];
            var instanceIsAvailable = !!weakRef.deref();
            if (!instanceIsAvailable || token === cacheToken) {
                delete this.instances[sdkKey];
                return instanceIsAvailable;
            }
        }
        return false;
    };
    ConfigCatClientCache.prototype.clear = function () {
        var removedInstances = [];
        for (var sdkKey in this.instances) {
            var weakRef = this.instances[sdkKey][0];
            var instance = weakRef.deref();
            if (instance) {
                removedInstances.push(instance);
            }
            delete this.instances[sdkKey];
        }
        return removedInstances;
    };
    return ConfigCatClientCache;
}());

var clientInstanceCache = new ConfigCatClientCache();
var ConfigCatClient = (function () {
    function ConfigCatClient(options, cacheToken) {
        var _a;
        this.cacheToken = cacheToken;
        this.options = options;
        if (options.logger.isEnabled(4)) {
            options.logger.debug(FormattableLogMessage.from("OPTIONS")(ConfigCatClient_templateObject_1 || (ConfigCatClient_templateObject_1 = __makeTemplateObject(["Initializing ConfigCatClient. Options: ", ""], ["Initializing ConfigCatClient. Options: ", ""])), JSON.stringify(getSerializableOptions(options))));
        }
        this.hooks = options.yieldHooks();
        this.hooks.configCatClient = this;
        this.defaultUser = options.defaultUser;
        this.evaluator = new RolloutEvaluator(options.logger);
        if (((_a = options.flagOverrides) === null || _a === void 0 ? void 0 : _a.behaviour) !== 0) {
            this.configService = options.createConfigService();
        }
        else {
            this.configService = null;
            this.hooks.emit("clientReady", 1);
        }
        this.suppressFinalize = registerForFinalization(this, { sdkKey: options.sdkKey, cacheToken: cacheToken, configService: this.configService, logger: options.logger });
    }
    Object.defineProperty(ConfigCatClient, "instanceCache", {
        get: function () { return clientInstanceCache; },
        enumerable: false,
        configurable: true
    });
    ConfigCatClient.get = function (sdkKey, pollingMode, options, configCatKernel) {
        var _a;
        ensureStringArg(sdkKey, "sdkKey", true);
        options == null || ensureObjectArg(options, "options");
        var internalOptions = pollingMode === 0 ? new AutoPollOptions(sdkKey, configCatKernel, options)
            : pollingMode === 2 ? new ManualPollOptions(sdkKey, configCatKernel, options)
                : pollingMode === 1 ? new LazyLoadOptions(sdkKey, configCatKernel, options)
                    : ensureEnumArg(pollingMode, "pollingMode", "PollingMode", function () { return false; });
        if (((_a = internalOptions.flagOverrides) === null || _a === void 0 ? void 0 : _a.behaviour) !== 0 && !isValidSdkKey(sdkKey, internalOptions.baseUrlOverriden)) {
            throwInvalidArg("sdkKey", "Expected a string matching the SDK Key format, got '".concat(toStringSafe(sdkKey), "'."));
        }
        var _b = clientInstanceCache.getOrCreate(internalOptions), instance = _b[0], instanceAlreadyCreated = _b[1];
        if (instanceAlreadyCreated && options) {
            internalOptions.logger.clientIsAlreadyCreated(sdkKey);
        }
        return instance;
    };
    ConfigCatClient.prototype.initConfigService = function (instance) {
        this.configService = instance;
    };
    ConfigCatClient.finalize = function (data) {
        logMethodDebug(data.logger, "finalize");
        if (data.cacheToken) {
            clientInstanceCache.remove(data.sdkKey, data.cacheToken);
        }
        ConfigCatClient.close(data.configService, data.logger);
    };
    ConfigCatClient.close = function (configService, logger, hooks) {
        logMethodDebug(logger, "close");
        hooks === null || hooks === void 0 ? void 0 : hooks.tryDisconnect();
        configService === null || configService === void 0 ? void 0 : configService.dispose();
    };
    ConfigCatClient.prototype.dispose = function () {
        var options = this.options;
        logMethodDebug(options.logger, "dispose");
        if (this.cacheToken) {
            clientInstanceCache.remove(options.sdkKey, this.cacheToken);
        }
        ConfigCatClient.close(this.configService, options.logger, this.hooks);
        this.suppressFinalize();
    };
    ConfigCatClient.disposeAll = function () {
        var removedInstances = clientInstanceCache.clear();
        var errors;
        for (var _i = 0, removedInstances_1 = removedInstances; _i < removedInstances_1.length; _i++) {
            var instance = removedInstances_1[_i];
            try {
                ConfigCatClient.close(instance.configService, instance.options.logger, instance.hooks);
                instance.suppressFinalize();
            }
            catch (err) {
                errors !== null && errors !== void 0 ? errors : (errors = []);
                errors.push(err);
            }
        }
        if (errors) {
            throw typeof AggregateError === "function" ? AggregateError(errors) : errors.pop();
        }
    };
    ConfigCatClient.prototype.getValueAsync = function (key, defaultValue, user) {
        return __awaiter(this, void 0, void 0, function () {
            var value, evaluationDetails, remoteConfig, settings, err_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "getValueAsync");
                        validateSettingKey(key);
                        ensureAllowedDefaultValue(defaultValue);
                        validateUserObject(user);
                        remoteConfig = null;
                        user !== null && user !== void 0 ? user : (user = this.defaultUser);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        settings = void 0;
                        return [4, this.getSettingsAsync()];
                    case 2:
                        _a = _b.sent(), settings = _a[0], remoteConfig = _a[1];
                        evaluationDetails = evaluate(this.evaluator, settings, key, defaultValue, user, remoteConfig, this.options.logger);
                        value = evaluationDetails.value;
                        return [3, 4];
                    case 3:
                        err_1 = _b.sent();
                        this.options.logger.settingEvaluationErrorSingle("getValueAsync", key, "defaultValue", defaultValue, err_1);
                        evaluationDetails = evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(remoteConfig), user, errorToString(err_1), err_1, getEvaluationErrorCode(err_1));
                        value = defaultValue;
                        return [3, 4];
                    case 4:
                        this.hooks.emit("flagEvaluated", evaluationDetails);
                        return [2, value];
                }
            });
        });
    };
    ConfigCatClient.prototype.getValueDetailsAsync = function (key, defaultValue, user) {
        return __awaiter(this, void 0, void 0, function () {
            var evaluationDetails, remoteConfig, settings, err_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "getValueDetailsAsync");
                        validateSettingKey(key);
                        ensureAllowedDefaultValue(defaultValue);
                        validateUserObject(user);
                        remoteConfig = null;
                        user !== null && user !== void 0 ? user : (user = this.defaultUser);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        settings = void 0;
                        return [4, this.getSettingsAsync()];
                    case 2:
                        _a = _b.sent(), settings = _a[0], remoteConfig = _a[1];
                        evaluationDetails = evaluate(this.evaluator, settings, key, defaultValue, user, remoteConfig, this.options.logger);
                        return [3, 4];
                    case 3:
                        err_2 = _b.sent();
                        this.options.logger.settingEvaluationErrorSingle("getValueDetailsAsync", key, "defaultValue", defaultValue, err_2);
                        evaluationDetails = evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(remoteConfig), user, errorToString(err_2), err_2, getEvaluationErrorCode(err_2));
                        return [3, 4];
                    case 4:
                        this.hooks.emit("flagEvaluated", evaluationDetails);
                        return [2, evaluationDetails];
                }
            });
        });
    };
    ConfigCatClient.prototype.getAllKeysAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var defaultReturnValue, settings, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "getAllKeysAsync");
                        defaultReturnValue = "empty array";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.getSettingsAsync()];
                    case 2:
                        settings = (_a.sent())[0];
                        if (!checkSettingsAvailable(settings, this.options.logger, defaultReturnValue)) {
                            return [2, []];
                        }
                        return [2, Object.keys(settings)];
                    case 3:
                        err_3 = _a.sent();
                        this.options.logger.settingEvaluationError("getAllKeysAsync", defaultReturnValue, err_3);
                        return [2, []];
                    case 4: return [2];
                }
            });
        });
    };
    ConfigCatClient.prototype.getAllValuesAsync = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var defaultReturnValue, result, evaluationDetailsArray, evaluationErrors, _a, settings, remoteConfig, err_4, _i, evaluationDetailsArray_1, evaluationDetail;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "getAllValuesAsync");
                        validateUserObject(user);
                        defaultReturnValue = "empty array";
                        user !== null && user !== void 0 ? user : (user = this.defaultUser);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4, this.getSettingsAsync()];
                    case 2:
                        _a = _c.sent(), settings = _a[0], remoteConfig = _a[1];
                        _b = evaluateAll(this.evaluator, settings, user, remoteConfig, this.options.logger, defaultReturnValue), evaluationDetailsArray = _b[0], evaluationErrors = _b[1];
                        result = evaluationDetailsArray.map(function (details) { return ({ settingKey: details.key, settingValue: details.value }); });
                        return [3, 4];
                    case 3:
                        err_4 = _c.sent();
                        this.options.logger.settingEvaluationError("getAllValuesAsync", defaultReturnValue, err_4);
                        return [2, []];
                    case 4:
                        if (evaluationErrors === null || evaluationErrors === void 0 ? void 0 : evaluationErrors.length) {
                            this.options.logger.settingEvaluationError("getAllValuesAsync", "evaluation result", typeof AggregateError === "function" ? AggregateError(evaluationErrors) : evaluationErrors.pop());
                        }
                        for (_i = 0, evaluationDetailsArray_1 = evaluationDetailsArray; _i < evaluationDetailsArray_1.length; _i++) {
                            evaluationDetail = evaluationDetailsArray_1[_i];
                            this.hooks.emit("flagEvaluated", evaluationDetail);
                        }
                        return [2, result];
                }
            });
        });
    };
    ConfigCatClient.prototype.getAllValueDetailsAsync = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var defaultReturnValue, evaluationDetailsArray, evaluationErrors, _a, settings, remoteConfig, err_5, _i, evaluationDetailsArray_2, evaluationDetail;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "getAllValueDetailsAsync");
                        validateUserObject(user);
                        defaultReturnValue = "empty array";
                        user !== null && user !== void 0 ? user : (user = this.defaultUser);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4, this.getSettingsAsync()];
                    case 2:
                        _a = _c.sent(), settings = _a[0], remoteConfig = _a[1];
                        _b = evaluateAll(this.evaluator, settings, user, remoteConfig, this.options.logger, defaultReturnValue), evaluationDetailsArray = _b[0], evaluationErrors = _b[1];
                        return [3, 4];
                    case 3:
                        err_5 = _c.sent();
                        this.options.logger.settingEvaluationError("getAllValueDetailsAsync", defaultReturnValue, err_5);
                        return [2, []];
                    case 4:
                        if (evaluationErrors === null || evaluationErrors === void 0 ? void 0 : evaluationErrors.length) {
                            this.options.logger.settingEvaluationError("getAllValueDetailsAsync", "evaluation result", typeof AggregateError === "function" ? AggregateError(evaluationErrors) : evaluationErrors.pop());
                        }
                        for (_i = 0, evaluationDetailsArray_2 = evaluationDetailsArray; _i < evaluationDetailsArray_2.length; _i++) {
                            evaluationDetail = evaluationDetailsArray_2[_i];
                            this.hooks.emit("flagEvaluated", evaluationDetail);
                        }
                        return [2, evaluationDetailsArray];
                }
            });
        });
    };
    ConfigCatClient.prototype.getKeyAndValueAsync = function (variationId) {
        return __awaiter(this, void 0, void 0, function () {
            var defaultReturnValue, settings, err_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "getKeyAndValueAsync");
                        validateVariationId(variationId);
                        defaultReturnValue = "null";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.getSettingsAsync()];
                    case 2:
                        settings = (_a.sent())[0];
                        return [2, findKeyAndValue(settings, variationId, this.options.logger, defaultReturnValue)];
                    case 3:
                        err_6 = _a.sent();
                        this.options.logger.settingEvaluationError("getKeyAndValueAsync", defaultReturnValue, err_6);
                        return [2, null];
                    case 4: return [2];
                }
            });
        });
    };
    ConfigCatClient.prototype.forceRefreshAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, err_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "forceRefreshAsync");
                        if (!this.configService) return [3, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.configService.refreshConfigAsync()];
                    case 2:
                        result = (_a.sent())[0];
                        return [2, result];
                    case 3:
                        err_7 = _a.sent();
                        this.options.logger.clientMethodError("forceRefreshAsync", err_7);
                        return [2, refreshResultFromFailure(-1, errorToString(err_7), err_7)];
                    case 4: return [3, 6];
                    case 5: return [2, refreshResultFromFailure(1, "Client is configured to use the LocalOnly override behavior, which prevents synchronization with external cache and making HTTP requests.")];
                    case 6: return [2];
                }
            });
        });
    };
    ConfigCatClient.prototype.setDefaultUser = function (defaultUser) {
        this.defaultUser = ensureObjectArg(defaultUser, "defaultUser");
    };
    ConfigCatClient.prototype.clearDefaultUser = function () {
        this.defaultUser = void 0;
    };
    Object.defineProperty(ConfigCatClient.prototype, "isOffline", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this.configService) === null || _a === void 0 ? void 0 : _a.isOffline) !== null && _b !== void 0 ? _b : true;
        },
        enumerable: false,
        configurable: true
    });
    ConfigCatClient.prototype.setOnline = function () {
        if (this.configService) {
            this.configService.setOnline();
        }
        else {
            this.options.logger.configServiceMethodHasNoEffectDueToOverrideBehavior(nameOfOverrideBehaviour(0), "setOnline");
        }
    };
    ConfigCatClient.prototype.setOffline = function () {
        var _a;
        (_a = this.configService) === null || _a === void 0 ? void 0 : _a.setOffline();
    };
    ConfigCatClient.prototype.waitForReady = function () {
        var configService = this.configService;
        return configService ? configService.readyPromise : Promise.resolve(1);
    };
    ConfigCatClient.prototype.snapshot = function () {
        var _a, _b, _c;
        var _this = this;
        var getRemoteConfig = function () {
            var _a;
            var config = _this.options.cache.getInMemory();
            var settings = !config.isEmpty ? (_a = config.config.f) !== null && _a !== void 0 ? _a : createMap() : null;
            return [settings, config];
        };
        var remoteSettings;
        var remoteConfig;
        try {
            var flagOverrides = this.options.flagOverrides;
            if (flagOverrides) {
                var localSettings = flagOverrides.dataSource.getOverrides();
                switch (flagOverrides.behaviour) {
                    case 0:
                        return new Snapshot(localSettings, null, this);
                    case 1:
                        _a = getRemoteConfig(), remoteSettings = _a[0], remoteConfig = _a[1];
                        return new Snapshot(remoteSettings && hasAnyOwnProperties(remoteSettings) ? __assign(__assign({}, remoteSettings), localSettings) : localSettings, remoteConfig, this);
                    case 2:
                        _b = getRemoteConfig(), remoteSettings = _b[0], remoteConfig = _b[1];
                        return new Snapshot(remoteSettings && hasAnyOwnProperties(remoteSettings) ? __assign(__assign({}, localSettings), remoteSettings) : localSettings, remoteConfig, this);
                }
            }
            _c = getRemoteConfig(), remoteSettings = _c[0], remoteConfig = _c[1];
            return new Snapshot(remoteSettings, remoteConfig, this);
        }
        catch (err) {
            this.options.logger.clientMethodError("snapshot", err);
            return new Snapshot(createMap(), null, this);
        }
    };
    ConfigCatClient.prototype.getSettingsAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var getRemoteConfigAsync, flagOverrides, remoteSettings, remoteConfig, localSettings, _a;
            var _b, _c;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        logMethodDebug(this.options.logger, "getSettingsAsync");
                        getRemoteConfigAsync = function () { return __awaiter(_this, void 0, void 0, function () {
                            var config, settings;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4, this.configService.getConfigAsync()];
                                    case 1:
                                        config = _b.sent();
                                        settings = !config.isEmpty ? (_a = config.config.f) !== null && _a !== void 0 ? _a : createMap() : null;
                                        return [2, [settings, config]];
                                }
                            });
                        }); };
                        flagOverrides = this.options.flagOverrides;
                        if (!flagOverrides) return [3, 6];
                        remoteSettings = void 0;
                        remoteConfig = void 0;
                        localSettings = flagOverrides.dataSource.getOverrides();
                        _a = flagOverrides.behaviour;
                        switch (_a) {
                            case 0: return [3, 1];
                            case 1: return [3, 2];
                            case 2: return [3, 4];
                        }
                        return [3, 6];
                    case 1: return [2, [localSettings, null]];
                    case 2: return [4, getRemoteConfigAsync()];
                    case 3:
                        _b = _d.sent(), remoteSettings = _b[0], remoteConfig = _b[1];
                        return [2, [remoteSettings && hasAnyOwnProperties(remoteSettings) ? __assign(__assign({}, remoteSettings), localSettings) : localSettings, remoteConfig]];
                    case 4: return [4, getRemoteConfigAsync()];
                    case 5:
                        _c = _d.sent(), remoteSettings = _c[0], remoteConfig = _c[1];
                        return [2, [remoteSettings && hasAnyOwnProperties(remoteSettings) ? __assign(__assign({}, localSettings), remoteSettings) : localSettings, remoteConfig]];
                    case 6: return [4, getRemoteConfigAsync()];
                    case 7: return [2, _d.sent()];
                }
            });
        });
    };
    ConfigCatClient.prototype.on = function (eventName, listener) {
        this.hooks.on(eventName, listener);
        return this;
    };
    ConfigCatClient.prototype.once = function (eventName, listener) {
        this.hooks.once(eventName, listener);
        return this;
    };
    ConfigCatClient.prototype.removeListener = function (eventName, listener) {
        this.hooks.removeListener(eventName, listener);
        return this;
    };
    ConfigCatClient.prototype.removeAllListeners = function (eventName) {
        this.hooks.removeAllListeners(eventName);
        return this;
    };
    ConfigCatClient.prototype.listeners = function (eventName) {
        return this.hooks.listeners(eventName);
    };
    ConfigCatClient.prototype.listenerCount = function (eventName) {
        return this.hooks.listenerCount(eventName);
    };
    ConfigCatClient.prototype.eventNames = function () {
        return this.hooks.eventNames();
    };
    return ConfigCatClient;
}());

var configCatClientPrototype = ConfigCatClient.prototype;
configCatClientPrototype.addListener = configCatClientPrototype.on;
configCatClientPrototype.off = configCatClientPrototype.removeListener;
var Snapshot = (function () {
    function Snapshot(mergedSettings, remoteConfig, client) {
        this.mergedSettings = mergedSettings;
        this.remoteConfig = remoteConfig;
        this.defaultUser = client["defaultUser"];
        this.evaluator = client["evaluator"];
        this.options = client["options"];
        this.cacheState = remoteConfig
            ? client["configService"].getCacheState(remoteConfig)
            : 1;
    }
    Object.defineProperty(Snapshot.prototype, "fetchedConfig", {
        get: function () {
            var config = this.remoteConfig;
            return config && !config.isEmpty ? config.config : null;
        },
        enumerable: false,
        configurable: true
    });
    Snapshot.prototype.getAllKeys = function () { return this.mergedSettings ? Object.keys(this.mergedSettings) : []; };
    Snapshot.prototype.getValue = function (key, defaultValue, user) {
        logMethodDebug(this.options.logger, "Snapshot.getValue");
        validateSettingKey(key);
        ensureAllowedDefaultValue(defaultValue);
        validateUserObject(user);
        var value, evaluationDetails;
        user !== null && user !== void 0 ? user : (user = this.defaultUser);
        try {
            evaluationDetails = evaluate(this.evaluator, this.mergedSettings, key, defaultValue, user, this.remoteConfig, this.options.logger);
            value = evaluationDetails.value;
        }
        catch (err) {
            this.options.logger.settingEvaluationErrorSingle("Snapshot.getValue", key, "defaultValue", defaultValue, err);
            evaluationDetails = evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(this.remoteConfig), user, errorToString(err), err, getEvaluationErrorCode(err));
            value = defaultValue;
        }
        this.options.hooks.emit("flagEvaluated", evaluationDetails);
        return value;
    };
    Snapshot.prototype.getValueDetails = function (key, defaultValue, user) {
        logMethodDebug(this.options.logger, "Snapshot.getValueDetails");
        validateSettingKey(key);
        ensureAllowedDefaultValue(defaultValue);
        validateUserObject(user);
        var evaluationDetails;
        user !== null && user !== void 0 ? user : (user = this.defaultUser);
        try {
            evaluationDetails = evaluate(this.evaluator, this.mergedSettings, key, defaultValue, user, this.remoteConfig, this.options.logger);
        }
        catch (err) {
            this.options.logger.settingEvaluationErrorSingle("Snapshot.getValueDetails", key, "defaultValue", defaultValue, err);
            evaluationDetails = evaluationDetailsFromDefaultValue(key, defaultValue, getTimestampAsDate(this.remoteConfig), user, errorToString(err), err, getEvaluationErrorCode(err));
        }
        this.options.hooks.emit("flagEvaluated", evaluationDetails);
        return evaluationDetails;
    };
    Snapshot.prototype.getKeyAndValue = function (variationId) {
        logMethodDebug(this.options.logger, "Snapshot.getKeyAndValue");
        validateVariationId(variationId);
        var defaultReturnValue = "null";
        try {
            return findKeyAndValue(this.mergedSettings, variationId, this.options.logger, defaultReturnValue);
        }
        catch (err) {
            this.options.logger.settingEvaluationError("Snapshot.getKeyAndValue", defaultReturnValue, err);
            return null;
        }
    };
    return Snapshot;
}());
function isValidSdkKey(sdkKey, customBaseUrl) {
    if (customBaseUrl && sdkKey.length > PROXY_SDKKEY_PREFIX.length && startsWith(sdkKey, PROXY_SDKKEY_PREFIX)) {
        return true;
    }
    var components = sdkKey.split("/");
    var keyLength = 22;
    switch (components.length) {
        case 2: return components[0].length === keyLength && components[1].length === keyLength;
        case 3: return components[0] === "configcat-sdk-1" && components[1].length === keyLength && components[2].length === keyLength;
        default: return false;
    }
}
function validateSettingKey(key) {
    ensureStringArg(key, "key", true);
}
function ensureAllowedDefaultValue(value) {
    if (value != null && !isAllowedValue(value)) {
        throwInvalidArg("defaultValue", "The default value must be boolean, number, string, null or undefined.", void 0, TypeError);
    }
}
function validateUserObject(user) {
    user == null || ensureObjectArg(user, "user");
}
function validateVariationId(variationId) {
    ensureStringArg(variationId, "variationId", true);
}
function getSerializableOptions(options) {
    return shallowClone(options, function (key, value) {
        if (value == null) {
            return value;
        }
        if (key === "defaultUser") {
            return getUserAttributes(value);
        }
        if (key === "flagOverrides") {
            return shallowClone(value, function (_, value) { return isObject(value) ? toStringSafe(value) : value; });
        }
        return isObject(value) ? toStringSafe(value) : value;
    });
}
var registerForFinalization = function (client, data) {
    if (typeof FinalizationRegistry === "function") {
        var finalizationRegistry_1 = new FinalizationRegistry(function (data) { return ConfigCatClient["finalize"](data); });
        registerForFinalization = function (client, data) {
            var unregisterToken = {};
            finalizationRegistry_1.register(client, data, unregisterToken);
            return function () { return finalizationRegistry_1.unregister(unregisterToken); };
        };
    }
    else {
        registerForFinalization = function () { return function () { }; };
    }
    return registerForFinalization(client, data);
};
var ConfigCatClient_templateObject_1;

;// ./src/index.pubternals.core.ts




function getClient(sdkKey, pollingMode, options, configCatKernel) {
    return ConfigCatClient.get(sdkKey, pollingMode, options, configCatKernel);
}
function disposeAllClients() {
    ConfigCatClient.disposeAll();
}
function createConsoleLogger(logLevel, eol) {
    ensureEnumArg(logLevel, "logLevel", "LogLevel", function (value) { return nameOfLogLevel(value) !== void 0; });
    eol == null || ensureStringArg(eol, "eol", true);
    return new ConfigCatConsoleLogger(logLevel, eol);
}
function createFlagOverridesFromMap(map, behaviour, watchChanges) {
    ensureObjectArg(map, "map");
    ensureEnumArg(behaviour, "behaviour", "OverrideBehaviour", function (value) { return nameOfOverrideBehaviour(value) !== void 0; });
    watchChanges == null || ensureBooleanArg(watchChanges, "watchChanges");
    return { dataSource: new MapOverrideDataSource(map, watchChanges), behaviour: behaviour };
}
function createFlagOverridesFromQueryParams(behaviour, watchChanges, paramPrefix, queryStringProvider) {
    ensureEnumArg(behaviour, "behaviour", "OverrideBehaviour", function (value) { return nameOfOverrideBehaviour(value) !== void 0; });
    watchChanges == null || ensureBooleanArg(watchChanges, "watchChanges");
    paramPrefix == null || ensureStringArg(paramPrefix, "paramPrefix");
    queryStringProvider == null || ensureObjectArg(queryStringProvider, "queryStringProvider");
    return { dataSource: new QueryParamsOverrideDataSource(watchChanges, paramPrefix, queryStringProvider), behaviour: behaviour };
}

;// ./src/shared/IndexedDBConfigCache.ts


var OBJECT_STORE_NAME = "configCache";
var IndexedDBConfigCache = (function () {
    function IndexedDBConfigCache(dbConnectionFactory) {
        this.dbConnectionFactory = dbConnectionFactory;
    }
    IndexedDBConfigCache.tryGetFactory = function () {
        var dbConnectionFactory = getDBConnectionFactory();
        if (dbConnectionFactory) {
            return function (options) { return new ExternalConfigCache(new IndexedDBConfigCache(dbConnectionFactory), options.logger); };
        }
    };
    IndexedDBConfigCache.prototype.set = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.dbConnectionFactory()];
                    case 1:
                        db = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        return [4, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
                                transaction.oncomplete = function () { return resolve(); };
                                transaction.onerror = function (event) { return reject(event.target.error); };
                                var store = transaction.objectStore(OBJECT_STORE_NAME);
                                store.put(value, key);
                            })];
                    case 3:
                        _a.sent();
                        return [3, 5];
                    case 4:
                        db.close();
                        return [7];
                    case 5: return [2];
                }
            });
        });
    };
    IndexedDBConfigCache.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.dbConnectionFactory()];
                    case 1:
                        db = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        return [4, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
                                var value;
                                transaction.oncomplete = function () { return resolve(value); };
                                transaction.onerror = function (event) { return reject(event.target.error); };
                                var store = transaction.objectStore(OBJECT_STORE_NAME);
                                var storeRequest = store.get(key);
                                storeRequest.onsuccess = function (event) { return value = event.target.result; };
                            })];
                    case 3: return [2, _a.sent()];
                    case 4:
                        db.close();
                        return [7];
                    case 5: return [2];
                }
            });
        });
    };
    return IndexedDBConfigCache;
}());

function getDBConnectionFactory() {
    if (typeof indexedDB !== "undefined") {
        try {
            var dbConnectionFactory = function () { return new Promise(function (resolve, reject) {
                var openRequest = indexedDB.open("@configcat/sdk");
                openRequest.onupgradeneeded = function (event) {
                    return event.target.result.createObjectStore(OBJECT_STORE_NAME);
                };
                openRequest.onsuccess = function (event) { return resolve(event.target.result); };
                openRequest.onerror = function (event) { return reject(event.target.error); };
            }); };
            dbConnectionFactory().then(function (db) { return db.close(); }).catch(function () { });
            return dbConnectionFactory;
        }
        catch (_a) { }
    }
}

;// ./src/Version.ts
/* harmony default export */ const Version = ("1.1.0");

;// ./src/browser/LocalStorageConfigCache.ts

var LocalStorageConfigCache = (function () {
    function LocalStorageConfigCache(storage) {
        this.storage = storage;
    }
    LocalStorageConfigCache.tryGetFactory = function () {
        var localStorage = getLocalStorage();
        if (localStorage) {
            return function (options) { return new ExternalConfigCache(new LocalStorageConfigCache(localStorage), options.logger); };
        }
    };
    LocalStorageConfigCache.prototype.set = function (key, value) {
        this.storage.setItem(key, toUtf8Base64(value));
    };
    LocalStorageConfigCache.prototype.get = function (key) {
        var configString = this.storage.getItem(key);
        if (configString) {
            return fromUtf8Base64(configString);
        }
    };
    return LocalStorageConfigCache;
}());

function getLocalStorage() {
    if (typeof localStorage !== "undefined") {
        var testKey = "__configcat_localStorage_test";
        try {
            var storage = localStorage;
            storage.setItem(testKey, testKey);
            var retrievedItem = void 0;
            try {
                retrievedItem = storage.getItem(testKey);
            }
            finally {
                storage.removeItem(testKey);
            }
            if (retrievedItem === testKey) {
                return storage;
            }
        }
        catch (_a) { }
    }
}
function toUtf8Base64(str) {
    str = encodeURIComponent(str);
    str = str.replace(/%([0-9A-F]{2})/g, function (_, p1) { return String.fromCharCode(parseInt(p1, 16)); });
    return btoa(str);
}
function fromUtf8Base64(str) {
    str = atob(str);
    str = str.replace(/[%\x80-\xFF]/g, function (m) { return "%" + m.charCodeAt(0).toString(16); });
    return decodeURIComponent(str);
}

;// ./src/browser/XmlHttpRequestConfigFetcher.ts





var XmlHttpRequestConfigFetcher = (function () {
    function XmlHttpRequestConfigFetcher() {
        this.requestRetryDelayMs = FETCH_RETRY_DELAY_MS;
        this.disposeToken = new AbortToken();
    }
    XmlHttpRequestConfigFetcher.getFactory = function () {
        return function () { return new XmlHttpRequestConfigFetcher(); };
    };
    XmlHttpRequestConfigFetcher.prototype.dispose = function () {
        this.disposeToken.abort();
    };
    XmlHttpRequestConfigFetcher.prototype.fetchAsync = function (request) {
        return this[fetchInternalAsyncMethodName](request);
    };
    XmlHttpRequestConfigFetcher.prototype.fetchWithRetryAsync = function (request, logger) {
        return __awaiter(this, void 0, void 0, function () {
            var debugLogger, requestId, url, isCustomUrl, headers, timeoutMs, retryNumber, fetchResponse, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        debugLogger = logger === null || logger === void 0 ? void 0 : logger.ifDebug;
                        if (debugLogger) {
                            requestId = randomUUID();
                            debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(XmlHttpRequestConfigFetcher_templateObject_1 || (XmlHttpRequestConfigFetcher_templateObject_1 = __makeTemplateObject(["[", "] Preparing request..."], ["[", "] Preparing request..."])), requestId));
                        }
                        url = request.url;
                        isCustomUrl = !isCdnUrl(request.url);
                        headers = request.headers, timeoutMs = request.timeoutMs;
                        url = adjustUrlForBrowser(url, request);
                        retryNumber = 0;
                        _a.label = 1;
                    case 1:
                        if (this.disposeToken.aborted) {
                            throw new FetchError("abort");
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4, this.fetchCoreAsync(url, isCustomUrl ? headers : void 0, timeoutMs, { debugLogger: debugLogger, requestId: requestId, fetchResponse: void 0 })];
                    case 3:
                        fetchResponse = _a.sent();
                        if (FetchResponse.prototype.isExpected.call(fetchResponse)) {
                            return [2, fetchResponse];
                        }
                        debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(XmlHttpRequestConfigFetcher_templateObject_2 || (XmlHttpRequestConfigFetcher_templateObject_2 = __makeTemplateObject(["[", "] Received unexpected status code."], ["[", "] Received unexpected status code."])), requestId));
                        if (retryNumber >= FETCH_RETRY_LIMIT) {
                            return [2, fetchResponse];
                        }
                        return [3, 5];
                    case 4:
                        err_1 = _a.sent();
                        if (err_1 instanceof FetchError) {
                            switch (err_1.cause) {
                                case "abort":
                                    debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(XmlHttpRequestConfigFetcher_templateObject_3 || (XmlHttpRequestConfigFetcher_templateObject_3 = __makeTemplateObject(["[", "] Request aborted."], ["[", "] Request aborted."])), requestId));
                                    throw err_1;
                                case "timeout":
                                    debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(XmlHttpRequestConfigFetcher_templateObject_4 || (XmlHttpRequestConfigFetcher_templateObject_4 = __makeTemplateObject(["[", "] Request timed out."], ["[", "] Request timed out."])), requestId));
                                    break;
                                case "failure":
                                    debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(XmlHttpRequestConfigFetcher_templateObject_5 || (XmlHttpRequestConfigFetcher_templateObject_5 = __makeTemplateObject(["[", "] Request failed."], ["[", "] Request failed."])), requestId));
                                    break;
                            }
                        }
                        else {
                            throw err_1;
                        }
                        if (retryNumber >= FETCH_RETRY_LIMIT) {
                            throw err_1;
                        }
                        return [3, 5];
                    case 5: return [4, delay(this.requestRetryDelayMs)];
                    case 6:
                        _a.sent();
                        debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(XmlHttpRequestConfigFetcher_templateObject_6 || (XmlHttpRequestConfigFetcher_templateObject_6 = __makeTemplateObject(["[", "] Trying request again..."], ["[", "] Trying request again..."])), requestId));
                        _a.label = 7;
                    case 7:
                        retryNumber++;
                        return [3, 1];
                    case 8: return [2];
                }
            });
        });
    };
    XmlHttpRequestConfigFetcher.prototype.fetchCoreAsync = function (url, headers, timeoutMs, context) {
        var _this = this;
        var unregisterFromDisposeToken;
        return new Promise(function (resolve, reject) {
            var debugLogger = context.debugLogger, requestId = context.requestId;
            var httpRequest = new XMLHttpRequest();
            unregisterFromDisposeToken = _this.disposeToken.registerCallback(function () { return httpRequest.abort(); });
            httpRequest.onreadystatechange = function () { return _this.handleStateChange(httpRequest, resolve, reject, context); };
            httpRequest.ontimeout = function () { var _a; return reject(new FetchError("timeout", httpRequest.timeout, (_a = context.fetchResponse) === null || _a === void 0 ? void 0 : _a["rayId"])); };
            httpRequest.onabort = function () { var _a; return reject(new FetchError("abort", (_a = context.fetchResponse) === null || _a === void 0 ? void 0 : _a["rayId"])); };
            httpRequest.onerror = function () { var _a; return reject(new FetchError("failure", void 0, (_a = context.fetchResponse) === null || _a === void 0 ? void 0 : _a["rayId"])); };
            httpRequest.open("GET", url, true);
            httpRequest.timeout = timeoutMs;
            if (headers) {
                _this.setRequestHeaders(httpRequest, headers);
            }
            debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME, "URL")(XmlHttpRequestConfigFetcher_templateObject_7 || (XmlHttpRequestConfigFetcher_templateObject_7 = __makeTemplateObject(["[", "] Sending request... (Url: '", "')"], ["[", "] Sending request... (Url: '", "')"])), requestId, url));
            httpRequest.send(null);
        }).finally(function () { return unregisterFromDisposeToken === null || unregisterFromDisposeToken === void 0 ? void 0 : unregisterFromDisposeToken(); });
    };
    XmlHttpRequestConfigFetcher.prototype.handleStateChange = function (httpRequest, resolve, reject, context) {
        var _a;
        try {
            var debugLogger = context.debugLogger, requestId = context.requestId;
            if (httpRequest.readyState === 2) {
                var statusCode = httpRequest.status, reasonPhrase = httpRequest.statusText;
                if (debugLogger) {
                    var eTagHeaderValue = httpRequest.getResponseHeader("ETag");
                    debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME, "STATUS_CODE", "REASON_PHRASE", "ETAG")(XmlHttpRequestConfigFetcher_templateObject_8 || (XmlHttpRequestConfigFetcher_templateObject_8 = __makeTemplateObject(["[", "] Received headers. (StatusCode: ", ", ReasonPhrase: '", "', ETag: '", "')"], ["[", "] Received headers. (StatusCode: ", ", ReasonPhrase: '", "', ETag: '", "')"])), requestId, statusCode, reasonPhrase, eTagHeaderValue !== null && eTagHeaderValue !== void 0 ? eTagHeaderValue : ""));
                }
                var headers = getResponseHeadersDefault(httpRequest);
                context.fetchResponse = new FetchResponse(statusCode, reasonPhrase, headers);
            }
            else if (httpRequest.readyState === 4) {
                var statusCode = httpRequest.status, reasonPhrase = httpRequest.statusText;
                if (statusCode) {
                    var fetchResponse = (_a = context.fetchResponse) !== null && _a !== void 0 ? _a : new FetchResponse(statusCode, reasonPhrase, getResponseHeadersDefault(httpRequest));
                    if (statusCode === 200) {
                        var body = fetchResponse.body = httpRequest.responseText;
                        debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME, "LENGTH")(XmlHttpRequestConfigFetcher_templateObject_9 || (XmlHttpRequestConfigFetcher_templateObject_9 = __makeTemplateObject(["[", "] Received body. (Length: ", ")"], ["[", "] Received body. (Length: ", ")"])), requestId, body.length));
                    }
                    resolve(fetchResponse);
                }
            }
        }
        catch (err) {
            reject(err);
        }
    };
    XmlHttpRequestConfigFetcher.prototype.setRequestHeaders = function (httpRequest, headers) {
    };
    return XmlHttpRequestConfigFetcher;
}());

XmlHttpRequestConfigFetcher.prototype[fetchInternalAsyncMethodName] = function (request, logger) {
    logMethodDebug(logger, "XmlHttpRequestConfigFetcher.fetchAsync");
    return this["fetchWithRetryAsync"](request, logger);
};
function getResponseHeadersDefault(httpRequest) {
    var headers = [];
    extractHeader("ETag", httpRequest, headers);
    extractHeader("CF-RAY", httpRequest, headers);
    return headers;
    function extractHeader(name, httpRequest, headers) {
        var value = httpRequest.getResponseHeader(name);
        if (value != null) {
            headers.push([name, value]);
        }
    }
}
var XmlHttpRequestConfigFetcher_templateObject_1, XmlHttpRequestConfigFetcher_templateObject_2, XmlHttpRequestConfigFetcher_templateObject_3, XmlHttpRequestConfigFetcher_templateObject_4, XmlHttpRequestConfigFetcher_templateObject_5, XmlHttpRequestConfigFetcher_templateObject_6, XmlHttpRequestConfigFetcher_templateObject_7, XmlHttpRequestConfigFetcher_templateObject_8, XmlHttpRequestConfigFetcher_templateObject_9;

;// ./src/shared/FetchApiConfigFetcher.ts





var FetchApiConfigFetcherBase = (function () {
    function FetchApiConfigFetcherBase(runsOnServerSide) {
        this.runsOnServerSide = runsOnServerSide;
        this.requestRetryDelayMs = FETCH_RETRY_DELAY_MS;
        this.disposeToken = new AbortToken();
    }
    FetchApiConfigFetcherBase.prototype.dispose = function () {
        this.disposeToken.abort();
    };
    FetchApiConfigFetcherBase.prototype.fetchAsync = function (request) {
        return this[fetchInternalAsyncMethodName](request);
    };
    FetchApiConfigFetcherBase.prototype.fetchWithRetryAsync = function (request, logger) {
        return __awaiter(this, void 0, void 0, function () {
            var debugLogger, requestId, url, isCustomUrl, lastETag, timeoutMs, _loop_1, this_1, retryNumber, state_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        debugLogger = logger === null || logger === void 0 ? void 0 : logger.ifDebug;
                        if (debugLogger) {
                            requestId = randomUUID();
                            debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(FetchApiConfigFetcher_templateObject_1 || (FetchApiConfigFetcher_templateObject_1 = __makeTemplateObject(["[", "] Preparing request..."], ["[", "] Preparing request..."])), requestId));
                        }
                        url = request.url;
                        isCustomUrl = !isCdnUrl(url);
                        lastETag = request.lastETag, timeoutMs = request.timeoutMs;
                        if (!this.runsOnServerSide) {
                            url = adjustUrlForBrowser(url, request);
                        }
                        _loop_1 = function (retryNumber) {
                            var requestInit, rayId, cleanup, controller_1, unregisterFromDisposeToken_1, timeoutId_1, response, statusCode, reasonPhrase, eTagHeaderValue, headers, fetchResponse, body, _d, err_1;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        if (this_1.disposeToken.aborted) {
                                            throw new FetchError("abort");
                                        }
                                        requestInit = Object.create(null);
                                        requestInit.method = "GET";
                                        if (isCustomUrl) {
                                            this_1.setRequestHeaders(requestInit, request.headers);
                                        }
                                        else if (this_1.runsOnServerSide) {
                                            setRequestHeadersDefault(requestInit, request.headers);
                                        }
                                        if (this_1.runsOnServerSide && lastETag) {
                                            ((_a = requestInit.headers) !== null && _a !== void 0 ? _a : (requestInit.headers = [])).push(["If-None-Match", lastETag]);
                                        }
                                        rayId = void 0;
                                        cleanup = void 0;
                                        if (typeof AbortController === "function") {
                                            controller_1 = new AbortController();
                                            unregisterFromDisposeToken_1 = this_1.disposeToken.registerCallback(function () { return controller_1.abort(); });
                                            requestInit.signal = controller_1.signal;
                                            timeoutId_1 = setTimeout(function () { return controller_1.abort(); }, timeoutMs);
                                            cleanup = function () {
                                                clearTimeout(timeoutId_1);
                                                unregisterFromDisposeToken_1();
                                            };
                                        }
                                        _e.label = 1;
                                    case 1:
                                        _e.trys.push([1, 5, 6, 7]);
                                        return [4, this_1.fetchCoreAsync(url, requestInit, requestId, debugLogger)];
                                    case 2:
                                        response = _e.sent();
                                        statusCode = response.status, reasonPhrase = response.statusText;
                                        if (debugLogger) {
                                            eTagHeaderValue = response.headers.get("ETag");
                                            debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME, "STATUS_CODE", "REASON_PHRASE", "ETAG")(FetchApiConfigFetcher_templateObject_2 || (FetchApiConfigFetcher_templateObject_2 = __makeTemplateObject(["[", "] Received headers. (StatusCode: ", ", ReasonPhrase: '", "', ETag: '", "')"], ["[", "] Received headers. (StatusCode: ", ", ReasonPhrase: '", "', ETag: '", "')"])), requestId, statusCode, reasonPhrase, eTagHeaderValue !== null && eTagHeaderValue !== void 0 ? eTagHeaderValue : ""));
                                        }
                                        headers = FetchApiConfigFetcher_getResponseHeadersDefault(response);
                                        fetchResponse = new FetchResponse(statusCode, reasonPhrase, headers);
                                        rayId = fetchResponse["rayId"];
                                        body = void 0;
                                        if (!(statusCode === 200)) return [3, 4];
                                        _d = fetchResponse;
                                        return [4, response.text()];
                                    case 3:
                                        body = _d.body = _e.sent();
                                        debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME, "LENGTH")(FetchApiConfigFetcher_templateObject_3 || (FetchApiConfigFetcher_templateObject_3 = __makeTemplateObject(["[", "] Received body. (Length: ", ")"], ["[", "] Received body. (Length: ", ")"])), requestId, body.length));
                                        _e.label = 4;
                                    case 4:
                                        if (FetchResponse.prototype.isExpected.call(fetchResponse)) {
                                            return [2, { value: fetchResponse }];
                                        }
                                        debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(FetchApiConfigFetcher_templateObject_4 || (FetchApiConfigFetcher_templateObject_4 = __makeTemplateObject(["[", "] Received unexpected status code."], ["[", "] Received unexpected status code."])), requestId));
                                        if (retryNumber >= FETCH_RETRY_LIMIT) {
                                            return [2, { value: fetchResponse }];
                                        }
                                        return [3, 7];
                                    case 5:
                                        err_1 = _e.sent();
                                        if (err_1 instanceof DOMException && err_1.name === "AbortError") {
                                            if (!((_b = requestInit.signal) === null || _b === void 0 ? void 0 : _b.aborted) || this_1.disposeToken.aborted) {
                                                debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(FetchApiConfigFetcher_templateObject_5 || (FetchApiConfigFetcher_templateObject_5 = __makeTemplateObject(["[", "] Request aborted."], ["[", "] Request aborted."])), requestId));
                                                throw new FetchError("abort", rayId);
                                            }
                                            debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(FetchApiConfigFetcher_templateObject_6 || (FetchApiConfigFetcher_templateObject_6 = __makeTemplateObject(["[", "] Request timed out."], ["[", "] Request timed out."])), requestId));
                                            if (retryNumber >= FETCH_RETRY_LIMIT) {
                                                throw new FetchError("timeout", timeoutMs, rayId);
                                            }
                                        }
                                        else {
                                            debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(FetchApiConfigFetcher_templateObject_7 || (FetchApiConfigFetcher_templateObject_7 = __makeTemplateObject(["[", "] Request failed."], ["[", "] Request failed."])), requestId));
                                            if (retryNumber >= FETCH_RETRY_LIMIT) {
                                                throw new FetchError("failure", err_1, rayId);
                                            }
                                        }
                                        return [3, 7];
                                    case 6:
                                        cleanup === null || cleanup === void 0 ? void 0 : cleanup();
                                        return [7];
                                    case 7: return [4, delay(this_1.requestRetryDelayMs)];
                                    case 8:
                                        _e.sent();
                                        debugLogger === null || debugLogger === void 0 ? void 0 : debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME)(FetchApiConfigFetcher_templateObject_8 || (FetchApiConfigFetcher_templateObject_8 = __makeTemplateObject(["[", "] Trying request again..."], ["[", "] Trying request again..."])), requestId));
                                        return [2];
                                }
                            });
                        };
                        this_1 = this;
                        retryNumber = 0;
                        _c.label = 1;
                    case 1: return [5, _loop_1(retryNumber)];
                    case 2:
                        state_1 = _c.sent();
                        if (typeof state_1 === "object")
                            return [2, state_1.value];
                        _c.label = 3;
                    case 3:
                        retryNumber++;
                        return [3, 1];
                    case 4: return [2];
                }
            });
        });
    };
    FetchApiConfigFetcherBase.prototype.fetchCoreAsync = function (url, requestInit, requestId, debugLogger) {
        if (debugLogger) {
            if (this.runsOnServerSide) {
                var ifNoneMatchHeaderValue = void 0;
                var requestHeaders = requestInit.headers;
                if (requestHeaders) {
                    for (var _i = 0, requestHeaders_1 = requestHeaders; _i < requestHeaders_1.length; _i++) {
                        var _a = requestHeaders_1[_i], key = _a[0], value = _a[1];
                        if (key.toLowerCase() === "if-none-match") {
                            ifNoneMatchHeaderValue = value;
                            break;
                        }
                    }
                }
                debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME, "URL", "IF_NONE_MATCH")(FetchApiConfigFetcher_templateObject_9 || (FetchApiConfigFetcher_templateObject_9 = __makeTemplateObject(["[", "] Sending request... (Url: '", "', If-None-Match: '", "')"], ["[", "] Sending request... (Url: '", "', If-None-Match: '", "')"])), requestId, url, ifNoneMatchHeaderValue !== null && ifNoneMatchHeaderValue !== void 0 ? ifNoneMatchHeaderValue : ""));
            }
            else {
                debugLogger.debug(FormattableLogMessage.from(REQUEST_ID_ARG_NAME, "URL")(FetchApiConfigFetcher_templateObject_10 || (FetchApiConfigFetcher_templateObject_10 = __makeTemplateObject(["[", "] Sending request... (Url: '", "')"], ["[", "] Sending request... (Url: '", "')"])), requestId, url));
            }
        }
        return fetch(url, requestInit);
    };
    FetchApiConfigFetcherBase.prototype.setRequestHeaders = function (requestInit, headers) {
        if (this.runsOnServerSide) {
            setRequestHeadersDefault(requestInit, headers);
        }
    };
    return FetchApiConfigFetcherBase;
}());

FetchApiConfigFetcherBase.prototype[fetchInternalAsyncMethodName] = function (request, logger) {
    logMethodDebug(logger, "FetchApiConfigFetcherBase.fetchAsync");
    return this["fetchWithRetryAsync"](request, logger);
};
function setRequestHeadersDefault(requestInit, headers) {
    var _a;
    for (var _i = 0, headers_1 = headers; _i < headers_1.length; _i++) {
        var _b = headers_1[_i], name_1 = _b[0], value = _b[1];
        ((_a = requestInit.headers) !== null && _a !== void 0 ? _a : (requestInit.headers = [])).push([name_1, value]);
    }
}
function FetchApiConfigFetcher_getResponseHeadersDefault(httpResponse) {
    var headers = [];
    extractHeader("ETag", httpResponse, headers);
    extractHeader("CF-RAY", httpResponse, headers);
    return headers;
    function extractHeader(name, httpResponse, headers) {
        var value = httpResponse.headers.get(name);
        if (value != null) {
            headers.push([name, value]);
        }
    }
}
var ClientSideFetchApiConfigFetcher = (function (_super) {
    __extends(ClientSideFetchApiConfigFetcher, _super);
    function ClientSideFetchApiConfigFetcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClientSideFetchApiConfigFetcher.getFactory = function () {
        return function (options) { return new ClientSideFetchApiConfigFetcher(); };
    };
    return ClientSideFetchApiConfigFetcher;
}(FetchApiConfigFetcherBase));

var ServerSideFetchApiConfigFetcher = (function (_super) {
    __extends(ServerSideFetchApiConfigFetcher, _super);
    function ServerSideFetchApiConfigFetcher() {
        return _super.call(this, true) || this;
    }
    ServerSideFetchApiConfigFetcher.getFactory = function () {
        return function (options) { return new ServerSideFetchApiConfigFetcher(); };
    };
    return ServerSideFetchApiConfigFetcher;
}(FetchApiConfigFetcherBase));

var FetchApiConfigFetcher_templateObject_1, FetchApiConfigFetcher_templateObject_2, FetchApiConfigFetcher_templateObject_3, FetchApiConfigFetcher_templateObject_4, FetchApiConfigFetcher_templateObject_5, FetchApiConfigFetcher_templateObject_6, FetchApiConfigFetcher_templateObject_7, FetchApiConfigFetcher_templateObject_8, FetchApiConfigFetcher_templateObject_9, FetchApiConfigFetcher_templateObject_10;

;// ./src/index.ts










;// ./src/browser/index.ts






function browser_getClient(sdkKey, pollingMode, options) {
    return getClient(sdkKey, pollingMode !== null && pollingMode !== void 0 ? pollingMode : 0, options, {
        sdkType: "ConfigCat-UnifiedJS-Browser",
        sdkVersion: Version,
        eventEmitterFactory: function () { return new DefaultEventEmitter(); },
        defaultCacheFactory: typeof localStorage !== "undefined"
            ? LocalStorageConfigCache["tryGetFactory"]()
            : IndexedDBConfigCache["tryGetFactory"](),
        configFetcherFactory: XmlHttpRequestConfigFetcher["getFactory"](),
    });
}







;// ./src/browser/index.umd.ts



var $clients;
var $snapshots;
function $pollConfig(sdkKey, options, onConfigChanged) {
    var client;
    function configChangedHandler() {
        var snapshot = client.snapshot();
        ($snapshots !== null && $snapshots !== void 0 ? $snapshots : ($snapshots = createMap()))[sdkKey] = snapshot;
        var continuePolling = onConfigChanged(sdkKey, snapshot.cacheState);
        if (!continuePolling) {
            client.dispose();
            client = void 0;
            delete $clients[sdkKey];
        }
        return continuePolling;
    }
    client = browser_getClient(sdkKey, 0, options);
    ($clients !== null && $clients !== void 0 ? $clients : ($clients = createMap()))[sdkKey] = client;
    client.waitForReady().then(function () {
        if (configChangedHandler()) {
            client.on("configChanged", configChangedHandler);
        }
    });
}


/***/ },

/***/ 780
(module, __unused_webpack_exports, __webpack_require__) {


var parent = __webpack_require__(2473);
__webpack_require__(7628);
__webpack_require__(3799);

module.exports = parent;


/***/ },

/***/ 6398
(module, __unused_webpack_exports, __webpack_require__) {


__webpack_require__(67);
__webpack_require__(3792);
__webpack_require__(6099);
__webpack_require__(3362);
__webpack_require__(6167);
__webpack_require__(3518);
__webpack_require__(4628);
__webpack_require__(9391);
__webpack_require__(7764);
var path = __webpack_require__(9167);

module.exports = path.Promise;


/***/ },

/***/ 5781
(module, __unused_webpack_exports, __webpack_require__) {


/* unused reexport */ __webpack_require__(911);


/***/ },

/***/ 911
(module, __unused_webpack_exports, __webpack_require__) {


var parent = __webpack_require__(780);
// TODO: Remove from `core-js@4`
__webpack_require__(9806);
__webpack_require__(5874);
__webpack_require__(7575);

module.exports = parent;


/***/ },

/***/ 9306
(module, __unused_webpack_exports, __webpack_require__) {


var isCallable = __webpack_require__(4901);
var tryToString = __webpack_require__(6823);

var $TypeError = TypeError;

// `Assert: IsCallable(argument) is true`
module.exports = function (argument) {
  if (isCallable(argument)) return argument;
  throw new $TypeError(tryToString(argument) + ' is not a function');
};


/***/ },

/***/ 5548
(module, __unused_webpack_exports, __webpack_require__) {


var isConstructor = __webpack_require__(3517);
var tryToString = __webpack_require__(6823);

var $TypeError = TypeError;

// `Assert: IsConstructor(argument) is true`
module.exports = function (argument) {
  if (isConstructor(argument)) return argument;
  throw new $TypeError(tryToString(argument) + ' is not a constructor');
};


/***/ },

/***/ 3506
(module, __unused_webpack_exports, __webpack_require__) {


var isPossiblePrototype = __webpack_require__(3925);

var $String = String;
var $TypeError = TypeError;

module.exports = function (argument) {
  if (isPossiblePrototype(argument)) return argument;
  throw new $TypeError("Can't set " + $String(argument) + ' as a prototype');
};


/***/ },

/***/ 6469
(module, __unused_webpack_exports, __webpack_require__) {


var wellKnownSymbol = __webpack_require__(8227);
var create = __webpack_require__(2360);
var defineProperty = (__webpack_require__(4913).f);

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] === undefined) {
  defineProperty(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: create(null)
  });
}

// add a key to Array.prototype[@@unscopables]
module.exports = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};


/***/ },

/***/ 679
(module, __unused_webpack_exports, __webpack_require__) {


var isPrototypeOf = __webpack_require__(1625);

var $TypeError = TypeError;

module.exports = function (it, Prototype) {
  if (isPrototypeOf(Prototype, it)) return it;
  throw new $TypeError('Incorrect invocation');
};


/***/ },

/***/ 8551
(module, __unused_webpack_exports, __webpack_require__) {


var isObject = __webpack_require__(34);

var $String = String;
var $TypeError = TypeError;

// `Assert: Type(argument) is Object`
module.exports = function (argument) {
  if (isObject(argument)) return argument;
  throw new $TypeError($String(argument) + ' is not an object');
};


/***/ },

/***/ 9617
(module, __unused_webpack_exports, __webpack_require__) {


var toIndexedObject = __webpack_require__(5397);
var toAbsoluteIndex = __webpack_require__(5610);
var lengthOfArrayLike = __webpack_require__(6198);

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = lengthOfArrayLike(O);
    if (length === 0) return !IS_INCLUDES && -1;
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el !== el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value !== value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};


/***/ },

/***/ 7680
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);

module.exports = uncurryThis([].slice);


/***/ },

/***/ 4428
(module, __unused_webpack_exports, __webpack_require__) {


var wellKnownSymbol = __webpack_require__(8227);

var ITERATOR = wellKnownSymbol('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR] = function () {
    return this;
  };
  // eslint-disable-next-line es/no-array-from, no-throw-literal -- required for testing
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

module.exports = function (exec, SKIP_CLOSING) {
  try {
    if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  } catch (error) { return false; } // workaround of old WebKit + `eval` bug
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};


/***/ },

/***/ 2195
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);

var toString = uncurryThis({}.toString);
var stringSlice = uncurryThis(''.slice);

module.exports = function (it) {
  return stringSlice(toString(it), 8, -1);
};


/***/ },

/***/ 6955
(module, __unused_webpack_exports, __webpack_require__) {


var TO_STRING_TAG_SUPPORT = __webpack_require__(2140);
var isCallable = __webpack_require__(4901);
var classofRaw = __webpack_require__(2195);
var wellKnownSymbol = __webpack_require__(8227);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var $Object = Object;

// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) === 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = $Object(it), TO_STRING_TAG)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) === 'Object' && isCallable(O.callee) ? 'Arguments' : result;
};


/***/ },

/***/ 7740
(module, __unused_webpack_exports, __webpack_require__) {


var hasOwn = __webpack_require__(9297);
var ownKeys = __webpack_require__(5031);
var getOwnPropertyDescriptorModule = __webpack_require__(7347);
var definePropertyModule = __webpack_require__(4913);

module.exports = function (target, source, exceptions) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!hasOwn(target, key) && !(exceptions && hasOwn(exceptions, key))) {
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  }
};


/***/ },

/***/ 2211
(module, __unused_webpack_exports, __webpack_require__) {


var fails = __webpack_require__(9039);

module.exports = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  // eslint-disable-next-line es/no-object-getprototypeof -- required for testing
  return Object.getPrototypeOf(new F()) !== F.prototype;
});


/***/ },

/***/ 2529
(module) {


// `CreateIterResultObject` abstract operation
// https://tc39.es/ecma262/#sec-createiterresultobject
module.exports = function (value, done) {
  return { value: value, done: done };
};


/***/ },

/***/ 6699
(module, __unused_webpack_exports, __webpack_require__) {


var DESCRIPTORS = __webpack_require__(3724);
var definePropertyModule = __webpack_require__(4913);
var createPropertyDescriptor = __webpack_require__(6980);

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ },

/***/ 6980
(module) {


module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ },

/***/ 2106
(module, __unused_webpack_exports, __webpack_require__) {


var makeBuiltIn = __webpack_require__(283);
var defineProperty = __webpack_require__(4913);

module.exports = function (target, name, descriptor) {
  if (descriptor.get) makeBuiltIn(descriptor.get, name, { getter: true });
  if (descriptor.set) makeBuiltIn(descriptor.set, name, { setter: true });
  return defineProperty.f(target, name, descriptor);
};


/***/ },

/***/ 6840
(module, __unused_webpack_exports, __webpack_require__) {


var isCallable = __webpack_require__(4901);
var definePropertyModule = __webpack_require__(4913);
var makeBuiltIn = __webpack_require__(283);
var defineGlobalProperty = __webpack_require__(9433);

module.exports = function (O, key, value, options) {
  if (!options) options = {};
  var simple = options.enumerable;
  var name = options.name !== undefined ? options.name : key;
  if (isCallable(value)) makeBuiltIn(value, name, options);
  if (options.global) {
    if (simple) O[key] = value;
    else defineGlobalProperty(key, value);
  } else {
    try {
      if (!options.unsafe) delete O[key];
      else if (O[key]) simple = true;
    } catch (error) { /* empty */ }
    if (simple) O[key] = value;
    else definePropertyModule.f(O, key, {
      value: value,
      enumerable: false,
      configurable: !options.nonConfigurable,
      writable: !options.nonWritable
    });
  } return O;
};


/***/ },

/***/ 9433
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);

// eslint-disable-next-line es/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;

module.exports = function (key, value) {
  try {
    defineProperty(globalThis, key, { value: value, configurable: true, writable: true });
  } catch (error) {
    globalThis[key] = value;
  } return value;
};


/***/ },

/***/ 3724
(module, __unused_webpack_exports, __webpack_require__) {


var fails = __webpack_require__(9039);

// Detect IE8's incomplete defineProperty implementation
module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] !== 7;
});


/***/ },

/***/ 4055
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var isObject = __webpack_require__(34);

var document = globalThis.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};


/***/ },

/***/ 7400
(module) {


// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
module.exports = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};


/***/ },

/***/ 9296
(module, __unused_webpack_exports, __webpack_require__) {


// in old WebKit versions, `element.classList` is not an instance of global `DOMTokenList`
var documentCreateElement = __webpack_require__(4055);

var classList = documentCreateElement('span').classList;
var DOMTokenListPrototype = classList && classList.constructor && classList.constructor.prototype;

module.exports = DOMTokenListPrototype === Object.prototype ? undefined : DOMTokenListPrototype;


/***/ },

/***/ 8727
(module) {


// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/***/ },

/***/ 4265
(module, __unused_webpack_exports, __webpack_require__) {


var userAgent = __webpack_require__(2839);

module.exports = /ipad|iphone|ipod/i.test(userAgent) && typeof Pebble != 'undefined';


/***/ },

/***/ 9544
(module, __unused_webpack_exports, __webpack_require__) {


var userAgent = __webpack_require__(2839);

// eslint-disable-next-line redos/no-vulnerable -- safe
module.exports = /(?:ipad|iphone|ipod).*applewebkit/i.test(userAgent);


/***/ },

/***/ 8574
(module, __unused_webpack_exports, __webpack_require__) {


var ENVIRONMENT = __webpack_require__(4215);

module.exports = ENVIRONMENT === 'NODE';


/***/ },

/***/ 7860
(module, __unused_webpack_exports, __webpack_require__) {


var userAgent = __webpack_require__(2839);

module.exports = /web0s(?!.*chrome)/i.test(userAgent);


/***/ },

/***/ 2839
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);

var navigator = globalThis.navigator;
var userAgent = navigator && navigator.userAgent;

module.exports = userAgent ? String(userAgent) : '';


/***/ },

/***/ 9519
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var userAgent = __webpack_require__(2839);

var process = globalThis.process;
var Deno = globalThis.Deno;
var versions = process && process.versions || Deno && Deno.version;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  // in old Chrome, versions of V8 isn't V8 = Chrome / 10
  // but their correct versions are not interesting for us
  version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
}

// BrowserFS NodeJS `process` polyfill incorrectly set `.v8` to `0.0`
// so check `userAgent` even if `.v8` exists, but 0
if (!version && userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = +match[1];
  }
}

module.exports = version;


/***/ },

/***/ 4215
(module, __unused_webpack_exports, __webpack_require__) {


/* global Bun, Deno -- detection */
var globalThis = __webpack_require__(4576);
var userAgent = __webpack_require__(2839);
var classof = __webpack_require__(2195);

var userAgentStartsWith = function (string) {
  return userAgent.slice(0, string.length) === string;
};

module.exports = (function () {
  if (userAgentStartsWith('Bun/')) return 'BUN';
  if (userAgentStartsWith('Cloudflare-Workers')) return 'CLOUDFLARE';
  if (userAgentStartsWith('Deno/')) return 'DENO';
  if (userAgentStartsWith('Node.js/')) return 'NODE';
  if (globalThis.Bun && typeof Bun.version == 'string') return 'BUN';
  if (globalThis.Deno && typeof Deno.version == 'object') return 'DENO';
  if (classof(globalThis.process) === 'process') return 'NODE';
  if (globalThis.window && globalThis.document) return 'BROWSER';
  return 'REST';
})();


/***/ },

/***/ 6193
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);

var $Error = Error;
var replace = uncurryThis(''.replace);

var TEST = (function (arg) { return String(new $Error(arg).stack); })('zxcasd');
// eslint-disable-next-line redos/no-vulnerable -- safe
var V8_OR_CHAKRA_STACK_ENTRY = /\n\s*at [^:]*:[^\n]*/;
var IS_V8_OR_CHAKRA_STACK = V8_OR_CHAKRA_STACK_ENTRY.test(TEST);

module.exports = function (stack, dropEntries) {
  if (IS_V8_OR_CHAKRA_STACK && typeof stack == 'string' && !$Error.prepareStackTrace) {
    while (dropEntries--) stack = replace(stack, V8_OR_CHAKRA_STACK_ENTRY, '');
  } return stack;
};


/***/ },

/***/ 747
(module, __unused_webpack_exports, __webpack_require__) {


var createNonEnumerableProperty = __webpack_require__(6699);
var clearErrorStack = __webpack_require__(6193);
var ERROR_STACK_INSTALLABLE = __webpack_require__(4659);

// non-standard V8
var captureStackTrace = Error.captureStackTrace;

module.exports = function (error, C, stack, dropEntries) {
  if (ERROR_STACK_INSTALLABLE) {
    if (captureStackTrace) captureStackTrace(error, C);
    else createNonEnumerableProperty(error, 'stack', clearErrorStack(stack, dropEntries));
  }
};


/***/ },

/***/ 4659
(module, __unused_webpack_exports, __webpack_require__) {


var fails = __webpack_require__(9039);
var createPropertyDescriptor = __webpack_require__(6980);

module.exports = !fails(function () {
  var error = new Error('a');
  if (!('stack' in error)) return true;
  // eslint-disable-next-line es/no-object-defineproperty -- safe
  Object.defineProperty(error, 'stack', createPropertyDescriptor(1, 7));
  return error.stack !== 7;
});


/***/ },

/***/ 6518
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var getOwnPropertyDescriptor = (__webpack_require__(7347).f);
var createNonEnumerableProperty = __webpack_require__(6699);
var defineBuiltIn = __webpack_require__(6840);
var defineGlobalProperty = __webpack_require__(9433);
var copyConstructorProperties = __webpack_require__(7740);
var isForced = __webpack_require__(2796);

/*
  options.target         - name of the target object
  options.global         - target is the global object
  options.stat           - export as static methods of target
  options.proto          - export as prototype methods of target
  options.real           - real prototype method for the `pure` version
  options.forced         - export even if the native feature is available
  options.bind           - bind methods to the target, required for the `pure` version
  options.wrap           - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe         - use the simple assignment of property instead of delete + defineProperty
  options.sham           - add a flag to not completely full polyfills
  options.enumerable     - export as enumerable property
  options.dontCallGetSet - prevent calling a getter on target
  options.name           - the .name of the function if it does not match the key
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = globalThis;
  } else if (STATIC) {
    target = globalThis[TARGET] || defineGlobalProperty(TARGET, {});
  } else {
    target = globalThis[TARGET] && globalThis[TARGET].prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.dontCallGetSet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty == typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    defineBuiltIn(target, key, sourceProperty, options);
  }
};


/***/ },

/***/ 9039
(module) {


module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};


/***/ },

/***/ 8745
(module, __unused_webpack_exports, __webpack_require__) {


var NATIVE_BIND = __webpack_require__(616);

var FunctionPrototype = Function.prototype;
var apply = FunctionPrototype.apply;
var call = FunctionPrototype.call;

// eslint-disable-next-line es/no-reflect -- safe
module.exports = typeof Reflect == 'object' && Reflect.apply || (NATIVE_BIND ? call.bind(apply) : function () {
  return call.apply(apply, arguments);
});


/***/ },

/***/ 6080
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(7476);
var aCallable = __webpack_require__(9306);
var NATIVE_BIND = __webpack_require__(616);

var bind = uncurryThis(uncurryThis.bind);

// optional / simple context binding
module.exports = function (fn, that) {
  aCallable(fn);
  return that === undefined ? fn : NATIVE_BIND ? bind(fn, that) : function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ },

/***/ 616
(module, __unused_webpack_exports, __webpack_require__) {


var fails = __webpack_require__(9039);

module.exports = !fails(function () {
  // eslint-disable-next-line es/no-function-prototype-bind -- safe
  var test = (function () { /* empty */ }).bind();
  // eslint-disable-next-line no-prototype-builtins -- safe
  return typeof test != 'function' || test.hasOwnProperty('prototype');
});


/***/ },

/***/ 9565
(module, __unused_webpack_exports, __webpack_require__) {


var NATIVE_BIND = __webpack_require__(616);

var call = Function.prototype.call;

module.exports = NATIVE_BIND ? call.bind(call) : function () {
  return call.apply(call, arguments);
};


/***/ },

/***/ 350
(module, __unused_webpack_exports, __webpack_require__) {


var DESCRIPTORS = __webpack_require__(3724);
var hasOwn = __webpack_require__(9297);

var FunctionPrototype = Function.prototype;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getDescriptor = DESCRIPTORS && Object.getOwnPropertyDescriptor;

var EXISTS = hasOwn(FunctionPrototype, 'name');
// additional protection from minified / mangled / dropped function names
var PROPER = EXISTS && (function something() { /* empty */ }).name === 'something';
var CONFIGURABLE = EXISTS && (!DESCRIPTORS || (DESCRIPTORS && getDescriptor(FunctionPrototype, 'name').configurable));

module.exports = {
  EXISTS: EXISTS,
  PROPER: PROPER,
  CONFIGURABLE: CONFIGURABLE
};


/***/ },

/***/ 6706
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);
var aCallable = __webpack_require__(9306);

module.exports = function (object, key, method) {
  try {
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    return uncurryThis(aCallable(Object.getOwnPropertyDescriptor(object, key)[method]));
  } catch (error) { /* empty */ }
};


/***/ },

/***/ 7476
(module, __unused_webpack_exports, __webpack_require__) {


var classofRaw = __webpack_require__(2195);
var uncurryThis = __webpack_require__(9504);

module.exports = function (fn) {
  // Nashorn bug:
  //   https://github.com/zloirock/core-js/issues/1128
  //   https://github.com/zloirock/core-js/issues/1130
  if (classofRaw(fn) === 'Function') return uncurryThis(fn);
};


/***/ },

/***/ 9504
(module, __unused_webpack_exports, __webpack_require__) {


var NATIVE_BIND = __webpack_require__(616);

var FunctionPrototype = Function.prototype;
var call = FunctionPrototype.call;
var uncurryThisWithBind = NATIVE_BIND && FunctionPrototype.bind.bind(call, call);

module.exports = NATIVE_BIND ? uncurryThisWithBind : function (fn) {
  return function () {
    return call.apply(fn, arguments);
  };
};


/***/ },

/***/ 7751
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var isCallable = __webpack_require__(4901);

var aFunction = function (argument) {
  return isCallable(argument) ? argument : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(globalThis[namespace]) : globalThis[namespace] && globalThis[namespace][method];
};


/***/ },

/***/ 851
(module, __unused_webpack_exports, __webpack_require__) {


var classof = __webpack_require__(6955);
var getMethod = __webpack_require__(5966);
var isNullOrUndefined = __webpack_require__(4117);
var Iterators = __webpack_require__(6269);
var wellKnownSymbol = __webpack_require__(8227);

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (!isNullOrUndefined(it)) return getMethod(it, ITERATOR)
    || getMethod(it, '@@iterator')
    || Iterators[classof(it)];
};


/***/ },

/***/ 81
(module, __unused_webpack_exports, __webpack_require__) {


var call = __webpack_require__(9565);
var aCallable = __webpack_require__(9306);
var anObject = __webpack_require__(8551);
var tryToString = __webpack_require__(6823);
var getIteratorMethod = __webpack_require__(851);

var $TypeError = TypeError;

module.exports = function (argument, usingIterator) {
  var iteratorMethod = arguments.length < 2 ? getIteratorMethod(argument) : usingIterator;
  if (aCallable(iteratorMethod)) return anObject(call(iteratorMethod, argument));
  throw new $TypeError(tryToString(argument) + ' is not iterable');
};


/***/ },

/***/ 5966
(module, __unused_webpack_exports, __webpack_require__) {


var aCallable = __webpack_require__(9306);
var isNullOrUndefined = __webpack_require__(4117);

// `GetMethod` abstract operation
// https://tc39.es/ecma262/#sec-getmethod
module.exports = function (V, P) {
  var func = V[P];
  return isNullOrUndefined(func) ? undefined : aCallable(func);
};


/***/ },

/***/ 4576
(module, __unused_webpack_exports, __webpack_require__) {


var check = function (it) {
  return it && it.Math === Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line es/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof __webpack_require__.g == 'object' && __webpack_require__.g) ||
  check(typeof this == 'object' && this) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();


/***/ },

/***/ 9297
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);
var toObject = __webpack_require__(8981);

var hasOwnProperty = uncurryThis({}.hasOwnProperty);

// `HasOwnProperty` abstract operation
// https://tc39.es/ecma262/#sec-hasownproperty
// eslint-disable-next-line es/no-object-hasown -- safe
module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty(toObject(it), key);
};


/***/ },

/***/ 421
(module) {


module.exports = {};


/***/ },

/***/ 3138
(module) {


module.exports = function (a, b) {
  try {
    // eslint-disable-next-line no-console -- safe
    arguments.length === 1 ? console.error(a) : console.error(a, b);
  } catch (error) { /* empty */ }
};


/***/ },

/***/ 397
(module, __unused_webpack_exports, __webpack_require__) {


var getBuiltIn = __webpack_require__(7751);

module.exports = getBuiltIn('document', 'documentElement');


/***/ },

/***/ 5917
(module, __unused_webpack_exports, __webpack_require__) {


var DESCRIPTORS = __webpack_require__(3724);
var fails = __webpack_require__(9039);
var createElement = __webpack_require__(4055);

// Thanks to IE8 for its funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a !== 7;
});


/***/ },

/***/ 7055
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);
var fails = __webpack_require__(9039);
var classof = __webpack_require__(2195);

var $Object = Object;
var split = uncurryThis(''.split);

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !$Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) === 'String' ? split(it, '') : $Object(it);
} : $Object;


/***/ },

/***/ 3706
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);
var isCallable = __webpack_require__(4901);
var store = __webpack_require__(7629);

var functionToString = uncurryThis(Function.toString);

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (!isCallable(store.inspectSource)) {
  store.inspectSource = function (it) {
    return functionToString(it);
  };
}

module.exports = store.inspectSource;


/***/ },

/***/ 7584
(module, __unused_webpack_exports, __webpack_require__) {


var isObject = __webpack_require__(34);
var createNonEnumerableProperty = __webpack_require__(6699);

// `InstallErrorCause` abstract operation
// https://tc39.es/proposal-error-cause/#sec-errorobjects-install-error-cause
module.exports = function (O, options) {
  if (isObject(options) && 'cause' in options) {
    createNonEnumerableProperty(O, 'cause', options.cause);
  }
};


/***/ },

/***/ 1181
(module, __unused_webpack_exports, __webpack_require__) {


var NATIVE_WEAK_MAP = __webpack_require__(8622);
var globalThis = __webpack_require__(4576);
var isObject = __webpack_require__(34);
var createNonEnumerableProperty = __webpack_require__(6699);
var hasOwn = __webpack_require__(9297);
var shared = __webpack_require__(7629);
var sharedKey = __webpack_require__(6119);
var hiddenKeys = __webpack_require__(421);

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var TypeError = globalThis.TypeError;
var WeakMap = globalThis.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw new TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  /* eslint-disable no-self-assign -- prototype methods protection */
  store.get = store.get;
  store.has = store.has;
  store.set = store.set;
  /* eslint-enable no-self-assign -- prototype methods protection */
  set = function (it, metadata) {
    if (store.has(it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    store.set(it, metadata);
    return metadata;
  };
  get = function (it) {
    return store.get(it) || {};
  };
  has = function (it) {
    return store.has(it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    if (hasOwn(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return hasOwn(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return hasOwn(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};


/***/ },

/***/ 4209
(module, __unused_webpack_exports, __webpack_require__) {


var wellKnownSymbol = __webpack_require__(8227);
var Iterators = __webpack_require__(6269);

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};


/***/ },

/***/ 4901
(module) {


// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
var documentAll = typeof document == 'object' && document.all;

// `IsCallable` abstract operation
// https://tc39.es/ecma262/#sec-iscallable
// eslint-disable-next-line unicorn/no-typeof-undefined -- required for testing
module.exports = typeof documentAll == 'undefined' && documentAll !== undefined ? function (argument) {
  return typeof argument == 'function' || argument === documentAll;
} : function (argument) {
  return typeof argument == 'function';
};


/***/ },

/***/ 3517
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);
var fails = __webpack_require__(9039);
var isCallable = __webpack_require__(4901);
var classof = __webpack_require__(6955);
var getBuiltIn = __webpack_require__(7751);
var inspectSource = __webpack_require__(3706);

var noop = function () { /* empty */ };
var construct = getBuiltIn('Reflect', 'construct');
var constructorRegExp = /^\s*(?:class|function)\b/;
var exec = uncurryThis(constructorRegExp.exec);
var INCORRECT_TO_STRING = !constructorRegExp.test(noop);

var isConstructorModern = function isConstructor(argument) {
  if (!isCallable(argument)) return false;
  try {
    construct(noop, [], argument);
    return true;
  } catch (error) {
    return false;
  }
};

var isConstructorLegacy = function isConstructor(argument) {
  if (!isCallable(argument)) return false;
  switch (classof(argument)) {
    case 'AsyncFunction':
    case 'GeneratorFunction':
    case 'AsyncGeneratorFunction': return false;
  }
  try {
    // we can't check .prototype since constructors produced by .bind haven't it
    // `Function#toString` throws on some built-it function in some legacy engines
    // (for example, `DOMQuad` and similar in FF41-)
    return INCORRECT_TO_STRING || !!exec(constructorRegExp, inspectSource(argument));
  } catch (error) {
    return true;
  }
};

isConstructorLegacy.sham = true;

// `IsConstructor` abstract operation
// https://tc39.es/ecma262/#sec-isconstructor
module.exports = !construct || fails(function () {
  var called;
  return isConstructorModern(isConstructorModern.call)
    || !isConstructorModern(Object)
    || !isConstructorModern(function () { called = true; })
    || called;
}) ? isConstructorLegacy : isConstructorModern;


/***/ },

/***/ 2796
(module, __unused_webpack_exports, __webpack_require__) {


var fails = __webpack_require__(9039);
var isCallable = __webpack_require__(4901);

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value === POLYFILL ? true
    : value === NATIVE ? false
    : isCallable(detection) ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;


/***/ },

/***/ 4117
(module) {


// we can't use just `it == null` since of `document.all` special case
// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot-aec
module.exports = function (it) {
  return it === null || it === undefined;
};


/***/ },

/***/ 34
(module, __unused_webpack_exports, __webpack_require__) {


var isCallable = __webpack_require__(4901);

module.exports = function (it) {
  return typeof it == 'object' ? it !== null : isCallable(it);
};


/***/ },

/***/ 3925
(module, __unused_webpack_exports, __webpack_require__) {


var isObject = __webpack_require__(34);

module.exports = function (argument) {
  return isObject(argument) || argument === null;
};


/***/ },

/***/ 6395
(module) {


module.exports = false;


/***/ },

/***/ 757
(module, __unused_webpack_exports, __webpack_require__) {


var getBuiltIn = __webpack_require__(7751);
var isCallable = __webpack_require__(4901);
var isPrototypeOf = __webpack_require__(1625);
var USE_SYMBOL_AS_UID = __webpack_require__(7040);

var $Object = Object;

module.exports = USE_SYMBOL_AS_UID ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  var $Symbol = getBuiltIn('Symbol');
  return isCallable($Symbol) && isPrototypeOf($Symbol.prototype, $Object(it));
};


/***/ },

/***/ 2652
(module, __unused_webpack_exports, __webpack_require__) {


var bind = __webpack_require__(6080);
var call = __webpack_require__(9565);
var anObject = __webpack_require__(8551);
var tryToString = __webpack_require__(6823);
var isArrayIteratorMethod = __webpack_require__(4209);
var lengthOfArrayLike = __webpack_require__(6198);
var isPrototypeOf = __webpack_require__(1625);
var getIterator = __webpack_require__(81);
var getIteratorMethod = __webpack_require__(851);
var iteratorClose = __webpack_require__(9539);

var $TypeError = TypeError;

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var ResultPrototype = Result.prototype;

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_RECORD = !!(options && options.IS_RECORD);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator, 'normal', condition);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_RECORD) {
    iterator = iterable.iterator;
  } else if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (!iterFn) throw new $TypeError(tryToString(iterable) + ' is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = lengthOfArrayLike(iterable); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && isPrototypeOf(ResultPrototype, result)) return result;
      } return new Result(false);
    }
    iterator = getIterator(iterable, iterFn);
  }

  next = IS_RECORD ? iterable.next : iterator.next;
  while (!(step = call(next, iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator, 'throw', error);
    }
    if (typeof result == 'object' && result && isPrototypeOf(ResultPrototype, result)) return result;
  } return new Result(false);
};


/***/ },

/***/ 9539
(module, __unused_webpack_exports, __webpack_require__) {


var call = __webpack_require__(9565);
var anObject = __webpack_require__(8551);
var getMethod = __webpack_require__(5966);

module.exports = function (iterator, kind, value) {
  var innerResult, innerError;
  anObject(iterator);
  try {
    innerResult = getMethod(iterator, 'return');
    if (!innerResult) {
      if (kind === 'throw') throw value;
      return value;
    }
    innerResult = call(innerResult, iterator);
  } catch (error) {
    innerError = true;
    innerResult = error;
  }
  if (kind === 'throw') throw value;
  if (innerError) throw innerResult;
  anObject(innerResult);
  return value;
};


/***/ },

/***/ 3994
(module, __unused_webpack_exports, __webpack_require__) {


var IteratorPrototype = (__webpack_require__(7657).IteratorPrototype);
var create = __webpack_require__(2360);
var createPropertyDescriptor = __webpack_require__(6980);
var setToStringTag = __webpack_require__(687);
var Iterators = __webpack_require__(6269);

var returnThis = function () { return this; };

module.exports = function (IteratorConstructor, NAME, next, ENUMERABLE_NEXT) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = create(IteratorPrototype, { next: createPropertyDescriptor(+!ENUMERABLE_NEXT, next) });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
  Iterators[TO_STRING_TAG] = returnThis;
  return IteratorConstructor;
};


/***/ },

/***/ 1088
(module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var call = __webpack_require__(9565);
var IS_PURE = __webpack_require__(6395);
var FunctionName = __webpack_require__(350);
var isCallable = __webpack_require__(4901);
var createIteratorConstructor = __webpack_require__(3994);
var getPrototypeOf = __webpack_require__(2787);
var setPrototypeOf = __webpack_require__(2967);
var setToStringTag = __webpack_require__(687);
var createNonEnumerableProperty = __webpack_require__(6699);
var defineBuiltIn = __webpack_require__(6840);
var wellKnownSymbol = __webpack_require__(8227);
var Iterators = __webpack_require__(6269);
var IteratorsCore = __webpack_require__(7657);

var PROPER_FUNCTION_NAME = FunctionName.PROPER;
var CONFIGURABLE_FUNCTION_NAME = FunctionName.CONFIGURABLE;
var IteratorPrototype = IteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR = wellKnownSymbol('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis = function () { return this; };

module.exports = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS && KIND && KIND in IterablePrototype) return IterablePrototype[KIND];

    switch (KIND) {
      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
    }

    return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME === 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = getPrototypeOf(anyNativeIterator.call(new Iterable()));
    if (CurrentIteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
      if (!IS_PURE && getPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
        if (setPrototypeOf) {
          setPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
        } else if (!isCallable(CurrentIteratorPrototype[ITERATOR])) {
          defineBuiltIn(CurrentIteratorPrototype, ITERATOR, returnThis);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
      if (IS_PURE) Iterators[TO_STRING_TAG] = returnThis;
    }
  }

  // fix Array.prototype.{ values, @@iterator }.name in V8 / FF
  if (PROPER_FUNCTION_NAME && DEFAULT === VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    if (!IS_PURE && CONFIGURABLE_FUNCTION_NAME) {
      createNonEnumerableProperty(IterablePrototype, 'name', VALUES);
    } else {
      INCORRECT_VALUES_NAME = true;
      defaultIterator = function values() { return call(nativeIterator, this); };
    }
  }

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        defineBuiltIn(IterablePrototype, KEY, methods[KEY]);
      }
    } else $({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME }, methods);
  }

  // define iterator
  if ((!IS_PURE || FORCED) && IterablePrototype[ITERATOR] !== defaultIterator) {
    defineBuiltIn(IterablePrototype, ITERATOR, defaultIterator, { name: DEFAULT });
  }
  Iterators[NAME] = defaultIterator;

  return methods;
};


/***/ },

/***/ 7657
(module, __unused_webpack_exports, __webpack_require__) {


var fails = __webpack_require__(9039);
var isCallable = __webpack_require__(4901);
var isObject = __webpack_require__(34);
var create = __webpack_require__(2360);
var getPrototypeOf = __webpack_require__(2787);
var defineBuiltIn = __webpack_require__(6840);
var wellKnownSymbol = __webpack_require__(8227);
var IS_PURE = __webpack_require__(6395);

var ITERATOR = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS = false;

// `%IteratorPrototype%` object
// https://tc39.es/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

/* eslint-disable es/no-array-prototype-keys -- safe */
if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
  else {
    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

var NEW_ITERATOR_PROTOTYPE = !isObject(IteratorPrototype) || fails(function () {
  var test = {};
  // FF44- legacy iterators case
  return IteratorPrototype[ITERATOR].call(test) !== test;
});

if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {};
else if (IS_PURE) IteratorPrototype = create(IteratorPrototype);

// `%IteratorPrototype%[@@iterator]()` method
// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
if (!isCallable(IteratorPrototype[ITERATOR])) {
  defineBuiltIn(IteratorPrototype, ITERATOR, function () {
    return this;
  });
}

module.exports = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};


/***/ },

/***/ 6269
(module) {


module.exports = {};


/***/ },

/***/ 6198
(module, __unused_webpack_exports, __webpack_require__) {


var toLength = __webpack_require__(8014);

// `LengthOfArrayLike` abstract operation
// https://tc39.es/ecma262/#sec-lengthofarraylike
module.exports = function (obj) {
  return toLength(obj.length);
};


/***/ },

/***/ 283
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);
var fails = __webpack_require__(9039);
var isCallable = __webpack_require__(4901);
var hasOwn = __webpack_require__(9297);
var DESCRIPTORS = __webpack_require__(3724);
var CONFIGURABLE_FUNCTION_NAME = (__webpack_require__(350).CONFIGURABLE);
var inspectSource = __webpack_require__(3706);
var InternalStateModule = __webpack_require__(1181);

var enforceInternalState = InternalStateModule.enforce;
var getInternalState = InternalStateModule.get;
var $String = String;
// eslint-disable-next-line es/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;
var stringSlice = uncurryThis(''.slice);
var replace = uncurryThis(''.replace);
var join = uncurryThis([].join);

var CONFIGURABLE_LENGTH = DESCRIPTORS && !fails(function () {
  return defineProperty(function () { /* empty */ }, 'length', { value: 8 }).length !== 8;
});

var TEMPLATE = String(String).split('String');

var makeBuiltIn = module.exports = function (value, name, options) {
  if (stringSlice($String(name), 0, 7) === 'Symbol(') {
    name = '[' + replace($String(name), /^Symbol\(([^)]*)\).*$/, '$1') + ']';
  }
  if (options && options.getter) name = 'get ' + name;
  if (options && options.setter) name = 'set ' + name;
  if (!hasOwn(value, 'name') || (CONFIGURABLE_FUNCTION_NAME && value.name !== name)) {
    if (DESCRIPTORS) defineProperty(value, 'name', { value: name, configurable: true });
    else value.name = name;
  }
  if (CONFIGURABLE_LENGTH && options && hasOwn(options, 'arity') && value.length !== options.arity) {
    defineProperty(value, 'length', { value: options.arity });
  }
  try {
    if (options && hasOwn(options, 'constructor') && options.constructor) {
      if (DESCRIPTORS) defineProperty(value, 'prototype', { writable: false });
    // in V8 ~ Chrome 53, prototypes of some methods, like `Array.prototype.values`, are non-writable
    } else if (value.prototype) value.prototype = undefined;
  } catch (error) { /* empty */ }
  var state = enforceInternalState(value);
  if (!hasOwn(state, 'source')) {
    state.source = join(TEMPLATE, typeof name == 'string' ? name : '');
  } return value;
};

// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
// eslint-disable-next-line no-extend-native -- required
Function.prototype.toString = makeBuiltIn(function toString() {
  return isCallable(this) && getInternalState(this).source || inspectSource(this);
}, 'toString');


/***/ },

/***/ 741
(module) {


var ceil = Math.ceil;
var floor = Math.floor;

// `Math.trunc` method
// https://tc39.es/ecma262/#sec-math.trunc
// eslint-disable-next-line es/no-math-trunc -- safe
module.exports = Math.trunc || function trunc(x) {
  var n = +x;
  return (n > 0 ? floor : ceil)(n);
};


/***/ },

/***/ 1955
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var safeGetBuiltIn = __webpack_require__(3389);
var bind = __webpack_require__(6080);
var macrotask = (__webpack_require__(9225).set);
var Queue = __webpack_require__(8265);
var IS_IOS = __webpack_require__(9544);
var IS_IOS_PEBBLE = __webpack_require__(4265);
var IS_WEBOS_WEBKIT = __webpack_require__(7860);
var IS_NODE = __webpack_require__(8574);

var MutationObserver = globalThis.MutationObserver || globalThis.WebKitMutationObserver;
var document = globalThis.document;
var process = globalThis.process;
var Promise = globalThis.Promise;
var microtask = safeGetBuiltIn('queueMicrotask');
var notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!microtask) {
  var queue = new Queue();

  var flush = function () {
    var parent, fn;
    if (IS_NODE && (parent = process.domain)) parent.exit();
    while (fn = queue.get()) try {
      fn();
    } catch (error) {
      if (queue.head) notify();
      throw error;
    }
    if (parent) parent.enter();
  };

  // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
  // also except WebOS Webkit https://github.com/zloirock/core-js/issues/898
  if (!IS_IOS && !IS_NODE && !IS_WEBOS_WEBKIT && MutationObserver && document) {
    toggle = true;
    node = document.createTextNode('');
    new MutationObserver(flush).observe(node, { characterData: true });
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (!IS_IOS_PEBBLE && Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    promise = Promise.resolve(undefined);
    // workaround of WebKit ~ iOS Safari 10.1 bug
    promise.constructor = Promise;
    then = bind(promise.then, promise);
    notify = function () {
      then(flush);
    };
  // Node.js without promises
  } else if (IS_NODE) {
    notify = function () {
      process.nextTick(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessage
  // - onreadystatechange
  // - setTimeout
  } else {
    // `webpack` dev server bug on IE global methods - use bind(fn, global)
    macrotask = bind(macrotask, globalThis);
    notify = function () {
      macrotask(flush);
    };
  }

  microtask = function (fn) {
    if (!queue.head) notify();
    queue.add(fn);
  };
}

module.exports = microtask;


/***/ },

/***/ 6043
(module, __unused_webpack_exports, __webpack_require__) {


var aCallable = __webpack_require__(9306);

var $TypeError = TypeError;

var PromiseCapability = function (C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw new $TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aCallable(resolve);
  this.reject = aCallable(reject);
};

// `NewPromiseCapability` abstract operation
// https://tc39.es/ecma262/#sec-newpromisecapability
module.exports.f = function (C) {
  return new PromiseCapability(C);
};


/***/ },

/***/ 2603
(module, __unused_webpack_exports, __webpack_require__) {


var toString = __webpack_require__(655);

module.exports = function (argument, $default) {
  return argument === undefined ? arguments.length < 2 ? '' : $default : toString(argument);
};


/***/ },

/***/ 2360
(module, __unused_webpack_exports, __webpack_require__) {


/* global ActiveXObject -- old IE, WSH */
var anObject = __webpack_require__(8551);
var definePropertiesModule = __webpack_require__(6801);
var enumBugKeys = __webpack_require__(8727);
var hiddenKeys = __webpack_require__(421);
var html = __webpack_require__(397);
var documentCreateElement = __webpack_require__(4055);
var sharedKey = __webpack_require__(6119);

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  // eslint-disable-next-line no-useless-assignment -- avoid memory leak
  activeXDocument = null;
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  // https://github.com/zloirock/core-js/issues/475
  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    activeXDocument = new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = typeof document != 'undefined'
    ? document.domain && activeXDocument
      ? NullProtoObjectViaActiveX(activeXDocument) // old IE
      : NullProtoObjectViaIFrame()
    : NullProtoObjectViaActiveX(activeXDocument); // WSH
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
// eslint-disable-next-line es/no-object-create -- safe
module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : definePropertiesModule.f(result, Properties);
};


/***/ },

/***/ 6801
(__unused_webpack_module, exports, __webpack_require__) {


var DESCRIPTORS = __webpack_require__(3724);
var V8_PROTOTYPE_DEFINE_BUG = __webpack_require__(8686);
var definePropertyModule = __webpack_require__(4913);
var anObject = __webpack_require__(8551);
var toIndexedObject = __webpack_require__(5397);
var objectKeys = __webpack_require__(1072);

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es/no-object-defineproperties -- safe
exports.f = DESCRIPTORS && !V8_PROTOTYPE_DEFINE_BUG ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var props = toIndexedObject(Properties);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) definePropertyModule.f(O, key = keys[index++], props[key]);
  return O;
};


/***/ },

/***/ 4913
(__unused_webpack_module, exports, __webpack_require__) {


var DESCRIPTORS = __webpack_require__(3724);
var IE8_DOM_DEFINE = __webpack_require__(5917);
var V8_PROTOTYPE_DEFINE_BUG = __webpack_require__(8686);
var anObject = __webpack_require__(8551);
var toPropertyKey = __webpack_require__(6969);

var $TypeError = TypeError;
// eslint-disable-next-line es/no-object-defineproperty -- safe
var $defineProperty = Object.defineProperty;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var ENUMERABLE = 'enumerable';
var CONFIGURABLE = 'configurable';
var WRITABLE = 'writable';

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
exports.f = DESCRIPTORS ? V8_PROTOTYPE_DEFINE_BUG ? function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (typeof O === 'function' && P === 'prototype' && 'value' in Attributes && WRITABLE in Attributes && !Attributes[WRITABLE]) {
    var current = $getOwnPropertyDescriptor(O, P);
    if (current && current[WRITABLE]) {
      O[P] = Attributes.value;
      Attributes = {
        configurable: CONFIGURABLE in Attributes ? Attributes[CONFIGURABLE] : current[CONFIGURABLE],
        enumerable: ENUMERABLE in Attributes ? Attributes[ENUMERABLE] : current[ENUMERABLE],
        writable: false
      };
    }
  } return $defineProperty(O, P, Attributes);
} : $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw new $TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


/***/ },

/***/ 7347
(__unused_webpack_module, exports, __webpack_require__) {


var DESCRIPTORS = __webpack_require__(3724);
var call = __webpack_require__(9565);
var propertyIsEnumerableModule = __webpack_require__(8773);
var createPropertyDescriptor = __webpack_require__(6980);
var toIndexedObject = __webpack_require__(5397);
var toPropertyKey = __webpack_require__(6969);
var hasOwn = __webpack_require__(9297);
var IE8_DOM_DEFINE = __webpack_require__(5917);

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPropertyKey(P);
  if (IE8_DOM_DEFINE) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (hasOwn(O, P)) return createPropertyDescriptor(!call(propertyIsEnumerableModule.f, O, P), O[P]);
};


/***/ },

/***/ 8480
(__unused_webpack_module, exports, __webpack_require__) {


var internalObjectKeys = __webpack_require__(1828);
var enumBugKeys = __webpack_require__(8727);

var hiddenKeys = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es/no-object-getownpropertynames -- safe
exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};


/***/ },

/***/ 3717
(__unused_webpack_module, exports) {


// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
exports.f = Object.getOwnPropertySymbols;


/***/ },

/***/ 2787
(module, __unused_webpack_exports, __webpack_require__) {


var hasOwn = __webpack_require__(9297);
var isCallable = __webpack_require__(4901);
var toObject = __webpack_require__(8981);
var sharedKey = __webpack_require__(6119);
var CORRECT_PROTOTYPE_GETTER = __webpack_require__(2211);

var IE_PROTO = sharedKey('IE_PROTO');
var $Object = Object;
var ObjectPrototype = $Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
// eslint-disable-next-line es/no-object-getprototypeof -- safe
module.exports = CORRECT_PROTOTYPE_GETTER ? $Object.getPrototypeOf : function (O) {
  var object = toObject(O);
  if (hasOwn(object, IE_PROTO)) return object[IE_PROTO];
  var constructor = object.constructor;
  if (isCallable(constructor) && object instanceof constructor) {
    return constructor.prototype;
  } return object instanceof $Object ? ObjectPrototype : null;
};


/***/ },

/***/ 1625
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);

module.exports = uncurryThis({}.isPrototypeOf);


/***/ },

/***/ 1828
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);
var hasOwn = __webpack_require__(9297);
var toIndexedObject = __webpack_require__(5397);
var indexOf = (__webpack_require__(9617).indexOf);
var hiddenKeys = __webpack_require__(421);

var push = uncurryThis([].push);

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !hasOwn(hiddenKeys, key) && hasOwn(O, key) && push(result, key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (hasOwn(O, key = names[i++])) {
    ~indexOf(result, key) || push(result, key);
  }
  return result;
};


/***/ },

/***/ 1072
(module, __unused_webpack_exports, __webpack_require__) {


var internalObjectKeys = __webpack_require__(1828);
var enumBugKeys = __webpack_require__(8727);

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
// eslint-disable-next-line es/no-object-keys -- safe
module.exports = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys);
};


/***/ },

/***/ 8773
(__unused_webpack_module, exports) {


var $propertyIsEnumerable = {}.propertyIsEnumerable;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;


/***/ },

/***/ 2967
(module, __unused_webpack_exports, __webpack_require__) {


/* eslint-disable no-proto -- safe */
var uncurryThisAccessor = __webpack_require__(6706);
var isObject = __webpack_require__(34);
var requireObjectCoercible = __webpack_require__(7750);
var aPossiblePrototype = __webpack_require__(3506);

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
// eslint-disable-next-line es/no-object-setprototypeof -- safe
module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    setter = uncurryThisAccessor(Object.prototype, '__proto__', 'set');
    setter(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    requireObjectCoercible(O);
    aPossiblePrototype(proto);
    if (!isObject(O)) return O;
    if (CORRECT_SETTER) setter(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);


/***/ },

/***/ 3179
(module, __unused_webpack_exports, __webpack_require__) {


var TO_STRING_TAG_SUPPORT = __webpack_require__(2140);
var classof = __webpack_require__(6955);

// `Object.prototype.toString` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.tostring
module.exports = TO_STRING_TAG_SUPPORT ? {}.toString : function toString() {
  return '[object ' + classof(this) + ']';
};


/***/ },

/***/ 4270
(module, __unused_webpack_exports, __webpack_require__) {


var call = __webpack_require__(9565);
var isCallable = __webpack_require__(4901);
var isObject = __webpack_require__(34);

var $TypeError = TypeError;

// `OrdinaryToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-ordinarytoprimitive
module.exports = function (input, pref) {
  var fn, val;
  if (pref === 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
  if (isCallable(fn = input.valueOf) && !isObject(val = call(fn, input))) return val;
  if (pref !== 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
  throw new $TypeError("Can't convert object to primitive value");
};


/***/ },

/***/ 5031
(module, __unused_webpack_exports, __webpack_require__) {


var getBuiltIn = __webpack_require__(7751);
var uncurryThis = __webpack_require__(9504);
var getOwnPropertyNamesModule = __webpack_require__(8480);
var getOwnPropertySymbolsModule = __webpack_require__(3717);
var anObject = __webpack_require__(8551);

var concat = uncurryThis([].concat);

// all object keys, includes non-enumerable and symbols
module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? concat(keys, getOwnPropertySymbols(it)) : keys;
};


/***/ },

/***/ 9167
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);

module.exports = globalThis;


/***/ },

/***/ 1103
(module) {


module.exports = function (exec) {
  try {
    return { error: false, value: exec() };
  } catch (error) {
    return { error: true, value: error };
  }
};


/***/ },

/***/ 916
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var NativePromiseConstructor = __webpack_require__(550);
var isCallable = __webpack_require__(4901);
var isForced = __webpack_require__(2796);
var inspectSource = __webpack_require__(3706);
var wellKnownSymbol = __webpack_require__(8227);
var ENVIRONMENT = __webpack_require__(4215);
var IS_PURE = __webpack_require__(6395);
var V8_VERSION = __webpack_require__(9519);

var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;
var SPECIES = wellKnownSymbol('species');
var SUBCLASSING = false;
var NATIVE_PROMISE_REJECTION_EVENT = isCallable(globalThis.PromiseRejectionEvent);

var FORCED_PROMISE_CONSTRUCTOR = isForced('Promise', function () {
  var PROMISE_CONSTRUCTOR_SOURCE = inspectSource(NativePromiseConstructor);
  var GLOBAL_CORE_JS_PROMISE = PROMISE_CONSTRUCTOR_SOURCE !== String(NativePromiseConstructor);
  // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
  // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
  // We can't detect it synchronously, so just check versions
  if (!GLOBAL_CORE_JS_PROMISE && V8_VERSION === 66) return true;
  // We need Promise#{ catch, finally } in the pure version for preventing prototype pollution
  if (IS_PURE && !(NativePromisePrototype['catch'] && NativePromisePrototype['finally'])) return true;
  // We can't use @@species feature detection in V8 since it causes
  // deoptimization and performance degradation
  // https://github.com/zloirock/core-js/issues/679
  if (!V8_VERSION || V8_VERSION < 51 || !/native code/.test(PROMISE_CONSTRUCTOR_SOURCE)) {
    // Detect correctness of subclassing with @@species support
    var promise = new NativePromiseConstructor(function (resolve) { resolve(1); });
    var FakePromise = function (exec) {
      exec(function () { /* empty */ }, function () { /* empty */ });
    };
    var constructor = promise.constructor = {};
    constructor[SPECIES] = FakePromise;
    SUBCLASSING = promise.then(function () { /* empty */ }) instanceof FakePromise;
    if (!SUBCLASSING) return true;
  // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
  } return !GLOBAL_CORE_JS_PROMISE && (ENVIRONMENT === 'BROWSER' || ENVIRONMENT === 'DENO') && !NATIVE_PROMISE_REJECTION_EVENT;
});

module.exports = {
  CONSTRUCTOR: FORCED_PROMISE_CONSTRUCTOR,
  REJECTION_EVENT: NATIVE_PROMISE_REJECTION_EVENT,
  SUBCLASSING: SUBCLASSING
};


/***/ },

/***/ 550
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);

module.exports = globalThis.Promise;


/***/ },

/***/ 3438
(module, __unused_webpack_exports, __webpack_require__) {


var anObject = __webpack_require__(8551);
var isObject = __webpack_require__(34);
var newPromiseCapability = __webpack_require__(6043);

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};


/***/ },

/***/ 537
(module, __unused_webpack_exports, __webpack_require__) {


var NativePromiseConstructor = __webpack_require__(550);
var checkCorrectnessOfIteration = __webpack_require__(4428);
var FORCED_PROMISE_CONSTRUCTOR = (__webpack_require__(916).CONSTRUCTOR);

module.exports = FORCED_PROMISE_CONSTRUCTOR || !checkCorrectnessOfIteration(function (iterable) {
  NativePromiseConstructor.all(iterable).then(undefined, function () { /* empty */ });
});


/***/ },

/***/ 8265
(module) {


var Queue = function () {
  this.head = null;
  this.tail = null;
};

Queue.prototype = {
  add: function (item) {
    var entry = { item: item, next: null };
    var tail = this.tail;
    if (tail) tail.next = entry;
    else this.head = entry;
    this.tail = entry;
  },
  get: function () {
    var entry = this.head;
    if (entry) {
      var next = this.head = entry.next;
      if (next === null) this.tail = null;
      return entry.item;
    }
  }
};

module.exports = Queue;


/***/ },

/***/ 7750
(module, __unused_webpack_exports, __webpack_require__) {


var isNullOrUndefined = __webpack_require__(4117);

var $TypeError = TypeError;

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (isNullOrUndefined(it)) throw new $TypeError("Can't call method on " + it);
  return it;
};


/***/ },

/***/ 3389
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var DESCRIPTORS = __webpack_require__(3724);

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Avoid NodeJS experimental warning
module.exports = function (name) {
  if (!DESCRIPTORS) return globalThis[name];
  var descriptor = getOwnPropertyDescriptor(globalThis, name);
  return descriptor && descriptor.value;
};


/***/ },

/***/ 7633
(module, __unused_webpack_exports, __webpack_require__) {


var getBuiltIn = __webpack_require__(7751);
var defineBuiltInAccessor = __webpack_require__(2106);
var wellKnownSymbol = __webpack_require__(8227);
var DESCRIPTORS = __webpack_require__(3724);

var SPECIES = wellKnownSymbol('species');

module.exports = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);

  if (DESCRIPTORS && Constructor && !Constructor[SPECIES]) {
    defineBuiltInAccessor(Constructor, SPECIES, {
      configurable: true,
      get: function () { return this; }
    });
  }
};


/***/ },

/***/ 687
(module, __unused_webpack_exports, __webpack_require__) {


var defineProperty = (__webpack_require__(4913).f);
var hasOwn = __webpack_require__(9297);
var wellKnownSymbol = __webpack_require__(8227);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

module.exports = function (target, TAG, STATIC) {
  if (target && !STATIC) target = target.prototype;
  if (target && !hasOwn(target, TO_STRING_TAG)) {
    defineProperty(target, TO_STRING_TAG, { configurable: true, value: TAG });
  }
};


/***/ },

/***/ 6119
(module, __unused_webpack_exports, __webpack_require__) {


var shared = __webpack_require__(5745);
var uid = __webpack_require__(3392);

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};


/***/ },

/***/ 7629
(module, __unused_webpack_exports, __webpack_require__) {


var IS_PURE = __webpack_require__(6395);
var globalThis = __webpack_require__(4576);
var defineGlobalProperty = __webpack_require__(9433);

var SHARED = '__core-js_shared__';
var store = module.exports = globalThis[SHARED] || defineGlobalProperty(SHARED, {});

(store.versions || (store.versions = [])).push({
  version: '3.38.1',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2014-2024 Denis Pushkarev (zloirock.ru)',
  license: 'https://github.com/zloirock/core-js/blob/v3.38.1/LICENSE',
  source: 'https://github.com/zloirock/core-js'
});


/***/ },

/***/ 5745
(module, __unused_webpack_exports, __webpack_require__) {


var store = __webpack_require__(7629);

module.exports = function (key, value) {
  return store[key] || (store[key] = value || {});
};


/***/ },

/***/ 2293
(module, __unused_webpack_exports, __webpack_require__) {


var anObject = __webpack_require__(8551);
var aConstructor = __webpack_require__(5548);
var isNullOrUndefined = __webpack_require__(4117);
var wellKnownSymbol = __webpack_require__(8227);

var SPECIES = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.es/ecma262/#sec-speciesconstructor
module.exports = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || isNullOrUndefined(S = anObject(C)[SPECIES]) ? defaultConstructor : aConstructor(S);
};


/***/ },

/***/ 8183
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);
var toIntegerOrInfinity = __webpack_require__(1291);
var toString = __webpack_require__(655);
var requireObjectCoercible = __webpack_require__(7750);

var charAt = uncurryThis(''.charAt);
var charCodeAt = uncurryThis(''.charCodeAt);
var stringSlice = uncurryThis(''.slice);

var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = toString(requireObjectCoercible($this));
    var position = toIntegerOrInfinity(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = charCodeAt(S, position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = charCodeAt(S, position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING
          ? charAt(S, position)
          : first
        : CONVERT_TO_STRING
          ? stringSlice(S, position, position + 2)
          : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

module.exports = {
  // `String.prototype.codePointAt` method
  // https://tc39.es/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};


/***/ },

/***/ 4495
(module, __unused_webpack_exports, __webpack_require__) {


/* eslint-disable es/no-symbol -- required for testing */
var V8_VERSION = __webpack_require__(9519);
var fails = __webpack_require__(9039);
var globalThis = __webpack_require__(4576);

var $String = globalThis.String;

// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol('symbol detection');
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  // nb: Do not call `String` directly to avoid this being optimized out to `symbol+''` which will,
  // of course, fail.
  return !$String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});


/***/ },

/***/ 9225
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var apply = __webpack_require__(8745);
var bind = __webpack_require__(6080);
var isCallable = __webpack_require__(4901);
var hasOwn = __webpack_require__(9297);
var fails = __webpack_require__(9039);
var html = __webpack_require__(397);
var arraySlice = __webpack_require__(7680);
var createElement = __webpack_require__(4055);
var validateArgumentsLength = __webpack_require__(2812);
var IS_IOS = __webpack_require__(9544);
var IS_NODE = __webpack_require__(8574);

var set = globalThis.setImmediate;
var clear = globalThis.clearImmediate;
var process = globalThis.process;
var Dispatch = globalThis.Dispatch;
var Function = globalThis.Function;
var MessageChannel = globalThis.MessageChannel;
var String = globalThis.String;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var $location, defer, channel, port;

fails(function () {
  // Deno throws a ReferenceError on `location` access without `--location` flag
  $location = globalThis.location;
});

var run = function (id) {
  if (hasOwn(queue, id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run(id);
  };
};

var eventListener = function (event) {
  run(event.data);
};

var globalPostMessageDefer = function (id) {
  // old engines have not location.origin
  globalThis.postMessage(String(id), $location.protocol + '//' + $location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set || !clear) {
  set = function setImmediate(handler) {
    validateArgumentsLength(arguments.length, 1);
    var fn = isCallable(handler) ? handler : Function(handler);
    var args = arraySlice(arguments, 1);
    queue[++counter] = function () {
      apply(fn, undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (IS_NODE) {
    defer = function (id) {
      process.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  // except iOS - https://github.com/zloirock/core-js/issues/624
  } else if (MessageChannel && !IS_IOS) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = eventListener;
    defer = bind(port.postMessage, port);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (
    globalThis.addEventListener &&
    isCallable(globalThis.postMessage) &&
    !globalThis.importScripts &&
    $location && $location.protocol !== 'file:' &&
    !fails(globalPostMessageDefer)
  ) {
    defer = globalPostMessageDefer;
    globalThis.addEventListener('message', eventListener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in createElement('script')) {
    defer = function (id) {
      html.appendChild(createElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

module.exports = {
  set: set,
  clear: clear
};


/***/ },

/***/ 5610
(module, __unused_webpack_exports, __webpack_require__) {


var toIntegerOrInfinity = __webpack_require__(1291);

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
module.exports = function (index, length) {
  var integer = toIntegerOrInfinity(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};


/***/ },

/***/ 5397
(module, __unused_webpack_exports, __webpack_require__) {


// toObject with fallback for non-array-like ES3 strings
var IndexedObject = __webpack_require__(7055);
var requireObjectCoercible = __webpack_require__(7750);

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};


/***/ },

/***/ 1291
(module, __unused_webpack_exports, __webpack_require__) {


var trunc = __webpack_require__(741);

// `ToIntegerOrInfinity` abstract operation
// https://tc39.es/ecma262/#sec-tointegerorinfinity
module.exports = function (argument) {
  var number = +argument;
  // eslint-disable-next-line no-self-compare -- NaN check
  return number !== number || number === 0 ? 0 : trunc(number);
};


/***/ },

/***/ 8014
(module, __unused_webpack_exports, __webpack_require__) {


var toIntegerOrInfinity = __webpack_require__(1291);

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength
module.exports = function (argument) {
  var len = toIntegerOrInfinity(argument);
  return len > 0 ? min(len, 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};


/***/ },

/***/ 8981
(module, __unused_webpack_exports, __webpack_require__) {


var requireObjectCoercible = __webpack_require__(7750);

var $Object = Object;

// `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject
module.exports = function (argument) {
  return $Object(requireObjectCoercible(argument));
};


/***/ },

/***/ 2777
(module, __unused_webpack_exports, __webpack_require__) {


var call = __webpack_require__(9565);
var isObject = __webpack_require__(34);
var isSymbol = __webpack_require__(757);
var getMethod = __webpack_require__(5966);
var ordinaryToPrimitive = __webpack_require__(4270);
var wellKnownSymbol = __webpack_require__(8227);

var $TypeError = TypeError;
var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

// `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
module.exports = function (input, pref) {
  if (!isObject(input) || isSymbol(input)) return input;
  var exoticToPrim = getMethod(input, TO_PRIMITIVE);
  var result;
  if (exoticToPrim) {
    if (pref === undefined) pref = 'default';
    result = call(exoticToPrim, input, pref);
    if (!isObject(result) || isSymbol(result)) return result;
    throw new $TypeError("Can't convert object to primitive value");
  }
  if (pref === undefined) pref = 'number';
  return ordinaryToPrimitive(input, pref);
};


/***/ },

/***/ 6969
(module, __unused_webpack_exports, __webpack_require__) {


var toPrimitive = __webpack_require__(2777);
var isSymbol = __webpack_require__(757);

// `ToPropertyKey` abstract operation
// https://tc39.es/ecma262/#sec-topropertykey
module.exports = function (argument) {
  var key = toPrimitive(argument, 'string');
  return isSymbol(key) ? key : key + '';
};


/***/ },

/***/ 2140
(module, __unused_webpack_exports, __webpack_require__) {


var wellKnownSymbol = __webpack_require__(8227);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG] = 'z';

module.exports = String(test) === '[object z]';


/***/ },

/***/ 655
(module, __unused_webpack_exports, __webpack_require__) {


var classof = __webpack_require__(6955);

var $String = String;

module.exports = function (argument) {
  if (classof(argument) === 'Symbol') throw new TypeError('Cannot convert a Symbol value to a string');
  return $String(argument);
};


/***/ },

/***/ 6823
(module) {


var $String = String;

module.exports = function (argument) {
  try {
    return $String(argument);
  } catch (error) {
    return 'Object';
  }
};


/***/ },

/***/ 3392
(module, __unused_webpack_exports, __webpack_require__) {


var uncurryThis = __webpack_require__(9504);

var id = 0;
var postfix = Math.random();
var toString = uncurryThis(1.0.toString);

module.exports = function (key) {
  return 'Symbol(' + (key === undefined ? '' : key) + ')_' + toString(++id + postfix, 36);
};


/***/ },

/***/ 7040
(module, __unused_webpack_exports, __webpack_require__) {


/* eslint-disable es/no-symbol -- required for testing */
var NATIVE_SYMBOL = __webpack_require__(4495);

module.exports = NATIVE_SYMBOL
  && !Symbol.sham
  && typeof Symbol.iterator == 'symbol';


/***/ },

/***/ 8686
(module, __unused_webpack_exports, __webpack_require__) {


var DESCRIPTORS = __webpack_require__(3724);
var fails = __webpack_require__(9039);

// V8 ~ Chrome 36-
// https://bugs.chromium.org/p/v8/issues/detail?id=3334
module.exports = DESCRIPTORS && fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty(function () { /* empty */ }, 'prototype', {
    value: 42,
    writable: false
  }).prototype !== 42;
});


/***/ },

/***/ 2812
(module) {


var $TypeError = TypeError;

module.exports = function (passed, required) {
  if (passed < required) throw new $TypeError('Not enough arguments');
  return passed;
};


/***/ },

/***/ 8622
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var isCallable = __webpack_require__(4901);

var WeakMap = globalThis.WeakMap;

module.exports = isCallable(WeakMap) && /native code/.test(String(WeakMap));


/***/ },

/***/ 8227
(module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var shared = __webpack_require__(5745);
var hasOwn = __webpack_require__(9297);
var uid = __webpack_require__(3392);
var NATIVE_SYMBOL = __webpack_require__(4495);
var USE_SYMBOL_AS_UID = __webpack_require__(7040);

var Symbol = globalThis.Symbol;
var WellKnownSymbolsStore = shared('wks');
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol['for'] || Symbol : Symbol && Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!hasOwn(WellKnownSymbolsStore, name)) {
    WellKnownSymbolsStore[name] = NATIVE_SYMBOL && hasOwn(Symbol, name)
      ? Symbol[name]
      : createWellKnownSymbol('Symbol.' + name);
  } return WellKnownSymbolsStore[name];
};


/***/ },

/***/ 7145
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var isPrototypeOf = __webpack_require__(1625);
var getPrototypeOf = __webpack_require__(2787);
var setPrototypeOf = __webpack_require__(2967);
var copyConstructorProperties = __webpack_require__(7740);
var create = __webpack_require__(2360);
var createNonEnumerableProperty = __webpack_require__(6699);
var createPropertyDescriptor = __webpack_require__(6980);
var installErrorCause = __webpack_require__(7584);
var installErrorStack = __webpack_require__(747);
var iterate = __webpack_require__(2652);
var normalizeStringArgument = __webpack_require__(2603);
var wellKnownSymbol = __webpack_require__(8227);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var $Error = Error;
var push = [].push;

var $AggregateError = function AggregateError(errors, message /* , options */) {
  var isInstance = isPrototypeOf(AggregateErrorPrototype, this);
  var that;
  if (setPrototypeOf) {
    that = setPrototypeOf(new $Error(), isInstance ? getPrototypeOf(this) : AggregateErrorPrototype);
  } else {
    that = isInstance ? this : create(AggregateErrorPrototype);
    createNonEnumerableProperty(that, TO_STRING_TAG, 'Error');
  }
  if (message !== undefined) createNonEnumerableProperty(that, 'message', normalizeStringArgument(message));
  installErrorStack(that, $AggregateError, that.stack, 1);
  if (arguments.length > 2) installErrorCause(that, arguments[2]);
  var errorsArray = [];
  iterate(errors, push, { that: errorsArray });
  createNonEnumerableProperty(that, 'errors', errorsArray);
  return that;
};

if (setPrototypeOf) setPrototypeOf($AggregateError, $Error);
else copyConstructorProperties($AggregateError, $Error, { name: true });

var AggregateErrorPrototype = $AggregateError.prototype = create($Error.prototype, {
  constructor: createPropertyDescriptor(1, $AggregateError),
  message: createPropertyDescriptor(1, ''),
  name: createPropertyDescriptor(1, 'AggregateError')
});

// `AggregateError` constructor
// https://tc39.es/ecma262/#sec-aggregate-error-constructor
$({ global: true, constructor: true, arity: 2 }, {
  AggregateError: $AggregateError
});


/***/ },

/***/ 67
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


// TODO: Remove this module from `core-js@4` since it's replaced to module below
__webpack_require__(7145);


/***/ },

/***/ 3792
(module, __unused_webpack_exports, __webpack_require__) {


var toIndexedObject = __webpack_require__(5397);
var addToUnscopables = __webpack_require__(6469);
var Iterators = __webpack_require__(6269);
var InternalStateModule = __webpack_require__(1181);
var defineProperty = (__webpack_require__(4913).f);
var defineIterator = __webpack_require__(1088);
var createIterResultObject = __webpack_require__(2529);
var IS_PURE = __webpack_require__(6395);
var DESCRIPTORS = __webpack_require__(3724);

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.es/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.es/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.es/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.es/ecma262/#sec-createarrayiterator
module.exports = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
  var target = state.target;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = null;
    return createIterResultObject(undefined, true);
  }
  switch (state.kind) {
    case 'keys': return createIterResultObject(index, false);
    case 'values': return createIterResultObject(target[index], false);
  } return createIterResultObject([index, target[index]], false);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
// https://tc39.es/ecma262/#sec-createmappedargumentsobject
var values = Iterators.Arguments = Iterators.Array;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

// V8 ~ Chrome 45- bug
if (!IS_PURE && DESCRIPTORS && values.name !== 'values') try {
  defineProperty(values, 'name', { value: 'values' });
} catch (error) { /* empty */ }


/***/ },

/***/ 6099
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var TO_STRING_TAG_SUPPORT = __webpack_require__(2140);
var defineBuiltIn = __webpack_require__(6840);
var toString = __webpack_require__(3179);

// `Object.prototype.toString` method
// https://tc39.es/ecma262/#sec-object.prototype.tostring
if (!TO_STRING_TAG_SUPPORT) {
  defineBuiltIn(Object.prototype, 'toString', toString, { unsafe: true });
}


/***/ },

/***/ 6167
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var call = __webpack_require__(9565);
var aCallable = __webpack_require__(9306);
var newPromiseCapabilityModule = __webpack_require__(6043);
var perform = __webpack_require__(1103);
var iterate = __webpack_require__(2652);
var PROMISE_STATICS_INCORRECT_ITERATION = __webpack_require__(537);

// `Promise.allSettled` method
// https://tc39.es/ecma262/#sec-promise.allsettled
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  allSettled: function allSettled(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var promiseResolve = aCallable(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        remaining++;
        call(promiseResolve, C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = { status: 'fulfilled', value: value };
          --remaining || resolve(values);
        }, function (error) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = { status: 'rejected', reason: error };
          --remaining || resolve(values);
        });
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ },

/***/ 6499
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var call = __webpack_require__(9565);
var aCallable = __webpack_require__(9306);
var newPromiseCapabilityModule = __webpack_require__(6043);
var perform = __webpack_require__(1103);
var iterate = __webpack_require__(2652);
var PROMISE_STATICS_INCORRECT_ITERATION = __webpack_require__(537);

// `Promise.all` method
// https://tc39.es/ecma262/#sec-promise.all
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aCallable(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        remaining++;
        call($promiseResolve, C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ },

/***/ 3518
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var call = __webpack_require__(9565);
var aCallable = __webpack_require__(9306);
var getBuiltIn = __webpack_require__(7751);
var newPromiseCapabilityModule = __webpack_require__(6043);
var perform = __webpack_require__(1103);
var iterate = __webpack_require__(2652);
var PROMISE_STATICS_INCORRECT_ITERATION = __webpack_require__(537);

var PROMISE_ANY_ERROR = 'No one promise resolved';

// `Promise.any` method
// https://tc39.es/ecma262/#sec-promise.any
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  any: function any(iterable) {
    var C = this;
    var AggregateError = getBuiltIn('AggregateError');
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var promiseResolve = aCallable(C.resolve);
      var errors = [];
      var counter = 0;
      var remaining = 1;
      var alreadyResolved = false;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyRejected = false;
        remaining++;
        call(promiseResolve, C, promise).then(function (value) {
          if (alreadyRejected || alreadyResolved) return;
          alreadyResolved = true;
          resolve(value);
        }, function (error) {
          if (alreadyRejected || alreadyResolved) return;
          alreadyRejected = true;
          errors[index] = error;
          --remaining || reject(new AggregateError(errors, PROMISE_ANY_ERROR));
        });
      });
      --remaining || reject(new AggregateError(errors, PROMISE_ANY_ERROR));
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ },

/***/ 2003
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var IS_PURE = __webpack_require__(6395);
var FORCED_PROMISE_CONSTRUCTOR = (__webpack_require__(916).CONSTRUCTOR);
var NativePromiseConstructor = __webpack_require__(550);
var getBuiltIn = __webpack_require__(7751);
var isCallable = __webpack_require__(4901);
var defineBuiltIn = __webpack_require__(6840);

var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;

// `Promise.prototype.catch` method
// https://tc39.es/ecma262/#sec-promise.prototype.catch
$({ target: 'Promise', proto: true, forced: FORCED_PROMISE_CONSTRUCTOR, real: true }, {
  'catch': function (onRejected) {
    return this.then(undefined, onRejected);
  }
});

// makes sure that native promise-based APIs `Promise#catch` properly works with patched `Promise#then`
if (!IS_PURE && isCallable(NativePromiseConstructor)) {
  var method = getBuiltIn('Promise').prototype['catch'];
  if (NativePromisePrototype['catch'] !== method) {
    defineBuiltIn(NativePromisePrototype, 'catch', method, { unsafe: true });
  }
}


/***/ },

/***/ 436
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var IS_PURE = __webpack_require__(6395);
var IS_NODE = __webpack_require__(8574);
var globalThis = __webpack_require__(4576);
var call = __webpack_require__(9565);
var defineBuiltIn = __webpack_require__(6840);
var setPrototypeOf = __webpack_require__(2967);
var setToStringTag = __webpack_require__(687);
var setSpecies = __webpack_require__(7633);
var aCallable = __webpack_require__(9306);
var isCallable = __webpack_require__(4901);
var isObject = __webpack_require__(34);
var anInstance = __webpack_require__(679);
var speciesConstructor = __webpack_require__(2293);
var task = (__webpack_require__(9225).set);
var microtask = __webpack_require__(1955);
var hostReportErrors = __webpack_require__(3138);
var perform = __webpack_require__(1103);
var Queue = __webpack_require__(8265);
var InternalStateModule = __webpack_require__(1181);
var NativePromiseConstructor = __webpack_require__(550);
var PromiseConstructorDetection = __webpack_require__(916);
var newPromiseCapabilityModule = __webpack_require__(6043);

var PROMISE = 'Promise';
var FORCED_PROMISE_CONSTRUCTOR = PromiseConstructorDetection.CONSTRUCTOR;
var NATIVE_PROMISE_REJECTION_EVENT = PromiseConstructorDetection.REJECTION_EVENT;
var NATIVE_PROMISE_SUBCLASSING = PromiseConstructorDetection.SUBCLASSING;
var getInternalPromiseState = InternalStateModule.getterFor(PROMISE);
var setInternalState = InternalStateModule.set;
var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;
var PromiseConstructor = NativePromiseConstructor;
var PromisePrototype = NativePromisePrototype;
var TypeError = globalThis.TypeError;
var document = globalThis.document;
var process = globalThis.process;
var newPromiseCapability = newPromiseCapabilityModule.f;
var newGenericPromiseCapability = newPromiseCapability;

var DISPATCH_EVENT = !!(document && document.createEvent && globalThis.dispatchEvent);
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;

var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && isCallable(then = it.then) ? then : false;
};

var callReaction = function (reaction, state) {
  var value = state.value;
  var ok = state.state === FULFILLED;
  var handler = ok ? reaction.ok : reaction.fail;
  var resolve = reaction.resolve;
  var reject = reaction.reject;
  var domain = reaction.domain;
  var result, then, exited;
  try {
    if (handler) {
      if (!ok) {
        if (state.rejection === UNHANDLED) onHandleUnhandled(state);
        state.rejection = HANDLED;
      }
      if (handler === true) result = value;
      else {
        if (domain) domain.enter();
        result = handler(value); // can throw
        if (domain) {
          domain.exit();
          exited = true;
        }
      }
      if (result === reaction.promise) {
        reject(new TypeError('Promise-chain cycle'));
      } else if (then = isThenable(result)) {
        call(then, result, resolve, reject);
      } else resolve(result);
    } else reject(value);
  } catch (error) {
    if (domain && !exited) domain.exit();
    reject(error);
  }
};

var notify = function (state, isReject) {
  if (state.notified) return;
  state.notified = true;
  microtask(function () {
    var reactions = state.reactions;
    var reaction;
    while (reaction = reactions.get()) {
      callReaction(reaction, state);
    }
    state.notified = false;
    if (isReject && !state.rejection) onUnhandled(state);
  });
};

var dispatchEvent = function (name, promise, reason) {
  var event, handler;
  if (DISPATCH_EVENT) {
    event = document.createEvent('Event');
    event.promise = promise;
    event.reason = reason;
    event.initEvent(name, false, true);
    globalThis.dispatchEvent(event);
  } else event = { promise: promise, reason: reason };
  if (!NATIVE_PROMISE_REJECTION_EVENT && (handler = globalThis['on' + name])) handler(event);
  else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
};

var onUnhandled = function (state) {
  call(task, globalThis, function () {
    var promise = state.facade;
    var value = state.value;
    var IS_UNHANDLED = isUnhandled(state);
    var result;
    if (IS_UNHANDLED) {
      result = perform(function () {
        if (IS_NODE) {
          process.emit('unhandledRejection', value, promise);
        } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      state.rejection = IS_NODE || isUnhandled(state) ? UNHANDLED : HANDLED;
      if (result.error) throw result.value;
    }
  });
};

var isUnhandled = function (state) {
  return state.rejection !== HANDLED && !state.parent;
};

var onHandleUnhandled = function (state) {
  call(task, globalThis, function () {
    var promise = state.facade;
    if (IS_NODE) {
      process.emit('rejectionHandled', promise);
    } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
  });
};

var bind = function (fn, state, unwrap) {
  return function (value) {
    fn(state, value, unwrap);
  };
};

var internalReject = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  state.value = value;
  state.state = REJECTED;
  notify(state, true);
};

var internalResolve = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  try {
    if (state.facade === value) throw new TypeError("Promise can't be resolved itself");
    var then = isThenable(value);
    if (then) {
      microtask(function () {
        var wrapper = { done: false };
        try {
          call(then, value,
            bind(internalResolve, wrapper, state),
            bind(internalReject, wrapper, state)
          );
        } catch (error) {
          internalReject(wrapper, error, state);
        }
      });
    } else {
      state.value = value;
      state.state = FULFILLED;
      notify(state, false);
    }
  } catch (error) {
    internalReject({ done: false }, error, state);
  }
};

// constructor polyfill
if (FORCED_PROMISE_CONSTRUCTOR) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance(this, PromisePrototype);
    aCallable(executor);
    call(Internal, this);
    var state = getInternalPromiseState(this);
    try {
      executor(bind(internalResolve, state), bind(internalReject, state));
    } catch (error) {
      internalReject(state, error);
    }
  };

  PromisePrototype = PromiseConstructor.prototype;

  // eslint-disable-next-line no-unused-vars -- required for `.length`
  Internal = function Promise(executor) {
    setInternalState(this, {
      type: PROMISE,
      done: false,
      notified: false,
      parent: false,
      reactions: new Queue(),
      rejection: false,
      state: PENDING,
      value: null
    });
  };

  // `Promise.prototype.then` method
  // https://tc39.es/ecma262/#sec-promise.prototype.then
  Internal.prototype = defineBuiltIn(PromisePrototype, 'then', function then(onFulfilled, onRejected) {
    var state = getInternalPromiseState(this);
    var reaction = newPromiseCapability(speciesConstructor(this, PromiseConstructor));
    state.parent = true;
    reaction.ok = isCallable(onFulfilled) ? onFulfilled : true;
    reaction.fail = isCallable(onRejected) && onRejected;
    reaction.domain = IS_NODE ? process.domain : undefined;
    if (state.state === PENDING) state.reactions.add(reaction);
    else microtask(function () {
      callReaction(reaction, state);
    });
    return reaction.promise;
  });

  OwnPromiseCapability = function () {
    var promise = new Internal();
    var state = getInternalPromiseState(promise);
    this.promise = promise;
    this.resolve = bind(internalResolve, state);
    this.reject = bind(internalReject, state);
  };

  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === PromiseConstructor || C === PromiseWrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };

  if (!IS_PURE && isCallable(NativePromiseConstructor) && NativePromisePrototype !== Object.prototype) {
    nativeThen = NativePromisePrototype.then;

    if (!NATIVE_PROMISE_SUBCLASSING) {
      // make `Promise#then` return a polyfilled `Promise` for native promise-based APIs
      defineBuiltIn(NativePromisePrototype, 'then', function then(onFulfilled, onRejected) {
        var that = this;
        return new PromiseConstructor(function (resolve, reject) {
          call(nativeThen, that, resolve, reject);
        }).then(onFulfilled, onRejected);
      // https://github.com/zloirock/core-js/issues/640
      }, { unsafe: true });
    }

    // make `.constructor === Promise` work for native promise-based APIs
    try {
      delete NativePromisePrototype.constructor;
    } catch (error) { /* empty */ }

    // make `instanceof Promise` work for native promise-based APIs
    if (setPrototypeOf) {
      setPrototypeOf(NativePromisePrototype, PromisePrototype);
    }
  }
}

$({ global: true, constructor: true, wrap: true, forced: FORCED_PROMISE_CONSTRUCTOR }, {
  Promise: PromiseConstructor
});

setToStringTag(PromiseConstructor, PROMISE, false, true);
setSpecies(PROMISE);


/***/ },

/***/ 9391
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var IS_PURE = __webpack_require__(6395);
var NativePromiseConstructor = __webpack_require__(550);
var fails = __webpack_require__(9039);
var getBuiltIn = __webpack_require__(7751);
var isCallable = __webpack_require__(4901);
var speciesConstructor = __webpack_require__(2293);
var promiseResolve = __webpack_require__(3438);
var defineBuiltIn = __webpack_require__(6840);

var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;

// Safari bug https://bugs.webkit.org/show_bug.cgi?id=200829
var NON_GENERIC = !!NativePromiseConstructor && fails(function () {
  // eslint-disable-next-line unicorn/no-thenable -- required for testing
  NativePromisePrototype['finally'].call({ then: function () { /* empty */ } }, function () { /* empty */ });
});

// `Promise.prototype.finally` method
// https://tc39.es/ecma262/#sec-promise.prototype.finally
$({ target: 'Promise', proto: true, real: true, forced: NON_GENERIC }, {
  'finally': function (onFinally) {
    var C = speciesConstructor(this, getBuiltIn('Promise'));
    var isFunction = isCallable(onFinally);
    return this.then(
      isFunction ? function (x) {
        return promiseResolve(C, onFinally()).then(function () { return x; });
      } : onFinally,
      isFunction ? function (e) {
        return promiseResolve(C, onFinally()).then(function () { throw e; });
      } : onFinally
    );
  }
});

// makes sure that native promise-based APIs `Promise#finally` properly works with patched `Promise#then`
if (!IS_PURE && isCallable(NativePromiseConstructor)) {
  var method = getBuiltIn('Promise').prototype['finally'];
  if (NativePromisePrototype['finally'] !== method) {
    defineBuiltIn(NativePromisePrototype, 'finally', method, { unsafe: true });
  }
}


/***/ },

/***/ 3362
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


// TODO: Remove this module from `core-js@4` since it's split to modules listed below
__webpack_require__(436);
__webpack_require__(6499);
__webpack_require__(2003);
__webpack_require__(7743);
__webpack_require__(1481);
__webpack_require__(280);


/***/ },

/***/ 7743
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var call = __webpack_require__(9565);
var aCallable = __webpack_require__(9306);
var newPromiseCapabilityModule = __webpack_require__(6043);
var perform = __webpack_require__(1103);
var iterate = __webpack_require__(2652);
var PROMISE_STATICS_INCORRECT_ITERATION = __webpack_require__(537);

// `Promise.race` method
// https://tc39.es/ecma262/#sec-promise.race
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aCallable(C.resolve);
      iterate(iterable, function (promise) {
        call($promiseResolve, C, promise).then(capability.resolve, reject);
      });
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ },

/***/ 1481
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var newPromiseCapabilityModule = __webpack_require__(6043);
var FORCED_PROMISE_CONSTRUCTOR = (__webpack_require__(916).CONSTRUCTOR);

// `Promise.reject` method
// https://tc39.es/ecma262/#sec-promise.reject
$({ target: 'Promise', stat: true, forced: FORCED_PROMISE_CONSTRUCTOR }, {
  reject: function reject(r) {
    var capability = newPromiseCapabilityModule.f(this);
    var capabilityReject = capability.reject;
    capabilityReject(r);
    return capability.promise;
  }
});


/***/ },

/***/ 280
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var getBuiltIn = __webpack_require__(7751);
var IS_PURE = __webpack_require__(6395);
var NativePromiseConstructor = __webpack_require__(550);
var FORCED_PROMISE_CONSTRUCTOR = (__webpack_require__(916).CONSTRUCTOR);
var promiseResolve = __webpack_require__(3438);

var PromiseConstructorWrapper = getBuiltIn('Promise');
var CHECK_WRAPPER = IS_PURE && !FORCED_PROMISE_CONSTRUCTOR;

// `Promise.resolve` method
// https://tc39.es/ecma262/#sec-promise.resolve
$({ target: 'Promise', stat: true, forced: IS_PURE || FORCED_PROMISE_CONSTRUCTOR }, {
  resolve: function resolve(x) {
    return promiseResolve(CHECK_WRAPPER && this === PromiseConstructorWrapper ? NativePromiseConstructor : this, x);
  }
});


/***/ },

/***/ 4628
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var newPromiseCapabilityModule = __webpack_require__(6043);

// `Promise.withResolvers` method
// https://github.com/tc39/proposal-promise-with-resolvers
$({ target: 'Promise', stat: true }, {
  withResolvers: function withResolvers() {
    var promiseCapability = newPromiseCapabilityModule.f(this);
    return {
      promise: promiseCapability.promise,
      resolve: promiseCapability.resolve,
      reject: promiseCapability.reject
    };
  }
});


/***/ },

/***/ 7764
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var charAt = (__webpack_require__(8183).charAt);
var toString = __webpack_require__(655);
var InternalStateModule = __webpack_require__(1181);
var defineIterator = __webpack_require__(1088);
var createIterResultObject = __webpack_require__(2529);

var STRING_ITERATOR = 'String Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-string.prototype-@@iterator
defineIterator(String, 'String', function (iterated) {
  setInternalState(this, {
    type: STRING_ITERATOR,
    string: toString(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return createIterResultObject(undefined, true);
  point = charAt(string, index);
  state.index += point.length;
  return createIterResultObject(point, false);
});


/***/ },

/***/ 9806
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


// TODO: Remove from `core-js@4`
__webpack_require__(67);


/***/ },

/***/ 5874
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


// TODO: Remove from `core-js@4`
__webpack_require__(6167);


/***/ },

/***/ 7575
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


// TODO: Remove from `core-js@4`
__webpack_require__(3518);


/***/ },

/***/ 7628
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var $ = __webpack_require__(6518);
var globalThis = __webpack_require__(4576);
var apply = __webpack_require__(8745);
var slice = __webpack_require__(7680);
var newPromiseCapabilityModule = __webpack_require__(6043);
var aCallable = __webpack_require__(9306);
var perform = __webpack_require__(1103);

var Promise = globalThis.Promise;

var ACCEPT_ARGUMENTS = false;
// Avoiding the use of polyfills of the previous iteration of this proposal
// that does not accept arguments of the callback
var FORCED = !Promise || !Promise['try'] || perform(function () {
  Promise['try'](function (argument) {
    ACCEPT_ARGUMENTS = argument === 8;
  }, 8);
}).error || !ACCEPT_ARGUMENTS;

// `Promise.try` method
// https://github.com/tc39/proposal-promise-try
$({ target: 'Promise', stat: true, forced: FORCED }, {
  'try': function (callbackfn /* , ...args */) {
    var args = arguments.length > 1 ? slice(arguments, 1) : [];
    var promiseCapability = newPromiseCapabilityModule.f(this);
    var result = perform(function () {
      return apply(aCallable(callbackfn), undefined, args);
    });
    (result.error ? promiseCapability.reject : promiseCapability.resolve)(result.value);
    return promiseCapability.promise;
  }
});


/***/ },

/***/ 3799
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


// TODO: Remove from `core-js@4`
__webpack_require__(4628);


/***/ },

/***/ 2953
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {


var globalThis = __webpack_require__(4576);
var DOMIterables = __webpack_require__(7400);
var DOMTokenListPrototype = __webpack_require__(9296);
var ArrayIteratorMethods = __webpack_require__(3792);
var createNonEnumerableProperty = __webpack_require__(6699);
var setToStringTag = __webpack_require__(687);
var wellKnownSymbol = __webpack_require__(8227);

var ITERATOR = wellKnownSymbol('iterator');
var ArrayValues = ArrayIteratorMethods.values;

var handlePrototype = function (CollectionPrototype, COLLECTION_NAME) {
  if (CollectionPrototype) {
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype[ITERATOR] !== ArrayValues) try {
      createNonEnumerableProperty(CollectionPrototype, ITERATOR, ArrayValues);
    } catch (error) {
      CollectionPrototype[ITERATOR] = ArrayValues;
    }
    setToStringTag(CollectionPrototype, COLLECTION_NAME, true);
    if (DOMIterables[COLLECTION_NAME]) for (var METHOD_NAME in ArrayIteratorMethods) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype[METHOD_NAME] !== ArrayIteratorMethods[METHOD_NAME]) try {
        createNonEnumerableProperty(CollectionPrototype, METHOD_NAME, ArrayIteratorMethods[METHOD_NAME]);
      } catch (error) {
        CollectionPrototype[METHOD_NAME] = ArrayIteratorMethods[METHOD_NAME];
      }
    }
  }
};

for (var COLLECTION_NAME in DOMIterables) {
  handlePrototype(globalThis[COLLECTION_NAME] && globalThis[COLLECTION_NAME].prototype, COLLECTION_NAME);
}

handlePrototype(DOMTokenListPrototype, 'DOMTokenList');


/***/ },

/***/ 2473
(module, __unused_webpack_exports, __webpack_require__) {


var parent = __webpack_require__(6398);
__webpack_require__(2953);

module.exports = parent;


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	__webpack_require__(5781);
/******/ 	var __webpack_exports__ = __webpack_require__(426);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});