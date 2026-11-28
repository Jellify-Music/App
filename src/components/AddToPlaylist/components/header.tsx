import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import ModalHeader from '../../Global/components/modal-header'

/**
 * Props for the AddToPlaylistHeader component
 */
interface AddToPlaylistHeaderProps {
	source?: BaseItemDto
	tracks: BaseItemDto[]
}

/**
 * Renders the header for the AddToPlaylist component, displaying the source item or the first track along with its artists.
 *
 * @param param0 The props for the AddToPlaylistHeader component, including the source item and the list of tracks.
 *
 * @returns The JSX element representing the header for the AddToPlaylist component.
 */
export default function AddToPlaylistHeader({
	source,
	tracks,
}: AddToPlaylistHeaderProps): React.JSX.Element {
	const item = source ?? tracks[0]

	return item && <ModalHeader item={item} />
}
