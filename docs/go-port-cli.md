# Study-Quiz Go CLI

Build and run the native CLI with Go 1.24 or later. Pass a JSON file path, or pass `-` to read standard input.

```sh
go build -o studyquiz ./cmd/studyquiz
./studyquiz verification/gameplay/speed.json
```

On Windows, build to `studyquiz.exe` and run `.\studyquiz.exe verification/gameplay/speed.json`.

The CLI writes one JSON response. A successful request has `ok: true` and a `result` field. A validation error has `ok: false` and an `error` field. The WebAssembly version uses the same JSON interface.

## Quiz operations

| Operation | Input | Result |
| --- | --- | --- |
| `quiz` | Pool settings, `language`, `actions` | Shuffled pool and session snapshots |
| `pool` | Pool settings | Shuffled questions and option order |
| `start` | Pool settings | Initial session state, or `null` for an empty pool |
| `step` | `state`, `mode`, `now`, `action`, optional `index` | Updated `state` and a `changed` flag |
| `localize` | `question` from the pool, `language` | Question in the selected language, with the original option order preserved |

Pool settings include `mode` (`all`, `category`, `speed`, `daily`, or `review`), `category`, `difficulty`, and `length` (zero for all available questions). Supply `missedIds` for review or `ids` for an explicit question set. An empty `ids` array selects an empty pool. Daily mode selects ten questions using the supplied local calendar `date` in YYYY-MM-DD format. Supply `random` as an array of numbers in [0, 1) to cycle through a repeatable random sequence.

Set `now` to the starting time in Unix milliseconds. In `quiz`, an action can set the clock to `at` or add `after` milliseconds. Available actions are `hint`, `answer`, `correct`, `wrong`, `next`, and `tick`. An `answer` uses a zero-based option `index`. Use `tick` to check for a speed-mode timeout after moving the clock.

## Saved records and teacher reports

| Operation | Input | Result |
| --- | --- | --- |
| `records-valid` | `record` | Record validity |
| `records-normalize` | `records` | Cleaned records with duplicates removed |
| `records-summary` | `records` in chronological order | Attempt count, best score, weighted accuracy, and missed question IDs |
| `report-grades` | `rows` with accuracy values | Rows with relative grades |
| `report-aggregate` | `files` with `name` and backup `data` | Teacher report data |
| `report-csv` | The same `files` or an aggregate `data` object, plus `lang` | CSV text with localized headers |

The gameplay inputs in [verification/gameplay](../verification/gameplay) also run against the JavaScript reference adapter. The adapter uses the browser’s original quiz functions with a controlled clock, random sequence, and local storage.

## RECHECK comparison

Run the verifier from a full clone of Study Quiz Go. The verifier extracts the original JavaScript from [Study-Quiz commit `ce88328`](https://github.com/leekmny/Study-Quiz/commit/ce88328beff36b2a5f3273051397a22029aa8995), which is in this repository's history, and stages it separately from the Go executable. Prepare a Linux amd64 RECHECK Docker image using the instructions in the [RECHECK repository](https://github.com/leekmny/Recheck).

```sh
mkdir -p test-results
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -o test-results/studyquiz-linux ./cmd/studyquiz
python verification/run-recheck.py --recheck ../Recheck --image recheck-porting:linux-x64 \
  --candidate test-results/studyquiz-linux --output test-results/recheck-parity
```

The output directory contains the manifest and its exact inputs, the RECHECK JSON and HTML reports, and the scenario summary. Choose a new directory for each run. On Windows, set the three Go build environment variables in PowerShell or build the executable in a Linux amd64 Go container.

The [original port's recorded run](../verification/recheck-summary.json) matched **18/18** scenarios
using exact semantic JSON on a Linux x64 Docker worker. It covered eight gameplay,
four saved-record and six teacher-report scenarios. The Go browser build uses
WebAssembly for the same domain operations. The browser manages storage, and the
downloaded self-contained teacher HTML uses the existing JavaScript renderer.
