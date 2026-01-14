import { useMemo } from 'react'
import { useResolvedThemeSettings } from '../../../../../stores/settings/theme-customization'
import cassetteConfig from '../theme.config'
import type { ResolvedSettings } from '../../schema'

/**
 * Cassette theme settings interface with strong typing
 */
export interface CassetteSettings {
	// Cassette body
	cassette: {
		bodyColor: string
		bodyStyle: 'classic' | 'clear' | 'black' | 'white'
		showScrews: boolean
		shadowIntensity: number
	}

	// Tape reels
	reels: {
		tapeColor: string
		animate: boolean
		speed: number
		showTapeProgress: boolean
	}

	// Label area
	label: {
		style: 'album-art' | 'vintage' | 'typed' | 'minimal'
		vintageOverlay: boolean
		labelColor: string
	}

	// Counter display
	counter: {
		style: 'mechanical' | 'digital' | 'led' | 'hidden'
		digitColor: string
		showDuration: boolean
	}

	// Controls
	controls: {
		style: 'raised' | 'flat' | 'chrome'
		buttonColor: string
		haptics: boolean
	}

	// Background
	background: {
		style: 'gradient' | 'solid' | 'wood' | 'album-blur'
		color: string
		opacity: number
	}
}

/**
 * Parse flat resolved settings into nested CassetteSettings structure
 */
function parseSettings(resolved: ResolvedSettings): CassetteSettings {
	return {
		cassette: {
			bodyColor: (resolved['cassette.bodyColor'] as string) ?? '#D4C4B5',
			bodyStyle:
				(resolved['cassette.bodyStyle'] as CassetteSettings['cassette']['bodyStyle']) ??
				'classic',
			showScrews: (resolved['cassette.showScrews'] as boolean) ?? true,
			shadowIntensity: (resolved['cassette.shadowIntensity'] as number) ?? 0.4,
		},
		reels: {
			tapeColor: (resolved['reels.tapeColor'] as string) ?? '#3D2A1F',
			animate: (resolved['reels.animate'] as boolean) ?? true,
			speed: (resolved['reels.speed'] as number) ?? 1.0,
			showTapeProgress: (resolved['reels.showTapeProgress'] as boolean) ?? true,
		},
		label: {
			style: (resolved['label.style'] as CassetteSettings['label']['style']) ?? 'album-art',
			vintageOverlay: (resolved['label.vintageOverlay'] as boolean) ?? true,
			labelColor: (resolved['label.labelColor'] as string) ?? '#F5E6D3',
		},
		counter: {
			style:
				(resolved['counter.style'] as CassetteSettings['counter']['style']) ?? 'mechanical',
			digitColor: (resolved['counter.digitColor'] as string) ?? '#E8B87D',
			showDuration: (resolved['counter.showDuration'] as boolean) ?? true,
		},
		controls: {
			style:
				(resolved['controls.style'] as CassetteSettings['controls']['style']) ?? 'raised',
			buttonColor: (resolved['controls.buttonColor'] as string) ?? '#5A3A2A',
			haptics: (resolved['controls.haptics'] as boolean) ?? true,
		},
		background: {
			style:
				(resolved['background.style'] as CassetteSettings['background']['style']) ??
				'gradient',
			color: (resolved['background.color'] as string) ?? '#2C1810',
			opacity: (resolved['background.opacity'] as number) ?? 0.85,
		},
	}
}

/**
 * Hook to get strongly-typed cassette theme settings
 *
 * Usage:
 * ```tsx
 * const settings = useCassetteSettings()
 * // Access with full type safety:
 * settings.cassette.bodyColor
 * settings.reels.animate
 * settings.counter.style
 * ```
 */
export function useCassetteSettings(): CassetteSettings {
	const resolved = useResolvedThemeSettings('cassette', cassetteConfig)

	return useMemo(() => parseSettings(resolved), [resolved])
}

/**
 * Get default cassette settings (for use outside React)
 */
export function getDefaultCassetteSettings(): CassetteSettings {
	const resolved = {} as ResolvedSettings

	// Extract defaults from schema
	function extractDefaults(settings: Record<string, unknown>, prefix = ''): void {
		for (const [key, setting] of Object.entries(settings)) {
			const s = setting as {
				type: string
				default?: unknown
				settings?: Record<string, unknown>
			}
			const fullKey = prefix ? `${prefix}.${key}` : key

			if (s.type === 'group' && s.settings) {
				extractDefaults(s.settings, fullKey)
			} else if ('default' in s) {
				resolved[fullKey] = s.default
			}
		}
	}

	extractDefaults(cassetteConfig.settings)
	return parseSettings(resolved)
}

export default useCassetteSettings
