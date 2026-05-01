# Subflows

Subflows are reusable Maestro flows for screens that appear in more than one navigation stack. Rather than duplicating the same assertions and interactions in every flow that can reach a given screen, a subflow defines the behaviour once and each calling flow `runFlow`s into it.

## Structure

```
subflows/
├── album/
│   └── flow.yaml    # Album detail screen (track list, playback)
└── artist/
    └── flow.yaml    # Artist detail screen (albums list, view tracks, back)
```

## How it works

A subflow is a normal Maestro YAML file. The caller is responsible for navigating **to** the screen; the subflow takes over from there — asserting the expected UI, performing interactions, and (where appropriate) navigating back so the caller can continue.

For example, the album detail screen is reachable from:
- **Home → Recently Played** (`flows/home/recently-played.yaml`) — tapping an album card navigates into it
- Any other flow that lands on an album screen

Rather than repeating the album assertions in each, they both delegate to `subflows/album/flow.yaml`:

```yaml
- runFlow: ../../subflows/album/flow.yaml
```

Similarly, the artist detail screen is reachable from search results (and potentially other stacks), so it lives in `subflows/artist/flow.yaml`.

## Adding a new subflow

1. Create a directory under `subflows/` named after the screen (e.g. `subflows/playlist/`).
2. Add a `flow.yaml` that starts from the point the caller has already landed on the screen.
3. End the subflow with any necessary back navigation so the caller's flow can continue cleanly.
4. Call it from any flow that reaches that screen:
   ```yaml
   - runFlow: ../../subflows/playlist/flow.yaml
   ```
