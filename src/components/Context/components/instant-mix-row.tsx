import { ListItem, SizableText } from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'
import Icon from '../../Global/components/icon'
import goToScreenFromContextSheet from '../utils/navigation'
import { getItemName } from '../../../utils/formatting/item-names'

export default function ViewInstantMixMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	return (
		<ListItem
			backgroundColor={'transparent'}
			flex={1}
			gap='3'
			justifyContent='flex-start'
			{...ICON_PRESS_STYLES}
			onPress={() => {
				goToScreenFromContextSheet('InstantMix', { item })
			}}
		>
			<Icon size={'7'} color='success' name='access-point' />

			<SizableText
				fontSize={'3'}
				fontWeight='6'
			>{`Go to ${getItemName(item)} Mix`}</SizableText>
		</ListItem>
	)
}
