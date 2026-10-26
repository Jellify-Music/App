import navigationRef from '../../../../screens/navigation'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { StackActions } from '@react-navigation/native'
import { ListItem, SizableText } from 'tamagui'
import Icon from '../../../Global/components/icon'

export default function DeletePlaylistRow({
	playlist,
}: {
	playlist: BaseItemDto
}): React.JSX.Element {
	return (
		<ListItem
			transition={'quick'}
			opacity='1 press:0.5'
			backgroundColor={'transparent'}
			gap='3'
			justifyContent='flex-start'
			onPress={() => {
				navigationRef.dispatch(
					StackActions.push('DeletePlaylist', {
						playlist,
						onDelete: navigationRef.goBack,
					}),
				)
			}}
		>
			<Icon size={'7'} name='delete' color='warning' />

			<SizableText fontSize={'3'} fontWeight='6'>
				Delete Playlist
			</SizableText>
		</ListItem>
	)
}
