import goToScreenFromContextSheet from '../../utils/navigation'
import { getItemName } from '../../../../utils/formatting/item-names'
import ViewInstantMixMenuRowProps from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'

const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'access-point',
	color: 'success',
}

export default function ViewInstantMixMenuRow({
	item,
}: ViewInstantMixMenuRowProps): React.JSX.Element {
	const itemName = getItemName(item)

	const onPress = () => {
		goToScreenFromContextSheet('InstantMix', { item })
	}

	return (
		<ContextMenuRow onPress={onPress} imageProp={IMAGE_PROP} label={`Go to ${itemName} Mix`} />
	)
}
