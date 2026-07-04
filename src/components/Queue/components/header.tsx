import { Paragraph, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { usePlayerContext } from '../../../providers/Player'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'

export default function QueueListHeader() {
	const { setPage } = usePlayerContext()

	const onUpIconPress = () => {
		return setPage(0)
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
				name='chevron-up'
				onPress={onUpIconPress}
				style={{
					flexShrink: 1,
					alignContent: 'center',
					justifyContent: 'center',
				}}
			/>

			<Paragraph fontWeight={'$8'} fontSize={'$8'} textAlign='right' flex={1}>
				Next Up
			</Paragraph>
		</XStack>
	)
}
