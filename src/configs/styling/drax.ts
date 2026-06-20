import { StyleSheet } from 'react-native'
import { DraxViewProps } from 'react-native-drax'

export const draxStyles = StyleSheet.create({
	hoverStyle: {
		transform: [
			{
				translateY: 250,
			},
		],
	},
})

export const itemDraxViewProps: Partial<DraxViewProps> = {
	dragHandle: true,
	lockDragXPosition: true,
	hoverStyle: {
		transform: [
			{
				translateY: -550,
			},
		],
	},
}
