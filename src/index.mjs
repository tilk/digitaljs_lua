
import { luaconf, lua, lauxlib, lualib, to_jsstring, to_luastring } from "fengari";
import Backbone from 'backbone';
import _ from 'lodash';
import { Vector3vl } from '3vl';
import { HeadlessCircuit } from "digitaljs/src/circuit";

const {
    luaL_checkstring,
    luaL_checknumber,
    luaL_checkudata,
    luaL_newlib,
    luaL_requiref,
    luaL_newstate,
    luaL_newmetatable,
    luaL_setmetatable,
    luaL_loadstring
} = lauxlib;
const {
    lua_pop,
    lua_pushcfunction,
    lua_pushinteger,
    lua_pushstring,
    lua_pushboolean,
    lua_pushnil,
    lua_pushvalue,
    lua_newuserdata,
    lua_setfield,
    lua_toboolean,
    lua_call
} = lua;

const LUA_VECTOR3VL = to_luastring("VECTOR3VL");

function lua_push3vl(L, v) {
    const udata = lua_newuserdata(L, 0);
    udata.v = v;
    luaL_setmetatable(L, LUA_VECTOR3VL);
}

function lua_check3vl(L, n) {
    const udata = luaL_checkudata(L, n, LUA_VECTOR3VL);
    return udata.v;
}

const veclib = {
    fromBin: (L) => {
        const str = luaL_checkstring(L, 1);
        lua_push3vl(L, Vector3vl.fromBin(to_jsstring(str)));
        return 1;
    },
    fromOct: (L) => {
        const str = luaL_checkstring(L, 1);
        lua_push3vl(L, Vector3vl.fromOct(to_jsstring(str)));
        return 1;
    },
    fromHex: (L) => {
        const str = luaL_checkstring(L, 1);
        lua_push3vl(L, Vector3vl.fromHex(to_jsstring(str)));
        return 1;
    },
    fromBool: (L) => {
        const b = lua_toboolean(L, 1);
        lua_push3vl(L, Vector3vl.fromBool(b));
        return 1;
    }
};
        
const luaopen_vec = (L) => {
    luaL_newlib(L, veclib);
    return 1;
};

export class FengariRunner {
    #L;
    #circuit;
    #simlib = {
        sleep: (L) => {
            return 1;
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
            lua_pushcfunction(L, (L) => {
                f(L);
                return 1;
            });
            lua_setfield(L, -2, to_luastring(name));
        }
        const add_unary_3vl_method_3vl = (name, method) => {
            add_method(name, (L) => {
                lua_push3vl(L, method.apply(lua_check3vl(L, 1), lua_check3vl(L, 2)));
            });
        }
        const add_nullary_3vl_method = (name, method) => {
            add_method(name, (L) => {
                lua_push3vl(L, method.apply(lua_check3vl(L, 1)));
            });
        }
        const add_nullary_string_method = (name, method) => {
            add_method(name, (L) => {
                lua_pushstring(L, to_luastring(method.apply(lua_check3vl(L, 1))));
            });
        }
        const add_nullary_boolean_method = (name, method) => {
            add_method(name, (L) => {
                lua_pushboolean(L, method.apply(lua_check3vl(L, 1)));
            });
        }
        const add_nullary_integer_method = (name, method) => {
            add_method(name, (L) => {
                lua_pushinteger(L, method.apply(lua_check3vl(L, 1)));
            });
        }
        const add_boolean_property = (name, what, fld) => {
            add_nullary_boolean_method(name, Object.getOwnPropertyDescriptor(what, fld).get);
        }
        const add_integer_property = (name, what, fld) => {
            add_nullary_integer_method(name, Object.getOwnPropertyDescriptor(what, fld).get);
        }
        luaL_newmetatable(L, LUA_VECTOR3VL);
        // TODO: __shl, __shr, __concat, __eq
        add_unary_3vl_method_3vl("bitAnd", Vector3vl.prototype.and);
        add_unary_3vl_method_3vl("__band", Vector3vl.prototype.and);
        add_unary_3vl_method_3vl("bitOr", Vector3vl.prototype.or);
        add_unary_3vl_method_3vl("__bor", Vector3vl.prototype.or);
        add_unary_3vl_method_3vl("bitXor", Vector3vl.prototype.xor);
        add_unary_3vl_method_3vl("__bxor", Vector3vl.prototype.xor);
        add_unary_3vl_method_3vl("bitNand", Vector3vl.prototype.nand);
        add_unary_3vl_method_3vl("bitNor", Vector3vl.prototype.nor);
        add_unary_3vl_method_3vl("bitXnor", Vector3vl.prototype.xnor);
        add_nullary_3vl_method("bitNot", Vector3vl.prototype.not);
        add_nullary_3vl_method("__bnot", Vector3vl.prototype.not);
        add_nullary_3vl_method("xmask", Vector3vl.prototype.xmask);
        add_nullary_3vl_method("reduceAnd", Vector3vl.prototype.reduceAnd);
        add_nullary_3vl_method("reduceOr", Vector3vl.prototype.reduceOr);
        add_nullary_3vl_method("reduceXor", Vector3vl.prototype.reduceXor);
        add_nullary_3vl_method("reduceNand", Vector3vl.prototype.reduceNand);
        add_nullary_3vl_method("reduceNor", Vector3vl.prototype.reduceNor);
        add_nullary_3vl_method("reduceXnor", Vector3vl.prototype.reduceXnor);
        add_nullary_string_method("toHex", Vector3vl.prototype.toHex);
        add_nullary_string_method("toBin", Vector3vl.prototype.toBin);
        add_nullary_string_method("toOct", Vector3vl.prototype.toOct);
        add_boolean_property("isHigh", Vector3vl.prototype, "isHigh");
        add_boolean_property("isLow", Vector3vl.prototype, "isLow");
        add_boolean_property("isDefined", Vector3vl.prototype, "isDefined");
        add_boolean_property("isFullyDefined", Vector3vl.prototype, "isFullyDefined");
        add_integer_property("bits", Vector3vl.prototype, "bits");
        add_integer_property("__len", Vector3vl.prototype, "bits");
        lua_pushvalue(L, -1);
        lua_setfield(L, -2, to_luastring("__index"));
        lua_pop(L, 1);
        this.listenTo(circuit, 'postUpdateGates', () => {
        });
    }
    _run(source, rets) {
        const ret = luaL_loadstring(this.#L, to_luastring(source));
        if (ret != lua.LUA_OK) throw new Error("Failed loading LUA code");
        lua_call(this.#L, 0, rets);
    }
    run(source) {
        this._run(source, 0);
    }
    run_string(source) {
        this._run(source, 1);
        const ret = to_jsstring(luaL_checkstring(this.#L, 1));
        lua_pop(this.#L, 1);
        return ret;
    }
    run_number(source) {
        this._run(source, 1);
        const ret = luaL_checknumber(this.#L, 1);
        lua_pop(this.#L, 1);
        return ret;
    }
    run_boolean(source) {
        this._run(source, 1);
        const ret = lua_toboolean(this.#L, 1);
        lua_pop(this.#L, 1);
        return ret;
    }
    run_3vl(source) {
        this._run(source, 1);
        const ret = lua_check3vl(this.#L, 1);
        lua_pop(this.#L, 1);
        return ret;
    }
};

_.extend(FengariRunner.prototype, Backbone.Events);

