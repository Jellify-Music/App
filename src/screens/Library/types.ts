import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../types'
import { Queue } from '../../player/types/queue-item'
import { NavigatorScreenParams } from '@react-navigation/native'

type LibraryStackParamList = BaseStackParamList & {
	LibraryScreen: NavigatorScreenParams<BaseStackParamList>
	AddPlaylist: undefined

	DeletePlaylist: {
		playlist: BaseItemDto
	}
}

export default LibraryStackParamList

export type LibraryScreenProps = NativeStackScreenProps<LibraryScreenParamList, 'LibraryScreen'>
export type LibraryArtistProps = NativeStackScreenProps<LibraryStackParamList, 'Artist'>
export type LibraryAlbumProps = NativeStackScreenProps<LibraryStackParamList, 'Album'>

export type LibraryAddPlaylistProps = NativeStackScreenProps<LibraryStackParamList, 'AddPlaylist'>
export type LibraryDeletePlaylistProps = NativeStackScreenProps<
	LibraryStackParamList,
	'DeletePlaylist'
>

type LibraryScreenParamList = {
	LibraryScreen: NavigatorScreenParams<LibraryStackParamList>
}
