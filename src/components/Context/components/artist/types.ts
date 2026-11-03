import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { StackNavigation } from '../../../../screens/types'

export interface ArtistMenuRowsProps {
	artistIds: BaseItemDto['Id'][]
	stackNavigation?: StackNavigation
}

export interface ViewArtistMenuRowProps {
	artistId: BaseItemDto['Id']
	stackNavigation?: StackNavigation
}
