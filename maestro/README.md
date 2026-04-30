# Maestro Tests

Jellify uses [Maestro](https://maestro.mobile.dev) for end-to-end UI testing on both iOS and Android.

## Structure

```
maestro/
├── flow-full.yaml       # Full test suite (all tests in order)
├── flow-smoke.yaml      # Fast CI smoke test
├── flows/               # Parent flows - for each of the top level screens
├── subflows/            # Shared subflows - for each of the lower level screens in the navigation stacks
└── tests/               # Test implementations
    ├── setup/           # App launch, login, server & library selection
    ├── home/            # Home screen tests
    └── library/         # Library screen tests
```

## How it works

The top-level flow files (`flow-full.yaml`, `flow-smoke.yaml`) are the entry points. They call `runFlow` on each `tests/*/flow.yaml` in order. Each `flow.yaml` is responsible for a logical area of the app (setup, home, library, etc.) and in turn calls out to the individual test files within its directory to keep logical groups small and focused.

For example, `tests/home/flow.yaml` navigates to the home screen and then branches to `recently-played.yaml` and any other home-specific tests. This keeps individual test files small while the `flow.yaml` files act as coordinators for their feature area.

### `flow-full.yaml`

Runs the complete test suite in sequence:

1. **Setup** — clears app state, launches the app, handles permission dialogs, logs in, selects a server and library
2. **Home** — exercises the home screen (recently played, etc.)
3. **Library** — exercises library browsing and tab navigation

...followed by the numbered test files covering search, music player, playlists, favorites, and more.

### `flow-smoke.yaml`

A fast subset intended as a CI gate. Covers login → library browse → album detail → search → settings. Designed to run quickly to catch obvious regressions before a full suite run.

## Running locally

### Installing Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Then add it to your PATH (the installer will print the exact line to add to your shell profile):

```bash
export PATH="$PATH:$HOME/.maestro/bin"
```

Verify the install:

```bash
maestro --version
```

### Maestro Studio

[Maestro Studio](https://maestro.mobile.dev/getting-started/maestro-studio) is a browser-based interactive tool for exploring your app's UI hierarchy, testing selectors, and recording new flows — highly recommended when writing or debugging tests.

Launch it while your simulator/emulator is running:

```bash
maestro studio
```

This opens a browser window at `http://localhost:9999` where you can inspect element IDs, run individual commands, and see the live device view alongside your YAML.

### Running flows

Run a flow from the repo root:

```bash
# Full suite
maestro test maestro/flow-full.yaml

# Smoke test only
maestro test maestro/flow-smoke.yaml

# A single test file
maestro test maestro/tests/library/library-tabs.yaml
```

In CI, the `scripts/run-maestro-ci.sh` script handles APK installation, logcat capture, and Maestro invocation. It takes the runner OS, architecture, emulator architecture, APK path, and flow path as arguments.

## Further reading

- [Maestro documentation](https://maestro.mobile.dev)
- [Installing Maestro](https://maestro.mobile.dev/getting-started/installing-maestro)
- [Maestro Studio](https://maestro.mobile.dev/getting-started/maestro-studio)
- [Maestro `runFlow` command](https://maestro.mobile.dev/api-reference/commands/runflow)
- [Maestro selectors & assertions](https://maestro.mobile.dev/api-reference/selectors)
