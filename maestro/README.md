# Maestro Tests

Jellify uses [Maestro](https://maestro.mobile.dev) for end-to-end UI testing on both iOS and Android.

## Structure

```
maestro/
├── flow-full.yaml       # Full test suite (all flows in order)
├── flow-smoke.yaml      # Fast CI smoke test
├── flows/               # One subdirectory per top-level screen / feature area
│   ├── setup/           # App launch, login, server & library selection
│   ├── home/            # Home tab
│   ├── quick-actions/   # Track row swipe actions & favouriting
│   ├── library/         # Library tab
│   ├── search/          # Search tab
│   ├── discover/        # Discover tab
│   ├── settings/        # Settings tab
│   └── player/          # Full-screen player & queue
└── subflows/            # Reusable flows for screens reachable from multiple stacks
    ├── album/           # Album detail screen
    ├── artist/          # Artist detail screen
    └── playlist/        # Playlist detail screen
```

## How it works

The top-level flow files (`flow-full.yaml`, `flow-smoke.yaml`) are the entry points. They call `runFlow` on each `tests/*/flow.yaml` in order. Each `flow.yaml` is responsible for a logical area of the app (setup, home, library, etc.) and in turn calls out to the individual test files within its directory to keep logical groups small and focused.

For example, `flows/home/flow.yaml` navigates to the home screen and then delegates to `recently-played.yaml` and any other home-specific tests. This keeps individual test files small while the `flow.yaml` files act as coordinators for their feature area.

### `flow-full.yaml`

Runs the complete test suite in sequence:

1. **Setup** — clears app state, launches the app, handles permission dialogs, logs in, selects a server and library
2. **Home** — exercises the home screen (recently played, etc.)
3. **Quick Actions** — validates track-row swipe gestures and favouriting via swipe actions
4. **Library** — exercises library browsing and tab navigation
5. **Search** — exercises the search tab
6. **Discover** — exercises the discover tab
7. **Settings** — exercises the settings tab
8. **Player** — expands the full-screen player, toggles playback, and exercises the queue

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

# A single flow file
maestro test maestro/flows/library/library-tabs.yaml
```

In CI, the `scripts/run-maestro-ci.sh` script handles APK installation, logcat capture, and Maestro invocation. It takes the runner OS, architecture, emulator architecture, APK path, and flow path as arguments.

## Further reading

- [Maestro documentation](https://maestro.mobile.dev)
- [Installing Maestro](https://maestro.mobile.dev/getting-started/installing-maestro)
- [Maestro Studio](https://maestro.mobile.dev/getting-started/maestro-studio)
- [Maestro `runFlow` command](https://maestro.mobile.dev/api-reference/commands/runflow)
- [Maestro selectors & assertions](https://maestro.mobile.dev/api-reference/selectors)
