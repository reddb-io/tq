#!/usr/bin/env bash
# Shared by check-versions.sh and sync-version.sh: print the crate name of every
# [workspace] member, one per line, so both scripts cover a newly added crate
# without anyone remembering to list it twice.
#
# Read with awk rather than a TOML parser because these scripts run on release
# runners that have bash and nothing else guaranteed — no cargo, no python.

# Prints the raw member paths from the root Cargo.toml `members = [...]` array,
# whether it is written on one line or spread across several.
workspace_member_paths() {
  awk '
    !capturing && /^members[[:space:]]*=[[:space:]]*\[/ {
      capturing = 1
      # Everything after the opening bracket; a single-line array also closes here.
      rest = substr($0, index($0, "[") + 1)
      if (index(rest, "]") > 0) {
        print substr(rest, 1, index(rest, "]") - 1)
        exit
      }
      print rest
      next
    }
    capturing {
      if (index($0, "]") > 0) {
        print substr($0, 1, index($0, "]") - 1)
        exit
      }
      print
    }
  ' Cargo.toml | grep -o '"[^"]*"' | tr -d '"'
}

# Prints the [package] name declared by each member manifest.
workspace_member_crate_names() {
  local member
  while read -r member; do
    [[ -n "$member" ]] || continue
    awk -F'"' '/^name = /{print $2; exit}' "${member}/Cargo.toml"
  done < <(workspace_member_paths)
}
