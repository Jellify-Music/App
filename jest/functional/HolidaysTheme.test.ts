import { PRESET_PALETTES } from '../../src/configs/tamagui.config'
import { getJellifyNavTheme } from '../../src/components/theme'
import { HOLIDAY_TOKENS } from '../../src/components/Holidays/tokens'

const MODES = ['light', 'dark', 'oled'] as const
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\))$/i

describe('Holidays color scheme', () => {
	it.each(MODES)('defines every palette key for %s mode', (mode) => {
		const holidays = Object.keys(PRESET_PALETTES.holidays[mode]).filter(
			(key) => key !== 'outline',
		)
		const purple = Object.keys(PRESET_PALETTES.purple[mode])

		expect(holidays.sort()).toEqual(purple.sort())
	})

	it.each(MODES)('uses valid colors in %s mode', (mode) => {
		for (const value of Object.values(PRESET_PALETTES.holidays[mode])) {
			expect(value).toMatch(COLOR)
		}
	})

	it('keeps outlines distinct from muted text, as the design colors them separately', () => {
		for (const mode of MODES) {
			const { borderColor, outline } = PRESET_PALETTES.holidays[mode]

			expect(outline).toBeDefined()
			expect(outline).not.toBe(borderColor)
		}
	})

	it('leaves every other scheme without an outline override, so they fall back to borderColor', () => {
		for (const preset of ['purple', 'ocean', 'forest', 'sunset', 'peanut'] as const) {
			for (const mode of MODES) {
				expect(PRESET_PALETTES[preset][mode].outline).toBeUndefined()
			}
		}
	})

	it('builds a navigation theme from the Holidays palette', () => {
		const navTheme = getJellifyNavTheme('holidays', 'oled')

		expect(navTheme.dark).toBe(true)
		expect(navTheme.colors.primary).toBe(PRESET_PALETTES.holidays.oled.primary)
		expect(navTheme.colors.border).toBe(PRESET_PALETTES.holidays.oled.outline)
	})

	it('keeps the existing navigation border for other schemes', () => {
		const navTheme = getJellifyNavTheme('purple', 'dark')

		expect(navTheme.colors.border).toBe(PRESET_PALETTES.purple.dark.borderColor)
	})
})

describe('Holidays decoration tokens', () => {
	it('has the same tokens for light and dark', () => {
		expect(Object.keys(HOLIDAY_TOKENS.light).sort()).toEqual(
			Object.keys(HOLIDAY_TOKENS.dark).sort(),
		)
	})

	it('hangs four bulb colors on the lights, with a glow only in dark mode', () => {
		expect(HOLIDAY_TOKENS.dark.lights.bulbs).toHaveLength(4)
		expect(HOLIDAY_TOKENS.light.lights.bulbs).toHaveLength(4)
		expect(HOLIDAY_TOKENS.dark.lights.glow).toBe(true)
		expect(HOLIDAY_TOKENS.light.lights.glow).toBe(false)
	})
})
