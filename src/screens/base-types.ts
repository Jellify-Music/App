import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { StaticScreenProps } from '@react-navigation/native'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { BaseStack } from './base-stack'
import { LibrarySectionListData } from '../components/Global/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type ArtistProps = StaticScreenProps<{
	artist: BaseItemDto
}>
export type AlbumProps = StaticScreenProps<{
	album: BaseItemDto
}>
export type PlaylistProps = StaticScreenProps<{
	playlist: BaseItemDto
	canEdit?: boolean | undefined
}>
export type TracksProps = StaticScreenProps<{
	tracksInfiniteQuery: UseInfiniteQueryResult<(BaseItemDto | LibrarySectionListData)[], Error>
	showAlphabeticalSelector?: boolean
}>
export type InstantMixProps = StaticScreenProps<{
	item: BaseItemDto
}>

type BaseStackType = typeof BaseStack

declare module '@react-navigation/core' {
	interface BaseStackNavigator extends NativeStackNavigationProp<BaseStackType> {}
}
