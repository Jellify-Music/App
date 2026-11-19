import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { GenericNavigation, StaticParamList, StaticScreenProps } from '@react-navigation/native'
import { RootStack } from '.'

export type LoginProps = NativeStackNavigationProp<RootStackParamList, 'Login'>

export type ContextProps = StaticScreenProps<{
	item: BaseItemDto
	playlist?: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
	navigation?: GenericNavigation<RootStackParamList>
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

export type PrivacyPolicyProps = StaticScreenProps<undefined>

export type OtaProps = StaticScreenProps<{ pullRequest?: boolean } | undefined>

type RootStackType = typeof RootStack
export type RootStackParamList = StaticParamList<RootStackType>

declare module '@react-navigation/core' {
	interface RootNavigator extends RootStackType {}
}
