# Official TOON Spec Fixtures

Source repository: https://github.com/toon-format/spec
Vendored revision: f55b93ac489f297ff597d95e4c19ae84675eaeb7
Vendored path: tests/fixtures

The integration test in `tests/spec_conformance.rs` consumes every vendored
fixture. Deferred cases must be listed in `expected-failures.txt`; if a listed
fixture starts passing, the test fails until the ledger entry is removed.

Current ledger state: 211 passing fixtures, 178 deferred fixtures.
