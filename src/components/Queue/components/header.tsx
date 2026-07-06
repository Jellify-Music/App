import { Paragraph, Spacer, useTheme, XStack } from 'tamagui'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { GestureDetector } from 'react-native-gesture-handler'
import { useDismissQueue } from '../../../hooks/gestures/player'
import { StyleSheet } from 'react-native'

export default function QueueListHeader() {
	const { color } = useTheme()

	const gesture = useDismissQueue()

	return (
		<XStack
			alignContent='center'
			padding={'$3'}
			borderBottomWidth={'$1'}
			borderColor={'$borderColor'}
		>
			<GestureDetector gesture={gesture}>
				<MaterialDesignIcons
					size={22}
					color={color.val}
					name='chevron-up'
					style={styles.icon}
				/>
			</GestureDetector>

			<Paragraph flex={1} fontWeight={'$6'} fontSize={'$4'} textAlign='center'>
				Next Up
			</Paragraph>

			<Spacer flexShrink={1} />
		</XStack>
	)
}

const styles = StyleSheet.create({
	icon: {
		flexShrink: 1,
		marginVertical: 'auto',
		alignContent: 'center',
		justifyContent: 'center',
	},
})
