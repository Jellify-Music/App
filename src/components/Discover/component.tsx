import React from 'react'
import { getToken, ScrollView, useTheme, YStack } from 'tamagui'
import RecentlyAdded from './helpers/just-added'
import PublicPlaylists from './helpers/public-playlists'
import SuggestedArtists from './helpers/suggested-artists'
import useDiscoverQueries from '../../api/mutations/discover'
import { useIsRestoring } from '@tanstack/react-query'
import { useRecentlyAddedAlbums } from '../../api/queries/album'
import { Platform, RefreshControl } from 'react-native'

export default function Index(): React.JSX.Element {
	const { mutateAsync: refreshAsync, isPending: refreshing } = useDiscoverQueries()

	const isRestoring = useIsRestoring()

	const { isPending: loadingInitialData } = useRecentlyAddedAlbums()

	const theme = useTheme()

	return (
		<ScrollView
			contentContainerStyle={{
				marginVertical: getToken('$4'),
			}}
			contentInsetAdjustmentBehavior='automatic'
			removeClippedSubviews
			refreshControl={
				<RefreshControl
					onRefresh={refreshAsync}
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
		<YStack
			alignContent='flex-start'
			gap={'$3'}
			marginBottom={Platform.OS === 'android' ? '$4' : undefined}
		>
			<RecentlyAdded />

			<PublicPlaylists />

			<SuggestedArtists />
		</YStack>
	)
}
