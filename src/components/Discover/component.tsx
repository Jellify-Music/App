import React from 'react'
import { getToken, ScrollView, useTheme, YStack } from 'tamagui'
import RecentlyAdded from './helpers/just-added'
import { RefreshControl } from 'react-native'
import PublicPlaylists from './helpers/public-playlists'
import SuggestedArtists from './helpers/suggested-artists'
import useDiscoverQueries from '../../api/mutations/discover'
import { useIsRestoring } from '@tanstack/react-query'
import { useRecentlyAddedAlbums } from '../../api/queries/album'

export default function Index(): React.JSX.Element {
	const theme = useTheme()

	const { mutateAsync: refreshAsync, isPending: refreshing } = useDiscoverQueries()

	const isRestoring = useIsRestoring()

	const { isPending: loadingInitialData } = useRecentlyAddedAlbums()

	return (
		<ScrollView
			contentContainerStyle={{
				flexGrow: 1,
				marginTop: getToken('$4'),
				marginHorizontal: getToken('$2'),
			}}
			contentInsetAdjustmentBehavior='automatic'
			removeClippedSubviews
			refreshControl={
				<RefreshControl
					refreshing={refreshing || isRestoring || loadingInitialData}
					onRefresh={refreshAsync}
					tintColor={theme.primary.val}
				/>
			}
		>
			<DiscoverContent />
		</ScrollView>
	)
}

function DiscoverContent() {
	return (
		<YStack gap={'$3'}>
			<RecentlyAdded />

			<PublicPlaylists />

			<SuggestedArtists />
		</YStack>
	)
}
