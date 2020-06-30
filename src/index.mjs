
import { luaconf, lua, lauxlib, lualib, to_jsstring, to_luastring } from "fengari";
import Backbone from 'backbone';
import _ from 'lodash';
import { Vector3vl } from '3vl';
import { HeadlessCircuit } from "digitaljs/src/circuit";

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
    luaL_error
} = lauxlib;
const {
    lua_newtable,
    lua_gettop,
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
    lua_setfield,
    lua_setmetatable,
    lua_isboolean,
    lua_isinteger,
    lua_isstring,
    lua_toboolean,
    lua_tointeger,
    lua_tostring,
    lua_call,
    lua_pcall,
    lua_error,
    lua_isyieldable,
    lua_yield,
    lua_status,
    LUA_OK,
    LUA_YIELD
} = lua;

const LUA_VECTOR3VL = to_luastring("VECTOR3VL");
                
function protect(L, f) {
    return function() {
        try {
            return f.apply(this, arguments);
        } catch(e) {
            luaL_error(L, e.message);
        }
    }
}

function lua_push3vl(L, v) {
    const udata = lua_newuserdata(L, 0);
    udata.v = v;
    luaL_setmetatable(L, LUA_VECTOR3VL);
}

function lua_check3vl(L, n) {
    const udata = luaL_testudata(L, n, LUA_VECTOR3VL);
    if (udata !== null) return udata.v;
    if (lua_isboolean(L, n))
        return Vector3vl.fromBool(lua_toboolean(L, n));
    if (lua_isinteger(L, n))
        return Vector3vl.fromNumber(lua_tointeger(L, n));
    if (lua_isstring(L, n)) 
        return protect(L, Vector3vl.fromString)(to_jsstring(lua_tostring(L, n)));
    luaL_argerror(L, n, "not convertible to vec");
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
        const v = lua_check3vl(L, 2);
        lua_push3vl(L, v);
        return 1;
    }
};

const luaopen_vec = (L) => {
    luaL_newlib(L, veclib);
    luaL_newlib(L, veclibmeta);
    lua_setmetatable(L, -2);
    return 1;
};

export class FengariRunner {
    #L;
    #pidcnt = 0;
    #circuit;
    #threads = new Map();
    #queue = new Map();
    #pidthreads = new Map();
    #simlib = {
        sleep: (L) => {
            if (!lua_isyieldable(L)) luaL_error(L, "sim.sleep: not yieldable");
            const delay = luaL_checkinteger(L, 1);
            luaL_argcheck(L, delay > 0, 1, "sim.sleep: too short delay");
            this._enqueue(L, this.#circuit.tick + delay - 1);
            lua_yield(L, 0);
        },
        tick: (L) => {
            lua_pushinteger(L, this.#circuit.tick);
            return 1;
        },
        setInput: (L) => {
            const name = luaL_checkstring(L, 1);
            const vec = lua_check3vl(L, 2);
            this.#circuit.setInput(to_jsstring(name), vec);
            lua_pushnil(L);
            return 1;
        },
        getOutput: (L) => {
            const name = luaL_checkstring(L, 1);
            const res = this.#circuit.getOutput(to_jsstring(name));
            lua_push3vl(L, res);
            return 1;
        }
    };
    constructor(circuit) {
        const L = this.#L = luaL_newstate();
        this.#circuit = circuit;

        const luaopen_sim = (L) => {
            luaL_newlib(L, this.#simlib);
            return 1;
        };
        luaL_requiref(L, to_luastring("sim"), luaopen_sim, 1);
        lua_pop(L, 1);
        luaL_requiref(L, to_luastring("vec"), luaopen_vec, 1);
        lua_pop(L, 1);
        const add_method = (name, f) => {
            lua_pushcfunction(L, protect(L, (L) => {
                f(L);
                return 1;
            }));
            lua_setfield(L, -2, to_luastring(name));
        }
        const add_unary_method = (f_push, f_check, name, method) => {
            add_method(name, (L) => {
                f_push(L, method.call(lua_check3vl(L, 1), f_check(L, 2)));
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
        add_unary_method(lua_pushboolean, lua_check3vl, "__eq", Vector3vl.prototype.eq);
        add_nullary_method(lua_push3vl, "__bnot", Vector3vl.prototype.not);
        add_property(lua_pushinteger, "__len", Vector3vl.prototype, "bits");
        add_unary_method(lua_push3vl, luaL_checkinteger, "__call", function(i) {
            luaL_argcheck(L, i >= -this.bits && i < this.bits, 2, "index out of bounds");
            const ii = i >= 0 ? i : this.bits + i;
            const j = luaL_optinteger(L, 3, undefined);
            if (j === undefined)
                return Vector3vl.make(1, this.get(ii));
            else {
                luaL_argcheck(L, j >= 0, "slice count negative");
                return this.slice(ii, ii + j);
            }
        });
        add_unary_method(lua_push3vl, lua_check3vl, "__concat", function(v) {
            return v.concat(this);
        });
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
        add_nullary_method(lua_pushstring, "tohexstring", Vector3vl.prototype.toHex);
        add_nullary_method(lua_pushstring, "tobinstring", Vector3vl.prototype.toBin);
        add_nullary_method(lua_pushstring, "tooctstring", Vector3vl.prototype.toOct);
        add_nullary_method(lua_pushinteger, "tointeger", Vector3vl.prototype.toNumber);
        add_nullary_method(lua_pushinteger, "tointegersigned", Vector3vl.prototype.toNumberSigned);
        add_property(lua_pushboolean, "ishigh", Vector3vl.prototype, "isHigh");
        add_property(lua_pushboolean, "islow", Vector3vl.prototype, "isLow");
        add_property(lua_pushboolean, "isdefined", Vector3vl.prototype, "isDefined");
        add_property(lua_pushboolean, "isfullydefined", Vector3vl.prototype, "isFullyDefined");
        add_property(lua_pushinteger, "bits", Vector3vl.prototype, "bits");
        lua_setfield(L, -2, to_luastring("__index"));
        lua_pop(L, 1);
        this.listenTo(circuit, 'postUpdateGates', (tick) => {
            const q = this.#queue.get(tick);
            this.#queue.delete(tick);
            if (q !== undefined)
                for (const pid of q) {
                    const thr = this.#pidthreads.get(pid).env;
                    this._resume(thr);
                }
        });
    }
    shutdown() {
        this.stopListening();
        this.#threads = undefined;
        this.#queue = undefined;
        this.#pidthreads = undefined;
    }
    _run(source, rets) {
        const ret = luaL_loadstring(this.#L, to_luastring(source));
        if (ret != LUA_OK) throw new Error("Failed loading LUA code");
        const ret_call = lua_pcall(this.#L, 0, rets, 0);
        if (ret_call != LUA_OK) {
            throw new Error(to_jsstring(lua_tostring(thr, -1)));
        }
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
        const ret = luaL_checknumber(this.#L, 1);
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
        const ret = lua_check3vl(this.#L, 1);
        lua_pop(this.#L, 1);
        return ret;
    }
    _thread_pid(thr) {
        const tdata = this.#threads.get(thr);
        if (tdata !== undefined) return tdata.pid;
        const pid = this.#pidcnt++;
        const new_tdata = {
            pid: pid,
            env: thr, 
            callbacks: []
        };
        this.#pidthreads.set(pid, new_tdata);
        this.#threads.set(thr, new_tdata);
        return pid;
    }
    runThread(source) {
        const thr = lua_newthread(this.#L);
        lua_pop(this.#L, 1); // would be unsafe in C LUA because of GC
        const ret_ls = luaL_loadstring(thr, to_luastring(source));
        if (ret_ls != LUA_OK) throw new Error("Failed loading LUA code");
        const ret_re = lua_resume(thr, null, 0);
        if (ret_re == LUA_YIELD) {
            return this._thread_pid(thr);
        } else if (ret_re != LUA_OK) {
            throw new Error(to_jsstring(lua_tostring(thr, -1)));
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
    _stopthread(tdata) {
        for (const s of this.#queue.values())
            s.delete(tdata.pid);
        for (const c of tdata.callbacks)
            this.stopListening(undefined, undefined, c);
        this.#pidthreads.delete(tdata.pid);
        this.#threads.delete(tdata.env);
    }
    _enqueue(L, tick) {
        if (this.#queue.get(tick) === undefined)
            this.#queue.set(tick, new Set());
        this.#queue.get(tick).add(this._thread_pid(L));
    }
    _resume(L) {
        const ret_re = lua_resume(L, null, 0);
        if (ret_re != LUA_YIELD) {
            const tdata = this.#threads.get(L);
            if (tdata !== undefined)
                this._stopthread(tdata);
            if (ret_re != LUA_OK)
                throw new Error(to_jsstring(lua_tostring(thr, -1)));
        }
    }
};

_.extend(FengariRunner.prototype, Backbone.Events);

