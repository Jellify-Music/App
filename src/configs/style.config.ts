import { ViewStyle } from 'tamagui'

export const BUTTON_PRESS_STYLES: Pick<ViewStyle, 'pressStyle' | 'hoverStyle' | 'animation'> = {
	animation: 'bouncy',
	pressStyle: { scale: 0.875 },
	hoverStyle: { scale: 0.925 },
}
