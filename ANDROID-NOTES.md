# Android debugging notes

Findings from a debugging session on a Pixel 9 running LineageOS + microG
(2026-08-28). Kept here because these items span the codebase and have no single
code location; site-specific notes live as comments in the relevant files.

## Test release builds, not just debug builds

The most important lesson from that session. Two of the bugs below were **fatal in
release and non-fatal in debug**, because React Native's dev error handling catches a
thrown exception and shows a red box, while an uncaught exception in a release build
kills the process instantly.

A debug build reporting "works fine" tells you very little about release. Verify with:

```sh
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

To read a crash from a release build:

```sh
adb logcat -c
# launch the app, let it crash
adb logcat -b crash -d
```

Note that `src/utils/console-override.ts` no-ops `console.error` in release, so a JS
error produces no output at all. Comment out its initializer when chasing a
release-only bug. Note also that class names in a release stack trace are obfuscated
by R8 into forms like `R2.a`; error *messages* come through intact.

## Fixed in this session

**`Invalid font weight value: 32` — crash on launch, release only.** Tamagui weight
tokens (`'$6'`, `'$8'`) do not resolve against the font's weight scale when a style
flows through the Reanimated animation driver — they resolve against the *space* scale,
where `$6` is 32 and `$4` is 18. Reanimated's `processFontWeight` accepts only real CSS
weights and throws on anything else. Fix was to use literal weight strings everywhere.
See the extended comment in `src/components/Global/helpers/text.tsx`.

Filling out the weight scale in `src/configs/styling/fonts.ts` does **not** make tokens
safe; the token never reaches that scale on animated components.

**`Cannot have more than one child view...` — crash on every track change.** RNGH 3.x
asserts a `GestureDetector` owns exactly one child, but Reanimated's exiting layout
animations keep the outgoing view mounted while adding the incoming one. Fix was a
stable non-collapsible wrapper `View`. See `src/components/Player/components/header.tsx`.

## Already optimised — do not redo this analysis

A dependency audit suggested a list of optimisations that turned out to be already
implemented. For the record:

| Suggestion | Actual state |
| --- | --- |
| Use `@legendapp/list` | Already the list library throughout |
| Tree-shake vector icons | Already using the scoped per-family package, not the monolith |
| Enable Hermes bytecode cache | Hermes is on; release builds already ship precompiled bytecode. Nothing to enable |
| Lazy-load heavy scenes | `lazy: true` already set on bottom tabs and library top tabs |
| `unmountOnBlur` on tabs | Removed in React Navigation 7 (this app's version). `enableFreeze(true)` in `index.js` already covers it, and preserves state |
| `React.memo` expensive components | `babel-plugin-react-compiler` is enabled and auto-memoises. Manual memo is redundant; CONTRIBUTING.md forbids `useMemo`/`useCallback` for the same reason |
| `lodash-es` for tree-shaking | Metro does not tree-shake by default; `lodash-es` yields nothing here and often breaks RN builds. Per-method imports or removal is the real option |
| Swap Tamagui for styled-components | Tamagui compiles styles at build time via `@tamagui/babel-plugin`. styled-components is runtime CSS-in-JS — this would be *slower*, across 110+ files |

APK size is dominated by native `.so` payloads (Reanimated, quick-crypto, nitro-player,
gesture-handler), not JavaScript. Per-ABI splits and ProGuard are already enabled.

## Open items

**RNGH 2 API used on RNGH 3.** `Gesture.Pan`, `Gesture.Tap`, `Gesture.Race`,
`Gesture.LongPress`, `GestureObjects` and `triggerHaptic` are all deprecated in
react-native-gesture-handler 3.x, and 4 files still use them. Migrating removes a class
of version-mismatch bugs like the one fixed above.

**`react-native-drax@1.1.0` declares no RNGH 3 support** (peer range `>=2.0.0`). It
powers drag-to-reorder in Queue and Playlist. See the note in
`src/components/Queue/index.tsx`.

**`openai` is in `dependencies` but only used by `scripts/generate-release-notes.js`.**
It never reaches the app bundle, so this is a classification issue rather than a size
problem — it belongs in `devDependencies`.

**`lodash` is imported in 47 files**, overwhelmingly for `isUndefined`, which is just
`x === undefined`. Removing the dependency is mechanical and low-risk.

**`react-native-uuid` could be dropped** once `globals.js` stops clobbering the `crypto`
global — see the comment there. `react-native-quick-crypto` already provides
`randomUUID`.

**`react-native-linear-gradient` has exactly one consumer.** `react-native-svg` is
already a dependency and can replace it. See
`src/components/Player/components/blurred-background.tsx`.

**ProGuard keep rules are thin** and R8 is already breaking one reflective call
(non-fatal). See `android/app/proguard-rules.pro`.

**The media service outlives a UI crash**, leaving a zombie process that must be
force-stopped. See `index.js`.

**Performance monitoring is itself a performance problem** in list items. See
`src/hooks/use-performance-monitor.ts` and the `TODO` in
`src/components/Global/components/item-card.tsx`.
