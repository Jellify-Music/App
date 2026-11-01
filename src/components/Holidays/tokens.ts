/**
 * Colors and metrics taken straight from the Holidays design.
 *
 * The semantic colors (background, primary, muted text, ...) live in the Tamagui theme
 * (see `PRESET_PALETTES.holidays`). Everything in here is decoration-only: string lights,
 * snow, candy cane stripes, and the handful of surfaces the design colors individually.
 */
export type HolidayTokens = {
	/** Hairline between the tab bar / mini player and content */
	hairline: string
	/** Card and input outlines */
	outline: string
	/** Candy cane "white" stripe */
	cane: string
	/** Snow cap on artwork and cards, and the hat brim */
	cap: string
	snow: string
	flake: string
	gold: string
	/** Softer gold used on the Discover card corner dot */
	goldDot: string
	green: string
	greenCorner: string
	greenDeep: string
	redCorner: string
	holly: string
	berry: string
	/** Gold ring around round artist art */
	ring: string
	/** Alphabet scroller letters */
	index: string
	/** Surface of the back pill on stack headers */
	surface: string
	/** Search input fill */
	field: string
	/** Selected card fill */
	selectedFill: string
	/** Switch track (off) and knob */
	switchTrack: string
	switchKnob: string
	/** Settings account band, avatar and sign out button */
	band: string
	avatar: string
	signOut: string
	lights: {
		wire: string
		cap: string
		bulbs: readonly [string, string, string, string]
		glow: boolean
	}
}

const DARK: HolidayTokens = {
	hairline: '#2B3D33',
	outline: '#3A5244',
	cane: '#F5F1E8',
	cap: '#F3F6F8',
	snow: '#FFFFFF',
	flake: '#BFD3E0',
	gold: '#E8C36A',
	goldDot: '#E8C36A',
	green: '#46A872',
	greenCorner: '#2E8A57',
	greenDeep: '#1D5C39',
	redCorner: '#D9444A',
	holly: '#46A872',
	berry: '#F2555A',
	ring: 'rgba(232, 195, 106, 0.35)',
	index: '#9DB0A4',
	surface: '#13221A',
	field: '#0C1712',
	selectedFill: 'rgba(242, 85, 90, 0.08)',
	switchTrack: '#5D6E64',
	switchKnob: '#FFFFFF',
	band: '#123B28',
	avatar: '#0B2619',
	signOut: '#C42638',
	lights: {
		wire: '#3E5A48',
		cap: '#7F9086',
		bulbs: ['#FF5A5F', '#F4CB6A', '#4CC07F', '#6FB5FF'],
		glow: true,
	},
}

const LIGHT: HolidayTokens = {
	hairline: '#D8D0C0',
	outline: '#B9B09E',
	cane: '#FFFFFF',
	cap: '#FFFFFF',
	snow: '#9DB4C4',
	flake: '#5E86A3',
	gold: '#B8861F',
	goldDot: '#D6A43A',
	green: '#1E6A44',
	greenCorner: '#1E6A44',
	greenDeep: '#1E6A44',
	redCorner: '#B3261E',
	holly: '#1E6A44',
	berry: '#B3261E',
	ring: 'rgba(184, 134, 31, 0.45)',
	index: '#4F5E55',
	surface: '#FFFFFF',
	field: '#FFFFFF',
	selectedFill: 'rgba(179, 38, 30, 0.06)',
	switchTrack: '#8C9890',
	switchKnob: '#14201A',
	band: '#1E5A3E',
	avatar: '#123B28',
	signOut: '#A3172A',
	lights: {
		wire: '#6E8A76',
		cap: '#5E6B63',
		bulbs: ['#C8322A', '#C9951E', '#23784D', '#2F6FB5'],
		glow: false,
	},
}

export const HOLIDAY_TOKENS = { dark: DARK, light: LIGHT } as const

/** The width the design was drawn at; decorations scale their x positions from it */
export const DESIGN_WIDTH = 402

/**
 * Height of the string lights strip, and of the header region beneath the status bar
 * (design: status area 62 + 66 = 128 on a 402 x 874 screen)
 */
export const LIGHTS_HEIGHT = 24
export const HEADER_BELOW_INSET = 66
export const DESIGN_TOP_INSET = 62
