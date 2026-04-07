import { ViewStyle } from 'tamagui'

export const BUTTON_PRESS_STYLES: Pick<ViewStyle, 'pressStyle' | 'hoverStyle' | 'transition'> = {
	transition: 'quick',
	pressStyle: { scale: 0.875 },
	hoverStyle: { scale: 0.925 },
}

export const ICON_PRESS_STYLES: Pick<ViewStyle, 'pressStyle' | 'hoverStyle' | 'transition'> = {
	transition: 'quick',
	pressStyle: { opacity: 0.6 },
	hoverStyle: { opacity: 0.8 },
}
