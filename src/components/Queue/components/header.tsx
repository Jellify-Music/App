import { Paragraph, Spacer, XStack } from 'tamagui'
import { StyleSheet } from 'react-native'
import { usePlayerContext } from '../../../providers/Player'
import Icon from '../../Global/components/icon'

export default function QueueListHeader() {
	const { setPage } = usePlayerContext()

	return (
		<XStack
			alignContent='center'
			padding={'$3'}
			borderBottomWidth={'$1'}
			borderColor={'$borderColor'}
		>
			<Icon small name='chevron-up' style={styles.icon} onPress={() => setPage(0)} />

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
