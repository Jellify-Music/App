import { Platform } from 'react-native'
import { DraxViewProps } from 'react-native-drax'

export const itemDraxViewProps: Partial<DraxViewProps> = {
	dragHandle: true,
	draggingStyle: {
		height: Platform.OS === 'ios' ? 60 : undefined,
	},
	hoverStyle: {
		opacity: 0.9,
		transform: [
			{
				scale: 1.05,
			},
			{
				// IDK why but we need this, prolly due to the patch to get
				// Drax working on 0.85+
				translateY: -10,
			},
		],
	},
}
