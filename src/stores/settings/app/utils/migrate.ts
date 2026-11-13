import AppSettingsStore from '../types'
import type { ColorPreset } from '../../../../types/theme'

export const migrate = (persistedState: unknown, version: number): AppSettingsStore => {
	const state = persistedState as Omit<AppSettingsStore, 'colorPreset'> & {
		colorPreset?: ColorPreset | 'purple'
	}

	// v1: the 'purple' color preset was renamed to 'haze'
	if (version < 1 && state.colorPreset === 'purple') state.colorPreset = 'haze'

	return state as AppSettingsStore
}
