import { H5, useTheme, XStack, YStack } from 'tamagui'
import { useInstantMixContext } from '../../providers/InstantMix'
import ItemImage from '../Global/components/image'
import { getItemName } from '../../utils/formatting/item-names'

export default function MixTrackListHeader() {
	const { item } = useInstantMixContext()

	const theme = useTheme()

	return (
		<YStack flex={1} marginTop={'$4'} gap={'$2'} alignContent='center'>
			<XStack justifyContent='center'>
				<ItemImage
					item={item}
					width={'$15'}
					height={'$15'}
					imageOptions={{
						maxHeight: 750,
						maxWidth: 750,
					}}
					elevate
					circular
				/>
			</XStack>

			<H5 lineBreakStrategyIOS='standard' textAlign='center'>
				{getItemName(item)} Mix
			</H5>
		</YStack>
	)
}
