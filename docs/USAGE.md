# Lua API for DigitalJS

The Lua API for DigitalJS consists of two Lua libraries: `vec` and `sim`.

* The `vec` library embeds three-value vectors of DigitalJS ([3vl](https://github.com/tilk/js_3vl)) into Lua.
* The `sim` library allows to access simulation state from Lua.

## The vec library

The bits in the three-value vectors of this library can take one of three possible values: high (logical 1), low (logical 0) and undefined.
The undefined state is analogous to the `x` value in Verilog/SystemVerilog.

### Constructing vectors

The `vec` table is callable.
When called, it is like a constructor, building new three-value vectors.
The first parameter specifies the value of the vector. 
It can be a boolean, an integer, a string or another three-value vector.
The resulting vector is, depending on the parameter type:

* If boolean: a vector consisting of a single bit.
* If integer: a vector containing a binary encoding of the integer.
  The resulting vector has only as much bits as required.
  Negative integers are represented using two's complement encoding.
* If string: the string specifies the value of the vector in selected numeric system.
  The number of bits can be specified or omitted.
  The format is `BITScVALUE`, where:
  * `BITS` is the number of bits written in decimal, or empty;
  * `c` is equal to `b` for binary, `o` for octal, `h` for hexadecimal or `d` for decimal;
  * `VALUE` is the value written in the chosen system.
  Example values: `b101`,  `8d7`, `32hbeef`.
* If vector: the vector is copied.

The second parameter, which is optional, is an integer specifying the required number of bits.
When passed, the returned vector will have exactly the specified number of bits.
The behavior is different depending on the type of the first parameter:

* If boolean: the resulting vector consists of all ones or all zeros.
* If integer: the number is truncated or sign-extended.
* All others: the vector is truncated or zero-extended. 

The above method of constructing vectors is also used in many API procedures in both `vec` and `sim`
where a vector is expected. This allows writing shorter, more concise scripts.

There also exist functions which construct vectors from a string written in a given numeric system,
a boolean or an integer. They are:

* `vec.frombin(s[, n])` for binary,
* `vec.fromoct(s[, n])` for octal,
* `vec.fromhex(s[, n])` for hexadecimal,
* `vec.frombool(b[, n])` for a boolean value,
* `vec.frominteger(k[, n])` for an integer.

The `n` parameter denotes the number of bits, and can be omitted.

### Converting to strings and integers

A vector can be converted to a string in a given numeric system using one of the following methods:

* `vec:tobin()` for binary,
* `vec:tooct()` for octal,
* `vec:tohex()` for hexadecimal.

It can also be converted to an integer, using one of the methods:

* `vec:tointeger()` interprets the value as an unsigned binary number,
* `vec:tointegersigned()` interprets it as a signed binary number encoded in two's complement.

### Operators

The three-value vectors allow the use of several Lua operators, including:

* Bitwise and `v & w`, bitwise or `v | w`, bitwise xor `v ~ w`, bitwise not `~v`;
* Equality `v == w`;
* Length `#v`: returns the bit size of the vector;
* Concatenation `v .. w`.

### Constructing subvectors

The vectors are also callable.
The function call syntax is used to construct subvectors (slices).
The call can have one or two arguments.

The first argument denotes the number of the first bit of the subvector.
Counting starts with 0.
If negative, the bits are counted from the end: the bit numbered -1 is the last bit of the vector.

The second argument is the number of bits included in the subvector.
If omitted, the resulting vector has one bit in length.

### Bitwise operations

Varions bitwise operations are available using method syntax, including:

* Bitwise and `v:band(w)`, bitwise or `v:bor(w)`, bitwise xor `v:bxor(w)`;
* Negated operations: bitwise nand `v:bnand(w)`, bitwise nor `v:bnor(w)`, bitwise xnor `v:bxnor(w)`;
* Bitwise not `v:bnot()`.

Reducing operators are also available. They reduce a bit vector of an arbitrary length to a single bit
using the given operation. The available operators are: 

* Reducing and `v:rand()`, reducing or `v:ror()`, reducing xor `v:rxor()`;
* Reducing nand `v:rnand()`, reducing nor `v:rnor()`, reducing xnor `v:rnxor()`.

The function `v:xmask()` returns a vector which has the same length as `v`, and has 1 on a given
position `i` if and only if `v(i)` was of undefined (`x`) value.

### Predicates

The following methods return a boolean value depending on the value of the vector:

* `v:ishigh()` returns `true` if and only if every bit in `v` is 1;
* `v:islow()` returns `true` if and only if every bit in `v` is 0;
* `v:isfullydefined()` returns `true` if and only if every bit in `v` is 1 or 0 (there are no undefined bits);
* `v:isdefined()` returns `true` if and only if the vector contains a 1 or 0 (the vector is not completely undefined).

## The sim library

This library allows Lua code to interact with DigitalJS simulation, by observing the state of the circuit, changing input values, and waiting for events (only on specifically created threads).

### Reading output values

There are two functions for reading values of outputs:

* `sim.getoutput(s)` returns the value of the output whose `net` property equals `s`. 
   When used with yosys2digitaljs, this corresponds to Verilog module output names.
* `sim.getoutput_id(s)` returns the value of the output whose identifier (as in JSON circuit description) equals `s`.

### Setting input values

Similarly, there are two functions for setting input values:

* `sim.setinput(s, v)` sets the value of the input whose `net` property equals `s`.
  When used with yosys2digitaljs, this corresponds to Verilog module output names.
* `sim.setinput_id(s, v)` sets the value of the input whose identifier (as in JSON circuit description) equals `s`.

The vector `v` needs to have the same number of bits as the circuit input referred to by `s`.

### Getting simulation time

The function `sim.tick()` returns the current simulation time as an integer.

### Reading wire values

The function `sim.getvalue(s)` returns the value of a wire whose `netname` property equals `s`. 
This corresponds to the `name` property on a connector in JSON descriptor. 
When used with yosys2digitaljs, this corresponds to wire names in Verilog modules.

This function can also be called with more than one argument. When the call is `sim.getvalue(s1, ..., sn, s)`, the strings `s1` to `sn` denote subcircuit labels.

### Sleeping

The function `sim.sleep(n)` suspends execution of the script for `n` simulation cycles. 
This is possible only in threads started directly by DigitalJS and will not work in a coroutine.

### Waiting for events

The function `sim.wait(e[, n])` suspends execution of the script until the event named `e` happens. You can specify an event in one of the following ways:

* `sim.posedge(s1, ..., sn, s)` denotes a positive edge on a single bit wire named `s` (in a subcircuit named by path `s1` to `sn`);
* `sim.negedge(s1, ..., sn, s)` denotes a negative edge on a single bit wire named `s`;
* `sim.value(v, s1, ..., sn, s)` denotes the value of the wire named `s` changing to `v`.

To wait until one of a set of events happen, the events can be added together by using the bitwise or operator `|`.

The optional `n` parameter denotes a timeout.
If it is specified, the thread is resumed after `n` simulation cycles even if none of the specified events occur.

### Custom signal encoders/decoders

It is possible to add new, specialized signal encoders/decoders to DigitalJS.
Their role is to present data to the user in a meaningful way, and also to allow entering data in a human-readable format.
The built-in encoders/decoders present values in various number systems: binary, octal, decimal and hexadecimal.
A custom encoder/decoder can, for example, display processor instructions using assembly notation, or decode various hardware protocols.

An encoder/decoder is represented in Lua using a table with the following fields:

* `name` is a string, naming the encoder/decoder.
  The name is expected to be short, for example `bin` or `rv32i`.
* `pattern` is a regular expression in JavaScript format, describing the format of encodings allowed by the decoder.
  It is used to validate inputs in the user interface.
  The pattern can be more general than the actual set of accepted values, the `validate` function has the final say.
* `sort` is an integer, which decides the sorting order in the UI.
  Encoders/decoders having the same `sort` value are sorted by name.
  The built-in encoders/decoders have `sort` equal to 0.
  This can be used to distinguish specialized encoders/decoders so that they don't mix with the generic ones.
* `can(kind, bits)` is a function which should return a boolean value.
  The first parameter, `kind`, is a string, either `"read"` or `"show"`.
  The second parameter, `bits`, is a non-negative integer, and denotes a number of bits.
  The function should return `true` if and only if the encoder/decoder can encode (read) or decode (show) values having a given number of bits.
* `read(data, bits)` is a function which should return a three-value vector.
  The first parameter, `data`, is the string to encode into a binary format.
  The second parameter, `bits`, is a non-negative integer denoting the desired number of bits.
  The returned vector should have `bits` bits.
* `show(data)` is a function which should return a string.
  The parameter, `data`, is the three-value vector to decode into a human-readable format.
* `validate(data, bits)` is a function which should return a boolean value.
  The parameters have the same meaning as for the `read(data, bits)` function.
  The function should return `true` if and only if the `read` function would accept the given input.
  If the `validate` function is omitted, validation will be based on the `pattern` field.
* `size(bits)` is a function which should return a positive integer.
  The parameter, `bits`, is a non-negative integer denoting the number of bits we are interested in.
  The function should return the maximum number of characters required to decode a `bits`-sized value.
  This function is used by the UI to decide the size of an input or output field.

The functions above cannot sleep, wait for events, or yield in any other way.
They also should be pure functions, i.e. when called two times with same arguments, they should return the same value.

To register a custom signal encoder/decoder, it should be passed as an argument to `sim.registerdisplay()`.

## Examples

### Generating an oscillating signal

The following code generates on input `a` a square wave with period of 100 simulation cycles.

```lua
while true do
    sim.setinput("a", true);
    sim.sleep(50);
    sim.setinput("a", false);
    sim.sleep(50);
end
```

### Reading synchronous output

The following code prints a value on output `o` on a positive edge of the clock `clk` when the signal `v` is true:

```lua
while true do
    sim.wait(sim.posedge("clk"));
    if sim.getvalue("v"):ishigh() then
        print(sim.getoutput("o"));
    end
end
```

### Binary encoder/decoder

The following code is a encoder/decoder equivalent in functionality to the one built into DigitalJS.

```lua
sim.registerdisplay({
    name = "luabin",
    pattern = "[01x]*",
    sort = 0,
    can = function (kind, bits) 
        return true; 
    end,
    read = function (data, bits)
        return vec.frombin(data, bits);
    end,
    show = function (data)
        return data:tobin();
    end,
    validate = function (data, bits)
        return string.match(data, "^[01x]*$") ~= nil
    end,
    size = function (bits)
        return bits;
    end
})
```

### RISC V encoder/decoder

The linked code is a [encoder/decoder for RV32I instructions](examples/riscv.lua).

