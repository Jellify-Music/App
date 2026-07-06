import { Paragraph, Spacer, useTheme, XStack } from 'tamagui'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { StyleSheet } from 'react-native'
import { usePlayerContext } from '../../../providers/Player'

export default function QueueListHeader() {
	const { color } = useTheme()

	const { setPage } = usePlayerContext()

	const onDismissPress = () => {
		setPage(0)
	}

	return (
		<XStack
			alignContent='center'
			padding={'$3'}
			borderBottomWidth={'$1'}
			borderColor={'$borderColor'}
		>
			<MaterialDesignIcons
				size={22}
				color={color.val}
				name='chevron-up'
				style={styles.icon}
				onPress={onDismissPress}
			/>

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
