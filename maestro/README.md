# Maestro Tests

Jellify uses [Maestro](https://maestro.mobile.dev) for end-to-end UI testing on both iOS and Android.

## Structure

```
maestro/
├── flow-full.yaml       # Full test suite (all flows in order)
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
    ├── playlist/        # Playlist detail screen
    └── platform/        # Cross-platform back, sheet, player and keyboard helpers
```

## How it works

`flow-full.yaml` is the entry point, on both iOS and Android. It calls `runFlow` on each `flows/*/flow.yaml` in order. Each `flow.yaml` is responsible for a logical area of the app (setup, home, library, etc.) and in turn calls out to the individual test files within its directory to keep logical groups small and focused.

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

### Cross-platform steps

The same flows run on iOS and Android, so never use a platform-specific command
directly. Use the helpers in `subflows/platform/` instead:

| Instead of | Use | iOS does |
|---|---|---|
| `pressKey: back` on a stack screen | `subflows/platform/back.yaml` | Edge-swipe back gesture |
| `pressKey: back` on a sheet (e.g. the queue) | `subflows/platform/dismiss-sheet.yaml` | Drags the sheet down |
| `pressKey: back` on the full-screen player | `subflows/platform/close-player.yaml` | Taps `player-close-button` |
| `hideKeyboard` | `subflows/platform/hide-keyboard.yaml` | Presses Return |
| `hideKeyboard` + tapping a submit button | `subflows/platform/submit-input.yaml` with `button_id` | Presses Return |

Maestro has no back key on iOS, and `pressKey: back` there **silently does
nothing** rather than failing, so a stray one shows up as a confusing failure
several steps later. `hideKeyboard` can't dismiss React Native's keyboard on
iOS, so Return is pressed instead: only use the helpers on inputs where
submitting is harmless (or, for `submit-input.yaml`, does the same as the button).

### Flow hygiene

Because tabs in Jellify keep their own navigation stacks, a flow that pushes a
detail screen inside a tab **must pop back to that tab's root before moving
on** — otherwise the next flow that selects the tab lands on the leftover
detail screen instead of the tab root, and selectors like `search-input`
simply do not exist in the hierarchy. Flows that enter the Search tab should
also start with the defensive reset used in `flows/search/gd-search.yaml`
(scroll up, then bounded back-presses re-selecting the tab between presses).

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
maestro test maestro/flow-full.yaml --env server_address=https://jellyfin.jellify.app --env username=jerry

# A single flow file
maestro test maestro/flows/library/library-tabs.yaml
```

In CI, the [Test / Maestro](../.github/workflows/test-maestro.yml) workflow runs the full flow on both platforms:

- `scripts/run-maestro-android-ci.sh <apk>` installs the APK on the emulator, captures logcat, and runs the flow.
- `scripts/run-maestro-ios-ci.sh <app>` creates a throwaway simulator on the newest installed iOS runtime, installs the `.app`, captures the simulator log and crash reports, and runs the flow.

Both source `scripts/maestro-ci-common.sh`, which checks the demo server is up first and classifies each run as `passed`, `infra`, `crash` or `assertion` in the job summary.

## Further reading

- [Maestro documentation](https://maestro.mobile.dev)
- [Installing Maestro](https://maestro.mobile.dev/getting-started/installing-maestro)
- [Maestro Studio](https://maestro.mobile.dev/getting-started/maestro-studio)
- [Maestro `runFlow` command](https://maestro.mobile.dev/api-reference/commands/runflow)
- [Maestro selectors & assertions](https://maestro.mobile.dev/api-reference/selectors)
