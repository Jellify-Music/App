import React from 'react'
import { getToken, ScrollView, useTheme, YStack } from 'tamagui'
import RecentlyAdded from './components/just-added'
import PublicPlaylists from './components/public-playlists'
import SuggestedArtists from './components/suggested-artists'
import useDiscoverQueries from '../../api/mutations/discover'
import { useIsRestoring } from '@tanstack/react-query'
import { useRecentlyAddedAlbums } from '../../api/queries/album'
import { RefreshControl } from 'react-native'
import SuggestedAlbums from './components/suggested-albums'

export default function Index(): React.JSX.Element {
	const { mutateAsync: refreshAsync, isPending: refreshing } = useDiscoverQueries()

	const isRestoring = useIsRestoring()

	const { isPending: loadingInitialData } = useRecentlyAddedAlbums()

	const theme = useTheme()

	const onRefresh = async () => {
		await refreshAsync()
	}

	return (
		<ScrollView
			contentContainerStyle={{
				paddingVertical: getToken('4'),
			}}
			contentInsetAdjustmentBehavior='automatic'
			removeClippedSubviews
			refreshControl={
				<RefreshControl
					onRefresh={onRefresh}
					refreshing={refreshing || isRestoring || loadingInitialData}
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
		<YStack alignContent='flex-start' gap='1'>
			<RecentlyAdded />

			<PublicPlaylists />

			<SuggestedArtists />

			<SuggestedAlbums />
		</YStack>
	)
}
