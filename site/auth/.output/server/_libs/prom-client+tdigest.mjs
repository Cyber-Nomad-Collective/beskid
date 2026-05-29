import { i as __require, t as __commonJSMin } from "../_runtime.mjs";
import { t as require_bintrees } from "./bintrees.mjs";
import { t as require_src } from "./opentelemetry__api.mjs";
//#region node_modules/prom-client/lib/util.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.getValueAsString = function getValueString(value) {
		if (Number.isNaN(value)) return "Nan";
		else if (!Number.isFinite(value)) if (value < 0) return "-Inf";
		else return "+Inf";
		else return `${value}`;
	};
	exports.removeLabels = function removeLabels(hashMap, labels, sortedLabelNames) {
		const hash = hashObject(labels, sortedLabelNames);
		delete hashMap[hash];
	};
	exports.setValue = function setValue(hashMap, value, labels) {
		const hash = hashObject(labels);
		hashMap[hash] = {
			value: typeof value === "number" ? value : 0,
			labels: labels || {}
		};
		return hashMap;
	};
	exports.setValueDelta = function setValueDelta(hashMap, deltaValue, labels, hash = "") {
		const value = typeof deltaValue === "number" ? deltaValue : 0;
		if (hashMap[hash]) hashMap[hash].value += value;
		else hashMap[hash] = {
			value,
			labels
		};
		return hashMap;
	};
	exports.getLabels = function(labelNames, args) {
		if (typeof args[0] === "object") return args[0];
		if (labelNames.length !== args.length) throw new Error(`Invalid number of arguments (${args.length}): "${args.join(", ")}" for label names (${labelNames.length}): "${labelNames.join(", ")}".`);
		const acc = {};
		for (let i = 0; i < labelNames.length; i++) acc[labelNames[i]] = args[i];
		return acc;
	};
	function fastHashObject(keys, labels) {
		if (keys.length === 0) return "";
		let hash = "";
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const value = labels[key];
			if (value === void 0) continue;
			hash += `${key}:${value},`;
		}
		return hash;
	}
	function hashObject(labels, labelNames) {
		if (labelNames) return fastHashObject(labelNames, labels);
		const keys = Object.keys(labels);
		if (keys.length > 1) keys.sort();
		return fastHashObject(keys, labels);
	}
	exports.hashObject = hashObject;
	exports.isObject = function isObject(obj) {
		return obj !== null && typeof obj === "object";
	};
	exports.nowTimestamp = function nowTimestamp() {
		return Date.now() / 1e3;
	};
	var Grouper = class extends Map {
		/**
		* Adds the `value` to the `key`'s array of values.
		* @param {*} key Key to set.
		* @param {*} value Value to add to `key`'s array.
		* @returns {undefined} undefined.
		*/
		add(key, value) {
			if (this.has(key)) this.get(key).push(value);
			else this.set(key, [value]);
		}
	};
	exports.Grouper = Grouper;
}));
//#endregion
//#region node_modules/prom-client/lib/registry.js
var require_registry = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { getValueAsString } = require_util();
	var Registry = class Registry {
		static get PROMETHEUS_CONTENT_TYPE() {
			return "text/plain; version=0.0.4; charset=utf-8";
		}
		static get OPENMETRICS_CONTENT_TYPE() {
			return "application/openmetrics-text; version=1.0.0; charset=utf-8";
		}
		constructor(regContentType = Registry.PROMETHEUS_CONTENT_TYPE) {
			this._metrics = {};
			this._collectors = [];
			this._defaultLabels = {};
			if (regContentType !== Registry.PROMETHEUS_CONTENT_TYPE && regContentType !== Registry.OPENMETRICS_CONTENT_TYPE) throw new TypeError(`Content type ${regContentType} is unsupported`);
			this._contentType = regContentType;
		}
		getMetricsAsArray() {
			return Object.values(this._metrics);
		}
		async getMetricsAsString(metrics) {
			const metric = typeof metrics.getForPromString === "function" ? await metrics.getForPromString() : await metrics.get();
			const name = escapeString(metric.name);
			const values = [`# HELP ${name} ${escapeString(metric.help)}`, `# TYPE ${name} ${metric.type}`];
			const defaultLabels = Object.keys(this._defaultLabels).length > 0 ? this._defaultLabels : null;
			const isOpenMetrics = this.contentType === Registry.OPENMETRICS_CONTENT_TYPE;
			for (const val of metric.values || []) {
				let { metricName = name, labels = {} } = val;
				const { sharedLabels = {} } = val;
				if (isOpenMetrics && metric.type === "counter") metricName = `${metricName}_total`;
				if (defaultLabels) labels = {
					...labels,
					...defaultLabels,
					...labels
				};
				const formattedLabels = formatLabels(labels, sharedLabels);
				const flattenedShared = flattenSharedLabels(sharedLabels);
				const labelParts = [...formattedLabels, flattenedShared].filter(Boolean);
				const labelsString = labelParts.length ? `{${labelParts.join(",")}}` : "";
				let fullMetricLine = `${metricName}${labelsString} ${getValueAsString(val.value)}`;
				const { exemplar } = val;
				if (exemplar && isOpenMetrics) {
					const formattedExemplars = formatLabels(exemplar.labelSet);
					fullMetricLine += ` # {${formattedExemplars.join(",")}} ${getValueAsString(exemplar.value)} ${exemplar.timestamp}`;
				}
				values.push(fullMetricLine);
			}
			return values.join("\n");
		}
		async metrics() {
			const isOpenMetrics = this.contentType === Registry.OPENMETRICS_CONTENT_TYPE;
			const promises = this.getMetricsAsArray().map((metric) => {
				if (isOpenMetrics && metric.type === "counter") metric.name = standardizeCounterName(metric.name);
				return this.getMetricsAsString(metric);
			});
			const resolves = await Promise.all(promises);
			return isOpenMetrics ? `${resolves.join("\n")}\n# EOF\n` : `${resolves.join("\n\n")}\n`;
		}
		registerMetric(metric) {
			if (this._metrics[metric.name] && this._metrics[metric.name] !== metric) throw new Error(`A metric with the name ${metric.name} has already been registered.`);
			this._metrics[metric.name] = metric;
		}
		clear() {
			this._metrics = {};
			this._defaultLabels = {};
		}
		async getMetricsAsJSON() {
			const metrics = [];
			const defaultLabelNames = Object.keys(this._defaultLabels);
			const promises = [];
			for (const metric of this.getMetricsAsArray()) promises.push(metric.get());
			const resolves = await Promise.all(promises);
			for (const item of resolves) {
				if (item.values && defaultLabelNames.length > 0) for (const val of item.values) {
					val.labels = Object.assign({}, val.labels);
					for (const labelName of defaultLabelNames) val.labels[labelName] = val.labels[labelName] || this._defaultLabels[labelName];
				}
				metrics.push(item);
			}
			return metrics;
		}
		removeSingleMetric(name) {
			delete this._metrics[name];
		}
		getSingleMetricAsString(name) {
			return this.getMetricsAsString(this._metrics[name]);
		}
		getSingleMetric(name) {
			return this._metrics[name];
		}
		setDefaultLabels(labels) {
			this._defaultLabels = labels;
		}
		resetMetrics() {
			for (const metric in this._metrics) this._metrics[metric].reset();
		}
		get contentType() {
			return this._contentType;
		}
		setContentType(metricsContentType) {
			if (metricsContentType === Registry.OPENMETRICS_CONTENT_TYPE || metricsContentType === Registry.PROMETHEUS_CONTENT_TYPE) this._contentType = metricsContentType;
			else throw new Error(`Content type ${metricsContentType} is unsupported`);
		}
		static merge(registers) {
			const regType = registers[0].contentType;
			for (const reg of registers) if (reg.contentType !== regType) throw new Error("Registers can only be merged if they have the same content type");
			const mergedRegistry = new Registry(regType);
			registers.reduce((acc, reg) => acc.concat(reg.getMetricsAsArray()), []).forEach(mergedRegistry.registerMetric, mergedRegistry);
			return mergedRegistry;
		}
	};
	function formatLabels(labels, exclude) {
		const { hasOwnProperty } = Object.prototype;
		const formatted = [];
		for (const [name, value] of Object.entries(labels)) if (!exclude || !hasOwnProperty.call(exclude, name)) formatted.push(`${name}="${escapeLabelValue(value)}"`);
		return formatted;
	}
	var sharedLabelCache = /* @__PURE__ */ new WeakMap();
	function flattenSharedLabels(labels) {
		const cached = sharedLabelCache.get(labels);
		if (cached) return cached;
		const flattened = formatLabels(labels).join(",");
		sharedLabelCache.set(labels, flattened);
		return flattened;
	}
	function escapeLabelValue(str) {
		if (typeof str !== "string") return str;
		return escapeString(str).replace(/"/g, "\\\"");
	}
	function escapeString(str) {
		return str.replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
	}
	function standardizeCounterName(name) {
		return name.replace(/_total$/, "");
	}
	module.exports = Registry;
	module.exports.globalRegistry = new Registry();
}));
//#endregion
//#region node_modules/prom-client/lib/validation.js
var require_validation = /* @__PURE__ */ __commonJSMin(((exports) => {
	var util$4 = __require("util");
	var metricRegexp = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
	var labelRegexp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
	exports.validateMetricName = function(name) {
		return metricRegexp.test(name);
	};
	exports.validateLabelName = function(names = []) {
		return names.every((name) => labelRegexp.test(name));
	};
	exports.validateLabel = function validateLabel(savedLabels, labels) {
		for (const label in labels) if (!savedLabels.includes(label)) throw new Error(`Added label "${label}" is not included in initial labelset: ${util$4.inspect(savedLabels)}`);
	};
}));
//#endregion
//#region node_modules/prom-client/lib/metric.js
var require_metric = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Registry = require_registry();
	var { isObject } = require_util();
	var { validateMetricName, validateLabelName } = require_validation();
	/**
	* @abstract
	*/
	var Metric = class {
		constructor(config, defaults = {}) {
			if (!isObject(config)) throw new TypeError("constructor expected a config object");
			Object.assign(this, {
				labelNames: [],
				registers: [Registry.globalRegistry],
				aggregator: "sum",
				enableExemplars: false
			}, defaults, config);
			if (!this.registers) this.registers = [Registry.globalRegistry];
			if (!this.help) throw new Error("Missing mandatory help parameter");
			if (!this.name) throw new Error("Missing mandatory name parameter");
			if (!validateMetricName(this.name)) throw new Error("Invalid metric name");
			if (!validateLabelName(this.labelNames)) throw new Error("Invalid label name");
			if (this.collect && typeof this.collect !== "function") throw new Error("Optional \"collect\" parameter must be a function");
			if (this.labelNames) this.sortedLabelNames = [...this.labelNames].sort();
			else this.sortedLabelNames = [];
			this.reset();
			for (const register of this.registers) {
				if (this.enableExemplars && register.contentType === Registry.PROMETHEUS_CONTENT_TYPE) throw new TypeError("Exemplars are supported only on OpenMetrics registries");
				register.registerMetric(this);
			}
		}
		reset() {}
	};
	module.exports = { Metric };
}));
//#endregion
//#region node_modules/prom-client/lib/exemplar.js
var require_exemplar = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Class representing an OpenMetrics exemplar.
	*
	* @property {object} labelSet
	* @property {number} value
	* @property {number} [timestamp]
	* */
	var Exemplar = class {
		constructor(labelSet = {}, value = null) {
			this.labelSet = labelSet;
			this.value = value;
		}
		/**
		* Validation for the label set format.
		* https://github.com/OpenObservability/OpenMetrics/blob/d99b705f611b75fec8f450b05e344e02eea6921d/specification/OpenMetrics.md#exemplars
		*
		* @param {object} labelSet - Exemplar labels.
		* @throws {RangeError}
		* @return {void}
		*/
		validateExemplarLabelSet(labelSet) {
			let res = "";
			for (const [labelName, labelValue] of Object.entries(labelSet)) res += `${labelName}${labelValue}`;
			if (res.length > 128) throw new RangeError("Label set size must be smaller than 128 UTF-8 chars");
		}
	};
	module.exports = Exemplar;
}));
//#endregion
//#region node_modules/prom-client/lib/counter.js
/**
* Counter metric
*/
var require_counter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$3 = __require("util");
	var { hashObject, isObject, getLabels, removeLabels, nowTimestamp } = require_util();
	var { validateLabel } = require_validation();
	var { Metric } = require_metric();
	var Exemplar = require_exemplar();
	var Counter = class extends Metric {
		constructor(config) {
			super(config);
			this.type = "counter";
			this.defaultLabels = {};
			this.defaultValue = 1;
			this.defaultExemplarLabelSet = {};
			if (config.enableExemplars) {
				this.enableExemplars = true;
				this.inc = this.incWithExemplar;
			} else this.inc = this.incWithoutExemplar;
		}
		/**
		* Increment counter
		* @param {object} labels - What label you want to be incremented
		* @param {Number} value - Value to increment, if omitted increment with 1
		* @returns {object} results - object with information about the inc operation
		* @returns {string} results.labelHash - hash representation of the labels
		*/
		incWithoutExemplar(labels, value) {
			let hash = "";
			if (isObject(labels)) {
				hash = hashObject(labels, this.sortedLabelNames);
				validateLabel(this.labelNames, labels);
			} else {
				value = labels;
				labels = {};
			}
			if (value && !Number.isFinite(value)) throw new TypeError(`Value is not a valid number: ${util$3.format(value)}`);
			if (value < 0) throw new Error("It is not possible to decrease a counter");
			if (value === null || value === void 0) value = 1;
			setValue(this.hashMap, value, labels, hash);
			return { labelHash: hash };
		}
		/**
		* Increment counter with exemplar, same as inc but accepts labels for an
		* exemplar.
		* If no label is provided the current exemplar labels are kept unchanged
		* (defaults to empty set).
		*
		* @param {object} incOpts - Object with options about what metric to increase
		* @param {object} incOpts.labels - What label you want to be incremented,
		*                                  defaults to null (metric with no labels)
		* @param {Number} incOpts.value - Value to increment, defaults to 1
		* @param {object} incOpts.exemplarLabels - Key-value  labels for the
		*                                          exemplar, defaults to empty set {}
		* @returns {void}
		*/
		incWithExemplar({ labels = this.defaultLabels, value = this.defaultValue, exemplarLabels = this.defaultExemplarLabelSet } = {}) {
			const res = this.incWithoutExemplar(labels, value);
			this.updateExemplar(exemplarLabels, value, res.labelHash);
		}
		updateExemplar(exemplarLabels, value, hash) {
			if (exemplarLabels === this.defaultExemplarLabelSet) return;
			if (!isObject(this.hashMap[hash].exemplar)) this.hashMap[hash].exemplar = new Exemplar();
			this.hashMap[hash].exemplar.validateExemplarLabelSet(exemplarLabels);
			this.hashMap[hash].exemplar.labelSet = exemplarLabels;
			this.hashMap[hash].exemplar.value = value ? value : 1;
			this.hashMap[hash].exemplar.timestamp = nowTimestamp();
		}
		/**
		* Reset counter
		* @returns {void}
		*/
		reset() {
			this.hashMap = {};
			if (this.labelNames.length === 0) setValue(this.hashMap, 0);
		}
		async get() {
			if (this.collect) {
				const v = this.collect();
				if (v instanceof Promise) await v;
			}
			return {
				help: this.help,
				name: this.name,
				type: this.type,
				values: Object.values(this.hashMap),
				aggregator: this.aggregator
			};
		}
		labels(...args) {
			const labels = getLabels(this.labelNames, args) || {};
			return { inc: this.inc.bind(this, labels) };
		}
		remove(...args) {
			const labels = getLabels(this.labelNames, args) || {};
			validateLabel(this.labelNames, labels);
			return removeLabels.call(this, this.hashMap, labels, this.sortedLabelNames);
		}
	};
	function setValue(hashMap, value, labels = {}, hash = "") {
		if (hashMap[hash]) hashMap[hash].value += value;
		else hashMap[hash] = {
			value,
			labels
		};
		return hashMap;
	}
	module.exports = Counter;
}));
//#endregion
//#region node_modules/prom-client/lib/gauge.js
/**
* Gauge metric
*/
var require_gauge = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$2 = __require("util");
	var { setValue, setValueDelta, getLabels, hashObject, isObject, removeLabels } = require_util();
	var { validateLabel } = require_validation();
	var { Metric } = require_metric();
	var Gauge = class extends Metric {
		constructor(config) {
			super(config);
			this.type = "gauge";
		}
		/**
		* Set a gauge to a value
		* @param {object} labels - Object with labels and their values
		* @param {Number} value - Value to set the gauge to, must be positive
		* @returns {void}
		*/
		set(labels, value) {
			value = getValueArg(labels, value);
			labels = getLabelArg(labels);
			set(this, labels, value);
		}
		/**
		* Reset gauge
		* @returns {void}
		*/
		reset() {
			this.hashMap = {};
			if (this.labelNames.length === 0) setValue(this.hashMap, 0, {});
		}
		/**
		* Increment a gauge value
		* @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
		* @param {Number} value - Value to increment - if omitted, increment with 1
		* @returns {void}
		*/
		inc(labels, value) {
			value = getValueArg(labels, value);
			labels = getLabelArg(labels);
			if (value === void 0) value = 1;
			setDelta(this, labels, value);
		}
		/**
		* Decrement a gauge value
		* @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
		* @param {Number} value - Value to decrement - if omitted, decrement with 1
		* @returns {void}
		*/
		dec(labels, value) {
			value = getValueArg(labels, value);
			labels = getLabelArg(labels);
			if (value === void 0) value = 1;
			setDelta(this, labels, -value);
		}
		/**
		* Set the gauge to current unix epoch
		* @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
		* @returns {void}
		*/
		setToCurrentTime(labels) {
			const now = Date.now() / 1e3;
			if (labels === void 0) this.set(now);
			else this.set(labels, now);
		}
		/**
		* Start a timer
		* @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
		* @returns {function} - Invoke this function to set the duration in seconds since you started the timer.
		* @example
		* var done = gauge.startTimer();
		* makeXHRRequest(function(err, response) {
		*	done(); //Duration of the request will be saved
		* });
		*/
		startTimer(labels) {
			const start = process.hrtime();
			return (endLabels) => {
				const delta = process.hrtime(start);
				const value = delta[0] + delta[1] / 1e9;
				this.set(Object.assign({}, labels, endLabels), value);
				return value;
			};
		}
		async get() {
			if (this.collect) {
				const v = this.collect();
				if (v instanceof Promise) await v;
			}
			return {
				help: this.help,
				name: this.name,
				type: this.type,
				values: Object.values(this.hashMap),
				aggregator: this.aggregator
			};
		}
		_getValue(labels) {
			const hash = hashObject(labels || {}, this.sortedLabelNames);
			return this.hashMap[hash] ? this.hashMap[hash].value : 0;
		}
		labels(...args) {
			const labels = getLabels(this.labelNames, args);
			validateLabel(this.labelNames, labels);
			return {
				inc: this.inc.bind(this, labels),
				dec: this.dec.bind(this, labels),
				set: this.set.bind(this, labels),
				setToCurrentTime: this.setToCurrentTime.bind(this, labels),
				startTimer: this.startTimer.bind(this, labels)
			};
		}
		remove(...args) {
			const labels = getLabels(this.labelNames, args);
			validateLabel(this.labelNames, labels);
			removeLabels.call(this, this.hashMap, labels, this.sortedLabelNames);
		}
	};
	function set(gauge, labels, value) {
		if (typeof value !== "number") throw new TypeError(`Value is not a valid number: ${util$2.format(value)}`);
		validateLabel(gauge.labelNames, labels);
		setValue(gauge.hashMap, value, labels);
	}
	function setDelta(gauge, labels, delta) {
		if (typeof delta !== "number") throw new TypeError(`Delta is not a valid number: ${util$2.format(delta)}`);
		validateLabel(gauge.labelNames, labels);
		const hash = hashObject(labels, gauge.sortedLabelNames);
		setValueDelta(gauge.hashMap, delta, labels, hash);
	}
	function getLabelArg(labels) {
		return isObject(labels) ? labels : {};
	}
	function getValueArg(labels, value) {
		return isObject(labels) ? value : labels;
	}
	module.exports = Gauge;
}));
//#endregion
//#region node_modules/prom-client/lib/histogram.js
/**
* Histogram
*/
var require_histogram = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util$1 = __require("util");
	var { getLabels, hashObject, isObject, removeLabels, nowTimestamp } = require_util();
	var { validateLabel } = require_validation();
	var { Metric } = require_metric();
	var Exemplar = require_exemplar();
	var Histogram = class extends Metric {
		constructor(config) {
			super(config, { buckets: [
				.005,
				.01,
				.025,
				.05,
				.1,
				.25,
				.5,
				1,
				2.5,
				5,
				10
			] });
			this.type = "histogram";
			this.defaultLabels = {};
			this.defaultExemplarLabelSet = {};
			this.enableExemplars = false;
			for (const label of this.labelNames) if (label === "le") throw new Error("le is a reserved label keyword");
			this.upperBounds = this.buckets;
			this.bucketValues = this.upperBounds.reduce((acc, upperBound) => {
				acc[upperBound] = 0;
				return acc;
			}, {});
			if (config.enableExemplars) {
				this.enableExemplars = true;
				this.bucketExemplars = this.upperBounds.reduce((acc, upperBound) => {
					acc[upperBound] = null;
					return acc;
				}, {});
				Object.freeze(this.bucketExemplars);
				this.observe = this.observeWithExemplar;
			} else this.observe = this.observeWithoutExemplar;
			Object.freeze(this.bucketValues);
			Object.freeze(this.upperBounds);
			if (this.labelNames.length === 0) this.hashMap = { [hashObject({})]: createBaseValues({}, this.bucketValues, this.bucketExemplars) };
		}
		/**
		* Observe a value in histogram
		* @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
		* @param {Number} value - Value to observe in the histogram
		* @returns {void}
		*/
		observeWithoutExemplar(labels, value) {
			observe.call(this, labels === 0 ? 0 : labels || {})(value);
		}
		observeWithExemplar({ labels = this.defaultLabels, value, exemplarLabels = this.defaultExemplarLabelSet } = {}) {
			observe.call(this, labels === 0 ? 0 : labels || {})(value);
			this.updateExemplar(labels, value, exemplarLabels);
		}
		updateExemplar(labels, value, exemplarLabels) {
			if (Object.keys(exemplarLabels).length === 0) return;
			const hash = hashObject(labels, this.sortedLabelNames);
			const bound = findBound(this.upperBounds, value);
			const { bucketExemplars } = this.hashMap[hash];
			let exemplar = bucketExemplars[bound];
			if (!isObject(exemplar)) {
				exemplar = new Exemplar();
				bucketExemplars[bound] = exemplar;
			}
			exemplar.validateExemplarLabelSet(exemplarLabels);
			exemplar.labelSet = exemplarLabels;
			exemplar.value = value;
			exemplar.timestamp = nowTimestamp();
		}
		async get() {
			const data = await this.getForPromString();
			data.values = data.values.map(splayLabels);
			return data;
		}
		async getForPromString() {
			if (this.collect) {
				const v = this.collect();
				if (v instanceof Promise) await v;
			}
			const values = Object.values(this.hashMap).map(extractBucketValuesForExport(this)).reduce(addSumAndCountForExport(this), []);
			return {
				name: this.name,
				help: this.help,
				type: this.type,
				values,
				aggregator: this.aggregator
			};
		}
		reset() {
			this.hashMap = {};
		}
		/**
		* Initialize the metrics for the given combination of labels to zero
		* @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
		* @returns {void}
		*/
		zero(labels) {
			const hash = hashObject(labels, this.sortedLabelNames);
			this.hashMap[hash] = createBaseValues(labels, this.bucketValues, this.bucketExemplars);
		}
		/**
		* Start a timer that could be used to logging durations
		* @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
		* @param {object} exemplarLabels - Object with labels for exemplar where key is the label key and value is label value. Can only be one level deep
		* @returns {function} - Function to invoke when you want to stop the timer and observe the duration in seconds
		* @example
		* var end = histogram.startTimer();
		* makeExpensiveXHRRequest(function(err, res) {
		* 	const duration = end(); //Observe the duration of expensiveXHRRequest and returns duration in seconds
		* 	console.log('Duration', duration);
		* });
		*/
		startTimer(labels, exemplarLabels) {
			return this.enableExemplars ? startTimerWithExemplar.call(this, labels, exemplarLabels)() : startTimer.call(this, labels)();
		}
		labels(...args) {
			const labels = getLabels(this.labelNames, args);
			validateLabel(this.labelNames, labels);
			return {
				observe: observe.call(this, labels),
				startTimer: startTimer.call(this, labels)
			};
		}
		remove(...args) {
			const labels = getLabels(this.labelNames, args);
			validateLabel(this.labelNames, labels);
			removeLabels.call(this, this.hashMap, labels, this.sortedLabelNames);
		}
	};
	function startTimer(startLabels) {
		return () => {
			const start = process.hrtime();
			return (endLabels) => {
				const delta = process.hrtime(start);
				const value = delta[0] + delta[1] / 1e9;
				this.observe(Object.assign({}, startLabels, endLabels), value);
				return value;
			};
		};
	}
	function startTimerWithExemplar(startLabels, startExemplarLabels) {
		return () => {
			const start = process.hrtime();
			return (endLabels, endExemplarLabels) => {
				const delta = process.hrtime(start);
				const value = delta[0] + delta[1] / 1e9;
				this.observe({
					labels: Object.assign({}, startLabels, endLabels),
					value,
					exemplarLabels: Object.assign({}, startExemplarLabels, endExemplarLabels)
				});
				return value;
			};
		};
	}
	function setValuePair(labels, value, metricName, exemplar, sharedLabels = {}) {
		return {
			labels,
			sharedLabels,
			value,
			metricName,
			exemplar
		};
	}
	function findBound(upperBounds, value) {
		for (let i = 0; i < upperBounds.length; i++) {
			const bound = upperBounds[i];
			if (value <= bound) return bound;
		}
		return -1;
	}
	function observe(labels) {
		return (value) => {
			const labelValuePair = convertLabelsAndValues(labels, value);
			validateLabel(this.labelNames, labelValuePair.labels);
			if (!Number.isFinite(labelValuePair.value)) throw new TypeError(`Value is not a valid number: ${util$1.format(labelValuePair.value)}`);
			const hash = hashObject(labelValuePair.labels, this.sortedLabelNames);
			let valueFromMap = this.hashMap[hash];
			if (!valueFromMap) valueFromMap = createBaseValues(labelValuePair.labels, this.bucketValues, this.bucketExemplars);
			const b = findBound(this.upperBounds, labelValuePair.value);
			valueFromMap.sum += labelValuePair.value;
			valueFromMap.count += 1;
			if (Object.prototype.hasOwnProperty.call(valueFromMap.bucketValues, b)) valueFromMap.bucketValues[b] += 1;
			this.hashMap[hash] = valueFromMap;
		};
	}
	function createBaseValues(labels, bucketValues, bucketExemplars) {
		const result = {
			labels,
			bucketValues: { ...bucketValues },
			sum: 0,
			count: 0
		};
		if (bucketExemplars) result.bucketExemplars = { ...bucketExemplars };
		return result;
	}
	function convertLabelsAndValues(labels, value) {
		return isObject(labels) ? {
			labels,
			value
		} : {
			value: labels,
			labels: {}
		};
	}
	function extractBucketValuesForExport(histogram) {
		const name = `${histogram.name}_bucket`;
		return (bucketData) => {
			let acc = 0;
			return {
				buckets: histogram.upperBounds.map((upperBound) => {
					acc += bucketData.bucketValues[upperBound];
					return setValuePair({ le: upperBound }, acc, name, bucketData.bucketExemplars ? bucketData.bucketExemplars[upperBound] : null, bucketData.labels);
				}),
				data: bucketData
			};
		};
	}
	function addSumAndCountForExport(histogram) {
		return (acc, d) => {
			acc.push(...d.buckets);
			acc.push(setValuePair({ le: "+Inf" }, d.data.count, `${histogram.name}_bucket`, d.data.bucketExemplars ? d.data.bucketExemplars["-1"] : null, d.data.labels), setValuePair({}, d.data.sum, `${histogram.name}_sum`, void 0, d.data.labels), setValuePair({}, d.data.count, `${histogram.name}_count`, void 0, d.data.labels));
			return acc;
		};
	}
	function splayLabels(bucket) {
		const { sharedLabels, labels, ...newBucket } = bucket;
		for (const label of Object.keys(sharedLabels)) labels[label] = sharedLabels[label];
		newBucket.labels = labels;
		return newBucket;
	}
	module.exports = Histogram;
}));
//#endregion
//#region node_modules/tdigest/tdigest.js
var require_tdigest = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var RBTree = require_bintrees().RBTree;
	function TDigest(delta, K, CX) {
		this.discrete = delta === false;
		this.delta = delta || .01;
		this.K = K === void 0 ? 25 : K;
		this.CX = CX === void 0 ? 1.1 : CX;
		this.centroids = new RBTree(compare_centroid_means);
		this.nreset = 0;
		this.reset();
	}
	TDigest.prototype.reset = function() {
		this.centroids.clear();
		this.n = 0;
		this.nreset += 1;
		this.last_cumulate = 0;
	};
	TDigest.prototype.size = function() {
		return this.centroids.size;
	};
	TDigest.prototype.toArray = function(everything) {
		var result = [];
		if (everything) {
			this._cumulate(true);
			this.centroids.each(function(c) {
				result.push(c);
			});
		} else this.centroids.each(function(c) {
			result.push({
				mean: c.mean,
				n: c.n
			});
		});
		return result;
	};
	TDigest.prototype.summary = function() {
		return [
			(this.discrete ? "exact " : "approximating ") + this.n + " samples using " + this.size() + " centroids",
			"min = " + this.percentile(0),
			"Q1  = " + this.percentile(.25),
			"Q2  = " + this.percentile(.5),
			"Q3  = " + this.percentile(.75),
			"max = " + this.percentile(1)
		].join("\n");
	};
	function compare_centroid_means(a, b) {
		return a.mean > b.mean ? 1 : a.mean < b.mean ? -1 : 0;
	}
	function compare_centroid_mean_cumns(a, b) {
		return a.mean_cumn - b.mean_cumn;
	}
	TDigest.prototype.push = function(x, n) {
		n = n || 1;
		x = Array.isArray(x) ? x : [x];
		for (var i = 0; i < x.length; i++) this._digest(x[i], n);
	};
	TDigest.prototype.push_centroid = function(c) {
		c = Array.isArray(c) ? c : [c];
		for (var i = 0; i < c.length; i++) this._digest(c[i].mean, c[i].n);
	};
	TDigest.prototype._cumulate = function(exact) {
		if (this.n === this.last_cumulate || !exact && this.CX && this.CX > this.n / this.last_cumulate) return;
		var cumn = 0;
		this.centroids.each(function(c) {
			c.mean_cumn = cumn + c.n / 2;
			cumn = c.cumn = cumn + c.n;
		});
		this.n = this.last_cumulate = cumn;
	};
	TDigest.prototype.find_nearest = function(x) {
		if (this.size() === 0) return null;
		var iter = this.centroids.lowerBound({ mean: x });
		var c = iter.data() === null ? iter.prev() : iter.data();
		if (c.mean === x || this.discrete) return c;
		var prev = iter.prev();
		if (prev && Math.abs(prev.mean - x) < Math.abs(c.mean - x)) return prev;
		else return c;
	};
	TDigest.prototype._new_centroid = function(x, n, cumn) {
		var c = {
			mean: x,
			n,
			cumn
		};
		this.centroids.insert(c);
		this.n += n;
		return c;
	};
	TDigest.prototype._addweight = function(nearest, x, n) {
		if (x !== nearest.mean) nearest.mean += n * (x - nearest.mean) / (nearest.n + n);
		nearest.cumn += n;
		nearest.mean_cumn += n / 2;
		nearest.n += n;
		this.n += n;
	};
	TDigest.prototype._digest = function(x, n) {
		var min = this.centroids.min();
		var max = this.centroids.max();
		var nearest = this.find_nearest(x);
		if (nearest && nearest.mean === x) this._addweight(nearest, x, n);
		else if (nearest === min) this._new_centroid(x, n, 0);
		else if (nearest === max) this._new_centroid(x, n, this.n);
		else if (this.discrete) this._new_centroid(x, n, nearest.cumn);
		else {
			var p = nearest.mean_cumn / this.n;
			if (Math.floor(4 * this.n * this.delta * p * (1 - p)) - nearest.n >= n) this._addweight(nearest, x, n);
			else this._new_centroid(x, n, nearest.cumn);
		}
		this._cumulate(false);
		if (!this.discrete && this.K && this.size() > this.K / this.delta) this.compress();
	};
	TDigest.prototype.bound_mean = function(x) {
		var iter = this.centroids.upperBound({ mean: x });
		var lower = iter.prev();
		return [lower, lower.mean === x ? lower : iter.next()];
	};
	TDigest.prototype.p_rank = function(x_or_xlist) {
		var ps = (Array.isArray(x_or_xlist) ? x_or_xlist : [x_or_xlist]).map(this._p_rank, this);
		return Array.isArray(x_or_xlist) ? ps : ps[0];
	};
	TDigest.prototype._p_rank = function(x) {
		if (this.size() === 0) return;
		else if (x < this.centroids.min().mean) return 0;
		else if (x > this.centroids.max().mean) return 1;
		this._cumulate(true);
		var bound = this.bound_mean(x);
		var lower = bound[0], upper = bound[1];
		if (this.discrete) return lower.cumn / this.n;
		else {
			var cumn = lower.mean_cumn;
			if (lower !== upper) cumn += (x - lower.mean) * (upper.mean_cumn - lower.mean_cumn) / (upper.mean - lower.mean);
			return cumn / this.n;
		}
	};
	TDigest.prototype.bound_mean_cumn = function(cumn) {
		this.centroids._comparator = compare_centroid_mean_cumns;
		var iter = this.centroids.upperBound({ mean_cumn: cumn });
		this.centroids._comparator = compare_centroid_means;
		var lower = iter.prev();
		return [lower, lower && lower.mean_cumn === cumn ? lower : iter.next()];
	};
	TDigest.prototype.percentile = function(p_or_plist) {
		var qs = (Array.isArray(p_or_plist) ? p_or_plist : [p_or_plist]).map(this._percentile, this);
		return Array.isArray(p_or_plist) ? qs : qs[0];
	};
	TDigest.prototype._percentile = function(p) {
		if (this.size() === 0) return;
		this._cumulate(true);
		var h = this.n * p;
		var bound = this.bound_mean_cumn(h);
		var lower = bound[0], upper = bound[1];
		if (upper === lower || lower === null || upper === null) return (lower || upper).mean;
		else if (!this.discrete) return lower.mean + (h - lower.mean_cumn) * (upper.mean - lower.mean) / (upper.mean_cumn - lower.mean_cumn);
		else if (h <= lower.cumn) return lower.mean;
		else return upper.mean;
	};
	function pop_random(choices) {
		var idx = Math.floor(Math.random() * choices.length);
		return choices.splice(idx, 1)[0];
	}
	TDigest.prototype.compress = function() {
		if (this.compressing) return;
		var points = this.toArray();
		this.reset();
		this.compressing = true;
		while (points.length > 0) this.push_centroid(pop_random(points));
		this._cumulate(true);
		this.compressing = false;
	};
	function Digest(config) {
		this.config = config || {};
		this.mode = this.config.mode || "auto";
		TDigest.call(this, this.mode === "cont" ? config.delta : false);
		this.digest_ratio = this.config.ratio || .9;
		this.digest_thresh = this.config.thresh || 1e3;
		this.n_unique = 0;
	}
	Digest.prototype = Object.create(TDigest.prototype);
	Digest.prototype.constructor = Digest;
	Digest.prototype.push = function(x_or_xlist) {
		TDigest.prototype.push.call(this, x_or_xlist);
		this.check_continuous();
	};
	Digest.prototype._new_centroid = function(x, n, cumn) {
		this.n_unique += 1;
		TDigest.prototype._new_centroid.call(this, x, n, cumn);
	};
	Digest.prototype._addweight = function(nearest, x, n) {
		if (nearest.n === 1) this.n_unique -= 1;
		TDigest.prototype._addweight.call(this, nearest, x, n);
	};
	Digest.prototype.check_continuous = function() {
		if (this.mode !== "auto" || this.size() < this.digest_thresh) return false;
		if (this.n_unique / this.size() > this.digest_ratio) {
			this.mode = "cont";
			this.discrete = false;
			this.delta = this.config.delta || .01;
			this.compress();
			return true;
		}
		return false;
	};
	module.exports = {
		"TDigest": TDigest,
		"Digest": Digest
	};
}));
//#endregion
//#region node_modules/prom-client/lib/timeWindowQuantiles.js
var require_timeWindowQuantiles = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { TDigest } = require_tdigest();
	var TimeWindowQuantiles = class {
		constructor(maxAgeSeconds, ageBuckets) {
			this.maxAgeSeconds = maxAgeSeconds || 0;
			this.ageBuckets = ageBuckets || 0;
			this.shouldRotate = maxAgeSeconds && ageBuckets;
			this.ringBuffer = Array(ageBuckets).fill(new TDigest());
			this.currentBuffer = 0;
			this.lastRotateTimestampMillis = Date.now();
			this.durationBetweenRotatesMillis = maxAgeSeconds * 1e3 / ageBuckets || Infinity;
		}
		size() {
			return rotate.call(this).size();
		}
		percentile(quantile) {
			return rotate.call(this).percentile(quantile);
		}
		push(value) {
			rotate.call(this);
			this.ringBuffer.forEach((bucket) => {
				bucket.push(value);
			});
		}
		reset() {
			this.ringBuffer.forEach((bucket) => {
				bucket.reset();
			});
		}
		compress() {
			this.ringBuffer.forEach((bucket) => {
				bucket.compress();
			});
		}
	};
	function rotate() {
		let timeSinceLastRotateMillis = Date.now() - this.lastRotateTimestampMillis;
		while (timeSinceLastRotateMillis > this.durationBetweenRotatesMillis && this.shouldRotate) {
			this.ringBuffer[this.currentBuffer] = new TDigest();
			if (++this.currentBuffer >= this.ringBuffer.length) this.currentBuffer = 0;
			timeSinceLastRotateMillis -= this.durationBetweenRotatesMillis;
			this.lastRotateTimestampMillis += this.durationBetweenRotatesMillis;
		}
		return this.ringBuffer[this.currentBuffer];
	}
	module.exports = TimeWindowQuantiles;
}));
//#endregion
//#region node_modules/prom-client/lib/summary.js
/**
* Summary
*/
var require_summary = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util = __require("util");
	var { getLabels, hashObject, removeLabels } = require_util();
	var { validateLabel } = require_validation();
	var { Metric } = require_metric();
	var timeWindowQuantiles = require_timeWindowQuantiles();
	var DEFAULT_COMPRESS_COUNT = 1e3;
	var Summary = class extends Metric {
		constructor(config) {
			super(config, {
				percentiles: [
					.01,
					.05,
					.5,
					.9,
					.95,
					.99,
					.999
				],
				compressCount: DEFAULT_COMPRESS_COUNT,
				hashMap: {}
			});
			this.type = "summary";
			for (const label of this.labelNames) if (label === "quantile") throw new Error("quantile is a reserved label keyword");
			if (this.labelNames.length === 0) this.hashMap = { [hashObject({})]: {
				labels: {},
				td: new timeWindowQuantiles(this.maxAgeSeconds, this.ageBuckets),
				count: 0,
				sum: 0
			} };
		}
		/**
		* Observe a value
		* @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
		* @param {Number} value - Value to observe
		* @returns {void}
		*/
		observe(labels, value) {
			observe.call(this, labels === 0 ? 0 : labels || {})(value);
		}
		async get() {
			if (this.collect) {
				const v = this.collect();
				if (v instanceof Promise) await v;
			}
			const hashKeys = Object.keys(this.hashMap);
			const values = [];
			hashKeys.forEach((hashKey) => {
				const s = this.hashMap[hashKey];
				if (s) if (this.pruneAgedBuckets && s.td.size() === 0) delete this.hashMap[hashKey];
				else {
					extractSummariesForExport(s, this.percentiles).forEach((v) => {
						values.push(v);
					});
					values.push(getSumForExport(s, this));
					values.push(getCountForExport(s, this));
				}
			});
			return {
				name: this.name,
				help: this.help,
				type: this.type,
				values,
				aggregator: this.aggregator
			};
		}
		reset() {
			Object.values(this.hashMap).forEach((s) => {
				s.td.reset();
				s.count = 0;
				s.sum = 0;
			});
		}
		/**
		* Start a timer that could be used to logging durations
		* @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
		* @returns {function} - Function to invoke when you want to stop the timer and observe the duration in seconds
		* @example
		* var end = summary.startTimer();
		* makeExpensiveXHRRequest(function(err, res) {
		*	end(); //Observe the duration of expensiveXHRRequest
		* });
		*/
		startTimer(labels) {
			return startTimer.call(this, labels)();
		}
		labels(...args) {
			const labels = getLabels(this.labelNames, args);
			validateLabel(this.labelNames, labels);
			return {
				observe: observe.call(this, labels),
				startTimer: startTimer.call(this, labels)
			};
		}
		remove(...args) {
			const labels = getLabels(this.labelNames, args);
			validateLabel(this.labelNames, labels);
			removeLabels.call(this, this.hashMap, labels, this.sortedLabelNames);
		}
	};
	function extractSummariesForExport(summaryOfLabels, percentiles) {
		summaryOfLabels.td.compress();
		return percentiles.map((percentile) => {
			const percentileValue = summaryOfLabels.td.percentile(percentile);
			return {
				labels: Object.assign({ quantile: percentile }, summaryOfLabels.labels),
				value: percentileValue ? percentileValue : 0
			};
		});
	}
	function getCountForExport(value, summary) {
		return {
			metricName: `${summary.name}_count`,
			labels: value.labels,
			value: value.count
		};
	}
	function getSumForExport(value, summary) {
		return {
			metricName: `${summary.name}_sum`,
			labels: value.labels,
			value: value.sum
		};
	}
	function startTimer(startLabels) {
		return () => {
			const start = process.hrtime();
			return (endLabels) => {
				const delta = process.hrtime(start);
				const value = delta[0] + delta[1] / 1e9;
				this.observe(Object.assign({}, startLabels, endLabels), value);
				return value;
			};
		};
	}
	function observe(labels) {
		return (value) => {
			const labelValuePair = convertLabelsAndValues(labels, value);
			validateLabel(this.labelNames, labels);
			if (!Number.isFinite(labelValuePair.value)) throw new TypeError(`Value is not a valid number: ${util.format(labelValuePair.value)}`);
			const hash = hashObject(labelValuePair.labels, this.sortedLabelNames);
			let summaryOfLabel = this.hashMap[hash];
			if (!summaryOfLabel) summaryOfLabel = {
				labels: labelValuePair.labels,
				td: new timeWindowQuantiles(this.maxAgeSeconds, this.ageBuckets),
				count: 0,
				sum: 0
			};
			summaryOfLabel.td.push(labelValuePair.value);
			summaryOfLabel.count++;
			if (summaryOfLabel.count % this.compressCount === 0) summaryOfLabel.td.compress();
			summaryOfLabel.sum += labelValuePair.value;
			this.hashMap[hash] = summaryOfLabel;
		};
	}
	function convertLabelsAndValues(labels, value) {
		if (value === void 0) return {
			value: labels,
			labels: {}
		};
		return {
			labels,
			value
		};
	}
	module.exports = Summary;
}));
//#endregion
//#region node_modules/prom-client/lib/pushgateway.js
var require_pushgateway = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var url = __require("url");
	var http = __require("http");
	var https = __require("https");
	var { gzipSync } = __require("zlib");
	var { globalRegistry } = require_registry();
	var Pushgateway = class {
		constructor(gatewayUrl, options, registry) {
			if (!registry) registry = globalRegistry;
			this.registry = registry;
			this.gatewayUrl = gatewayUrl;
			const { requireJobName, ...requestOptions } = {
				requireJobName: true,
				...options
			};
			this.requireJobName = requireJobName;
			this.requestOptions = requestOptions;
		}
		pushAdd(params = {}) {
			if (this.requireJobName && !params.jobName) throw new Error("Missing jobName parameter");
			return useGateway.call(this, "POST", params.jobName, params.groupings);
		}
		push(params = {}) {
			if (this.requireJobName && !params.jobName) throw new Error("Missing jobName parameter");
			return useGateway.call(this, "PUT", params.jobName, params.groupings);
		}
		delete(params = {}) {
			if (this.requireJobName && !params.jobName) throw new Error("Missing jobName parameter");
			return useGateway.call(this, "DELETE", params.jobName, params.groupings);
		}
	};
	async function useGateway(method, job, groupings) {
		const gatewayUrlParsed = url.parse(this.gatewayUrl);
		const path = `${gatewayUrlParsed.pathname && gatewayUrlParsed.pathname !== "/" ? gatewayUrlParsed.pathname : ""}/metrics${job ? `/job/${encodeURIComponent(job)}${generateGroupings(groupings)}` : ""}`;
		const target = url.resolve(this.gatewayUrl, path);
		const requestParams = url.parse(target);
		const httpModule = isHttps(requestParams.href) ? https : http;
		const options = Object.assign(requestParams, this.requestOptions, { method });
		return new Promise((resolve, reject) => {
			if (method === "DELETE" && options.headers) delete options.headers["Content-Encoding"];
			const req = httpModule.request(options, (resp) => {
				let body = "";
				resp.setEncoding("utf8");
				resp.on("data", (chunk) => {
					body += chunk;
				});
				resp.on("end", () => {
					if (resp.statusCode >= 400) reject(/* @__PURE__ */ new Error(`push failed with status ${resp.statusCode}, ${body}`));
					else resolve({
						resp,
						body
					});
				});
			});
			req.on("error", (err) => {
				reject(err);
			});
			req.on("timeout", () => {
				req.destroy(/* @__PURE__ */ new Error("Pushgateway request timed out"));
			});
			if (method !== "DELETE") this.registry.metrics().then((metrics) => {
				if (options.headers && options.headers["Content-Encoding"] === "gzip") metrics = gzipSync(metrics);
				req.write(metrics);
				req.end();
			}).catch((err) => {
				reject(err);
			});
			else req.end();
		});
	}
	function generateGroupings(groupings) {
		if (!groupings) return "";
		return Object.keys(groupings).map((key) => `/${encodeURIComponent(key)}/${encodeURIComponent(groupings[key])}`).join("");
	}
	function isHttps(href) {
		return href.search(/^https/) !== -1;
	}
	module.exports = Pushgateway;
}));
//#endregion
//#region node_modules/prom-client/lib/bucketGenerators.js
var require_bucketGenerators = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.linearBuckets = (start, width, count) => {
		if (count < 1) throw new Error("Linear buckets needs a positive count");
		const buckets = new Array(count);
		for (let i = 0; i < count; i++) buckets[i] = start + i * width;
		return buckets;
	};
	exports.exponentialBuckets = (start, factor, count) => {
		if (start <= 0) throw new Error("Exponential buckets needs a positive start");
		if (count < 1) throw new Error("Exponential buckets needs a positive count");
		if (factor <= 1) throw new Error("Exponential buckets needs a factor greater than 1");
		const buckets = new Array(count);
		for (let i = 0; i < count; i++) {
			buckets[i] = start;
			start *= factor;
		}
		return buckets;
	};
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/processCpuTotal.js
var require_processCpuTotal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var OtelApi = require_src();
	var Counter = require_counter();
	var PROCESS_CPU_USER_SECONDS = "process_cpu_user_seconds_total";
	var PROCESS_CPU_SYSTEM_SECONDS = "process_cpu_system_seconds_total";
	var PROCESS_CPU_SECONDS = "process_cpu_seconds_total";
	module.exports = (registry, config = {}) => {
		const registers = registry ? [registry] : void 0;
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const exemplars = config.enableExemplars ? config.enableExemplars : false;
		const labelNames = Object.keys(labels);
		let lastCpuUsage = process.cpuUsage();
		const cpuUserUsageCounter = new Counter({
			name: namePrefix + PROCESS_CPU_USER_SECONDS,
			help: "Total user CPU time spent in seconds.",
			enableExemplars: exemplars,
			registers,
			labelNames,
			collect() {
				const cpuUsage = process.cpuUsage();
				const userUsageMicros = cpuUsage.user - lastCpuUsage.user;
				const systemUsageMicros = cpuUsage.system - lastCpuUsage.system;
				lastCpuUsage = cpuUsage;
				if (this.enableExemplars) {
					let exemplarLabels = {};
					const currentSpan = OtelApi.trace.getSpan(OtelApi.context.active());
					if (currentSpan) exemplarLabels = {
						traceId: currentSpan.spanContext().traceId,
						spanId: currentSpan.spanContext().spanId
					};
					cpuUserUsageCounter.inc({
						labels,
						value: userUsageMicros / 1e6,
						exemplarLabels
					});
					cpuSystemUsageCounter.inc({
						labels,
						value: systemUsageMicros / 1e6,
						exemplarLabels
					});
					cpuUsageCounter.inc({
						labels,
						value: (userUsageMicros + systemUsageMicros) / 1e6,
						exemplarLabels
					});
				} else {
					cpuUserUsageCounter.inc(labels, userUsageMicros / 1e6);
					cpuSystemUsageCounter.inc(labels, systemUsageMicros / 1e6);
					cpuUsageCounter.inc(labels, (userUsageMicros + systemUsageMicros) / 1e6);
				}
			}
		});
		const cpuSystemUsageCounter = new Counter({
			name: namePrefix + PROCESS_CPU_SYSTEM_SECONDS,
			help: "Total system CPU time spent in seconds.",
			enableExemplars: exemplars,
			registers,
			labelNames
		});
		const cpuUsageCounter = new Counter({
			name: namePrefix + PROCESS_CPU_SECONDS,
			help: "Total user and system CPU time spent in seconds.",
			enableExemplars: exemplars,
			registers,
			labelNames
		});
	};
	module.exports.metricNames = [
		PROCESS_CPU_USER_SECONDS,
		PROCESS_CPU_SYSTEM_SECONDS,
		PROCESS_CPU_SECONDS
	];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/processStartTime.js
var require_processStartTime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var startInSeconds = Math.round(Date.now() / 1e3 - process.uptime());
	var PROCESS_START_TIME = "process_start_time_seconds";
	module.exports = (registry, config = {}) => {
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		new Gauge({
			name: namePrefix + PROCESS_START_TIME,
			help: "Start time of the process since unix epoch in seconds.",
			registers: registry ? [registry] : void 0,
			labelNames,
			aggregator: "omit",
			collect() {
				this.set(labels, startInSeconds);
			}
		});
	};
	module.exports.metricNames = [PROCESS_START_TIME];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/osMemoryHeapLinux.js
var require_osMemoryHeapLinux = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var fs$2 = __require("fs");
	var values = [
		"VmSize",
		"VmRSS",
		"VmData"
	];
	var PROCESS_RESIDENT_MEMORY = "process_resident_memory_bytes";
	var PROCESS_VIRTUAL_MEMORY = "process_virtual_memory_bytes";
	var PROCESS_HEAP = "process_heap_bytes";
	function structureOutput(input) {
		return input.split("\n").reduce((acc, string) => {
			if (!values.some((value) => string.startsWith(value))) return acc;
			const split = string.split(":");
			let value = split[1].trim();
			value = value.substr(0, value.length - 3);
			value = Number(value) * 1024;
			acc[split[0]] = value;
			return acc;
		}, {});
	}
	module.exports = (registry, config = {}) => {
		const registers = registry ? [registry] : void 0;
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		const residentMemGauge = new Gauge({
			name: namePrefix + PROCESS_RESIDENT_MEMORY,
			help: "Resident memory size in bytes.",
			registers,
			labelNames,
			collect() {
				try {
					const structuredOutput = structureOutput(fs$2.readFileSync("/proc/self/status", "utf8"));
					residentMemGauge.set(labels, structuredOutput.VmRSS);
					virtualMemGauge.set(labels, structuredOutput.VmSize);
					heapSizeMemGauge.set(labels, structuredOutput.VmData);
				} catch {}
			}
		});
		const virtualMemGauge = new Gauge({
			name: namePrefix + PROCESS_VIRTUAL_MEMORY,
			help: "Virtual memory size in bytes.",
			registers,
			labelNames
		});
		const heapSizeMemGauge = new Gauge({
			name: namePrefix + PROCESS_HEAP,
			help: "Process heap size in bytes.",
			registers,
			labelNames
		});
	};
	module.exports.metricNames = [
		PROCESS_RESIDENT_MEMORY,
		PROCESS_VIRTUAL_MEMORY,
		PROCESS_HEAP
	];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/helpers/safeMemoryUsage.js
var require_safeMemoryUsage = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function safeMemoryUsage() {
		try {
			return process.memoryUsage();
		} catch {
			return;
		}
	}
	module.exports = safeMemoryUsage;
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/osMemoryHeap.js
var require_osMemoryHeap = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var linuxVariant = require_osMemoryHeapLinux();
	var safeMemoryUsage = require_safeMemoryUsage();
	var PROCESS_RESIDENT_MEMORY = "process_resident_memory_bytes";
	function notLinuxVariant(registry, config = {}) {
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		new Gauge({
			name: namePrefix + PROCESS_RESIDENT_MEMORY,
			help: "Resident memory size in bytes.",
			registers: registry ? [registry] : void 0,
			labelNames,
			collect() {
				const memUsage = safeMemoryUsage();
				if (memUsage) this.set(labels, memUsage.rss);
			}
		});
	}
	module.exports = (registry, config) => process.platform === "linux" ? linuxVariant(registry, config) : notLinuxVariant(registry, config);
	module.exports.metricNames = process.platform === "linux" ? linuxVariant.metricNames : [PROCESS_RESIDENT_MEMORY];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/processOpenFileDescriptors.js
var require_processOpenFileDescriptors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var fs$1 = __require("fs");
	var process$1 = __require("process");
	var PROCESS_OPEN_FDS = "process_open_fds";
	module.exports = (registry, config = {}) => {
		if (process$1.platform !== "linux") return;
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		new Gauge({
			name: namePrefix + PROCESS_OPEN_FDS,
			help: "Number of open file descriptors.",
			registers: registry ? [registry] : void 0,
			labelNames,
			collect() {
				try {
					const fds = fs$1.readdirSync("/proc/self/fd");
					this.set(labels, fds.length - 1);
				} catch {}
			}
		});
	};
	module.exports.metricNames = [PROCESS_OPEN_FDS];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/processMaxFileDescriptors.js
var require_processMaxFileDescriptors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var fs = __require("fs");
	var PROCESS_MAX_FDS = "process_max_fds";
	var maxFds;
	module.exports = (registry, config = {}) => {
		if (maxFds === void 0) try {
			const lines = fs.readFileSync("/proc/self/limits", "utf8").split("\n");
			for (const line of lines) if (line.startsWith("Max open files")) {
				const parts = line.split(/  +/);
				maxFds = Number(parts[1]);
				break;
			}
		} catch {
			return;
		}
		if (maxFds === void 0) return;
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		new Gauge({
			name: namePrefix + PROCESS_MAX_FDS,
			help: "Maximum number of open file descriptors.",
			registers: registry ? [registry] : void 0,
			labelNames,
			collect() {
				if (maxFds !== void 0) this.set(labels, maxFds);
			}
		});
	};
	module.exports.metricNames = [PROCESS_MAX_FDS];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/eventLoopLag.js
var require_eventLoopLag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var perf_hooks;
	try {
		perf_hooks = __require("perf_hooks");
	} catch {}
	var NODEJS_EVENTLOOP_LAG = "nodejs_eventloop_lag_seconds";
	var NODEJS_EVENTLOOP_LAG_MIN = "nodejs_eventloop_lag_min_seconds";
	var NODEJS_EVENTLOOP_LAG_MAX = "nodejs_eventloop_lag_max_seconds";
	var NODEJS_EVENTLOOP_LAG_MEAN = "nodejs_eventloop_lag_mean_seconds";
	var NODEJS_EVENTLOOP_LAG_STDDEV = "nodejs_eventloop_lag_stddev_seconds";
	var NODEJS_EVENTLOOP_LAG_P50 = "nodejs_eventloop_lag_p50_seconds";
	var NODEJS_EVENTLOOP_LAG_P90 = "nodejs_eventloop_lag_p90_seconds";
	var NODEJS_EVENTLOOP_LAG_P99 = "nodejs_eventloop_lag_p99_seconds";
	function reportEventloopLag(start, gauge, labels) {
		const delta = process.hrtime(start);
		const seconds = (delta[0] * 1e9 + delta[1]) / 1e9;
		gauge.set(labels, seconds);
	}
	module.exports = (registry, config = {}) => {
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		const registers = registry ? [registry] : void 0;
		let collect = () => {
			const start = process.hrtime();
			setImmediate(reportEventloopLag, start, lag, labels);
		};
		if (perf_hooks && perf_hooks.monitorEventLoopDelay) try {
			const histogram = perf_hooks.monitorEventLoopDelay({ resolution: config.eventLoopMonitoringPrecision });
			histogram.enable();
			collect = () => {
				const start = process.hrtime();
				setImmediate(reportEventloopLag, start, lag, labels);
				lagMin.set(labels, histogram.min / 1e9);
				lagMax.set(labels, histogram.max / 1e9);
				lagMean.set(labels, histogram.mean / 1e9);
				lagStddev.set(labels, histogram.stddev / 1e9);
				lagP50.set(labels, histogram.percentile(50) / 1e9);
				lagP90.set(labels, histogram.percentile(90) / 1e9);
				lagP99.set(labels, histogram.percentile(99) / 1e9);
				histogram.reset();
			};
		} catch (e) {
			if (e.code === "ERR_NOT_IMPLEMENTED") return;
			throw e;
		}
		const lag = new Gauge({
			name: namePrefix + NODEJS_EVENTLOOP_LAG,
			help: "Lag of event loop in seconds.",
			registers,
			labelNames,
			aggregator: "average",
			collect
		});
		const lagMin = new Gauge({
			name: namePrefix + NODEJS_EVENTLOOP_LAG_MIN,
			help: "The minimum recorded event loop delay.",
			registers,
			labelNames,
			aggregator: "min"
		});
		const lagMax = new Gauge({
			name: namePrefix + NODEJS_EVENTLOOP_LAG_MAX,
			help: "The maximum recorded event loop delay.",
			registers,
			labelNames,
			aggregator: "max"
		});
		const lagMean = new Gauge({
			name: namePrefix + NODEJS_EVENTLOOP_LAG_MEAN,
			help: "The mean of the recorded event loop delays.",
			registers,
			labelNames,
			aggregator: "average"
		});
		const lagStddev = new Gauge({
			name: namePrefix + NODEJS_EVENTLOOP_LAG_STDDEV,
			help: "The standard deviation of the recorded event loop delays.",
			registers,
			labelNames,
			aggregator: "average"
		});
		const lagP50 = new Gauge({
			name: namePrefix + NODEJS_EVENTLOOP_LAG_P50,
			help: "The 50th percentile of the recorded event loop delays.",
			registers,
			labelNames,
			aggregator: "average"
		});
		const lagP90 = new Gauge({
			name: namePrefix + NODEJS_EVENTLOOP_LAG_P90,
			help: "The 90th percentile of the recorded event loop delays.",
			registers,
			labelNames,
			aggregator: "average"
		});
		const lagP99 = new Gauge({
			name: namePrefix + NODEJS_EVENTLOOP_LAG_P99,
			help: "The 99th percentile of the recorded event loop delays.",
			registers,
			labelNames,
			aggregator: "average"
		});
	};
	module.exports.metricNames = [
		NODEJS_EVENTLOOP_LAG,
		NODEJS_EVENTLOOP_LAG_MIN,
		NODEJS_EVENTLOOP_LAG_MAX,
		NODEJS_EVENTLOOP_LAG_MEAN,
		NODEJS_EVENTLOOP_LAG_STDDEV,
		NODEJS_EVENTLOOP_LAG_P50,
		NODEJS_EVENTLOOP_LAG_P90,
		NODEJS_EVENTLOOP_LAG_P99
	];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/helpers/processMetricsHelpers.js
var require_processMetricsHelpers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function aggregateByObjectName(list) {
		const data = {};
		for (let i = 0; i < list.length; i++) {
			const listElement = list[i];
			if (!listElement || typeof listElement.constructor === "undefined") continue;
			if (Object.hasOwnProperty.call(data, listElement.constructor.name)) data[listElement.constructor.name] += 1;
			else data[listElement.constructor.name] = 1;
		}
		return data;
	}
	function updateMetrics(gauge, data, labels) {
		gauge.reset();
		for (const key in data) gauge.set(Object.assign({ type: key }, labels || {}), data[key]);
	}
	module.exports = {
		aggregateByObjectName,
		updateMetrics
	};
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/processHandles.js
var require_processHandles = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { aggregateByObjectName } = require_processMetricsHelpers();
	var { updateMetrics } = require_processMetricsHelpers();
	var Gauge = require_gauge();
	var NODEJS_ACTIVE_HANDLES = "nodejs_active_handles";
	var NODEJS_ACTIVE_HANDLES_TOTAL = "nodejs_active_handles_total";
	module.exports = (registry, config = {}) => {
		if (typeof process._getActiveHandles !== "function") return;
		const registers = registry ? [registry] : void 0;
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		new Gauge({
			name: namePrefix + NODEJS_ACTIVE_HANDLES,
			help: "Number of active libuv handles grouped by handle type. Every handle type is C++ class name.",
			labelNames: ["type", ...labelNames],
			registers,
			collect() {
				const handles = process._getActiveHandles();
				updateMetrics(this, aggregateByObjectName(handles), labels);
			}
		});
		new Gauge({
			name: namePrefix + NODEJS_ACTIVE_HANDLES_TOTAL,
			help: "Total number of active handles.",
			registers,
			labelNames,
			collect() {
				const handles = process._getActiveHandles();
				this.set(labels, handles.length);
			}
		});
	};
	module.exports.metricNames = [NODEJS_ACTIVE_HANDLES, NODEJS_ACTIVE_HANDLES_TOTAL];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/processRequests.js
var require_processRequests = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var { aggregateByObjectName } = require_processMetricsHelpers();
	var { updateMetrics } = require_processMetricsHelpers();
	var NODEJS_ACTIVE_REQUESTS = "nodejs_active_requests";
	var NODEJS_ACTIVE_REQUESTS_TOTAL = "nodejs_active_requests_total";
	module.exports = (registry, config = {}) => {
		if (typeof process._getActiveRequests !== "function") return;
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		new Gauge({
			name: namePrefix + NODEJS_ACTIVE_REQUESTS,
			help: "Number of active libuv requests grouped by request type. Every request type is C++ class name.",
			labelNames: ["type", ...labelNames],
			registers: registry ? [registry] : void 0,
			collect() {
				const requests = process._getActiveRequests();
				updateMetrics(this, aggregateByObjectName(requests), labels);
			}
		});
		new Gauge({
			name: namePrefix + NODEJS_ACTIVE_REQUESTS_TOTAL,
			help: "Total number of active requests.",
			registers: registry ? [registry] : void 0,
			labelNames,
			collect() {
				const requests = process._getActiveRequests();
				this.set(labels, requests.length);
			}
		});
	};
	module.exports.metricNames = [NODEJS_ACTIVE_REQUESTS, NODEJS_ACTIVE_REQUESTS_TOTAL];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/processResources.js
var require_processResources = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var { updateMetrics } = require_processMetricsHelpers();
	var NODEJS_ACTIVE_RESOURCES = "nodejs_active_resources";
	var NODEJS_ACTIVE_RESOURCES_TOTAL = "nodejs_active_resources_total";
	module.exports = (registry, config = {}) => {
		if (typeof process.getActiveResourcesInfo !== "function") return;
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		new Gauge({
			name: namePrefix + NODEJS_ACTIVE_RESOURCES,
			help: "Number of active resources that are currently keeping the event loop alive, grouped by async resource type.",
			labelNames: ["type", ...labelNames],
			registers: registry ? [registry] : void 0,
			collect() {
				const resources = process.getActiveResourcesInfo();
				const data = {};
				for (let i = 0; i < resources.length; i++) {
					const resource = resources[i];
					if (Object.hasOwn(data, resource)) data[resource] += 1;
					else data[resource] = 1;
				}
				updateMetrics(this, data, labels);
			}
		});
		new Gauge({
			name: namePrefix + NODEJS_ACTIVE_RESOURCES_TOTAL,
			help: "Total number of active resources.",
			registers: registry ? [registry] : void 0,
			labelNames,
			collect() {
				const resources = process.getActiveResourcesInfo();
				this.set(labels, resources.length);
			}
		});
	};
	module.exports.metricNames = [NODEJS_ACTIVE_RESOURCES, NODEJS_ACTIVE_RESOURCES_TOTAL];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/heapSizeAndUsed.js
var require_heapSizeAndUsed = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var safeMemoryUsage = require_safeMemoryUsage();
	var NODEJS_HEAP_SIZE_TOTAL = "nodejs_heap_size_total_bytes";
	var NODEJS_HEAP_SIZE_USED = "nodejs_heap_size_used_bytes";
	var NODEJS_EXTERNAL_MEMORY = "nodejs_external_memory_bytes";
	module.exports = (registry, config = {}) => {
		if (typeof process.memoryUsage !== "function") return;
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		const registers = registry ? [registry] : void 0;
		const namePrefix = config.prefix ? config.prefix : "";
		const collect = () => {
			const memUsage = safeMemoryUsage();
			if (memUsage) {
				heapSizeTotal.set(labels, memUsage.heapTotal);
				heapSizeUsed.set(labels, memUsage.heapUsed);
				if (memUsage.external !== void 0) externalMemUsed.set(labels, memUsage.external);
			}
		};
		const heapSizeTotal = new Gauge({
			name: namePrefix + NODEJS_HEAP_SIZE_TOTAL,
			help: "Process heap size from Node.js in bytes.",
			registers,
			labelNames,
			collect
		});
		const heapSizeUsed = new Gauge({
			name: namePrefix + NODEJS_HEAP_SIZE_USED,
			help: "Process heap size used from Node.js in bytes.",
			registers,
			labelNames
		});
		const externalMemUsed = new Gauge({
			name: namePrefix + NODEJS_EXTERNAL_MEMORY,
			help: "Node.js external memory size in bytes.",
			registers,
			labelNames
		});
	};
	module.exports.metricNames = [
		NODEJS_HEAP_SIZE_TOTAL,
		NODEJS_HEAP_SIZE_USED,
		NODEJS_EXTERNAL_MEMORY
	];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/heapSpacesSizeAndUsed.js
var require_heapSpacesSizeAndUsed = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var v8 = __require("v8");
	var METRICS = [
		"total",
		"used",
		"available"
	];
	var NODEJS_HEAP_SIZE = {};
	METRICS.forEach((metricType) => {
		NODEJS_HEAP_SIZE[metricType] = `nodejs_heap_space_size_${metricType}_bytes`;
	});
	module.exports = (registry, config = {}) => {
		try {
			v8.getHeapSpaceStatistics();
		} catch (e) {
			if (e.code === "ERR_NOT_IMPLEMENTED") return;
			throw e;
		}
		const registers = registry ? [registry] : void 0;
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = ["space", ...Object.keys(labels)];
		const gauges = {};
		METRICS.forEach((metricType) => {
			gauges[metricType] = new Gauge({
				name: namePrefix + NODEJS_HEAP_SIZE[metricType],
				help: `Process heap space size ${metricType} from Node.js in bytes.`,
				labelNames,
				registers
			});
		});
		gauges.total.collect = () => {
			for (const space of v8.getHeapSpaceStatistics()) {
				const spaceName = space.space_name.substr(0, space.space_name.indexOf("_space"));
				gauges.total.set({
					space: spaceName,
					...labels
				}, space.space_size);
				gauges.used.set({
					space: spaceName,
					...labels
				}, space.space_used_size);
				gauges.available.set({
					space: spaceName,
					...labels
				}, space.space_available_size);
			}
		};
	};
	module.exports.metricNames = Object.values(NODEJS_HEAP_SIZE);
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/version.js
var require_version = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Gauge = require_gauge();
	var version = process.version;
	var versionSegments = version.slice(1).split(".").map(Number);
	var NODE_VERSION_INFO = "nodejs_version_info";
	module.exports = (registry, config = {}) => {
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		new Gauge({
			name: namePrefix + NODE_VERSION_INFO,
			help: "Node.js version info.",
			labelNames: [
				"version",
				"major",
				"minor",
				"patch",
				...labelNames
			],
			registers: registry ? [registry] : void 0,
			aggregator: "first",
			collect() {
				this.labels(version, versionSegments[0], versionSegments[1], versionSegments[2], ...Object.values(labels)).set(1);
			}
		});
	};
	module.exports.metricNames = [NODE_VERSION_INFO];
}));
//#endregion
//#region node_modules/prom-client/lib/metrics/gc.js
var require_gc = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Histogram = require_histogram();
	var perf_hooks;
	try {
		perf_hooks = __require("perf_hooks");
	} catch {}
	var NODEJS_GC_DURATION_SECONDS = "nodejs_gc_duration_seconds";
	var DEFAULT_GC_DURATION_BUCKETS = [
		.001,
		.01,
		.1,
		1,
		2,
		5
	];
	var kinds = [];
	if (perf_hooks && perf_hooks.constants) {
		kinds[perf_hooks.constants.NODE_PERFORMANCE_GC_MAJOR] = "major";
		kinds[perf_hooks.constants.NODE_PERFORMANCE_GC_MINOR] = "minor";
		kinds[perf_hooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL] = "incremental";
		kinds[perf_hooks.constants.NODE_PERFORMANCE_GC_WEAKCB] = "weakcb";
	}
	module.exports = (registry, config = {}) => {
		if (!perf_hooks) return;
		const namePrefix = config.prefix ? config.prefix : "";
		const labels = config.labels ? config.labels : {};
		const labelNames = Object.keys(labels);
		const buckets = config.gcDurationBuckets ? config.gcDurationBuckets : DEFAULT_GC_DURATION_BUCKETS;
		const gcHistogram = new Histogram({
			name: namePrefix + NODEJS_GC_DURATION_SECONDS,
			help: "Garbage collection duration by kind, one of major, minor, incremental or weakcb.",
			labelNames: ["kind", ...labelNames],
			enableExemplars: false,
			buckets,
			registers: registry ? [registry] : void 0
		});
		new perf_hooks.PerformanceObserver((list) => {
			const entry = list.getEntries()[0];
			const kind = entry.detail ? kinds[entry.detail.kind] : kinds[entry.kind];
			gcHistogram.observe(Object.assign({ kind }, labels), entry.duration / 1e3);
		}).observe({ entryTypes: ["gc"] });
	};
	module.exports.metricNames = [NODEJS_GC_DURATION_SECONDS];
}));
//#endregion
//#region node_modules/prom-client/lib/defaultMetrics.js
var require_defaultMetrics = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { isObject } = require_util();
	var processCpuTotal = require_processCpuTotal();
	var processStartTime = require_processStartTime();
	var osMemoryHeap = require_osMemoryHeap();
	var processOpenFileDescriptors = require_processOpenFileDescriptors();
	var processMaxFileDescriptors = require_processMaxFileDescriptors();
	var eventLoopLag = require_eventLoopLag();
	var processHandles = require_processHandles();
	var processRequests = require_processRequests();
	var processResources = require_processResources();
	var heapSizeAndUsed = require_heapSizeAndUsed();
	var heapSpacesSizeAndUsed = require_heapSpacesSizeAndUsed();
	var version = require_version();
	var gc = require_gc();
	var metrics = {
		processCpuTotal,
		processStartTime,
		osMemoryHeap,
		processOpenFileDescriptors,
		processMaxFileDescriptors,
		eventLoopLag,
		...typeof process.getActiveResourcesInfo === "function" ? { processResources } : {},
		processHandles,
		processRequests,
		heapSizeAndUsed,
		heapSpacesSizeAndUsed,
		version,
		gc
	};
	var metricsList = Object.keys(metrics);
	module.exports = function collectDefaultMetrics(config) {
		if (config !== null && config !== void 0 && !isObject(config)) throw new TypeError("config must be null, undefined, or an object");
		config = {
			eventLoopMonitoringPrecision: 10,
			...config
		};
		for (const metric of Object.values(metrics)) metric(config.register, config);
	};
	module.exports.metricsList = metricsList;
}));
//#endregion
//#region node_modules/prom-client/lib/metricAggregators.js
var require_metricAggregators = /* @__PURE__ */ __commonJSMin(((exports) => {
	var { Grouper, hashObject } = require_util();
	/**
	* Returns a new function that applies the `aggregatorFn` to the values.
	* @param {Function} aggregatorFn function to apply to values.
	* @return {Function} aggregator function
	*/
	function AggregatorFactory(aggregatorFn) {
		return (metrics) => {
			if (metrics.length === 0) return;
			const result = {
				help: metrics[0].help,
				name: metrics[0].name,
				type: metrics[0].type,
				values: [],
				aggregator: metrics[0].aggregator
			};
			const byLabels = new Grouper();
			metrics.forEach((metric) => {
				metric.values.forEach((value) => {
					const key = hashObject(value.labels);
					byLabels.add(`${value.metricName}_${key}`, value);
				});
			});
			byLabels.forEach((values) => {
				if (values.length === 0) return;
				const valObj = {
					value: aggregatorFn(values),
					labels: values[0].labels
				};
				if (values[0].metricName) valObj.metricName = values[0].metricName;
				result.values.push(valObj);
			});
			return result;
		};
	}
	exports.AggregatorFactory = AggregatorFactory;
	/**
	* Functions that can be used to aggregate metrics from multiple registries.
	*/
	exports.aggregators = {
		/**
		* @return The sum of values.
		*/
		sum: AggregatorFactory((v) => v.reduce((p, c) => p + c.value, 0)),
		/**
		* @return The first value.
		*/
		first: AggregatorFactory((v) => v[0].value),
		/**
		* @return {undefined} Undefined; omits the metric.
		*/
		omit: () => {},
		/**
		* @return The arithmetic mean of the values.
		*/
		average: AggregatorFactory((v) => v.reduce((p, c) => p + c.value, 0) / v.length),
		/**
		* @return The minimum of the values.
		*/
		min: AggregatorFactory((v) => v.reduce((p, c) => Math.min(p, c.value), Infinity)),
		/**
		* @return The maximum of the values.
		*/
		max: AggregatorFactory((v) => v.reduce((p, c) => Math.max(p, c.value), -Infinity))
	};
}));
//#endregion
//#region node_modules/prom-client/lib/cluster.js
var require_cluster = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Extends the Registry class with a `clusterMetrics` method that returns
	* aggregated metrics for all workers.
	*
	* In cluster workers, listens for and responds to requests for metrics by the
	* cluster master.
	*/
	var Registry = require_registry();
	var { Grouper } = require_util();
	var { aggregators } = require_metricAggregators();
	var cluster = () => {
		const data = __require("cluster");
		cluster = () => data;
		return data;
	};
	var GET_METRICS_REQ = "prom-client:getMetricsReq";
	var GET_METRICS_RES = "prom-client:getMetricsRes";
	var registries = [Registry.globalRegistry];
	var requestCtr = 0;
	var listenersAdded = false;
	var requests = /* @__PURE__ */ new Map();
	var AggregatorRegistry = class extends Registry {
		constructor(regContentType = Registry.PROMETHEUS_CONTENT_TYPE) {
			super(regContentType);
			addListeners();
		}
		/**
		* Gets aggregated metrics for all workers. The optional callback and
		* returned Promise resolve with the same value; either may be used.
		* @return {Promise<string>} Promise that resolves with the aggregated
		*   metrics.
		*/
		clusterMetrics() {
			const requestId = requestCtr++;
			return new Promise((resolve, reject) => {
				let settled = false;
				function done(err, result) {
					if (settled) return;
					settled = true;
					if (err) reject(err);
					else resolve(result);
				}
				const request = {
					responses: [],
					pending: 0,
					done,
					errorTimeout: setTimeout(() => {
						const err = /* @__PURE__ */ new Error("Operation timed out.");
						request.done(err);
					}, 5e3)
				};
				requests.set(requestId, request);
				const message = {
					type: GET_METRICS_REQ,
					requestId
				};
				for (const id in cluster().workers) if (cluster().workers[id].isConnected()) {
					cluster().workers[id].send(message);
					request.pending++;
				}
				if (request.pending === 0) {
					clearTimeout(request.errorTimeout);
					process.nextTick(() => done(null, ""));
				}
			});
		}
		get contentType() {
			return super.contentType;
		}
		/**
		* Creates a new Registry instance from an array of metrics that were
		* created by `registry.getMetricsAsJSON()`. Metrics are aggregated using
		* the method specified by their `aggregator` property, or by summation if
		* `aggregator` is undefined.
		* @param {Array} metricsArr Array of metrics, each of which created by
		*   `registry.getMetricsAsJSON()`.
		* @param {string} registryType content type of the new registry. Defaults
		* to PROMETHEUS_CONTENT_TYPE.
		* @return {Registry} aggregated registry.
		*/
		static aggregate(metricsArr, registryType = Registry.PROMETHEUS_CONTENT_TYPE) {
			const aggregatedRegistry = new Registry();
			const metricsByName = new Grouper();
			aggregatedRegistry.setContentType(registryType);
			metricsArr.forEach((metrics) => {
				metrics.forEach((metric) => {
					metricsByName.add(metric.name, metric);
				});
			});
			metricsByName.forEach((metrics) => {
				const aggregatorName = metrics[0].aggregator;
				const aggregatorFn = aggregators[aggregatorName];
				if (typeof aggregatorFn !== "function") throw new Error(`'${aggregatorName}' is not a defined aggregator.`);
				const aggregatedMetric = aggregatorFn(metrics);
				if (aggregatedMetric) {
					const aggregatedMetricWrapper = Object.assign({ get: () => aggregatedMetric }, aggregatedMetric);
					aggregatedRegistry.registerMetric(aggregatedMetricWrapper);
				}
			});
			return aggregatedRegistry;
		}
		/**
		* Sets the registry or registries to be aggregated. Call from workers to
		* use a registry/registries other than the default global registry.
		* @param {Array<Registry>|Registry} regs Registry or registries to be
		*   aggregated.
		* @return {void}
		*/
		static setRegistries(regs) {
			if (!Array.isArray(regs)) regs = [regs];
			regs.forEach((reg) => {
				if (!(reg instanceof Registry)) throw new TypeError(`Expected Registry, got ${typeof reg}`);
			});
			registries = regs;
		}
	};
	/**
	* Adds event listeners for cluster aggregation. Idempotent (safe to call more
	* than once).
	* @return {void}
	*/
	function addListeners() {
		if (listenersAdded) return;
		listenersAdded = true;
		if (cluster().isMaster) cluster().on("message", (worker, message) => {
			if (message.type === GET_METRICS_RES) {
				const request = requests.get(message.requestId);
				if (message.error) {
					request.done(new Error(message.error));
					return;
				}
				message.metrics.forEach((registry) => request.responses.push(registry));
				request.pending--;
				if (request.pending === 0) {
					requests.delete(message.requestId);
					clearTimeout(request.errorTimeout);
					const promString = AggregatorRegistry.aggregate(request.responses).metrics();
					request.done(null, promString);
				}
			}
		});
		if (cluster().isWorker) process.on("message", (message) => {
			if (message.type === GET_METRICS_REQ) Promise.all(registries.map((r) => r.getMetricsAsJSON())).then((metrics) => {
				process.send({
					type: GET_METRICS_RES,
					requestId: message.requestId,
					metrics
				});
			}).catch((error) => {
				process.send({
					type: GET_METRICS_RES,
					requestId: message.requestId,
					error: error.message
				});
			});
		});
	}
	module.exports = AggregatorRegistry;
}));
//#endregion
//#region node_modules/prom-client/index.js
/**
* Prometheus client
* @module Prometheus client
*/
var require_prom_client = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.register = require_registry().globalRegistry;
	exports.Registry = require_registry();
	Object.defineProperty(exports, "contentType", {
		configurable: false,
		enumerable: true,
		get() {
			return exports.register.contentType;
		},
		set(value) {
			exports.register.setContentType(value);
		}
	});
	exports.prometheusContentType = exports.Registry.PROMETHEUS_CONTENT_TYPE;
	exports.openMetricsContentType = exports.Registry.OPENMETRICS_CONTENT_TYPE;
	exports.validateMetricName = require_validation().validateMetricName;
	exports.Counter = require_counter();
	exports.Gauge = require_gauge();
	exports.Histogram = require_histogram();
	exports.Summary = require_summary();
	exports.Pushgateway = require_pushgateway();
	exports.linearBuckets = require_bucketGenerators().linearBuckets;
	exports.exponentialBuckets = require_bucketGenerators().exponentialBuckets;
	exports.collectDefaultMetrics = require_defaultMetrics();
	exports.aggregators = require_metricAggregators().aggregators;
	exports.AggregatorRegistry = require_cluster();
}));
//#endregion
export { require_prom_client as t };
