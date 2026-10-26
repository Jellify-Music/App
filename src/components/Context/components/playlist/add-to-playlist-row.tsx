import navigationRef from '../../../../screens/navigation'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { StackActions } from '@react-navigation/native'
import { ListItem, SizableText } from 'tamagui'
import Icon from '../../../Global/components/icon'

export default function AddToPlaylistRow({
	tracks,
	source,
}: {
	tracks: BaseItemDto[]
	source?: BaseItemDto
}): React.JSX.Element {
	return (
		<ListItem
			transition={'quick'}
			opacity='1 press:0.5'
			backgroundColor={'transparent'}
			flex={1}
			gap='3'
			justifyContent='flex-start'
			onPress={() => {
				navigationRef.goBack()
				navigationRef.dispatch(
					StackActions.push('AddToPlaylist', {
						tracks,
						source,
					}),
				)
			}}
		>
			<Icon size={'7'} color='primary' name='plus-circle-outline' />

			<SizableText fontSize={'3'} fontWeight='6'>
				Add to Playlist
			</SizableText>
		</ListItem>
	)
}
