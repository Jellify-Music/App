import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import {
	NavigatorTypeBagFor,
	StaticParamList,
	StaticScreenProps,
	TypedNavigator,
} from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackTypeBag } from '@react-navigation/native-stack'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { BaseStack } from './base-stack'
import { LibrarySectionListData } from '../components/Global/types'

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

export type BaseStackParamList = StaticParamList<{ config: { screens: typeof BaseStack } }>

/**
 * A native stack containing the {@link BaseStack} screens, for use with `useNavigation`
 * in components that can be rendered in any tab stack that spreads them
 */
export type BaseStackNavigator = TypedNavigator<
	NavigatorTypeBagFor<NativeStackTypeBag, BaseStackParamList>
>

/**
 * A navigation object that can reach the {@link BaseStack} screens, for passing
 * between components (e.g. into the context sheet)
 */
export type StackNavigation = Pick<
	NativeStackNavigationProp<BaseStackParamList>,
	'navigate' | 'dispatch'
>
