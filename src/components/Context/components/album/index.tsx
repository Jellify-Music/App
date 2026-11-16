import { ImageType } from '@jellyfin/sdk/lib/generated-client'
import goToScreenFromContextSheet from '../../utils/navigation'
import { getItemName } from '../../../../utils/formatting/item-names'
import ViewAlbumMenuRowProps from './types'
import ContextMenuRow from '..'
import { useTranslation } from 'react-i18next'

export default function ViewAlbumMenuRow({
	album,
	stackNavigation,
}: ViewAlbumMenuRowProps): React.JSX.Element {
	const { t } = useTranslation()

	const onPress = () => {
		if (stackNavigation) stackNavigation.navigate('Album', { album })
		else goToScreenFromContextSheet('Album', { album })
	}

	return (
		<ContextMenuRow
			onPress={onPress}
			imageProp={{ imageType: ImageType.Primary, item: album }}
			label={t('context.goTo', { name: getItemName(album) })}
		/>
	)
}
