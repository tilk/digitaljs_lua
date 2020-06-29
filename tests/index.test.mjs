"use strict";

import { Vector3vl } from '3vl';
import { HeadlessCircuit } from 'digitaljs/src/circuit';
import { FengariRunner } from '../src/index.mjs';

const data = {
    devices: {
        i: {
            type: "Input",
            net: "i",
            bits: 1
        },
        o: {
            type: "Output",
            net: "o",
            bits: 1
        }
    },
    connectors: [
        {to: {id: "o", port: "in"}, from: {id: "i", port: "out"}}
    ],
    subcircuits: {}
};

const circuit = new HeadlessCircuit(data);
const runner = new FengariRunner(circuit);

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
    expect(runner.run3vl(`return vec.frombin("1010");`).eq(Vector3vl.fromBin("1010"))).toBeTruthy();
});

test("fromoct", () => {
    expect(runner.run3vl(`return vec.fromoct("");`).eq(Vector3vl.make(0, 0))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromoct("7");`).eq(Vector3vl.ones(3))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromoct("0");`).eq(Vector3vl.zeros(3))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromoct("10");`).eq(Vector3vl.fromOct("10"))).toBeTruthy();
});

test("fromhex", () => {
    expect(runner.run3vl(`return vec.fromhex("");`).eq(Vector3vl.make(0, 0))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromhex("f");`).eq(Vector3vl.ones(4))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromhex("0");`).eq(Vector3vl.zeros(4))).toBeTruthy();
    expect(runner.run3vl(`return vec.fromhex("10");`).eq(Vector3vl.fromHex("10"))).toBeTruthy();
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
});

test("concat", () => {
    expect(runner.run3vl(`return vec(true) .. vec(true)`).eq(Vector3vl.fromBin('11'))).toBeTruthy();
    expect(runner.run3vl(`return vec(true) .. vec(false)`).eq(Vector3vl.fromBin('10'))).toBeTruthy();
});

test("setInput", () => {
    runner.run(`sim.setInput("i", true);`);
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    runner.run(`sim.setInput("i", false);`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
});

test("getOutput", () => {
    circuit.setInput("i", Vector3vl.zero);
    expect(runner.run3vl(`return sim.getOutput("o")`).isLow).toBeTruthy();
    circuit.setInput("i", Vector3vl.one);
    expect(runner.run3vl(`return sim.getOutput("o")`).isHigh).toBeTruthy();
});

test("tick", () => {
    expect(runner.runNumber(`return sim.tick()`)).toEqual(circuit.tick);
});

test("sleep 1", () => {
    const pid = runner.runThread(`sim.setInput("i", false); sim.sleep(1); sim.setInput("i", true)`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.updateGates();
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("sleep 2", () => {
    const pid = runner.runThread(`sim.setInput("i", false); sim.sleep(2); sim.setInput("i", true)`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.updateGates();
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    circuit.updateGates();
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

test("stopThread", () => {
    const pid = runner.runThread(`sim.setInput("i", false); sim.sleep(1); sim.setInput("i", true)`);
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeTruthy();
    runner.stopThread(pid);
    expect(runner.isThreadRunning(pid)).toBeFalsy();
    circuit.updateGates();
    expect(circuit.getOutput("o").isLow).toBeTruthy();
    expect(runner.isThreadRunning(pid)).toBeFalsy();
});

