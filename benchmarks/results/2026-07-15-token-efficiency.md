# Token Efficiency Benchmark

Command: `pnpm benchmark:tokens`

Tokenizer: `o200k_base` via `gpt-tokenizer`.

Representative datasets are vendored under `benchmarks/datasets/` and are read offline. Wire fixtures are retained as an extension-eligibility showcase, not as representative payload evidence.

## Representative Corpus by Shape

| Shape | Datasets | Best TOON-family median vs JSON | Best non-TOON median vs JSON |
| --- | ---: | ---: | ---: |
| deep-tree | 1 | toon-ext-all (-22.7%) | yaml (35.6%) |
| flat-tabular | 1 | toonl (-43.6%) | csv (-44.8%) |
| nested-heterogeneous | 1 | toon-ext-all (13.9%) | yaml (47.9%) |
| nested-uniform | 1 | toon-ext-all (-25.7%) | yaml (39.9%) |
| streaming-append | 1 | toonl (-29.7%) | csv (-31.8%) |
| tagged-records | 1 | toon-ext-all (19.4%) | yaml (38.0%) |
| wide-sparse | 1 | toonl (-8.4%) | csv (-14.0%) |

## Explicit TOON/TOONL Losses

| Shape | Dataset | Format | Tokens vs minified JSON |
| --- | --- | --- | ---: |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-v3.3-canonical | 12.3% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-ext-primitive-array-columns | 12.3% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-ext-child-tables | 12.3% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-ext-delimiter-pipe | 15.3% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-ext-keyed-map-collapse | 12.3% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-v3.3-canonical | 13.9% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-primitive-array-columns | 13.9% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-child-tables | 13.9% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-delimiter-pipe | 16.8% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-keyed-map-collapse | 13.9% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-all | 13.9% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-v3.3-canonical | 10.1% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-ext-primitive-array-columns | 10.1% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-ext-delimiter-pipe | 12.7% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-ext-keyed-map-collapse | 10.1% |
| tagged-records | tagged-records/activity-events | toon-v3.3-canonical | 19.4% |
| tagged-records | tagged-records/activity-events | toon-ext-primitive-array-columns | 19.4% |
| tagged-records | tagged-records/activity-events | toon-ext-child-tables | 19.4% |
| tagged-records | tagged-records/activity-events | toon-ext-delimiter-pipe | 21.3% |
| tagged-records | tagged-records/activity-events | toon-ext-keyed-map-collapse | 19.4% |
| tagged-records | tagged-records/activity-events | toon-ext-all | 19.4% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-v3.3-canonical | 19.2% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-primitive-array-columns | 19.2% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-child-tables | 19.2% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-delimiter-pipe | 19.6% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-keyed-map-collapse | 19.2% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-all | 19.2% |

## Representative Dataset Measurements

| Shape | Dataset | Format | Bytes | Tokens | Tokens vs minified JSON |
| --- | --- | --- | ---: | ---: | ---: |
| deep-tree | deep-tree/wikidata-knowledge-tree | json-minified | 557 | 163 | 0.0% |
| deep-tree | deep-tree/wikidata-knowledge-tree | json-pretty | 1460 | 297 | 82.2% |
| deep-tree | deep-tree/wikidata-knowledge-tree | yaml | 1008 | 221 | 35.6% |
| deep-tree | deep-tree/wikidata-knowledge-tree | xml | 816 | 249 | 52.8% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-v3.3-canonical | 893 | 183 | 12.3% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-ext-primitive-array-columns | 893 | 183 | 12.3% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-ext-child-tables | 893 | 183 | 12.3% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-ext-delimiter-pipe | 898 | 188 | 15.3% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-ext-keyed-map-collapse | 893 | 183 | 12.3% |
| deep-tree | deep-tree/wikidata-knowledge-tree | toon-ext-all | 409 | 126 | -22.7% |
| flat-tabular | flat-tabular/public-repositories | json-minified | 1009 | 250 | 0.0% |
| flat-tabular | flat-tabular/public-repositories | json-pretty | 1461 | 410 | 64.0% |
| flat-tabular | flat-tabular/public-repositories | yaml | 1168 | 344 | 37.6% |
| flat-tabular | flat-tabular/public-repositories | xml | 1489 | 379 | 51.6% |
| flat-tabular | flat-tabular/public-repositories | toon-v3.3-canonical | 456 | 146 | -41.6% |
| flat-tabular | flat-tabular/public-repositories | toon-ext-primitive-array-columns | 456 | 146 | -41.6% |
| flat-tabular | flat-tabular/public-repositories | toon-ext-child-tables | 456 | 146 | -41.6% |
| flat-tabular | flat-tabular/public-repositories | toon-ext-delimiter-pipe | 457 | 162 | -35.2% |
| flat-tabular | flat-tabular/public-repositories | toon-ext-keyed-map-collapse | 456 | 146 | -41.6% |
| flat-tabular | flat-tabular/public-repositories | toon-ext-all | 456 | 146 | -41.6% |
| flat-tabular | flat-tabular/public-repositories | jsonl | 991 | 251 | 0.4% |
| flat-tabular | flat-tabular/public-repositories | csv | 426 | 138 | -44.8% |
| flat-tabular | flat-tabular/public-repositories | toonl | 436 | 141 | -43.6% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | json-minified | 1621 | 447 | 0.0% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | json-pretty | 3404 | 827 | 85.0% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | yaml | 2417 | 661 | 47.9% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | xml | 2374 | 711 | 59.1% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-v3.3-canonical | 1966 | 509 | 13.9% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-primitive-array-columns | 1966 | 509 | 13.9% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-child-tables | 1966 | 509 | 13.9% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-delimiter-pipe | 1975 | 522 | 16.8% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-keyed-map-collapse | 1966 | 509 | 13.9% |
| nested-heterogeneous | nested-heterogeneous/json-schema-event | toon-ext-all | 1966 | 509 | 13.9% |
| nested-uniform | nested-uniform/openapi-petstore-paths | json-minified | 1185 | 268 | 0.0% |
| nested-uniform | nested-uniform/openapi-petstore-paths | json-pretty | 1871 | 450 | 67.9% |
| nested-uniform | nested-uniform/openapi-petstore-paths | yaml | 1473 | 375 | 39.9% |
| nested-uniform | nested-uniform/openapi-petstore-paths | xml | 1679 | 408 | 52.2% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-v3.3-canonical | 1118 | 295 | 10.1% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-ext-primitive-array-columns | 1118 | 295 | 10.1% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-ext-child-tables | 728 | 199 | -25.7% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-ext-delimiter-pipe | 1125 | 302 | 12.7% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-ext-keyed-map-collapse | 1118 | 295 | 10.1% |
| nested-uniform | nested-uniform/openapi-petstore-paths | toon-ext-all | 728 | 199 | -25.7% |
| streaming-append | streaming-append/append-only-logs | json-minified | 852 | 286 | 0.0% |
| streaming-append | streaming-append/append-only-logs | json-pretty | 1256 | 440 | 53.8% |
| streaming-append | streaming-append/append-only-logs | yaml | 993 | 380 | 32.9% |
| streaming-append | streaming-append/append-only-logs | xml | 1183 | 416 | 45.5% |
| streaming-append | streaming-append/append-only-logs | toon-v3.3-canonical | 465 | 212 | -25.9% |
| streaming-append | streaming-append/append-only-logs | toon-ext-primitive-array-columns | 465 | 212 | -25.9% |
| streaming-append | streaming-append/append-only-logs | toon-ext-child-tables | 465 | 212 | -25.9% |
| streaming-append | streaming-append/append-only-logs | toon-ext-delimiter-pipe | 466 | 214 | -25.2% |
| streaming-append | streaming-append/append-only-logs | toon-ext-keyed-map-collapse | 465 | 212 | -25.9% |
| streaming-append | streaming-append/append-only-logs | toon-ext-all | 465 | 212 | -25.9% |
| streaming-append | streaming-append/append-only-logs | jsonl | 839 | 287 | 0.3% |
| streaming-append | streaming-append/append-only-logs | csv | 428 | 195 | -31.8% |
| streaming-append | streaming-append/append-only-logs | toonl | 450 | 201 | -29.7% |
| tagged-records | tagged-records/activity-events | json-minified | 697 | 216 | 0.0% |
| tagged-records | tagged-records/activity-events | json-pretty | 1135 | 350 | 62.0% |
| tagged-records | tagged-records/activity-events | yaml | 869 | 298 | 38.0% |
| tagged-records | tagged-records/activity-events | xml | 990 | 321 | 48.6% |
| tagged-records | tagged-records/activity-events | toon-v3.3-canonical | 759 | 258 | 19.4% |
| tagged-records | tagged-records/activity-events | toon-ext-primitive-array-columns | 759 | 258 | 19.4% |
| tagged-records | tagged-records/activity-events | toon-ext-child-tables | 759 | 258 | 19.4% |
| tagged-records | tagged-records/activity-events | toon-ext-delimiter-pipe | 763 | 262 | 21.3% |
| tagged-records | tagged-records/activity-events | toon-ext-keyed-map-collapse | 759 | 258 | 19.4% |
| tagged-records | tagged-records/activity-events | toon-ext-all | 759 | 258 | 19.4% |
| wide-sparse | wide-sparse/sparse-feature-vectors | json-minified | 877 | 286 | 0.0% |
| wide-sparse | wide-sparse/sparse-feature-vectors | json-pretty | 1255 | 423 | 47.9% |
| wide-sparse | wide-sparse/sparse-feature-vectors | yaml | 1009 | 372 | 30.1% |
| wide-sparse | wide-sparse/sparse-feature-vectors | xml | 1436 | 476 | 66.4% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-v3.3-canonical | 942 | 341 | 19.2% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-primitive-array-columns | 942 | 341 | 19.2% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-child-tables | 942 | 341 | 19.2% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-delimiter-pipe | 943 | 342 | 19.6% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-keyed-map-collapse | 942 | 341 | 19.2% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toon-ext-all | 942 | 341 | 19.2% |
| wide-sparse | wide-sparse/sparse-feature-vectors | jsonl | 863 | 286 | 0.0% |
| wide-sparse | wide-sparse/sparse-feature-vectors | csv | 803 | 246 | -14.0% |
| wide-sparse | wide-sparse/sparse-feature-vectors | toonl | 779 | 262 | -8.4% |

## Wire Extension-Eligibility Showcase

These `wire-*` fixtures exercise opt-in extension behavior and edge cases. They are not representative corpus evidence.

| Dataset | Format | Bytes | Tokens | Tokens vs minified JSON |
| --- | --- | ---: | ---: | ---: |
| wire-shipments-500 | json-minified | 54164 | 16412 | 0.0% |
| wire-shipments-500 | json-pretty | 83172 | 26916 | 64.0% |
| wire-shipments-500 | yaml | 64661 | 23410 | 42.6% |
| wire-shipments-500 | xml | 79685 | 23995 | 46.2% |
| wire-shipments-500 | toon-v3.3-canonical | 20214 | 8758 | -46.6% |
| wire-shipments-500 | toon-ext-primitive-array-columns | 20214 | 8758 | -46.6% |
| wire-shipments-500 | toon-ext-child-tables | 20214 | 8758 | -46.6% |
| wire-shipments-500 | toon-ext-delimiter-pipe | 20215 | 9926 | -39.5% |
| wire-shipments-500 | toon-ext-keyed-map-collapse | 20214 | 8758 | -46.6% |
| wire-shipments-500 | toon-ext-all | 20214 | 8758 | -46.6% |
| wire-shipments-500 | jsonl | 54149 | 16906 | 3.0% |
| wire-shipments-500 | csv | 19197 | 9004 | -45.1% |
| wire-shipments-500 | toonl | 19209 | 8758 | -46.6% |
| wire-accounts-300 | json-minified | 33841 | 10651 | 0.0% |
| wire-accounts-300 | json-pretty | 62649 | 19655 | 84.5% |
| wire-accounts-300 | yaml | 43738 | 15449 | 45.0% |
| wire-accounts-300 | xml | 47361 | 16355 | 53.6% |
| wire-accounts-300 | toon-v3.3-canonical | 39242 | 13050 | 22.5% |
| wire-accounts-300 | toon-ext-primitive-array-columns | 39242 | 13050 | 22.5% |
| wire-accounts-300 | toon-ext-child-tables | 12289 | 5266 | -50.6% |
| wire-accounts-300 | toon-ext-delimiter-pipe | 39243 | 13051 | 22.5% |
| wire-accounts-300 | toon-ext-keyed-map-collapse | 12289 | 5266 | -50.6% |
| wire-accounts-300 | toon-ext-all | 12289 | 5266 | -50.6% |
| wire-registry-200 | json-minified | 18775 | 6004 | 0.0% |
| wire-registry-200 | json-pretty | 27383 | 9209 | 53.4% |
| wire-registry-200 | yaml | 21172 | 7603 | 26.6% |
| wire-registry-200 | xml | 25795 | 8609 | 43.4% |
| wire-registry-200 | toon-v3.3-canonical | 20571 | 7402 | 23.3% |
| wire-registry-200 | toon-ext-primitive-array-columns | 20571 | 7402 | 23.3% |
| wire-registry-200 | toon-ext-child-tables | 20571 | 7402 | 23.3% |
| wire-registry-200 | toon-ext-delimiter-pipe | 20571 | 7402 | 23.3% |
| wire-registry-200 | toon-ext-keyed-map-collapse | 10403 | 4412 | -26.5% |
| wire-registry-200 | toon-ext-all | 10403 | 4412 | -26.5% |
| wire-services-250 | json-minified | 33542 | 9619 | 0.0% |
| wire-services-250 | json-pretty | 57550 | 17373 | 80.6% |
| wire-services-250 | yaml | 41789 | 14117 | 46.8% |
| wire-services-250 | xml | 48062 | 14873 | 54.6% |
| wire-services-250 | toon-v3.3-canonical | 39043 | 12618 | 31.2% |
| wire-services-250 | toon-ext-primitive-array-columns | 39043 | 12618 | 31.2% |
| wire-services-250 | toon-ext-child-tables | 14349 | 5137 | -46.6% |
| wire-services-250 | toon-ext-delimiter-pipe | 39044 | 12619 | 31.2% |
| wire-services-250 | toon-ext-keyed-map-collapse | 14349 | 5137 | -46.6% |
| wire-services-250 | toon-ext-all | 14349 | 5137 | -46.6% |
| wire-tagged-300 | json-minified | 24794 | 8113 | 0.0% |
| wire-tagged-300 | json-pretty | 46414 | 14753 | 81.8% |
| wire-tagged-300 | yaml | 35135 | 13415 | 65.4% |
| wire-tagged-300 | xml | 40591 | 14489 | 78.6% |
| wire-tagged-300 | toon-v3.3-canonical | 25359 | 10181 | 25.5% |
| wire-tagged-300 | toon-ext-primitive-array-columns | 12784 | 5723 | -29.5% |
| wire-tagged-300 | toon-ext-child-tables | 25359 | 10181 | 25.5% |
| wire-tagged-300 | toon-ext-delimiter-pipe | 25660 | 10482 | 29.2% |
| wire-tagged-300 | toon-ext-keyed-map-collapse | 25359 | 10181 | 25.5% |
| wire-tagged-300 | toon-ext-all | 12784 | 5723 | -29.5% |
| wire-matrix-150x8 | json-minified | 7616 | 4803 | 0.0% |
| wire-matrix-150x8 | json-pretty | 17524 | 7807 | 62.5% |
| wire-matrix-150x8 | yaml | 15263 | 8851 | 84.3% |
| wire-matrix-150x8 | xml | 23684 | 10207 | 112.5% |
| wire-matrix-150x8 | toon-v3.3-canonical | 8667 | 5702 | 18.7% |
| wire-matrix-150x8 | toon-ext-primitive-array-columns | 8667 | 5702 | 18.7% |
| wire-matrix-150x8 | toon-ext-child-tables | 7628 | 5107 | 6.3% |
| wire-matrix-150x8 | toon-ext-delimiter-pipe | 8818 | 5853 | 21.9% |
| wire-matrix-150x8 | toon-ext-keyed-map-collapse | 8667 | 5702 | 18.7% |
| wire-matrix-150x8 | toon-ext-all | 7628 | 5107 | 6.3% |
| wire-tree3-100 | json-minified | 37076 | 13370 | 0.0% |
| wire-tree3-100 | json-pretty | 90728 | 23165 | 73.3% |
| wire-tree3-100 | yaml | 64999 | 19319 | 44.5% |
| wire-tree3-100 | xml | 55675 | 20122 | 50.5% |
| wire-tree3-100 | toon-v3.3-canonical | 37889 | 13556 | 1.4% |
| wire-tree3-100 | toon-ext-primitive-array-columns | 37889 | 13556 | 1.4% |
| wire-tree3-100 | toon-ext-child-tables | 19076 | 8834 | -33.9% |
| wire-tree3-100 | toon-ext-delimiter-pipe | 38216 | 14354 | 7.4% |
| wire-tree3-100 | toon-ext-keyed-map-collapse | 37889 | 13556 | 1.4% |
| wire-tree3-100 | toon-ext-all | 19076 | 8834 | -33.9% |
| wire-honesty-non-uniform-rows | json-minified | 72 | 34 | 0.0% |
| wire-honesty-non-uniform-rows | json-pretty | 186 | 73 | 114.7% |
| wire-honesty-non-uniform-rows | yaml | 105 | 53 | 55.9% |
| wire-honesty-non-uniform-rows | xml | 134 | 61 | 79.4% |
| wire-honesty-non-uniform-rows | toon-v3.3-canonical | 95 | 48 | 41.2% |
| wire-honesty-non-uniform-rows | toon-ext-primitive-array-columns | 95 | 48 | 41.2% |
| wire-honesty-non-uniform-rows | toon-ext-child-tables | 95 | 48 | 41.2% |
| wire-honesty-non-uniform-rows | toon-ext-delimiter-pipe | 96 | 49 | 44.1% |
| wire-honesty-non-uniform-rows | toon-ext-keyed-map-collapse | 95 | 48 | 41.2% |
| wire-honesty-non-uniform-rows | toon-ext-all | 95 | 48 | 41.2% |
| wire-honesty-non-uniform-map | json-minified | 92 | 28 | 0.0% |
| wire-honesty-non-uniform-map | json-pretty | 154 | 53 | 89.3% |
| wire-honesty-non-uniform-map | yaml | 101 | 36 | 28.6% |
| wire-honesty-non-uniform-map | xml | 136 | 43 | 53.6% |
| wire-honesty-non-uniform-map | toon-v3.3-canonical | 92 | 30 | 7.1% |
| wire-honesty-non-uniform-map | toon-ext-primitive-array-columns | 92 | 30 | 7.1% |
| wire-honesty-non-uniform-map | toon-ext-child-tables | 92 | 30 | 7.1% |
| wire-honesty-non-uniform-map | toon-ext-delimiter-pipe | 92 | 30 | 7.1% |
| wire-honesty-non-uniform-map | toon-ext-keyed-map-collapse | 92 | 30 | 7.1% |
| wire-honesty-non-uniform-map | toon-ext-all | 92 | 30 | 7.1% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | json-minified | 174 | 56 | 0.0% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | json-pretty | 343 | 110 | 96.4% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | yaml | 244 | 93 | 66.1% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | xml | 319 | 107 | 91.1% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | toon-v3.3-canonical | 184 | 72 | 28.6% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | toon-ext-primitive-array-columns | 109 | 48 | -14.3% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | toon-ext-child-tables | 184 | 72 | 28.6% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | toon-ext-delimiter-pipe | 187 | 76 | 35.7% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | toon-ext-keyed-map-collapse | 184 | 72 | 28.6% |
| wire-extension-primitive-list-columns-decode-empty-lists-and-quoted-sub-delimiters | toon-ext-all | 109 | 48 | -14.3% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | json-minified | 322 | 108 | 0.0% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | json-pretty | 757 | 198 | 83.3% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | yaml | 525 | 157 | 45.4% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | xml | 508 | 171 | 58.3% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | toon-v3.3-canonical | 348 | 120 | 11.1% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | toon-ext-primitive-array-columns | 348 | 120 | 11.1% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | toon-ext-child-tables | 207 | 89 | -17.6% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | toon-ext-delimiter-pipe | 352 | 127 | 17.6% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | toon-ext-keyed-map-collapse | 348 | 120 | 11.1% |
| wire-extension-recursive-child-tables-decode-per-row-child-counts | toon-ext-all | 207 | 89 | -17.6% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | json-minified | 54 | 24 | 0.0% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | json-pretty | 151 | 54 | 125.0% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | yaml | 79 | 37 | 54.2% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | xml | 117 | 47 | 95.8% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | toon-v3.3-canonical | 65 | 34 | 41.7% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | toon-ext-primitive-array-columns | 65 | 34 | 41.7% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | toon-ext-child-tables | 39 | 26 | 8.3% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | toon-ext-delimiter-pipe | 67 | 36 | 50.0% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | toon-ext-keyed-map-collapse | 65 | 34 | 41.7% |
| wire-extension-mixed-empty-child-arrays-decode-zero-as-child-count | toon-ext-all | 39 | 26 | 8.3% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | json-minified | 28 | 17 | 0.0% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | json-pretty | 98 | 41 | 141.2% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | yaml | 67 | 39 | 129.4% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | xml | 140 | 53 | 211.8% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | toon-v3.3-canonical | 41 | 28 | 64.7% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | toon-ext-primitive-array-columns | 41 | 28 | 64.7% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | toon-ext-child-tables | 38 | 25 | 47.1% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | toon-ext-delimiter-pipe | 44 | 31 | 82.4% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | toon-ext-keyed-map-collapse | 41 | 28 | 64.7% |
| wire-extension-matrix-rows-decode-as-uniform-fixed-width-lists | toon-ext-all | 38 | 25 | 47.1% |

