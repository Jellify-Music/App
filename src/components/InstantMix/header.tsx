import { H5, useTheme, XStack, YStack } from 'tamagui'
import { useInstantMixContext } from '../../providers/InstantMix'
import ItemImage from '../Global/components/image'
import { getItemName } from '../../utils/formatting/item-names'
import { useTranslation } from 'react-i18next'

export default function MixTrackListHeader() {
	const { t } = useTranslation()

	const { item } = useInstantMixContext()

	const theme = useTheme()

	return (
		<YStack flex={1} marginTop='4' gap='2' alignContent='center'>
			<XStack justifyContent='center'>
				<ItemImage
					item={item}
					width={'15'}
					height={'15'}
					imageOptions={{
						maxHeight: 750,
						maxWidth: 750,
					}}
					elevate
					circular
				/>
			</XStack>

			<H5 lineBreakStrategyIOS='standard' textAlign='center'>
				{t('instantMix.title', { name: getItemName(item) })}
			</H5>
		</YStack>
	)
}
