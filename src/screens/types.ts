import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
	BaseStackNavigator,
	GenericNavigation,
	StaticParamList,
	StaticScreenProps,
} from '@react-navigation/native'
import { RootStack } from '.'

export type LoginProps = NativeStackNavigationProp<RootStackParamList, 'Login'>

export type ContextProps = StaticScreenProps<{
	item: BaseItemDto
	playlist?: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
	navigation?: GenericNavigation<RootStackParamList>
	navigationCallback?: (screen: 'Album' | 'Artist', item: BaseItemDto) => void
}>

export type AddToPlaylistProps = StaticScreenProps<{
	tracks: BaseItemDto[]
	source?: BaseItemDto
}>

export type AudioSpecsProps = StaticScreenProps<{
	item: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
}>

export type DeletePlaylistProps = StaticScreenProps<{
	playlist: BaseItemDto
	onDelete: () => void
}>

type RootStackType = typeof RootStack
export type RootStackParamList = StaticParamList<RootStackType>

declare module '@react-navigation/core' {
	interface RootNavigator extends RootStackType {}
}
