# screens

This folder contains all React Navigation screens and navigators for Jellify.

**Relevant docs:**
- [React Navigation — Static API](https://reactnavigation.org/docs/static-configuration)
- [React Native Screens](https://github.com/software-mansion/react-native-screens)

---

## Conventions

### Static navigators

All navigators must be defined using the **static API** (`createNativeStackNavigator`, `createBottomTabNavigator`, etc. with a config object passed directly). The root navigator is wrapped with `createStaticNavigation` in `index.tsx` and mounted once at the app root.

```ts
// Good — static config
const MyStack = createNativeStackNavigator({
  screens: { ... },
})

// Bad — dynamic JSX navigator
const MyStack = createNativeStackNavigator()
// <MyStack.Navigator> ... </MyStack.Navigator>  ❌
```

Because static navigators are plain objects with no JSX, files that only define a navigator can use a `.ts` extension. Use `.tsx` only when the file renders JSX (e.g. a bridging wrapper component or a custom header).

### Bridging components

If a screen or navigator requires bridging logic to render correctly (e.g. reading from a store, resolving a theme, or adapting props before passing them to a component), that bridging lives here alongside the screen definition rather than inside the component itself. Components under `src/components/` should remain presentation-focused.

---

## Structure

| Path | Description |
|---|---|
| `index.tsx` | Root `RootStack` navigator; mounts the app via `createStaticNavigation` |
| `navigation.ts` | `navigationRef` — a typed `NavigationContainerRef` for imperative navigation outside React |
| `types.d.ts` | Shared param list types (`RootStackParamList`, `BaseStackParamList`) and screen prop types |
| `Tabs/` | Bottom tab navigator (`HomeTab`, `LibraryTab`, `SearchTab`, `DiscoverTab`, `SettingsTab`) |
| `Home/` | Home tab stack (recents, artists, tracks) |
| `Library/` | Library tab stack; includes `add-playlist` and `delete-playlist` sheet bridges |
| `Discover/` | Discover tab stack (albums, artists, playlists) |
| `Search/` | Search tab stack |
| `Settings/` | Settings tab stack |
| `Player/` | Player sheet (`PlayerRoot`) |
| `Album/` | Album detail screen |
| `Artist/` | Artist detail screen |
| `Playlist/` | Playlist detail screen |
| `Tracks/` | Generic track list screen |
| `Context/` | Context menu sheet |
| `AddToPlaylist/` | Add-to-playlist sheet |
| `Stats/` | Audio specs sheet (`AudioSpecs`) |
| `Filters/` | Filter sheet |
| `SortOptions/` | Sort options sheet |
| `GenreSelection/` | Genre selection screen |
| `YearSelection/` | Year selection screen |
| `MigrateDownloads/` | Downloads migration screen |
| `Storage/` | Storage management screen |
| `Login/` | Login flow stack |
