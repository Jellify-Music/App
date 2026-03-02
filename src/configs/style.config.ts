import { ViewStyle } from 'tamagui'

export const BUTTON_PRESS_STYLES: Pick<ViewStyle, 'pressStyle' | 'hoverStyle' | 'transition'> = {
	transition: 'bouncy',
	pressStyle: { scale: 0.875 },
	hoverStyle: { scale: 0.925 },
}
