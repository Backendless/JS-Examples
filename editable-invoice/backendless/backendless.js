(function () {
    NodeDevice = {
        name: 'NODEJS',
        platform: 'NODEJS',
        uuid: 'someId',
        version: '1'
    };

    function isBrowser() {
        return typeof window !== "undefined";// && !module && !module.exports;
    }

    if (!isBrowser()) {
        encodeURIComponent = function (url) {
            return escape(url);
        }
    }

    var root = this,
        Backendless = root.Backendless || {},
        emptyFn = (function () {
        });

    root.Backendless = Backendless;

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {
            var k;
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            var O = Object(this);
            var len = O.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = +fromIndex || 0;
            if (Math.abs(n) === Infinity) {
                n = 0;
            }
            if (n >= len) {
                return -1;
            }
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            while (k < len) {
                var kValue;
                if (k in O && O[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    }

    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    var slice = ArrayProto.slice, unshift = ArrayProto.unshift, toString = ObjProto.toString, hasOwnProperty = ObjProto.hasOwnProperty;

    var nativeForEach = ArrayProto.forEach, nativeMap = ArrayProto.map, nativeReduce = ArrayProto.reduce, nativeReduceRight = ArrayProto.reduceRight, nativeFilter = ArrayProto.filter, nativeEvery = ArrayProto.every, nativeSome = ArrayProto.some, nativeIndexOf = ArrayProto.indexOf, nativeLastIndexOf = ArrayProto.lastIndexOf, nativeIsArray = Array.isArray, nativeKeys = Object.keys, nativeBind = FuncProto.bind;

    var rGUID = /([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})/i;

    var WebSocket = null; // isBrowser() ? window.WebSocket || window.MozWebSocket : {};

    Backendless.VERSION = '0.2';
    Backendless.serverURL = 'https://api.backendless.com';

    initXHR();

    var browser = (function () {
        var ua = isBrowser() ? navigator.userAgent.toLowerCase() : "NodeJS",
            match = (/(chrome)[ \/]([\w.]+)/.exec(ua) ||
            /(webkit)[ \/]([\w.]+)/.exec(ua) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
            /(msie) ([\w.]+)/.exec(ua) ||
            ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || []),
            matched = {
                browser: match[ 1 ] || '',
                version: match[ 2 ] || '0'
            },
            browser = {};
        if (matched.browser) {
            browser[ matched.browser ] = true;
            browser.version = matched.version;
        }
        return browser;
    })();
    var UIState = null;
    var getNow = function () {
        return new Date().getTime();
    };
    Backendless.browser = browser;

    var Utils = Backendless.Utils = {
        isObject: function (obj) {
            return obj === Object(obj);
        },
        isString: function (obj) {
            return Object.prototype.toString.call(obj).slice(8, -1) === 'String';
        },
        isNumber: function (obj) {
            return Object.prototype.toString.call(obj).slice(8, -1) === 'Number';
        },
        isFunction: function (obj) {
            return Object.prototype.toString.call(obj).slice(8, -1) === 'Function';
        },
        isBoolean: function (obj) {
            return Object.prototype.toString.call(obj).slice(8, -1) === 'Boolean';
        },
        isDate: function (obj) {
            return Object.prototype.toString.call(obj).slice(8, -1) === 'Date';
        }
    };
    Utils.isArray = (nativeIsArray || function (obj) {
        return Object.prototype.toString.call(obj).slice(8, -1) === 'Array';
    });
    Utils.addEvent = function (evnt, elem, func) {
        if (elem.addEventListener)
            elem.addEventListener(evnt, func, false);
        else if (elem.attachEvent)
            elem.attachEvent("on" + evnt, func);
        else
            elem[evnt] = func;
    };
    Utils.isEmpty = function (obj) {
        if (obj == null) return true;
        if (Utils.isArray(obj) || Utils.isString(obj)) return obj.length === 0;
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== undefined && obj[key] !== null) {
                return false
            }
        }
        return true;
    };

    Utils.removeEvent = function (evnt, elem) {
        if (elem.removeEventListener)
            elem.removeEventListener(evnt, null, false);
        else if (elem.detachEvent)
            elem.detachEvent("on" + evnt, null);
        else
            elem[evnt] = null;
    };
    var forEach = Utils.forEach = function (obj, iterator, context) {
        if (!obj) {
            return;
        }
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                    return;
                }
            }
        } else {
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) {
                        return;
                    }
                }
            }
        }
    };

    function initXHR() {
        try {
            if (typeof XMLHttpRequest.prototype.sendAsBinary == 'undefined') {
                XMLHttpRequest.prototype.sendAsBinary = function (text) {
                    var data = new ArrayBuffer(text.length);
                    var ui8a = new Uint8Array(data, 0);
                    for (var i = 0; i < text.length; i++) ui8a[i] = (text.charCodeAt(i) & 0xff);
                    this.send(ui8a);
                }
            }
        }
        catch (e) {
        }
    }

    Backendless.setUIState = function (stateName) {
        if (stateName === undefined) {
            throw new Error('UI state name must be defined or explicitly set to null');
        } else {
            UIState = stateName === null ? null : stateName;
        }
    };

    Backendless._ajax_for_browser = function (config) {
        var cashingAllowedArr = ['cacheOnly', 'remoteDataOnly', 'fromCacheOrRemote', 'fromRemoteOrCache', 'fromCacheAndRemote'],
            cacheMethods = {
                ignoreCache: function (config) {
                    return sendRequest(config);
                },
                cacheOnly: function (config) {
                    var cachedResult = Backendless.LocalCache.get(config.url.replace(/([^A-Za-z0-9])/g, '')),
                        cacheError = {
                            message: 'error: cannot find data in Backendless.LocalCache',
                            statusCode: 404
                        };
                    if (cachedResult) {
                        config.isAsync && config.asyncHandler.success(cachedResult);
                        return cachedResult;
                    } else {
                        if (config.isAsync) {
                            config.asyncHandler.fault(cacheError);
                        } else {
                            throw cacheError;
                        }
                    }
                },
                remoteDataOnly: function (config) {
                    return sendRequest(config);
                },
                fromCacheOrRemote: function (config) {
                    var cachedResult = Backendless.LocalCache.get(config.url.replace(/([^A-Za-z0-9])/g, ''));
                    if (cachedResult) {
                        config.isAsync && config.asyncHandler.success(cachedResult);
                        return cachedResult;
                    } else {
                        return sendRequest(config);
                    }
                },
                fromRemoteOrCache: function (config) {
                    return sendRequest(config);
                },
                fromCacheAndRemote: function (config) {
                    var result = {},
                        cachedResult = Backendless.LocalCache.get(config.url.replace(/([^A-Za-z0-9])/g, '')),
                        cacheError = {
                            message: 'error: cannot find data in Backendless.LocalCache',
                            statusCode: 404
                        };
                    result.remote = sendRequest(config);
                    if (cachedResult) {
                        config.isAsync && config.asyncHandler.success(cachedResult);
                        result.local = cachedResult;
                    } else {
                        if (config.isAsync) {
                            config.asyncHandler.fault(cacheError);
                        } else {
                            throw cacheError;
                        }
                    }
                    return result;
                }
            },
            sendRequest = function (config) {
                var xhr = new XMLHttpRequest(),
                    contentType = config.data ? 'application/json' : 'application/x-www-form-urlencoded',
                    response,
                    parseResponse = function (xhr) {
                        var result = true;
                        if (xhr.responseText) {
                            try {
                                result = JSON.parse(xhr.responseText);
                            } catch (e) {
                                result = xhr.responseText;
                            }
                        }
                        return result;
                    },
                    badResponse = function (xhr) {
                        var result = {};
                        try {
                            result = JSON.parse(xhr.responseText);
                        } catch (e) {
                            result.message = xhr.responseText;
                        }
                        result.statusCode = xhr.status;
                        result.message = result.message || 'unknown error occurred';
                        return result;
                    },
                    cacheHandler = function (response) {
                        response = cloneObject(response);
                        if (config.method == 'GET' && config.cacheActive) {
                            response.cachePolicy = config.cachePolicy;
                            Backendless.LocalCache.set(config.urlBlueprint, response);
                        } else if (Backendless.LocalCache.exists(config.urlBlueprint)) {
                            if (response === true || config.method == 'DELETE') {
                                response = undefined;
                            } else {
                                response.cachePolicy = Backendless.LocalCache.getCachePolicy(config.urlBlueprint);
                            }
                            '___class' in response && delete response['___class'];  // this issue must be fixed on server side
                            Backendless.LocalCache.set(config.urlBlueprint, response);
                        }
                    },
                    checkInCache = function () {
                        return config.cacheActive && config.cachePolicy.policy == 'fromRemoteOrCache' && Backendless.LocalCache.exists(config.urlBlueprint);
                    };

                xhr.open(config.method, config.url, config.isAsync);
                xhr.setRequestHeader('Content-Type', contentType);
                xhr.setRequestHeader('application-id', Backendless.applicationId);
                xhr.setRequestHeader('secret-key', Backendless.secretKey);
                xhr.setRequestHeader('application-type', 'JS');
                if ((currentUser != null && currentUser["user-token"])) {
                    xhr.setRequestHeader("user-token", currentUser["user-token"]);
                } else if (Backendless.LocalCache.exists("user-token")) {
                    xhr.setRequestHeader("user-token", Backendless.LocalCache.get("user-token"));
                }
                if (UIState !== null) {
                    xhr.setRequestHeader("uiState", UIState);
                }
                if (config.isAsync) {
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                response = parseResponse(xhr);
                                cacheHandler(response);
                                config.asyncHandler.success && config.asyncHandler.success(response);
                            } else if (checkInCache()) {
                                config.asyncHandler.success && config.asyncHandler.success(Backendless.LocalCache.get(config.urlBlueprint));
                            } else {
                                config.asyncHandler.fault && config.asyncHandler.fault(badResponse(xhr));
                            }
                        }
                    }
                }
                xhr.send(config.data);
                if (config.isAsync) {
                    return xhr;
                } else if (xhr.status >= 200 && xhr.status < 300) {
                    response = parseResponse(xhr);
                    cacheHandler(response);
                    return response;
                } else if (checkInCache()) {
                    return Backendless.LocalCache.get(config.urlBlueprint);
                } else {
                    throw badResponse(xhr);
                }
            };

        config.method = config.method || 'GET';
        config.cachePolicy = config.cachePolicy || {policy: 'ignoreCache'};
        config.isAsync = (typeof config.isAsync == 'boolean') ? config.isAsync : false;
        config.cacheActive = (config.method == 'GET') && (cashingAllowedArr.indexOf(config.cachePolicy.policy) != -1);
        config.urlBlueprint = config.url.replace(/([^A-Za-z0-9])/g, '');

        try {
            return cacheMethods[config.cachePolicy.policy].call(this, config);
        } catch (error) {
            console.log('error: ' + error.message);
            throw error;
        }
    };

    Backendless._ajax_for_nodejs = function (config) {
        config.data = config.data || "";
        if (typeof config.data !== "string") {
            config.data = JSON.stringify(config.data);
        }
        config.asyncHandler = config.asyncHandler || {};
        config.isAsync = (typeof config.isAsync == 'boolean') ? config.isAsync : false;
        var protocol = config.url.substr(0, config.url.indexOf('/', 8)).substr(0, config.url.indexOf(":"));
        var uri = config.url.substr(0, config.url.indexOf('/', 8)).substr(config.url.indexOf("/") + 2),
            host = uri.substr(0, (uri.indexOf(":") == -1 ? uri.length : uri.indexOf(":"))),
            port = uri.indexOf(":") != -1 ? parseInt(uri.substr(uri.indexOf(":") + 1)) : (protocol == "http" ? 80 : 443);
        var options = {
            host: host,
            //protocol: "http",
            port: port,
            method: config.method || "GET",
            path: config.url.substr(config.url.indexOf('/', 8)),
            //body: config.data,
            headers: {
                "Content-Length": config.data ? config.data.length : 0,
                "Content-Type": config.data ? 'application/json' : 'application/x-www-form-urlencoded',
                "application-id": Backendless.applicationId,
                "secret-key": Backendless.secretKey,
                "application-type": "JS"
            }
        };

        if (currentUser != null) {
            options.headers["user-token"] = currentUser["user-token"];
        }
        if (!config.isAsync) {
            var http = require("httpsync"),
                req = http.request(options);
        } else {
            var httpx = require(protocol);
            var req = httpx.request(options, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    config.asyncHandler.success(chunk);
                });
            });
        }

        req.on('error', function (e) {
            config.asyncHandler.fault || (config.asyncHandler.fault = function () {
            });
            config.asyncHandler.fault(e);
        });
        req.write(config.data, "utf8");
        return req.end();
    };

    Backendless._ajax = isBrowser() ? Backendless._ajax_for_browser : Backendless._ajax_for_nodejs;

    var getClassName = function () {
        var instStringified = (Utils.isFunction(this) ? this.toString() : this.constructor.toString()),
            results = instStringified.match(/function\s+(\w+)/);
        return (results && results.length > 1) ? results[1] : '';
    };

    var encodeArrayToUriComponent = function (arr) {
        var props = [], i, len;
        for (i = 0, len = arr.length; i < len; ++i) {
            props.push(encodeURIComponent(arr[i]));
        }
        return props.join(',');
    };

    var classWrapper = function (obj) {
        var wrapper = function (obj) {
            var wrapperName = null,
                wrapperFunc = null;
            for (var property in obj) {
                if (obj.hasOwnProperty(property)) {
                    if (property === "___class") {
                        wrapperName = obj[property];
                        break;
                    }
                }
            }
            if (wrapperName) {
                try {
                    wrapperFunc = eval(wrapperName);
                    obj = deepExtend(new wrapperFunc(), obj);
                } catch (e) {
                }
            }
            return obj;
        };
        if (Utils.isObject(obj) && obj != null) {
            if (Utils.isArray(obj)) {
                for (var i = obj.length; i--;) {
                    obj[i] = wrapper(obj[i]);
                }
            } else {
                obj = wrapper(obj);
            }
        }
        return obj;
    };

    var deepExtend = function (destination, source) {
        for (var property in source) {
            if (source[property] !== undefined && source.hasOwnProperty(property)) {
                destination[property] = destination[property] || {};
                destination[property] = classWrapper(source[property]);
            }
        }
        return destination;
    };

    var cloneObject = function (obj) {
        return Utils.isArray(obj) ? obj.slice() : deepExtend({}, obj);
    };

    var extractResponder = function (args) {
        var i, len;
        for (i = 0, len = args.length; i < len; ++i) {
            if (args[i] instanceof Async) {
                return args[i];
            }
        }
        return null;
    };

    function extendCollection(collection, dataMapper) {
        if (collection.nextPage && collection.nextPage.split("/")[1] == Backendless.appVersion) {
            collection.nextPage = Backendless.serverURL + collection.nextPage
        }
        collection._nextPage = collection.nextPage;
        collection.nextPage = function (async) {
            return dataMapper._load(this._nextPage, async);
        };
        collection.getPage = function (offset, pageSize, async) {
            var nextPage = this._nextPage.replace(/offset=\d+/ig, 'offset=' + offset);
            if (pageSize instanceof Async) {
                async = pageSize;
            }
            else {
                nextPage = nextPage.replace(/pagesize=\d+/ig, 'pageSize=' + pageSize);
            }
            async = extractResponder(arguments);
            return dataMapper._load(nextPage, async);
        };
        collection.dataMapper = dataMapper;
    }

    function Async(successCallback, faultCallback, context) {

        if (!(faultCallback instanceof Function)) {
            context = faultCallback;
            faultCallback = emptyFn;
        }

        this.success = function (data) {
            successCallback && successCallback.call(context, data);
        };
        this.fault = function (data) {
            faultCallback && faultCallback.call(context, data);
        }
    }

    function setCache() {
        var store = {},
            localStorageName = 'localStorage',
            storage;
        store.enabled = false;
        store.exists = function (key) {
        };
        store.set = function (key, value) {
        };
        store.get = function (key) {
        };
        store.remove = function (key) {
        };
        store.clear = function () {
        };
        store.flushExpired = function () {
        };
        store.getCachePolicy = function (key) {
        };
        store.getAll = function () {
        };
        store.serialize = function (value) {
            return JSON.stringify(value);
        };
        store.deserialize = function (value) {
            if (typeof value != 'string') {
                return undefined;
            }
            try {
                return JSON.parse(value);
            } catch (e) {
                return value || undefined;
            }
        };
        function isLocalStorageSupported() {
            try {
                if (isBrowser() && (localStorageName in window && window[localStorageName])) {
                    localStorage.setItem('localStorageTest', true);
                    localStorage.removeItem('localStorageTest');
                    return true;
                } else {
                    return false;
                }
            } catch (e) {
                return false;
            }
        }

        if (isLocalStorageSupported()) {
            storage = window[localStorageName];
            var createBndlsStorage = function () {
                    if (!('Backendless' in storage)) {
                        storage.setItem('Backendless', store.serialize({}));
                    }
                },
                expired = function (obj) {
                    var result = false;
                    if (Object.prototype.toString.call(obj).slice(8, -1) == "Object") {
                        if ('cachePolicy' in obj && 'timeToLive' in obj['cachePolicy'] && obj['cachePolicy']['timeToLive'] != -1 && 'created' in obj['cachePolicy']) {
                            result = (new Date().getTime() - obj['cachePolicy']['created']) > obj['cachePolicy']['timeToLive'];
                        }
                    }
                    return result;
                },
                addTimestamp = function (obj) {
                    if (Object.prototype.toString.call(obj).slice(8, -1) == "Object") {
                        if ('cachePolicy' in obj && 'timeToLive' in obj['cachePolicy']) {
                            obj['cachePolicy']['created'] = new Date().getTime();
                        }
                    }
                };
            createBndlsStorage();
            store.enabled = true;
            store.exists = function (key) {
                return store.get(key) !== undefined;
            };
            store.set = function (key, val) {
                if (val === undefined) {
                    return store.remove(key);
                }
                createBndlsStorage();
                var backendlessObj = store.deserialize(storage.getItem('Backendless'));
                addTimestamp(val);
                backendlessObj[key] = val;
                try {
                    storage.setItem('Backendless', store.serialize(backendlessObj));
                } catch (e) {
                    backendlessObj = {};
                    backendlessObj[key] = val;
                    storage.setItem('Backendless', store.serialize(backendlessObj));
                }
                return val;
            };
            store.get = function (key) {
                createBndlsStorage();
                var backendlessObj = store.deserialize(storage.getItem('Backendless')),
                    obj = backendlessObj[key],
                    result = obj;
                if (expired(obj)) {
                    delete backendlessObj[key];
                    storage.setItem('Backendless', store.serialize(backendlessObj));
                    result = undefined;
                }
                if (result && result['cachePolicy']) {
                    delete result['cachePolicy']
                }
                return result;
            };
            store.remove = function (key) {
                var result;
                createBndlsStorage();
                key = key.replace(/([^A-Za-z0-9-])/g, '');
                var backendlessObj = store.deserialize(storage.getItem('Backendless'));
                if (backendlessObj.hasOwnProperty(key)) {
                    result = delete backendlessObj[key];
                }
                storage.setItem('Backendless', store.serialize(backendlessObj));
                return result;
            };
            store.clear = function () {
                storage.setItem('Backendless', store.serialize({}));
            };
            store.getAll = function () {
                createBndlsStorage();
                var backendlessObj = store.deserialize(storage.getItem('Backendless')),
                    ret = {};
                for (var prop in backendlessObj) {
                    if (backendlessObj.hasOwnProperty(prop)) {
                        ret[prop] = backendlessObj[prop];
                        if (ret[prop] !== null && ret[prop].hasOwnProperty('cachePolicy')) {
                            delete ret[prop]['cachePolicy'];
                        }
                    }
                }
                return ret;
            };
            store.flushExpired = function () {
                createBndlsStorage();
                var backendlessObj = store.deserialize(storage.getItem('Backendless')),
                    obj;
                for (var prop in backendlessObj) {
                    if (backendlessObj.hasOwnProperty(prop)) {
                        obj = backendlessObj[prop];
                        if (expired(obj)) {
                            delete backendlessObj[prop];
                            storage.setItem('Backendless', store.serialize(backendlessObj));
                        }
                    }
                }
            };
            store.getCachePolicy = function (key) {
                createBndlsStorage();
                var backendlessObj = store.deserialize(storage.getItem('Backendless')),
                    obj = backendlessObj[key];
                return obj ? obj['cachePolicy'] : undefined;
            };
        }
        return store;
    }

    Backendless.LocalCache = setCache();
    if (Backendless.LocalCache.enabled) {
        Backendless.LocalCache.flushExpired();
    }

    Backendless.Async = Async;

    function DataQuery() {
        this.properties = [];
        this.condition = null;
        this.options = null;
        this.url = null;
    }

    DataQuery.prototype = {
        addProperty: function (prop) {
            this.properties = this.properties || [];
            this.properties.push(prop);
        }
    };

    Backendless.DataQuery = DataQuery;

    function DataStore(model) {
        this.model = model;
        this.className = getClassName.call(model);
        if ((typeof model).toLowerCase() === "string")
            this.className = model;
        if (!this.className) {
            throw 'Class name should be specified';
        }
        this.restUrl = Backendless.appPath + '/data/' + this.className;
    }

    DataStore.prototype = {
        _extractQueryOptions: function (options) {
            var params = [];
            if (typeof options.pageSize != 'undefined') {
                if (options.pageSize < 1 || options.pageSize > 100) {
                    throw new Error('PageSize can not be less then 1 or greater than 100');
                }
                params.push('pageSize=' + encodeURIComponent(options.pageSize));
            }
            if (options.offset) {
                if (options.offset < 0) {
                    throw new Error('Offset can not be less then 0');
                }
                params.push('offset=' + encodeURIComponent(options.offset));
            }
            if (options.sortBy) {
                if (Utils.isString(options.sortBy)) {
                    params.push('sortBy=' + encodeURIComponent(options.sortBy));
                } else if (Utils.isArray(options.sortBy)) {
                    params.push('sortBy=' + encodeArrayToUriComponent(options.sortBy));
                }
            }
            if (options.relationsDepth) {
                if (Utils.isNumber(options.relationsDepth)) {
                    params.push('relationsDepth=' + encodeURIComponent(Math.floor(options.relationsDepth)));
                }
            }
            if (options.relations) {
                if (Utils.isArray(options.relations)) {
                    params.push('loadRelations=' + (options.relations.length ? encodeArrayToUriComponent(options.relations) : "*"));
                }
            }
            return params.join('&');
        },
        _wrapAsync: function (async) {
            var me = this, success = function (data) {
                data = me._parseResponse(data);
                async.success(data);
            }, error = function (data) {
                async.fault(data);
            };
            return new Async(success, error);
        },
        _parseResponse: function (response) {
            var i, len, _Model = this.model, item;
            if (response.data) {
                var collection = response, arr = collection.data;
                for (i = 0, len = arr.length; i < len; ++i) {
                    arr[i] = arr[i].fields || arr[i];
                    item = new _Model;
                    deepExtend(item, arr[i]);
                    arr[i] = item;
                }
                extendCollection(collection, this);
                return collection;
            }
            else {
                response = response.fields || response;
                item = new _Model;
                deepExtend(item, response);
                return this._formCircDeps(item);
            }

        },
        _load: function (url, async) {
            var responder = extractResponder(arguments), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }

            var result = Backendless._ajax({
                method: 'GET',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder
            });

            return isAsync ? result : this._parseResponse(result);
        },
        _replCircDeps: function (obj) {
            var objMap = [obj],
                pos,
                GenID = function () {
                    for (var b = '', a = b; a++ < 36; b += a * 51 && 52 ? (a ^ 15 ? 8 ^ Math.random() * (a ^ 20 ? 16 : 4) : 4).toString(16) : '-') {
                    }
                    return b;
                },
                _replCircDepsHelper = function (obj) {
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop) && typeof obj[prop] == "object" && obj[prop] != null) {
                            if ((pos = objMap.indexOf(obj[prop])) != -1) {
                                objMap[pos]["__subID"] = objMap[pos]["__subID"] || GenID();
                                obj[prop] = {"__originSubID": objMap[pos]["__subID"]};
                            } else if (Utils.isDate(obj[prop])) {
                                obj[prop] = obj[prop].getTime();
                            } else {
                                objMap.push(obj[prop]);
                                _replCircDepsHelper(obj[prop]);
                            }
                        }
                    }
                };
            _replCircDepsHelper(obj);
        },
        _formCircDeps: function (obj) {
            var circDepsIDs = {},
                result = new obj.constructor(),
                _formCircDepsHelper = function (obj, result) {
                    if (obj.hasOwnProperty("__subID")) {
                        circDepsIDs[obj["__subID"]] = result;
                        delete obj["__subID"];
                    }
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            if (typeof obj[prop] == "object" && obj[prop] != null) {
                                if (obj[prop].hasOwnProperty("__originSubID")) {
                                    result[prop] = circDepsIDs[obj[prop]["__originSubID"]];
                                } else {
                                    result[prop] = new (obj[prop].constructor)();
                                    _formCircDepsHelper(obj[prop], result[prop]);
                                }
                            } else {
                                result[prop] = obj[prop];
                            }
                        }
                    }
                };
            _formCircDepsHelper(obj, result);
            return result;
        },
        save: function (obj, async) {
            this._replCircDeps(obj);
            var responder = extractResponder(arguments),
                isAsync = false,
                method = 'PUT',
                url = this.restUrl,
                objRef = obj;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: method,
                url: url,
                data: JSON.stringify(obj),
                isAsync: isAsync,
                asyncHandler: responder
            });
            if (!isAsync) {
                deepExtend(objRef, this._parseResponse(result));
            }
            return isAsync ? result : this._parseResponse(result);
        },
        remove: function (objId, async) {
            if(!Utils.isObject(objId) && !Utils.isString(objId)){
                throw new Error('Invalid value for the "value" argument. The argument must contain only string or object values');
            }
            var responder = extractResponder(arguments), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result;
            if(Utils.isString(objId) || objId.objectId){
                objId = objId.objectId || objId;
                result = Backendless._ajax({
                    method: 'DELETE',
                    url: this.restUrl + '/' + objId,
                    isAsync: isAsync,
                    asyncHandler: responder
                });
            } else {
                result = Backendless._ajax({
                    method: 'DELETE',
                    url: this.restUrl,
                    data:JSON.stringify(objId),
                    isAsync: isAsync,
                    asyncHandler: responder
                });
            }
            return isAsync ? result : this._parseResponse(result);
        },
        find: function (dataQuery) {
            dataQuery = dataQuery || {};
            var props,
                whereClause,
                options,
                query = [],
                url = this.restUrl,
                responder = extractResponder(arguments),
                isAsync = responder != null,
                result;
            if (dataQuery.properties) {
                props = 'props=' + encodeArrayToUriComponent(dataQuery.properties);
            }
            if (dataQuery.condition) {
                whereClause = 'where=' + encodeURIComponent(dataQuery.condition);
            }
            if (dataQuery.options) {
                options = this._extractQueryOptions(dataQuery.options);
            }
            responder != null && (responder = this._wrapAsync(responder));
            options && query.push(options);
            whereClause && query.push(whereClause);
            props && query.push(props);
            query = query.join('&');
            if (dataQuery.url) {
                url += '/' + dataQuery.url;
            }
            if (query) {
                url += '?' + query;
            }
            result = Backendless._ajax({
                method: 'GET',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder,
                cachePolicy: dataQuery.cachePolicy
            });
            return isAsync ? result : this._parseResponse(result);
        },

        _buildArgsObject: function () {
            var args = {},
                i = arguments.length,
                type = "";
            for (; i--;) {
                type = Object.prototype.toString.call(arguments[i]).toLowerCase().match(/[a-z]+/g)[1];
                switch (type) {
                    case "number":
                        args.options = args.options || {};
                        args.options.relationsDepth = arguments[i];
                        break;
                    case "string":
                        args.url = arguments[i];
                        break;
                    case "array":
                        args.options = args.options || {};
                        args.options.relations = arguments[i];
                        break;
                    case "object":
                        if (arguments[i].hasOwnProperty('cachePolicy')) {
                            args.cachePolicy = arguments[i]['cachePolicy'];
                        }
                        break;
                    default:
                        break;
                }
            }
            return args;
        },

        findById: function () {
            var argsObj;
            if(Utils.isString(arguments[0])){
                argsObj = this._buildArgsObject.apply(this, arguments);
                if (!(argsObj.url)) {
                    throw new Error('missing argument "object ID" for method findById()');
                }
                return this.find.apply(this, [argsObj].concat(Array.prototype.slice.call(arguments)));
            } else if(Utils.isObject(arguments[0])) {
                argsObj = arguments[0];
                var responder = extractResponder(arguments),
                    url = this.restUrl,
                    isAsync = responder != null,
                    send = "/pk?";
                for(var key in argsObj){
                    send += key + '=' + argsObj[key] + '&';
                }
                responder != null && (responder = this._wrapAsync(responder));
                var result;
                if(getClassName.call(arguments[0]) == 'Object') {
                    result = Backendless._ajax({
                        method: 'GET',
                        url: url + send.replace(/&$/, ""),
                        isAsync: isAsync,
                        asyncHandler: responder
                    });
                } else {
                    result = Backendless._ajax({
                        method: 'PUT',
                        url: url,
                        data:JSON.stringify(argsObj),
                        isAsync: isAsync,
                        asyncHandler: responder
                    });
                }
                return isAsync ? result : this._parseResponse(result);
            } else {
                throw new Error('Invalid value for the "value" argument. The argument must contain only string or object values');
            }
        },

        loadRelations: function (obj) {
//                argsObj = this._buildArgsObject.apply(this, arguments);
//                argsObj.url = obj.objectId;
//                deepExtend(obj, this.find.apply(this, [argsObj].concat(Array.prototype.slice.call(arguments))));
            if (!obj) {
                throw new Error('missing object argument for method loadRelations()');
            }
            if (!Utils.isObject(obj)) {
                throw new Error('Invalid value for the "value" argument. The argument must contain only object values');
            }
            var argsObj = arguments[0];
            var url = this.restUrl + '/relations';
            if (arguments[1]) {
                if (Utils.isArray(arguments[1])) {
                    if (arguments[1][0] == '*') {
                        url += '?relationsDepth=' + arguments[1].length;
                    } else {
                        url += '?loadRelations=' + arguments[1][0] + '&relationsDepth=' + arguments[1].length;
                    }
                } else {
                    throw new Error('Invalid value for the "options" argument. The argument must contain only array values');
                }
            }
            var result = Backendless._ajax({
                method: 'PUT',
                url: url,
                data: JSON.stringify(argsObj)
            });
            deepExtend(obj, result);
        },

        findFirst: function () {
            var argsObj = this._buildArgsObject.apply(this, arguments);
            argsObj.url = 'first';
            return this.find.apply(this, [argsObj].concat(Array.prototype.slice.call(arguments)));
        },

        findLast: function () {
            var argsObj = this._buildArgsObject.apply(this, arguments);
            argsObj.url = 'last';
            return this.find.apply(this, [argsObj].concat(Array.prototype.slice.call(arguments)));
        }
    };
    var dataStoreCache = {};
    var persistence = {
        save: function (className, obj, async) {
            var responder = extractResponder(arguments), isAsync = false;

            if (Utils.isString(className)) {
                var url = Backendless.appPath + '/data/' + className;
                var result = Backendless._ajax({
                    method: 'POST',
                    url: url,
                    data: JSON.stringify(obj),
                    isAsync: isAsync,
                    asyncHandler: responder
                });
                return result;
            }
            if (Utils.isObject(className)) {
                return new DataStore(className).save(className, obj, async);
            }
        },
        of: function (model) {
            var className = getClassName.call(model);
            var store = dataStoreCache[className];
            if (!store) {
                store = new DataStore(model);
                dataStoreCache[className] = store;
            }
            return store;
        },
        describe: function (className, async) {
            className = Utils.isString(className) ? className : getClassName.call(className);
            var responder = extractResponder(arguments), isAsync = (responder != null);

            var result = Backendless._ajax({
                method: 'GET',
                url: Backendless.appPath + '/data/' + className + '/properties',
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        }
    };

    function User() {
    }

    User.prototype = {
        ___class: "Users"
    };
    Backendless.User = User;

    var currentUser = null;
    var UserService = function () {
        this.restUrl = Backendless.appPath + '/users';
    };
    UserService.prototype = {
        _wrapAsync: function (async) {
            var me = this, success = function (data) {
                try {
                    data = JSON.parse(data)
                }
                catch (e) {
                }
                currentUser = me._parseResponse(data);
                async.success(me._getUserFromResponse(currentUser));
            }, error = function (data) {
                async.fault(data);
            };
            return new Async(success, error);
        },
        _parseResponse: function (data) {
            var user = new Backendless.User;
            deepExtend(user, data);
            return user;
        },

        register: function (user, async) {
            if (!(user instanceof Backendless.User)) {
                throw new Error('Only Backendless.User accepted');
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            if (responder) {
                responder = this._wrapAsync(responder);
            }

            var result = Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/register',
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(user)
            });
            return isAsync ? result : this._parseResponse(result);
        },

        getUserRoles: function (async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            if (responder) {
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/userroles',
                isAsync: isAsync,
                asyncHandler: responder
            });
            return isAsync ? result : this._parseResponse(result);
        },

        roleHelper: function (username, rolename, async, operation) {
            if (!username) {
                throw new Error('Username can not be empty');
            }
            if (!rolename) {
                throw new Error('Rolename can not be empty');
            }

            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            if (responder) {
                responder = this._wrapAsync(responder);
            }

            var data = {
                user: username,
                roleName: rolename
            };

            return Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/' + operation,
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(data)
            });
        },

        assignRole: function (username, rolename, async) {
            return this.roleHelper(username, rolename, async, 'assignRole');
        },

        unassignRole: function (username, rolename, async) {
            return this.roleHelper(username, rolename, async, 'unassignRole');
        },

        login: function (username, password, stayLoggedIn, async) {
            if (!username) {
                throw new Error('Username can not be empty');
            }
            if (!password) {
                throw new Error('Password can not be empty');
            }

            Backendless.LocalCache.set("stayLoggedIn", false);
            if (Utils.isBoolean(stayLoggedIn)) {
                Backendless.LocalCache.set("stayLoggedIn", stayLoggedIn);
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            if (responder) {
                responder = this._wrapAsync(responder);
            }

            var data = {
                login: username,
                password: password
            };
            var result = Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/login',
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(data)
            });
            if (isAsync) {
                return result;
            }
            else {
                currentUser = this._parseResponse(result);
                return this._getUserFromResponse(currentUser);
            }
        },
        _getUserFromResponse: function (user) {
            var newUser = new Backendless.User();
            for (var i in user) {
                if (user.hasOwnProperty(i)) {
                    if (i == 'user-token') {
                        if (Backendless.LocalCache.get("stayLoggedIn")) {
                            Backendless.LocalCache.set("user-token", user[i]);
                        }
                        continue;
                    }
                    newUser[i] = user[i];
                }
            }
            return newUser
        },
        describeUserClass: function (async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            return Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/userclassprops',
                isAsync: isAsync,
                asyncHandler: responder
            });
        },

        restorePassword: function (emailAddress, async) {
            if (!emailAddress) {
                throw 'Username can not be empty';
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            return Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/restorepassword/' + encodeURIComponent(emailAddress),
                isAsync: isAsync,
                asyncHandler: responder
            });
        },

        logout: function (async) {
            var responder = extractResponder(arguments),
                isAsync = responder != null,
                errorCallback = isAsync ? responder.fault : null,
                successCallback = isAsync ? responder.success : null,
                logoutUser = function () {
                    Backendless.LocalCache.remove("user-token");
                    currentUser = null;
                },
                onLogoutSuccess = function () {
                    logoutUser();
                    if (Utils.isFunction(successCallback)) {
                        successCallback();
                    }
                },
                onLogoutError = function (e) {
                    if (Utils.isObject(e) && [3064, 3091, 3090, 3023].indexOf(e.code) != -1) {
                        logoutUser();
                        if (Utils.isFunction(successCallback)) {
                            successCallback();
                        }
                    } else if (Utils.isFunction(errorCallback)) {
                        errorCallback(e);
                    }
                };
            if (responder) {
                responder.fault = onLogoutError;
                responder.success = onLogoutSuccess;
            }
            try {
                var result = Backendless._ajax({
                    method: 'GET',
                    url: this.restUrl + '/logout',
                    isAsync: isAsync,
                    asyncHandler: responder
                });
            } catch (e) {
                onLogoutError(e);
            }
            if (isAsync) {
                return result;
            }
            else {
                logoutUser();
            }
        },
        getCurrentUser: function () {
            return currentUser ? this._getUserFromResponse(currentUser) : null;
        },
        update: function (user, async) {
            if (!(user instanceof Backendless.User)) {
                throw new Error('Only Backendless.User accepted');
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            if (responder) {
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: 'PUT',
                url: this.restUrl + '/' + user.objectId,
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(user)
            });
            return isAsync ? result : this._parseResponse(result);
        },
        loginWithFacebook: function (facebookFieldsMapping, permissions, callback, container) {
            this._loginSocial('Facebook', facebookFieldsMapping, permissions, callback, container);
        },
        loginWithTwitter: function (twitterFieldsMapping, callback) {
            this._loginSocial('Twitter', twitterFieldsMapping, null, callback, null);
        },
        _socialContainer: function (socialType, container) {
            var loadingMsg;

            if (container) {
                var client;

                container = container[0];
                loadingMsg = document.createElement('div');
                loadingMsg.innerHTML = "Loading...";
                container.appendChild(loadingMsg);
                container.style.cursor = 'wait';

                this.closeContainer = function () {
                    container.style.cursor = 'default';
                    container.removeChild(client);
                }

                this.removeLoading = function () {
                    container.removeChild(loadingMsg);
                }

                this.doAuthorizationActivity = function (url) {
                    this.removeLoading();
                    client = document.createElement('iframe');
                    client.frameBorder = 0;
                    client.width = container.style.width;
                    client.height = container.style.height;
                    client.id = "SocialAuthFrame";
                    client.setAttribute("src", url + "&amp;output=embed");
                    container.appendChild(client);
                    client.onload = function () {
                        container.style.cursor = 'default';
                    }
                }
            }
            else {
                container = window.open('', socialType + ' authorization', 'height=250,width=450,scrollbars=0,toolbar=0,menubar=0,location=0,resizable=0,status=0,titlebar=0', false);
                loadingMsg = container.document.getElementsByTagName('body')[0].innerHTML;
                loadingMsg = "Loading...";
                container.document.getElementsByTagName('html')[0].style.cursor = 'wait';

                this.closeContainer = function () {
                    container.close();
                }

                this.removeLoading = function () {
                    loadingMsg = null;
                }

                this.doAuthorizationActivity = function (url) {
                    container.location.href = url;
                    container.onload = function () {
                        container.document.getElementsByTagName("html")[0].style.cursor = 'default';
                    }
                }
            }
        },
        _loginSocial: function (socialType, fieldsMapping, permissions, callback, container) {

            var socialContainer = new this._socialContainer(socialType, container);

            var responder = extractResponder(arguments);
            if (responder) {
                responder = this._wrapAsync(responder);
            }

            Utils.addEvent('message', window, function (e) {
                if (e.origin == Backendless.serverURL) {
                    var result = JSON.parse(e.data);

                    if (result.fault)
                        responder.fault(result.fault);
                    else {
                        currentUser = this.Backendless.UserService._parseResponse(result);
                        responder.success(this.Backendless.UserService._getUserFromResponse(currentUser));
                    }

                    Utils.removeEvent('message', window);
                    socialContainer.closeContainer();
                }
            });

            var interimCallback = new Backendless.Async(function (r) {
                socialContainer.doAuthorizationActivity(r);
            }, function (e) {
                socialContainer.closeContainer();
                responder.fault(e);
            });

            var request = fieldsMapping || permissions ? {} : null;
            if (fieldsMapping)
                request.fieldsMapping = fieldsMapping;
            if (permissions)
                request.permissions = permissions;

            Backendless._ajax({
                method: 'POST',
                url: this.restUrl + "/social/oauth/" + socialType.toLowerCase() + "/request_url",
                isAsync: true,
                asyncHandler: interimCallback,
                data: JSON.stringify(request)
            });
        },
        loginWithFacebookSdk: function (fieldsMapping, async) {
            if (!FB)
                throw new Error("Facebook SDK not found");

            var me = this;
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected')
                    me._sendFacebookLoginRequest(me, response, fieldsMapping, async);
                else
                    FB.login(function (response) {
                        me._sendFacebookLoginRequest(me, response, fieldsMapping, async);
                    });
            });
        },
        _sendFacebookLoginRequest: function (context, response, fieldsMapping, async) {
            if (response.status === 'connected') {
                var requestData = response.authResponse;

                if (fieldsMapping)
                    requestData["fieldsMapping"] = fieldsMapping;

                var interimCallback = new Backendless.Async(function (r) {
                    currentUser = context._parseResponse(r);
                    async.success(context._getUserFromResponse(currentUser));
                }, function (e) {
                    async.fault(e);
                });

                Backendless._ajax({
                    method: 'POST',
                    url: context.restUrl + "/social/facebook/login/" + Backendless.applicationId,
                    isAsync: true,
                    asyncHandler: interimCallback,
                    data: JSON.stringify(requestData)
                });
            }
        },
        isValidLogin: function () {
            var userToken = "",
                cache = Backendless.LocalCache,
                validUser = "";
            if (cache.get("user-token")) {
                userToken = cache.get("user-token");
                try {
                    return Backendless._ajax({
                        method: 'GET',
                        url: Backendless.serverURL + '/' + Backendless.appVersion + '/users/isvalidusertoken/' + userToken
                    });
                } catch(e){
                    return false;
                }
            } else {
                validUser = Backendless.UserService.getCurrentUser();
                return (validUser != null) ? true : false;
            }
        }
    };

    function Geo() {
        this.restUrl = Backendless.appPath + '/geo';
    }

    function GeoQuery() {
        this.searchRectangle = null;
        this.categories = [];
        this.includeMeta = false;

        this.pageSize = 10;
        this.latitude = 0;
        this.longitude = 0;
        this.radius = 0;
        this.units = null;
    }

    GeoQuery.prototype = {
        addCategory: function () {
            this.categories = this.categories || [];
            this.categories.push();
        }
    };
    Backendless.GeoQuery = GeoQuery;

    Geo.prototype = {
        UNITS: {
            METERS: 'METERS',
            KILOMETERS: 'KILOMETERS',
            MILES: 'MILES',
            YARDS: 'YARDS',
            FEET: 'FEET'
        },
        _wrapAsync: function (async) {
            var me = this, success = function (data) {
                data = me._parseResponse(data);
                async.success(data);
            }, error = function (data) {
                async.fault(data);
            };
            return new Async(success, error);
        },
        _parseResponse: function (data) {
            var collection = data.collection;
            extendCollection(collection, this);
            return collection;
        },
        _load: function (url, async) {
            var responder = extractResponder(arguments),
                isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'GET',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder
            });

            return isAsync ? result : this._parseResponse(result);
        },
        _findHelpers: {
            'searchRectangle': function (arg) {
                var rect = [
                    'nwlat=' + arg[0], 'nwlon=' + arg[1], 'selat=' + arg[2], 'selon=' + arg[3]
                ];
                return rect.join('&');
            },
            'latitude': function (arg) {
                return 'lat=' + arg;
            },
            'longitude': function (arg) {
                return 'lon=' + arg;
            },
            'metadata': function (arg) {
                return 'metadata=' + JSON.stringify(arg);
            },
            'radius': function (arg) {
                return 'r=' + arg;
            },
            'categories': function (arg) {
                arg = Utils.isString(arg) ? [arg] : arg;
                return 'categories=' + encodeArrayToUriComponent(arg);
            },
            'includeMetadata': function (arg) {
                return 'includemetadata=' + arg;
            },
            'pageSize': function (arg) {
                if (arg < 1 || arg > 100) {
                    throw new Error('PageSize can not be less then 1 or greater than 100');
                } else {
                    return 'pagesize=' + arg;
                }
            },
            'offset': function (arg) {
                if (arg < 0) {
                    throw new Error('Offset can not be less then 0');
                } else {
                    return 'offset=' + arg;
                }
            },
            'relativeFindPercentThreshold': function (arg) {
                if (arg <= 0) {
                    throw new Error('Threshold can not be less then or equal 0');
                } else {
                    return 'relativeFindPercentThreshold=' + arg;
                }
            },
            'relativeFindMetadata': function (arg) {
                return 'relativeFindMetadata=' + encodeURIComponent(JSON.stringify(arg));
            },
            'condition': function (arg) {
                return 'whereClause=' + encodeURIComponent(arg);
            }
        },

        addPoint: function (geopoint, async) {
            if (geopoint.latitude === undefined || geopoint.longitude === undefined) {
                throw 'Latitude or longitude not a number';
            }
            geopoint.categories = geopoint.categories || ['Default'];
            geopoint.categories = Utils.isArray(geopoint.categories) ? geopoint.categories : [geopoint.categories];

            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var data = 'lat=' + geopoint.latitude;
            data += '&lon=' + geopoint.longitude;
            if (geopoint.categories) {
                data += '&categories=' + encodeArrayToUriComponent(geopoint.categories);
            }

            if (geopoint.metadata) {
                data += '&metadata=' + JSON.stringify(geopoint.metadata);
            }
            var result = Backendless._ajax({
                method: 'PUT',
                url: this.restUrl + '/points?' + data,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        },

        findUtil: function (query, async) {
            var url = query["url"],
                responder = extractResponder(arguments),
                isAsync = false,
                searchByCat = true;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            if (query.searchRectangle && query.radius) {
                throw new Error("Inconsistent geo query. Query should not contain both rectangle and radius search parameters.");
            }
            else if (query.radius && (query.latitude === undefined || query.longitude === undefined)) {
                throw new Error("Latitude and longitude should be provided to search in radius");
            }
            else if ((query.relativeFindMetadata || query.relativeFindPercentThreshold) && !(query.relativeFindMetadata && query.relativeFindPercentThreshold)) {
                throw new Error("Inconsistent geo query. Query should contain both relativeFindPercentThreshold and relativeFindMetadata or none of them");
            }
            else {
                url += query.searchRectangle ? '/rect?' : '/points?';
                url += query.units ? 'units=' + query.units : '';
                for (var prop in query) {
                    if (query.hasOwnProperty(prop) && this._findHelpers.hasOwnProperty(prop) && query[prop] != undefined) {
                        url += '&' + this._findHelpers[prop](query[prop]);
                    }
                }
            }
            url = url.replace(/\?&/g, '?');
            var result = Backendless._ajax({
                method: 'GET',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return isAsync ? result : this._parseResponse(result);
        },

        find: function (query, async) {
            query["url"] = this.restUrl;
            return this.findUtil(query, async);
        },

        relativeFind: function (query, async) {
            if (!(query.relativeFindMetadata && query.relativeFindPercentThreshold)) {
                throw new Error("Inconsistent geo query. Query should contain both relativeFindPercentThreshold and relativeFindMetadata");
            } else {
                query["url"] = this.restUrl + "/relative";
                return this.findUtil(query, async);
            }
        },

        addCategory: function (name, async) {
            if (!name) {
                throw new Error('Category name is required.');
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'PUT',
                url: this.restUrl + '/categories/' + name,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return (typeof result.result === 'undefined') ? result : result.result;
        },
        getCategories: function (async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/categories',
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        },
        deleteCategory: function (name, async) {
            if (!name) {
                throw new Error('Category name is required.');
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            try {
                var result = Backendless._ajax({
                    method: 'DELETE',
                    url: this.restUrl + '/categories/' + name,
                    isAsync: isAsync,
                    asyncHandler: responder
                });
            } catch (e) {
                if (e.statusCode == 404) {
                    result = false;
                } else {
                    throw e
                }
            }
            return (typeof result.result === 'undefined') ? result : result.result;
        },
        deletePoint: function (point, async) {
            if (!point || Utils.isFunction(point)) {
                throw new Error('Point argument name is required, must be string (object Id), or point object');
            }
            var pointId = Utils.isString(point) ? point : point.objectId,
                responder = extractResponder(arguments),
                isAsync = responder != null;
            try {
                var result = Backendless._ajax({
                    method: 'DELETE',
                    url: this.restUrl + '/points/' + pointId,
                    isAsync: isAsync,
                    asyncHandler: responder
                });
            } catch (e) {
                if (e.statusCode == 404) {
                    result = false;
                } else {
                    throw e
                }
            }
            return (typeof result.result === 'undefined') ? result : result.result;
        }
    };

    function Proxy() {
    }

    Proxy.prototype = {
        on: function (eventName, handler) {
            if (!eventName) {
                throw new Error('Event name not specified');
            }
            if (!handler) {
                throw new Error('Handler not specified');
            }
            this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
            this.eventHandlers[eventName].push(handler);
        },
        fireEvent: function (eventName, data) {
            var handlers = this.eventHandlers[eventName] || [], len, i;
            for (i = 0, len = handlers.length; i < len; ++i) {
                handlers[i](data);
            }
        }
    };

    function PollingProxy(url) {
        this.eventHandlers = {};
        this.restUrl = url;
        this.timer = 0;
        this.timeout = 0;
        this.interval = 1000;
        this.xhr = null;
        this.needReconnect = true;
        this.responder = new Async(this.onMessage, this.onError, this);
        this.poll();
    }

    PollingProxy.prototype = new Proxy();

    deepExtend(PollingProxy.prototype, {
        onMessage: function (data) {
            clearTimeout(this.timeout);
            var self = this;
            this.timer = setTimeout(function () {
                self.poll();
            }, this.interval);
            this.fireEvent('messageReceived', data);
        },
        poll: function () {
            var self = this;
            this.timeout = setTimeout(function () {
                self.onTimeout();
            }, 30 * 1000);
            this.xhr = Backendless._ajax({
                method: 'GET',
                url: this.restUrl,
                isAsync: true,
                asyncHandler: this.responder
            });
        },
        close: function () {
            clearTimeout(this.timer);
            clearTimeout(this.timeout);
            this.needReconnect = false;
            this.xhr && this.xhr.abort();
        },
        onTimeout: function () {
            this.xhr && this.xhr.abort();
        },
        onError: function () {
            clearTimeout(this.timer);
            clearTimeout(this.timeout);
            if (this.needReconnect) {
                var self = this;
                this.xhr = null;
                this.timer = setTimeout(function () {
                    self.poll();
                }, this.interval);
            }
        }
    });

    function SocketProxy(url) {
        var self = this;
        this.reconnectWithPolling = true;
        try {
            var socket = this.socket = new WebSocket(url);
            socket.onopen = function () {
                return self.sockOpen();
            };
            socket.onerror = function (error) {
                return self.sockError(error);
            };
            socket.onclose = function (evt) {
                self.onSocketClose();
            };

            socket.onmessage = function (event) {
                return self.onMessage(event);
            };
        }
        catch (e) {
            setTimeout(function () {
                self.onSocketClose();
            }, 100);
        }
    }

    SocketProxy.prototype = new Proxy();
    deepExtend(SocketProxy.prototype, {
        onMessage: function () {
            this.fireEvent('messageReceived', data);
        },
        onSocketClose: function (data) {
            if (this.reconnectWithPolling) {
                this.fireEvent('socketClose', data);
            }
        },
        close: function () {
            this.reconnectWithPolling = false;
            this.socket.close();
        }
    });
    function Subscription(config) {
        this.channelName = config.channelName;
        this.options = config.options;
        this.channelProperties = config.channelProperties;
        this.subscriptionId = null;
        this.restUrl = config.restUrl + '/' + config.channelName;
        this.responder = config.responder || emptyFn;
        this._subscribe(config.onSubscribe);
    }

    Subscription.prototype = {
        _subscribe: function (async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var self = this;
            var _async = new Async(function (data) {
                self.subscriptionId = data.subscriptionId;
                self._startSubscription();
                //responder.success(self);
            }, function (e) {
                responder.fault(e);
            });
            var subscription = Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/subscribe',
                isAsync: isAsync,
                data: JSON.stringify(this.options),
                asyncHandler: _async
            });

            if (!isAsync) {
                this.subscriptionId = subscription.subscriptionId;
                this._startSubscription();
            }
        },
        _startSubscription: function () {
            var self = this;
            if (WebSocket) {
                var url = this.channelProperties['websocket'] + '/' + this.subscriptionId;
                this.proxy = new SocketProxy(url);
                this.proxy.on('socketClose', function () {
                    self._switchToPolling();
                });
                this.proxy.on('messageReceived', function () {
                    self.responder();
                });
            }
            else {
                this._switchToPolling();
            }

            this._startSubscription = emptyFn;
        },
        cancelSubscription: function () {
            this.proxy && this.proxy.close();
            this._startSubscription = emptyFn;
        },
        _switchToPolling: function () {
            var url = /*(this.channelProperties['polling'] || */this.restUrl + '/' + this.subscriptionId;
            this.proxy = new PollingProxy(url);
            var self = this;
            this.proxy.on('messageReceived', function (data) {
                if (data.messages.length)
                    self.responder(data);
            });
        }
    };

    function Messaging() {
        this.restUrl = Backendless.appPath + '/messaging';
        this.channelProperties = {};
    }

    Messaging.prototype = {
        _getProperties: function (channelName, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var props = this.channelProperties[channelName];
            if (props) {
                if (isAsync) {
                    async.success(props);
                }
                return props;
            }
            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/' + channelName + '/properties',
                isAsync: isAsync,
                asyncHandler: responder
            });
            this.channelProperties[channelName] = result;
            return result;
        },
        subscribe: function (channelName, subscriptionCallback, subscriptionOptions, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            if (isAsync) {
                var that = this;
                var callback = new Async(function (props) {
                    async.success(new Subscription({
                        channelName: channelName,
                        options: subscriptionOptions,
                        channelProperties: props,
                        responder: subscriptionCallback,
                        restUrl: that.restUrl,
                        onSubscribe: responder
                    }));
                }, function (data) {
                    responder.fault(data);
                });
                this._getProperties(channelName, callback);
            }
            else {
                var props = this._getProperties(channelName);
                return new Subscription({
                    channelName: channelName,
                    options: subscriptionOptions,
                    channelProperties: props,
                    responder: subscriptionCallback,
                    restUrl: this.restUrl
                });
            }
        },
        publish: function (channelName, message, publishOptions, deliveryTarget, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var data = {
                message: message
            };
            if (publishOptions) {
                if (!(publishOptions instanceof PublishOptions))
                    throw "Use PublishOption as publishOptions argument";
                deepExtend(data, publishOptions);
            }
            if (deliveryTarget) {
                if (!(deliveryTarget instanceof DeliveryOptions))
                    throw "Use DeliveryOptions as deliveryTarget argument";
                deepExtend(data, deliveryTarget);
            }

            var result = Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/' + channelName,
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(data)
            });
            return result;
        },
        sendEmail: function (subject, bodyParts, recipients, attachments, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var data = {};
            if (subject && !Utils.isEmpty(subject) && Utils.isString(subject)) {
                data.subject = subject;
            } else {
                throw "Subject is required parameter and must be a nonempty string";
            }
            if ((bodyParts instanceof Bodyparts) && !Utils.isEmpty(bodyParts)) {
                data.bodyparts = bodyParts;
            } else {
                throw "Use Bodyparts as bodyParts argument, must contain at least one property";
            }
            if (recipients && Utils.isArray(recipients) && !Utils.isEmpty(recipients)) {
                data.to = recipients;
            } else {
                throw "Recipients is required parameter, must be a nonempty array";
            }
            if (attachments) {
                if (Utils.isArray(attachments)) {
                    if (!Utils.isEmpty(attachments)) {
                        data.attachment = attachments;
                    }
                } else {
                    throw "Attachments must be an array of file IDs from File Service";
                }
            }

            return Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/email',
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(data)
            });
        },
        cancel: function (messageId, async) {
            var isAsync = async != null;
            var result = Backendless._ajax({
                method: 'DELETE',
                url: this.restUrl + '/' + messageId,
                isAsync: isAsync,
                asyncHandler: new Async(emptyFn)
            });
            return result;
        },
        registerDevice: function (channels, expiration, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var device = isBrowser() ? window.device : NodeDevice;
            var data = {
                deviceToken: null, //This value will set in callback
                deviceId: device.uuid,
                os: device.platform,
                osVersion: device.version
            };
            if (Utils.isArray(channels)) {
                data.channels = channels;
            }
            for (var i = 0, len = arguments.length; i < len; ++i) {
                var val = arguments[i];
                if (Utils.isNumber(val) || val instanceof Date) {
                    data.expiration = (val instanceof Date) ? val.getTime() / 1000 : val;
                }
            }
            var url = this.restUrl + '/registrations';
            var success = function (deviceToken) {
                data.deviceToken = deviceToken;
                Backendless._ajax({
                    method: 'POST',
                    url: url,
                    data: JSON.stringify(data),
                    isAsync: isAsync,
                    asyncHandler: responder
                });
            };
            var fail = function (status) {
                console.warn(JSON.stringify(['failed to register ', status]));
            };
            var config = { projectid: "http://backendless.com", appid: Backendless.applicationId };
            cordova.exec(success, fail, "PushNotification", "registerDevice", [config]);
        },
        getRegistrations: function (async) {
            var deviceId = isBrowser() ? window.device.uuid : NodeDevice.uuid;
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/registrations/' + deviceId,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        },
        unregisterDevice: function (async) {
            var deviceId = isBrowser() ? window.device.uuid : NodeDevice.uuid;
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'DELETE',
                url: this.restUrl + '/registrations/' + deviceId,
                isAsync: isAsync,
                asyncHandler: responder
            });
            try {
                cordova.exec(emptyFn, emptyFn, "PushNotification", "unregisterDevice", []);
            }
            catch (e) {
                console.log(e.message);
            }
            return result;
        }
    };
    function getBuilder(filename, filedata, boundary) {
        var dashdash = '--',
            crlf = '\r\n',
            builder = '';

        builder += dashdash;
        builder += boundary;
        builder += crlf;
        builder += 'Content-Disposition: form-data; name="file"';
        builder += '; filename="' + filename + '"';
        builder += crlf;

        builder += 'Content-Type: application/octet-stream';
        builder += crlf;
        builder += crlf;

        builder += filedata;
        builder += crlf;

        builder += dashdash;
        builder += boundary;
        builder += dashdash;
        builder += crlf;
        return builder;
    }

    function send(e) {
        var xhr = new XMLHttpRequest(),
            boundary = '-backendless-multipart-form-boundary-' + getNow(),
            builder = getBuilder(this.fileName, e.target.result, boundary),
            badResponse = function (xhr) {
                var result = {};
                try {
                    result = JSON.parse(xhr.responseText);
                } catch (e) {
                    result.message = xhr.responseText;
                }
                result.statusCode = xhr.status;
                return result;
            };

        xhr.open("POST", this.uploadPath, true);
        xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);
        xhr.setRequestHeader('application-id', Backendless.applicationId);
        xhr.setRequestHeader("secret-key", Backendless.secretKey);
        xhr.setRequestHeader("application-type", "JS");
        if (UIState !== null) {
            xhr.setRequestHeader("uiState", UIState);
        }
        var asyncHandler = this.asyncHandler;
        if (asyncHandler)
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        asyncHandler.success(JSON.parse(xhr.responseText));
                    } else {
                        asyncHandler.fault(JSON.parse(xhr.responseText));
                    }
                }
            };
        xhr.sendAsBinary(builder);

        if (asyncHandler) {
            return xhr;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
            return xhr.responseText ? JSON.parse(xhr.responseText) : true;
        } else {
            throw badResponse(xhr);
        }
    }

    function sendEncoded(e){
        var xhr = new XMLHttpRequest(),
            boundary = '-backendless-multipart-form-boundary-' + getNow(),
            builder = getBuilder(this.fileName, e.target.result, boundary),
            badResponse = function (xhr) {
                var result = {};
                try {
                    result = JSON.parse(xhr.responseText);
                } catch (e) {
                    result.message = xhr.responseText;
                }
                result.statusCode = xhr.status;
                return result;
            };

        xhr.open("PUT", this.uploadPath, true);
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.setRequestHeader('application-id', Backendless.applicationId);
        xhr.setRequestHeader("secret-key", Backendless.secretKey);
        xhr.setRequestHeader("application-type", "JS");
        if (UIState !== null) {
            xhr.setRequestHeader("uiState", UIState);
        }
        var asyncHandler = this.asyncHandler;
        if (asyncHandler)
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        asyncHandler.success(JSON.parse(xhr.responseText));
                    } else {
                        asyncHandler.fault(JSON.parse(xhr.responseText));
                    }
                }
            };
        xhr.send(e.target.result.split(',')[1]);

        if (asyncHandler) {
            return xhr;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
            return xhr.responseText ? JSON.parse(xhr.responseText) : true;
        } else {
            throw badResponse(xhr);
        }
    }

    function Files() {
        this.restUrl = Backendless.appPath + '/files';
    }

    Files.prototype = {
        saveFile: function(path, fileName, fileContent, overwrite, async){
            if (!path || !Utils.isString(path))
                throw new Error('Missing value for the "path" argument. The argument must contain a string value');
            if (!fileName || !Utils.isString(path))
                throw new Error('Missing value for the "fileName" argument. The argument must contain a string value');
            if (overwrite instanceof Backendless.Async) {
                async = overwrite;
                overwrite = null;
            }
            if(!(fileContent instanceof File)) {
                fileContent = new Blob([fileContent]);
            }
            if(fileContent.size > 2800000){
                throw new Error('File Content size must be less than 2,800,000 bytes');
            }
            var baseUrl = this.restUrl + '/binary/' + path + ((Utils.isString(fileName)) ? '/' + fileName : '') + ((overwrite) ? '?overwrite=true' : '');
            try {
                var reader = new FileReader();
                reader.fileName = fileName;
                reader.uploadPath = baseUrl;
                reader.onloadend = sendEncoded;
                if(async) {
                    reader.asyncHandler = async;
                }
                reader.onerror = function (evn) {
                    async.fault(evn);
                };
                reader.readAsDataURL(fileContent);
                if(!async) {
                    return true;
                }

            } catch (err) {
                console.log(err);
            }
        },
        upload: function (files, path, async) {
            files = files.files || files;
            var baseUrl = this.restUrl + '/' + path + '/';
            if (isBrowser()) {
                if (window.File && window.FileList) {
                    if (files instanceof File) {
                        files = [files];
                    }
                    var filesError = 0, filesDone = 0;
                    for (var i = 0, len = files.length; i < len; i++) {
                        try {
                            var reader = new FileReader();
                            reader.fileName = files[i].name;
                            reader.uploadPath = baseUrl + reader.fileName;
                            reader.onloadend = send;
                            reader.asyncHandler = async;
                            reader.onerror = function (evn) {
                                async.fault(evn);
                            };
                            reader.readAsBinaryString(files[i]);

                        }
                        catch (err) {
                            filesError++;
                        }
                    }
                }
                else {
                    //IE iframe hack
                    var ifrm = document.createElement('iframe');
                    ifrm.id = ifrm.name = 'ifr' + getNow();
                    ifrm.width = ifrm.height = '0';

                    document.body.appendChild(ifrm);
                    var form = document.createElement('form');
                    form.target = ifrm.name;
                    form.enctype = 'multipart/form-data';
                    form.method = 'POST';
                    document.body.appendChild(form);
                    form.appendChild(files);
                    var fileName = files.value, index = fileName.lastIndexOf('\\');

                    if (index) {
                        fileName = fileName.substring(index + 1);
                    }
                    form.action = baseUrl + fileName;
                    form.submit();
                }
            }
            else {
                throw "Upload File not supported with NodeJS";
            }
        },
        remove: function (fileURL, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var url = fileURL.indexOf("http://") == 0 || fileURL.indexOf("https://") == 0 ? fileURL : this.restUrl + '/' + fileURL;
            Backendless._ajax({
                method: 'DELETE',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder
            });
        },

        removeDirectory: function (path, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            Backendless._ajax({
                method: 'DELETE',
                url: this.restUrl + '/' + path,
                isAsync: isAsync,
                asyncHandler: responder
            });
        }
    };

    function Commerce() {
        this.restUrl = Backendless.appPath + '/commerce/googleplay';
    }

    Commerce.prototype._wrapAsync = function (async) {
        var success = function (data) {
            async.success(data);
        }, error = function (data) {
            async.fault(data);
        };
        return new Async(success, error);
    };

    Commerce.prototype.validatePlayPurchase = function (packageName, productId, token, async) {
        if (arguments.length < 3) {
            throw new Error('Package Name, Product Id, Token must be provided and must be not an empty STRING!');
        }
        for (var i = arguments.length - 2; i >= 0; i--) {
            if (!arguments[i] || !Utils.isString(arguments[i])) {
                throw new Error('Package Name, Product Id, Token must be provided and must be not an empty STRING!');
            }
        }
        var responder = extractResponder(arguments),
            isAsync = responder != null;
        if (responder) {
            responder = this._wrapAsync(responder);
        }
        return Backendless._ajax({
            method: 'GET',
            url: this.restUrl + '/validate/' + packageName + '/inapp/' + productId + '/purchases/' + token,
            isAsync: isAsync,
            asyncHandler: responder
        });
    };

    Commerce.prototype.cancelPlaySubscription = function (packageName, subscriptionId, token, Async) {
        if (arguments.length < 3) {
            throw new Error('Package Name, Subscription Id, Token must be provided and must be not an empty STRING!');
        }
        for (var i = arguments.length - 2; i >= 0; i--) {
            if (!arguments[i] || !Utils.isString(arguments[i])) {
                throw new Error('Package Name, Subscription Id, Token must be provided and must be not an empty STRING!');
            }
        }
        var responder = extractResponder(arguments),
            isAsync = responder != null;
        if (responder) {
            responder = this._wrapAsync(responder);
        }
        return Backendless._ajax({
            method: 'POST',
            url: this.restUrl + '/' + packageName + '/subscription/' + subscriptionId + '/purchases/' + token + '/cancel',
            isAsync: isAsync,
            asyncHandler: responder
        });
    };

    Commerce.prototype.getPlaySubscriptionStatus = function (packageName, subscriptionId, token, Async) {
        if (arguments.length < 3) {
            throw new Error('Package Name, Subscription Id, Token must be provided and must be not an empty STRING!');
        }
        for (var i = arguments.length - 2; i >= 0; i--) {
            if (!arguments[i] || !Utils.isString(arguments[i])) {
                throw new Error('Package Name, Subscription Id, Token must be provided and must be not an empty STRING!');
            }
        }
        var responder = extractResponder(arguments),
            isAsync = responder != null;
        if (responder) {
            responder = this._wrapAsync(responder);
        }
        return Backendless._ajax({
            method: 'GET',
            url: this.restUrl + '/' + packageName + '/subscription/' + subscriptionId + '/purchases/' + token,
            isAsync: isAsync,
            asyncHandler: responder
        });
    };

    function Events() {
        this.restUrl = Backendless.appPath + '/servercode/events';
    }

    Events.prototype._wrapAsync = function (async) {
        var success = function (data) {
            async.success(data);
        }, error = function (data) {
            async.fault(data);
        };
        return new Async(success, error);
    };

    Events.prototype.dispatch = function (eventname, eventArgs, Async) {
        if (!eventname || !Utils.isString(eventname)) {
            throw new Error('Event Name must be provided and must be not an empty STRING!');
        }
        eventArgs = Utils.isObject(eventArgs) ? eventArgs : {};
        var responder = extractResponder(arguments),
            isAsync = responder != null;
        if (responder) {
            responder = this._wrapAsync(responder);
        }
        eventArgs = eventArgs instanceof Backendless.Async ? {} : eventArgs;
        return Backendless._ajax({
            method: 'POST',
            url: this.restUrl + '/' + eventname,
            data: JSON.stringify(eventArgs),
            isAsync: isAsync,
            asyncHandler: responder
        });
    };

    var Cache = function () {
    };

    var FactoryMethods = [];

    Cache.prototype = {
        _wrapAsync: function (async) {
            var me = this, success = function (data) {
                data = me._parseResponse(data);
                async.success(data);
            }, error = function (data) {
                async.fault(data);
            };
            return new Async(success, error);
        },
        _parseResponse: function (response) {
            return response;
        },
        put: function (key, value, timeToLive, async) {
            if (!Utils.isString(key))
                throw new Error('You can use only String as key to put into Cache');
            if (timeToLive) {
                if (typeof timeToLive == 'object' && !arguments[3]) {
                    async = timeToLive;
                    timeToLive = null;
                } else if (typeof timeToLive != ('number' || 'string')) {
                    throw new Error('You can use only String as timeToLive attribute to put into Cache');
                }
            }
            var responder = extractResponder([value, async]), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            if (Utils.isObject(value) && value.constructor !== Object) {
                value.___class = value.___class || getClassName.call(value);
            }
            var result = Backendless._ajax({
                method: 'PUT',
                url: Backendless.serverURL + '/' + Backendless.appVersion + '/cache/' + key + ((timeToLive) ? '?timeout=' + timeToLive : ''),
                data: JSON.stringify(value),
                isAsync: isAsync,
                asyncHandler: responder
            });

            return result;
        },
        expireIn: function (key, seconds, async) {
            if (Utils.isString(key) && (Utils.isNumber(seconds) || Utils.isDate(seconds)) && seconds) {
                seconds = (Utils.isDate(seconds)) ? seconds.getTime() : seconds;
                var responder = extractResponder(arguments), isAsync = false;
                if (responder != null) {
                    isAsync = true;
                    responder = this._wrapAsync(responder);
                }
                var result = Backendless._ajax({
                    method: 'PUT',
                    url: Backendless.serverURL + '/' + Backendless.appVersion + '/cache/' + key + '/expireIn?timeout=' + seconds,
                    data: JSON.stringify({}),
                    isAsync: isAsync,
                    asyncHandler: responder
                });

                return result;
            } else {
                throw new Error('The "key" argument must be String. The "seconds" argument can be either Number or Date');
            }
        },
        expireAt: function (key, timestamp, async) {
            if (Utils.isString(key) && (Utils.isNumber(timestamp) || Utils.isDate(timestamp)) && timestamp) {
                timestamp = (Utils.isDate(timestamp)) ? timestamp.getTime() : timestamp;
                var responder = extractResponder(arguments), isAsync = false;
                if (responder != null) {
                    isAsync = true;
                    responder = this._wrapAsync(responder);
                }
                var result = Backendless._ajax({
                    method: 'PUT',
                    url: Backendless.serverURL + '/' + Backendless.appVersion + '/cache/' + key + '/expireAt?timestamp=' + timestamp,
                    data: JSON.stringify({}),
                    isAsync: isAsync,
                    asyncHandler: responder
                });

                return result;
            } else {
                throw new Error('You can use only String as key while expire in Cache. Second attribute must be declared and must be a Number or Date type');
            }
        },
        cacheMethod: function (method, key, contain, async) {
            if (!Utils.isString(key))
                throw new Error('The "key" argument must be String');
            var responder = extractResponder(arguments), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: method,
                url: Backendless.serverURL + '/' + Backendless.appVersion + '/cache/' + key + (contain ? '/check' : ''),
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        },
        contains: function (key, async) {
            return this.cacheMethod('GET', key, true, async)
        },
        get: function (key, async) {
            if (!Utils.isString(key))
                throw new Error('The "key" argument must be String');
            var responder = extractResponder(arguments), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: 'GET',
                url: Backendless.serverURL + '/' + Backendless.appVersion + '/cache/' + key,
                isAsync: isAsync,
                asyncHandler: responder
            });
            if (Utils.isObject(result)) {
                if (result.___class) {
                    var object;
                    try {
                        var Object = eval(result.___class);
                        object = new Object(result);
                    } catch (e) {
                        object = new FactoryMethods[result.___class](result);
                    }
                    return object;
                } else {
                    return result;
                }
            } else {
                return result;
            }
        },
        remove: function (key, async) {
            return this.cacheMethod('DELETE', key, false, async);
        },
        setObjectFactory: function (objectName, factoryMethod) {
            FactoryMethods[objectName] = factoryMethod;
        }
    };

    var Counters = function () {
        },
        AtomicInstance = function (counterName) {
            this.name = counterName;
        };

    Counters.prototype = {
        _wrapAsync: function (async) {
            var me = this, success = function (data) {
                data = me._parseResponse(data);
                async.success(data);
            }, error = function (data) {
                async.fault(data);
            };
            return new Async(success, error);
        },
        _parseResponse: function (response) {
            return response;
        },
        of: function (counterName) {
            return new AtomicInstance(counterName);
        },
        getConstructor: function () {
            return this;
        },
        counterNameValidation: function (counterName, async) {
            if (!counterName)
                throw new Error('Missing value for the "counterName" argument. The argument must contain a string value.')
            if (!Utils.isString(counterName))
                throw new Error('Invalid value for the "value" argument. The argument must contain only string values')
            this.name = counterName;
        },
        implementMethod: function (method, urlPart, async) {
            var responder = extractResponder(arguments), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: method,
                url: Backendless.serverURL + '/' + Backendless.appVersion + '/counters/' + this.name + urlPart,
                isAsync: isAsync,
                asyncHandler: responder
            });

            return result;
        },
        incrementAndGet: function (counterName, async) {
            this.counterNameValidation(counterName, async);
            return this.implementMethod('PUT', '/increment/get', async);
        },
        getAndIncrement: function (counterName, async) {
            this.counterNameValidation(counterName, async);
            return this.implementMethod('PUT', '/get/increment', async);
        },
        decrementAndGet: function (counterName, async) {
            this.counterNameValidation(counterName, async);
            return this.implementMethod('PUT', '/decrement/get', async);
        },
        getAndDecrement: function (counterName, async) {
            this.counterNameValidation(counterName, async);
            return this.implementMethod('PUT', '/get/decrement', async);
        },
        reset: function (counterName, async) {
            this.counterNameValidation(counterName, async);
            return this.implementMethod('PUT', '/reset', async);
        },
        get: function (counterName, async) {
            this.counterNameValidation(counterName, async);
            var responder = extractResponder(arguments), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: 'GET',
                url: Backendless.serverURL + '/' + Backendless.appVersion + '/counters/' + this.name,
                isAsync: isAsync,
                asyncHandler: responder
            });

            return result;
        },
        implementMethodWithValue: function (urlPart, value, async) {
            if (!value)
                throw new Error('Missing value for the "value" argument. The argument must contain a numeric value.')
            if (!Utils.isNumber(value))
                throw new Error('Invalid value for the "value" argument. The argument must contain only numeric values')
            var responder = extractResponder(arguments), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: 'PUT',
                url: Backendless.serverURL + '/' + Backendless.appVersion + '/counters/' + this.name + urlPart + ((value) ? value : ''),
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        },
        addAndGet: function (counterName, value, async) {
            this.counterNameValidation(counterName, async);
            return this.implementMethodWithValue('/get/incrementby?value=', value, async);
        },
        getAndAdd: function (counterName, value, async) {
            this.counterNameValidation(counterName, async);
            return this.implementMethodWithValue('/incrementby/get?value=', value, async);
        },
        compareAndSet: function (counterName, expected, updated, async) {
            this.counterNameValidation(counterName, async);
            if (!expected || !updated)
                throw new Error('Missing values for the "expected" and/or "updated" arguments. The arguments must contain numeric values')
            if (!Utils.isNumber(expected) || !Utils.isNumber(updated))
                throw new Error('Missing value for the "expected" and/or "updated" arguments. The arguments must contain a numeric value')
            var responder = extractResponder(arguments), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: 'PUT',
                url: Backendless.serverURL + '/' + Backendless.appVersion + '/counters/' + this.name + '/get/compareandset?expected=' + ((expected && updated) ? expected + '&updatedvalue=' + updated : ''),
                isAsync: isAsync,
                asyncHandler: responder
            });

            return result;
        }
    };

    AtomicInstance.prototype = {
        incrementAndGet: function (async) {
            return Counters.prototype.getConstructor().incrementAndGet(this.name, async);
        },
        getAndIncrement: function (async) {
            return Counters.prototype.getConstructor().getAndIncrement(this.name, async);
        },
        decrementAndGet: function (async) {
            return Counters.prototype.getConstructor().decrementAndGet(this.name, async);
        },
        getAndDecrement: function (async) {
            return Counters.prototype.getConstructor().getAndDecrement(this.name, async);
        },
        reset: function (async) {
            return Counters.prototype.getConstructor().reset(this.name, async);
        },
        get: function (async) {
            return Counters.prototype.getConstructor().get(this.name, async);
        },
        addAndGet: function (value, async) {
            return Counters.prototype.getConstructor().addAndGet(this.name, value, async);
        },
        getAndAdd: function (value, async) {
            return Counters.prototype.getConstructor().getAndAdd(this.name, value, async);
        },
        compareAndSet: function (expected, updated, async) {
            return Counters.prototype.getConstructor().getAndAdd(this.name, expected, updated, async);
        }
    };


    Backendless.initApp = function (appId, secretKey, appVersion) {
        Backendless.applicationId = appId;
        Backendless.secretKey = secretKey;
        Backendless.appVersion = appVersion;
        Backendless.appPath = [Backendless.serverURL, Backendless.appVersion].join('/');
        Backendless.UserService = new UserService();
        Backendless.Geo = new Geo();
        Backendless.Persistence = persistence;
        Backendless.Messaging = new Messaging();
        Backendless.Files = new Files();
        Backendless.Commerce = new Commerce();
        Backendless.Events = new Events();
        Backendless.Cache = new Cache();
        Backendless.Counters = new Counters();
        dataStoreCache = {};
        currentUser = null;
    };

    if (!isBrowser()) {
        module.exports = Backendless;
    }

})();

var BackendlessGeoQuery = function () {
    this.searchRectangle = undefined;
    this.categories = [];
    this.includeMetadata = true;
    this.metadata = undefined;
    this.condition = undefined;
    this.relativeFindMetadata = undefined;
    this.relativeFindPercentThreshold = undefined;
    this.pageSize = undefined;
    this.latitude = undefined;
    this.longitude = undefined;
    this.radius = undefined;
    this.units = undefined;
};

BackendlessGeoQuery.prototype = {
    addCategory: function () {
        this.categories = this.categories || [];
        this.categories.push();
    }
};

var PublishOptionsHeaders = { //PublishOptions headers namespace helper
    'MESSAGE_TAG': 'message',
    'IOS_ALERT_TAG': 'ios-alert',
    'IOS_BADGE_TAG': 'ios-badge',
    'IOS_SOUND_TAG': 'ios-sound',
    'ANDROID_TICKER_TEXT_TAG': 'android-ticker-text',
    'ANDROID_CONTENT_TITLE_TAG': 'android-content-title',
    'ANDROID_CONTENT_TEXT_TAG': 'android-content-text',
    'ANDROID_ACTION_TAG': 'android-action',
    'WP_TYPE_TAG': 'wp-type',
    'WP_TITLE_TAG': 'wp-title',
    'WP_TOAST_SUBTITLE_TAG': 'wp-subtitle',
    'WP_TOAST_PARAMETER_TAG': 'wp-parameter',
    'WP_TILE_BACKGROUND_IMAGE': 'wp-backgroundImage',
    'WP_TILE_COUNT': 'wp-count',
    'WP_TILE_BACK_TITLE': 'wp-backTitle',
    'WP_TILE_BACK_BACKGROUND_IMAGE': 'wp-backImage',
    'WP_TILE_BACK_CONTENT': 'wp-backContent',
    'WP_RAW_DATA': 'wp-raw'
};

var PublishOptions = function (args) {
    args = args || {};
    this.publisherId = args.publisherId || undefined;
    this.headers = args.headers || undefined;
    this.subtopic = args.subtopic || undefined;
};

var DeliveryOptions = function (args) {
    args = args || {};
    this.pushPolicy = args.pushPolicy || undefined;
    this.pushBroadcast = args.pushBroadcast || undefined;
    this.pushSinglecast = args.pushSinglecast || undefined;
    this.publishAt = args.publishAt || undefined;
    this.repeatEvery = args.repeatEvery || undefined;
    this.repeatExpiresAt = args.repeatExpiresAt || undefined;
};

var Bodyparts = function (args) {
    args = args || {};
    this.textmessage = args.textmessage || undefined;
    this.htmlmessage = args.htmlmessage || undefined;
};

var SubscriptionOptions = function (args) {
    args = args || {};
    this.subscriberId = args.subscriberId || undefined;
    this.subtopic = args.subtopic || undefined;
    this.selector = args.selector || undefined;
};
