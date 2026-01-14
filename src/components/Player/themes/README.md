# Player Themes System

## Overview

Jellify supports customizable player themes, allowing users to choose different visual designs for the full-screen music player. The theming system is designed for:

- **Performance**: Themes are lazy-loaded to minimize bundle size impact
- **Extensibility**: New themes can be added with minimal boilerplate
- **Consistency**: All themes share common playback hooks and utilities

## User Guide

### Selecting a Theme

1. Open **Settings**
2. Navigate to **Appearance** (or directly to **Player Theme**)
3. Browse available themes with live previews
4. Tap a theme to select it
5. Changes apply immediately

### Available Themes

| Theme | Description | Status |
|-------|-------------|--------|
| **Modern** (Default) | Clean, minimal design with large album artwork focus | Stable |
| **Cassette** | Retro tape deck with spinning reels and vintage aesthetics | Experimental |

## Architecture

```
src/components/Player/
├── index.tsx                    # Theme-aware router
├── themes/
│   ├── index.ts                 # Theme registry + lazy loading
│   ├── types.ts                 # TypeScript interfaces
│   ├── README.md                # This file
│   ├── default/
│   │   ├── index.tsx            # Modern theme entry
│   │   └── components/          # Theme-specific components
│   └── cassette/
│       ├── index.tsx            # Cassette theme entry
│       └── components/          # Tape deck, controls, etc.
├── shared/
│   └── hooks/
│       └── use-player-gestures.ts  # Shared gesture handling
└── ...
```

## Developer Guide: Creating a New Theme

### Step 1: Create Theme Directory

```bash
mkdir -p src/components/Player/themes/your-theme/components
```

### Step 2: Add Theme ID

Edit `src/stores/settings/player-theme.ts`:

```typescript
export type PlayerThemeId = 'default' | 'cassette' | 'your-theme'
```

### Step 3: Implement Theme Component

Create `src/components/Player/themes/your-theme/index.tsx`:

```typescript
import React from 'react'
import type { PlayerThemeComponent, PlayerThemeProps } from '../types'

function YourThemePlayer({
  nowPlaying,
  swipeX,
  dimensions,
  insets
}: PlayerThemeProps): React.JSX.Element {
  // Your player UI here
  // Use shared hooks for playback control:
  // - useProgress() for playback position
  // - usePlaybackState() for play/pause state
  // - useSkip(), usePrevious() for track navigation
  // - useSeekTo() for scrubbing

  return (
    // Your JSX
  )
}

function YourThemePreview({ width, height }: { width: number; height: number }): React.JSX.Element {
  // Static preview for settings screen (no playback logic)
  return (
    // Preview JSX
  )
}

const YourTheme: PlayerThemeComponent = {
  Player: YourThemePlayer,
  Preview: YourThemePreview,
  metadata: {
    id: 'your-theme',
    name: 'Your Theme',
    description: 'A brief description',
    icon: 'material-design-icon-name',
    experimental: true, // Set to false when stable
  },
}

export default YourTheme
```

### Step 4: Register Theme

Edit `src/components/Player/themes/index.ts`:

```typescript
const themeLoaders: Record<PlayerThemeId, ThemeLoader> = {
  default: () => import('./default'),
  cassette: () => import('./cassette'),
  'your-theme': () => import('./your-theme'), // Add this
}

export const THEME_METADATA: Record<PlayerThemeId, PlayerThemeMetadata> = {
  // ... existing themes
  'your-theme': {
    id: 'your-theme',
    name: 'Your Theme',
    description: 'A brief description',
    icon: 'material-design-icon-name',
    experimental: true,
  },
}
```

### Step 5: Implement Swipe Gestures (Recommended)

Use the shared gesture hook for consistent skip/previous behavior:

```typescript
import { usePlayerGestures } from '../../shared/hooks/use-player-gestures'

function YourThemePlayer({ swipeX, ... }: PlayerThemeProps) {
  const skip = useSkip()
  const previous = usePrevious()
  const trigger = useHapticFeedback()

  const gesture = usePlayerGestures({
    swipeX,
    onSkipNext: () => skip(undefined),
    onSkipPrevious: previous,
    onHapticFeedback: (type) => trigger(type),
  })

  return (
    <GestureDetector gesture={gesture}>
      {/* Your swipeable area */}
    </GestureDetector>
  )
}
```

## Theme Props Reference

```typescript
interface PlayerThemeProps {
  /** Current track data */
  nowPlaying: JellifyTrack

  /** Shared animated value for horizontal swipe gestures */
  swipeX: SharedValue<number>

  /** Screen dimensions from useWindowDimensions */
  dimensions: { width: number; height: number }

  /** Safe area insets for proper spacing */
  insets: { top: number; bottom: number; left: number; right: number }
}
```

## Useful Hooks

| Hook | Purpose |
|------|---------|
| `useProgress(interval)` | Get current position/duration |
| `usePlaybackState()` | Get play/pause/buffering state |
| `useCurrentTrack()` | Get current track from queue |
| `useSkip()` | Skip to next track |
| `usePrevious()` | Go to previous track |
| `useSeekTo()` | Seek to specific position |
| `useTogglePlayback()` | Toggle play/pause |
| `useToggleShuffle()` | Toggle shuffle mode |
| `useToggleRepeatMode()` | Cycle repeat modes |

## Best Practices

1. **Keep previews lightweight**: Don't include playback logic in Preview components
2. **Use relative imports**: Avoid `@/` aliases for better portability
3. **Handle safe areas**: Use the `insets` prop for proper spacing
4. **Support both platforms**: Test on iOS and Android
5. **Respect theme colors**: Use Tamagui theme tokens where appropriate
6. **Add loading states**: Handle buffering/loading gracefully

---

## Theme Customization System

Themes can expose customizable settings via a JSON schema. The settings UI is auto-generated, and users can also export/import their customizations as JSON files.

### Creating a Theme Config

Create `theme.config.ts` in your theme directory:

```typescript
import type { ThemeConfigSchema } from '../schema'

const myThemeConfig: ThemeConfigSchema = {
  version: 1,
  meta: {
    id: 'my-theme',
    name: 'My Theme',
    description: 'A customizable theme',
    icon: 'palette',
  },
  settings: {
    // Group related settings
    colors: {
      type: 'group',
      label: 'Colors',
      settings: {
        primary: {
          type: 'color',
          label: 'Primary Color',
          default: '#FF6B6B',
        },
        background: {
          type: 'color',
          label: 'Background',
          default: '#1A1A1A',
        },
      },
    },

    // Toggle settings
    animations: {
      type: 'toggle',
      label: 'Enable Animations',
      description: 'Animate UI elements',
      default: true,
    },

    // Slider settings
    artworkSize: {
      type: 'slider',
      label: 'Artwork Size',
      min: 200,
      max: 400,
      step: 10,
      default: 300,
      unit: 'px',
    },

    // Choice settings
    style: {
      type: 'choice',
      label: 'Visual Style',
      default: 'modern',
      options: [
        { value: 'modern', label: 'Modern' },
        { value: 'classic', label: 'Classic' },
        { value: 'minimal', label: 'Minimal' },
      ],
    },
  },

  // Optional presets
  presets: [
    {
      id: 'dark-mode',
      name: 'Dark Mode',
      values: {
        'colors.primary': '#BB86FC',
        'colors.background': '#121212',
      },
    },
  ],
}

export default myThemeConfig
```

### Using Settings in Components

```typescript
import { useResolvedThemeSettings } from '../../../stores/settings/theme-customization'
import myThemeConfig from './theme.config'

function MyThemePlayer() {
  // Get all resolved settings (defaults + user customizations)
  const settings = useResolvedThemeSettings('my-theme', myThemeConfig)

  // Access settings with dot notation
  const primaryColor = settings['colors.primary'] as string
  const showAnimations = settings['animations'] as boolean

  return (
    <View style={{ backgroundColor: settings['colors.background'] }}>
      {/* ... */}
    </View>
  )
}
```

### Strongly-Typed Settings Hook

For better DX, create a custom hook with full typing:

```typescript
// hooks/use-my-theme-settings.ts
import { useMemo } from 'react'
import { useResolvedThemeSettings } from '../../../stores/settings/theme-customization'
import myThemeConfig from '../theme.config'

interface MyThemeSettings {
  colors: { primary: string; background: string }
  animations: boolean
  artworkSize: number
  style: 'modern' | 'classic' | 'minimal'
}

export function useMyThemeSettings(): MyThemeSettings {
  const resolved = useResolvedThemeSettings('my-theme', myThemeConfig)

  return useMemo(() => ({
    colors: {
      primary: resolved['colors.primary'] as string,
      background: resolved['colors.background'] as string,
    },
    animations: resolved['animations'] as boolean,
    artworkSize: resolved['artworkSize'] as number,
    style: resolved['style'] as MyThemeSettings['style'],
  }), [resolved])
}
```

### Setting Types Reference

| Type | Description | Properties |
|------|-------------|------------|
| `color` | Color picker | `default: string` (hex) |
| `toggle` | Boolean switch | `default: boolean` |
| `slider` | Numeric slider | `default, min, max, step, unit?` |
| `choice` | Radio/dropdown | `default, options: [{value, label}]` |
| `group` | Nested settings | `settings: Record<string, Setting>` |

### Export/Import Format

Users can export their customizations as `.jellify-theme` JSON files:

```json
{
  "$type": "jellify-theme-customization",
  "$version": 1,
  "themeId": "cassette",
  "themeName": "Cassette",
  "exportedAt": "2024-01-15T10:30:00Z",
  "values": {
    "cassette.bodyColor": "#1A1A1A",
    "reels.animate": true,
    "counter.style": "led"
  }
}
```

This allows enthusiasts to share their configurations with the community.
