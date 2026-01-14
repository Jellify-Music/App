/**
 * Theme Customization Schema System
 *
 * Each theme can define a JSON schema that describes its customizable properties.
 * The settings UI is auto-generated from this schema, and user preferences are
 * stored and applied at runtime.
 *
 * Enthusiasts can also edit the JSON directly for fine-grained control.
 */

// ============================================================================
// Schema Definition Types
// ============================================================================

export interface ColorSetting {
	type: 'color'
	label: string
	description?: string
	default: string
}

export interface ToggleSetting {
	type: 'toggle'
	label: string
	description?: string
	default: boolean
}

export interface SliderSetting {
	type: 'slider'
	label: string
	description?: string
	default: number
	min: number
	max: number
	step: number
	unit?: string
}

export interface ChoiceSetting {
	type: 'choice'
	label: string
	description?: string
	default: string
	options: Array<{
		value: string
		label: string
		description?: string
	}>
}

export interface GroupSetting {
	type: 'group'
	label: string
	description?: string
	collapsed?: boolean
	settings: Record<string, SettingDefinition>
}

export type SettingDefinition =
	| ColorSetting
	| ToggleSetting
	| SliderSetting
	| ChoiceSetting
	| GroupSetting

// ============================================================================
// Theme Configuration Schema
// ============================================================================

export interface ThemeConfigSchema {
	/** Schema version for future compatibility */
	$schema?: string
	version: number

	/** Theme metadata */
	meta: {
		id: string
		name: string
		description: string
		author?: string
		icon: string
		experimental?: boolean
	}

	/** Customizable settings organized by category */
	settings: Record<string, SettingDefinition>

	/** Preset configurations users can quickly apply */
	presets?: Array<{
		id: string
		name: string
		description?: string
		values: Record<string, unknown>
	}>
}

// ============================================================================
// User Customization Storage Types
// ============================================================================

export interface ThemeCustomization {
	/** Theme ID this customization applies to */
	themeId: string
	/** Timestamp of last modification */
	updatedAt: number
	/** User's custom values (keys match schema paths) */
	values: Record<string, unknown>
	/** Currently applied preset ID, if any */
	activePreset?: string
}

// ============================================================================
// Runtime Resolved Values
// ============================================================================

export type ResolvedSettings = Record<string, unknown>

/**
 * Resolves the final settings by merging:
 * 1. Schema defaults
 * 2. Preset values (if active)
 * 3. User customizations
 */
export function resolveSettings(
	schema: ThemeConfigSchema,
	customization?: ThemeCustomization,
): ResolvedSettings {
	const resolved: ResolvedSettings = {}

	// Extract defaults from schema
	function extractDefaults(settings: Record<string, SettingDefinition>, prefix = ''): void {
		for (const [key, setting] of Object.entries(settings)) {
			const fullKey = prefix ? `${prefix}.${key}` : key

			if (setting.type === 'group') {
				extractDefaults(setting.settings, fullKey)
			} else {
				resolved[fullKey] = setting.default
			}
		}
	}

	extractDefaults(schema.settings)

	// Apply preset if active
	if (customization?.activePreset && schema.presets) {
		const preset = schema.presets.find((p) => p.id === customization.activePreset)
		if (preset) {
			Object.assign(resolved, preset.values)
		}
	}

	// Apply user customizations (highest priority)
	if (customization?.values) {
		Object.assign(resolved, customization.values)
	}

	return resolved
}

/**
 * Get a specific setting value with type safety
 */
export function getSetting<T>(settings: ResolvedSettings, key: string, fallback: T): T {
	const value = settings[key]
	return value !== undefined ? (value as T) : fallback
}

// ============================================================================
// Schema Validation
// ============================================================================

export function validateCustomization(
	schema: ThemeConfigSchema,
	values: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
	const errors: string[] = []

	function validateSetting(key: string, value: unknown, definition: SettingDefinition): void {
		switch (definition.type) {
			case 'color':
				if (typeof value !== 'string' || !/^#[0-9A-Fa-f]{6,8}$/.test(value)) {
					errors.push(`${key}: Invalid color format (expected #RRGGBB or #RRGGBBAA)`)
				}
				break

			case 'toggle':
				if (typeof value !== 'boolean') {
					errors.push(`${key}: Expected boolean`)
				}
				break

			case 'slider':
				if (typeof value !== 'number') {
					errors.push(`${key}: Expected number`)
				} else if (value < definition.min || value > definition.max) {
					errors.push(`${key}: Value out of range (${definition.min}-${definition.max})`)
				}
				break

			case 'choice':
				if (!definition.options.some((opt) => opt.value === value)) {
					errors.push(`${key}: Invalid choice`)
				}
				break

			case 'group':
				// Groups don't have direct values
				break
		}
	}

	function findDefinition(path: string): SettingDefinition | undefined {
		const parts = path.split('.')
		let current: Record<string, SettingDefinition> = schema.settings

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i]
			const setting = current[part]

			if (!setting) return undefined

			if (i === parts.length - 1) {
				return setting
			}

			if (setting.type === 'group') {
				current = setting.settings
			} else {
				return undefined
			}
		}

		return undefined
	}

	for (const [key, value] of Object.entries(values)) {
		const definition = findDefinition(key)
		if (!definition) {
			errors.push(`${key}: Unknown setting`)
		} else {
			validateSetting(key, value, definition)
		}
	}

	return { valid: errors.length === 0, errors }
}

// ============================================================================
// Schema Export/Import
// ============================================================================

export interface ExportedThemeCustomization {
	$type: 'jellify-theme-customization'
	$version: 1
	themeId: string
	themeName: string
	exportedAt: string
	values: Record<string, unknown>
}

export function exportCustomization(
	schema: ThemeConfigSchema,
	customization: ThemeCustomization,
): ExportedThemeCustomization {
	return {
		$type: 'jellify-theme-customization',
		$version: 1,
		themeId: customization.themeId,
		themeName: schema.meta.name,
		exportedAt: new Date().toISOString(),
		values: customization.values,
	}
}

export function importCustomization(
	data: unknown,
):
	| { success: true; customization: Partial<ThemeCustomization> }
	| { success: false; error: string } {
	if (!data || typeof data !== 'object') {
		return { success: false, error: 'Invalid data format' }
	}

	const obj = data as Record<string, unknown>

	if (obj.$type !== 'jellify-theme-customization') {
		return { success: false, error: 'Not a valid theme customization file' }
	}

	if (obj.$version !== 1) {
		return { success: false, error: `Unsupported version: ${obj.$version}` }
	}

	if (typeof obj.themeId !== 'string' || typeof obj.values !== 'object') {
		return { success: false, error: 'Missing required fields' }
	}

	return {
		success: true,
		customization: {
			themeId: obj.themeId,
			values: obj.values as Record<string, unknown>,
			updatedAt: Date.now(),
		},
	}
}
