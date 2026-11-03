import { addToQueue } from '../../../../player/queuing'
import { QueuingType } from '../../../../enums/queuing-type'
import AddToQueueMenuRowsProps from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'

// Use same icon as swipe Add to Queue for consistency
const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'playlist-play',
}

export default function AddToQueueMenuRows({ tracks }: AddToQueueMenuRowsProps): React.JSX.Element {
	return (
		<>
			<ContextMenuRow
				onPress={() => addToQueue({ tracks, queuingType: QueuingType.PlayNext })}
				imageProp={IMAGE_PROP}
				label='Play Next'
			/>

			<ContextMenuRow
				onPress={() => addToQueue({ tracks, queuingType: QueuingType.PlayLater })}
				imageProp={IMAGE_PROP}
				label='Add to Queue'
			/>
		</>
	)
}
