import { trigger } from 'react-native-haptic-feedback'
import Track, { TrackProps } from './track'
import { View, XStack } from 'tamagui'
import Icon from './icon'

interface DraggableTrackProps extends TrackProps {
	beginDrag: () => void
	onRemove: () => void
}

export default function DraggableTrack({
	beginDrag,
	index,
	...props
}: DraggableTrackProps): React.JSX.Element {
	return (
		<XStack alignItems='center'>
			<Icon
				flex={1}
				name='drag'
				onPressIn={() => {
					trigger('impactLight')
					beginDrag()
				}}
				testID={`queue-item-${index}-drag-handle`}
			/>
			<View flex={11}>
				<Track
					index={index}
					showArtwork
					testID={`queue-item-${index}`}
					showRemove
					{...props}
				/>
			</View>
		</XStack>
	)
}
