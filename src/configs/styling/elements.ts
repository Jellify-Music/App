// v3 removed the separate `pressStyle`/`hoverStyle` props - interaction states are now
// expressed as modifier clauses on the same style property (see Tamagui v3 "flat style props").
export const BUTTON_PRESS_STYLES = {
	transition: 'quick',
	scale: '1 hover:0.925 press: 0.875',
} as const

export const ICON_PRESS_STYLES = {
	transition: 'quick',
	opacity: '1 hover: 0.8, press: 0.6',
} as const
