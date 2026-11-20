import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { RefreshControl } from 'react-native'
import { SizableText, Spinner, useTheme, View, YStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { BaseStackParamList } from '../../../screens/types'
import { useArtistContext } from '../../../providers/Artist'
import { useArtistPlaylists } from '../../../hooks/use-artist-playlists'
import ArtistListHeader from '../list-header'
import ItemRow from '../../Global/components/item-row'
import List from '../../Global/components/Lists/utils'
import { closeAllSwipeableRows } from '../../Global/components/SwipeableRow/registery'

/** The playlists, the user's own and public ones, that this artist appears on */
export default function PlaylistsTab(): React.JSX.Element {
	const { t } = useTranslation()

	const { artist } = useArtistContext()

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const theme = useTheme()

	const {
		playlists,
		userPlaylistIds,
		isPending,
		checked,
		total,
		failedPlaylists,
		failedLists,
		isRefreshing,
		retry,
		refresh,
	} = useArtistPlaylists(artist)

	const renderItem = ({ item }: { item: BaseItemDto }) => (
		<View marginHorizontal='2'>
			<ItemRow
				item={item}
				onPress={() =>
					navigation.navigate('Playlist', {
						playlist: item,
						canEdit: !!item.Id && userPlaylistIds.has(item.Id),
					})
				}
			/>
		</View>
	)

	// Something couldn't be looked at, so what's shown may be incomplete
	const failureMessage =
		failedLists > 0
			? t('artist.playlists.failedLists', { count: failedLists })
			: failedPlaylists > 0
				? t('artist.playlists.failedPlaylists', { count: failedPlaylists })
				: undefined

	const failureNotice = failureMessage ? (
		<YStack alignItems='center' padding='3' onPress={retry} testID='artist-playlists-retry'>
			<SizableText fontSize='3' color='neutral'>
				{t('artist.playlists.tapToRetry', { message: failureMessage })}
			</SizableText>
		</YStack>
	) : null

	// A big library takes a while to look through, so say how far along it is
	const progress = (
		<SizableText fontSize='3' color='neutral' testID='artist-playlists-progress'>
			{total > 0
				? t('artist.playlists.checked', {
						checked: checked.toLocaleString(),
						total: total.toLocaleString(),
					})
				: t('artist.playlists.looking')}
		</SizableText>
	)

	return (
		<List
			testID='artist-playlists-list'
			data={playlists}
			renderItem={renderItem}
			onScrollBeginDrag={closeAllSwipeableRows}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={refresh}
					tintColor={theme.primary.val}
				/>
			}
			ListHeaderComponent={
				<>
					<ArtistListHeader />

					{playlists.length > 0 ? failureNotice : null}
				</>
			}
			ListEmptyComponent={
				<YStack justifyContent='center' alignItems='center' gap='2' padding='4'>
					{isPending ? (
						<>
							<Spinner color='primary' />
							{progress}
						</>
					) : (
						<>
							<SizableText fontSize='3' color='neutral'>
								{t('artist.playlists.notOnAny', {
									name: artist.Name ?? t('artist.playlists.thisArtist'),
								})}
							</SizableText>
							{failureNotice}
						</>
					)}
				</YStack>
			}
			ListFooterComponent={
				isPending && playlists.length > 0 ? (
					<YStack alignItems='center' gap='2' padding='3'>
						<Spinner color='primary' />
						{progress}
					</YStack>
				) : null
			}
		/>
	)
}
