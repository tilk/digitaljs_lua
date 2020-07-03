# Lua API for DigitalJS

The Lua API for DigitalJS consists of two Lua libraries: `vec` and `sim`.

* The `vec` library embeds three-value vectors of DigitalJS ([3vl](https://github.com/tilk/js_3vl)) into Lua.
* The `sim` library allows to access simulation state from Lua.

## The vec library

### Constructing vectors

The `vec` table is callable.
When called, it is like a constructor, building new three-value vectors.
The first and only parameter specifies the value of the vector. 
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
  
The above method of constructing vectors is also used in many API procedures in both `vec` and `sim`
where a vector is expected. This allows writing shorter, more concise scripts.

There also exist functions which construct vectors from a string written in a given numeric system,
a boolean or an integer. They are:

* `vec.frombin(s, n)` for binary,
* `vec.fromoct(s, n)` for octal,
* `vec.fromhex(s, n)` for hexadecimal,
* `vec.frombool(b, n)` for a boolean value,
* `vec.frominteger(k, n)` for an integer.

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
* Negated operations: bitwise nand `v:bnand(w)`, bitwise nor `v:bnor(w)`, bitwise xnor `v:bxnor(w);
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

TODO

## Examples

TODO
