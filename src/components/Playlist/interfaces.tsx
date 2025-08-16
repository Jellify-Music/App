import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'

export interface PlaylistProps {
	playlist: BaseItemDto
	navigation: NativeStackNavigationProp<BaseStackParamList>
	canEdit?: boolean | undefined
}

export interface PlaylistOrderMutation {
	playlist: BaseItemDto
	track: BaseItemDto
	to: number
}

export interface RemoveFromPlaylistMutation {
	playlist: BaseItemDto
	track: BaseItemDto
	index: number
}
