#!/usr/bin/env bash
# Runs syntax checks and every regression suite, 3 at a time (running all at once can exceed the suites' 5 s page-load timeout).
# Needs: node, python3, `pip install playwright`, `playwright install chromium`. Run from msafiri-prototype/.
set -u
cd "$(dirname "$0")"
fail=0
for f in js/*.js js/pages/*.js; do node --check "$f" || { echo "SYNTAX FAIL $f"; fail=1; }; done
echo "node --check done"
mkdir -p /tmp/msafiri-test-logs
ls tests/*.py | xargs -P 3 -I{} sh -c 'n=$(basename {} .py); PYTHONDONTWRITEBYTECODE=1 python3 {} > /tmp/msafiri-test-logs/$n.log 2>&1; echo "$n exit=$? : $(tail -n 1 /tmp/msafiri-test-logs/$n.log)"'
echo "Logs: /tmp/msafiri-test-logs"
