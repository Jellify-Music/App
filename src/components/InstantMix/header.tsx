import { H5, Square, useTheme, View, XStack, YStack, ZStack } from 'tamagui'
import { useInstantMixContext } from '../../providers/InstantMix'
import ItemImage from '../Global/components/image'
import { getItemName } from '../../utils/formatting/item-names'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'

export default function MixTrackListHeader() {
	const { item } = useInstantMixContext()

	const theme = useTheme()

	return (
		<YStack flex={1} marginTop={'$4'} gap={'$2'}>
			<XStack justifyContent='center'>
				<ZStack alignContent='center'>
					<ItemImage
						item={item}
						width={'$15'}
						height={'$15'}
						imageOptions={{
							maxHeight: 750,
							maxWidth: 750,
						}}
						elevate
					/>
				</ZStack>
			</XStack>

			<H5 lineBreakStrategyIOS='standard' textAlign='center'>
				{getItemName(item)} Mix
			</H5>
		</YStack>
	)
}
