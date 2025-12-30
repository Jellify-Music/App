import { InstantMixProps } from '../../screens/types'
import Track from '../Global/components/Track'
import { Separator, useTheme } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import useInstantMix from '../../api/queries/instant-mix'
import { Text } from '../Global/helpers/text'
import { RefreshControl } from 'react-native'

export default function InstantMix({ route, navigation }: InstantMixProps): React.JSX.Element {
	const { data: mix, isFetching, refetch } = useInstantMix(route.params.item)

	const theme = useTheme()

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			data={mix}
			ItemSeparatorComponent={() => <Separator />}
			onScrollBeginDrag={closeAllSwipeableRows}
			renderItem={({ item, index }) => (
				<Track
					showArtwork
					track={item}
					index={index}
					queue={'Instant Mix'}
					tracklist={mix}
				/>
			)}
			ListEmptyComponent={
				!isFetching ? <Text color={'$neutral'}>No mix tracks</Text> : undefined // Refresh Control will handle the spinner, which is actually called a "throbber" ;)
			}
			refreshControl={
				<RefreshControl
					refreshing={isFetching}
					onRefresh={refetch}
					tintColor={theme.success.val}
				/>
			}
		/>
	)
}
