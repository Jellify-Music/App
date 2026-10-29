import Track from '../Global/components/Track'
import { SizableText, useTheme } from 'tamagui'
import { closeAllSwipeableRows } from '../Global/components/SwipeableRow/registery'
import useInstantMix from '../../api/queries/instant-mix'
import { RefreshControl } from 'react-native'
import List from '../Global/components/Lists/utils'
import MixTrackListHeader from './header'

export default function InstantMix(): React.JSX.Element {
	const { data: mix, isFetching, refetch } = useInstantMix()

	const theme = useTheme()

	const onRefresh = () => {
		refetch()
	}

	return (
		<List
			contentInsetAdjustmentBehavior='automatic'
			data={mix}
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
			ListHeaderComponent={<MixTrackListHeader />}
			ListEmptyComponent={
				!isFetching ? <SizableText color={'neutral'}>No mix tracks</SizableText> : undefined // Refresh Control will handle the spinner, which is actually called a "throbber" ;)
			}
			refreshControl={
				<RefreshControl
					refreshing={isFetching}
					onRefresh={onRefresh}
					tintColor={theme.success.val}
				/>
			}
		/>
	)
}
