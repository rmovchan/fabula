/*
 * =======  Fabula Interpreter  =======
 *     © Aha! Factor Pty Ltd, 2016
 *       http://fabwebtools.com
 * ====================================
 */
var Fabula = (function() {
    "use strict";

    var asyncRequest = function(method, uri, callback, postData) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
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
            if (node.childNodes[i].nodeType != 8 && (node.childNodes[i].nodeType != 3 || node.childNodes[i].nodeValue.trim() !== "")) {
                result.push(node.childNodes[i]);
            }
        }
        return result;
    }

    function firstExpr(node) {
        var first = 0;
        while (node.childNodes[first].nodeType == 8 || (node.childNodes[first].nodeType == 3 && node.childNodes[first].nodeValue.trim() === "")) {
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
            if (node.childNodes[i].nodeName.toLowerCase() == name.toLowerCase()) {
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

    var flevel = 0;

    function format(value) {
        var prop;
        var result;

        if (typeof value === "object") {
            result = "";
            if (flevel > 4) {
                return "{ ... }";
            }
            flevel++;
            for (prop in value) {
                if (result.length > 1000) {
                    result += ", ... ";
                    break;
                }
                if (result !== "") {
                    result += ", ";
                }
                result += prop + ": " + format(value[prop]);
            }
            flevel--;
            if (result === "") {
                return "";
            } else {
                return "{" + result + "}";
            }
        } else if (typeof value === "string") {
            if (value.length > 300) {
                return '"' + value.substr(0, 300) + ' ... "';
            } else {
                return '"' + value + '"';
            }
        } else {
            return value;
        }
    }

    var parseQueryString = function(queryString) {
        var params = {},
            queries, temp, i, l;

        // Split into key/value pairs
        queries = queryString.split("&");

        // Convert the array of strings into an object
        for (i = 0, l = queries.length; i < l; i++) {
            temp = queries[i].split('=');
            params[temp[0]] = temp[1];
        }

        return params;
    };

    var core = {
        appletclass: function(name) {
            return "applet-" + name;
        },
        location: {
            url: window.location.href,
            params: parseQueryString(window.location.search.substring(1))
        },
        math: {
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
        },
        time: {
            msec: 1.0,
            sec: 1000.0,
            min: 60000.0,
            hour: 3600000.0,
            date: function(d) {
                return Number(new Date(d.year, d.month, d.day, 0, 0, 0, 0));
            },
            dateOf: function(t) {
                var tmp = new Date(t);
                return Number(new Date(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate(), 0, 0, 0, 0));
            },
            encode: function(arg) {
                return Number(new Date(arg.year, arg.month, arg.day, arg.hours, arg.min, arg.sec, arg.msec));
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
        },
        format: {
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
        },
        string: {
            nbsp: "&nbsp;",
            larr: "&larr;",
            rarr: "&rarr;",
            uarr: "&uarr;",
            darr: "&darr;",
            harr: "&harr;",
            times: "&times;",
            laquo: "&laquo;",
            raquo: "&raquo;",
            lt: "&lt;",
            gt: "&gt;",
            copy: "&copy;",
            amp: "&",
            br: "<br/>",
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
            normalize: function(str) {
                var temp = str.replace(/</g, "&lt;");
                temp = temp.replace(/\"/g, "\\\"");
                return temp.replace(/\'/g, "\\\'");
            },
            toLowerCase: function(str) {
                return str.toLowerCase();
            },
            toUpperCase: function(str) {
                return str.toUpperCase();
            },
        },
        json: {
            parse: function(text) {
                return JSON.parse(text);
            }
        },
        xml: {
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
        },
    };

    function Applet(xml, lib) {
        var trace = null;
        if (xml.hasAttribute("trace") && xml.getAttribute("trace") === "on") {
            trace = lib.trace;
        }
        this.engine = new Engine(lib, trace);
        this.lib = lib;
        this.name = xml.getAttribute("name");
        this.trace = trace;
        this.input = {};
        this.initrandnames = [];
        this.initActions = [];
        this.resprandnames = [];
        this.respActions = [];
        this.extension = xml.getAttribute("extension");
        this.next = 0;
        this.instances = {};
        this.channels = {};
        this.events = {};
        //parse applet's body
        var children = getChildren(xml);
        var temp;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            switch (child.nodeName) {
                case "model":
                    this.statename = child.getAttribute("state");
                    break;
                case "view":
                    this.content = firstExpr(child);
                    break;
                case "init":
                    var id = child.getAttribute("id");
                    // if (!id) {
                    //     id = "id";
                    // }
                    this.idname = id;
                    this.initargname = child.getAttribute("arg");
                    // if (applet.initargname === null) {
                    //     applet.initargname = "arg";
                    // }
                    temp = child.getAttribute("random");
                    if (temp !== null) {
                        this.initrandnames = temp.split(",");
                    }
                    this.initcontentname = child.getAttribute("content");
                    this.inittimename = child.getAttribute("time");
                    temp = findChildren(child, "state");
                    if (temp.length === 1) {
                        this.initState = firstExpr(temp[0]);
                    } else {
                        this.initState = null;
                    }
                    temp = findChildren(child, "actions");
                    if (temp.length === 1) {
                        this.initActions = getChildren(temp[0]);
                    } else {
                        this.initActions = [];
                    }
                    break;
                case "proceed":
                    this.inputname = findChild(child, "on").getAttribute("input");
                    temp = child.getAttribute("random");
                    if (temp !== null) {
                        this.resprandnames = temp.split(",");
                    }
                    this.resptimename = child.getAttribute("time");
                    temp = findChildren(child, "before");
                    if (temp.length === 1) {
                        this.respBefore = getChildren(temp[0]);
                    } else {
                        this.respBefore = [];
                    }
                    this.respState = firstExpr(findChild(child, "state"));
                    temp = findChildren(child, "after");
                    if (temp.length === 1) {
                        this.respAfter = getChildren(temp[0]);
                    } else {
                        this.respAfter = [];
                    }
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
                    temp = getChildren(child);
                    for (var j = 0; j < temp.length; j++) {
                        if (temp[j].hasAttribute("channel")) {
                            this.channels[temp[j].getAttribute("channel")] = {
                                data: child.getAttribute("data"),
                                expr: firstExpr(temp[j])
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

        // if (this.extension) {
        //     if (this.extension in extensions) {
        //         try {
        //             extensions[this.extension].init(lib.channels);
        //             if (trace) trace("extension " + this.extension + " initialized");
        //         } catch (ex) {
        //             if (trace) trace("Exception: " + ex.message);
        //         }
        //     } else {
        //         if (trace) trace("extension " + this.extension + " not found");
        //     }
        // }
    } //Applet

    var handlers = function(applet) {
        return {
            click: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                if (applet.trace) applet.trace("click " + applet.name + "::" + id);
                var local = clone(applet.lib.globals);
                if (applet.statename) {
                    local[applet.statename] = instance;
                }
                if (applet.eventtimename) {
                    local[applet.eventtimename] = (new Date());
                }
                var result = applet.engine.evalExpr(applet.events.click, local);
                if (typeof result != 'undefined') {
                    e.stopPropagation();
                    result(applet, id);
                }
            },
            // focus: function(e) {
            //     var id = e.currentTarget.getAttribute("id");
            //     var instance = applet.instances[id];
            //     if (applet.trace) applet.trace("focus " + applet.name + "::" + id);
            //     applet.local[applet.statename] = instance;
            //     if (applet.eventtimename !== null) {
            //         applet.local[applet.eventtimename] = (new Date());
            //     }
            //     if (engine.evalExpr(applet.events.focus, applet.local, output)) {
            //         e.stopPropagation();
            //         output.result(applet, id);
            //     }
            // },
            // blur: function(e) {
            //     var id = e.currentTarget.getAttribute("id");
            //     var instance = applet.instances[id];
            //     if (applet.trace) applet.trace("blur " + applet.name + "::" + id);
            //     applet.local[applet.statename] = instance;
            //     if (applet.eventtimename !== null) {
            //         applet.local[applet.eventtimename] = (new Date());
            //     }
            //     // applet.local[applet.eventname] = e.currentTarget.value;
            //     if (engine.evalExpr(applet.events.blur, applet.local, output)) {
            //         e.stopPropagation();
            //         output.result(applet, id);
            //     }
            // },
            change: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                var local = clone(applet.lib.globals);
                if (applet.statename) {
                    local[applet.statename] = instance;
                }
                local[applet.eventname] = e.target.value;
                if (trace) trace("change " + applet.name + "::" + id + " : " + format(e.target.value));
                if (applet.eventtimename) {
                    local[applet.eventtimename] = (new Date());
                }
                var result = engine.evalExpr(applet.events.change, local);
                if (typeof result != 'undefined') {
                    e.stopPropagation();
                    result(applet, id);
                }
            },
            input: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                var local = clone(lib.globals);
                if (applet.statename) {
                    local[applet.statename] = instance;
                }
                local[applet.eventname] = e.target.value;
                if (trace) trace("input " + applet.name + "::" + id + " : " + format(e.target.value));
                if (applet.eventtimename !== null) {
                    local[applet.eventtimename] = (new Date());
                }
                var result = engine.evalExpr(applet.events.input, local);
                if (typeof result != 'undefined') {
                    e.stopPropagation();
                    result(applet, id);
                }
            },
            // keypress: function(e) {
            //     var id = e.currentTarget.getAttribute("id");
            //     var instance = applet.instances[id];
            //     e = e || window.event;
            //     var charCode = e.keyCode || e.which;
            //     var charStr = String.fromCharCode(charCode);
            //     applet.local[applet.eventname] = charStr;
            //     if (applet.trace) applet.trace("keypress " + applet.name + "::" + id + " : " + charStr);
            //     applet.local[applet.statename] = instance;
            //     if (applet.eventtimename !== null) {
            //         applet.local[applet.eventtimename] = (new Date());
            //     }
            //     if (engine.evalExpr(applet.events.mouseover, applet.local, output)) {
            //         e.stopPropagation();
            //         // e.preventDefault();
            //         // applet.respond(id, output.result);
            //         output.result(applet, id);
            //     }
            // },
            // mouseover: function(e) {
            //     var id = e.currentTarget.getAttribute("id");
            //     var instance = applet.instances[id];
            //     if (applet.trace) applet.trace("mouseover " + applet.name + "::" + id);
            //     applet.local[applet.statename] = instance;
            //     if (applet.eventtimename !== null) {
            //         applet.local[applet.eventtimename] = (new Date());
            //     }
            //     if (engine.evalExpr(applet.events.mouseover, applet.local, output)) {
            //         e.stopPropagation();
            //         output.result(applet, id);
            //     }
            // },
            // mouseout: function(e) {
            //     var id = e.currentTarget.getAttribute("id");
            //     var instance = applet.instances[id];
            //     if (applet.trace) applet.trace("mouseout " + applet.name + "::" + id);
            //     applet.local[applet.statename] = instance;
            //     if (applet.eventtimename !== null) {
            //         applet.local[applet.eventtimename] = (new Date());
            //     }
            //     if (engine.evalExpr(applet.events.mouseout, applet.local, output)) {
            //         e.stopPropagation();
            //         output.result(applet, id);
            //     }
            // },
            // mousedown: function(e) {
            //     var id = e.currentTarget.getAttribute("id");
            //     var instance = applet.instances[id];
            //     if (applet.trace) applet.trace("mousedown " + applet.name + "::" + id);
            //     applet.local[applet.statename] = instance;
            //     if (applet.eventtimename !== null) {
            //         applet.local[applet.eventtimename] = (new Date());
            //     }
            //     if (engine.evalExpr(applet.events.mousedown, applet.local, output)) {
            //         e.stopPropagation();
            //         output.result(applet, id);
            //     }
            // },
            // mouseup: function(e) {
            //     var id = e.currentTarget.getAttribute("id");
            //     var instance = applet.instances[id];
            //     if (applet.trace) applet.trace("mouseup " + applet.name + "::" + id);
            //     applet.local[applet.statename] = instance;
            //     if (applet.eventtimename !== null) {
            //         applet.local[applet.eventtimename] = (new Date());
            //     }
            //     if (engine.evalExpr(applet.events.mouseup, applet.local, output)) {
            //         e.stopPropagation();
            //         output.result(applet, id);
            //     }
            // }
        };
    };

    Applet.prototype.class = function() {
        var main = this.lib;
        var cl = this.name;
        while (main.parent) {
            cl = main.id + '__' + cl;
            main = main.parent;
        }
        return 'applet-' + cl;
    };

    Applet.prototype.create = function(element) {
        var context = clone(this.lib.globals);
        var arg, i, newid, result, app;
        var trace = this.trace;
        var h = handlers(this);
        if (element) {
            if (element.attributes["data-arg"]) {
                arg = element.attributes["data-arg"].value;
            } else {
                arg = "";
            }
            context[this.initargname] = arg;
            newid = this.class() + '-' + this.next++;
            if (trace) trace("create " + this.name + "::" + newid + " : " + arg);
            for (i = 0; i < this.initrandnames.length; i++) {
                context[this.initrandnames[i]] = Math.random();
            }
            if (this.inittimename) {
                context[this.inittimename] = Number(new Date());
            }
            if (this.initcontentname) {
                context[this.initcontentname] = element.innerHTML;
            }
            context[this.idname] = newid;
            result = this.initState ? this.engine.evalExpr(this.initState, context) : null;
            if (typeof result != 'undefined') {
                this.instances[newid] = result;
                context[this.statename] = result;
                if (trace) trace("init " + this.name + "::" + newid + " : " + format(this.instances[newid]));
                for (var e in this.events) {
                    element.addEventListener(e, h[e]);
                }
                element.id = newid;
                if (this.content) { //render view
                    result = this.engine.evalExpr(this.content, context);
                    if (typeof result != 'undefined') {
                        element.innerHTML = result;
                    } else {
                        if (trace) trace("view " + this.name + "::" + newid + "  failed");
                    }
                }
                if (this.extension) {
                    if (this.extension in this.lib.extensions) {
                        try {
                            this.lib.extensions[this.extension].attach(newid, element, arg);
                        } catch (ex) {
                            if (trace) trace("Exception: " + ex.message);
                        }
                    } else {
                        if (trace) trace("extension " + this.extension + " not found");
                    }
                }
                this.input[newid] = [];
                for (i = 0; i < this.initActions.length; i++) {
                    result = this.engine.evalExpr(this.initActions[i], context);
                    if (typeof result != 'undefined') {
                        result(this, newid);
                    }
                }
                for (var appname in this.lib.applets) {
                    app = this.lib.applets[appname];
                    var elements = element.getElementsByClassName(app.class());
                    for (i = 0; i < elements.length; i++) {
                        var child = elements[i];
                        if (!child.id || !app.exists(child.id)) {
                            app.create(child);
                        }
                    }
                }
                this.lib.resume();
            } else {
                if (trace) trace("init " + this.name + "::" + newid + "  failed");
            }
        }
    };

    Applet.prototype.run = function(id) {
        var i, j, k;
        var instance = this.instances[id];
        var action;
        var queue = this.input[id];
        var prop;
        var appname;
        var result;
        var context = clone(this.lib.globals);
        var trace = this.trace;
        context[this.statename] = instance;
        i = 0;
        while (i < queue.length) {
            context[this.inputname] = queue[i];
            for (j = 0; j < this.resprandnames.length; j++) {
                context[this.resprandnames[j]] = Math.random();
            }
            if (this.resptimename) {
                context[this.resptimename] = (new Date());
            }
            if (trace) trace("proceed " + this.name + "::" + id + " : " + format(queue[i]));
            for (j = 0; j < this.respBefore.length; j++) {
                result = engine.evalExpr(this.respBefore[j], context);
                if (typeof result != 'undefined') {
                    result(this, id);
                }
            }
            result = this.engine.evalExpr(this.respState, context);
            if (typeof result != 'undefined') {
                this.instances[id] = result;
                if (this.content) { //render view
                    context[this.idname] = id;
                    context[this.statename] = result;
                    result = this.engine.evalExpr(this.content, context);
                    if (typeof result != 'undefined') {
                        var element = document.getElementById(id);
                        element.innerHTML = result;
                        for (appname in this.lib.applets) {
                            var app = this.lib.applets[appname];
                            var elements = element.getElementsByClassName(app.class());
                            //recreate children
                            for (k = 0; k < elements.length; k++) {
                                var child = elements[k];
                                var id2 = child.getAttribute("id");
                                if (id2 && app.exists(id2)) {
                                    app.destroy(id2);
                                }
                                app.create(child);
                            }
                        }
                        // if (lib.parent) {
                        //     for (appname in lib.parent.applets) {
                        //         app = applet.library.parent.applets[appname];
                        //         elements = element.getElementsByClassName(app.class());
                        //         for (k = 0; k < elements.length; k++) {
                        //             child = elements[k];
                        //             id2 = child.getAttribute("id");
                        //             if (id2 !== null && id2 !== id) {
                        //                 if (app.exists(id2)) {
                        //                     app.destroy(id2);
                        //                 }
                        //                 app.create(id2, child, app.lib.applets);
                        //             }
                        //         }
                        //     }
                        // }
                    }
                }
                for (j = 0; j < this.respAfter.length; j++) {
                    result = this.engine.evalExpr(this.respAfter[j], context);
                    if (typeof result != 'undefined') {
                        result(this, id);
                    }
                }
                if (this.extension) {
                    if (this.extension in this.lib.extensions) {
                        try {
                            this.lib.extensions[this.extension].react(id, queue[i], context);
                        } catch (ex) {
                            if (trace) trace("Exception: " + ex.message);
                        }
                    } else {
                        if (trace) trace("applet extension " + this.extension + " not found");
                    }
                }
            }
            i++;
        }
        this.input[id] = [];
    };

    Applet.prototype.exists = function(id) {
        return id in this.instances;
    };

    Applet.prototype.respond = function(id, msg) {
        if (id in this.input) {
            this.input[id].push(msg);
            this.lib.resume();
        }
    };

    Applet.prototype.destroy = function(id) {
        if (this.trace) this.trace("destroy " + this.name + "::" + id);
        delete this.instances[id];
        delete this.input[id];
    };


    function Channel(xml, lib) {
        var trace = null;
        if (xml.hasAttribute("trace") && xml.getAttribute("trace") === "on") {
            trace = lib.trace;
        }
        this.lib = lib;
        this.name = xml.getAttribute("name");
        this.trace = trace;
        this.targets = []; //will be added at library init
        this.engine = new Engine(lib, trace);
    }

    Channel.prototype.send = function(data) {
        var output = {};
        if (this.trace) this.trace("send " + this.name + " : " + format(data));
        for (var i = 0; i < this.targets.length; i++) {
            var target = this.targets[i];
            if (this.trace) this.trace("receive " + target.applet.name);
            var local = clone(target.applet.lib.globals);
            local[target.data] = data;
            for (var id in target.applet.instances) {
                var state = target.applet.instances[id];
                local[target.applet.statename] = state;
                var result = this.engine.evalExpr(target.expr, local);
                if (typeof result != 'undefined') {
                    if (this.trace) this.trace("accept " + target.applet.name + "::" + id + " : " + format(data));
                    target.applet.respond(id, result);
                }
            }
        }
    };

    /* Computation engine */
    function Engine(lib, trace) {

        var ser = new XMLSerializer();

        function evalFormula(formula, context) {

            var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|((?:\w+::)?\w+)|(\".*?\")|('.*?')|(`..`)|(#)|(@)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
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
                                return subj1 != subj2;
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
                        // if (token[0] === "null") {
                        //     res = null;
                        // } else {
                        res = context[token];
                        // }
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
                                    if (v in res) {
                                        res = res[v];
                                    } else {
                                        throw "Undefined index";
                                    }
                                    next();
                                    break;
                                case "@":
                                    next();
                                    v = parseFactor();
                                    if (v in res) {
                                        res = res[v];
                                    } else {
                                        throw "Undefined key";
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
                next();
                result = parseRelation();
                if (typeof result === 'boolean') { //Fabula has no booleans
                    if (result) {
                        if (trace) trace(formula + " -> success");
                        return null;
                    } else {
                        if (trace) trace(formula + " -> failed");
                        return undefined;
                    }
                }
                if (trace) trace(formula + " -> " + format(result));
                return result;
            } catch (error) {
                if (trace) trace(formula + " -> failed");
                return undefined;
            }
        } //evalFormula

        var evalExpr = function(expr, context) {
            var frmval = function(match, p1) {
                var result = evalFormula(p1, context);
                if (typeof result != 'undefined') {
                    return result;
                } else {
                    throw "Fail";
                }
            };
            var frmpat = /\[%(.*?)%\]/g;

            if (expr.nodeType == 3) {
                return evalFormula(expr.nodeValue.trim(), context);
            }

            var algs = {
                invalid: function(expr, context) {
                    return undefined;
                },
                calc: function(expr, context) {
                    var prop, stmt, result = {};
                    var where = getChildren(expr);
                    // var context2 = clone(context);
                    for (var i = where.length - 1; i > 0; i--) {
                        stmt = firstExpr(where[i]);
                        if (!evalStmt(stmt, context, context)) {
                            //     for (prop in result) {
                            //         context2[prop] = result[prop];
                            //     }
                            // } else {
                            if (trace) trace("calc -> failed");
                            return undefined;
                        }
                    }
                    return evalExpr(where[0], context);
                },
                text: function(expr, context) {
                    var children = getChildren(expr);
                    var temp = "";
                    for (var i = 0; i < children.length; i++) {
                        if (children[i].nodeType != 8) {
                            if (children[i].nodeType === 1 && children[i].nodeName === "array") {
                                var result = evalExpr(children[i], context);
                                if (typeof result != 'undefined') {
                                    for (var j = 0; j < result.length; j++) {
                                        temp += result[j];
                                    }
                                } else {
                                    return undefined;
                                }
                            } else {
                                temp += ser.serializeToString(children[i]);
                            }
                        }
                    }
                    try {
                        return temp.replace(frmpat, frmval);
                    } catch (e) {
                        if (trace) trace("text -> failed");
                        return undefined;
                    }
                },
                list: function(expr, context) {
                    var temp = getChildren(expr);
                    array.length = temp.length;
                    for (var i = 0; i < temp.length; i++) {
                        var result = evalExpr(temp[i], context);
                        if (typeof result != 'undefined') {
                            array[i] = result;
                        } else {
                            if (trace) trace("list -> failed");
                            return undefined;
                        }
                    }
                    return array;
                },
                entries: function(expr, context) {
                    var temp = findChildren(expr, "entry");
                    var obj = {};
                    for (var i = 0; i < temp.length; i++) {
                        var temp2 = firstExpr(temp[i]);
                        var result = evalExpr(temp2, context);
                        if (typeof result != 'undefined') {
                            temp2 = result;
                            var temp3 = firstExpr(findChild(temp[i], "value"));
                            result = evalExpr(temp3, context);
                            if (typeof result != 'undefined') {
                                obj[temp2] = result;
                            } else {
                                if (trace) trace("entries -> failed");
                                return undefined;
                            }
                        } else {
                            if (trace) trace("entries -> failed");
                            return undefined;
                        }
                    }
                    if (trace) trace("entries -> " + format(obj));
                    return obj;
                },
                array: function(expr, context) {
                    var temp = firstExpr(findChild(expr, "size"));
                    var array = [];
                    var result = evalExpr(temp, context);
                    if (typeof result != 'undefined') {
                        var l = result;
                        var item = findChild(expr, "item");
                        var idxname = item.getAttribute("index");
                        var context2 = clone(context);
                        for (var i = 0; i < l; i++) {
                            context2[idxname] = i;
                            result = evalExpr(firstExpr(item), context2);
                            if (typeof result != 'undefined') {
                                array.push(result);
                            } else {
                                trace("array -> failed");
                                return undefined;
                            }
                        }
                    } else {
                        if (trace) trace("array -> failed");
                        return undefined;
                    }
                    if (trace) trace("array -> " + format(array));
                    return array;
                },
                dictionary: function(expr, context) {
                    var temp = firstExpr(findChild(expr, "size"));
                    var obj = {};
                    var result = evalExpr(temp, context);
                    if (typeof result != 'undefined') {
                        temp = result;
                        var item = findChild(expr, "entry");
                        var idxname = item.getAttribute("index");
                        var context2 = clone(context);
                        for (i = 0; i < temp; i++) {
                            context2[idxname] = i;
                            result = evalExpr(firstExpr(item), context2);
                            if (typeof result != 'undefined') {
                                var temp2 = result; //key
                                var temp3 = firstExpr(findChild(item, "value"));
                                result = evalExpr(temp3, context2);
                                if (typeof result != 'undefined') {
                                    obj[temp2] = result; //value
                                } else {
                                    if (trace) trace("dictionary -> failed");
                                    return undefined;
                                }
                            } else {
                                if (trace) trace("dictionary -> failed");
                                return undefined;
                            }
                        }
                    } else {
                        if (trace) trace("dictionary -> failed");
                        return undefined;
                    }
                    if (trace) trace("dictionary -> " + format(obj));
                    return obj;
                },
                keys: function(expr, context) {
                    var result = evalExpr(firstExpr(expr), context);
                    var array = [];
                    if (typeof result != 'undefined') {
                        for (var prop in result) {
                            array.push(prop);
                        }
                        if (trace) trace("keys -> " + format(array));
                        return array;
                    } else {
                        if (trace) trace("keys -> failed");
                        return undefined;
                    }
                },
                noitems: function(expr, context) {
                    return [];
                },
                noentries: function(expr, context) {
                    return {};
                },
                join: function(expr, context) {
                    var temp = getChildren(expr);
                    var l = 0;
                    for (var i = 0; i < temp.length; i++) {
                        var result = evalExpr(temp[i], context);
                        if (typeof result != 'undefined') {
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
                    if (trace) trace("join -> " + format(array));
                    return array;
                },
                merge: function(expr, context) {
                    var temp = getChildren(expr);
                    var l = 0;
                    var obj = {};
                    for (var i = 0; i < temp.length; i++) {
                        var result = evalExpr(temp[i], context);
                        if (typeof result != 'undefined') {
                            for (var prop in result) {
                                obj[prop] = result[prop];
                            }
                        }
                    }
                    if (trace) trace("merge -> " + format(obj));
                    return obj;
                },
                alter: function(expr, context) {
                    var temp = firstExpr(expr);
                    var obj = {};
                    var result = evalExpr(temp, context);
                    if (typeof result != 'undefined') {
                        for (var prop in result) {
                            obj[prop] = result[prop];
                        }
                        temp = findChildren(expr, "set");
                        for (var i = 0; i < temp.length; i++) {
                            result = evalExpr(firstExpr(temp[i]), context);
                            if (typeof result != 'undefined') {
                                prop = temp[i].getAttribute("prop");
                                obj[prop] = result;
                            } else {
                                return undefined;
                            }
                        }
                        if (trace) trace("alter -> " + format(obj));
                        return obj;
                    } else {
                        if (trace) trace("alter -> failed");
                        return undefined;
                    }
                },
                closure: function(expr, context) {
                    var arg = findChild(expr, "arg");
                    var argname = arg.getAttribute("name");
                    var ret = firstExpr(findChild(expr, "return"));
                    var context2 = clone(context);
                    return function(x) {
                        context2[argname] = x;
                        var result = evalExpr(ret, context2);
                        if (typeof result != 'undefined') {
                            if (trace) trace("<closure>(" + format(x) + ") -> " + format(result));
                            return result;
                        } else {
                            if (trace) trace("<closure>(" + format(x) + ") -> failed");
                            throw "Fail";
                        }
                    };
                },
                wrap: function(expr, context) {
                    var output = {};
                    if (evalStmt(firstExpr(expr), context, output)) {
                        return output;
                    } else {
                        return undefined;
                    }
                },
                find: function(expr, context) {
                    var temp = firstExpr(expr);
                    var result = evalExpr(temp, context);
                    if (typeof result != 'undefined') {
                        array = result;
                        temp = findChild(expr, "such");
                        var argname = temp.getAttribute("item");
                        var context2 = clone(context);
                        var output = {};
                        for (var i = 0; i < array.length; i++) {
                            context2[argname] = array[i];
                            if (evalStmt(firstExpr(temp), context2, output)) {
                                if (trace) trace("find -> " + format(array[i]));
                                return array[i];
                            }
                        }
                        if (trace) trace("find -> failed");
                        return undefined;
                    }
                    if (trace) trace("find -> failed");
                    return undefined;
                },
                filter: function(expr, context) {
                    var temp = firstExpr(expr);
                    var result = evalExpr(temp, context);
                    if (typeof result != 'undefined') {
                        var array2 = [];
                        var output = {};
                        array = result;
                        temp = findChild(expr, "such");
                        var argname = temp.getAttribute("item");
                        var context2 = clone(context);
                        for (var i = 0; i < array.length; i++) {
                            context2[argname] = array[i];
                            if (evalStmt(firstExpr(temp), context2, output)) {
                                array2.push(array[i]);
                            }
                        }
                        if (trace) trace("filter -> " + format(array2));
                        return array2;
                    } else {
                        if (trace) trace("filter -> failed");
                        return undefined;
                    }
                },
                count: function(expr, context) {
                    var temp = firstExpr(expr);
                    var count = 0;
                    var result = evalExpr(temp, context);
                    if (typeof result != 'undefined') {
                        var output = {};
                        array = result;
                        temp = findChild(expr, "such");
                        var argname = temp.getAttribute("item");
                        var context2 = clone(context);
                        for (var i = 0; i < array.length; i++) {
                            context2[argname] = array[i];
                            if (evalStmt(firstExpr(temp), context2, output)) {
                                count++;
                            }
                        }
                        if (trace) trace("count -> " + count);
                        return count;
                    } else {
                        if (trace) trace("count -> failed");
                        return undefined;
                    }
                },
                foldl: function(expr, context) {
                    return undefined;
                },
                foldr: function(expr, context) {
                    return undefined;
                },
                sort: function(expr, context) {
                    var result = evalExpr(firstExpr(expr), context);
                    if (typeof result != 'undefined') {
                        var array = result.slice();
                        var temp = findChild(expr, "with");
                        var temp2 = temp.getAttribute("names").split(",");
                        var context2 = clone(context);
                        var aa = temp2[0].trim();
                        var bb = temp2[1].trim();
                        var temp3 = firstExpr(temp);
                        var sortfun = function(a, b) {
                            var output = {};
                            context2[aa] = a;
                            context2[bb] = b;
                            var result = evalStmt(temp3, context2, output);
                            if (typeof result != 'undefined') {
                                return -1;
                            } else {
                                context2[aa] = b;
                                context2[bb] = a;
                                result = evalStmt(temp3, context2, output);
                                if (typeof result != 'undefined') {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            }
                        };
                        if (trace) trace("sort -> success");
                        return array.sort(sortfun);
                    } else {
                        if (trace) trace("sort -> failed");
                        return undefined;
                    }
                },
                delay: function(expr, context) {
                    var result = evalExpr(firstExpr(expr), context);
                    if (typeof result != 'undefined') {
                        action = result;
                        var temp = findChild(expr, "by");
                        result = evalExpr(temp, context);
                        if (typeof result != 'undefined') {
                            if (trace) trace("delay -> success");
                            return function(applet, id) {
                                setTimeout(function() {
                                    action(applet, id);
                                }, result);
                            };
                        } else {
                            if (trace) trace("delay -> failed");
                            return undefined;
                        }
                    } else {
                        if (trace) trace("delay -> failed");
                        return undefined;
                    }
                },
                take: function(expr, context) {
                    var result = evalExpr(firstExpr(expr), context);
                    if (typeof result != 'undefined') {
                        if (trace) trace("take -> success");
                        return function(applet, id) {
                            if (trace) trace("perform take " + applet.name + "::" + id);
                            applet.respond(id, result);
                        };
                    } else {
                        if (trace) trace("take -> failed");
                        return undefined;
                    }
                },
                each: function(expr, context) {
                    var result = evalExpr(firstExpr(expr), context);
                    if (typeof result != 'undefined') {
                        var list = result;
                        if (trace) trace("each -> success");
                        return function(applet, id) {
                            if (trace) trace("perform each " + applet.name + "::" + id);
                            for (var i = 0; i < list.length; i++) {
                                list[i](applet, id);
                            }
                        };
                    } else {
                        if (trace) trace("each -> failed");
                        return undefined;
                    }
                },
                send: function(expr, context) {
                    var result = evalExpr(firstExpr(expr), context);
                    if (typeof result != 'undefined') {
                        var channel = lib.channels[expr.getAttribute("channel")];
                        return function(applet, id) {
                            if (trace) trace("perform send " + applet.name + "::" + id + " data " + format(result) + " to " + expr.getAttribute("channel"));
                            channel.send(result);
                        };
                    } else {
                        if (trace) trace("send -> failed");
                        return undefined;
                    }
                },
                get: function(expr, context) {
                    var result = evalExpr(firstExpr(expr), context);
                    if (typeof result != 'undefined') {
                        var url = result;
                        var succexpr = findChild(expr, "success");
                        var resultname = succexpr.getAttribute("result");
                        var errexpr = findChild(expr, "error");
                        var msgname = errexpr.getAttribute("message");
                        return function(applet, id) {
                            if (trace) trace("perform get " + applet.name + "::" + id);
                            var xmlhttp = new XMLHttpRequest();
                            xmlhttp.onreadystatechange = function() {
                                if (xmlhttp.readyState == 4) {
                                    var local = clone(lib.globals);
                                    local[applet.statename] = applet.instances[id];
                                    if (xmlhttp.status == 200) {
                                        if (trace) trace("get-response: " + format(xmlhttp.responseText));
                                        local[resultname] = xmlhttp.responseText;
                                        result = evalExpr(succexpr, local);
                                        if (typeof result != 'undefined') {
                                            if (trace) trace("get success processing");
                                            result(applet, id);
                                        }
                                    } else {
                                        if (trace) trace("get-error: " + format(xmlhttp.responseText));
                                        local[msgname] = xmlhttp.responseText;
                                        result = evalExpr(errexpr, local);
                                        if (typeof result != 'undefined') {
                                            if (trace) trace("get error processing");
                                            result(applet, id);
                                        }

                                    }
                                }
                            };
                            xmlhttp.open("GET", url, true);
                            xmlhttp.send();
                        };
                    } else {
                        if (trace) trace("get -> failed");
                        return undefined;
                    }
                },
                post: function(expr, context) {
                    var result = evalExpr(firstExpr(expr), context);
                    if (typeof result != 'undefined') {
                        var url = result;
                        result = evalExpr(findChild(expr, "params"), context);
                        var params;
                        if (typeof result != 'undefined') {
                            params = result;
                        } else {
                            if (trace) trace("post -> failed");
                            return undefined;
                        }
                        var succexpr = findChild(expr, "success");
                        var resultname = succexpr.getAttribute("result");
                        var errexpr = findChild(expr, "error");
                        var msgname = errexpr.getAttribute("message");
                        return function(applet, id) {
                            if (trace) trace("perform post " + applet.name + "::" + id);
                            var xmlhttp = new XMLHttpRequest();
                            xmlhttp.onreadystatechange = function() {
                                if (xmlhttp.readyState == 4) {
                                    var local = clone(lib.globals);
                                    local[applet.statename] = applet.instances[id];
                                    if (xmlhttp.status == 200) {
                                        if (trace) trace("post-response: " + format(xmlhttp.responseText));
                                        local[resultname] = xmlhttp.responseText;
                                        result = evalExpr(succexpr, local);
                                        if (typeof result != 'undefined') {
                                            if (trace) trace("post success processing");
                                            result(applet, id);
                                        }
                                    } else {
                                        if (trace) trace("post-error: " + format(xmlhttp.responseText));
                                        local[msgname] = xmlhttp.responseText;
                                        result = evalExpr(errexpr, local);
                                        if (typeof result != 'undefined') {
                                            if (trace) trace("post error processing");
                                            result(applet, id);
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
                        };
                    } else {
                        if (trace) trace("post -> failed");
                        return undefined;
                    }
                },
                setform: function(expr, context) {
                    return undefined;
                },
            };
            var alg = algs[expr.nodeName];
            return alg(expr, context);
        };

        var evalStmt = function(stmt, context, output) {
            function list() {
                var result = "";
                for (var v in output) {
                    result += v + " ";
                }
                return result;
            }
            var algs = {
                is: function(stmt, context, output) {
                    return (typeof evalExpr(firstExpr(stmt), context)) != 'undefined';
                },
                def: function(stmt, context, output) {
                    var name = stmt.getAttribute("var");
                    var result = evalExpr(firstExpr(stmt), context);
                    if (typeof result != 'undefined') {
                        output[name] = result;
                        if (trace) trace("def " + name + ": " + format(result));
                        return true;
                    } else {
                        if (trace) trace("def " + name + " -> failed");
                        return false;
                    }
                },
                not: function(stmt, context, output) {
                    var result = {};
                    if (evalStmt(firstExpr(stmt), context, result)) {
                        if (trace) trace("not -> failed");
                        return false;
                    } else {
                        if (trace) trace("not -> success");
                        return true;
                    }
                },
                all: function(stmt, context, output) {
                    // var prop;
                    // var result = {};
                    // var context2 = clone(context);
                    var temp = getChildren(stmt);
                    for (var i = 0; i < temp.length; i++) {
                        if (!evalStmt(temp[i], context, output)) {
                            // for (prop in result) {
                            // context2[prop] = result[prop];
                            // output[prop] = result[prop];
                            // }
                            // result = {};
                            // } else {
                            if (trace) trace("all -> failed");
                            return false;
                        }
                    }
                    if (trace) trace("all " + list() + "-> success");
                    return true;
                },
                any: function(stmt, context, output) {
                    var prop;
                    var result = {};
                    var temp = getChildren(stmt);
                    for (var i = 0; i < temp.length; i++) {
                        if (evalStmt(temp[i], context, output)) {
                            // for (prop in result) {
                            //     output[prop] = result[prop];
                            // }
                            if (trace) trace("any " + list() + "-> success");
                            return true;
                        }
                    }
                    if (trace) trace("any -> failed");
                    return false;
                },
                unwrap: function(stmt, context, output) {
                    var prop;
                    var result = evalExpr(firstExpr(stmt), context);
                    if (typeof result != 'undefined') {
                        for (prop in result) {
                            output[prop] = result[prop];
                        }
                        if (trace) trace("unwrap " + list() + "-> success");
                        return true;
                    } else {
                        if (trace) trace("unwrap -> failed");
                        return false;
                    }
                }
            };
            var alg = algs[stmt.nodeName];
            return alg(stmt, context, output);
        };

        this.evalExpr = evalExpr;
        this.evalStmt = evalStmt;
    } //Engine

    function Library(xml, parent, id, varlist, chlist, applist) { //only xml is always required; other parameters are for import 
        var trace = null;
        if (xml.hasAttribute("trace") && xml.getAttribute("trace") === "on") {
            trace = function(msg) {
                console.log(msg);
            };
        }
        var prop, temp, name, i;
        this.id = id; //this library's id in the parent library
        this.trace = trace;
        this.parent = parent;
        this.active = false;
        this.pending = 0;
        this.channels = {};
        this.applets = {};
        this.globals = {
            core: clone(core) //more globals will be added at init
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

        var lib = this;
        this.globals.core.appletclass = function(name) {
            if (name in lib.applets) {
                return lib.applets[name].class();
            } else {
                return '';
            }
        };
        this.common = [];
        //read globals
        temp = findChildren(xml, "common");
        if (temp.length > 0) {
            temp = getChildren(temp[0]);
            for (i = 0; i < temp.length; i++) {
                this.common.push(temp[i]);
            }
        }
        //readd channels
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
        //start importing 
        temp = findChildren(xml, "import");
        for (i = 0; i < temp.length; i++) {
            var vtemp = [];
            var ctemp = [];
            var atemp = [];
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
            this.pending++;
            loadLib(liburl, this, libid, vtemp, ctemp, atemp); //request child library import
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
        var trace = this.trace;
        var eng = new Engine(this, trace);

        if (trace) trace("initializing library " + this.path());
        //initialize data
        for (i = 0; i < this.common.length; i++) {
            if (!eng.evalStmt(this.common[i], this.globals, this.globals)) {
                throw "Common section failed";
            }
        }
        delete this.common;
        //find targets for each channel
        for (name in this.applets) {
            applet = this.applets[name];
            for (var prop in applet.channels) {
                var ch = applet.channels[prop];
                if (prop in this.channels) {
                    var target = {
                        applet: applet,
                        data: ch.data,
                        expr: ch.expr
                    };
                    channel = this.channels[prop];
                    if (trace) trace("applet " + name + " listens channel " + prop);
                    channel.targets.push(target);
                }
            }
        }
        //initialize applet extensions
        for (name in this.extensions) {
            var extension = this.extensions[name];
            try {
                extension.init(this.channels);
                if (trace) trace("applet extension " + name + " initialized");
            } catch (ex) {
                if (trace) trace("Exception: " + ex.message);
            }

        }

        if (this.parent) { //now we can pass this library's exports to parent library, if any
            this.parent.doimport(this, this.id, this.varlist, this.chlist, this.applist);
            delete this.varlist;
            delete this.chlist;
            delete this.applist;
        } else {
            this.resume(); //the main library initialized - start it
        }
    };

    Library.prototype.doimport = function(childlib, id, vars, chs, apps) {
        //a child library was initialized - import definitions
        var trace = this.trace;
        if (trace) trace("importing " + childlib.path() + " into " + this.path());
        var prop, i;
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
        if (!this.active) {
            this.active = true;
            var lib = this;
            var trace = this.trace;
            setTimeout(function() {
                var name;
                var applet;
                var elements;
                var element;
                var id;
                var ids;
                var i;
                lib.active = false;
                // trace('RUN ' + this.path());
                for (name in lib.applets) {
                    applet = lib.applets[name];
                    for (id in applet.instances) {
                        element = document.getElementById(id);
                        if (!element) {
                            applet.destroy(id);
                        } else {
                            applet.run(id);
                        }
                    }
                }
                ids = [];
                for (name in lib.applets) {
                    applet = lib.applets[name];
                    elements = document.getElementsByClassName(applet.class());
                    for (i = 0; i < elements.length; i++) {
                        element = elements[i];
                        id = element.getAttribute("id");
                        if (!id || !applet.exists(id)) {
                            // if (!applet.exists(id)) {
                            // applet.create(id, element, lib.applets);
                            ids.push({
                                applet: applet,
                                element: element
                            });
                            // }
                        }
                    }
                }
                for (i in ids) {
                    ids[i].applet.create(ids[i].element, ids[i].applet.lib.applets);
                }
                if (lib.parent) lib.parent.resume();
                if (!lib.active) { //nothing more to do - run idle functions
                    if (trace && !lib.parent) trace("idle");
                    for (i = 0; i < lib.idlelist.length; i++) {
                        try {
                            lib.idlelist[i]();
                        } catch (e) {}
                    }
                }
            });
        }
    };

    var libcache = {};
    var pending = 0; //number of asynchronous loadLibs

    function loadLib(url, parent, id, varlist, chlist, applist) {
        var lib;
        var prop;
        if (url in libcache) { //optimisation: avoid reading library with same URL again
            lib = new Library(libcache[url].childNodes[0], parent, id, varlist, chlist, applist);
        } else {
            pending++;
            asyncRequest('GET', url,
                function(xml) {
                    lib = new Library(xml.childNodes[0], parent, id, varlist, chlist, applist);
                    console.log("library " + url + " loaded");
                    pending--;
                    libcache[url] = xml;
                });
        }
    }

    var extensions = {};

    var extender = function(lib) {
        return {
            id: function() {
                return lib.id;
            },
            idle: function(plugin) {
                lib.idlelist.push(plugin);
            },
            add: function(name, plugin) {
                if (name in lib.extensions) {
                    console.log('applet extension ' + name + ' already exists in library ' + lib.path());
                } else {
                    lib.extensions[name] = plugin;
                }
            }
        };
    };

    return {
        version: "0.28",
        start: function(url) {
            console.log("Fabula Interpreter v" + this.version);
            loadLib(url);
        },
        defineext: function(name, extension) {
            if (name in extensions) {
                console.log('library extension ' + name + ' already exists');
            } else {
                extensions[name] = extension;
            }
        }
    };
})();