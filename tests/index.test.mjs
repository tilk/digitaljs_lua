"use strict";

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


test("setInput", () => {
    runner.run(`sim.setInput("i", vec.fromBool(true));`);
    while (circuit.hasPendingEvents) circuit.updateGatesNext();
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
});

test("getOutput", () => {
    runner.run(`sim.setInput("i", vec.fromBool(false));`);
    while (circuit.hasPendingEvents) circuit.updateGatesNext();
    runner.run(`x = sim.getOutput("o"); sim.setInput("i", ~x);`);
    while (circuit.hasPendingEvents) circuit.updateGatesNext();
    expect(circuit.getOutput("o").isHigh).toBeTruthy();
});

test("tick", () => {
    expect(runner.run_number(`return sim.tick()`)).toEqual(circuit.tick);
});

