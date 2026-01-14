import type { PlayerThemeId } from '../../../stores/settings/player-theme'
import type { PlayerThemeComponent, PlayerThemeMetadata } from './types'

type ThemeLoader = () => Promise<{ default: PlayerThemeComponent }>

const themeLoaders: Record<PlayerThemeId, ThemeLoader> = {
	default: () => import('./default'),
	cassette: () => import('./cassette'),
}

/**
 * Theme registry - maintains loaded themes and provides access
 */
class ThemeRegistry {
	private cache: Map<PlayerThemeId, PlayerThemeComponent> = new Map()

	async getTheme(id: PlayerThemeId): Promise<PlayerThemeComponent> {
		const cached = this.cache.get(id)
		if (cached) {
			return cached
		}

		const loader = themeLoaders[id]
		if (!loader) {
			throw new Error(`Unknown theme: ${id}`)
		}

		const module = await loader()
		const theme = module.default
		this.cache.set(id, theme)
		return theme
	}

	/** Get all available theme IDs */
	getAvailableThemes(): PlayerThemeId[] {
		return Object.keys(themeLoaders) as PlayerThemeId[]
	}

	/** Preload a theme (useful for settings preview) */
	preloadTheme(id: PlayerThemeId): void {
		this.getTheme(id).catch(console.error)
	}
}

export const themeRegistry = new ThemeRegistry()

/**
 * Get metadata for all themes (sync, for settings UI)
 * This avoids loading full theme bundles just to show the list
 */
export const THEME_METADATA: Record<PlayerThemeId, PlayerThemeMetadata> = {
	default: {
		id: 'default',
		name: 'Modern',
		description: 'Clean, modern player with album artwork focus',
		icon: 'play-circle-outline',
	},
	cassette: {
		id: 'cassette',
		name: 'Cassette',
		description: 'Retro tape deck with spinning reels',
		icon: 'cassette',
		experimental: true,
	},
}
