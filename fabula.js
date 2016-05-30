/*
 * ======  Fabula Interpreter  ======
 *     © Aha! Factor Pty Ltd, 2016
 *       http://fabwebtools.com
 * ===========================
 */
var Fabula = (function() {
    "use strict";

    var asyncRequest = function(method, uri, callback, postData) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                if (callback) {
                    callback(xhr.responseXML);
                }
            }
        };
        xhr.open(method, uri, true);
        xhr.send(postData || null);
        return xhr;
    };

    function getChildren(node) {
        var i = 0;
        var result = [];
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType !== 8 && (node.childNodes[i].nodeType !== 3 || node.childNodes[i].nodeValue.trim() !== "")) {
                result.push(node.childNodes[i]);
            }
        }
        return result;
    }

    function firstExpr(node) {
        var first = 0;
        while (node.childNodes[first].nodeType === 8 || (node.childNodes[first].nodeType === 3 && node.childNodes[first].nodeValue.trim() === "")) {
            first++;
        }
        return node.childNodes[first];
    }

    function findChild(node, name) {
        var i = 0;
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName.toLowerCase() === name.toLowerCase()) {
                return node.childNodes[i];
            }
        }
        throw "Error";
    }

    function findChildren(node, name) {
        var i = 0;
        var result = [];
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName.toLowerCase() === name.toLowerCase()) {
                result.push(node.childNodes[i]);
            }
        }
        return result;
    }

    function clone(obj) {
        var result = {};
        for (var prop in obj) {
            result[prop] = obj[prop];
        }
        return result;
    }

    var parseQueryString = function(queryString) {
        var params = {},
            queries, temp, i, l;

        // Split into key/value pairs
        queries = queryString.split("&");

        // Convert the array of strings into an object
        l = queries.length;
        for (i = 0; i < l; i++) {
            temp = queries[i].split('=');
            if (temp[0] !== '') {
                params[temp[0]] = temp[1];
            }
        }

        return params;
    };

    function Core(lib) {
        this.appletclass = function(name) {
            if (name in lib.applets) {
                return lib.applets[name].class();
            } else {
                return '';
            }
        };
    }
    Core.prototype.location = {
        url: window.location.href,
        params: parseQueryString(window.location.search.substring(1))
    };
    Core.prototype.math = {
        sin: function(x) {
            return Math.sin(x);
        },
        cos: function(x) {
            return Math.cos(x);
        },
        exp: function(x) {
            return Math.exp(x);
        },
        log: function(x) {
            return Math.log(x);
        },
        floor: function(x) {
            return Math.floor(x);
        },
        ceil: function(x) {
            return Math.ceil(x);
        },
        isNaN: function(x) {
            return isNaN(x);
        },
        isFinite: function(x) {
            return isFinite(x);
        }
    };
    Core.prototype.time = {
        msec: 1,
        sec: 1000,
        min: 60000,
        hour: 3600000,
        date: function(d) {
            return Number(new Date(d.year, d.month - 1, d.day, 0, 0, 0, 0));
        },
        dateOf: function(t) {
            var tmp = new Date(t);
            return Number(new Date(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate(), 0, 0, 0, 0));
        },
        timeOf: function(t) {
            var tmp = new Date(t);
            tmp = Number(new Date(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate(), 0, 0, 0, 0));
            return t - tmp;
        },
        encode: function(arg) {
            return Number(new Date(arg.year, arg.month - 1, arg.day, arg.hours, arg.min, arg.sec, arg.msec));
        },
        decode: function(t) {
            var tmp = new Date(t);
            return {
                year: tmp.getUTCFullYear(),
                month: tmp.getUTCMonth(),
                day: tmp.getUTCDate(),
                hours: tmp.getUTCHours(),
                min: tmp.getUTCMinutes(),
                sec: tmp.getUTCSeconds(),
                msec: tmp.getUTCMilliseconds()
            };
        }
    };
    Core.prototype.format = {
        intToStr: function(i) {
            return i.toString();
        },
        numToStr: function(x) {
            return x.toString();
        },
        formatNum: function(arg) {
            var frm = arg.format;
            if (frm.hasOwnProperty("prec")) {
                return arg.num.toPrecision(frm.prec);
            } else if (frm.hasOwnProperty("exp")) {
                return arg.num.toExponential(frm.exp);
            } else {
                return arg.num.toFixed(frm.dec);
            }
        },
        strToNum: function(s) {
            var result = parseFloat(s);
            if (isNaN(result)) {
                throw "Error";
            }
            return result;
        },
        strToInt: function(s) {
            var result = parseInt(s);
            if (isNaN(result)) {
                throw "Error";
            }
            return result;
        },
        dateToStr: function(x) {
            return (new Date(x)).toLocaleDateString();
        },
        timeToStr: function(x) {
            return (new Date(x)).toLocaleTimeString();
        },
        dateTimeToStr: function(x) {
            return (new Date(x)).toLocaleString();
        },
        strToTime: function(x) {
            return Date.parse(x);
        },
    };
    Core.prototype.string = {
        nbsp: "&nbsp;",
        larr: "&larr;",
        rarr: "&rarr;",
        uarr: "&uarr;",
        darr: "&darr;",
        harr: "&harr;",
        times: "&times;",
        laquo: "&laquo;",
        raquo: "&raquo;",
        // lt: "&lt;",
        // gt: "&gt;",
        copy: "&copy;",
        // amp: "&",
        // br: "<br/>",
        symbol: function(dec) {
            return "&#" + dec + ";";
        },
        substr: function(args) {
            var from = args.from;
            var to = args.to;
            if (to.hasOwnProperty("length")) {
                return args.str.substr(from, to.length);
            } else {
                if (to.hasOwnProperty("pos")) {
                    return args.str.slice(from, to.pos);
                } else {
                    return args.str.slice(from);
                }
            }
        },
        indexOf: function(args) {
            var idx = args.str.indexOf(args.substr);
            if (idx >= 0) {
                return idx;
            } else {
                throw "Fail";
            }
        },
        lastIndexOf: function(args) {
            var idx = args.str.lastIndexOf(args.substr);
            if (idx >= 0) {
                return idx;
            } else {
                throw "Fail";
            }
        },
        length: function(str) {
            return str.length;
        },
        join: function(arg) {
            return arg.parts.join(arg.sep);
        },
        split: function(arg) {
            return arg.str.split(arg.sep);
        },
        repeat: function(arg) {
            var result = "";
            for (var i = 0; i < arg.times; i++) {
                result.concat(arg.str);
            }
            return result;
        },
        charAt: function(arg) {
            return arg.str.charAt(arg.index);
        },
        trim: function(str) {
            return str.trim();
        },
        replace: function(arg) {
            var re = new RegExp(arg.substr, 'g');

            return arg.str.replace(re, arg.to);
        },
        encodeHTML: function(str) {
            return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        },
        decodeHTML: function(str) {
            return str.replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'");
        },
        toLowerCase: function(str) {
            return str.toLowerCase();
        },
        toUpperCase: function(str) {
            return str.toUpperCase();
        },
        match: function(arg) {
            if (arg) {
                return null;
            } else {
                return undefined;
            }
        }
    };
    Core.prototype.json = {
        parse: function(text) {
            try {
                var temp = JSON.parse(text);
                if (typeof temp === 'boolean') {
                    if (temp) {
                        return null;
                    } else {
                        return undefined;
                    }
                } else {
                    return temp;
                }
            } catch (ex) {
                return undefined;
            }
        },
        stringify: function(value) {
            return JSON.stringify(value);
        }
    };
    Core.prototype.xml = {
        parseText: function(text) {
            var parser;
            var xmlDoc;
            if (window.DOMParser) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(text, "text/xml");
            } else {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(text);
            }
            return xmlDoc.childNodes[0];
        },
        getChildren: function(node) {
            return getChildren(node);
        },
        findChild: function(arg) {
            return findChild(arg.node, arg.name);
        },
        findChildren: function(arg) {
            return findChildren(arg.node, arg.name);
        },
        getName: function(node) {
            return node.nodeName;
        },
        getValue: function(node) {
            return node.nodeValue;
        },
        getType: function(node) {
            return node.nodeType;
        },
        getText: function(node) {
            if (node.childNodes.length === 0) {
                return "";
            } else {
                return node.childNodes[0].nodeValue;
            }
        },
        getAttribute: function(arg) {
            var temp = arg.node.getAttribute(arg.name);
            if (temp === null)
                throw "Attribute not found";
            return temp;
        },
        getAttributes: function(node) {
            var n = node.attributes.length;
            var attrnode;
            var result = {};
            for (var i = 0; i < n; i++) {
                attrnode = node.attributes.item(i);
                result[attrnode.name] = attrnode.nodeValue;
            }
            return result;
        },
        innerHTML: function(node) {
            var ser = new XMLSerializer();
            var temp = "";
            for (var i = 0; i < node.childNodes.length; i++) {
                temp += ser.serializeToString(node.childNodes[i]);
            }
            return temp;
        }
    };

    var mainlib = null;
    var active = false;

    function resume() { //main application loop
        if (!active) {
            active = true;
            setTimeout(function() {
                active = false;
                if (mainlib.debug) {
                    mainlib.debug.resume(mainlib.resumelist);
                } else {
                    for (var i = 0; i < mainlib.resumelist.length; i++) {
                        mainlib.resumelist[i].resume();
                    }
                }
            });
        }
    }

    function Applet(xml, lib) {
        var i, j, p;
        this.name = xml.getAttribute("name");
        if (xml.hasAttribute("class")) {
            this.classname = xml.getAttribute("class");
        }
        var debug = lib.debug;
        this.engine = new Engine(lib);
        this.lib = lib;
        this.debug = debug;
        // this.initrandnames = [];
        this.actions = [];
        // this.resprandnames = [];
        this.respActions = [];
        this.extension = xml.getAttribute("extension");
        this.next = 0;
        this.instances = {};
        this.channels = {};
        this.events = {};
        //parse applet's body
        var children = getChildren(xml);
        var temp;
        for (i = 0; i < children.length; i++) {
            var child = children[i];
            switch (child.nodeName) {
                case "model":
                    this.statename = child.getAttribute("state");
                    break;
                case "view":
                    this.content = firstExpr(child);
                    this.viewapps = {};
                    if (child.hasAttribute("applets")) {
                        temp = child.getAttribute("applets").split(",");
                        for (j = 0; j < temp.length; j++) {
                            p = temp[j].indexOf(":");
                            if (p >= 0) {
                                this.viewapps[temp[j].slice(0, p).trim()] = temp[j].slice(p + 1).trim();
                            }
                        }
                    }
                    break;
                case "init":
                    var id = child.getAttribute("id");
                    this.idname = id;
                    this.initargname = child.getAttribute("arg");
                    this.initdataname = child.getAttribute("data");
                    // temp = child.getAttribute("random");
                    // if (temp !== null) {
                    //     this.initrandnames = temp.split(",");
                    //     for (j = 0; j < temp.length; j++) {
                    //         this.initrandnames[j] = this.initrandnames[j].trim();
                    //     }
                    // }
                    this.initcontentname = child.getAttribute("content");
                    this.inittimename = child.getAttribute("time");
                    this.initState = firstExpr(child);
                    temp = findChildren(child, "actions");
                    break;
                case "actions":
                    this.actions = getChildren(child);
                    break;
                case "events":
                    this.eventname = child.getAttribute("data");
                    temp = getChildren(child);
                    for (j = 0; j < temp.length; j++) {
                        this.events[temp[j].nodeName] = firstExpr(temp[j]);
                    }
                    this.eventtimename = child.getAttribute("time");
                    break;
                case "receive":
                    // temp = child.getAttribute("random");
                    // if (temp !== null) {
                    //     this.resprandnames = temp.split(",");
                    //     for (j = 0; j < temp.length; j++) {
                    //         this.resprandnames[j] = this.resprandnames[j].trim();
                    //     }
                    // }
                    this.resptimename = child.getAttribute("time");
                    temp = getChildren(child); //from clauses
                    for (j = 0; j < temp.length; j++) {
                        if (temp[j].hasAttribute("channel")) {
                            this.channels[temp[j].getAttribute("channel")] = {
                                data: child.getAttribute("data"),
                                expr: firstExpr(temp[j]), //new state expression
                                value: undefined //last value received
                            };
                        }
                    }
                    break;
                case "output":
                    break;
                default:
                    throw "Error";
            }
        }

    } //Applet

    var handlers = function(applet) {
        return {
            click: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                var local = clone(applet.lib.globals);
                if (applet.statename) {
                    local[applet.statename] = instance;
                }
                if (applet.eventtimename) {
                    local[applet.eventtimename] = Number(new Date());
                }
                var trace = applet.debug ? applet.debug.traceactions(id) : null;
                // if (trace) trace.clear();
                var result = applet.engine.evalExpr(applet.events.click, local, trace);
                if (typeof result !== 'undefined') {
                    e.stopPropagation();
                    result(applet, id);
                }
                // e.preventDefault();
                return false;
            },
            change: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                var local = clone(applet.lib.globals);
                if (applet.statename) {
                    local[applet.statename] = instance;
                }
                local[applet.eventname] = e.target.value;
                if (applet.eventtimename) {
                    local[applet.eventtimename] = Number(new Date());
                }
                var trace = applet.debug ? applet.debug.traceactions(id) : null;
                // if (trace) trace.clear();
                var result = applet.engine.evalExpr(applet.events.change, local, trace);
                if (typeof result !== 'undefined') {
                    e.stopPropagation();
                    result(applet, id);
                }
                return true;
            },
            input: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                var local = clone(applet.lib.globals);
                if (applet.statename) {
                    local[applet.statename] = instance;
                }
                local[applet.eventname] = e.target.value;
                if (applet.eventtimename !== null) {
                    local[applet.eventtimename] = Number(new Date());
                }
                var trace = applet.debug ? applet.debug.traceactions(id) : null;
                // if (trace) trace.clear();
                var result = applet.engine.evalExpr(applet.events.input, local, trace);
                if (typeof result !== 'undefined') {
                    e.stopPropagation();
                    result(applet, id);
                }
                return true;
            },
            submit: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                var local = clone(applet.lib.globals);
                if (applet.statename) {
                    local[applet.statename] = instance;
                }
                var dict = {};
                for (var i = 0; i < e.target.elements.length; i++) {
                    var element = e.target.elements[i];
                    if (element.name && element.name !== "") {
                        dict[element.name] = element.value;
                    }
                }
                local[applet.eventname] = dict;
                if (applet.eventtimename !== null) {
                    local[applet.eventtimename] = Number(new Date());
                }
                e.preventDefault();
                var trace = applet.debug ? applet.debug.traceactions(id) : null;
                // if (trace) trace.clear();
                var result = applet.engine.evalExpr(applet.events.submit, local, trace);
                if (typeof result !== 'undefined') {
                    e.stopPropagation();
                    result(applet, id);
                }
                return false;
            },
        };
    };

    Applet.prototype.class = function() { //class of elements associated with applet
        if (this.classname) {
            return this.classname;
        } else {
            var main = this.lib;
            var cl = this.name;
            while (main.parent) {
                cl = main.id + '__' + cl;
                main = main.parent;
            }
            return 'applet___' + cl;
        }
    };

    Applet.prototype.create = function(element) { //create an instance attached to element
        var context = clone(this.lib.globals);
        var arg, i, newid, result, app, prop, dict;
        var h = handlers(this);
        if (element) {
            if (element.attributes["data-arg"]) {
                arg = element.attributes["data-arg"].value;
            } else {
                arg = "";
            }
            context[this.initargname] = arg;
            if (this.initdataname) {
                dict = {};
                for (i = 0; i < element.attributes.length; i++) {
                    prop = element.attributes[i].name;
                    if (prop.substr(0, 5) === "data-") {
                        dict[prop.slice(5)] = element.attributes[i].value;
                    }
                }
                context[this.initdataname] = dict;
            }
            newid = this.class() + '-' + this.next++;
            element.id = newid;
            // for (i = 0; i < this.initrandnames.length; i++) {
            //     context[this.initrandnames[i]] = Math.random();
            // }
            if (this.inittimename) {
                context[this.inittimename] = Number(new Date());
            }
            if (this.initcontentname) {
                context[this.initcontentname] = element.innerHTML;
            }
            context[this.idname] = newid;
            for (var e in this.events) {
                element.addEventListener(e, h[e]);
            }
            var trace = this.debug ? this.debug.tracestate(newid) : null;
            if (trace) trace.clear();
            if (this.initState) {
                result = this.engine.evalExpr(this.initState, context, trace);
            } else {
                result = null;
                if (trace) trace.success('{}', null);
            }
            if (this.debug) this.debug.create(this.name, newid, context, result);
            if (typeof result !== 'undefined') {
                this.instances[newid] = result;
                context[this.statename] = result;
                if (this.extension) {
                    if (this.extension in this.lib.extensions) {
                        try {
                            if ('attach' in this.lib.extensions[this.extension]) this.lib.extensions[this.extension].attach(newid, element, arg);
                        } catch (ex) {}
                    } else {}
                }
                trace = this.debug ? this.debug.traceactions(newid) : null;
                for (i = 0; i < this.actions.length; i++) { //perform actions
                    // if (trace) trace.clear();
                    result = this.engine.evalExpr(this.actions[i], context, trace);
                    if (typeof result !== 'undefined') {
                        this.lib.queue.push(result);
                    }
                }
                for (var chname in this.channels) { //now receive the data already on the channels
                    var value = this.channels[chname].value;
                    if (typeof value !== "undefined") {
                        context[this.channels[chname].data] = value;
                        // for (var j = 0; j < this.resprandnames.length; j++) {
                        //     context[this.resprandnames[j]] = Math.random(); //random numbers (if requested)
                        // }
                        if (this.resptimename) {
                            context[this.resptimename] = Number(new Date()); //current time (if requested)
                        }
                        trace = this.debug ? this.debug.tracestate(newid) : null;
                        if (trace) trace.clear();
                        result = this.engine.evalExpr(this.channels[chname].expr, context, trace); //new state
                        if (this.debug) this.debug.receive(this.name, newid, chname, context, result);
                        if (typeof result !== 'undefined') {
                            this.instances[newid] = result;
                            context[this.statename] = result;
                            trace = this.debug ? this.debug.traceactions(newid) : null;
                            for (i = 0; i < this.actions.length; i++) { //perform actions
                                result = this.engine.evalExpr(this.actions[i], context, trace ? trace.create() : null);
                                if (typeof result !== 'undefined') {
                                    this.lib.queue.push(result);
                                    resume();
                                }
                            }
                        }
                        if (this.extension) {
                            if (this.extension in this.lib.extensions) {
                                try {
                                    if ('react' in this.lib.extensions[this.extension]) this.lib.extensions[this.extension].react(id, chname, value);
                                } catch (ex) {}
                            } else {}
                        }
                    }
                }
                trace = this.debug ? this.debug.traceview(newid) : null;
                if (trace) trace.clear();
                if (this.content) { //render view
                    for (prop in this.viewapps) {
                        context[prop] = this.lib.globals.core.appletclass(this.viewapps[prop]);
                    }
                    result = this.engine.evalExpr(this.content, context, trace);
                    if (typeof result !== 'undefined') {
                        element.innerHTML = result;
                        resume();
                    }
                } else {
                    if (trace) trace.fail('NONE');
                }
            } else {}
        }
    };

    Applet.prototype.receive = function(chname, dataname, expr, data) {
        var local = clone(this.lib.globals);
        var j, result, prop;
        local[dataname] = data; //data received
        for (var id in this.instances) {
            local[this.statename] = this.instances[id]; //old state
            // for (j = 0; j < this.resprandnames.length; j++) {
            //     local[this.resprandnames[j]] = Math.random(); //random numbers (if requested)
            // }
            if (this.resptimename) {
                local[this.resptimename] = Number(new Date()); //current time (if requested)
            }
            var trace = this.debug ? this.debug.tracestate(id) : null;
            if (trace) trace.clear();
            result = this.engine.evalExpr(expr, local, trace); //new state
            if (this.debug) this.debug.receive(this.name, id, chname, local, result);
            if (typeof result !== 'undefined') {
                local[this.statename] = result;
                this.instances[id] = result;
                trace = this.debug ? this.debug.traceview(id) : null;
                if (trace) trace.clear();
                if (this.content) { //state changed - render view
                    for (prop in this.viewapps) {
                        local[prop] = this.lib.globals.core.appletclass(this.viewapps[prop]);
                    }
                    result = this.engine.evalExpr(this.content, local, trace);
                    if (typeof result !== 'undefined') {
                        var element = document.getElementById(id);
                        if (element) {
                            element.innerHTML = result;
                            resume();
                        }
                    }
                } else {
                    if (trace) trace.fail('NONE');
                }
                //perform actions
                trace = this.debug ? this.debug.traceactions(id) : null;
                for (j = 0; j < this.actions.length; j++) {
                    // if (trace) trace.clear();
                    result = this.engine.evalExpr(this.actions[j], local, trace);
                    if (typeof result !== 'undefined') {
                        this.lib.queue.push(result);
                        resume();
                    }
                }
                if (this.extension) {
                    if (this.extension in this.lib.extensions) {
                        try {
                            if ('react' in this.lib.extensions[this.extension]) this.lib.extensions[this.extension].react(id, chname, data);
                        } catch (ex) {}
                    } else {}
                }
            }
        }
        this.channels[chname].value = data; //for future instances
        if (this.debug) this.debug.put(this.name, chname, data);
    };

    Applet.prototype.exists = function(id) { //does an instance exist for given element id?
        return id in this.instances;
    };

    Applet.prototype.destroy = function(id) { //destroy instance
        if (this.debug) this.debug.destroy(this.name, id);
        if (this.extension) {
            if (this.extension in this.lib.extensions) {
                try {
                    if ('detach' in this.lib.extensions[this.extension]) this.lib.extensions[this.extension].detach(id);
                } catch (ex) {}
            }
        }
        delete this.instances[id];
    };


    function Channel(xml, lib) {
        this.lib = lib;
        this.name = xml.getAttribute("name");
        this.targets = []; //will be added at library init
        this.debug = lib.debug;
        // var trace = null;
        // if (this.debug) {
        //     trace = this.debug.trace("channel:" + this.name);
        //     trace.clear();
        // }
        // this.engine = new Engine(lib);
    }

    Channel.prototype.send = function(data) { //send data to all targets of the channel
        var output = {};
        var i;
        for (i = 0; i < this.targets.length; i++) {
            var target = this.targets[i];
            target.applet.receive(target.name, target.data, target.expr, data);
        }
    };

    /* Computation engine */
    function Engine(lib) {

        var ser = new XMLSerializer();

        function evalFormula(formula, context, trace) {

            var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|((?:\w+::)?\w+)|(\".*?\")|('.*?')|(=)|(#)|(@)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(\?)/g;
            var match;
            var token;
            var result;
            var level = 0;

            function next() {
                match = scanner.exec(formula);
                if (match) {
                    token = match[0].trim();
                } else {
                    token = null;
                }
            }

            function parseConditional() {
                var res;
                var v;
                var prop;
                var cond, t, e;
                if (token !== null) {
                    try {
                        cond = parseRelation();
                    } catch (ex) {
                        cond = undefined;
                    }
                    if (token === "?") {
                        next();
                        t = parseSubject();
                        if (token === ":") {
                            next();
                            e = parseSubject();
                        } else {
                            e = undefined;
                        }
                        if (typeof cond !== 'undefined') {
                            if (typeof cond === 'boolean') {
                                if (cond) {
                                    return t;
                                } else {
                                    return e;
                                }
                            } else {
                                return t;
                            }
                        } else {
                            return e;
                        }
                    } else {
                        return cond;
                    }
                }
            }

            function parseRelation() {
                var rel;
                var subj1 = parseSubject();
                if (token !== null) {
                    rel = token;
                    if (rel === match[5] || rel === "=") {
                        next();
                        var subj2 = parseSubject();
                        switch (rel) {
                            case "'le'":
                                return subj1 <= subj2;
                            case "'lt'":
                                return subj1 < subj2;
                            case "=":
                            case "'eq'":
                                return subj1 === subj2;
                            case "'ne'":
                                return subj1 !== subj2;
                            case "'gt'":
                                return subj1 > subj2;
                            case "'ge'":
                                return subj1 >= subj2;
                            default:
                                throw "Invalid relation: " + rel;
                        }
                    } else {
                        return subj1;
                    }
                } else {
                    return subj1;
                }
            }

            function parseSubject() {
                var t1 = parseTerm();
                while (token === "+" || token === "-") {
                    var op = token;
                    next();
                    var t2 = parseTerm();
                    switch (op) {
                        case "+":
                            t1 += t2;
                            break;
                        case "-":
                            t1 -= t2;
                            break;
                    }
                }
                return t1;
            }

            function parseTerm() {
                var f1 = parseFactor();
                while (token === "*" || token === "/") {
                    var op = token;
                    next();
                    var f2 = parseFactor();
                    switch (op) {
                        case "*":
                            f1 *= f2;
                            break;
                        case "/":
                            f1 /= f2;
                            break;
                    }
                }
                return f1;
            }

            function parseFactor() {
                var res;
                var v;
                var prop;
                var f;
                if (token !== null) {
                    if (token === match[1] || token === match[2]) {
                        res = Number(token);
                        next();
                    } else
                    if (token === match[4] || token === match[5]) {
                        res = token.substr(1, token.length - 2);
                        next();
                    } else
                    if (token === match[3]) {
                        res = context[token];
                        next();
                        while (token !== null) {
                            if (!(token === "(" || token === "[" || token === "@" || token === ".")) break;
                            switch (token) {
                                case "(":
                                    next();
                                    v = parseSubject();
                                    res = res(v);
                                    next();
                                    break;
                                case "[":
                                    next();
                                    v = parseSubject();
                                    if (v >= 0 && v < res.length) {
                                        res = res[v];
                                    } else {
                                        throw "Invalid index";
                                    }
                                    next();
                                    break;
                                case "@":
                                    next();
                                    v = parseFactor();
                                    if (res.hasOwnProperty(v)) {
                                        res = res[v];
                                    } else {
                                        throw "Invalid key";
                                    }
                                    break;
                                case ".":
                                    next();
                                    if (token in res) {
                                        res = res[token];
                                    } else {
                                        throw "Undefined property";
                                    }
                                    next();
                                    break;
                            }
                        }
                        if (token === "#") {
                            res = res.length;
                            next();
                        }
                    } else
                    if (token === "(") {
                        next();
                        res = parseSubject();
                        next();
                    } else
                    if (token === "{") {
                        next();
                        if (token === "}") {
                            res = null;
                            next();
                        } else {
                            res = {};
                            prop = token;
                            next();
                            next();
                            if (token === "}") {
                                res[prop] = null;
                            } else {
                                v = parseSubject();
                                res[prop] = v;
                            }
                            while (token === ",") {
                                next();
                                prop = token;
                                next();
                                next();
                                v = parseSubject();
                                res[prop] = v;
                            }
                            next();
                        }
                    } else {
                        throw "Parse error";
                    }
                    return res;
                } else {
                    throw "Parse error";
                }
                // next();
            }


            try {
                next(); //read first token
                result = parseConditional();
                if (typeof result === 'undefined') {
                    if (trace) trace.fail(formula);
                    return undefined;
                } else
                if (typeof result === 'boolean') { //Fabula has no booleans
                    if (result) {
                        if (trace) trace.success(formula, true);
                        return null;
                    } else {
                        if (trace) trace.fail(formula);
                        return undefined;
                    }
                }
                if (trace) trace.success(formula, result);
                return result;
            } catch (error) {
                if (trace) trace.fail(formula);
                return undefined;
            }
        } //evalFormula

        var evalExpr = function(expr, context, trace) {
            var frmval = function(match, p1) {
                var result = evalFormula(p1, context, trace ? trace.create() : null);
                if (typeof result !== 'undefined') {
                    return result;
                } else {
                    throw "Fail";
                }
            };
            var frmpat = /\[%(.*?)%\]/g;

            function conform(value, type) {
                var i, prop, child, result, temp, count;
                switch (type.nodeName) {
                    case "dynamic":
                        return value;
                    case "type":
                        return conform(value, lib.types[type.getAttribute("name")]);
                    case 'integer':
                    case 'time':
                    case 'interval':
                        if (!value) {
                            return 0;
                        }
                        if (typeof value === 'number' && Math.floor(value) === value)
                            return value;
                        break;
                    case 'number':
                        if (!value) {
                            return 0;
                        }
                        if (typeof value === 'number')
                            return value;
                        break;
                    case 'string':
                        if (!value) {
                            return '';
                        }
                        if (typeof value === 'string')
                            return value;
                        break;
                    case 'arrayof':
                        if (!value) {
                            return [];
                        }
                        if (typeof value === 'object') {
                            result = [];
                            child = firstExpr(type);
                            for (i = 0; i < value.length; i++) {
                                temp = conform(value[i], child);
                                if (typeof temp === "undefined") {
                                    return undefined;
                                } else {
                                    result[i] = temp;
                                }
                            }
                            return result;
                        }
                        break;
                    case 'dictionaryof':
                        if (!value) {
                            return {};
                        }
                        if (typeof value === 'object') {
                            result = {};
                            child = firstExpr(type);
                            for (prop in value) {
                                temp = conform(value[prop], child);
                                if (typeof temp === "undefined") {
                                    return undefined;
                                } else {
                                    result[prop] = temp;
                                }
                            }
                            return result;
                        }
                        break;
                    case 'com':
                        if (typeof value === 'object') {
                            result = {};
                            count = 0;
                            for (i = 0; i < type.childNodes.length; i++) {
                                if (type.childNodes[i].nodeName === 'prop') {
                                    prop = type.childNodes[i].getAttribute('name');
                                    if (!(prop in value)) {
                                        temp = conform(null, firstExpr(type.childNodes[i]));
                                    } else {
                                        temp = conform(value[prop], firstExpr(type.childNodes[i]));
                                    }
                                    if (typeof temp === "undefined") {
                                        return undefined;
                                    } else {
                                        result[prop] = temp;
                                        count++;
                                    }
                                }
                            }
                            if (count === 0) result = null;
                            return result;
                        }
                        break;
                    case 'var':
                        if (typeof value === 'boolean') {
                            temp = {};
                            for (i = 0; i < type.childNodes.length; i++) {
                                if (type.childNodes[i].nodeName === 'prop') {
                                    prop = type.childNodes[i].getAttribute('name');
                                    temp[prop] = firstExpr(type.childNodes[i]);
                                }
                            }
                            if (value && 'true' in temp && temp['true'].nodeName === 'com' && temp['true'].childNodes.length === 0) {
                                return {
                                    true: null
                                };
                            } else
                            if (!value && 'false' in temp && temp['false'].nodeName === 'com' && temp['false'].childNodes.length === 0) {
                                return {
                                    false: null
                                };
                            } else {
                                return undefined;
                            }
                        } else
                        if (typeof value === 'object') {
                            if (value === null) {
                                return undefined;
                            }
                            result = {};
                            for (i = 0; i < type.childNodes.length; i++) {
                                if (type.childNodes[i].nodeName === 'prop') {
                                    prop = type.childNodes[i].getAttribute('name');
                                    if (prop in value) {
                                        if (type.childNodes[i].childNodes.length === 0) {
                                            temp = null;
                                        } else {
                                            temp = conform(value[prop], firstExpr(type.childNodes[i]));
                                        }
                                        if (typeof temp !== "undefined") {
                                            result[prop] = temp;
                                            return result;
                                        }
                                    }
                                }
                            }
                        }
                        break;
                }
                return undefined;
            }

            if (expr.nodeType === 3) {
                return evalFormula(expr.nodeValue.trim(), context, trace);
            }

            var algs = {
                invalid: function(expr, context, trace) {
                    if (trace) trace.fail('<invalid>');
                    return undefined;
                },
                conform: function(expr, context, trace) {
                    var temp = evalExpr(firstExpr(expr), context, trace);
                    var result = conform(temp, firstExpr(findChild(expr, 'to')));
                    if (typeof result !== "undefined") {
                        if (trace) trace.success('<conform>', result);
                    } else {
                        if (trace) trace.fail('<conform>');
                    }
                    return result;
                },
                calc: function(expr, context, trace) {
                    var prop, stmt, result;
                    var where = getChildren(expr);
                    var context2 = clone(context);
                    for (var i = where.length - 1; i > 0; i--) {
                        stmt = firstExpr(where[i]);
                        if (!evalStmt(stmt, context2, context2, trace ? trace.create() : null)) {
                            if (trace) trace.fail('<calc>');
                            return undefined;
                        }
                    }
                    result = evalExpr(where[0], context2, trace ? trace.create() : null);
                    if (typeof result !== "undefined") {
                        if (trace) trace.success('<calc>', result);
                    } else {
                        if (trace) trace.fail('<calc>');
                    }
                    return result;
                },
                literal: function(expr, context, trace) {
                    var children = getChildren(expr);
                    var temp = "";
                    for (var i = 0; i < children.length; i++) {
                        if (children[i].nodeType !== 8) {
                            // if (children[i].nodeType === 1 && children[i].nodeName === "array") {
                            //     var result = evalExpr(children[i], context, trace ? trace.create() : null);
                            //     if (typeof result !== 'undefined') {
                            //         for (var j = 0; j < result.length; j++) {
                            //             temp += result[j];
                            //         }
                            //     } else {
                            //         if (trace) trace.fail('<literal>');
                            //         return undefined;
                            //     }
                            // } else {
                            temp += ser.serializeToString(children[i]);
                            // }
                        }
                    }
                    if (trace) trace.success('<literal>', temp);
                    return temp;
                },
                text: function(expr, context, trace) {
                    var children = getChildren(expr);
                    var temp = "";
                    for (var i = 0; i < children.length; i++) {
                        if (children[i].nodeType !== 8) {
                            if (children[i].nodeType === 1 && children[i].nodeName === "array") {
                                var result = evalExpr(children[i], context, trace ? trace.create() : null);
                                if (typeof result !== 'undefined') {
                                    for (var j = 0; j < result.length; j++) {
                                        temp += result[j];
                                    }
                                } else {
                                    if (trace) trace.fail('<text>');
                                    return undefined;
                                }
                            } else {
                                temp += ser.serializeToString(children[i]);
                            }
                        }
                    }
                    try {
                        temp = temp.replace(frmpat, frmval);
                        if (trace) trace.success('<text>', temp);
                        return temp;
                    } catch (e) {
                        if (trace) trace.fail('<text>');
                        return undefined;
                    }
                },
                multitext: function(expr, context, trace) {
                    var temp = firstExpr(findChild(expr, "size"));
                    var str = "";
                    var result = evalExpr(temp, context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var l = result;
                        var item = findChild(expr, "item");
                        var idxname = item.getAttribute("index");
                        var context2 = clone(context);
                        for (var i = 0; i < l; i++) {
                            context2[idxname] = i;
                            result = evalExpr(firstExpr(item), context2, trace ? trace.create() : null);
                            if (typeof result !== 'undefined') {
                                str += result;
                            } else {
                                if (trace) trace.fail('<multitext>');
                                return undefined;
                            }
                        }
                    } else {
                        if (trace) trace.fail('<multitext>');
                        return undefined;
                    }
                    if (trace) trace.success('<multitext>', str);
                    return str;
                },
                list: function(expr, context, trace) {
                    var temp = getChildren(expr);
                    var array = [];
                    array.length = temp.length;
                    for (var i = 0; i < temp.length; i++) {
                        var result = evalExpr(temp[i], context, trace ? trace.create() : null);
                        if (typeof result !== 'undefined') {
                            array[i] = result;
                        } else {
                            if (trace) trace.fail('<list>');
                            return undefined;
                        }
                    }
                    if (trace) trace.success('<list>', array);
                    return array;
                },
                entries: function(expr, context, trace) {
                    var temp = findChildren(expr, "entry");
                    var obj = {};
                    for (var i = 0; i < temp.length; i++) {
                        var temp2 = firstExpr(temp[i]);
                        var result = evalExpr(temp2, context, trace ? trace.create() : null);
                        if (typeof result !== 'undefined') {
                            temp2 = result;
                            var temp3 = firstExpr(findChild(temp[i], "value"));
                            result = evalExpr(temp3, context, trace ? trace.create() : null);
                            if (typeof result !== 'undefined') {
                                obj[temp2] = result;
                            } else {
                                if (trace) trace.fail('<entries>');
                                return undefined;
                            }
                        } else {
                            if (trace) trace.fail('<entries>');
                            return undefined;
                        }
                    }
                    if (trace) trace.success('<entries>', obj);
                    return obj;
                },
                array: function(expr, context, trace) {
                    var temp = firstExpr(findChild(expr, "size"));
                    var array = [];
                    var result = evalExpr(temp, context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var l = result;
                        var item = findChild(expr, "item");
                        var idxname = item.getAttribute("index");
                        var context2 = clone(context);
                        for (var i = 0; i < l; i++) {
                            context2[idxname] = i;
                            result = evalExpr(firstExpr(item), context2, trace ? trace.create() : null);
                            if (typeof result !== 'undefined') {
                                array.push(result);
                            } else {
                                if (trace) trace.fail('<array>');
                                return undefined;
                            }
                        }
                    } else {
                        if (trace) trace.fail('<array>');
                        return undefined;
                    }
                    if (trace) trace.success('<array>', array);
                    return array;
                },
                dictionary: function(expr, context, trace) {
                    var temp = firstExpr(findChild(expr, "size"));
                    var obj = {};
                    var result = evalExpr(temp, context);
                    if (typeof result !== 'undefined') {
                        temp = result;
                        var item = findChild(expr, "entry");
                        var idxname = item.getAttribute("index");
                        var context2 = clone(context);
                        for (i = 0; i < temp; i++) {
                            context2[idxname] = i;
                            result = evalExpr(firstExpr(item), context2, trace ? trace.create() : null);
                            if (typeof result !== 'undefined') {
                                var temp2 = result; //key
                                var temp3 = firstExpr(findChild(item, "value"));
                                result = evalExpr(temp3, context2);
                                if (typeof result !== 'undefined') {
                                    obj[temp2] = result; //value
                                } else {
                                    if (trace) trace.fail('<dictionary>');
                                    return undefined;
                                }
                            } else {
                                if (trace) trace.fail('<dictionary>');
                                return undefined;
                            }
                        }
                    } else {
                        if (trace) trace.fail('<dictionary>');
                        return undefined;
                    }
                    if (trace) trace.success('<dictionary>', obj);
                    return obj;
                },
                keys: function(expr, context, trace) {
                    var result = evalExpr(firstExpr(expr), context, trace ? trace.create() : null);
                    var array = [];
                    if (typeof result !== 'undefined') {
                        for (var prop in result) {
                            array.push(prop);
                        }
                        if (trace) trace.success('<keys>', array);
                        return array;
                    } else {
                        if (trace) trace.fail('<keys>');
                        return undefined;
                    }
                },
                values: function(expr, context, trace) {
                    var result = evalExpr(firstExpr(expr), context, trace ? trace.create() : null);
                    var array = [];
                    if (typeof result !== 'undefined') {
                        for (var prop in result) {
                            array.push(result[prop]);
                        }
                        if (trace) trace.success('<values>', array);
                        return array;
                    } else {
                        if (trace) trace.fail('<values>');
                        return undefined;
                    }
                },
                noitems: function(expr, context, trace) {
                    if (trace) trace.success('<noitems>', true);
                    return [];
                },
                noentries: function(expr, context, trace) {
                    if (trace) trace.success('<noentries>', true);
                    return {};
                },
                join: function(expr, context, trace) {
                    var temp = getChildren(expr);
                    var l = 0;
                    for (var i = 0; i < temp.length; i++) {
                        var result = evalExpr(temp[i], context, trace ? trace.create() : null);
                        if (typeof result !== 'undefined') {
                            temp[i] = result;
                            l += result.length;
                        }
                    }
                    var array = [];
                    array.length = l;
                    l = 0;
                    for (i = 0; i < temp.length; i++) {
                        for (var j = 0; j < temp[i].length; j++) {
                            array[l] = temp[i][j];
                            l++;
                        }
                    }
                    if (trace) trace.success('<join>', array);
                    return array;
                },
                merge: function(expr, context, trace) {
                    var temp = getChildren(expr);
                    var l = 0;
                    var obj = {};
                    for (var i = 0; i < temp.length; i++) {
                        var result = evalExpr(temp[i], context, trace ? trace.create() : null);
                        if (typeof result !== 'undefined') {
                            for (var prop in result) {
                                obj[prop] = result[prop];
                            }
                        }
                    }
                    if (trace) trace.success('<merge>', obj);
                    return obj;
                },
                alter: function(expr, context, trace) {
                    var temp = firstExpr(expr);
                    var obj = {};
                    var result = evalExpr(temp, context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        for (var prop in result) {
                            obj[prop] = result[prop];
                        }
                        temp = findChildren(expr, "set");
                        for (var i = 0; i < temp.length; i++) {
                            result = evalExpr(firstExpr(temp[i]), context, trace ? trace.create() : null);
                            if (typeof result !== 'undefined') {
                                prop = temp[i].getAttribute("prop");
                                obj[prop] = result;
                            } else {
                                if (trace) trace.fail('<alter>');
                                return undefined;
                            }
                        }
                        if (trace) trace.success('<alter>', obj);
                        return obj;
                    } else {
                        if (trace) trace.fail('<alter>');
                        return undefined;
                    }
                },
                closure: function(expr, context, trace) {
                    var arg = findChild(expr, "arg");
                    var argname = arg.getAttribute("name");
                    var ret = firstExpr(findChild(expr, "return"));
                    var context2 = clone(context);
                    if (trace) trace.success('<closure>', true);
                    return function(x) {
                        context2[argname] = x;
                        var result = evalExpr(ret, context2, trace ? trace.create() : null);
                        if (typeof result !== 'undefined') {
                            if (trace) trace.success('<return>', result);
                            return result;
                        } else {
                            if (trace) trace.fail('<return>');
                            throw "Fail";
                        }
                    };
                },
                wrap: function(expr, context, trace) {
                    var output = {};
                    if (evalStmt(firstExpr(expr), context, output, trace ? trace.create() : null)) {
                        if (trace) trace.success('<wrap>', output);
                        return output;
                    } else {
                        if (trace) trace.fail('<wrap>');
                        return undefined;
                    }
                },
                find: function(expr, context, trace) {
                    var temp = firstExpr(expr);
                    var result = evalExpr(temp, context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var array = result;
                        temp = findChild(expr, "such");
                        var argname = temp.getAttribute("item");
                        var context2 = clone(context);
                        var output = {};
                        for (var i = 0; i < array.length; i++) {
                            context2[argname] = array[i];
                            if (evalStmt(firstExpr(temp), context2, output, trace ? trace.create() : null)) {
                                if (trace) trace.success('<find>', array[i]);
                                return array[i];
                            }
                        }
                        if (trace) trace.fail('<find>');
                        return undefined;
                    }
                    if (trace) trace.fail('<find>');
                    return undefined;
                },
                filter: function(expr, context, trace) {
                    var temp = firstExpr(expr);
                    var result = evalExpr(temp, context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var array2 = [];
                        var output = {};
                        var array = result;
                        temp = findChild(expr, "such");
                        var argname = temp.getAttribute("item");
                        var context2 = clone(context);
                        for (var i = 0; i < array.length; i++) {
                            context2[argname] = array[i];
                            if (evalStmt(firstExpr(temp), context2, output, trace ? trace.create() : null)) {
                                array2.push(array[i]);
                            }
                        }
                        if (trace) trace.success('<filter>', array2);
                        return array2;
                    } else {
                        if (trace) trace.fail('<filter>');
                        return undefined;
                    }
                },
                count: function(expr, context, trace) {
                    var temp = firstExpr(expr);
                    var count = 0;
                    var result = evalExpr(temp, context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var output = {};
                        var array = result;
                        temp = findChild(expr, "such");
                        var argname = temp.getAttribute("item");
                        var context2 = clone(context);
                        for (var i = 0; i < array.length; i++) {
                            context2[argname] = array[i];
                            if (evalStmt(firstExpr(temp), context2, output, trace ? trace.create() : null)) {
                                count++;
                            }
                        }
                        if (trace) trace.success('<count>', count);
                        return count;
                    } else {
                        if (trace) trace.fail('<count>');
                        return undefined;
                    }
                },
                foldl: function(expr, context, trace) {
                    return undefined;
                },
                foldr: function(expr, context, trace) {
                    return undefined;
                },
                sort: function(expr, context, trace) {
                    var result = evalExpr(firstExpr(expr), context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var array = result.slice();
                        var temp = findChild(expr, "with");
                        var temp2 = temp.getAttribute("names").split(",");
                        var context2 = clone(context);
                        var aa = temp2[0].trim();
                        var bb = temp2[1].trim();
                        var stmt = firstExpr(temp);
                        var output = {};
                        var sortfun = function(a, b) {
                            context2[aa] = a;
                            context2[bb] = b;
                            var result = evalStmt(stmt, context2, output);
                            if (result) {
                                return -1;
                            } else {
                                context2[aa] = b;
                                context2[bb] = a;
                                result = evalStmt(stmt, context2, output);
                                if (result) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            }
                        };
                        array.sort(sortfun);
                        if (trace) trace.success('<sort>', array);
                        return array;
                    } else {
                        if (trace) trace.fail('<sort>');
                        return undefined;
                    }
                },
                group: function(expr, context, trace) {
                    var result = evalExpr(firstExpr(expr), context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var array, i, j, k, l;
                        var temp = findChild(expr, "with");
                        var temp2 = temp.getAttribute("names").split(",");
                        var context2 = clone(context);
                        var aa = temp2[0].trim();
                        var bb = temp2[1].trim();
                        var stmt = firstExpr(temp);
                        var output = {};
                        var bg;
                        if (result.length === 0) {
                            array = {};
                        } else {
                            array = [
                                [result[0]]
                            ];
                            l = 0;
                            for (i = 1; i < result.length; i++) {
                                bg = true;
                                for (k = l; k >= 0; k--) {
                                    context2[aa] = array[k][array[k].length - 1];
                                    context2[bb] = result[i];
                                    if (evalStmt(stmt, context2, output)) {
                                        array[k].push(result[i]);
                                        bg = false;
                                        break;
                                    }
                                }
                                if (bg) {
                                    array.push([result[i]]);
                                    l++;
                                }
                            }
                        }
                        if (trace) trace.success('<group>', array);
                        return array;
                    } else {
                        if (trace) trace.fail('<group>');
                        return undefined;
                    }
                },
                delay: function(expr, context, trace) {
                    var result = evalExpr(firstExpr(expr), context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        action = result;
                        var temp = findChild(expr, "by");
                        result = evalExpr(temp, context, trace ? trace.create() : null);
                        if (typeof result !== 'undefined') {
                            if (trace) trace.success('<delay>', true);
                            return function() {
                                setTimeout(function() {
                                    action();
                                }, result);
                                trace = trace ? trace.create() : null;
                                if (trace) trace.success('DONE', true);
                            };
                        } else {
                            if (trace) trace.fail('<delay>');
                            return undefined;
                        }
                    } else {
                        if (trace) trace.fail('<delay>');
                        return undefined;
                    }
                },
                each: function(expr, context, trace) {
                    var result = evalExpr(firstExpr(expr), context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var list = result;
                        if (trace) trace.success('<each>', true);
                        return function() {
                            for (var i = 0; i < list.length; i++) {
                                list[i]();
                            }
                            trace = trace ? trace.create() : null;
                            if (trace) trace.success('DONE', true);
                        };
                    } else {
                        if (trace) trace.fail('<each>');
                        return undefined;
                    }
                },
                send: function(expr, context, trace) {
                    var result = evalExpr(firstExpr(expr), context, trace ? trace.create() : null);
                    var chname = expr.getAttribute("channel");
                    if (typeof result !== 'undefined') {
                        var channel = lib.channels[chname];
                        if (trace) trace.success('<send channel="' + chname + '">', true);
                        return function() {
                            channel.send(result);
                            trace = trace ? trace.create() : null;
                            if (trace) trace.success('DONE', true);
                        };
                    } else {
                        if (trace) trace.fail('<send channel="' + chname + '">');
                        return undefined;
                    }
                },
                get: function(expr, context, trace) {
                    var result = evalExpr(firstExpr(expr), context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var url = result;
                        var succexpr = findChild(expr, "success");
                        var resultname = succexpr.getAttribute("result");
                        var errexpr = findChild(expr, "error");
                        var msgname = errexpr.getAttribute("message");
                        if (trace) trace.success('<get>', true);
                        return function() {
                            var xmlhttp = new XMLHttpRequest();
                            xmlhttp.onreadystatechange = function() {
                                if (xmlhttp.readyState === 4) {
                                    var local = clone(context);
                                    // local[applet.statename] = applet.instances[id];
                                    if (xmlhttp.status === 200) {
                                        local[resultname] = xmlhttp.responseText;
                                        result = evalExpr(firstExpr(succexpr), local, trace ? trace.create() : null);
                                        if (typeof result !== 'undefined') {
                                            result();
                                        }
                                    } else {
                                        local[msgname] = xmlhttp.responseText;
                                        result = evalExpr(firstExpr(errexpr), local, trace ? trace.create() : null);
                                        if (typeof result !== 'undefined') {
                                            result();
                                        }

                                    }
                                }
                            };
                            xmlhttp.open("GET", url, true);
                            xmlhttp.send();
                            trace = trace ? trace.create() : null;
                            if (trace) trace.success('DONE', true);
                        };
                    } else {
                        if (trace) trace.fail('<get>');
                        return undefined;
                    }
                },
                post: function(expr, context, trace) {
                    var result = evalExpr(firstExpr(expr), context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        var url = result;
                        result = evalExpr(findChild(expr, "params"), context, trace ? trace.create() : null);
                        var params;
                        if (typeof result !== 'undefined') {
                            params = result;
                        } else {
                            return undefined;
                        }
                        var succexpr = findChild(expr, "success");
                        var resultname = succexpr.getAttribute("result");
                        var errexpr = findChild(expr, "error");
                        var msgname = errexpr.getAttribute("message");
                        if (trace) trace.success('<post>', true);
                        return function() {
                            var xmlhttp = new XMLHttpRequest();
                            xmlhttp.onreadystatechange = function() {
                                if (xmlhttp.readyState === 4) {
                                    var local = clone(context);
                                    // local[applet.statename] = applet.instances[id];
                                    if (xmlhttp.status === 200) {
                                        local[resultname] = xmlhttp.responseText;
                                        result = evalExpr(succexpr, local, trace ? trace.create() : null);
                                        if (typeof result !== 'undefined') {
                                            result();
                                        }
                                    } else {
                                        local[msgname] = xmlhttp.responseText;
                                        result = evalExpr(errexpr, local, trace ? trace.create() : null);
                                        if (typeof result !== 'undefined') {
                                            result();
                                        }

                                    }
                                }
                            };
                            xmlhttp.open("POST", url, true);
                            var FD = new FormData();
                            for (var key in params) {
                                FD.append(key, params[key]);
                            }
                            xmlhttp.send(FD);
                            trace = trace ? trace.create() : null;
                            if (trace) trace.success('DONE', true);
                        };
                    } else {
                        if (trace) trace.fail('<post>');
                        return undefined;
                    }
                },
            };
            var alg = algs[expr.nodeName];
            return alg(expr, context, trace);
        };

        var evalStmt = function(stmt, context, output, trace) {
            function list(output) {
                var result = "";
                for (var v in output) {
                    result += v + " ";
                }
                return result;
            }
            var algs = {
                is: function(stmt, context, output, trace) {
                    var result = (typeof evalExpr(firstExpr(stmt), context, trace ? trace.create() : null)) !== 'undefined';
                    if (result) {
                        if (trace) trace.success('<is>', true);
                    } else {
                        if (trace) trace.fail('<is>');
                    }
                    return result;
                },
                def: function(stmt, context, output, trace) {
                    var name = stmt.getAttribute("var");
                    var result = evalExpr(firstExpr(stmt), context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        output[name] = result;
                        if (trace) trace.success('<def var="' + name + '">', true);
                        return true;
                    } else {
                        if (trace) trace.fail('<def var="' + name + '">');
                        return false;
                    }
                },
                not: function(stmt, context, output, trace) {
                    var result = {};
                    if (evalStmt(firstExpr(stmt), context, result, trace ? trace.create() : null)) {
                        if (trace) trace.fail('<not>');
                        return false;
                    } else {
                        if (trace) trace.success('<not>', true);
                        return true;
                    }
                },
                all: function(stmt, context, output, trace) {
                    var temp = getChildren(stmt);
                    var context2 = clone(context);
                    for (var i = 0; i < temp.length; i++) {
                        if (!evalStmt(temp[i], context2, output, trace ? trace.create() : null)) {
                            if (trace) trace.fail('<all>');
                            return false;
                        }
                        for (var prop in output) {
                            context2[prop] = output[prop];
                        }
                    }
                    if (trace) trace.success('<all>', true);
                    return true;
                },
                any: function(stmt, context, output, trace) {
                    var prop;
                    var result = {};
                    var temp = getChildren(stmt);
                    for (var i = 0; i < temp.length; i++) {
                        if (evalStmt(temp[i], context, output, trace ? trace.create() : null)) {
                            if (trace) trace.success('<any>', true);
                            return true;
                        }
                    }
                    if (trace) trace.fail('<any>');
                    return false;
                },
                unwrap: function(stmt, context, output, trace) {
                    var prop;
                    var result = evalExpr(firstExpr(stmt), context, trace ? trace.create() : null);
                    if (typeof result !== 'undefined') {
                        for (prop in result) {
                            output[prop] = result[prop];
                        }
                        if (trace) trace.success('<unwrap>', true);
                        return true;
                    } else {
                        if (trace) trace.fail('<unwrap>');
                        return false;
                    }
                }
            };
            var alg = algs[stmt.nodeName];
            return alg(stmt, context, output, trace);
        };

        this.evalExpr = evalExpr;
        this.evalStmt = evalStmt;
    } //Engine

    function Library(xml, debug, parent, id, varlist, chlist, applist, typelist) { //only xml is always required; debug is debugger interface (optional); other parameters are for import 
        var prop, temp, name, i;
        this.id = id; //this library's id in the parent library
        this.debug = debug;
        this.parent = parent;
        // this.active = false;
        this.pending = 0;
        this.channels = {};
        this.applets = {};
        this.types = {};
        this.queue = [];
        this.globals = {
            core: new Core(this) //more globals will be added at init
        };
        this.idlelist = [];
        this.extensions = {};
        var extname = xml.getAttribute("extension");
        if (extname) {
            var extension = extensions[extname];
            extension(extender(this));
        }
        this.varlist = varlist;
        this.chlist = chlist;
        this.applist = applist;
        this.typelist = typelist;
        this.resumelist = [this];
        //read globals
        this.common = [];
        temp = findChildren(xml, "common");
        if (temp.length > 0) {
            temp = getChildren(temp[0]);
            for (i = 0; i < temp.length; i++) {
                this.common.push(temp[i]);
            }
        }
        var exports = findChildren(xml, "export");
        if (exports.length > 0) {
            //read channels for export
            temp = findChildren(exports[0], "channel");
            for (i = 0; i < temp.length; i++) {
                name = temp[i].getAttribute("name");
                this.channels[name] = new Channel(temp[i], this);
            }
            //read types for export
            temp = findChildren(exports[0], "typedef");
            for (i = 0; i < temp.length; i++) {
                name = temp[i].getAttribute("name");
                this.types[name] = firstExpr(temp[i]);
            }
        }
        //read channels
        temp = findChildren(xml, "channel");
        for (i = 0; i < temp.length; i++) {
            name = temp[i].getAttribute("name");
            this.channels[name] = new Channel(temp[i], this);
        }
        //read applets
        temp = findChildren(xml, "applet");
        for (i = 0; i < temp.length; i++) {
            name = temp[i].getAttribute("name");
            this.applets[name] = new Applet(temp[i], this);
        }
        //read types
        temp = findChildren(xml, "typedef");
        for (i = 0; i < temp.length; i++) {
            name = temp[i].getAttribute("name");
            this.types[name] = firstExpr(temp[i]);
        }
        //start importing 
        temp = findChildren(xml, "import");
        for (i = 0; i < temp.length; i++) {
            var vtemp = [];
            var ctemp = [];
            var atemp = [];
            var ttemp = [];
            var liburl = temp[i].getAttribute("library");
            var libid = temp[i].getAttribute("id");
            var attr;
            // import variable
            var vars = findChildren(temp[i], "data");
            for (var j = 0; j < vars.length; j++) {
                attr = vars[j].getAttribute("name");
                vtemp.push(attr);
            }
            // // import channel
            var channels = findChildren(temp[i], "channel");
            for (j = 0; j < channels.length; j++) {
                attr = channels[j].getAttribute("name");
                ctemp.push(attr);
            }
            // // import applet
            var applets = findChildren(temp[i], "applet");
            for (j = 0; j < applets.length; j++) {
                attr = applets[j].getAttribute("name");
                atemp.push(attr);
            }
            // // import type
            var types = findChildren(temp[i], "typedef");
            for (j = 0; j < types.length; j++) {
                attr = types[j].getAttribute("name");
                ttemp.push(attr);
            }
            // var debug2 = !parent ? debug : null; //only top 2 levels are to be traced
            loadLib(liburl, null, this, libid, vtemp, ctemp, atemp, ttemp); //request child library import
            this.pending++;
        }
        if (this.pending === 0) { //if no imports, initialize right now
            this.init();
        }
    } //Library

    Library.prototype.path = function() {
        if (this.id) {
            var path = this.id;
            var lib = this.parent;
            while (lib.id) {
                path = lib.id + '::' + path;
                lib = lib.parent;
            }
            return path;
        } else {
            return '<main>';
        }
    };

    Library.prototype.init = function() {
        var channel, temp, i, name, applet;
        var debug = this.debug;
        var eng = new Engine(this);

        //initialize data
        for (i = 0; i < this.common.length; i++) {
            if (!eng.evalStmt(this.common[i], this.globals, this.globals)) {
                if (debug) debug.exception("Common section failed");
                throw "Common section failed";
            }
        }
        // delete this.common;
        //find targets for each channel
        for (name in this.applets) {
            applet = this.applets[name];
            for (var prop in applet.channels) {
                var ch = applet.channels[prop];
                if (prop in this.channels) {
                    var target = {
                        applet: applet,
                        data: ch.data,
                        expr: ch.expr,
                        name: prop
                    };
                    channel = this.channels[prop];
                    channel.targets.push(target);
                }
            }
        }
        //initialize applet extensions
        for (name in this.extensions) {
            var extension = this.extensions[name];
            try {
                extension.init(this.channels, this.globals, eng);
            } catch (ex) {}

        }

        if (this.parent) { //now we can pass this library's exports to parent library, if any
            // delete this.varlist;
            // delete this.chlist;
            // delete this.applist;
            for (i = 0; i < this.idlelist.length; i++) {
                this.parent.idlelist.push(this.idlelist[i]);
            }
            for (i = 0; i < this.resumelist.length; i++) {
                this.parent.resumelist.push(this.resumelist[i]);
            }
            this.parent.doimport(this, this.id, this.varlist, this.chlist, this.applist, this.typelist);
        } else {
            mainlib = this;
            if (debug) {
                debug.init(this.globals, this.applets, this.channels, this.extensions);
            }
            resume(); //the main library initialized - start it
        }
    };

    Library.prototype.doimport = function(childlib, id, vars, chs, apps, types) {
        //a child library was initialized - import definitions
        var prop, i;
        for (i = 0; i < types.length; i++) {
            prop = types[i];
            if (prop in childlib.types) {
                this.types[id + '::' + prop] = childlib.types[prop];
            } else {
                console.log("type " + prop + " not found in library " + id);
            }
        }
        for (i = 0; i < vars.length; i++) {
            prop = vars[i];
            if (prop in childlib.globals) {
                this.globals[id + '::' + prop] = childlib.globals[prop];
            } else {
                console.log("variable " + prop + " not found in library " + id);
            }
        }
        for (i = 0; i < chs.length; i++) {
            prop = chs[i];
            if (prop in childlib.channels) {
                this.channels[id + '::' + prop] = childlib.channels[prop];
            } else {
                console.log("channel " + prop + " not found in library " + id);
            }
        }
        for (i = 0; i < apps.length; i++) {
            prop = apps[i];
            if (prop in childlib.applets) {
                this.applets[id + '::' + prop] = childlib.applets[prop];
            } else {
                console.log("applet " + prop + " not found in library " + id);
            }
        }
        //if all children initialized, initialize itself
        if (--this.pending === 0) {
            this.init();
        }
    };

    Library.prototype.resume = function() {
        var lib = this;
        var name;
        var applet;
        var elements;
        var element;
        var id;
        var i;
        var action;
        for (name in lib.applets) {
            applet = lib.applets[name];
            for (id in applet.instances) {
                element = document.getElementById(id);
                if (element) {
                    // applet.render(id, element);
                } else {
                    applet.destroy(id); //destroy obsolete instances
                }
            }
        }
        for (name in lib.applets) {
            applet = lib.applets[name];
            elements = document.getElementsByClassName(applet.class());
            for (i = 0; i < elements.length; i++) {
                element = elements[i];
                id = element.getAttribute("id");
                if (!id || !applet.exists(id)) {
                    applet.create(element); //create new instances
                }
            }
        }
        //execute all actions in queue
        for (i = 0; i < lib.queue.length; i++) {
            action = lib.queue[i];
            action();
        }
        lib.queue = [];
        if (!lib.active && !lib.parent) { //nothing more to do - run idle functions
            for (i = 0; i < lib.idlelist.length; i++) {
                try {
                    lib.idlelist[i]();
                } catch (e) {}
            }
        }
    };

    var libcache = {};

    function loadLib(url, debug, parent, id, varlist, chlist, applist, typelist) {
        var lib;
        var prop;
        if (url in libcache) { //optimisation: avoid reading library with same URL again
            lib = new Library(libcache[url].childNodes[0], debug, parent, id, varlist, chlist, applist, typelist);
        } else {
            asyncRequest('GET', url,
                function(xml) {
                    if (debug) debug.load(url, xml);
                    lib = new Library(xml.childNodes[0], debug, parent, id, varlist, chlist, applist, typelist);
                    console.log("library " + url + " loaded");
                    libcache[url] = xml;
                });
        }
    }

    var extensions = {};

    var extender = function(lib) {
        return {
            idle: function(plugin) {
                lib.idlelist.push(plugin);
            },
            add: function(name, plugin) {
                if (lib.extensions.hasOwnProperty(name)) {
                    console.log('applet extension ' + name + ' already exists in library ' + lib.path());
                } else {
                    lib.extensions[name] = plugin;
                }
            }
        };
    };

    return {
        version: "0.37",
        start: function(url, debug, pid, uid) {
            if (debug) {
                console.log("Fabula Interpreter v" + this.version + " (debug mode)");
                loadLib(url, debug(pid, uid));
            } else {
                console.log("Fabula Interpreter v" + this.version);
                loadLib(url);
            }
        },
        defineext: function(name, extension) {
            if (extensions.hasOwnProperty(name)) {
                console.log('library extension ' + name + ' already exists');
            } else {
                extensions[name] = extension;
            }
        },
        resume: resume
    };
})();