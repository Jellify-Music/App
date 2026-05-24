import { ListItem, Paragraph } from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { ICON_PRESS_STYLES } from '../../../configs/style.config'
import Icon from '../../Global/components/icon'
import goToScreenFromContextSheet from '../utils/navigation'
import { getItemName } from '../../../utils/formatting/item-names'

export default function ViewInstantMixMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	return (
		<ListItem
			backgroundColor={'transparent'}
			flex={1}
			gap={'$2.5'}
			justifyContent='flex-start'
			onPress={() => {
				goToScreenFromContextSheet('InstantMix', { item })
			}}
			{...ICON_PRESS_STYLES}
		>
			<Icon small color='$success' name='access-point' />

			<Paragraph fontWeight={'$6'}>{`Go to ${getItemName(item)} Mix`}</Paragraph>
		</ListItem>
	)
}
