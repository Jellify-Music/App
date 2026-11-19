import { useMutation } from '@tanstack/react-query'
import { removeFromPlaylist } from '../../../../api/mutations/playlist/utils/playlists'
import { useApi } from '../../../../stores/auth'
import navigationRef from '../../../../screens/navigation'
import { applyHapticFeedback } from '../../../../utils/haptics'
import { invalidatePlaylistTracks } from '../../../../api/queries/playlist/cache'
import { RemoveFromPlaylistRowProps } from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'
import { handleError } from '../../../../utils/errors'
import { LoggingContext } from '../../../../utils/logging'
import { useTranslation } from 'react-i18next'

const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'playlist-remove',
	color: 'warning',
}

export default function RemoveFromPlaylistRow({
	track,
	playlist,
}: RemoveFromPlaylistRowProps): React.JSX.Element {
	const { t } = useTranslation()

	const api = useApi()

	const { mutate: removeTrack, isPending } = useMutation({
		mutationFn: () => removeFromPlaylist([track], playlist),
		onSuccess: () => {
			applyHapticFeedback('success')
			invalidatePlaylistTracks(playlist)
			navigationRef.goBack()
		},
		onError: (error) => {
			handleError(error, LoggingContext.Playlist, 'removeFromPlaylist')
		},
	})

	return (
		<ContextMenuRow
			onPress={() => removeTrack()}
			disabled={isPending}
			imageProp={IMAGE_PROP}
			label={t('context.removeFromPlaylist')}
		/>
	)
}
