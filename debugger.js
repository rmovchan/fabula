FabDebugger = function(pid) {
    var firebase = new Firebase("https://fabdebug.firebaseio.com").child(pid);
    var status = 1;
    var reslist = null;
    var format = function(value) {
        temp = function(value, level) {
            var prop;
            var i;
            var result;
            try {
                if (typeof value === 'undefined') {
                    return null;
                } else
                if (!value) {
                    return '[Null]';
                } else
                if (typeof value === "function") {
                    return '[Function]';
                } else
                if (typeof value === "object") {
                    if ('outerHTML' in value) {
                        return '[XMLnode]';
                    }
                    if (level > 4) {
                        return '[Object]';
                    }
                    var count = 0;
                    result = {};
                    for (prop in value) {
                        if (typeof value[prop] !== 'undefined') {
                            result[prop] = temp(value[prop], level + 1);
                            count++;
                        }
                    }
                    if (count === 0) {
                        return '[Null]';
                    }
                    return result;
                } else
                if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                    return value;
                } else {
                    return "[Other]";
                }
            } catch (ex) {
                return '[Other]';
            }
        };
        return temp(value, 0);
    };

    function Trace(ref) {
        this.ref = ref;
        this.clear = function() {
            this.ref.set(null);
        };
        this.success = function(expr, value) {
            this.ref.update({
                expr: expr,
                result: format(value)
            });
        };
        this.fail = function(expr) {
            this.ref.update({
                expr: expr,
                result: null
            });
        };
        this.create = function() {
            var subref = this.ref.child("subexpr");
            return new Trace(subref.push());
        };
    }
    var encodeid = function(id) {
        return id /*.replace(/:/g, '&')*/ ;
    };
    var tracestate = {};
    var traceview = {};
    var traceactions = {};
    return {
        load: function(url, xml) {
            liburl = url;
            firebase.child("status").set(status);
        },
        resume: function(list) {
            if (!reslist) {
                reslist = list;
            }
            if (status === 1) {
                for (var i = 0; i < list.length; i++) {
                    list[i].resume();
                }
            }
        },
        init: function(globals, applets, channels, extensions) {
            var name, chname;
            var fg = format(globals);
            firebase.child("globals").set(fg);
            var ag = {};
            for (name in applets) {
                if (applets[name].name === name) {
                    ag[name] = {
                        name: applets[name].name,
                        channels: {},
                    };
                    for (chname in applets[name].channels) {
                        ag[name].channels[chname] = '';
                    }
                }
            }
            firebase.child("applets").set(ag);
            firebase.child("instances").set(null);
            firebase.child("appinstlist").set(null);
            firebase.child("channeldata").set(null);
            firebase.child("traceinst").set(null);
            firebase.child("traceview").set(null);
            firebase.child("traceactions").set(null);
            var that = this;
            firebase.child("status").on("value", function(snap) {
                if (snap) status = snap.val();
                that.resume(reslist);
            });
        },
        exception: function(message) {},
        create: function(appname, id, context, result) {
            if (typeof result !== "undefined") {
                firebase.child("appinstlist").child(encodeid(appname)).child(encodeid(id)).set('');
                firebase.child("instances").child(encodeid(id)).set(format(result));
            }
        },
        receive: function(appname, id, chname, context, result) {
            if (typeof result !== "undefined") {
                firebase.child("instances").child(encodeid(id)).set(format(result));
            }
        },
        destroy: function(appname, id) {
            firebase.child("appinstlist").child(encodeid(appname)).child(encodeid(id)).set(null);
            firebase.child("instances").child(encodeid(id)).set(null);
            if (id in tracestate) tracestate[id].clear();
            if (id in traceview) traceview[id].clear();
            if (id in traceactions) traceactions[id].clear();
            delete tracestate[id];
            delete traceview[id];
            delete traceactions[id];
        },
        put: function(appname, chname, data) {
            firebase.child("channeldata").child(encodeid(appname)).child(encodeid(chname)).set(format(data));
        },
        tracestate: function(id) {
            if (!(id in tracestate)) {
                var ref = firebase.child("tracestate").child(id);
                var temp = new Trace(ref);
                tracestate[id] = temp;

            }
            return tracestate[id];
        },
        traceview: function(id) {
            if (!(id in traceview)) {
                var ref = firebase.child("traceview").child(id);
                var temp = new Trace(ref);
                traceview[id] = temp;

            }
            return traceview[id];
        },
        traceactions: function(id) {
            if (!(id in traceactions)) {
                var ref = firebase.child("traceactions").child(id);
                var temp = new Trace(ref);
                traceactions[id] = temp;

            }
            return traceactions[id];
        },
    };
};