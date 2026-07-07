import { DraxViewProps } from 'react-native-drax'
import { ITEM_ROW_HEIGHT } from './dimensions'

export const itemDraxViewProps: Partial<DraxViewProps> = {
	dragHandle: true,
	hoverStyle: {
		opacity: 0.9,
		transform: [
			{
				scale: 1.05,
			},
		],
	},
}
