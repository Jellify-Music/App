import { YStack, XStack, useTheme, SizableText } from 'tamagui'
import { RefreshControl, SectionList } from 'react-native'
import Track from '../Global/components/Track'
import FavoriteButton from '../Global/components/favorite-button'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { BaseStackParamList } from '../../screens/types'
import { closeAllSwipeableRows } from '../Global/components/SwipeableRow/registery'
import AlbumTrackListFooter from './footer'
import AlbumTrackListHeader from './header'
import { useCollectionDownload } from '../../hooks/downloads/collection'
import DownloadButton from '../Global/components/download-button'
import { useAlbumDiscs } from '../../api/queries/album'
import { ItemKeyExtractor } from '../../utils/parsing/key-extractor'
import AlbumSectionHeader from './section-header'
import { useTranslation } from 'react-i18next'

/**
 * The screen for an Album's track list
 *
 *
 * @param navigation The navigation object from the parent screen
 *
 * @returns A React component
 */
export function Album({ album }: { album: BaseItemDto }): React.JSX.Element {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const theme = useTheme()

	const { data: discs, isPending, refetch } = useAlbumDiscs(album)

	const sections = (Array.isArray(discs) ? discs : []).map(({ title, data }) => ({
		title,
		data: Array.isArray(data) ? data : [],
	}))

	const hasMultipleSections = sections.length > 1

	const albumTrackList = discs?.flatMap((disc) => disc.data)

	const collection = useCollectionDownload(albumTrackList)

	const onRefresh = async () => {
		await refetch()
	}

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<XStack gap='2' justifyContent='center' alignContent='center'>
					<DownloadButton collection={collection} />
					<FavoriteButton item={album} />
				</XStack>
			),
		})
		// the button's values, not the object they come in, which is new every time
	}, [album, navigation, collection.state, collection.progress])

	return (
		<SectionList
			contentInsetAdjustmentBehavior='automatic'
			sections={sections}
			keyExtractor={ItemKeyExtractor}
			maxToRenderPerBatch={50}
			renderSectionHeader={({ section }) =>
				!isPending &&
				hasMultipleSections && <AlbumSectionHeader discNumber={section.title} />
			}
			ListHeaderComponent={<AlbumTrackListHeader album={album} />}
			renderItem={({ item: track, index }) => {
				const trackIndexInAlbum =
					albumTrackList?.findIndex(({ Id }) => Id === track.Id) ?? index

				return (
					<Track
						testID={`album-track-${trackIndexInAlbum}`}
						navigation={navigation}
						track={track}
						tracklist={albumTrackList}
						index={trackIndexInAlbum}
						queue={album}
					/>
				)
			}}
			ListFooterComponent={<AlbumTrackListFooter album={album} freeze={isPending} />}
			ListEmptyComponent={() => (
				<YStack flex={1} alignContent='center' margin='4'>
					{isPending ? null : (
						<SizableText
							fontSize='3'
							fontWeight='6'
							textAlign='center'
							color='borderColor'
						>
							{t('album.noTracks')}
						</SizableText>
					)}
				</YStack>
			)}
			onScrollBeginDrag={closeAllSwipeableRows}
			refreshControl={
				<RefreshControl
					refreshing={isPending}
					onRefresh={onRefresh}
					tintColor={theme.primary.val}
				/>
			}
		/>
	)
}
