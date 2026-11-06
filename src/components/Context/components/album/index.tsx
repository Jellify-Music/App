import { ImageType } from '@jellyfin/sdk/lib/generated-client'
import goToScreenFromContextSheet from '../../utils/navigation'
import { getItemName } from '../../../../utils/formatting/item-names'
import ViewAlbumMenuRowProps from './types'
import ContextMenuRow from '..'

export default function ViewAlbumMenuRow({
	album,
	stackNavigation,
}: ViewAlbumMenuRowProps): React.JSX.Element {
	const onPress = () => {
		if (stackNavigation) stackNavigation.navigate('Album', { album })
		else goToScreenFromContextSheet('Album', { album })
	}

	return (
		<ContextMenuRow
			onPress={onPress}
			imageProp={{ imageType: ImageType.Primary, item: album }}
			label={`Go to ${getItemName(album)}`}
		/>
	)
}
