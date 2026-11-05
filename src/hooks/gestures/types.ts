import { EventHandler } from '../../types/Events'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import { ThemeTokens } from 'tamagui'

export type SwipeAction = {
	label: string
	icon: MaterialDesignIconsIconName
	color: ThemeTokens // Tamagui token e.g. 'success'
	onTrigger: EventHandler
}

export type QuickAction = {
	icon: MaterialDesignIconsIconName
	color: ThemeTokens // Tamagui token e.g. 'primary'
	onPress: EventHandler
}
