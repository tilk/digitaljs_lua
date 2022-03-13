
import { luaconf, lua, lauxlib, lualib, to_jsstring, to_luastring } from "fengari-web";
import Backbone from 'backbone';
import _ from 'lodash';
import { Vector3vl } from '3vl';

const {
    luaL_openlibs
} = lualib;
const {
    luaL_checkstring,
    luaL_checkinteger,
    luaL_checknumber,
    luaL_checkudata,
    luaL_optinteger,
    luaL_testudata,
    luaL_newlib,
    luaL_requiref,
    luaL_newstate,
    luaL_newmetatable,
    luaL_setmetatable,
    luaL_loadstring,
    luaL_argcheck,
    luaL_argerror,
    luaL_error,
    luaL_ref,
    luaL_unref
} = lauxlib;
const {
    lua_newtable,
    lua_gettop,
    lua_getglobal,
    lua_getfield,
    lua_isnil,
    lua_rawgeti,
    lua_pop,
    lua_pushcfunction,
    lua_pushinteger,
    lua_pushstring,
    lua_pushboolean,
    lua_pushnil,
    lua_pushvalue,
    lua_newuserdata,
    lua_newthread,
    lua_resume,
    lua_remove,
    lua_setfield,
    lua_setmetatable,
    lua_setglobal,
    lua_isboolean,
    lua_isinteger,
    lua_isstring,
    lua_toboolean,
    lua_tointeger,
    lua_tostring,
    lua_tonumber,
    lua_call,
    lua_pcall,
    lua_error,
    lua_isyieldable,
    lua_yield,
    lua_status,
    LUA_OK,
    LUA_YIELD,
    LUA_REGISTRYINDEX
} = lua;

const LUA_VECTOR3VL = to_luastring("VECTOR3VL");
const LUA_EVENT = to_luastring("EVENT");
                
function protect(L, f) {
    return function() {
        try {
            return f.apply(this, arguments);
        } catch(e) {
            luaL_error(L, e.message);
        }
    }
}

function lprotect(f) {
    return function(L) {
        try {
            return f.apply(this, arguments);
        } catch(e) {
            luaL_error(L, e.message);
        }
    }
}

export class LuaError extends Error {
    constructor(message, luaMessage, luaError) {
        super("Code " + luaError + ": " + message + '\n' + luaMessage);
        this.name = "LuaError";
        this.luaMessage = luaMessage;
        this.luaError = luaError;
    }
}

function lua_handle_error(L, emsg, ret) {
    if (ret != LUA_OK && ret != LUA_YIELD) {
        const lmsg = lua_tostring(L, -1);
        lua_pop(L, 1);
        const msg = lmsg ? to_jsstring(lmsg) : "";
        throw new LuaError(emsg, msg, ret);
    }
    return ret;
}

function lua_load_jsstring_error(L, source) {
    return lua_handle_error(L,
        "Failed loading LUA code:", 
        luaL_loadstring(L, to_luastring(source)));
}

function lua_pcall_error(L, nargs, nresults, msgh) {
    return lua_handle_error(L,
        "Failed running LUA code:",
        lua_pcall(L, nargs, nresults, msgh));
}

function lua_resume_error(L, from, nargs) {
    return lua_handle_error(L,
        "Failed running LUA thread:",
        lua_resume(L, from, nargs));
}

function lua_pushevent(L, v) {
    const udata = lua_newuserdata(L, 0);
    udata.v = v;
    luaL_setmetatable(L, LUA_EVENT);
}

function lua_toevent(L, n) {
    const udata = luaL_testudata(L, n, LUA_EVENT);
    if (udata !== null) return udata.v;
    return null;
}

function lua_checkevent(L, n) {
    const ret = lua_toevent(L, n);
    if (ret === null) luaL_argerror(L, n, "not convertible to event");
    return ret;
}

function lua_push3vl(L, v) {
    const udata = lua_newuserdata(L, 0);
    udata.v = v;
    luaL_setmetatable(L, LUA_VECTOR3VL);
}

function lua_to3vl(L, n, bits) {
    const udata = luaL_testudata(L, n, LUA_VECTOR3VL);
    let ret = null;
    if (udata !== null) ret = udata.v; 
    else if (lua_isboolean(L, n))
        ret = Vector3vl.fromBool(lua_toboolean(L, n), bits);
    else if (lua_isinteger(L, n))
        ret = Vector3vl.fromNumber(lua_tointeger(L, n), bits);
    else if (lua_isstring(L, n)) 
        ret = protect(L, Vector3vl.fromString)(to_jsstring(lua_tostring(L, n)));
    if (ret !== null && bits !== undefined) {
        if (ret.bits < bits)
            ret = udata.v.concat(Vector3vl.zeros(bits - udata.v.bits));
        else if (ret.bits > bits)
            ret = ret.slice(0, bits);
    }
    return ret;
}

function lua_check3vl(L, n, bits) {
    const ret = lua_to3vl(L, n, bits);
    if (ret === null) luaL_argerror(L, n, "not convertible to vec");
    return ret;
}

const veclib = {
    frombin: (L) => {
        const str = luaL_checkstring(L, 1);
        const bits = luaL_optinteger(L, 2, undefined);
        lua_push3vl(L, Vector3vl.fromBin(to_jsstring(str), bits));
        return 1;
    },
    fromoct: (L) => {
        const str = luaL_checkstring(L, 1);
        const bits = luaL_optinteger(L, 2, undefined);
        lua_push3vl(L, Vector3vl.fromOct(to_jsstring(str), bits));
        return 1;
    },
    fromhex: (L) => {
        const str = luaL_checkstring(L, 1);
        const bits = luaL_optinteger(L, 2, undefined);
        lua_push3vl(L, Vector3vl.fromHex(to_jsstring(str), bits));
        return 1;
    },
    frombool: (L) => {
        const b = lua_toboolean(L, 1);
        const bits = luaL_optinteger(L, 2, undefined);
        lua_push3vl(L, Vector3vl.fromBool(b, bits));
        return 1;
    },
    frominteger: (L) => {
        const n = luaL_checknumber(L, 1);
        const bits = luaL_optinteger(L, 2, undefined);
        lua_push3vl(L, Vector3vl.fromNumber(n, bits));
        return 1;
    }
};

const veclibmeta = {
    '__call': (L) => {
        const bits = luaL_optinteger(L, 3, undefined);
        const v = lua_check3vl(L, 2, bits);
        lua_push3vl(L, v);
        return 1;
    }
};

function luaopen_vec(L) {
    const add_method = (name, f) => {
        lua_pushcfunction(L, lprotect((L) => {
            f(L);
            return 1;
        }));
        lua_setfield(L, -2, to_luastring(name));
    }
    const add_unary_method = (f_push, f_check, name, method) => {
        add_method(name, (L) => {
            const lhs = lua_check3vl(L, 1);
            f_push(L, method.call(lhs, f_check(L, 2, lhs.bits)));
        });
    }
    const add_nullary_method = (f_push, name, method) => {
        add_method(name, (L) => {
            f_push(L, method.call(lua_check3vl(L, 1)));
        });
    }
    const add_property = (f_push, name, what, fld) => {
        add_nullary_method(f_push, name, Object.getOwnPropertyDescriptor(what, fld).get);
    }
    luaL_newmetatable(L, LUA_VECTOR3VL);
    add_unary_method(lua_push3vl, lua_check3vl, "__band", Vector3vl.prototype.and);
    add_unary_method(lua_push3vl, lua_check3vl, "__bor", Vector3vl.prototype.or);
    add_unary_method(lua_push3vl, lua_check3vl, "__bxor", Vector3vl.prototype.xor);
    add_unary_method(lua_pushboolean, (L, n) => lua_check3vl(L, n), "__eq", Vector3vl.prototype.eq);
    add_nullary_method(lua_push3vl, "__bnot", Vector3vl.prototype.not);
    add_property(lua_pushinteger, "__len", Vector3vl.prototype, "bits");
    add_method("__call", function(L) {
        const v = lua_check3vl(L, 1);
        const i = luaL_checkinteger(L, 2);
        luaL_argcheck(L, i >= -v.bits && i < v.bits, 2, "index out of bounds");
        const ii = i >= 0 ? i : v.bits + i;
        const j = luaL_optinteger(L, 3, undefined);
        if (j === undefined)
            lua_push3vl(L, Vector3vl.make(1, v.get(ii)));
        else {
            luaL_argcheck(L, j >= 0, "slice count negative");
            lua_push3vl(L, v.slice(ii, ii + j));
        }
        return 1;
    });
    add_unary_method(lua_push3vl, (L, n) => lua_check3vl(L, n), "__concat", function(v) {
        return v.concat(this);
    });
    add_nullary_method(lua_pushstring, "__tostring", Vector3vl.prototype.toBin);
    lua_newtable(L);
    add_unary_method(lua_push3vl, lua_check3vl, "band", Vector3vl.prototype.and);
    add_unary_method(lua_push3vl, lua_check3vl, "bor", Vector3vl.prototype.or);
    add_unary_method(lua_push3vl, lua_check3vl, "bxor", Vector3vl.prototype.xor);
    add_unary_method(lua_push3vl, lua_check3vl, "bnand", Vector3vl.prototype.nand);
    add_unary_method(lua_push3vl, lua_check3vl, "bnor", Vector3vl.prototype.nor);
    add_unary_method(lua_push3vl, lua_check3vl, "bxnor", Vector3vl.prototype.xnor);
    add_nullary_method(lua_push3vl, "bnot", Vector3vl.prototype.not);
    add_nullary_method(lua_push3vl, "xmask", Vector3vl.prototype.xmask);
    add_nullary_method(lua_push3vl, "rand", Vector3vl.prototype.reduceAnd);
    add_nullary_method(lua_push3vl, "ror", Vector3vl.prototype.reduceOr);
    add_nullary_method(lua_push3vl, "rxor", Vector3vl.prototype.reduceXor);
    add_nullary_method(lua_push3vl, "rnand", Vector3vl.prototype.reduceNand);
    add_nullary_method(lua_push3vl, "rnor", Vector3vl.prototype.reduceNor);
    add_nullary_method(lua_push3vl, "rxnor", Vector3vl.prototype.reduceXnor);
    add_nullary_method(lua_pushstring, "tohex", Vector3vl.prototype.toHex);
    add_nullary_method(lua_pushstring, "tobin", Vector3vl.prototype.toBin);
    add_nullary_method(lua_pushstring, "tooct", Vector3vl.prototype.toOct);
    add_nullary_method(lua_pushinteger, "tointeger", Vector3vl.prototype.toNumber);
    add_nullary_method(lua_pushinteger, "tointegersigned", Vector3vl.prototype.toNumberSigned);
    add_property(lua_pushboolean, "ishigh", Vector3vl.prototype, "isHigh");
    add_property(lua_pushboolean, "islow", Vector3vl.prototype, "isLow");
    add_property(lua_pushboolean, "isdefined", Vector3vl.prototype, "isDefined");
    add_property(lua_pushboolean, "isfullydefined", Vector3vl.prototype, "isFullyDefined");
    add_property(lua_pushinteger, "bits", Vector3vl.prototype, "bits");
    lua_setfield(L, -2, to_luastring("__index"));
    lua_pop(L, 1);
    luaL_newlib(L, veclib);
    luaL_newlib(L, veclibmeta);
    lua_setmetatable(L, -2);
    return 1;
};

export class LuaRunner {
    #L;
    #circuit;
    #threads = new Map();
    #pidthreads = new Map();
    #simlib = {
        sleep: (L) => {
            if (!lua_isyieldable(L)) luaL_error(L, "sim.sleep: thread not yieldable");
            const tdata = this.#threads.get(L);
            if (tdata === undefined) luaL_error(L, "sim.sleep: thread not suspendable");
            const delay = luaL_checkinteger(L, 1);
            luaL_argcheck(L, delay > 0, 1, "sim.sleep: too short delay");
            this._enqueue(tdata, this.#circuit.tick + delay);
            lua_yield(L, 0);
        },
        wait: (L) => {
            if (!lua_isyieldable(L)) luaL_error(L, "sim.wait: thread not yieldable");
            const tdata = this.#threads.get(L);
            if (tdata === undefined) luaL_error(L, "sim.wait: thread not suspendable");
            const delay = luaL_optinteger(L, 2, undefined);
            const evt = lua_checkevent(L, 1);
            console.assert(tdata.waitMonitors === undefined);
            tdata.waitMonitors = new Set(evt(L));
            if (delay !== undefined)
                this._enqueue(tdata, this.#circuit.tick + delay);
            lua_yield(L, 0);
        },
        posedge: (L) => {
            const args = lua_gettop(L);
            if (args < 1) luaL_error(L, "sim.posedge: not enough arguments");
            const wire = this._vararg_findwire(L, args, 0);
            if (wire === undefined) luaL_error(L, "sim.posedge: wire not found");
            if (wire.get('bits') != 1) luaL_error(L, "sim.posedge: wire not 1-bit");
            lua_pushevent(L, this._make_event(wire, Vector3vl.one));
            return 1;
        },
        negedge: (L) => {
            const args = lua_gettop(L);
            if (args < 1) luaL_error(L, "sim.negedge: not enough arguments");
            const wire = this._vararg_findwire(L, args, 0);
            if (wire === undefined) luaL_error(L, "sim.negedge: wire not found");
            if (wire.get('bits') != 1) luaL_error(L, "sim.negedge: wire not 1-bit");
            lua_pushevent(L, this._make_event(wire, Vector3vl.zero));
            return 1;
        },
        value: (L) => {
            const args = lua_gettop(L);
            if (args < 2) luaL_error(L, "sim.value: not enough arguments");
            const wire = this._vararg_findwire(L, args, 1);
            if (wire === undefined) luaL_error(L, "sim.value: wire not found");
            const val = lua_check3vl(L, 1, wire.get('bits'));
            lua_pushevent(L, this._make_event(wire, val));
            return 1;
        },
        tick: (L) => {
            lua_pushinteger(L, this.#circuit.tick);
            return 1;
        },
        setinput: (L) => {
            const name = luaL_checkstring(L, 1);
            const inp = this.#circuit.findInputByNet(to_jsstring(name));
            const vec = lua_check3vl(L, 2, inp.get('bits'));
            luaL_argcheck(L, inp !== undefined, 1, "input not found");
            inp.setInput(vec);
            return 0;
        },
        getoutput: (L) => {
            const name = luaL_checkstring(L, 1);
            const out = this.#circuit.findOutputByNet(to_jsstring(name));
            luaL_argcheck(L, out !== undefined, 1, "output not found");
            const res = out.getOutput();
            lua_push3vl(L, res);
            return 1;
        },
        setinput_id: (L) => {
            const name = luaL_checkstring(L, 1);
            const vec = lua_check3vl(L, 2);
            this.#circuit.setInput(to_jsstring(name), vec);
            return 0;
        },
        getoutput_id: (L) => {
            const name = luaL_checkstring(L, 1);
            const res = this.#circuit.getOutput(to_jsstring(name));
            lua_push3vl(L, res);
            return 1;
        },
        getvalue: (L) => {
            const args = lua_gettop(L);
            if (args < 1) luaL_error(L, "sim.getvalue: not enough arguments");
            const wire = this._vararg_findwire(L, args, 0);
            if (wire === undefined) luaL_error(L, "sim.getvalue: wire not found");
            lua_push3vl(L, wire.get('signal'));
            return 1;
        },
        registerdisplay: lprotect((L) => {
            const display = new Display3vlLua({L: L});
            this.#circuit.addDisplay(display);
            // TODO: remove displays on shutdown
            return 0;
        })
    };
    constructor(circuit) {
        const L = this.#L = luaL_newstate();
        this.#circuit = circuit;

        const luaopen_sim = (L) => {
            luaL_newmetatable(L, LUA_EVENT);
            lua_pushcfunction(L, lprotect((L) => {
                const e1 = lua_checkevent(L, 1);
                const e2 = lua_checkevent(L, 2);
                lua_pushevent(L, L => [].concat(e1(L)).concat(e2(L)));
                return 1;
            }));
            lua_setfield(L, -2, to_luastring("__bor"));
            lua_pop(L, 1);
            luaL_newlib(L, this.#simlib);
            return 1;
        };
        luaL_openlibs(L);
        luaL_requiref(L, to_luastring("sim"), luaopen_sim, 1);
        lua_pop(L, 1);
        luaL_requiref(L, to_luastring("vec"), luaopen_vec, 1);
        lua_pop(L, 1);
        lua_pushcfunction(L, lprotect((L) => {
            const n = lua_gettop(L);
            const out = [];
            lua_getglobal(L, to_luastring("tostring", true));
            for (let i = 1; i <= n; i++) {
                lua_pushvalue(L, -1);
                lua_pushvalue(L, i);
                lua_call(L, 1, 1);
                const s = lua_tostring(L, -1);
                if (s === null)
                    return luaL_error(L, to_luastring("'tostring' must return a string to 'print'"));
                out.push(to_jsstring(s));
                lua_pop(L, 1);
            }
            lua_pop(L, 1);
            this.trigger('print', out);
            return 0;
        }));
        lua_setglobal(L, 'print');
    }
    shutdown() {
        this.stopListening();
        this.#threads = undefined;
        this.#pidthreads = undefined;
    }
    _run(source, rets) {
        lua_load_jsstring_error(this.#L, source);
        lua_pcall_error(this.#L, 0, rets, 0);
    }
    run(source) {
        this._run(source, 0);
    }
    runString(source) {
        this._run(source, 1);
        const ret = to_jsstring(luaL_checkstring(this.#L, 1));
        lua_pop(this.#L, 1);
        return ret;
    }
    runNumber(source) {
        this._run(source, 1);
        const ret = lua_tonumber(this.#L, 1);
        lua_pop(this.#L, 1);
        return ret;
    }
    runBoolean(source) {
        this._run(source, 1);
        const ret = lua_toboolean(this.#L, 1);
        lua_pop(this.#L, 1);
        return ret;
    }
    run3vl(source) {
        this._run(source, 1);
        const ret = lua_to3vl(this.#L, 1);
        lua_pop(this.#L, 1);
        return ret;
    }
    runThread(source) {
        const thr = lua_newthread(this.#L);
        const pid = luaL_ref(this.#L, LUA_REGISTRYINDEX);
        const new_tdata = {
            pid: pid,
            env: thr, 
            waitMonitors: undefined,
            alarmId: undefined
        };
        this.#pidthreads.set(pid, new_tdata);
        this.#threads.set(thr, new_tdata);
        try {
            const ret_ls = lua_load_jsstring_error(thr, source);
            const ret_re = lua_resume_error(thr, null, 0);
            if (ret_re == LUA_YIELD)
                return pid;
            else this._stopthread(new_tdata);
        } catch(e) {
            this._stopthread(new_tdata);
            throw e;
        }
    }
    isThreadRunning(pid) {
        return this.#pidthreads.has(pid);
    }
    stopThread(pid) {
        const tdata = this.#pidthreads.get(pid);
        if (tdata === undefined) return;
        this._stopthread(tdata);
    }
    _removeWaitMonitors(tdata) {
        if (tdata.waitMonitors !== undefined) {
            for (const monitorId of tdata.waitMonitors)
                this.#circuit.unmonitor(monitorId);
            tdata.waitMonitors = undefined;
        }
        if (tdata.alarmId !== undefined) {
            this.#circuit.unalarm(tdata.alarmId);
            tdata.alarmId = undefined;
        }
    }
    _stopthread(tdata) {
        luaL_unref(this.#L, LUA_REGISTRYINDEX, tdata.pid);
        this._removeWaitMonitors(tdata);
        this.#pidthreads.delete(tdata.pid);
        this.#threads.delete(tdata.env);
        this.trigger('thread:stop', tdata.pid);
    }
    _enqueue(tdata, tick) {
        console.assert(tdata.alarmId === undefined);
        const handler = () => {
            tdata.alarmId = undefined;
            this._resume(tdata);
        };
        tdata.alarmId = this.#circuit.alarm(tick, handler, {stopOnAlarm: true, synchronous: true});
    }
    _thread_pid(L) {
        return this.#threads.get(L).pid;
    }
    _resume(tdata) {
        this._removeWaitMonitors(tdata);
        const L = tdata.env;
        try {
            const ret_re = lua_resume(L, null, 0);
            if (ret_re != LUA_YIELD) {
                const tdata = this.#threads.get(L);
                if (tdata !== undefined)
                    this._stopthread(tdata);
                lua_handle_error(L, "Failed resuming LUA thread:", ret_re);
            }
        } catch (e) {
            this.trigger('thread:error', tdata.pid, e);
        }
    }
    _vararg_findwire(L, args, start = 0) {
        const path = [];
        for (const i of Array(args - 1 - start).keys()) 
            path.push(to_jsstring(luaL_checkstring(L, i + 1 + start)));
        const name = to_jsstring(luaL_checkstring(L, args));
        return this.#circuit.findWireByLabel(name, path);
    }
    _make_event(wire, trigger) {
        return L => {
            let monitorId;
            const handler = (tick, signal) => {
                const tdata = this.#threads.get(L);
                if (tdata.waitMonitors == undefined || !tdata.waitMonitors.has(monitorId)) 
                    return;
                this._resume(tdata);
            };
            monitorId = this.#circuit.monitorWire(wire, handler, {triggerValues: [trigger], stopOnTrigger: true, oneShot: true, synchronous: true});
            return [monitorId];
        };
    }
};

_.extend(LuaRunner.prototype, Backbone.Events);

export class Display3vlLua {
    #L;
    #name;
    #pattern;
    #sort;
    #regex;
    #ref;
    constructor({L, source, name, pattern, sort, regexValidate = false}) {
        if (L) this.#L = L;
        else {
            this.#L = luaL_newstate();
            luaL_openlibs(this.#L);
            luaL_requiref(this.#L, to_luastring("vec"), luaopen_vec, 1);
            lua_pop(this.#L, 1);
        }
        if (L === undefined && source === undefined) {
            throw new Error("Display3vlLua: no definition");
        }
        if (source !== undefined) {
            const ret = lua_load_jsstring_error(this.#L, source);
            lua_pcall_error(this.#L, 0, 1, 0);
        }
        if (name !== undefined) this.#name = name;
        else {
            lua_getfield(this.#L, -1, to_luastring("name"));
            this.#name = to_jsstring(lua_tostring(this.#L, -1));
            lua_pop(this.#L, 1);
        }
        if (pattern !== undefined) this.#pattern = pattern;
        else {
            lua_getfield(this.#L, -1, to_luastring("pattern"));
            this.#pattern = to_jsstring(lua_tostring(this.#L, -1));
            lua_pop(this.#L, 1);
        }
        if (sort !== undefined) this.#sort = sort;
        else {
            lua_getfield(this.#L, -1, to_luastring("sort"));
            this.#sort = lua_tointeger(this.#L, -1);
            lua_pop(this.#L, 1);
        }
        lua_getfield(this.#L, -1, to_luastring("validate"));
        if (lua_isnil(this.#L, -1)) regexValidate = true;
        lua_pop(this.#L, 1);
        if (regexValidate) this.#regex = RegExp('^(?:' + this.#pattern + ')$');
        this.#ref = luaL_ref(this.#L, LUA_REGISTRYINDEX);
    }
    unref() {
        luaL_unref(this.#L, LUA_REGISTRYINDEX, this.#ref);
        this.#ref = null;
    }
    get name() {
        return this.#name;
    }
    get pattern() {
        return this.#pattern;
    }
    get sort() {
        return this.#sort;
    }
    can(kind, bits) {
        lua_rawgeti(this.#L, LUA_REGISTRYINDEX, this.#ref);
        lua_getfield(this.#L, -1, to_luastring("can"));
        lua_remove(this.#L, -2);
        lua_pushstring(this.#L, to_luastring(kind));
        lua_pushinteger(this.#L, bits);
        try {
            lua_pcall_error(this.#L, 2, 1, 0);
        } catch (e) {
            return false;
        }
        const ret = lua_toboolean(this.#L, -1);
        lua_pop(this.#L, 1);
        return ret;
    }
    read(data, bits) {
        lua_rawgeti(this.#L, LUA_REGISTRYINDEX, this.#ref);
        lua_getfield(this.#L, -1, to_luastring("read"));
        lua_remove(this.#L, -2);
        lua_pushstring(this.#L, to_luastring(data));
        if (bits) lua_pushinteger(this.#L, bits);
        else lua_pushnil(this.#L);
        try {
            lua_pcall_error(this.#L, 2, 1, 0);
        } catch (e) {
            return null;
        }
        const ret = lua_to3vl(this.#L, -1, bits);
        lua_pop(this.#L, 1);
        return ret;
    }
    show(data) {
        lua_rawgeti(this.#L, LUA_REGISTRYINDEX, this.#ref);
        lua_getfield(this.#L, -1, to_luastring("show"));
        lua_remove(this.#L, -2);
        lua_push3vl(this.#L, data);
        try {
            lua_pcall_error(this.#L, 1, 1, 0);
        } catch (e) {
            return "ERR";
        }
        const is = lua_isstring(this.#L, -1);
        const ret = lua_tostring(this.#L, -1);
        lua_pop(this.#L, 1);
        if (!is) return "ERR";
        return to_jsstring(ret);
    }
    validate(data, bits) {
        if (this.#regex) return this.#regex.test(data);
        lua_rawgeti(this.#L, LUA_REGISTRYINDEX, this.#ref);
        lua_getfield(this.#L, -1, to_luastring("validate"));
        lua_remove(this.#L, -2);
        lua_pushstring(this.#L, to_luastring(data));
        if (bits) lua_pushinteger(this.#L, bits);
        else lua_pushnil(this.#L);
        try {
            lua_pcall_error(this.#L, 2, 1, 0);
        } catch (e) {
            return false;
        }
        const ret = lua_toboolean(this.#L, -1);
        lua_pop(this.#L, 1);
        return ret;
    }
    size(bits) {
        lua_rawgeti(this.#L, LUA_REGISTRYINDEX, this.#ref);
        lua_getfield(this.#L, -1, to_luastring("size"));
        lua_remove(this.#L, -2);
        lua_pushinteger(this.#L, bits);
        try {
            lua_pcall_error(this.#L, 1, 1, 0);
        } catch (e) {
            return 0;
        }
        const ret = lua_tointeger(this.#L, -1);
        lua_pop(this.#L, 1);
        return ret;
    }
};


