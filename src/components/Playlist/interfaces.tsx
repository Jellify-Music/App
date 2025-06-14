import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../types'

export interface PlaylistProps {
	playlist: BaseItemDto
	navigation: StackNavigationProp<StackParamList>
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
