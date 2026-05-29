import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/@opentelemetry/api/build/src/version.js
var require_version = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.VERSION = void 0;
	exports.VERSION = "1.9.1";
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/internal/semver.js
var require_semver = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isCompatible = exports._makeCompatibilityCheck = void 0;
	var version_1 = require_version();
	var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
	/**
	* Create a function to test an API version to see if it is compatible with the provided ownVersion.
	*
	* The returned function has the following semantics:
	* - Exact match is always compatible
	* - Major versions must match exactly
	*    - 1.x package cannot use global 2.x package
	*    - 2.x package cannot use global 1.x package
	* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
	*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
	*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
	* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
	* - Patch and build tag differences are not considered at this time
	*
	* @param ownVersion version which should be checked against
	*/
	function _makeCompatibilityCheck(ownVersion) {
		const acceptedVersions = new Set([ownVersion]);
		const rejectedVersions = /* @__PURE__ */ new Set();
		const myVersionMatch = ownVersion.match(re);
		if (!myVersionMatch) return () => false;
		const ownVersionParsed = {
			major: +myVersionMatch[1],
			minor: +myVersionMatch[2],
			patch: +myVersionMatch[3],
			prerelease: myVersionMatch[4]
		};
		if (ownVersionParsed.prerelease != null) return function isExactmatch(globalVersion) {
			return globalVersion === ownVersion;
		};
		function _reject(v) {
			rejectedVersions.add(v);
			return false;
		}
		function _accept(v) {
			acceptedVersions.add(v);
			return true;
		}
		return function isCompatible(globalVersion) {
			if (acceptedVersions.has(globalVersion)) return true;
			if (rejectedVersions.has(globalVersion)) return false;
			const globalVersionMatch = globalVersion.match(re);
			if (!globalVersionMatch) return _reject(globalVersion);
			const globalVersionParsed = {
				major: +globalVersionMatch[1],
				minor: +globalVersionMatch[2],
				patch: +globalVersionMatch[3],
				prerelease: globalVersionMatch[4]
			};
			if (globalVersionParsed.prerelease != null) return _reject(globalVersion);
			if (ownVersionParsed.major !== globalVersionParsed.major) return _reject(globalVersion);
			if (ownVersionParsed.major === 0) {
				if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) return _accept(globalVersion);
				return _reject(globalVersion);
			}
			if (ownVersionParsed.minor <= globalVersionParsed.minor) return _accept(globalVersion);
			return _reject(globalVersion);
		};
	}
	exports._makeCompatibilityCheck = _makeCompatibilityCheck;
	/**
	* Test an API version to see if it is compatible with this API.
	*
	* - Exact match is always compatible
	* - Major versions must match exactly
	*    - 1.x package cannot use global 2.x package
	*    - 2.x package cannot use global 1.x package
	* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
	*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
	*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
	* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
	* - Patch and build tag differences are not considered at this time
	*
	* @param version version of the API requesting an instance of the global API
	*/
	exports.isCompatible = _makeCompatibilityCheck(version_1.VERSION);
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/internal/global-utils.js
var require_global_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.unregisterGlobal = exports.getGlobal = exports.registerGlobal = void 0;
	var version_1 = require_version();
	var semver_1 = require_semver();
	var major = version_1.VERSION.split(".")[0];
	var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
	var _global = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};
	function registerGlobal(type, instance, diag, allowOverride = false) {
		var _a;
		const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : { version: version_1.VERSION };
		if (!allowOverride && api[type]) {
			const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
			diag.error(err.stack || err.message);
			return false;
		}
		if (api.version !== version_1.VERSION) {
			const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${version_1.VERSION}`);
			diag.error(err.stack || err.message);
			return false;
		}
		api[type] = instance;
		diag.debug(`@opentelemetry/api: Registered a global for ${type} v${version_1.VERSION}.`);
		return true;
	}
	exports.registerGlobal = registerGlobal;
	function getGlobal(type) {
		var _a, _b;
		const globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
		if (!globalVersion || !(0, semver_1.isCompatible)(globalVersion)) return;
		return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
	}
	exports.getGlobal = getGlobal;
	function unregisterGlobal(type, diag) {
		diag.debug(`@opentelemetry/api: Unregistering a global for ${type} v${version_1.VERSION}.`);
		const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
		if (api) delete api[type];
	}
	exports.unregisterGlobal = unregisterGlobal;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/diag/ComponentLogger.js
var require_ComponentLogger = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagComponentLogger = void 0;
	var global_utils_1 = require_global_utils();
	/**
	* Component Logger which is meant to be used as part of any component which
	* will add automatically additional namespace in front of the log message.
	* It will then forward all message to global diag logger
	* @example
	* const cLogger = diag.createComponentLogger({ namespace: '@opentelemetry/instrumentation-http' });
	* cLogger.debug('test');
	* // @opentelemetry/instrumentation-http test
	*/
	var DiagComponentLogger = class {
		constructor(props) {
			this._namespace = props.namespace || "DiagComponentLogger";
		}
		debug(...args) {
			return logProxy("debug", this._namespace, args);
		}
		error(...args) {
			return logProxy("error", this._namespace, args);
		}
		info(...args) {
			return logProxy("info", this._namespace, args);
		}
		warn(...args) {
			return logProxy("warn", this._namespace, args);
		}
		verbose(...args) {
			return logProxy("verbose", this._namespace, args);
		}
	};
	exports.DiagComponentLogger = DiagComponentLogger;
	function logProxy(funcName, namespace, args) {
		const logger = (0, global_utils_1.getGlobal)("diag");
		if (!logger) return;
		return logger[funcName](namespace, ...args);
	}
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/diag/types.js
var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagLogLevel = void 0;
	(function(DiagLogLevel) {
		/** Diagnostic Logging level setting to disable all logging (except and forced logs) */
		DiagLogLevel[DiagLogLevel["NONE"] = 0] = "NONE";
		/** Identifies an error scenario */
		DiagLogLevel[DiagLogLevel["ERROR"] = 30] = "ERROR";
		/** Identifies a warning scenario */
		DiagLogLevel[DiagLogLevel["WARN"] = 50] = "WARN";
		/** General informational log message */
		DiagLogLevel[DiagLogLevel["INFO"] = 60] = "INFO";
		/** General debug log message */
		DiagLogLevel[DiagLogLevel["DEBUG"] = 70] = "DEBUG";
		/**
		* Detailed trace level logging should only be used for development, should only be set
		* in a development environment.
		*/
		DiagLogLevel[DiagLogLevel["VERBOSE"] = 80] = "VERBOSE";
		/** Used to set the logging level to include all logging */
		DiagLogLevel[DiagLogLevel["ALL"] = 9999] = "ALL";
	})(exports.DiagLogLevel || (exports.DiagLogLevel = {}));
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/diag/internal/logLevelLogger.js
var require_logLevelLogger = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createLogLevelDiagLogger = void 0;
	var types_1 = require_types();
	function createLogLevelDiagLogger(maxLevel, logger) {
		if (maxLevel < types_1.DiagLogLevel.NONE) maxLevel = types_1.DiagLogLevel.NONE;
		else if (maxLevel > types_1.DiagLogLevel.ALL) maxLevel = types_1.DiagLogLevel.ALL;
		logger = logger || {};
		function _filterFunc(funcName, theLevel) {
			const theFunc = logger[funcName];
			if (typeof theFunc === "function" && maxLevel >= theLevel) return theFunc.bind(logger);
			return function() {};
		}
		return {
			error: _filterFunc("error", types_1.DiagLogLevel.ERROR),
			warn: _filterFunc("warn", types_1.DiagLogLevel.WARN),
			info: _filterFunc("info", types_1.DiagLogLevel.INFO),
			debug: _filterFunc("debug", types_1.DiagLogLevel.DEBUG),
			verbose: _filterFunc("verbose", types_1.DiagLogLevel.VERBOSE)
		};
	}
	exports.createLogLevelDiagLogger = createLogLevelDiagLogger;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/api/diag.js
var require_diag = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagAPI = void 0;
	var ComponentLogger_1 = require_ComponentLogger();
	var logLevelLogger_1 = require_logLevelLogger();
	var types_1 = require_types();
	var global_utils_1 = require_global_utils();
	var API_NAME = "diag";
	exports.DiagAPI = class DiagAPI {
		/** Get the singleton instance of the DiagAPI API */
		static instance() {
			if (!this._instance) this._instance = new DiagAPI();
			return this._instance;
		}
		/**
		* Private internal constructor
		* @private
		*/
		constructor() {
			function _logProxy(funcName) {
				return function(...args) {
					const logger = (0, global_utils_1.getGlobal)("diag");
					if (!logger) return;
					return logger[funcName](...args);
				};
			}
			const self = this;
			const setLogger = (logger, optionsOrLogLevel = { logLevel: types_1.DiagLogLevel.INFO }) => {
				var _a, _b, _c;
				if (logger === self) {
					const err = /* @__PURE__ */ new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
					self.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
					return false;
				}
				if (typeof optionsOrLogLevel === "number") optionsOrLogLevel = { logLevel: optionsOrLogLevel };
				const oldLogger = (0, global_utils_1.getGlobal)("diag");
				const newLogger = (0, logLevelLogger_1.createLogLevelDiagLogger)((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : types_1.DiagLogLevel.INFO, logger);
				if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
					const stack = (_c = (/* @__PURE__ */ new Error()).stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
					oldLogger.warn(`Current logger will be overwritten from ${stack}`);
					newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
				}
				return (0, global_utils_1.registerGlobal)("diag", newLogger, self, true);
			};
			self.setLogger = setLogger;
			self.disable = () => {
				(0, global_utils_1.unregisterGlobal)(API_NAME, self);
			};
			self.createComponentLogger = (options) => {
				return new ComponentLogger_1.DiagComponentLogger(options);
			};
			self.verbose = _logProxy("verbose");
			self.debug = _logProxy("debug");
			self.info = _logProxy("info");
			self.warn = _logProxy("warn");
			self.error = _logProxy("error");
		}
	};
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/baggage/internal/baggage-impl.js
var require_baggage_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BaggageImpl = void 0;
	exports.BaggageImpl = class BaggageImpl {
		constructor(entries) {
			this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
		}
		getEntry(key) {
			const entry = this._entries.get(key);
			if (!entry) return;
			return Object.assign({}, entry);
		}
		getAllEntries() {
			return Array.from(this._entries.entries());
		}
		setEntry(key, entry) {
			const newBaggage = new BaggageImpl(this._entries);
			newBaggage._entries.set(key, entry);
			return newBaggage;
		}
		removeEntry(key) {
			const newBaggage = new BaggageImpl(this._entries);
			newBaggage._entries.delete(key);
			return newBaggage;
		}
		removeEntries(...keys) {
			const newBaggage = new BaggageImpl(this._entries);
			for (const key of keys) newBaggage._entries.delete(key);
			return newBaggage;
		}
		clear() {
			return new BaggageImpl();
		}
	};
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/baggage/internal/symbol.js
var require_symbol = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.baggageEntryMetadataSymbol = void 0;
	/**
	* Symbol used to make BaggageEntryMetadata an opaque type
	*/
	exports.baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/baggage/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.baggageEntryMetadataFromString = exports.createBaggage = void 0;
	var diag_1 = require_diag();
	var baggage_impl_1 = require_baggage_impl();
	var symbol_1 = require_symbol();
	var diag = diag_1.DiagAPI.instance();
	/**
	* Create a new Baggage with optional entries
	*
	* @param entries An array of baggage entries the new baggage should contain
	*/
	function createBaggage(entries = {}) {
		return new baggage_impl_1.BaggageImpl(new Map(Object.entries(entries)));
	}
	exports.createBaggage = createBaggage;
	/**
	* Create a serializable BaggageEntryMetadata object from a string.
	*
	* @param str string metadata. Format is currently not defined by the spec and has no special meaning.
	*
	* @since 1.0.0
	*/
	function baggageEntryMetadataFromString(str) {
		if (typeof str !== "string") {
			diag.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
			str = "";
		}
		return {
			__TYPE__: symbol_1.baggageEntryMetadataSymbol,
			toString() {
				return str;
			}
		};
	}
	exports.baggageEntryMetadataFromString = baggageEntryMetadataFromString;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/context/context.js
var require_context$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ROOT_CONTEXT = exports.createContextKey = void 0;
	/**
	* Get a key to uniquely identify a context value
	*
	* @since 1.0.0
	*/
	function createContextKey(description) {
		return Symbol.for(description);
	}
	exports.createContextKey = createContextKey;
	/**
	* The root context is used as the default parent context when there is no active context
	*
	* @since 1.0.0
	*/
	exports.ROOT_CONTEXT = new class BaseContext {
		/**
		* Construct a new context which inherits values from an optional parent context.
		*
		* @param parentContext a context from which to inherit values
		*/
		constructor(parentContext) {
			const self = this;
			self._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
			self.getValue = (key) => self._currentContext.get(key);
			self.setValue = (key, value) => {
				const context = new BaseContext(self._currentContext);
				context._currentContext.set(key, value);
				return context;
			};
			self.deleteValue = (key) => {
				const context = new BaseContext(self._currentContext);
				context._currentContext.delete(key);
				return context;
			};
		}
	}();
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/diag/consoleLogger.js
var require_consoleLogger = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagConsoleLogger = exports._originalConsoleMethods = void 0;
	var consoleMap = [
		{
			n: "error",
			c: "error"
		},
		{
			n: "warn",
			c: "warn"
		},
		{
			n: "info",
			c: "info"
		},
		{
			n: "debug",
			c: "debug"
		},
		{
			n: "verbose",
			c: "trace"
		}
	];
	exports._originalConsoleMethods = {};
	if (typeof console !== "undefined") {
		for (const key of [
			"error",
			"warn",
			"info",
			"debug",
			"trace",
			"log"
		]) if (typeof console[key] === "function") exports._originalConsoleMethods[key] = console[key];
	}
	/**
	* A simple Immutable Console based diagnostic logger which will output any messages to the Console.
	* If you want to limit the amount of logging to a specific level or lower use the
	* {@link createLogLevelDiagLogger}
	*
	* @since 1.0.0
	*/
	var DiagConsoleLogger = class {
		constructor() {
			function _consoleFunc(funcName) {
				return function(...args) {
					let theFunc = exports._originalConsoleMethods[funcName];
					if (typeof theFunc !== "function") theFunc = exports._originalConsoleMethods["log"];
					if (typeof theFunc !== "function" && console) {
						theFunc = console[funcName];
						if (typeof theFunc !== "function") theFunc = console.log;
					}
					if (typeof theFunc === "function") return theFunc.apply(console, args);
				};
			}
			for (let i = 0; i < consoleMap.length; i++) this[consoleMap[i].n] = _consoleFunc(consoleMap[i].c);
		}
	};
	exports.DiagConsoleLogger = DiagConsoleLogger;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/metrics/NoopMeter.js
var require_NoopMeter = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createNoopMeter = exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = exports.NOOP_OBSERVABLE_GAUGE_METRIC = exports.NOOP_OBSERVABLE_COUNTER_METRIC = exports.NOOP_UP_DOWN_COUNTER_METRIC = exports.NOOP_HISTOGRAM_METRIC = exports.NOOP_GAUGE_METRIC = exports.NOOP_COUNTER_METRIC = exports.NOOP_METER = exports.NoopObservableUpDownCounterMetric = exports.NoopObservableGaugeMetric = exports.NoopObservableCounterMetric = exports.NoopObservableMetric = exports.NoopHistogramMetric = exports.NoopGaugeMetric = exports.NoopUpDownCounterMetric = exports.NoopCounterMetric = exports.NoopMetric = exports.NoopMeter = void 0;
	/**
	* NoopMeter is a noop implementation of the {@link Meter} interface. It reuses
	* constant NoopMetrics for all of its methods.
	*/
	var NoopMeter = class {
		constructor() {}
		/**
		* @see {@link Meter.createGauge}
		*/
		createGauge(_name, _options) {
			return exports.NOOP_GAUGE_METRIC;
		}
		/**
		* @see {@link Meter.createHistogram}
		*/
		createHistogram(_name, _options) {
			return exports.NOOP_HISTOGRAM_METRIC;
		}
		/**
		* @see {@link Meter.createCounter}
		*/
		createCounter(_name, _options) {
			return exports.NOOP_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.createUpDownCounter}
		*/
		createUpDownCounter(_name, _options) {
			return exports.NOOP_UP_DOWN_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.createObservableGauge}
		*/
		createObservableGauge(_name, _options) {
			return exports.NOOP_OBSERVABLE_GAUGE_METRIC;
		}
		/**
		* @see {@link Meter.createObservableCounter}
		*/
		createObservableCounter(_name, _options) {
			return exports.NOOP_OBSERVABLE_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.createObservableUpDownCounter}
		*/
		createObservableUpDownCounter(_name, _options) {
			return exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.addBatchObservableCallback}
		*/
		addBatchObservableCallback(_callback, _observables) {}
		/**
		* @see {@link Meter.removeBatchObservableCallback}
		*/
		removeBatchObservableCallback(_callback) {}
	};
	exports.NoopMeter = NoopMeter;
	var NoopMetric = class {};
	exports.NoopMetric = NoopMetric;
	var NoopCounterMetric = class extends NoopMetric {
		add(_value, _attributes) {}
	};
	exports.NoopCounterMetric = NoopCounterMetric;
	var NoopUpDownCounterMetric = class extends NoopMetric {
		add(_value, _attributes) {}
	};
	exports.NoopUpDownCounterMetric = NoopUpDownCounterMetric;
	var NoopGaugeMetric = class extends NoopMetric {
		record(_value, _attributes) {}
	};
	exports.NoopGaugeMetric = NoopGaugeMetric;
	var NoopHistogramMetric = class extends NoopMetric {
		record(_value, _attributes) {}
	};
	exports.NoopHistogramMetric = NoopHistogramMetric;
	var NoopObservableMetric = class {
		addCallback(_callback) {}
		removeCallback(_callback) {}
	};
	exports.NoopObservableMetric = NoopObservableMetric;
	var NoopObservableCounterMetric = class extends NoopObservableMetric {};
	exports.NoopObservableCounterMetric = NoopObservableCounterMetric;
	var NoopObservableGaugeMetric = class extends NoopObservableMetric {};
	exports.NoopObservableGaugeMetric = NoopObservableGaugeMetric;
	var NoopObservableUpDownCounterMetric = class extends NoopObservableMetric {};
	exports.NoopObservableUpDownCounterMetric = NoopObservableUpDownCounterMetric;
	exports.NOOP_METER = new NoopMeter();
	exports.NOOP_COUNTER_METRIC = new NoopCounterMetric();
	exports.NOOP_GAUGE_METRIC = new NoopGaugeMetric();
	exports.NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
	exports.NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
	exports.NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
	exports.NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
	exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
	/**
	* Create a no-op Meter
	*
	* @since 1.3.0
	*/
	function createNoopMeter() {
		return exports.NOOP_METER;
	}
	exports.createNoopMeter = createNoopMeter;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/metrics/Metric.js
var require_Metric = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ValueType = void 0;
	(function(ValueType) {
		ValueType[ValueType["INT"] = 0] = "INT";
		ValueType[ValueType["DOUBLE"] = 1] = "DOUBLE";
	})(exports.ValueType || (exports.ValueType = {}));
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/propagation/TextMapPropagator.js
var require_TextMapPropagator = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.defaultTextMapSetter = exports.defaultTextMapGetter = void 0;
	/**
	* @since 1.0.0
	*/
	exports.defaultTextMapGetter = {
		get(carrier, key) {
			if (carrier == null) return;
			return carrier[key];
		},
		keys(carrier) {
			if (carrier == null) return [];
			return Object.keys(carrier);
		}
	};
	/**
	* @since 1.0.0
	*/
	exports.defaultTextMapSetter = { set(carrier, key, value) {
		if (carrier == null) return;
		carrier[key] = value;
	} };
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/context/NoopContextManager.js
var require_NoopContextManager = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopContextManager = void 0;
	var context_1 = require_context$1();
	var NoopContextManager = class {
		active() {
			return context_1.ROOT_CONTEXT;
		}
		with(_context, fn, thisArg, ...args) {
			return fn.call(thisArg, ...args);
		}
		bind(_context, target) {
			return target;
		}
		enable() {
			return this;
		}
		disable() {
			return this;
		}
	};
	exports.NoopContextManager = NoopContextManager;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/api/context.js
var require_context = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ContextAPI = void 0;
	var NoopContextManager_1 = require_NoopContextManager();
	var global_utils_1 = require_global_utils();
	var diag_1 = require_diag();
	var API_NAME = "context";
	var NOOP_CONTEXT_MANAGER = new NoopContextManager_1.NoopContextManager();
	exports.ContextAPI = class ContextAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {}
		/** Get the singleton instance of the Context API */
		static getInstance() {
			if (!this._instance) this._instance = new ContextAPI();
			return this._instance;
		}
		/**
		* Set the current context manager.
		*
		* @returns true if the context manager was successfully registered, else false
		*/
		setGlobalContextManager(contextManager) {
			return (0, global_utils_1.registerGlobal)(API_NAME, contextManager, diag_1.DiagAPI.instance());
		}
		/**
		* Get the currently active context
		*/
		active() {
			return this._getContextManager().active();
		}
		/**
		* Execute a function with an active context
		*
		* @param context context to be active during function execution
		* @param fn function to execute in a context
		* @param thisArg optional receiver to be used for calling fn
		* @param args optional arguments forwarded to fn
		*/
		with(context, fn, thisArg, ...args) {
			return this._getContextManager().with(context, fn, thisArg, ...args);
		}
		/**
		* Bind a context to a target function or event emitter
		*
		* @param context context to bind to the event emitter or function. Defaults to the currently active context
		* @param target function or event emitter to bind
		*/
		bind(context, target) {
			return this._getContextManager().bind(context, target);
		}
		_getContextManager() {
			return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_CONTEXT_MANAGER;
		}
		/** Disable and remove the global context manager */
		disable() {
			this._getContextManager().disable();
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
		}
	};
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/trace_flags.js
var require_trace_flags = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TraceFlags = void 0;
	(function(TraceFlags) {
		/** Represents no flag set. */
		TraceFlags[TraceFlags["NONE"] = 0] = "NONE";
		/** Bit to represent whether trace is sampled in trace flags. */
		TraceFlags[TraceFlags["SAMPLED"] = 1] = "SAMPLED";
	})(exports.TraceFlags || (exports.TraceFlags = {}));
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/invalid-span-constants.js
var require_invalid_span_constants = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = void 0;
	var trace_flags_1 = require_trace_flags();
	/**
	* @since 1.0.0
	*/
	exports.INVALID_SPANID = "0000000000000000";
	/**
	* @since 1.0.0
	*/
	exports.INVALID_TRACEID = "00000000000000000000000000000000";
	/**
	* @since 1.0.0
	*/
	exports.INVALID_SPAN_CONTEXT = {
		traceId: exports.INVALID_TRACEID,
		spanId: exports.INVALID_SPANID,
		traceFlags: trace_flags_1.TraceFlags.NONE
	};
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/NonRecordingSpan.js
var require_NonRecordingSpan = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NonRecordingSpan = void 0;
	var invalid_span_constants_1 = require_invalid_span_constants();
	/**
	* The NonRecordingSpan is the default {@link Span} that is used when no Span
	* implementation is available. All operations are no-op including context
	* propagation.
	*/
	var NonRecordingSpan = class {
		constructor(spanContext = invalid_span_constants_1.INVALID_SPAN_CONTEXT) {
			this._spanContext = spanContext;
		}
		spanContext() {
			return this._spanContext;
		}
		setAttribute(_key, _value) {
			return this;
		}
		setAttributes(_attributes) {
			return this;
		}
		addEvent(_name, _attributes) {
			return this;
		}
		addLink(_link) {
			return this;
		}
		addLinks(_links) {
			return this;
		}
		setStatus(_status) {
			return this;
		}
		updateName(_name) {
			return this;
		}
		end(_endTime) {}
		isRecording() {
			return false;
		}
		recordException(_exception, _time) {}
	};
	exports.NonRecordingSpan = NonRecordingSpan;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/context-utils.js
var require_context_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getSpanContext = exports.setSpanContext = exports.deleteSpan = exports.setSpan = exports.getActiveSpan = exports.getSpan = void 0;
	var context_1 = require_context$1();
	var NonRecordingSpan_1 = require_NonRecordingSpan();
	var context_2 = require_context();
	/**
	* span key
	*/
	var SPAN_KEY = (0, context_1.createContextKey)("OpenTelemetry Context Key SPAN");
	/**
	* Return the span if one exists
	*
	* @param context context to get span from
	*/
	function getSpan(context) {
		return context.getValue(SPAN_KEY) || void 0;
	}
	exports.getSpan = getSpan;
	/**
	* Gets the span from the current context, if one exists.
	*/
	function getActiveSpan() {
		return getSpan(context_2.ContextAPI.getInstance().active());
	}
	exports.getActiveSpan = getActiveSpan;
	/**
	* Set the span on a context
	*
	* @param context context to use as parent
	* @param span span to set active
	*/
	function setSpan(context, span) {
		return context.setValue(SPAN_KEY, span);
	}
	exports.setSpan = setSpan;
	/**
	* Remove current span stored in the context
	*
	* @param context context to delete span from
	*/
	function deleteSpan(context) {
		return context.deleteValue(SPAN_KEY);
	}
	exports.deleteSpan = deleteSpan;
	/**
	* Wrap span context in a NoopSpan and set as span in a new
	* context
	*
	* @param context context to set active span on
	* @param spanContext span context to be wrapped
	*/
	function setSpanContext(context, spanContext) {
		return setSpan(context, new NonRecordingSpan_1.NonRecordingSpan(spanContext));
	}
	exports.setSpanContext = setSpanContext;
	/**
	* Get the span context of the span if it exists.
	*
	* @param context context to get values from
	*/
	function getSpanContext(context) {
		var _a;
		return (_a = getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
	}
	exports.getSpanContext = getSpanContext;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/spancontext-utils.js
var require_spancontext_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.wrapSpanContext = exports.isSpanContextValid = exports.isValidSpanId = exports.isValidTraceId = void 0;
	var invalid_span_constants_1 = require_invalid_span_constants();
	var NonRecordingSpan_1 = require_NonRecordingSpan();
	var isHex = new Uint8Array([
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1
	]);
	function isValidHex(id, length) {
		if (typeof id !== "string" || id.length !== length) return false;
		let r = 0;
		for (let i = 0; i < id.length; i += 4) r += (isHex[id.charCodeAt(i)] | 0) + (isHex[id.charCodeAt(i + 1)] | 0) + (isHex[id.charCodeAt(i + 2)] | 0) + (isHex[id.charCodeAt(i + 3)] | 0);
		return r === length;
	}
	/**
	* @since 1.0.0
	*/
	function isValidTraceId(traceId) {
		return isValidHex(traceId, 32) && traceId !== invalid_span_constants_1.INVALID_TRACEID;
	}
	exports.isValidTraceId = isValidTraceId;
	/**
	* @since 1.0.0
	*/
	function isValidSpanId(spanId) {
		return isValidHex(spanId, 16) && spanId !== invalid_span_constants_1.INVALID_SPANID;
	}
	exports.isValidSpanId = isValidSpanId;
	/**
	* Returns true if this {@link SpanContext} is valid.
	* @return true if this {@link SpanContext} is valid.
	*
	* @since 1.0.0
	*/
	function isSpanContextValid(spanContext) {
		return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
	}
	exports.isSpanContextValid = isSpanContextValid;
	/**
	* Wrap the given {@link SpanContext} in a new non-recording {@link Span}
	*
	* @param spanContext span context to be wrapped
	* @returns a new non-recording {@link Span} with the provided context
	*/
	function wrapSpanContext(spanContext) {
		return new NonRecordingSpan_1.NonRecordingSpan(spanContext);
	}
	exports.wrapSpanContext = wrapSpanContext;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/NoopTracer.js
var require_NoopTracer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopTracer = void 0;
	var context_1 = require_context();
	var context_utils_1 = require_context_utils();
	var NonRecordingSpan_1 = require_NonRecordingSpan();
	var spancontext_utils_1 = require_spancontext_utils();
	var contextApi = context_1.ContextAPI.getInstance();
	/**
	* No-op implementations of {@link Tracer}.
	*/
	var NoopTracer = class {
		startSpan(name, options, context = contextApi.active()) {
			if (Boolean(options === null || options === void 0 ? void 0 : options.root)) return new NonRecordingSpan_1.NonRecordingSpan();
			const parentFromContext = context && (0, context_utils_1.getSpanContext)(context);
			if (isSpanContext(parentFromContext) && (0, spancontext_utils_1.isSpanContextValid)(parentFromContext)) return new NonRecordingSpan_1.NonRecordingSpan(parentFromContext);
			else return new NonRecordingSpan_1.NonRecordingSpan();
		}
		startActiveSpan(name, arg2, arg3, arg4) {
			let opts;
			let ctx;
			let fn;
			if (arguments.length < 2) return;
			else if (arguments.length === 2) fn = arg2;
			else if (arguments.length === 3) {
				opts = arg2;
				fn = arg3;
			} else {
				opts = arg2;
				ctx = arg3;
				fn = arg4;
			}
			const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
			const span = this.startSpan(name, opts, parentContext);
			const contextWithSpanSet = (0, context_utils_1.setSpan)(parentContext, span);
			return contextApi.with(contextWithSpanSet, fn, void 0, span);
		}
	};
	exports.NoopTracer = NoopTracer;
	function isSpanContext(spanContext) {
		return spanContext !== null && typeof spanContext === "object" && "spanId" in spanContext && typeof spanContext["spanId"] === "string" && "traceId" in spanContext && typeof spanContext["traceId"] === "string" && "traceFlags" in spanContext && typeof spanContext["traceFlags"] === "number";
	}
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/ProxyTracer.js
var require_ProxyTracer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ProxyTracer = void 0;
	var NOOP_TRACER = new (require_NoopTracer()).NoopTracer();
	/**
	* Proxy tracer provided by the proxy tracer provider
	*
	* @since 1.0.0
	*/
	var ProxyTracer = class {
		constructor(provider, name, version, options) {
			this._provider = provider;
			this.name = name;
			this.version = version;
			this.options = options;
		}
		startSpan(name, options, context) {
			return this._getTracer().startSpan(name, options, context);
		}
		startActiveSpan(_name, _options, _context, _fn) {
			const tracer = this._getTracer();
			return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
		}
		/**
		* Try to get a tracer from the proxy tracer provider.
		* If the proxy tracer provider has no delegate, return a noop tracer.
		*/
		_getTracer() {
			if (this._delegate) return this._delegate;
			const tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
			if (!tracer) return NOOP_TRACER;
			this._delegate = tracer;
			return this._delegate;
		}
	};
	exports.ProxyTracer = ProxyTracer;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/NoopTracerProvider.js
var require_NoopTracerProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopTracerProvider = void 0;
	var NoopTracer_1 = require_NoopTracer();
	/**
	* An implementation of the {@link TracerProvider} which returns an impotent
	* Tracer for all calls to `getTracer`.
	*
	* All operations are no-op.
	*/
	var NoopTracerProvider = class {
		getTracer(_name, _version, _options) {
			return new NoopTracer_1.NoopTracer();
		}
	};
	exports.NoopTracerProvider = NoopTracerProvider;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/ProxyTracerProvider.js
var require_ProxyTracerProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ProxyTracerProvider = void 0;
	var ProxyTracer_1 = require_ProxyTracer();
	var NOOP_TRACER_PROVIDER = new (require_NoopTracerProvider()).NoopTracerProvider();
	/**
	* Tracer provider which provides {@link ProxyTracer}s.
	*
	* Before a delegate is set, tracers provided are NoOp.
	*   When a delegate is set, traces are provided from the delegate.
	*   When a delegate is set after tracers have already been provided,
	*   all tracers already provided will use the provided delegate implementation.
	*
	* @deprecated This will be removed in the next major version.
	* @since 1.0.0
	*/
	var ProxyTracerProvider = class {
		/**
		* Get a {@link ProxyTracer}
		*/
		getTracer(name, version, options) {
			var _a;
			return (_a = this.getDelegateTracer(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyTracer_1.ProxyTracer(this, name, version, options);
		}
		getDelegate() {
			var _a;
			return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
		}
		/**
		* Set the delegate tracer provider
		*/
		setDelegate(delegate) {
			this._delegate = delegate;
		}
		getDelegateTracer(name, version, options) {
			var _a;
			return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version, options);
		}
	};
	exports.ProxyTracerProvider = ProxyTracerProvider;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/SamplingResult.js
var require_SamplingResult = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SamplingDecision = void 0;
	(function(SamplingDecision) {
		/**
		* `Span.isRecording() === false`, span will not be recorded and all events
		* and attributes will be dropped.
		*/
		SamplingDecision[SamplingDecision["NOT_RECORD"] = 0] = "NOT_RECORD";
		/**
		* `Span.isRecording() === true`, but `Sampled` flag in {@link TraceFlags}
		* MUST NOT be set.
		*/
		SamplingDecision[SamplingDecision["RECORD"] = 1] = "RECORD";
		/**
		* `Span.isRecording() === true` AND `Sampled` flag in {@link TraceFlags}
		* MUST be set.
		*/
		SamplingDecision[SamplingDecision["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
	})(exports.SamplingDecision || (exports.SamplingDecision = {}));
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/span_kind.js
var require_span_kind = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SpanKind = void 0;
	(function(SpanKind) {
		/** Default value. Indicates that the span is used internally. */
		SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
		/**
		* Indicates that the span covers server-side handling of an RPC or other
		* remote request.
		*/
		SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
		/**
		* Indicates that the span covers the client-side wrapper around an RPC or
		* other remote request.
		*/
		SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
		/**
		* Indicates that the span describes producer sending a message to a
		* broker. Unlike client and server, there is no direct critical path latency
		* relationship between producer and consumer spans.
		*/
		SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
		/**
		* Indicates that the span describes consumer receiving a message from a
		* broker. Unlike client and server, there is no direct critical path latency
		* relationship between producer and consumer spans.
		*/
		SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
	})(exports.SpanKind || (exports.SpanKind = {}));
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/status.js
var require_status = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SpanStatusCode = void 0;
	(function(SpanStatusCode) {
		/**
		* The default status.
		*/
		SpanStatusCode[SpanStatusCode["UNSET"] = 0] = "UNSET";
		/**
		* The operation has been validated by an Application developer or
		* Operator to have completed successfully.
		*/
		SpanStatusCode[SpanStatusCode["OK"] = 1] = "OK";
		/**
		* The operation contains an error.
		*/
		SpanStatusCode[SpanStatusCode["ERROR"] = 2] = "ERROR";
	})(exports.SpanStatusCode || (exports.SpanStatusCode = {}));
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-validators.js
var require_tracestate_validators = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.validateValue = exports.validateKey = void 0;
	var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
	var VALID_KEY_REGEX = new RegExp(`^(?:${`[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`}|${`[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`})$`);
	var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
	var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
	/**
	* Key is opaque string up to 256 characters printable. It MUST begin with a
	* lowercase letter, and can only contain lowercase letters a-z, digits 0-9,
	* underscores _, dashes -, asterisks *, and forward slashes /.
	* For multi-tenant vendor scenarios, an at sign (@) can be used to prefix the
	* vendor name. Vendors SHOULD set the tenant ID at the beginning of the key.
	* see https://www.w3.org/TR/trace-context/#key
	*/
	function validateKey(key) {
		return VALID_KEY_REGEX.test(key);
	}
	exports.validateKey = validateKey;
	/**
	* Value is opaque string up to 256 characters printable ASCII RFC0020
	* characters (i.e., the range 0x20 to 0x7E) except comma , and =.
	*/
	function validateValue(value) {
		return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
	}
	exports.validateValue = validateValue;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-impl.js
var require_tracestate_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TraceStateImpl = void 0;
	var tracestate_validators_1 = require_tracestate_validators();
	var MAX_TRACE_STATE_ITEMS = 32;
	var MAX_TRACE_STATE_LEN = 512;
	var LIST_MEMBERS_SEPARATOR = ",";
	var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
	exports.TraceStateImpl = class TraceStateImpl {
		constructor(rawTraceState) {
			this._internalState = /* @__PURE__ */ new Map();
			if (rawTraceState) this._parse(rawTraceState);
		}
		set(key, value) {
			const traceState = this._clone();
			if (traceState._internalState.has(key)) traceState._internalState.delete(key);
			traceState._internalState.set(key, value);
			return traceState;
		}
		unset(key) {
			const traceState = this._clone();
			traceState._internalState.delete(key);
			return traceState;
		}
		get(key) {
			return this._internalState.get(key);
		}
		serialize() {
			return Array.from(this._internalState.keys()).reduceRight((agg, key) => {
				agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key));
				return agg;
			}, []).join(LIST_MEMBERS_SEPARATOR);
		}
		_parse(rawTraceState) {
			if (rawTraceState.length > MAX_TRACE_STATE_LEN) return;
			this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reduceRight((agg, part) => {
				const listMember = part.trim();
				const i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
				if (i !== -1) {
					const key = listMember.slice(0, i);
					const value = listMember.slice(i + 1, part.length);
					if ((0, tracestate_validators_1.validateKey)(key) && (0, tracestate_validators_1.validateValue)(value)) agg.set(key, value);
				}
				return agg;
			}, /* @__PURE__ */ new Map());
			if (this._internalState.size > MAX_TRACE_STATE_ITEMS) this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
		}
		_keys() {
			return Array.from(this._internalState.keys()).reverse();
		}
		_clone() {
			const traceState = new TraceStateImpl();
			traceState._internalState = new Map(this._internalState);
			return traceState;
		}
	};
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace/internal/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createTraceState = void 0;
	var tracestate_impl_1 = require_tracestate_impl();
	/**
	* @since 1.1.0
	*/
	function createTraceState(rawTraceState) {
		return new tracestate_impl_1.TraceStateImpl(rawTraceState);
	}
	exports.createTraceState = createTraceState;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/context-api.js
var require_context_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.context = void 0;
	/**
	* Entrypoint for context API
	* @since 1.0.0
	*/
	exports.context = require_context().ContextAPI.getInstance();
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/diag-api.js
var require_diag_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.diag = void 0;
	/**
	* Entrypoint for Diag API.
	* Defines Diagnostic handler used for internal diagnostic logging operations.
	* The default provides a Noop DiagLogger implementation which may be changed via the
	* diag.setLogger(logger: DiagLogger) function.
	*
	* @since 1.0.0
	*/
	exports.diag = require_diag().DiagAPI.instance();
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/metrics/NoopMeterProvider.js
var require_NoopMeterProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NOOP_METER_PROVIDER = exports.NoopMeterProvider = void 0;
	var NoopMeter_1 = require_NoopMeter();
	/**
	* An implementation of the {@link MeterProvider} which returns an impotent Meter
	* for all calls to `getMeter`
	*/
	var NoopMeterProvider = class {
		getMeter(_name, _version, _options) {
			return NoopMeter_1.NOOP_METER;
		}
	};
	exports.NoopMeterProvider = NoopMeterProvider;
	exports.NOOP_METER_PROVIDER = new NoopMeterProvider();
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/api/metrics.js
var require_metrics = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MetricsAPI = void 0;
	var NoopMeterProvider_1 = require_NoopMeterProvider();
	var global_utils_1 = require_global_utils();
	var diag_1 = require_diag();
	var API_NAME = "metrics";
	exports.MetricsAPI = class MetricsAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {}
		/** Get the singleton instance of the Metrics API */
		static getInstance() {
			if (!this._instance) this._instance = new MetricsAPI();
			return this._instance;
		}
		/**
		* Set the current global meter provider.
		* Returns true if the meter provider was successfully registered, else false.
		*/
		setGlobalMeterProvider(provider) {
			return (0, global_utils_1.registerGlobal)(API_NAME, provider, diag_1.DiagAPI.instance());
		}
		/**
		* Returns the global meter provider.
		*/
		getMeterProvider() {
			return (0, global_utils_1.getGlobal)(API_NAME) || NoopMeterProvider_1.NOOP_METER_PROVIDER;
		}
		/**
		* Returns a meter from the global meter provider.
		*/
		getMeter(name, version, options) {
			return this.getMeterProvider().getMeter(name, version, options);
		}
		/** Remove the global meter provider */
		disable() {
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
		}
	};
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/metrics-api.js
var require_metrics_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.metrics = void 0;
	/**
	* Entrypoint for metrics API
	*
	* @since 1.3.0
	*/
	exports.metrics = require_metrics().MetricsAPI.getInstance();
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/propagation/NoopTextMapPropagator.js
var require_NoopTextMapPropagator = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopTextMapPropagator = void 0;
	/**
	* No-op implementations of {@link TextMapPropagator}.
	*/
	var NoopTextMapPropagator = class {
		/** Noop inject function does nothing */
		inject(_context, _carrier) {}
		/** Noop extract function does nothing and returns the input context */
		extract(context, _carrier) {
			return context;
		}
		fields() {
			return [];
		}
	};
	exports.NoopTextMapPropagator = NoopTextMapPropagator;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/baggage/context-helpers.js
var require_context_helpers = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.deleteBaggage = exports.setBaggage = exports.getActiveBaggage = exports.getBaggage = void 0;
	var context_1 = require_context();
	/**
	* Baggage key
	*/
	var BAGGAGE_KEY = (0, require_context$1().createContextKey)("OpenTelemetry Baggage Key");
	/**
	* Retrieve the current baggage from the given context
	*
	* @param {Context} Context that manage all context values
	* @returns {Baggage} Extracted baggage from the context
	*/
	function getBaggage(context) {
		return context.getValue(BAGGAGE_KEY) || void 0;
	}
	exports.getBaggage = getBaggage;
	/**
	* Retrieve the current baggage from the active/current context
	*
	* @returns {Baggage} Extracted baggage from the context
	*/
	function getActiveBaggage() {
		return getBaggage(context_1.ContextAPI.getInstance().active());
	}
	exports.getActiveBaggage = getActiveBaggage;
	/**
	* Store a baggage in the given context
	*
	* @param {Context} Context that manage all context values
	* @param {Baggage} baggage that will be set in the actual context
	*/
	function setBaggage(context, baggage) {
		return context.setValue(BAGGAGE_KEY, baggage);
	}
	exports.setBaggage = setBaggage;
	/**
	* Delete the baggage stored in the given context
	*
	* @param {Context} Context that manage all context values
	*/
	function deleteBaggage(context) {
		return context.deleteValue(BAGGAGE_KEY);
	}
	exports.deleteBaggage = deleteBaggage;
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/api/propagation.js
var require_propagation = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PropagationAPI = void 0;
	var global_utils_1 = require_global_utils();
	var NoopTextMapPropagator_1 = require_NoopTextMapPropagator();
	var TextMapPropagator_1 = require_TextMapPropagator();
	var context_helpers_1 = require_context_helpers();
	var utils_1 = require_utils$1();
	var diag_1 = require_diag();
	var API_NAME = "propagation";
	var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator_1.NoopTextMapPropagator();
	exports.PropagationAPI = class PropagationAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {
			this.createBaggage = utils_1.createBaggage;
			this.getBaggage = context_helpers_1.getBaggage;
			this.getActiveBaggage = context_helpers_1.getActiveBaggage;
			this.setBaggage = context_helpers_1.setBaggage;
			this.deleteBaggage = context_helpers_1.deleteBaggage;
		}
		/** Get the singleton instance of the Propagator API */
		static getInstance() {
			if (!this._instance) this._instance = new PropagationAPI();
			return this._instance;
		}
		/**
		* Set the current propagator.
		*
		* @returns true if the propagator was successfully registered, else false
		*/
		setGlobalPropagator(propagator) {
			return (0, global_utils_1.registerGlobal)(API_NAME, propagator, diag_1.DiagAPI.instance());
		}
		/**
		* Inject context into a carrier to be propagated inter-process
		*
		* @param context Context carrying tracing data to inject
		* @param carrier carrier to inject context into
		* @param setter Function used to set values on the carrier
		*/
		inject(context, carrier, setter = TextMapPropagator_1.defaultTextMapSetter) {
			return this._getGlobalPropagator().inject(context, carrier, setter);
		}
		/**
		* Extract context from a carrier
		*
		* @param context Context which the newly created context will inherit from
		* @param carrier Carrier to extract context from
		* @param getter Function used to extract keys from a carrier
		*/
		extract(context, carrier, getter = TextMapPropagator_1.defaultTextMapGetter) {
			return this._getGlobalPropagator().extract(context, carrier, getter);
		}
		/**
		* Return a list of all fields which may be used by the propagator.
		*/
		fields() {
			return this._getGlobalPropagator().fields();
		}
		/** Remove the global propagator */
		disable() {
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
		}
		_getGlobalPropagator() {
			return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
		}
	};
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/propagation-api.js
var require_propagation_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.propagation = void 0;
	/**
	* Entrypoint for propagation API
	*
	* @since 1.0.0
	*/
	exports.propagation = require_propagation().PropagationAPI.getInstance();
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/api/trace.js
var require_trace = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TraceAPI = void 0;
	var global_utils_1 = require_global_utils();
	var ProxyTracerProvider_1 = require_ProxyTracerProvider();
	var spancontext_utils_1 = require_spancontext_utils();
	var context_utils_1 = require_context_utils();
	var diag_1 = require_diag();
	var API_NAME = "trace";
	exports.TraceAPI = class TraceAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {
			this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
			this.wrapSpanContext = spancontext_utils_1.wrapSpanContext;
			this.isSpanContextValid = spancontext_utils_1.isSpanContextValid;
			this.deleteSpan = context_utils_1.deleteSpan;
			this.getSpan = context_utils_1.getSpan;
			this.getActiveSpan = context_utils_1.getActiveSpan;
			this.getSpanContext = context_utils_1.getSpanContext;
			this.setSpan = context_utils_1.setSpan;
			this.setSpanContext = context_utils_1.setSpanContext;
		}
		/** Get the singleton instance of the Trace API */
		static getInstance() {
			if (!this._instance) this._instance = new TraceAPI();
			return this._instance;
		}
		/**
		* Set the current global tracer.
		*
		* @returns true if the tracer provider was successfully registered, else false
		*/
		setGlobalTracerProvider(provider) {
			const success = (0, global_utils_1.registerGlobal)(API_NAME, this._proxyTracerProvider, diag_1.DiagAPI.instance());
			if (success) this._proxyTracerProvider.setDelegate(provider);
			return success;
		}
		/**
		* Returns the global tracer provider.
		*/
		getTracerProvider() {
			return (0, global_utils_1.getGlobal)(API_NAME) || this._proxyTracerProvider;
		}
		/**
		* Returns a tracer from the global tracer provider.
		*/
		getTracer(name, version) {
			return this.getTracerProvider().getTracer(name, version);
		}
		/** Remove the global tracer provider */
		disable() {
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
			this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
		}
	};
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/trace-api.js
var require_trace_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.trace = void 0;
	/**
	* Entrypoint for trace API
	*
	* @since 1.0.0
	*/
	exports.trace = require_trace().TraceAPI.getInstance();
}));
//#endregion
//#region node_modules/@opentelemetry/api/build/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.trace = exports.propagation = exports.metrics = exports.diag = exports.context = exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = exports.isValidSpanId = exports.isValidTraceId = exports.isSpanContextValid = exports.createTraceState = exports.TraceFlags = exports.SpanStatusCode = exports.SpanKind = exports.SamplingDecision = exports.ProxyTracerProvider = exports.ProxyTracer = exports.defaultTextMapSetter = exports.defaultTextMapGetter = exports.ValueType = exports.createNoopMeter = exports.DiagLogLevel = exports.DiagConsoleLogger = exports.ROOT_CONTEXT = exports.createContextKey = exports.baggageEntryMetadataFromString = void 0;
	var utils_1 = require_utils$1();
	Object.defineProperty(exports, "baggageEntryMetadataFromString", {
		enumerable: true,
		get: function() {
			return utils_1.baggageEntryMetadataFromString;
		}
	});
	var context_1 = require_context$1();
	Object.defineProperty(exports, "createContextKey", {
		enumerable: true,
		get: function() {
			return context_1.createContextKey;
		}
	});
	Object.defineProperty(exports, "ROOT_CONTEXT", {
		enumerable: true,
		get: function() {
			return context_1.ROOT_CONTEXT;
		}
	});
	var consoleLogger_1 = require_consoleLogger();
	Object.defineProperty(exports, "DiagConsoleLogger", {
		enumerable: true,
		get: function() {
			return consoleLogger_1.DiagConsoleLogger;
		}
	});
	var types_1 = require_types();
	Object.defineProperty(exports, "DiagLogLevel", {
		enumerable: true,
		get: function() {
			return types_1.DiagLogLevel;
		}
	});
	var NoopMeter_1 = require_NoopMeter();
	Object.defineProperty(exports, "createNoopMeter", {
		enumerable: true,
		get: function() {
			return NoopMeter_1.createNoopMeter;
		}
	});
	var Metric_1 = require_Metric();
	Object.defineProperty(exports, "ValueType", {
		enumerable: true,
		get: function() {
			return Metric_1.ValueType;
		}
	});
	var TextMapPropagator_1 = require_TextMapPropagator();
	Object.defineProperty(exports, "defaultTextMapGetter", {
		enumerable: true,
		get: function() {
			return TextMapPropagator_1.defaultTextMapGetter;
		}
	});
	Object.defineProperty(exports, "defaultTextMapSetter", {
		enumerable: true,
		get: function() {
			return TextMapPropagator_1.defaultTextMapSetter;
		}
	});
	var ProxyTracer_1 = require_ProxyTracer();
	Object.defineProperty(exports, "ProxyTracer", {
		enumerable: true,
		get: function() {
			return ProxyTracer_1.ProxyTracer;
		}
	});
	var ProxyTracerProvider_1 = require_ProxyTracerProvider();
	Object.defineProperty(exports, "ProxyTracerProvider", {
		enumerable: true,
		get: function() {
			return ProxyTracerProvider_1.ProxyTracerProvider;
		}
	});
	var SamplingResult_1 = require_SamplingResult();
	Object.defineProperty(exports, "SamplingDecision", {
		enumerable: true,
		get: function() {
			return SamplingResult_1.SamplingDecision;
		}
	});
	var span_kind_1 = require_span_kind();
	Object.defineProperty(exports, "SpanKind", {
		enumerable: true,
		get: function() {
			return span_kind_1.SpanKind;
		}
	});
	var status_1 = require_status();
	Object.defineProperty(exports, "SpanStatusCode", {
		enumerable: true,
		get: function() {
			return status_1.SpanStatusCode;
		}
	});
	var trace_flags_1 = require_trace_flags();
	Object.defineProperty(exports, "TraceFlags", {
		enumerable: true,
		get: function() {
			return trace_flags_1.TraceFlags;
		}
	});
	var utils_2 = require_utils();
	Object.defineProperty(exports, "createTraceState", {
		enumerable: true,
		get: function() {
			return utils_2.createTraceState;
		}
	});
	var spancontext_utils_1 = require_spancontext_utils();
	Object.defineProperty(exports, "isSpanContextValid", {
		enumerable: true,
		get: function() {
			return spancontext_utils_1.isSpanContextValid;
		}
	});
	Object.defineProperty(exports, "isValidTraceId", {
		enumerable: true,
		get: function() {
			return spancontext_utils_1.isValidTraceId;
		}
	});
	Object.defineProperty(exports, "isValidSpanId", {
		enumerable: true,
		get: function() {
			return spancontext_utils_1.isValidSpanId;
		}
	});
	var invalid_span_constants_1 = require_invalid_span_constants();
	Object.defineProperty(exports, "INVALID_SPANID", {
		enumerable: true,
		get: function() {
			return invalid_span_constants_1.INVALID_SPANID;
		}
	});
	Object.defineProperty(exports, "INVALID_TRACEID", {
		enumerable: true,
		get: function() {
			return invalid_span_constants_1.INVALID_TRACEID;
		}
	});
	Object.defineProperty(exports, "INVALID_SPAN_CONTEXT", {
		enumerable: true,
		get: function() {
			return invalid_span_constants_1.INVALID_SPAN_CONTEXT;
		}
	});
	var context_api_1 = require_context_api();
	Object.defineProperty(exports, "context", {
		enumerable: true,
		get: function() {
			return context_api_1.context;
		}
	});
	var diag_api_1 = require_diag_api();
	Object.defineProperty(exports, "diag", {
		enumerable: true,
		get: function() {
			return diag_api_1.diag;
		}
	});
	var metrics_api_1 = require_metrics_api();
	Object.defineProperty(exports, "metrics", {
		enumerable: true,
		get: function() {
			return metrics_api_1.metrics;
		}
	});
	var propagation_api_1 = require_propagation_api();
	Object.defineProperty(exports, "propagation", {
		enumerable: true,
		get: function() {
			return propagation_api_1.propagation;
		}
	});
	var trace_api_1 = require_trace_api();
	Object.defineProperty(exports, "trace", {
		enumerable: true,
		get: function() {
			return trace_api_1.trace;
		}
	});
	exports.default = {
		context: context_api_1.context,
		diag: diag_api_1.diag,
		metrics: metrics_api_1.metrics,
		propagation: propagation_api_1.propagation,
		trace: trace_api_1.trace
	};
}));
//#endregion
export { require_src as t };
