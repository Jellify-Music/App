import { StyleSheet } from 'react-native'
import { DraxViewProps } from 'react-native-drax'

export const itemDraxViewProps: Partial<DraxViewProps> = {
	dragHandle: true,
	hoverStyle: {
		transform: [
			{
				scale: 1.05,
			},
		],
		position: 'absolute',
	},
	style: {
		flexDirection: 'row',
		alignItems: 'center',
	},
}
