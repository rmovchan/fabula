/*
 * =======  Fabula Interpreter  =======
 *     © Aha! Factor Pty Ltd, 2015
 *       http://fabwebtools.com
 * ====================================
 */
var Fabula = (function() {

    var trace = function(msg) {
        console.log(msg);
    };

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

    function single(a, name) {
        if (a.length > 1) {
            throw "More than one " + name;
        } else if (a.length === 0) {
            throw "Missing " + name;
        }
        return a[0];
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
        // delay: function(arg) {
        //     return function(applet, id) {
        //         setTimeout(function() {
        //             arg.action(applet, id);
        //         }, arg.by);
        //     };
        // },
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

    var resume;
    var pending = 0;

    /* 
        Run-time expression processing

    */

    function ExprEngine(actions) {

        function evalFormula(formula, context, output) {

            var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|(\w+)|(\".*?\")|('.*?')|(`..`)|(#)|(@)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
            var match;
            var token;
            var result;
            var level = 0;
            function next() {
                match = scanner.exec(formula);
                if(match) {
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
                            if(!(token === "(" || token === "[" || token === "@" || token === ".")) break;
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
                                    if (res.hasOwnProperty(v)) {
                                        res = res[v];
                                    } else {
                                        throw "Undefined index";
                                    }
                                    next();
                                    break;
                                case "@":
                                    next();
                                    v = parseFactor();
                                    if (res.hasOwnProperty(v)) {
                                        res = res[v];
                                    } else {
                                        throw "Undefined key";
                                    }
                                    break;
                                case ".":
                                    next();
                                    if (res.hasOwnProperty(token)) {
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
                if (result === true || result === false) { //Fabula has no booleans
                    // if (result) {
                    //     if (trace) trace(formula + " -> success");
                    // } else {
                    //     if (trace) trace(formula + " -> failed");
                    // }
                    return result;
                }
                output.result = result;
                // if (trace) trace(formula + " -> " + format(result));
                return true;
            } catch (error) {
                // if (trace) trace(formula + " -> failed");
                return false;
            }
        }

        // function cast(value, type) {
        //     var name;
        //     var i;
        //     var l;
        //     var array = [];
        //     var obj = {};

        //     if (type.hasOwnProperty("integer") || type.hasOwnProperty("number")) {
        //         if (typeof value === "number") {
        //             return value;
        //         } else {
        //             throw "Fail";
        //         }
        //     } else if (type.hasOwnProperty("time")) {
        //         if (typeof value === "number") {
        //             return value;
        //         } else if (typeof value === "object" && value.hasOwnProperty("getTime")) {
        //             return value.getTime();
        //         } else {
        //             throw "Fail";
        //         }
        //     } else if (type.hasOwnProperty("string")) {
        //         if (typeof value === "string") {
        //             return value;
        //         } else {
        //             throw "Fail";
        //         }
        //     } else if (type.hasOwnProperty("array")) {
        //         if (typeof value === "object" && value.hasOwnProperty("length")) {
        //             l = value.length;
        //             array.length = l;
        //             for (i = 0; i < l; i++) {
        //                 array[i] = cast(value[i], type.array);
        //             }
        //             return array;
        //         } else {
        //             throw "Fail";
        //         }
        //     } else if (type.hasOwnProperty("prop")) {
        //         name = type.prop.name;
        //         if (typeof value === "object" && value.hasOwnProperty(name)) {
        //             return value[name];
        //         } else {
        //             throw "Fail";
        //         }
        //     } else if (type.hasOwnProperty("all")) {
        //         l = type.all.length;
        //         for (i = 0; i < l; i++) {
        //             if (type.all[i].hasOwnProperty("prop") && value.hasOwnProperty(type.all[i].prop.name)) {
        //                 obj[type.all[i].prop.name] = cast(value[type.all[i].prop.name], type.all[i].prop.type);
        //             } else {
        //                 throw "Fail";
        //             }
        //         }
        //         return obj;
        //     } else if (type.hasOwnProperty("any")) {
        //         l = type.any.length;
        //         for (i = 0; i < l; i++) {
        //             if (type.any[i].hasOwnProperty("prop") && value.hasOwnProperty(type.any[i].prop.name)) {
        //                 try {
        //                     obj[type.any[i].prop.name] = cast(value[type.any[i].prop.name], type.any[i].prop.type);
        //                     return obj;
        //                 } catch (error) {}
        //             }
        //         }
        //         throw "Fail";
        //     }
        //     return value;
        // }

        function evalExpr(expr, context, output) {
            var stmt;
            var where;
            var i;
            var j;
            var l;
            var result = {};
            var context2 = {};
            var output2 = {};
            var prop;
            var array = [];
            var array2 = [];
            var obj = {};
            var parser;
            var xmlDoc;
            var temp;
            var temp2;
            var temp3;
            var action;
            var item;
            var idxname;
            var arg;
            var argname;
            var chame;
            var ret;
            var frmpat = /\[%(.*?)%\]/g;
            var info;
            var children;
            var success;
            var msgname;
            var err;
            var attrname;

            var frmval = function(match, p1) {
                if (evalFormula(p1, context, output)) {
                    return output.result;
                } else {
                    throw "Fail";
                }
            };

            try {
                if (expr.nodeType == 3) {
                    return evalFormula(expr.nodeValue.trim(), context, output);
                }

                // if(trace) trace("evalExpr " + expr.nodeName);

                switch (expr.nodeName) {
                    case "invalid":
                        output.result = undefined;
                        return false;
                    case "text":
                        children = getChildren(expr);
                        var ser = new XMLSerializer();
                        temp = "";
                        for (i = 0; i < children.length; i++) {
                            if (children[i].nodeType != 8) {
                                temp += ser.serializeToString(children[i]);
                            }
                        }
                        // temp = ser.serializeToString(expr);
                        // temp = expr.innerHTML.trim();
                        output.result = temp.replace(frmpat, frmval);
                        // if (trace) trace("text : " + temp + " -> " + format(output.result));
                        break;
                    case "eval":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            if (window.DOMParser) {
                                parser = new DOMParser();
                                xmlDoc = parser.parseFromString(result.result, "text/xml");
                            } else {
                                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                                xmlDoc.async = false;
                                xmlDoc.loadXML(result.result);
                            }
                            return evalExpr(xmlDoc.childNodes[0], context, output);
                        } else {
                            output.result = undefined;
                            return false;
                        }
                        break;
                    case "cast":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            // temp = findChild(expr, "to");
                            // info = analyzeType(firstExpr(temp), {
                            //     types: [],
                            //     vars: []
                            // });
                            // output.result = cast(result.result, info.type);
                            output.result = result.result;
                            // if (trace) trace("cast : " + format(output.result));
                        } else {
                            output.result = undefined;
                            // if (trace) trace("cast : failed");
                            return false;
                        }
                        break;
                    case "list":
                        temp = getChildren(expr);
                        array.length = temp.length;
                        for (i = 0; i < temp.length; i++) {
                            if (evalExpr(temp[i], context, result)) {
                                array[i] = result.result;
                            } else {
                                output.result = undefined;
                                // if (trace) trace("list : failed");
                                return false;
                            }
                        }
                        output.result = array;
                        // if (trace) trace("list : " + format(result.result));
                        break;
                    case "entries":
                        temp = findChildren(expr, "entry");
                        for (i = 0; i < temp.length; i++) {
                            temp2 = firstExpr(temp[i]);
                            if (evalExpr(temp2, context, result)) {
                                temp2 = result.result;
                                temp3 = firstExpr(findChild(temp[i], "value"));
                                if (evalExpr(temp3, context, result)) {
                                    obj[temp2] = result.result;
                                } else {
                                    output.result = undefined;
                                    // if (trace) trace("entries : failed");
                                    return false;
                                }
                            } else {
                                output.result = undefined;
                                // if (trace) trace("entries : failed");
                                return false;
                            }
                        }
                        output.result = obj;
                        // if (trace) trace("entries : " + format(obj));
                        break;
                    case "array":
                        temp = firstExpr(findChild(expr, "size"));
                        if (evalExpr(temp, context, result)) {
                            l = result.result;
                            item = findChild(expr, "item");
                            idxname = item.getAttribute("index");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            for (i = 0; i < l; i++) {
                                context2[idxname] = i;
                                if (evalExpr(firstExpr(item), context2, result)) {
                                    array.push(result.result);
                                } else {
                                    output.result = undefined;
                                    // trace("array : failed");
                                    return false;
                                }
                            }
                        } else {
                            output.result = undefined;
                            // if (trace) trace("array : failed");
                            return false;
                        }
                        output.result = array;
                        // if (trace) trace("array : " + format(array));
                        break;
                    case "dictionary":
                        temp = firstExpr(findChild(expr, "size"));
                        if (evalExpr(temp, context, result)) {
                            temp = result.result;
                            item = findChild(expr, "entry");
                            idxname = item.getAttribute("index");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            for (i = 0; i < temp; i++) {
                                context2[idxname] = i;
                                if (evalExpr(firstExpr(item), context2, result)) {
                                    temp2 = result.result; //key
                                    temp3 = firstExpr(findChild(item, "value"));
                                    if (evalExpr(temp3, context2, result)) {
                                        obj[temp2] = result.result; //value
                                    } else {
                                        output.result = undefined;
                                        // if (trace) trace("dictionary : failed");
                                        return false;
                                    }
                                } else {
                                    output.result = undefined;
                                    // if (trace) trace("dictionary : failed");
                                    return false;
                                }
                            }
                        } else {
                            output.result = undefined;
                            // if (trace) trace("dictionary : failed");
                            return false;
                        }
                        output.result = obj;
                        // if (trace) trace("dictionary : " + format(obj));
                        break;
                    case "keys":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            for (prop in result.result) {
                                array.push(prop);
                            }
                            output.result = array;
                            // if (trace) trace("keys : " + format(array));
                        } else {
                            // if (trace) trace("keys : failed");
                            return false;
                        }
                        break;
                    case "range":
                        temp = firstExpr(findChild(expr, "from"));
                        if (evalExpr(temp, context, result)) {
                            temp = result.result;
                            temp2 = firstExpr(findChild(expr, "to"));
                            if (evalExpr(temp2, context, result) && result.result >= temp) {
                                temp2 = result.result;
                                array.length = temp2 - temp;
                                for (i = temp; i < temp2; i++) {
                                    array[i - temp] = i;
                                }
                            } else {
                                output.result = undefined;
                                return false;
                            }
                        } else {
                            output.result = undefined;
                            return false;
                        }
                        output.result = array;
                        break;
                    case "noitems":
                        output.result = [];
                        break;
                    case "noentries":
                        output.result = {};
                        break;
                    case "join":
                        temp = getChildren(expr);
                        // l = 0;
                        for (i = 0; i < temp.length; i++) {
                            if (evalExpr(temp[i], context, output)) {
                                temp[i] = output.result;
                                // l += output.result.length;
                            }
                        }
                        // array.length = l;
                        l = 0;
                        for (i = 0; i < temp.length; i++) {
                            for (j = 0; j < temp[i].length; j++) {
                                array[l] = temp[i][j];
                                l++;
                            }
                        }
                        output.result = array;
                        break;
                    case "merge":
                        temp = getChildren(expr);
                        l = 0;
                        for (i = 0; i < temp.length; i++) {
                            if (evalExpr(temp[i], context, output)) {
                                for (prop in output.result) {
                                    obj[prop] = output.result[prop];
                                }
                            }
                        }
                        output.result = obj;
                        break;
                    case "alter":
                        temp = firstExpr(expr);
                        if (evalExpr(temp, context, output)) {
                            for (prop in output.result) {
                                obj[prop] = output.result[prop];
                            }
                            temp = findChildren(expr, "set");
                            for (i = 0; i < temp.length; i++) {
                                if (evalExpr(firstExpr(temp[i]), context, output)) {
                                    prop = temp[i].getAttribute("prop");
                                    obj[prop] = output.result;
                                } else {
                                    return false;
                                }
                            }
                            output.result = obj;
                        } else {
                            return false;
                        }
                        break;
                    case "calc":
                        where = getChildren(expr);
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        for (i = where.length - 1; i > 0; i--) {
                            stmt = firstExpr(where[i]);
                            if (evalStmt(stmt, context2, result)) {
                                for (prop in result) {
                                    context2[prop] = result[prop];
                                }
                            } else {
                                output.result = undefined;
                                return false;
                            }
                        }
                        return evalExpr(where[0], context2, output);
                    case "closure":
                        arg = findChild(expr, "arg");
                        argname = arg.getAttribute("name");
                        ret = firstExpr(findChild(expr, "return"));
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        output.result = function(x) {
                            var funcout = {};
                            context2[argname] = x;
                            if (evalExpr(ret, context2, funcout)) {
                                // if (trace) trace("invoke(" + format(x) + ") -> " + format(funcout.result));
                                return funcout.result;
                            } else {
                                // if (trace) trace("invoke(" + format(x) + ") -> failed");
                                throw "Fail";
                            }
                        };
                        break;
                    case "wrap":
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        for (i = 0; i < stmt.childNodes.length; i++) {
                            if (stmt.childNodes[i].nodeType != 3) {
                                if (evalStmt(stmt.childNodes[i], context2, result)) {
                                    for (prop in result) {
                                        context2[prop] = result[prop];
                                        output2[prop] = result[prop];
                                    }
                                    result = {};
                                } else {
                                    return false;
                                }
                            }
                        }
                        output.result = output2;
                        break;
                    case "find":
                        temp = firstExpr(expr);
                        if (evalExpr(temp, context, output)) {
                            array = output.result;
                            temp = findChild(expr, "such");
                            argname = temp.getAttribute("item");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            for (i = 0; i < array.length; i++) {
                                context2[argname] = array[i];
                                if (evalStmt(firstExpr(temp), context2, output2)) {
                                    output.result = array[i];
                                    // if (trace) trace("find : " + format(output.result));
                                    return true;
                                }
                            }
                            // if (trace) trace("find : failed");
                            return false;
                        }
                        // if (trace) trace("find : failed");
                        return false;
                    case "filter":
                        temp = firstExpr(expr);
                        if (evalExpr(temp, context, output)) {
                            array = output.result;
                            temp = findChild(expr, "such");
                            argname = temp.getAttribute("item");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            for (i = 0; i < array.length; i++) {
                                context2[argname] = array[i];
                                if (evalStmt(firstExpr(temp), context2, output2)) {
                                    array2.push(output2.result);
                                }
                            }
                            output.result = array2;
                            // if (trace) trace("findall : " + array2.length);
                            return true;
                        }
                        return false;
                    case "count":
                        temp = firstExpr(expr);
                        if (evalExpr(temp, context, output)) {
                            array = output.result;
                            temp = findChild(expr, "such");
                            argname = temp.getAttribute("item");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            var count = 0;
                            for (i = 0; i < array.length; i++) {
                                context2[argname] = array[i];
                                if (evalStmt(firstExpr(temp), context2, output2)) {
                                    count++;
                                }
                            }
                            output.result = count;
                            // if (trace) trace("count : " + count);
                            return true;
                        }
                        return false;
                    case "delay":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            action = result.result;
                            temp = firstExpr(findChild(expr, "by"));
                            if (evalExpr(temp, context, result)) {
                                output.result = actions.delay(action, result.result);
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                        break;
                    case "take":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            output.result = actions.take(result.result);
                        } else {
                            return false;
                        }
                        break;
                    case "sort":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            array = result.result.slice();
                            temp = findChild(expr, "with");
                            temp2 = temp.getAttribute("names").split(",");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            var aa = temp2[0].trim();
                            var bb = temp2[1].trim();
                            temp3 = firstExpr(temp);
                            var sortfun = function(a, b) {
                                context2[aa] = a;
                                context2[bb] = b;
                                if (evalStmt(temp3, context2, output)) {
                                    return -1;
                                } else {
                                    context2[aa] = b;
                                    context2[bb] = a;
                                    if (evalStmt(temp3, context2, output)) {
                                        return 1;
                                    } else {
                                        return 0;
                                    }
                                }
                            };
                            output.result = array.sort(sortfun);
                        } else {
                            return false;
                        }
                        break;
                    case "each":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            output.result = actions.each(result.result);
                        } else {
                            return false;
                        }
                        break;
                    case "send":
                        chname = expr.getAttribute("channel");
                        if (evalExpr(firstExpr(expr), context, result)) {
                            output.result = actions.send(chname, result.result);
                        } else {
                            return false;
                        }
                        break;
                    case "get":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            temp = findChild(expr, "success");
                            argname = temp.getAttribute("result");
                            success = firstExpr(temp);
                            temp = findChild(expr, "error");
                            msgname = temp.getAttribute("message");
                            err = firstExpr(temp);
                            output.result = actions.get(result.result, argname, success, msgname, err, context);
                        } else {
                            return false;
                        }
                        break;
                    case "post":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            temp = findChild(expr, "params");
                            params = firstExpr(temp);
                            temp = findChild(expr, "success");
                            argname = temp.getAttribute("result");
                            success = firstExpr(temp);
                            temp = findChild(expr, "error");
                            msgname = temp.getAttribute("message");
                            err = firstExpr(temp);
                            output.result = actions.post(result.result, params, argname, success, msgname, err, context);
                        } else {
                            return false;
                        }
                        break;
                    case "foldl":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            array = result.result;
                            if(array.length === 0)
                                return false;
                            temp = findChild(expr, "into");
                            temp2 = temp.getAttribute("names").split(",");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            var aaa = temp2[0].trim();
                            var bbb = temp2[1].trim();
                            temp3 = firstExpr(temp);
                            output.result = array[0];
                            for(i = 1; i < array.length; i++) {
                                context2[aaa] = output.result;
                                context2[bbb] = array[i];
                                if(evalExpr(temp3, context2, result)) {
                                    output.result = result.result;
                                } else {
                                    return false;
                                }
                            }
                        } else {
                            return false;
                        }
                        break;
                    case "foldr":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            array = result.result;
                            if(array.length === 0)
                                return false;
                            temp = findChild(expr, "into");
                            temp2 = temp.getAttribute("names").split(",");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            var aaaa = temp2[0].trim();
                            var bbbb = temp2[1].trim();
                            temp3 = firstExpr(temp);
                            output.result = array[array.length - 1];
                            for(i = array.length - 2; i >= 0; i--) {
                                context2[bbbb] = output.result;
                                context2[aaaa] = array[i];
                                if(evalExpr(temp3, context2, result)) {
                                    output.result = result.result;
                                } else {
                                    return false;
                                }
                            }
                        } else {
                            return false;
                        }
                        break;
                    case "setform":
                        temp = firstExpr(findChild(expr, "url"));
                        if (evalExpr(temp, context, result)) {
                            var url = result.result;
                            temp = firstExpr(findChild(expr, "formname"));
                            if (evalExpr(temp, context, result)) {
                                var formname = result.result;
                                temp = firstExpr(findChild(expr, "submit"));
                                if (evalExpr(temp, context, result)) {
                                    var submit = result.result;
                                    temp = findChild(expr, "success");
                                    argname = temp.getAttribute("result");
                                    success = firstExpr(temp);
                                    temp = findChild(expr, "error");
                                    msgname = temp.getAttribute("message");
                                    err = firstExpr(temp);
                                    output.result = actions.setform(url, formname, submit, argname, success, msgname, err, context);
                                } else {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                        break;
                    case "setattr":
                        attrname = expr.getAttribute("name");
                        if (evalExpr(firstExpr(expr), context, result)) {
                            output.result = actions.setattr(attrname, result.result);
                        } else {
                            return false;
                        }
                        break;
                    default:
                        return false;
                }
                return true;
            } catch (error) {
                // if (trace) trace(expr.nodeName + " -> failed");
                return false;
            }
        }

        function evalStmt(stmt, context, output) {
            var name;
            var i;
            var prop;
            var context2 = {};
            var stmt2;
            var result = {};
            var temp;

            function list() {
                var result = "";
                for (var v in output) {
                    result += v + " ";
                }
                return result;
            }
            try {
                // if(trace) trace("evalStmt " + stmt.nodeName);

                switch (stmt.nodeName) {
                    case "is":
                        if (evalExpr(firstExpr(stmt), context, result)) {
                            // if (trace) trace("is : success");
                        } else {
                            // if (trace) trace("is : failed");
                            return false;
                        }
                        break;
                    case "not":
                        temp = evalStmt(firstExpr(stmt), context, result);
                        if (temp) {
                            // if (trace) trace("not : failed");
                            return false;
                        } else {
                            // if (trace) trace("not : success");
                            return true;
                        }
                        break;
                    case "def":
                        name = stmt.getAttribute("var");
                        if (evalExpr(firstExpr(stmt), context, result)) {
                            output[name] = result.result;
                            // if (trace) trace("def " + name + " : " + format(result.result));
                        } else {
                            // if (trace) trace("def " + name + " : failed");
                            return false;
                        }
                        break;
                    case "all":
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        temp = getChildren(stmt);
                        for (i = 0; i < temp.length; i++) {
                            if (evalStmt(temp[i], context2, result)) {
                                for (prop in result) {
                                    context2[prop] = result[prop];
                                    output[prop] = result[prop];
                                }
                                result = {};
                            } else {
                                output = {};
                                // if (trace) trace("all : failed");
                                return false;
                            }
                        }
                        // if (trace) trace("all " + list() + ": success");
                        break;
                    case "any":
                        temp = getChildren(stmt);
                        for (i = 0; i < temp.length; i++) {
                            if (evalStmt(temp[i], context, result)) {
                                for (prop in result) {
                                    output[prop] = result[prop];
                                }
                                // if (trace) trace("any " + list() + ": success");
                                return true;
                            }
                        }
                        // if (trace) trace("any : failed");
                        return false;
                    case "unwrap":
                        if (evalExpr(firstExpr(stmt), context, result)) {
                            for (prop in result.result) {
                                output[prop] = result.result[prop];
                            }
                            // if (trace) trace("unwrap " + list() + ": success");
                        } else {
                            // if (trace) trace("unwrap : failed");
                        }
                        break;
                    default:
                        return false;
                }
                return true;
            } catch (error) {
                return false;
            }
        }
        this.evalExpr = evalExpr;
        this.evalStmt = evalStmt;
    }

    /*
     * Run-time objects
     */
    var InvalidStr = core.xml.parseText("<invalid><string/></invalid>");

    function Applet(xml, lib, engine) {
        var temp;
        var children;
        var child;
        var prop;
        this.local = {};
        var i;
        var j;

        this.name = xml.getAttribute("name");
        this.library = lib;
        this.content = InvalidStr;
        this.initState = null;
        this.initActions = [];
        this.respState = null;
        this.respBefore = [];
        this.respAfter = [];
        // this.initcontentname = null;
        // this.inittimename = null;
        this.initrandnames = [];
        this.resprandnames = [];
        this.events = {};
        this.channels = {};
        if (xml.hasAttribute("trace") && xml.getAttribute("trace") == "on") {
            this.trace = trace;
        } else {
            this.trace = null;
        }

        this.id = "id";
        children = getChildren(xml);
        for (i = 0; i < children.length; i++) {
            child = children[i];
            switch (child.nodeName) {
                case "model":
                    this.statename = child.getAttribute("state");
                    break;
                case "view":
                    var id = child.getAttribute("id");
                    if (id === null) {
                        id = "id";
                    }
                    this.idname = id;
                    this.content = firstExpr(child);
                    break;
                case "init":
                    this.initargname = child.getAttribute("arg");
                    if (this.initargname === null) {
                        this.initargname = "arg";
                    }
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
                    for (j = 0; j < temp.length; j++) {
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

        this.instances = {};
        this.input = [];
        this.targets = [];
        this.extensions = [];
        var applet = this;
        this.next = 0;
        this.initialized = false;
        this.initialize = function() {
            for (prop in extensions) {
                var libex = extensions[prop];
                if (libex.prefix === lib.libid && libex.appext.hasOwnProperty(applet.name)) {
                    applet.extensions.push(libex.appext[applet.name]);
                    libex.appext[applet.name].init(lib.channels);
                }
            }
            this.initialized = true;
        };
        var output = {};
        for (prop in lib.context) {
            this.local[prop] = lib.context[prop];
        }


        this.handlers = {
            click: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                if (applet.trace) applet.trace("click " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (applet.eventtimename !== null) {
                    applet.local[applet.eventtimename] = (new Date());
                }
                if (engine.evalExpr(applet.events.click, applet.local, output)) {
                    e.stopPropagation();
                    // e.preventDefault();
                    // applet.respond(id, output.result);
                    output.result(applet, id);
                }
            },
            focus: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                if (applet.trace) applet.trace("focus " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (applet.eventtimename !== null) {
                    applet.local[applet.eventtimename] = (new Date());
                }
                if (engine.evalExpr(applet.events.focus, applet.local, output)) {
                    e.stopPropagation();
                    // e.preventDefault();
                    // applet.respond(id, output.result);
                    output.result(applet, id);
                }
            },
            blur: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                if (applet.trace) applet.trace("blur " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (applet.eventtimename !== null) {
                    applet.local[applet.eventtimename] = (new Date());
                }
                // applet.local[applet.eventname] = e.currentTarget.value;
                if (engine.evalExpr(applet.events.blur, applet.local, output)) {
                    e.stopPropagation();
                    // e.preventDefault();
                    output.result(applet, id);
                    // applet.respond(id, output.result);
                }
            },
            change: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                applet.local[applet.statename] = instance;
                applet.local[applet.eventname] = e.target.value;
                if (applet.trace) applet.trace("change " + applet.name + "::" + id + " : " + format(e.target.value));
                if (applet.eventtimename !== null) {
                    applet.local[applet.eventtimename] = (new Date());
                }
                if (engine.evalExpr(applet.events.change, applet.local, output)) {
                    e.stopPropagation();
                    // e.preventDefault();
                    // applet.respond(id, output.result);
                    output.result(applet, id);
                }
            },
            mouseover: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                if (applet.trace) applet.trace("mouseover " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (applet.eventtimename !== null) {
                    applet.local[applet.eventtimename] = (new Date());
                }
                if (engine.evalExpr(applet.events.mouseover, applet.local, output)) {
                    e.stopPropagation();
                    // e.preventDefault();
                    // applet.respond(id, output.result);
                    output.result(applet, id);
                }
            },
            mouseout: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                if (applet.trace) applet.trace("mouseout " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (applet.eventtimename !== null) {
                    applet.local[applet.eventtimename] = (new Date());
                }
                if (engine.evalExpr(applet.events.mouseout, applet.local, output)) {
                    e.stopPropagation();
                    // e.preventDefault();
                    // applet.respond(id, output.result);
                    output.result(applet, id);
                }
            },
            mousedown: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                if (applet.trace) applet.trace("mousedown " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (applet.eventtimename !== null) {
                    applet.local[applet.eventtimename] = (new Date());
                }
                if (engine.evalExpr(applet.events.mousedown, applet.local, output)) {
                    e.stopPropagation();
                    // e.preventDefault();
                    // applet.respond(id, output.result);
                    output.result(applet, id);
                }
            },
            mouseup: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                if (applet.trace) applet.trace("mouseup " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (applet.eventtimename !== null) {
                    applet.local[applet.eventtimename] = (new Date());
                }
                if (engine.evalExpr(applet.events.mouseup, applet.local, output)) {
                    e.stopPropagation();
                    // e.preventDefault();
                    // applet.respond(id, output.result);
                    output.result(applet, id);
                }
            }
        };

        this.class = function() {
            var main = lib;
            var cl = applet.name;
            while (main.parent) {
                cl = main.libid + '.' + cl;
                main = main.parent;
            }
            return 'applet-' + cl;
        };

        this.create = function(id, element, applets) {
            var i;
            var context = {};
            var prop;
            var child;
            var id2;
            var appname;
            var app;
            var elements;
            var arg;
            var newid;

            if (this.instances.hasOwnProperty(id)) return;

            if (!this.initialized) this.initialize();

            for (prop in this.local) {
                context[prop] = this.local[prop];
            }

            if (element !== null) {
                if (element.attributes["data-arg"]) {
                    arg = element.attributes["data-arg"].value;
                } else {
                    arg = "";
                }
                context[this.initargname] = arg;
                newid = this.class() + '-' + this.next++;
                if (applet.trace) applet.trace("create " + applet.name + "::" + newid + " : " + arg);
                for (i = 0; i < this.initrandnames.length; i++) {
                    context[this.initrandnames[i]] = Math.random();
                }
                if (this.inittimename !== null) {
                    context[this.inittimename] = Number(new Date());
                }
                if (this.initcontentname !== null) {
                    context[this.initcontentname] = element.innerHTML;
                }
                if (this.initState === null || engine.evalExpr(this.initState, context, output)) {
                    if (this.initState !== null) {
                        this.instances[newid] = output.result;
                        context[this.statename] = output.result;
                    } else {
                        this.instances[newid] = null;
                    }
                    if(applet.trace) applet.trace("init " + applet.name + "::" + newid + " : " + format(this.instances[newid]));
                    for (var e in this.events) {
                        element.addEventListener(e, this.handlers[e]);
                    }
                    context[this.idname] = newid;
                    element.id = newid;
                    if (engine.evalExpr(this.content, context, output)) {
                        element.innerHTML = output.result;
                        // element.insertAdjacentHTML("beforeend", output.result);
                    }
                    for (var j in applet.extensions) {
                        try {
                            applet.extensions[j].attach(newid, element, arg);
                        } catch (ex) {
                            if (trace) trace("Exception: " + ex.message);
                        }
                    }
                    this.input[newid] = [];
                    for (i = 0; i < this.initActions.length; i++) {
                        if (engine.evalExpr(this.initActions[i], context, output)) {
                            var action = output.result;
                            action(this, newid);
                        }
                    }
                    for (appname in applets) {
                        app = applets[appname];
                        elements = element.getElementsByClassName(app.class());
                        for (i = 0; i < elements.length; i++) {
                            child = elements[i];
                            if(!child.id || !app.exists(child.id)) {
                                app.create('', child, app.library.applets);
                            }
                            // id2 = child.getAttribute("id");
                            // if (id2 !== null && id2 !== id) {
                            //     if (app.exists(id2)) {
                            //         // app.redraw(id2, applets);
                            //     } else {
                            //         app.create(id2, child, app.library.applets);
                            //     }
                            // }
                        }
                    }
                    lib.resume();
                }
            }
        };
        this.exists = function(id) {
            return this.instances.hasOwnProperty(id);
        };
        this.respond = function(id, msg) {
            if (this.input.hasOwnProperty(id)) {
                this.input[id].push(msg);
                lib.resume();
            }
        };
        this.run = function(id, applets) {
            var i;
            var j;

            var instance = this.instances[id];
            var action;
            var queue = this.input[id];
            var context = {};
            var prop;
            var appname;

            if (!this.initialized) this.initialize();

            for (prop in this.local) {
                context[prop] = this.local[prop];
            }

            context[this.statename] = instance;
            i = 0;
            while (i < queue.length) {
                context[this.inputname] = queue[i];
                for (j = 0; j < this.resprandnames.length; j++) {
                    context[this.resprandnames[j]] = Math.random();
                }
                if (this.resptimename !== null) {
                    context[this.resptimename] = (new Date());
                }
                if (applet.trace) applet.trace("proceed " + applet.name + "::" + id + " : " + format(queue[i]));
                for (j = 0; j < this.respBefore.length; j++) {
                    if (engine.evalExpr(this.respBefore[j], context, output)) {
                        action = output.result;
                        action(this, id);
                    }
                }
                if (this.respState && engine.evalExpr(this.respState, context, output)) {
                    this.instances[id] = output.result;
                    context[this.idname] = id;
                    context[this.statename] = output.result;
                    if (engine.evalExpr(this.content, context, output)) {
                        var element = document.getElementById(id);
                        element.innerHTML = output.result;
                        // element.insertAdjacentHTML("beforeend", output.result);
                        for (appname in applets) {
                            app = applets[appname];
                            elements = element.getElementsByClassName(app.class());
                            for (k = 0; k < elements.length; k++) {
                                child = elements[k];
                                id2 = child.getAttribute("id");
                                if (id2 && app.exists(id2)) {
                                    app.destroy(id2);
                                }
                                app.create(id2, child, app.library.applets);
                            }
                        }
                        if (applet.library.parent) {
                            for (appname in applet.library.parent.applets) {
                                app = applet.library.parent.applets[appname];
                                elements = element.getElementsByClassName(app.class());
                                for (k = 0; k < elements.length; k++) {
                                    child = elements[k];
                                    id2 = child.getAttribute("id");
                                    if (id2 !== null && id2 !== id) {
                                        if (app.exists(id2)) {
                                            app.destroy(id2);
                                        }
                                        app.create(id2, child, app.library.applets);
                                    }
                                }
                            }
                        }
                    }
                    for (j = 0; j < this.respAfter.length; j++) {
                        if (engine.evalExpr(this.respAfter[j], context, output)) {
                            action = output.result;
                            action(this, id);
                        }
                    }
                }
                for (j in applet.extensions) {
                    try {
                        applet.extensions[j].react(id, queue[i]);
                    } catch (ex) {}
                }
                i++;
            }
            this.input[id] = [];
        };
        this.destroy = function(id) {
            if (applet.trace) applet.trace("destroy " + applet.name + "::" + id);
            delete this.instances[id];
            delete this.input[id];
        };
    }

    function Channel(xml, engine) {
        this.name = xml.getAttribute("name");
        this.targets = [];
        this.send = function(data) {
            var prop;
            var output = {};
            if (trace) trace("send " + this.name + " : " + format(data));
            for (var i = 0; i < this.targets.length; i++) {
                var target = this.targets[i];
                var local = {};
                for (prop in target.applet.local) {
                    local[prop] = target.applet.local[prop];
                }
                if (trace) trace("receive " + target.applet.name);
                local[target.data] = data;
                for (var id2 in target.applet.instances) {
                    var state = target.applet.instances[id2];
                    local[target.applet.statename] = state;
                    if (engine.evalExpr(target.expr, local, output)) {
                        if (trace) trace("accept " + target.applet.name + "::" + id2 + " : " + format(data));
                        target.applet.respond(id2, output.result);
                    }
                }
            }
        };
    }

    var libbyurl = {};

    function loadLib(url, receive, parent, id, varlist, chlist, applist) {
        if (libbyurl.hasOwnProperty(url)) {
            if (receive) receive(libbyurl[url], parent, id, varlist, chlist, applist);
        } else {
            pending++;
            asyncRequest('GET', url,
                function(xml) {
                    var lib = new Library(xml.childNodes[0], parent, id);
                    if (trace) trace("library " + url + " loaded");
                    pending--;
                    libbyurl[url] = lib;
                    if (receive) receive(lib, parent, id, varlist, chlist, applist);
                    if (!parent) {
                        mainlib = lib;
                    }
                    if (pending === 0) {
                        mainlib.resume();
                    }
                });
        }
    }

    function Library(xml, parent, libid) {
        this.applets = {};
        this.channels = {};
        var temp;
        var name;
        var output = {};
        var prop;
        var common;
        this.context = {
            core: core
        };
        this.parent = parent;
        this.libid = libid;
        this.active = false;

        var lib = this;
        lib.initialized = false;

        this.actions = {
            each: function(list) {
                return function(applet, id) {
                    if (trace) trace("each " + applet.name + "::" + id);
                    var local = {};
                    for (prop in applet.local) {
                        local[prop] = applet.local[prop];
                    }
                    local[applet.idname] = id;
                    local[applet.statename] = applet.instances[id];
                    for (var i = 0; i < list.length; i++) {
                        list[i](applet, id);
                    }
                };
            },
            send: function(name, msg) {
                return function(applet, id) {
                    if (trace) trace("send " + applet.name + "::" + id + " to: " + name + " data: " + format(msg));
                    var channel = applet.library.channels[name];
                    channel.send(msg);
                };
            },
            setattr: function(name, value) {
                return function(applet, id) {
                    if (trace) trace("setattr " + applet.name + "::" + id + " name: " + name + " value: " + format(value));
                    var element = document.getElementById(id);
                    element[name] = value;
                };
            },
            take: function(msg) {
                return function(applet, id) {
                    if (trace) trace("take " + applet.name + "::" + id);
                    applet.respond(id, msg);
                };
            },
            delay: function(action, interval, context) {
                return function(applet, id) {
                    setTimeout(function() {
                        action(applet, id);
                    }, interval);
                };
            },
            get: function(url, resultname, success, msgname, handler, context) {
                var local = {};
                for (prop in context) {
                    local[prop] = context[prop];
                }
                return function(applet, id) {
                    if (trace) trace("get " + applet.name + "::" + id + " : " + url);
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function() {
                        if (xmlhttp.readyState == 4) {
                            local[applet.idname] = id;
                            local[applet.statename] = applet.instances[id];
                            if (xmlhttp.status == 200) {
                                if (trace) trace("get-response: " + format(xmlhttp.responseText));
                                local[resultname] = xmlhttp.responseText;
                                if (engine.evalExpr(success, local, output)) {
                                    output.result(applet, id);
                                }
                            } else {
                                if (trace) trace("get-error: " + format(xmlhttp.responseText));
                                local[msgname] = xmlhttp.responseText;
                                if (engine.evalExpr(handler, local, output)) {
                                    output.result(applet, id);
                                }

                            }
                        }
                    };
                    xmlhttp.open("GET", url, true);
                    xmlhttp.send();
                };
            },
            post: function(url, params, resultname, success, msgname, handler, context) {
                var local = {};
                for (prop in context) {
                    local[prop] = context[prop];
                }
                return function(applet, id) {
                    if (trace) trace("post " + applet.name + "::" + id + " : " + url);
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function() {
                        if (xmlhttp.readyState == 4) {
                            local[applet.idname] = id;
                            local[applet.statename] = applet.instances[id];
                            if (xmlhttp.status == 200) {
                                if (trace) trace("post-response: " + format(xmlhttp.responseText));
                                local[resultname] = xmlhttp.responseText;
                                if (engine.evalExpr(success, local, output)) {
                                    output.result(applet, id);
                                }
                            } else {
                                if (trace) trace("post-error: " + format(xmlhttp.responseText));
                                local[msgname] = xmlhttp.responseText;
                                if (engine.evalExpr(handler, local, output)) {
                                    output.result(applet, id);
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
            },
            setform: function(url, formname, submit, resultname, success, msgname, handler, context) {
                var local = {};
                for (prop in context) {
                    local[prop] = context[prop];
                }
                return function(applet, id) {
                    if (trace) trace("setform " + applet.name + "::" + id + " url: " + url + " form: " + formname);
                    var form = document.forms.namedItem(formname);
                    if (form) {
                        form.addEventListener('submit', function(ev) {
                            if (trace) trace("post " + formname);
                            var xmlhttp = new XMLHttpRequest();
                            xmlhttp.onreadystatechange = function() {
                                if (xmlhttp.readyState == 4) {
                                    local[applet.idname] = id;
                                    local[applet.statename] = applet.instances[id];
                                    if (xmlhttp.status == 200) {
                                        if (trace) trace("post-response: " + xmlhttp.responseText);
                                        local[resultname] = xmlhttp.responseText;
                                        if (engine.evalExpr(success, local, output)) {
                                            output.result(applet, id);
                                        }
                                    } else {
                                        if (trace) trace("post-error: " + xmlhttp.responseText);
                                        local[msgname] = xmlhttp.responseText;
                                        if (engine.evalExpr(handler, local, output)) {
                                            output.result(applet, id);
                                        }

                                    }
                                }
                            };
                            setTimeout(function() {
                                xmlhttp.open("POST", url, true);
                                var FD = new FormData(form);
                                xmlhttp.send(FD);
                                submit(applet, id);
                            });
                            ev.preventDefault();
                        });
                    } else {
                        if (trace) trace("form " + formname + " not found");
                    }
                    return false;
                };
            },
        };

        lib.context.core.appletclass = function(name) {
            if (lib.applets.hasOwnProperty(name)) {
                return lib.applets[name].class();
            } else {
                return '';
            }
        };
        var engine = new ExprEngine(this.actions);
        var i;
        var j;
        var doimport;
        var vars;
        var applets;
        var channels;
        var attr;
        var p;
        var oldname;
        var newname;
        var skip;
        var channel;

        temp = findChildren(xml, "common");
        if (temp.length > 0) {
            temp = getChildren(temp[0]);
            for (i = 0; i < temp.length; i++) {
                if (!engine.evalStmt(temp[i], lib.context, output)) {
                    throw "Common section failed";
                }
                for (prop in output) {
                    this.context[prop] = output[prop];
                }
            }
        }

        temp = findChildren(xml, "channel");
        for (i = 0; i < temp.length; i++) {
            name = temp[i].getAttribute("name");
            channel = new Channel(temp[i], engine);
            this.channels[name] = channel;
        }

        temp = findChildren(xml, "applet");
        for (i = 0; i < temp.length; i++) {
            name = temp[i].getAttribute("name");
            applet = new Applet(temp[i], lib, engine);
            this.applets[name] = applet;
        }

        for (name in lib.applets) {
            for (prop in lib.applets[name].channels) {
                var ch = lib.applets[name].channels[prop];
                if (lib.channels.hasOwnProperty(prop)) {
                    var target = {applet: lib.applets[name], data: ch.data, expr: ch.expr};
                    channel = lib.channels[prop];
                    if (trace) trace("applet " + name + " listens channel " + channel.name);
                    channel.targets.push(target);
                }
            }
        }

        doimport = function(childlib, parent, id, varlist, chlist, applist) {
            var target;
            var channel;
            var i;
            if (trace) trace("importing library " + id);
            for (i in varlist) {
                prop = varlist[i];
                if (trace) trace("import var " + id + '::' + prop);
                parent.context[id + '::' + prop] = childlib.context[prop];
            }
            for (name in parent.applets) {
                var app = parent.applets[name];
                for (prop in childlib.channels) {
                    if (app.channels.hasOwnProperty(id + '::' + prop)) { //parent's applet listens to child's channel?
                        target = {applet: app, data: app.channels[id + '::' + prop].data, expr: app.channels[id + '::' + prop].expr};
                        channel = childlib.channels[prop];
                        if (trace) trace("applet " + name + " listens channel " + id + '::' + channel.name);
                        channel.targets.push(target);
                    }
                }
            }
            for (i in chlist) {
                prop = chlist[i];
                if (trace) trace("import channel " + id + '::' + prop);
                parent.channels[id + '::' + prop] = childlib.channels[prop];
            }
            for (i in applist) {
                prop = applist[i];
                if (trace) trace("import applet " + id + '::' + prop);
                parent.applets[id + '::' + prop] = childlib.applets[prop];
            }

        };

        temp = findChildren(xml, "import");
        skip = false;
        for (i = 0; i < temp.length; i++) {
            var varlist = [];
            var chlist = [];
            var applist = [];
            var liburl = temp[i].getAttribute("library");
            var id = temp[i].getAttribute("id");
            // import variable
            vars = findChildren(temp[i], "var");
            for (j = 0; j < vars.length; j++) {
                attr = vars[j].getAttribute("name");
                varlist.push(attr);
            }
            // // import channel
            channels = findChildren(temp[i], "channel");
            for (j = 0; j < channels.length; j++) {
                attr = channels[j].getAttribute("name");
                chlist.push(attr);
            }
            // // import applet
            applets = findChildren(temp[i], "applet");
            for (j = 0; j < applets.length; j++) {
                attr = applets[j].getAttribute("name");
                applist.push(attr);
            }
            loadLib(liburl, doimport, lib, id, varlist, chlist, applist);
        }

        lib.resume = function() {
            if (!lib.active) {
                lib.active = true;
                setTimeout(lib.run, 0);
            }
        };

        lib.run = function() {
            var name;
            var applet;
            var elements;
            var element;
            var id;
            var ids;
            var i;
            lib.active = false;
            trace('RUN ' + lib.libid);
            for (name in lib.applets) {
                applet = lib.applets[name];
                for (id in applet.instances) {
                    element = document.getElementById(id);
                    if (element === null) {
                        applet.destroy(id, trace);
                    } else {
                        applet.run(id, applet.library.applets);
                        // if(lib != applet.library)
                        //     applet.library.resume();
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
                                id: id,
                                applet: applet,
                                element: element
                            });
                        // }
                    }
                }
            }
            for (i in ids) {
                ids[i].applet.create(ids[i].id, ids[i].element, ids[i].applet.library.applets);
                // if(lib != ids[i].applet.library)
                //     ids[i].applet.library.resume();
            }
            if (lib.parent) lib.parent.resume();
            if (!this.active) {
                // if (trace) trace("IDLE at " + (new Date()).toTimeString().slice(0, 8));
                for (var ext in extensions) {
                    for (i in extensions[ext].idlelist) {
                        extensions[ext].idlelist[i]();
                    }
                }
            }
        };

    }

    var idle = [];
    var extensions = {};
    // var initialized = false;
    var liburl;
    var mainlib;

    function LibExtension() {
        this.prefix = null;
        this.appext = {};
        this.idlelist = [];
        this.add = function(name, plugin) {
            this.appext[name] = plugin;
        };
        this.idle = function(plugin) {
            this.idlelist.push(plugin);
        };
    }

    return {
        version: "0.25",
        seturl: function(url) {
            liburl = url;
        },
        start: function() {
            console.log("Fabula Interpreter v" + this.version);
            loadLib(liburl, null, null, null);
        },
        defineext: function(name, plugin) {
            var ext = new LibExtension();
            plugin(ext);
            extensions[name] = ext;
            // if (extensions.hasOwnProperty(name)) {
            //     extensions[name].push(plugin);
            // } else {
            //     extensions[name] = [plugin];
            // }
        },
        setid: function(name, prefix) {
            extensions[name].prefix = prefix;
        }
    };
})();
