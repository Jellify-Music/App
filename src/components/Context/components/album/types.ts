import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { StackNavigation } from '../../../../screens/base-types'

interface ViewAlbumMenuRowProps {
	album: BaseItemDto
	stackNavigation?: StackNavigation
}

export default ViewAlbumMenuRowProps
