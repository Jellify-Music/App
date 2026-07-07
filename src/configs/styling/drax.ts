import { DraxViewProps } from 'react-native-drax'

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
