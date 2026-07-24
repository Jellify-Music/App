import { Paragraph, Spacer, Square, XStack, YStack } from 'tamagui'
import { StyleSheet } from 'react-native'
import { usePlayerContext } from '../../../providers/Player'
import Icon from '../../Global/components/icon'

export default function QueueListHeader() {
	const { setPage } = usePlayerContext()

	const onPressUpIcon = () => setPage(0)

	return (
		<XStack
			alignContent='center'
			justifyContent='center'
			padding={'$2'}
			borderBottomWidth={'$1'}
			borderColor={'$borderColor'}
			backgroundColor={'$background'}
		>
			<Icon width={24} small name='chevron-up' style={styles.icon} onPress={onPressUpIcon} />

			<YStack alignContent='center' flex={1}>
				<Square
					opacity={0.5}
					backgroundColor={'$borderColor'}
					width={'$3'}
					height={'$0.5'}
					borderRadius={'$8'}
					alignSelf='center'
				/>

				<Paragraph flex={1} fontWeight={'$6'} fontSize={'$4'} textAlign='center'>
					Next Up
				</Paragraph>
			</YStack>
			<Spacer width={24} />
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
