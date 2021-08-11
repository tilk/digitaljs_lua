"use strict";

import { Vector3vl } from '3vl';
import { HeadlessCircuit } from 'digitaljs/src/circuit';
import { SynchEngine } from 'digitaljs/src/engines/synch';
import { WorkerEngine } from 'digitaljs/src/engines/worker';
import { LuaRunner, Display3vlLua, LuaError } from '../src/index.mjs';

const data = {
    devices: {
        i: {
            type: "Input",
            net: "ni",
            bits: 1
        },
        o: {
            type: "Output",
            net: "no",
            bits: 1
        },
        nego: {
            type: "Output",
            net: "nnego",
            bits: 1
        },
        gate: {
            type: "Not"
        }
    },
    connectors: [
        {name: "w", to: {id: "o", port: "in"}, from: {id: "i", port: "out"}},
        {name: "w1", to: {id: "gate", port: "in"}, from: {id: "i", port: "out"}},
        {name: "w2", to: {id: "nego", port: "in"}, from: {id: "gate", port: "out"}}
    ],
    subcircuits: {}
};

describe.each([
["synch", SynchEngine],
["worker", WorkerEngine]])('%s', (name, engine) => {

let circuit, runner;

beforeAll(() => {
    circuit = new HeadlessCircuit(data, { engine, engineOptions: { workerURL: new URL('../node_modules/digitaljs/lib/engines/worker-worker.js', require('url').pathToFileURL(__filename).toString()) } });
    circuit.observeGraph();
    runner = new LuaRunner(circuit);
});

afterAll(() => {
    circuit.shutdown();
});

test("frombool", () => {
    expect(runner.run3vl(`return vec.frombool(true);`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec.frombool(false);`).eq(Vector3vl.zero)).toBeTruthy();
});

test("frominteger", () => {
    expect(runner.run3vl(`return vec.frominteger(1);`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec.frominteger(0);`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec.frominteger(10);`).eq(Vector3vl.fromNumber(10))).toBeTruthy();
    expect(runner.run3vl(`return vec.frominteger(-10);`).eq(Vector3vl.fromNumber(-10))).toBeTruthy();
});

test("frombin", () => {
    expect(runner.run3vl(`return vec.frombin("");`).eq(Vector3vl.make(0, 0))).toBeTruthy();
    expect(runner.run3vl(`return vec.frombin("1");`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec.frombin("0");`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec.frombin("1", 2);`).eq(Vector3vl.fromBin("01"))).toBeTruthy();
    expect(runner.run3vl(`return vec.frombin("1010");`).eq(Vector3vl.fromBin("1010"))).toBeTruthy();
    expect(runner.run3vl(`return vec.frombin(0);`).eq(Vector3vl.zero)).toBeTruthy();
    expect(() => runner.run3vl(`return vec.frombin(nil);`)).toThrow(LuaError);
});

test("fromoct", () => {
    expect(runner.run3vl(`return vec.fromoct("");`).eq(Vector3vl.make(0, 0))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromoct("7");`).eq(Vector3vl.ones(3))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromoct("0");`).eq(Vector3vl.zeros(3))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromoct("1", 2);`).eq(Vector3vl.fromBin("01"))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromoct("10");`).eq(Vector3vl.fromOct("10"))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromoct(0);`).eq(Vector3vl.zeros(3))).toBeTruthy();
    expect(() => runner.run3vl(`return vec.fromoct(nil);`)).toThrow(LuaError);
});

test("fromhex", () => {
    expect(runner.run3vl(`return vec.fromhex("");`).eq(Vector3vl.make(0, 0))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromhex("f");`).eq(Vector3vl.ones(4))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromhex("0");`).eq(Vector3vl.zeros(4))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromhex("1", 2);`).eq(Vector3vl.fromBin("01"))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromhex("10");`).eq(Vector3vl.fromHex("10"))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromhex(0);`).eq(Vector3vl.zeros(4))).toBeTruthy();
    expect(() => runner.run3vl(`return vec.fromhex(nil);`)).toThrow(LuaError);
});

test("new", () => {
    expect(runner.run3vl(`return vec(true)`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(false)`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(vec.frombool(true))`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(vec.frombool(false))`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(1)`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(0)`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(10)`).eq(Vector3vl.fromNumber(10))).toBeTruthy();
    expect(runner.run3vl(`return vec(-10)`).eq(Vector3vl.fromNumber(-10))).toBeTruthy();
    expect(runner.run3vl(`return vec("b10")`).eq(Vector3vl.fromBin("10"))).toBeTruthy();
    expect(runner.run3vl(`return vec("4b10")`).eq(Vector3vl.fromBin("10", 4))).toBeTruthy();
    expect(runner.run3vl(`return vec("h10")`).eq(Vector3vl.fromHex("10"))).toBeTruthy();
    expect(runner.run3vl(`return vec("o10")`).eq(Vector3vl.fromOct("10"))).toBeTruthy();
    expect(runner.run3vl(`return vec(true, 4)`).eq(Vector3vl.ones(4))).toBeTruthy();
    expect(runner.run3vl(`return vec(1, 4)`).eq(Vector3vl.fromBin("1", 4))).toBeTruthy();
    expect(runner.run3vl(`return vec(vec(1), 4)`).eq(Vector3vl.fromBin("1", 4))).toBeTruthy();
    expect(runner.run3vl(`return vec(3, 1)`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(-1, 4)`).eq(Vector3vl.ones(4))).toBeTruthy();
    expect(() => runner.run3vl(`return vec(nil)`)).toThrow(LuaError);
});

test("bit ops", () => {
    expect(runner.run3vl(`return vec(true):band(vec(true))`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(true):band(vec(false))`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(false):band(vec(false))`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(true) & (vec(false))`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(true):bor(vec(true))`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(true):bor(vec(false))`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(false):bor(vec(false))`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(true) | (vec(false))`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(true):bxor(vec(true))`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(true):bxor(vec(false))`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(false):bxor(vec(false))`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(true) ~ (vec(false))`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(true):bnot()`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(false):bnot()`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return ~vec(true)`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return ~vec(false)`).eq(Vector3vl.one)).toBeTruthy();
});

test("bits", () => {
    expect(runner.runNumber(`return vec(false):bits()`)).toEqual(1);
    expect(runner.runNumber(`return vec(2):bits()`)).toEqual(2);
    expect(runner.runNumber(`return #vec(false)`)).toEqual(1);
});

test("eq", () => {
    expect(runner.runBoolean(`return vec(false) == vec(false)`)).toBeTruthy();
    expect(runner.runBoolean(`return vec(false) == vec(true)`)).toBeFalsy();
    expect(runner.runBoolean(`return vec(false) == vec(2)`)).toBeFalsy();
});

test("bit index", () => {
    expect(runner.run3vl(`return vec(true)(0)`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(false)(0)`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(2)(1)`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(2)(0)`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(2)(-1)`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(2)(-2)`).eq(Vector3vl.zero)).toBeTruthy();
});

test("bit slice", () => {
    expect(runner.run3vl(`return vec(2)(1, 1)`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(2)(0, 1)`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(2)(-1, 1)`).eq(Vector3vl.one)).toBeTruthy();
    expect(runner.run3vl(`return vec(2)(-2, 1)`).eq(Vector3vl.zero)).toBeTruthy();
    expect(runner.run3vl(`return vec(2)(0, 2)`).eq(Vector3vl.fromBin('10'))).toBeTruthy();
    expect(runner.run3vl(`return vec("8h5a")(0, 2)`).eq(Vector3vl.fromBin('10'))).toBeTruthy();
    expect(runner.run3vl(`return vec("8h5a")(0, 4)`).eq(Vector3vl.fromHex('a'))).toBeTruthy();
    expect(runner.run3vl(`return vec("8h5a")(4, 4)`).eq(Vector3vl.fromHex('5'))).toBeTruthy();
    expect(() => runner.run3vl(`return vec(2)(0, -1)`)).toThrow(LuaError);
});

test("concat", () => {
    expect(runner.run3vl(`return vec(true) .. vec(true)`).eq(Vector3vl.fromBin('11'))).toBeTruthy();
    expect(runner.run3vl(`return vec(true) .. vec(false)`).eq(Vector3vl.fromBin('10'))).toBeTruthy();
    expect(runner.run3vl(`return vec(true) .. false`).eq(Vector3vl.fromBin('10'))).toBeTruthy();
    expect(runner.run3vl(`return true .. vec(false)`).eq(Vector3vl.fromBin('10'))).toBeTruthy();
    expect(runner.run3vl(`return vec("4b1010") .. vec("4b0101")`).eq(Vector3vl.fromBin('10100101'))).toBeTruthy();
    expect(runner.run3vl(`return vec("2b10") .. vec("4b1001") .. vec("2b01")`).eq(Vector3vl.fromBin('10100101'))).toBeTruthy();
});

test("setinput_id", () => {
    runner.run(`sim.setinput_id("i", true);`);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    runner.run(`sim.setinput_id("i", false);`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(() => runner.run3vl(`return sim.setinput_id("i", 2)`)).toThrow(LuaError);
    expect(() => runner.run3vl(`return sim.setinput_id("foo", true)`)).toThrow(LuaError);
});

test("getoutput_id", () => {
    circuit.setInput("i", Vector3vl.zero);
    expect(runner.run3vl(`return sim.getoutput_id("o")`).isLow).toBeTruthy();
    circuit.setInput("i", Vector3vl.one);
    expect(runner.run3vl(`return sim.getoutput_id("o")`).isHigh).toBeTruthy();
    expect(() => runner.run3vl(`return sim.getoutput_id("foo")`)).toThrow(LuaError);
});

test("setinput", () => {
    runner.run(`sim.setinput("ni", true);`);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    runner.run(`sim.setinput("ni", false);`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    runner.run(`sim.setinput("ni", 3);`);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(() => runner.run3vl(`return sim.setinput("foo", true)`)).toThrow(LuaError);
});

test("getoutput", () => {
    circuit.setInput("i", Vector3vl.zero);
    expect(runner.run3vl(`return sim.getoutput("no")`).isLow).toBeTruthy();
    circuit.setInput("i", Vector3vl.one);
    expect(runner.run3vl(`return sim.getoutput("no")`).isHigh).toBeTruthy();
    expect(() => runner.run3vl(`return sim.getoutput("foo")`)).toThrow(LuaError);
});

test("getvalue", () => {
    circuit.setInput("i", Vector3vl.zero);
    expect(runner.run3vl(`return sim.getvalue("w")`).isLow).toBeTruthy();
    circuit.setInput("i", Vector3vl.one);
    expect(runner.run3vl(`return sim.getvalue("w")`).isHigh).toBeTruthy();
});

test("tick", () => {
    expect(runner.runNumber(`return sim.tick()`)).toEqual(circuit.tick);
});

test("sleep 1", async () => {
    const pid = runner.runThread(`sim.setinput_id("i", false); sim.sleep(1); sim.setinput_id("i", true)`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("sleep 2", async () => {
    const pid = runner.runThread(`sim.setinput_id("i", false); sim.sleep(2); sim.setinput_id("i", true)`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("stopThread", () => {
    const callback = jest.fn(e => {});
    runner.on('thread:stop', callback);
    const pid = runner.runThread(`sim.setinput_id("i", false); sim.sleep(1); sim.setinput_id("i", true)`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    expect(callback.mock.calls.length).toBe(0);
    runner.stopThread(pid);
    expect(runner.isThreadRunning(pid)).toBeFalsy();
    expect(callback.mock.calls.length).toBe(1);
    circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
    expect(callback.mock.calls.length).toBe(1);
    expect(callback.mock.calls[0][0]).toBe(pid);
    runner.off('thread:stop', callback);
});

test("posedge", async () => {
    const pid = runner.runThread(`sim.setinput("ni", false); sim.wait(sim.posedge("w")); sim.setinput("ni", false)`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.setInput("i", Vector3vl.one);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("posedge 2", async () => {
    const pid = runner.runThread(`sim.setinput("ni", true); sim.wait(sim.posedge("w")); sim.setinput("ni", false)`);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.setInput("i", Vector3vl.zero);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.setInput("i", Vector3vl.one);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("value", async () => {
    const pid = runner.runThread(`sim.setinput("ni", false); sim.wait(sim.value(1, "w")); sim.setinput("ni", false)`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.setInput("i", Vector3vl.one);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("negedge", async () => {
    const pid = runner.runThread(`sim.setinput("ni", true); sim.wait(sim.negedge("w")); sim.setinput("ni", true)`);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.setInput("i", Vector3vl.zero);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("event union", async () => {
    const pid = runner.runThread(`sim.setinput("ni", true); sim.wait(sim.negedge("w") | sim.posedge("w")); sim.setinput("ni", true); sim.sleep(1); sim.setinput("ni", false); sim.wait(sim.negedge("w") | sim.posedge("w")); sim.setinput("ni", false)`);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.setInput("i", Vector3vl.zero);
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.setInput("i", Vector3vl.one);
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("event timeout", async () => {
    const pid = runner.runThread(`sim.setinput("ni", false); sim.wait(sim.posedge("w"), 2); sim.setinput("ni", true)`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    await circuit.updateGates({synchronous: true});
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("display", () => {
    const display = new Display3vlLua({source: `return {
        name = "luabin",
        pattern = "[01x]*",
        sort = 0,
        can = function (kind, bits) return true; end,
        read = function (data, bits) return vec.frombin(data, bits); end,
        show = function (data) return data:tobin(); end,
        validate = function (data, bits) return string.match(data, "^[01x]*$") ~= nil end,
        size = function (bits) return bits; end
    }`});
    expect(display.name).toEqual("luabin");
    expect(display.pattern).toEqual("[01x]*");
    expect(display.sort).toEqual(0);
    expect(display.can("read", 1)).toEqual(true);
    expect(display.read("10").eq(Vector3vl.fromBin("10"))).toBeTruthy();
    expect(display.read("10", 3).eq(Vector3vl.fromBin("10", 3))).toBeTruthy();
    expect(display.show(Vector3vl.fromBin("10"))).toEqual("10");
    expect(display.validate("10", 3)).toEqual(true);
    expect(display.validate("foo", 1)).toEqual(false);
    expect(display.size(2)).toEqual(2);
});

test("lua errors", () => {
    expect(() => runner.run("foo bar baz")).toThrow(LuaError);
    expect(() => runner.run3vl("foo bar baz")).toThrow(LuaError);
    expect(() => runner.runNumber("foo bar baz")).toThrow(LuaError);
    expect(() => runner.runBoolean("foo bar baz")).toThrow(LuaError);
    expect(() => runner.runString("foo bar baz")).toThrow(LuaError);
    expect(() => runner.runThread("foo bar baz")).toThrow(LuaError);
    expect(() => runner.run('"x"+1')).toThrow(LuaError);
    expect(() => runner.run3vl('"x"+1')).toThrow(LuaError);
    expect(() => runner.runNumber('"x"+1')).toThrow(LuaError);
    expect(() => runner.runBoolean('"x"+1')).toThrow(LuaError);
    expect(() => runner.runString('"x"+1')).toThrow(LuaError);
    expect(() => runner.runThread('"x"+1')).toThrow(LuaError);
});

test("lua delayed errors", async () => {
    const callback = jest.fn(e => {});
    runner.on('thread:error', callback);
    const pid = runner.runThread("sim.sleep(1); foo()");
    expect(callback.mock.calls.length).toBe(0);
    await circuit.updateGates({synchronous: true});
    expect(callback.mock.calls.length).toBe(1);
    expect(callback.mock.calls[0][0]).toBe(pid);
    expect(callback.mock.calls[0][1]).toBeInstanceOf(LuaError);
    runner.off('thread:error', callback);
});

test("print", () => {
    const callback = jest.fn(x => {});
    runner.on("print", callback);
    runner.run(`print("foo"); print(1, vec(2))`);
    expect(callback.mock.calls.length).toBe(2);
    expect(callback.mock.calls[0][0]).toStrictEqual(["foo"]);
    expect(callback.mock.calls[1][0]).toStrictEqual(["1", "10"]);
    runner.off("print", callback);
});

});

