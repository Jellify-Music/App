# Flows

Each subdirectory here corresponds to a top-level screen in Jellify's UI — the login/setup flow, the four main tabs (Home, Library, Search, Discover), and the full-screen Player. The `flow-full.yaml` and `flow-smoke.yaml` entry points at the root of `maestro/` call into these in order.

## Structure

```
flows/
├── setup/       # App launch, login, server & library selection
├── home/        # Home tab
├── quick-actions/ # Track row swipe actions & favoriting
├── library/     # Library tab
├── search/      # Search tab
├── discover/    # Discover tab
├── settings/    # Settings tab
├── player/      # Full-screen music player
└── README.md
```

## Convention

Each folder contains a `flow.yaml` that acts as the coordinator for that screen. It handles navigation to the screen (e.g. tapping the tab bar button), takes an initial screenshot, and then delegates to sibling YAML files for individual test scenarios within that screen.

For screens that are reachable from multiple navigation stacks (e.g. an album detail opened from Home *or* Search), the shared interaction logic lives in [`../subflows/`](../subflows/README.md) rather than here.

## Flows

| Flow | Screen | Tab bar ID |
|---|---|---|
| `setup/` | Login, server selection, library selection | — |
| `home/` | Home tab | `home-tab-button` |
| `quick-actions/` | Track row swipe gestures & favoriting | — |
| `library/` | Library tab | `library-tab-button` |
| `search/` | Search tab | `search-tab-button` |
| `discover/` | Discover tab | `discover-tab-button` |
| `settings/` | Settings tab | `settings-tab-button` |
| `player/` | Full-screen player & queue | `miniplayer-test-id` (expand) |
