import { useAppSettingsStore } from '../../stores/settings/app'
import useIsLightMode from '../../hooks/use-is-light-mode'
import { HOLIDAY_TOKENS, HolidayTokens } from './tokens'

/**
 * Whether the Holidays color scheme is active.
 *
 * Selects a boolean, so consumers only re-render when the scheme is switched to or
 * from Holidays, not on every settings change.
 */
export const useIsHolidays = (): boolean =>
	useAppSettingsStore((state) => state.colorPreset === 'holidays')

/** Holiday decoration colors for the current light / dark mode */
export function useHolidayTokens(): HolidayTokens {
	const isLight = useIsLightMode()
	return isLight ? HOLIDAY_TOKENS.light : HOLIDAY_TOKENS.dark
}
