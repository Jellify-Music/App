import goToScreenFromContextSheet from '../../utils/navigation'
import { getItemName } from '../../../../utils/formatting/item-names'
import ViewInstantMixMenuRowProps from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'
import { useTranslation } from 'react-i18next'

const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'access-point',
	color: 'success',
}

export default function ViewInstantMixMenuRow({
	item,
}: ViewInstantMixMenuRowProps): React.JSX.Element {
	const { t } = useTranslation()

	const itemName = getItemName(item)

	const onPress = () => {
		goToScreenFromContextSheet('InstantMix', { item })
	}

	return (
		<ContextMenuRow
			onPress={onPress}
			imageProp={IMAGE_PROP}
			label={t('context.goToMix', { name: itemName })}
		/>
	)
}
