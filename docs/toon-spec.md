# TOON v3.3 — Annotated Specification & Implementation Companion

**TL;DR:** TOON is a line-oriented, indentation-based format encoding the JSON data model with explicit lengths, deterministic quoting, and one active delimiter per array scope. This companion documents 100% conformance by the Rust (`reddb-io-toon`) and JavaScript (`@reddb-io/toon`) implementations against the official [toon-format/spec](https://github.com/toon-format/spec) v3.3 (author Johann Schopplich), including the design rationale, edge cases, and shared test corpora that keep both runtimes in sync. Credit to the original toon-format team for a specification written with RFC rigor and format restraint.

## Acknowledgment

This document is an *annotated companion* to the official **TOON** specification
— the Token-Oriented Object Notation created and stewarded by the
[toon-format](https://github.com/toon-format/spec) team and its author, Johann
Schopplich. Every design decision walked through below is theirs; our
contribution is only the annotation — the corner cases we hit, the decision trees
we followed, and the record of how our two implementations conform. We are
grateful for a specification written with the rigor of an RFC and the restraint
of a good format: explicit lengths, deterministic quoting, one active delimiter,
indentation instead of braces. It is because the base is so clean that we can
claim 100% conformance in two runtimes and mean it.

**Source and attribution.** The normative text this companion follows is
`SPEC.md` from [toon-format/spec](https://github.com/toon-format/spec), **Working
Draft v3.3** (dated 2026-05-21, author Johann Schopplich), released under the
**MIT License**. It is vendored in this repository as the `vendor/toon-spec` git
submodule, pinned at commit
**`f55b93ac489f297ff597d95e4c19ae84675eaeb7`**. That pin is the exact revision our
conformance suite runs against. The MIT License permits derivation with
attribution; this document derives structure and quotes short normative fragments
from the official spec and attributes them to that source and pin. For the
authoritative text, always read `vendor/toon-spec/SPEC.md` at the pinned commit.
This companion is informative about our implementation and does not override the
official specification.

The key words MUST, MUST NOT, SHOULD, MAY, etc. carry their RFC 2119 meaning when
quoted from the official spec; our implementation notes use them descriptively.

## How to read this companion

Each section below mirrors a section of the official v3.3 spec, in order. Within
each we give:

- **What it defends** — the intent of the official section and its main decision
  tree.
- **Corner cases** — the edges the spec calls out (or that bite implementers).
- **Our implementation** — how the Rust crate (`reddb-io-toon`) and the JS package
  (`@reddb-io/toon`) handle it, and where a shared corpus pins the behavior.

Our *engineering wins* — dual-runner corpora, the json-limits corpus, the depth
guard, and registry-verified releases — are woven in where the relevant section
motivates them, and summarized under [Implementation guarantees](#implementation-guarantees).

Two things this companion is **not**: it is not the reddb-io *extensions* (nested
tabular headers, keyed-map collapse, the depth-guard rationale, wire-efficiency
numbers) — those live in
[`toon-spec-reddb-flavored.md`](toon-spec-reddb-flavored.md) — and it is not the
streaming layer, which is [`toonl.md`](toonl.md).

## Table of Contents

- [Abstract & Status](#abstract--status-official-abstract-status)
- [Terminology and Conventions](#1-terminology-and-conventions)
- [Data Model](#2-data-model)
- [Encoding Normalization](#3-encoding-normalization-reference-encoder)
- [Decoding Interpretation](#4-decoding-interpretation-reference-decoder)
- [Concrete Syntax and Root Form](#5-concrete-syntax-and-root-form)
- [Header Syntax](#6-header-syntax-normative)
- [Strings and Keys](#7-strings-and-keys)
  - [Escaping](#71-escaping)
  - [Quoting Rules for String Values](#72-quoting-rules-for-string-values)
  - [Key Encoding](#73-key-encoding)
  - [Decoding Rules for Strings and Keys](#74-decoding-rules-for-strings-and-keys)
- [Objects](#8-objects)
- [Arrays](#9-arrays)
  - [Primitive Arrays (Inline)](#91-primitive-arrays-inline)
  - [Arrays of Arrays (Primitives Only)](#92-arrays-of-arrays-primitives-only)
  - [Arrays of Objects — Tabular Form](#93-arrays-of-objects--tabular-form)
  - [Mixed / Non-Uniform Arrays — Expanded List](#94-mixed--non-uniform-arrays--expanded-list)
- [Objects as List Items](#10-objects-as-list-items)
- [Delimiters](#11-delimiters)
- [Indentation and Whitespace](#12-indentation-and-whitespace)
- [Conformance and Options](#13-conformance-and-options)
  - [Key Folding and Path Expansion](#134-key-folding-and-path-expansion)
- [Strict Mode Errors](#14-strict-mode-errors-authoritative-checklist)
- [Security Considerations](#15-security-considerations)
- [Internationalization](#16-internationalization)
- [IANA Considerations](#17-iana-considerations)
- [Versioning and Extensibility](#18-versioning-and-extensibility)
- [Intellectual Property Considerations](#19-intellectual-property-considerations)
- [Appendices A–F](#appendices-af-informative)
- [Implementation Guarantees](#implementation-guarantees)

## Abstract & Status (official §Abstract, §Status)

**What it defends.** TOON is a line-oriented, indentation-based text format that
encodes the JSON data model with explicit structure and minimal quoting. Arrays
declare length and an optional field list once; rows use a single active delimiter
(comma, tab, or pipe). It is a Working Draft — stable for implementation but not
finalized; breaking changes may occur across major versions.

**Our implementation.** We treat the pinned submodule as the contract and track
upstream by advancing the pin deliberately, never by drifting a vendored copy.
Because the status is "Working Draft", our conformance suite reads fixtures **live
from the submodule**, so an upstream change surfaces as a test signal rather than
silent divergence.

**Examples:**

Valid TOON document (root object):
```toon
name: Alice
age: 30
active: true
```

```json
{"name": "Alice", "age": 30, "active": true}
```

Valid TOON document (root array):
```toon
[2]:Alice,30
Bob,25
```

```json
[["Alice", 30], ["Bob", 25]]
```

Invalid TOON (array lacks declared length):
```toon
[]:Alice,30
```

> Error: Empty array `[]` form disallows inline rows; use `key[N]` to declare a non-zero count.

## §1 Terminology and Conventions

**What it defends.** A shared vocabulary and the RFC 2119 normativity rule:
keywords are normative only in all-caps, and all normative text lives in §§1–16
(appendices are informative unless marked otherwise). It fixes the core structural
terms (indentation *level*/depth, indentation *unit*/`indentSize`), the array
terms (header, field list, list item), and — critically — the **three delimiter
roles**: the delimiter character, the *document delimiter* (quoting decisions
outside any array scope), and the *active delimiter* (declared by the nearest
array header).

**Decision tree it sets up.** The document-vs-active delimiter split (§1.5) is the
root of most quoting decisions later: object field values quote against the
document delimiter; inline array values and tabular cells quote against the active
delimiter. §1.9 introduces the stricter `IdentifierSegment`
(`^[A-Za-z_][A-Za-z0-9_]*$`) used only for key-folding/expansion eligibility,
distinct from the permissive unquoted-key pattern (which allows dots).

**Corner cases.** The `IdentifierSegment` vs unquoted-key distinction is a
frequent implementer trap: dotted keys are *valid literal keys* but *not*
fold/expand-eligible segments. Tabs are legal as a delimiter and inside quoted
strings but never as indentation.

**Our implementation.** Both runtimes model the two delimiter roles explicitly and
keep the folding-eligibility predicate separate from the unquoted-key predicate,
so a dotted literal key is never accidentally expanded (see §13.4).

**Examples:**

Valid `IdentifierSegment` key (eligible for folding):
```toon
address_zip: 12345
```

```json
{"address_zip": 12345}
```

Valid literal key (not an `IdentifierSegment`, not fold-eligible):
```toon
"user.full-name": Bob Smith
```

```json
{"user.full-name": "Bob Smith"}
```

Valid quoted key in array header (keyed array):
```toon
"my-key"[2]{first,second}:
Alice,30
Bob,25
```

```json
{"my-key": [{"first": "Alice", "second": 30}, {"first": "Bob", "second": 25}]}
```

Invalid: unquoted key with special characters:
```toon
user.full-name: Bob Smith
```

> Error: Keys containing dots (when not intended as path expansion) must be quoted.

## §2 Data Model

**What it defends.** TOON carries exactly the JSON data model —
primitive/object/array — and pins two ordering guarantees (array order preserved;
object key order preserved as encountered) and a **canonical number form**.

**The number decision tree (encoding).** For `n = 0` or `1e-6 ≤ |n| < 1e21`:
canonical decimal, *no* exponent, no leading zeros (except the single `0`), no
trailing fractional zeros, integer-valued numbers emitted as integers, and `-0`
normalized to `0`. Outside that range (non-zero `|n| < 1e-6`, or `|n| ≥ 1e21`),
encoders MAY use JSON exponent notation, SHOULD use lowercase `e` with an explicit
sign for determinism. The overriding requirement: emit enough precision that
`decode(encode(x)) == x` under JSON-model equality.

**Corner cases.** `1e6` MUST render as `1000000`; `1.0` as `1`; `1.5000` as `1.5`.
Out-of-domain numbers (arbitrary-precision decimals, integers beyond the host
domain) may be stringified losslessly *or* approximated, but the choice MUST be
documented, and encoders SHOULD expose lossless stringification.

**Our implementation & engineering win — the json-limits corpus.** Number handling
is exactly where two independent runtimes drift, so we pin it with a **shared
JSON-edge corpus**, `tests/json-limits/corpus.json` (`json-limits-v0.1`), run
identically by the JS package and the Rust crate. It fixes behavior at the
boundaries — `9007199254740991` (max safe integer), `…992` (one past it),
precision-sensitive decimals — asserting the same canonical TOON string and the
same round-trip JSON from both. This is how we keep the crate's `i64`/`f64` domain
and JavaScript's IEEE-754 `number` from disagreeing about a boundary value.

**Examples:**

Valid canonical number forms:
```toon
integer: 42
decimal: 1.5
zero: 0
normalized_one: 1
normalized_from_exponent: 1000000
```

```json
{"integer": 42, "decimal": 1.5, "zero": 0, "normalized_one": 1, "normalized_from_exponent": 1000000}
```

Valid but non-canonical (accepted on decode, normalized on encode):
```toon
from_exponent: 1e6
trailing_zeros: 1.5000
negative_zero: -0
```

```json
{"from_exponent": 1000000, "trailing_zeros": 1.5, "negative_zero": 0}
```

Invalid: leading zeros in integer part:
```toon
bad_leading_zero: 05
```

> Error: Leading zeros in integers are forbidden; `05` decodes as the string `"05"`, not the number `5`.

## §3 Encoding Normalization (Reference Encoder)

**What it defends.** Non-JSON host values MUST be normalized to the JSON model
before encoding, and the mapping MUST be documented. `NaN`/`±Infinity → null`.
Implementations MAY honor host serialization hooks (`toJSON()`,
`serde::Serialize`, `json.Marshaler`, …), which SHOULD take precedence and MUST be
documented. Informative mappings: dates → ISO 8601 strings, sets → arrays, maps →
objects, unrecognized host values → null.

**Our implementation.** The JS package normalizes via the standard JS value model;
the Rust crate normalizes from its `Value` model and from `serde` inputs. Both
document their host-type mapping; `NaN`/`±Infinity → null` is enforced on the
encode path.

**Examples:**

Valid JSON-model values (primitives, object, array):
```toon
string: hello
number: 42
boolean: true
nullValue: null
```

```json
{"string": "hello", "number": 42, "boolean": true, "nullValue": null}
```

Host-value normalization (NaN and Infinity become null):
```toon
# In JavaScript: encode({bad: NaN, inf: Infinity}) produces:
special: null
infinity: null
```

```json
{"special": null, "infinity": null}
```

## §4 Decoding Interpretation (Reference Decoder)

**What it defends.** How text tokens become host values. Quoted tokens are strings
(unescaped per §7.1) even if they look numeric; unquoted `true`/`false`/`null`
decode to boolean/null; numeric parsing accepts decimal and exponent input.

**The leading-zero decision tree.** Tokens with forbidden leading zeros in the
*integer* part (`05`, `0001`, `-05`) decode as **strings**, not numbers — but a
single `0` integer part followed by a fraction or exponent (`0.5`, `0e1`, `-0.5`)
is a valid number. `-0 → 0`. The literal `[]` in field or root position decodes as
an empty array. Everything else unquoted → string. A key MUST be followed by a
colon.

**Corner cases.** `1.5000 → 1.5`, `-1E+03 → -1000`. Out-of-domain decoded numbers
MAY be widened, stringified, or approximated per a documented policy;
lossless-first is RECOMMENDED for interchange libraries.

**Our implementation.** Both runtimes implement the leading-zero rule exactly (it
is a common source of silent wrong answers) and document their out-of-range
policy. The json-limits corpus (§2) covers the boundary tokens on the decode side
too — a decode "passes" only when the value equals the fixture's expected JSON
*and* our own canonical output round-trips to it (see [Implementation
guarantees](#implementation-guarantees)).

**Examples:**

Valid numeric tokens:
```toon
integer: 42
decimal: 3.14
exponent: 1E+03
zero: 0
```

```json
{"integer": 42, "decimal": 3.14, "exponent": 1000, "zero": 0}
```

Forbidden leading zeros (decode as strings):
```toon
leading_zero: 05
prefix_zero: 0001
```

```json
{"leading_zero": "05", "prefix_zero": "0001"}
```

Valid zero forms:
```toon
single_zero: 0
zero_decimal: 0.5
zero_exponent: 0e1
```

```json
{"single_zero": 0, "zero_decimal": 0.5, "zero_exponent": 0}
```

Invalid: unterminated string:
```toon
bad: "unterminated
```

> Error: Unterminated quoted string.

## §5 Concrete Syntax and Root Form

**What it defends.** The line/indentation model and, importantly, the **root-form
discovery** decision tree.

**Root-form decision tree.** In order:
1. First non-empty depth-0 line is a valid root array header → **root array**.
2. Exactly one non-empty line, the literal `[]` → **empty root array**.
3. Exactly one non-empty line, neither a header nor a key-value line →
   **single primitive** (`hello`, `42`, `true`).
4. Otherwise → **object**.
5. Empty document (no non-empty lines) → **empty object `{}`**.

**Corner cases.** In strict mode, two-or-more non-empty depth-0 lines that are
neither headers nor key-value lines is invalid (e.g. `hello\nworld` is *not* two
primitives — it is a malformed document).

**Our implementation.** Both runtimes implement this exact precedence; the
"two bare primitives at root" rejection is covered by the shared corpus.

**Examples:**

Valid root array (declared length, rows):
```toon
[2]:
Alice,30
Bob,25
```

```json
[["Alice", 30], ["Bob", 25]]
```

Valid empty root array:
```toon
[]
```

```json
[]
```

Valid single root primitive:
```toon
hello world
```

```json
"hello world"
```

Valid root object:
```toon
name: Alice
age: 30
```

```json
{"name": "Alice", "age": 30}
```

Valid empty document (empty root object):
```toon
```

```json
{}
```

Invalid: two bare primitives at root:
```toon
hello
world
```

> Error in strict mode: Multiple top-level primitives are ambiguous; this is neither an array (lacks header) nor an object (lacks colons). Malformed document.

## §6 Header Syntax (Normative)

**What it defends.** Array headers declare length, active delimiter, and optional
field names, with a normative ABNF. Forms: `[N]:`, `key[N]:`,
`key[N]{f1,f2}:`; delimiter symbol absent = comma, HTAB = tab, `|` = pipe.

**The rules that bite.**
- Length MUST be a non-negative integer with **no leading zeros** (`0` is the only
  canonical zero); `[03]`, `[-1]`, `[bar]` are not bracket segments.
- **No content between `]` and `{`/`:`** — `[1][bar]:`, `[2]extra:`, `[2] :` are
  strict-mode errors; non-strict decoders MAY fall through to key-value parsing
  with the key as a literal token.
- The bracket/fields delimiter-equality rule is *not* expressed by the ABNF;
  implementations enforce it, and a mismatch MUST error in strict mode.
- Absence of a delimiter symbol **always** means comma, with no inheritance from a
  parent header.
- Folded key prefixes (§13.4) are allowed as the key part; the bracket/field
  grammar is unchanged.

**Our implementation.** Header parsing follows Appendix B.2: isolate the optional
key prefix (quoted literal or up-to-first-`[`), parse length, then the optional
trailing delimiter symbol, then the optional `{…}` fields, then require the colon.
Delimiter equality between bracket and fields is enforced, not merely parsed.

**Examples:**

Valid primitive array header (comma-delimited):
```toon
items[3]: apple,banana,cherry
```

```json
{"items": ["apple", "banana", "cherry"]}
```

Valid tabular array header (field names, default comma delimiter):
```toon
people[2]{name,age}:
Alice,30
Bob,25
```

```json
{"people": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}
```

Valid tab-delimited array:
```toon
data[2]	:
val1	val2
val3	val4
```

```json
{"data": [["val1", "val2"], ["val3", "val4"]]}
```

Invalid: leading zeros in length:
```toon
items[03]: apple,banana,cherry
```

> Error: Array length `03` has a forbidden leading zero; only `0` and lengths without leading zeros are valid.

Invalid: content between bracket and colon:
```toon
items[3]extra: apple,banana,cherry
```

> Error in strict mode: Content `extra` found between bracket and colon; must be either nothing or field list `{…}` (delimiter mismatch).

Invalid: delimiter mismatch (bracket vs fields):
```toon
people[2]|{name,age}:
```

> Error: Bracket declares `|` delimiter but field list uses `,`; delimiters must match.

## §7 Strings and Keys

### §7.1 Escaping

**What it defends.** A closed escape repertoire (`\\`, `\"`, `\n`, `\r`, `\t`,
`\uXXXX` for other C0 controls) with a **first-matching-row** table and separate
encoder/decoder columns. Lone surrogates (`U+D800–U+DFFF`) MUST be rejected when
decoded from `\uXXXX`; supplementary scalars MUST be emitted as literal UTF-8, and
surrogate escapes for them MUST be rejected. Decoders MUST reject any unlisted
escape, `\u` with fewer than four hex digits, and unterminated strings.

**Corner cases.** Tabs are `\t` inside quoted strings on encode, though the ABNF's
`unescaped-char` tolerates a literal HTAB on decode. Hex in `\uXXXX` is
case-insensitive on decode, lowercase SHOULD on encode.

**Our implementation.** Both runtimes implement the exact table and the surrogate
rejections; the "reject invalid escape / unterminated string" cases are in the
shared corpus (e.g. `name: "bad\xescape"` from Appendix A error cases).

**Examples:**

Valid escape sequences:
```toon
backslash: "path\\to\\file"
quote: "He said \"hello\""
newline: "line1\nline2"
tab: "col1\tcol2"
unicode: "emoji A"
```

```json
{"backslash": "path\\to\\file", "quote": "He said \"hello\"", "newline": "line1\nline2", "tab": "col1\tcol2", "unicode": "emoji A"}
```

Invalid: unknown escape sequence:
```toon
bad: "unknown\xescape"
```

> Error: `\x` is not a valid escape; only `\\`, `\"`, `\n`, `\r`, `\t`, and `\uXXXX` are permitted.

Invalid: lone surrogate in `\uXXXX`:
```toon
bad_surrogate: "\uD800"
```

> Error: Lone surrogate `U+D800` is not valid; surrogates must be paired or replaced with the actual UTF-8 character.

### §7.2 Quoting Rules for String Values

**The quote-or-not decision tree.** A string MUST be quoted if any hold: empty;
leading/trailing whitespace; equals `true`/`false`/`null`; numeric-like (matches
`/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i`); contains `:`, `"`, `\`, brackets or braces;
contains a C0 control; contains the *relevant* delimiter (active for
array/tabular cells, document for object field values); equals `-` or starts with
`-`. Otherwise it MAY be unquoted — Unicode, emoji, and internal spaces are safe.

**Corner cases.** The "relevant delimiter" is context-dependent (§11): the same
string may need quoting as a tabular cell but not as an object field value under a
different document delimiter. `"05"` is numeric-like → quoted so it survives as a
string.

**Our implementation.** Both runtimes compute the relevant delimiter from context
(active vs document) before applying the predicate — the single most important
detail for byte-identical output between the two runtimes.

**Examples:**

Valid unquoted strings (safe in document context):
```toon
name: Alice
city: New York
price: $9.99
```

```json
{"name": "Alice", "city": "New York", "price": "$9.99"}
```

Strings that must be quoted (keyword, numeric-like, leading dash):
```toon
flag: true
numeric: "123"
negative: "-5"
empty: ""
url: "http://example.com"
```

```json
{"flag": true, "numeric": "123", "negative": "-5", "empty": "", "url": "http://example.com"}
```

Context-dependent quoting (comma-delimited array):
```toon
items[3]: apple, "banana,split", cherry
```

```json
{"items": ["apple", "banana,split", "cherry"]}
```

> Note: `"banana,split"` must be quoted in the array because comma is the active delimiter. In object context (document delimiter), it might not be quoted if the delimiter were different.

### §7.3 Key Encoding

**What it defends.** Keys and field names MAY be unquoted only if they match
`^[A-Za-z_][A-Za-z0-9_.]*$`; otherwise MUST be quoted and escaped. Keys requiring
quoting MUST be quoted in *all* contexts, including array headers (`"my-key"[N]:`).

**Our implementation.** Enforced uniformly across object fields, tabular field
names, and header key prefixes; the `"my-key"[3]:` and `"x-items"[2]{…}:` cases
from Appendix A are in the corpus.

**Examples:**

Valid unquoted keys (IdentifierSegment only):
```toon
user_id: 123
firstName: Alice
```

```json
{"user_id": 123, "firstName": "Alice"}
```

Valid quoted keys (special characters):
```toon
"user-id": 123
"first.name": Alice
"content type": "application/json"
```

```json
{"user-id": 123, "first.name": "Alice", "content type": "application/json"}
```

Quoted key in array header:
```toon
"my-key"[2]{name,age}:
Alice,30
Bob,25
```

```json
{"my-key": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}
```

Invalid: unquoted key with hyphen:
```toon
user-id: 123
```

> Error: Key `user-id` contains `-`, which requires quoting; write `"user-id": 123`.

### §7.4 Decoding Rules for Strings and Keys

Quoted keys MUST be unescaped per §7.1; a key MUST be followed by `:` or the
decoder MUST error. Handled identically in both runtimes.

**Examples:**

Valid key-value pairs (key followed by colon):
```toon
"escaped key": value
simple: 42
```

```json
{"escaped key": "value", "simple": 42}
```

Invalid: missing colon after key:
```toon
name Alice
```

> Error: Key `name` must be followed by `:`, not by the value directly.

## §8 Objects

**What it defends.** `key: value` for primitives (single space after colon);
`key:` alone opens a nested/empty object; key order preserved on emit; an empty
root object yields an empty document.

**The bare-`key:` decision.** A bare `key:` with nothing after the colon MUST
decode as an empty/nested **object**, *not* an empty array — empty arrays use the
explicit `key: []` form (§9.1). Dotted keys are single literal keys unless path
expansion is enabled (§13.4). Duplicate sibling keys → §14.4.

**Corner cases.** The object-vs-empty-array distinction at `key:` is a classic
ambiguity the spec resolves firmly in favor of object; getting it wrong silently
changes shape.

**Our implementation.** Both runtimes decode bare `key:` to an object and require
`key: []` for the empty array, matching the spec exactly.

**Examples:**

Valid nested object (bare `key:`):
```toon
address:
  street: 123 Main St
  city: Anytown
```

```json
{"address": {"street": "123 Main St", "city": "Anytown"}}
```

Valid empty nested object:
```toon
metadata:
```

```json
{"metadata": {}}
```

Valid empty array (explicit `[]` form):
```toon
tags: []
```

```json
{"tags": []}
```

Dotted key (literal, not expanded unless opt-in):
```toon
"user.profile.name": Alice
```

```json
{"user.profile.name": "Alice"}
```

Invalid: bare `key:` without nested content at same or deeper level creates empty object:
```toon
address:
name: Alice
```

> Note: `address` is an empty object `{}`; `name` is a sibling key because it is at the same depth. The structure is `{"address": {}, "name": "Alice"}`.

## §9 Arrays

### §9.1 Primitive Arrays (Inline)

`key[N]: v1,v2,…`, split on the active delimiter; empty tokens (even
whitespace-surrounded) decode to the empty string; strict mode requires the
decoded count to equal `N`. Empty arrays: `key: []` / `[]` preferred, legacy
`key[0]:` / `[0]:` accepted.

**Examples:**

Valid primitive array (comma-delimited):
```toon
colors[3]: red, green, blue
```

```json
{"colors": ["red", "green", "blue"]}
```

Valid array with empty string:
```toon
items[3]: apple, , cherry
```

```json
{"items": ["apple", "", "cherry"]}
```

Valid empty array (preferred form):
```toon
tags: []
```

```json
{"tags": []}
```

Valid empty array (legacy form):
```toon
tags[0]:
```

```json
{"tags": []}
```

Invalid: inline count mismatch (in strict mode):
```toon
colors[3]: red, green
```

> Error in strict mode: Array `colors` declared length `3` but has only `2` elements (actual row count does not match declared `N`).

### §9.2 Arrays of Arrays (Primitives Only)

Parent header `key[N]:` then `- [M]: …` list items at depth +1; inner arrays split
on their own active delimiter; strict mode enforces both `M` and outer `N`. The
`key: []` field-form does **not** apply to list-item inner arrays.

**Examples:**

Valid array of arrays (two inner arrays of 2 elements each):
```toon
matrix[2]:
- [2]: 1,2
- [2]: 3,4
```

```json
{"matrix": [[1, 2], [3, 4]]}
```

Valid with tab-delimited inner arrays:
```toon
data[2]:
- [2]	: a	b
- [2]	: c	d
```

```json
{"data": [["a", "b"], ["c", "d"]]}
```

Invalid: outer count mismatch (in strict mode):
```toon
matrix[3]:
- [2]: 1,2
- [2]: 3,4
```

> Error in strict mode: Array `matrix` declared `3` list items but found only `2`.

Invalid: inner count mismatch:
```toon
matrix[2]:
- [2]: 1,2
- [3]: 3,4,5
```

> Note: In strict mode, each `[M]` is checked; if the outer count alone is satisfied, the inner count mismatch on the second item would fail in strict mode.

### §9.3 Arrays of Objects — Tabular Form

**The tabular-detection decision tree (encoding, MUST hold for all elements):**
every element is an object; each has ≥1 key; **no** element is an empty `{}`; all
share the same key set (per-object order MAY vary); all values are primitives.
When satisfied, emit `key[N]{fields}:` with field order from the first object's
key encounter order, one row per object at depth +1.

**The row-vs-key-value disambiguation (decoding).** At row depth, for unquoted
tokens: compute the first unquoted active delimiter and the first unquoted colon.
No unquoted colon → **row**. Both present: delimiter-before-colon → **row**,
colon-before-delimiter → **key-value line (rows end)**. Colon but no delimiter →
**key-value line**. Strict mode enforces row width = field count and row count =
`N`.

**Corner cases.** A quoted colon inside a cell (`1,"http://a:b"`) does not end the
rows — only *unquoted* positions count. Tabular arrays as the first field of a
list-item object interact with §10 indentation.

**Our implementation.** Both runtimes implement the first-unquoted-position
comparison verbatim; the quoted-colon and mixed cases are pinned by the corpus.

**Examples:**

Valid tabular array (field names, comma-delimited):
```toon
people[2]{name,age}:
Alice,30
Bob,25
```

```json
{"people": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}
```

Valid with quoted value containing the active delimiter:
```toon
urls[2]{title,link}:
Home,"http://example.com"
Docs,"http://example.com/docs"
```

```json
{"urls": [{"title": "Home", "link": "http://example.com"}, {"title": "Docs", "link": "http://example.com/docs"}]}
```

Valid with quoted colon inside a cell (does not end the row):
```toon
entries[1]{description,url}:
"Time: 12:34:56","http://a:b"
```

```json
{"entries": [{"description": "Time: 12:34:56", "url": "http://a:b"}]}
```

Invalid: row width mismatch (in strict mode):
```toon
people[2]{name,age}:
Alice,30
Bob
```

> Error in strict mode: Row `2` has `1` field(s) but header declares `2` field(s).

Invalid: row count mismatch:
```toon
people[2]{name,age}:
Alice,30
Bob,25
Charlie,35
```

> Error in strict mode: Tabular array `people` declared `2` rows but found `3`.

### §9.4 Mixed / Non-Uniform Arrays — Expanded List

When tabular requirements fail: `key[N]:` then one list item per element —
`- <primitive>`, `- [M]: …` for primitive arrays, nested headers for
arrays-of-objects/non-uniform (tabular form is unavailable in this nested
position; expanded list MUST be used), objects per §10. Strict mode enforces list
count = `N`.

**Examples:**

Valid mixed array (primitive, nested array, object):
```toon
items[3]:
- hello
- [2]: 1, 2
- key: value
```

```json
{"items": ["hello", [1, 2], {"key": "value"}]}
```

Valid non-uniform array of objects (different keys per object):
```toon
records[2]:
- name: Alice
  age: 30
- name: Bob
  country: USA
```

```json
{"records": [{"name": "Alice", "age": 30}, {"name": "Bob", "country": "USA"}]}
```

Invalid: count mismatch (in strict mode):
```toon
items[3]:
- hello
- world
```

> Error in strict mode: Array `items` declared `3` list items but found `2`.

## §10 Objects as List Items

**What it defends.** How an object renders as a list item, and specifically the
**tabular-first-field** case. Empty object list item is a bare `-`. When a
list-item object's *first field in encounter order* is a tabular array, encoders
MUST put the tabular header on the hyphen line
(`- key[N]{fields}:`), rows at depth +2, and all other fields at depth +1 — never
rows at +1 or sibling fields level with rows. For all other cases the first field
SHOULD go on the hyphen line.

**Corner cases.** This is the fiddliest indentation rule in the spec (depth +2 for
rows, +1 for sibling fields, relative to the hyphen). The decoder mirror: a
`- key[N]{fields}:` line starts a tabular field; depth +2 lines are its rows; a
depth +1 line after rows terminates them.

**Our implementation.** Both runtimes implement the +2/+1 relative-indentation rule
and its decode mirror; Appendix A's "nested tabular inside a list item" example is
in the corpus.

**Examples:**

Valid object as list item (first field on hyphen line):
```toon
items[2]:
- name: Alice
  age: 30
- name: Bob
  age: 25
```

```json
{"items": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}
```

Valid: tabular field as first field (rows at depth +2, siblings at depth +1):
```toon
collection[2]:
- tags[2]{tag,count}:
  important,5
  urgent,3
  owner: Alice
- tags[1]{tag,count}:
  done,2
  owner: Bob
```

```json
{"collection": [{"tags": [{"tag": "important", "count": 5}, {"tag": "urgent", "count": 3}], "owner": "Alice"}, {"tags": [{"tag": "done", "count": 2}], "owner": "Bob"}]}
```

Valid: empty object as list item (bare hyphen):
```toon
items[1]:
-
```

```json
{"items": [{}]}
```

Invalid: improper indentation (rows at depth +1 instead of +2):
```toon
collection[2]:
- tags[2]{tag,count}:
  important,5
  urgent,3
owner: Alice
```

> Error: Row `1` is at depth +1, but tabular rows must be at depth +2 relative to the hyphen. The `owner: Alice` field should be at depth +1 (sibling to the `tags` header), but improperly indented rows confuse the structure.

## §11 Delimiters

**What it defends.** The three delimiters and, in §11.1/§11.2, the encode/decode
consequences of the document-vs-active split: inline array values and tabular
cells quote/split against the **active** delimiter (nearest header); object field
values quote against the **document** delimiter regardless of enclosing array
scope; on decode, object field values are parsed as a single post-colon token (the
document delimiter is not a decoder concept). Nested headers may change the active
delimiter; empty tokens are preserved with surrounding spaces trimmed.

**Our implementation.** The active/document split is a first-class concept in both
runtimes' quoting and splitting paths — see §7.2. This is the reddb *flavor's*
lever for tab/pipe delimiter choice, documented in
[`toon-spec-reddb-flavored.md`](toon-spec-reddb-flavored.md#delimiter-choice);
the base behavior here is pure v3.3.

**Examples:**

Valid comma-delimited array (document delimiter is also comma, but object fields quote against document):
```toon
numbers[3]: 1, 2, 3
description: "item, with comma"
```

```json
{"numbers": [1, 2, 3], "description": "item, with comma"}
```

Valid tab-delimited array:
```toon
data[2]	:
a	b
c	d
note: "separate	by	tabs"
```

```json
{"data": [["a", "b"], ["c", "d"]], "note": "separate\tby\ttabs"}
```

Valid pipe-delimited array:
```toon
items[2]|:
apple|red
banana|yellow
note: "pipe | character"
```

```json
{"items": [["apple", "red"], ["banana", "yellow"]], "note": "pipe | character"}
```

> Note: In object context (document delimiter), the same value may not need quoting if the delimiter choice is different.

## §12 Indentation and Whitespace

**What it defends.** Encoders MUST use a consistent spaces-per-level (default 2, no
tabs), exactly one space after `key:` and after array headers with inline values,
no trailing spaces, and **no trailing newline**. Strict decoders require
leading-space counts to be exact multiples of `indentSize` and reject tab
indentation; non-strict decoders MAY use `floor(spaces/indentSize)` and MAY accept
tabs (policy documented). Blank lines are ignored outside arrays but are strict
errors inside arrays/tabular rows.

**Corner cases.** The "no trailing newline at EOF" encode rule vs "decoders SHOULD
accept a trailing newline" decode rule is an asymmetry worth internalizing:
canonical output has none, but decode tolerates one.

**Our implementation.** Canonical output from both runtimes emits no trailing
newline and no trailing spaces; strict decode enforces the indentation-multiple
and no-tab-indent rules. The whitespace invariants are part of what the encode
corpus checks byte-for-byte.

**Examples:**

Valid canonical indentation (2 spaces per level, no trailing spaces or newlines):
```toon
user:
  name: Alice
  address:
    street: 123 Main
    city: Anytown
```

```json
{"user": {"name": "Alice", "address": {"street": "123 Main", "city": "Anytown"}}}
```

Valid with custom indent size (4 spaces per level):
```toon
user:
    name: Alice
    address:
        street: 123 Main
```

```json
{"user": {"name": "Alice", "address": {"street": "123 Main"}}}
```

Invalid: non-multiple indentation (in strict mode):
```toon
user:
  name: Alice
   age: 30
```

> Error in strict mode: Line `3` has `3` spaces of indentation, which is not a multiple of `indentSize: 2`. Indentation must be exact multiples.

## §13 Conformance and Options

**What it defends.** Per-class checklists (§13.1 encoder, §13.2 decoder, §13.3
validator) and the option set: encoder `indentSize`, `delimiter`, `keyFolding`,
`flattenDepth`; decoder `indentSize`, `strict` (default true), `expandPaths`.
Option names are concept handles; host-idiomatic spellings are allowed if
documented.

**Our implementation.** Both runtimes satisfy every applicable checklist item at
the pinned corpus. `strict` defaults to true; the decoder options
(`indent`/`indentSize`, `strict`, `expandPaths`) are exposed on both surfaces
(`parse(input, options)` in JS, `ParseOptions`/`Document::parse_with_options` in
Rust). Note our **depth guard** (`max_depth`, default 1000) is an *additional*
robustness option beyond the spec's set — it changes no decoded value and is
documented in the flavored spec.

**Examples:**

Valid with strict mode enabled (default, detects truncation):
```toon
items[3]: apple, banana, cherry
```

```json
{"items": ["apple", "banana", "cherry"]}
```

Non-strict mode (allows count mismatches, silently):
```toon
items[5]: apple, banana
```

> In non-strict mode: `{"items": ["apple", "banana"]}` (silently accepts fewer elements than declared).

Custom `indentSize` option (4 spaces per level):
```toon
nested:
    field: value
```

> Parsed with `ParseOptions { indentSize: 4, … }`

### §13.4 Key Folding and Path Expansion

**What it defends.** Optional, symmetric transforms (both default `"off"`):
encoder *key folding* collapses chains of single-key objects into dotted paths;
decoder *path expansion* splits dotted keys back into nesting.

**The foldability decision tree.** A chain `K1→…→KL` is foldable when each
non-terminal `Ki` is an object with exactly one key, the chain stops at the first
non-single-key object / leaf / array, and the leaf is a primitive, array, or empty
object. **Safe-mode** requires every folded segment to be an `IdentifierSegment`
(§1.9, no dots) and the folded key to not collide with an existing sibling literal
key. `flattenDepth` bounds how many segments fold (default Infinity; `<2` has no
effect).

**The expansion conflict decision tree.** Object+Object → deep merge;
Object+Non-object, Array+anything, Primitive+Primitive → **conflict**. With
`strict=true` (default) a conflict MUST error; with `strict=false`, last-write-wins
in document order, silently. Expansion runs *after* base parsing (§§4–12) and
*before* returning the value; §14 structural checks operate on the pre-expanded
structure.

**Corner cases.** `{data: {"full-name": {x:1}}}` is *not* folded (`"full-name"` is
not an `IdentifierSegment`). `a.b: 1` then `a: 2` errors under strict expand,
LWW-resolves to `{a:2}` under non-strict. Quoted dotted keys stay literal.

**Our implementation.** Both runtimes gate folding/expansion on the
`IdentifierSegment` predicate (kept separate from the permissive unquoted-key
predicate, §1) and implement the strict-conflict/LWW branch per §14.3. Both default
`keyFolding`/`expandPaths` to `"off"`, so round-trip is literal unless the caller
opts in.

**Examples:**

Literal (no folding, default):
```toon
user:
  profile:
    name: Alice
```

```json
{"user": {"profile": {"name": "Alice"}}}
```

With key folding enabled (encodes as dotted path):
```toon
user.profile.name: Alice
```

> Input (unfolded JSON): `{"user": {"profile": {"name": "Alice"}}}`
> Encoded with `keyFolding: "safe"`: `user.profile.name: Alice`

Path expansion (decoding dotted keys):
```toon
user.profile.name: Alice
```

> Parsed with `expandPaths: true`: `{"user": {"profile": {"name": "Alice"}}}`
> Parsed with `expandPaths: false` (default): `{"user.profile.name": "Alice"}`

Foldable chain requires all `IdentifierSegment`s:
```toon
"my-obj":
  "nested-key": value
```

> Not foldable (segments contain hyphens); remains literal nested structure.

Path expansion conflict (strict mode, default):
```toon
a.b: 1
a: 2
```

> Error in strict mode: Conflict between `a.b` (suggests `a` is an object) and `a` (a primitive). With `expandPaths: true, strict: false`, last-write-wins: `{a: 2}`.

## §14 Strict Mode Errors (Authoritative Checklist)

**What it defends.** The authoritative list of strict-mode rejections, grouped:
§14.1 array count/width mismatches (inline count ≠ `N`, list items ≠ `N`, rows ≠
`N`, row width ≠ field count — count checks apply only when an explicit `[N]` is
declared, so `key: []` is N/A); §14.2 syntax/structural errors (missing colon,
invalid escape / unterminated string, header delimiter mismatch, malformed bracket
lengths, content between bracket and colon, indentation/blank-line invariants,
two-plus bare depth-0 lines); §14.3 path-expansion conflicts; §14.4 duplicate
object keys (strict → error, non-strict → LWW).

**Why it matters — truncation detection.** These width/count checks are exactly
what make TOON *self-checking*: a truncated or injected row is a length/width
mismatch, not silently short data (§15). Error type/code/message are
implementation-defined.

**Our implementation & engineering win — structured completeness reports.** Both
runtimes and `tq` expose these mismatches as a **structured report** — `tq check`,
Rust `detect_truncation_with_options` / `detect_toonl_truncation`, JS
`detectTruncation` — with stable fields `complete`, `kind`, `line`, `declared`,
`actual`, `message`. That turns §14.1's "MUST error" into a machine-readable
diagnosis (declared-vs-actual with a line number) callers can act on. The API and
its rationale are documented in
[`toon-spec-reddb-flavored.md`](toon-spec-reddb-flavored.md#detecttruncation--structured-completeness-reports).

**Examples:**

Valid: count and width correct (passes strict):
```toon
people[2]{name,age}:
Alice,30
Bob,25
```

```json
{"people": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}
```

Invalid: count mismatch (strict mode error):
```toon
people[3]{name,age}:
Alice,30
Bob,25
```

> Error (structured report): `kind: "array-count-mismatch"`, `declared: 3`, `actual: 2`, `line: 1`

Invalid: width mismatch (strict mode error):
```toon
people[2]{name,age}:
Alice,30
Bob
```

> Error (structured report): `kind: "array-width-mismatch"`, `declared: 2`, `actual: 1`, `line: 3`

Invalid: duplicate key (strict mode error):
```toon
name: Alice
name: Bob
```

> Error in strict mode: Duplicate key `name` at same level; last-write-wins in non-strict mode.

Invalid: malformed bracket length:
```toon
items[abc]: value
```

> Error: Bracket contains non-numeric `abc`; array length must be a non-negative integer.

## §15 Security Considerations

**What it defends.** Quoting (§7.2) mitigates injection/ambiguity; strict checks
(§14) detect truncation and injected rows via length/width mismatches. Encoders
SHOULD avoid excessive memory on large inputs (stream tabular rows where
feasible). Control characters in quoted strings are preserved as data — encoders
MUST NOT strip them — and downstream consumers rendering into terminals/logs/markup
are advised to sanitize at that boundary.

**Our implementation & engineering win — the depth guard.** The official §15 does
not bound nesting depth; a pathologically deep document can exhaust a recursive
decoder's stack. Our implementations add a **depth guard** (`max_depth`, default
1000 in both `ParseOptions` and `EncodeOptions`) that rejects over-deep documents
with a structured error instead of crashing, configurable to `0` for trusted
input, with checked encode entry points for untrusted values. It changes no
decoded value — a within-limit document decodes identically. See the flavored
spec's [Depth guard](toon-spec-reddb-flavored.md#depth-guard).

**Examples:**

Valid injection defense via quoting:
```toon
code: "alert(\"injected\")"
command: "rm -rf /"
```

```json
{"code": "alert(\"injected\")", "command": "rm -rf /"}
```

> The `"` characters inside quoted strings are escaped and do not break out of the string context.

Self-checking truncation detection:
```toon
data[10]{id,value}:
1,100
2,200
```

> Error in strict mode: Declared `10` rows but found only `2`; truncation is detected and reported with line/count mismatch.

Depth guard (over-deep document rejected with default `max_depth: 1000`):
```toon
a:
  b:
    c:
      ...
      (1000+ levels)
```

> Error: Maximum nesting depth (1000) exceeded; use `max_depth: 0` to disable for trusted input.

## §16 Internationalization

Full Unicode in keys and values (subject to quoting/escaping); no locale-dependent
number/boolean formatting (no thousands separators). Both runtimes emit
locale-independent canonical numbers (§2) and pass the Unicode/emoji examples from
Appendix A.

**Examples:**

Valid Unicode and emoji in unquoted context:
```toon
emoji: 😀🎉
greeting: Привет мир
```

```json
{"emoji": "😀🎉", "greeting": "Привет мир"}
```

Valid Unicode keys:
```toon
"日本語": こんにちは
"Ελληνικά": Γεια σας
```

```json
{"日本語": "こんにちは", "Ελληνικά": "Γεια σας"}
```

Canonical number formatting (no locale-dependent separators):
```toon
price_usd: 1000.50
quantity: 1000000
```

```json
{"price_usd": 1000.50, "quantity": 1000000}
```

> Numbers are always rendered in C locale (`.` for decimal separator, no thousands separators), regardless of system locale.

## §17 IANA Considerations

Provisional media type `text/toon`, extension `.toon`, always UTF-8; no
registration requested yet. (Our streaming layer uses the parallel provisional
`application/toonl` / `.toonl`, defined in [`toonl.md`](toonl.md), not by this
spec.)

## §18 Versioning and Extensibility

**What it defends.** Backward-compatible evolutions preserve headers, quoting, and
indentation semantics; reserved structural characters (colon, brackets, braces,
hyphen) keep their meaning across versions; the path separator is fixed to `.`.

**Our implementation.** Our reddb-io extensions honor this extensibility contract —
they add no new sigil family, reuse the recursive-brace header grammar, and
fail-closed against strict v3.3 — so they are backward-compatible evolutions
rather than a fork. Details in
[`toon-spec-reddb-flavored.md`](toon-spec-reddb-flavored.md).

**Examples:**

Valid v3.3 (unchanged by future extensions):
```toon
items[2]{name,value}:
apple,1
banana,2
```

```json
{"items": [{"name": "apple", "value": 1}, {"name": "banana", "value": 2}]}
```

> Reserved characters (`:`, `[`, `]`, `{`, `}`, `-`) retain their meaning; path separator `.` is fixed for backwards compatibility.

## §19 Intellectual Property Considerations

The official spec is MIT-licensed with no known patent disclosures, and is a
community specification (not a formal standards-track document). This companion
respects that license: it attributes the source and the exact submodule pin
(`f55b93ac489f297ff597d95e4c19ae84675eaeb7`) and derives only with attribution.
Our implementations and this repository are likewise MIT-licensed.

## Appendices A–F (Informative)

- **Appendix A — Examples.** Objects, nested objects, primitive/array-of-array/
  tabular/mixed arrays, objects-as-list-items, nested tabular inside a list item,
  delimiter variations (tab and pipe), quoted-colon disambiguation, error cases,
  edge cases (empty string, empty array, numeric-like strings, deep nesting,
  Unicode/emoji, big numbers), quoted keys with arrays, and key-folding/expansion
  round-trips. We treat these as executable expectations wherever the shared corpus
  covers them.
- **Appendix B — Parsing Helpers.** The informative decode overview, header
  parsing (B.2), `parseDelimitedValues` (B.3, quote-aware split on the active
  delimiter only), primitive token parsing (B.4, the leading-zero/`true`/`false`/
  `null` ladder), and object/list-item parsing. Our decoders follow these sketches
  in spirit; normative behavior is §§1–16.
- **Appendix C — Test Suite and Compliance.** Points at the upstream fixtures. We
  consume them live from the submodule (see below).
- **Appendix D — Changelog** and **Appendix E — Acknowledgments and License** (MIT,
  © Johann Schopplich). We reproduce attribution here per the acknowledgment
  section.
- **Appendix F — Host Type Normalization Examples.** Language-specific (Go, JS,
  Python, Rust, Java) normalization sketches informing our §3 host-type mapping for
  the Rust and JS surfaces.

## Implementation guarantees

These are the reddb-io engineering wins that back the "100% conformance" claim, by
official section:

- **Dual-runner corpora (§§1–16, Appendix C).** The conformance suite reads
  fixtures **live from the `toon-format/spec` submodule** — **389 cases (236
  decode, 153 encode) across 22 fixture files** — and the Rust crate and
  `@reddb-io/toon` run the *same* fixtures. The two implementations cannot disagree
  about the format, and the corpus tracks upstream instead of drifting from a
  vendored copy.
- **A ratchet, not a wishlist.** `tests/toon/expected-failures.txt` lists fixtures
  the crate does not yet satisfy; entries may only ever be *removed* — and it is
  currently **empty**.
- **Decode correctness, not just non-crash (§4).** A decode case passes only when
  it parses, the decoded value equals the fixture's expected JSON, **and** our own
  canonical output decodes back to that same value. "It returned `Ok`" is not a
  pass.
- **The json-limits corpus (§2, §4).** `tests/json-limits/corpus.json`
  (`json-limits-v0.1`) pins number-boundary behavior identically across the JS and
  Rust runtimes.
- **The depth guard (§15).** `max_depth` default 1000 on parse and checked encode,
  a robustness default that changes no decoded value.
- **~98% line coverage, gated at 95%.** CI fails under 95%
  (`cargo llvm-cov --workspace --fail-under-lines 95`) alongside `cargo fmt
  --check`, `cargo clippy -D warnings`, and the full suite.
- **Registry-verified releases (§17/§19 adjacent).** Every binary ships in a
  `SHA256SUMS` manifest with a GitHub-signed build-provenance attestation, and the
  crates/package publish in lockstep from each `v*.*.*` tag — so a consumer can
  verify exactly what they install.

For the reddb-io *extensions* over this baseline, see
[`toon-spec-reddb-flavored.md`](toon-spec-reddb-flavored.md); for the streaming
layer, [`toonl.md`](toonl.md).
