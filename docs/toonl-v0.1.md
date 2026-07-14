# TOONL v0.1

This document defines TOONL v0.1, a line-oriented extension format for appendable streams of flat records that can be closed into TOON v3.3 documents.

The key words MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT, RECOMMENDED, MAY, and OPTIONAL are to be interpreted as described in RFC 2119.

## Identity

TOONL v0.1 files SHOULD use the `.toonl` extension. Tools that need a media hint SHOULD use `application/toonl`.

TOONL is not open-phase TOON v3.3. A TOONL decoder MUST parse TOONL with the grammar in this document, and a TOON decoder is expected to reject TOONL open-phase syntax. Compatibility is provided by the close-transform, not by making every open stream a valid TOON document.

## Data Model

A TOONL stream is a sequence of segments. Each segment has a header, zero or more rows, and an optional trailer.

Each row in a segment represents one object. The segment header defines the object fields. Row cells are positional: cell 1 maps to field 1, cell 2 maps to field 2, and so on. A row MUST contain exactly one cell per field.

Null is explicit. Encoders MUST write `null` for a null field value. Encoders MUST NOT omit a cell to imply null.

Nested values MAY be carried in one cell by encoding that cell as a TOON string containing JSON text. This is an escape hatch for values that are not flat records; it does not change the row arity rule.

## Encoding

TOONL v0.1 streams MUST be UTF-8 text. Encoders MUST emit LF line endings.

Rows are flush-left. Encoders MUST NOT prefix row lines with TOON's two-space tabular indentation while the stream is open.

Blank lines MAY appear between segment constructs. Decoders MUST ignore blank lines. Encoders MUST NOT emit blank lines.

Comments do not exist in TOONL v0.1. A `#` character has no comment meaning and is cell data unless TOON cell quoting gives it another meaning.

Lines beginning with `- ` are reserved for a future nested-frame syntax. A v0.1 decoder MUST reject any non-blank line whose first two bytes are `- `.

## Grammar

The following ABNF is normative except where it delegates cell parsing to TOON v3.3.

```abnf
stream     = *( segment / blank-line )
segment    = header *( row / blank-line ) [ trailer ]
header     = "[" [ delim-sym ] "]" "{" field *( delim field ) "}" ":" LF
row        = cell *( delim cell ) LF
trailer    = "[=" 1*DIGIT "]" LF
blank-line = LF

delim-sym  = "|" / HTAB
delim      = "," / "|" / HTAB
field      = 1*( %x21-7E ) ; interpreted with TOON key quoting rules
cell       = <TOON primitive token using the active delimiter>
```

An absent `delim-sym` selects comma. `|` selects pipe. HTAB selects tab. The active delimiter applies to the field list and every row in the segment.

Field names and cell tokens MUST follow TOON v3.3 key, scalar, and cell quoting rules for the active delimiter. A cell containing the active delimiter MUST be quoted as TOON requires.

## Headers And Rotation

The canonical header form is:

```toonl
[]{field1,field2}:
```

The empty `[]` is intentional. Decoders MUST NOT accept `{field1,field2}:` as a TOONL header because that shape can be silently misparsed by TOON decoders as an ordinary object key.

A new header starts a new segment. If a new header appears while a previous segment is open, the previous segment is closed without trailer verification, and the new header defines the next segment's schema. This is schema rotation.

## Trailers

A trailer has the form:

```toonl
[=N]
```

`N` is the number of rows since the current segment header. If a trailer is present, a decoder MUST verify that `N` equals the segment row count and MUST reject the stream if it does not.

Clean EOF emitters SHOULD write a trailer for the final segment. Interrupted append-only streams MAY end without a final trailer; consumers MUST treat that final segment as unverified.

## Close-Transform

The close-transform maps TOONL segments to TOON v3.3 documents. It is deterministic, order preserving, and requires one pass over the input.

For each segment, the close-transform MUST:

1. Count the segment rows.
2. If a trailer is present, verify its count.
3. Rewrite the TOONL header from `[]...` to a TOON header with the materialized count.
4. Indent every row with two spaces.
5. Discard the trailer.

A single-segment stream closes to exactly one TOON document. A multi-segment stream closes to a sequence of TOON documents, one document per segment, in stream order.

Example:

```toonl
[]{ts,level,msg}:
"2026-07-14T03:00:00Z",info,boot
"2026-07-14T03:00:02Z",error,"disk full"
[=2]
[]{ts,level,msg,request_id}:
"2026-07-14T03:01:00Z",info,retry,null
[=1]
```

closes to the document sequence:

```toon
[2]{ts,level,msg}:
  "2026-07-14T03:00:00Z",info,boot
  "2026-07-14T03:00:02Z",error,"disk full"
```

```toon
[1]{ts,level,msg,request_id}:
  "2026-07-14T03:01:00Z",info,retry,null
```

## Conformance

The conformance fixtures in `tests/toonl/fixtures/` cover decode, encode, close-transform, and required error cases. Implementations SHOULD treat those fixtures as executable examples for TOONL v0.1 behavior.
