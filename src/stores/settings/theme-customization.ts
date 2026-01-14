import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStateStorage } from '../../constants/storage'
import type {
	ThemeCustomization,
	ResolvedSettings,
	ThemeConfigSchema,
} from '../../components/Player/themes/schema'
import { resolveSettings } from '../../components/Player/themes/schema'
import type { PlayerThemeId } from './player-theme'

// ============================================================================
// Store Types
// ============================================================================

interface ThemeCustomizationState {
	/** Customizations per theme, keyed by theme ID */
	customizations: Record<string, ThemeCustomization>

	/** Get customization for a specific theme */
	getCustomization: (themeId: PlayerThemeId) => ThemeCustomization | undefined

	/** Set a single setting value */
	setSetting: (themeId: PlayerThemeId, key: string, value: unknown) => void

	/** Set multiple settings at once */
	setSettings: (themeId: PlayerThemeId, values: Record<string, unknown>) => void

	/** Apply a preset by ID */
	applyPreset: (themeId: PlayerThemeId, presetId: string) => void

	/** Clear preset (keeps custom values) */
	clearPreset: (themeId: PlayerThemeId) => void

	/** Reset all customizations for a theme */
	resetTheme: (themeId: PlayerThemeId) => void

	/** Reset all customizations for all themes */
	resetAll: () => void

	/** Import customization from JSON */
	importCustomization: (themeId: PlayerThemeId, values: Record<string, unknown>) => void

	/** Export customization as plain object */
	exportCustomization: (themeId: PlayerThemeId) => Record<string, unknown> | undefined
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useThemeCustomizationStore = create<ThemeCustomizationState>()(
	devtools(
		persist(
			(set, get) => ({
				customizations: {},

				getCustomization: (themeId) => {
					return get().customizations[themeId]
				},

				setSetting: (themeId, key, value) => {
					set((state) => {
						const existing = state.customizations[themeId] || {
							themeId,
							values: {},
							updatedAt: Date.now(),
						}

						return {
							customizations: {
								...state.customizations,
								[themeId]: {
									...existing,
									values: {
										...existing.values,
										[key]: value,
									},
									updatedAt: Date.now(),
								},
							},
						}
					})
				},

				setSettings: (themeId, values) => {
					set((state) => {
						const existing = state.customizations[themeId] || {
							themeId,
							values: {},
							updatedAt: Date.now(),
						}

						return {
							customizations: {
								...state.customizations,
								[themeId]: {
									...existing,
									values: {
										...existing.values,
										...values,
									},
									updatedAt: Date.now(),
								},
							},
						}
					})
				},

				applyPreset: (themeId, presetId) => {
					set((state) => {
						const existing = state.customizations[themeId] || {
							themeId,
							values: {},
							updatedAt: Date.now(),
						}

						return {
							customizations: {
								...state.customizations,
								[themeId]: {
									...existing,
									activePreset: presetId,
									updatedAt: Date.now(),
								},
							},
						}
					})
				},

				clearPreset: (themeId) => {
					set((state) => {
						const existing = state.customizations[themeId]
						if (!existing) return state

						const { activePreset, ...rest } = existing
						return {
							customizations: {
								...state.customizations,
								[themeId]: {
									...rest,
									updatedAt: Date.now(),
								},
							},
						}
					})
				},

				resetTheme: (themeId) => {
					set((state) => {
						const { [themeId]: removed, ...rest } = state.customizations
						return { customizations: rest }
					})
				},

				resetAll: () => {
					set({ customizations: {} })
				},

				importCustomization: (themeId, values) => {
					set((state) => ({
						customizations: {
							...state.customizations,
							[themeId]: {
								themeId,
								values,
								updatedAt: Date.now(),
							},
						},
					}))
				},

				exportCustomization: (themeId) => {
					const customization = get().customizations[themeId]
					return customization?.values
				},
			}),
			{
				name: 'theme-customization-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
		{ name: 'theme-customization' },
	),
)

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to get resolved settings for a theme, merging defaults + preset + customizations
 */
export function useResolvedThemeSettings(
	themeId: PlayerThemeId,
	schema: ThemeConfigSchema,
): ResolvedSettings {
	const customization = useThemeCustomizationStore((state) => state.customizations[themeId])
	return resolveSettings(schema, customization)
}

/**
 * Hook to get a specific setting value with type safety
 */
export function useThemeSetting<T>(
	themeId: PlayerThemeId,
	schema: ThemeConfigSchema,
	key: string,
	fallback: T,
): T {
	const settings = useResolvedThemeSettings(themeId, schema)
	const value = settings[key]
	return value !== undefined ? (value as T) : fallback
}

/**
 * Hook to get setters for theme customization
 */
export function useThemeCustomizationActions() {
	return useThemeCustomizationStore((state) => ({
		setSetting: state.setSetting,
		setSettings: state.setSettings,
		applyPreset: state.applyPreset,
		clearPreset: state.clearPreset,
		resetTheme: state.resetTheme,
		importCustomization: state.importCustomization,
		exportCustomization: state.exportCustomization,
	}))
}

/**
 * Hook to get the active preset for a theme
 */
export function useActivePreset(themeId: PlayerThemeId): string | undefined {
	return useThemeCustomizationStore((state) => state.customizations[themeId]?.activePreset)
}
