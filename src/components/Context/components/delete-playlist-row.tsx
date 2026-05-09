import navigationRef from '../../../screens/navigation'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { StackActions } from '@react-navigation/native'
import { ListItem } from 'tamagui'
import Icon from '../../Global/components/icon'
import { Text } from '../../Global/helpers/text'

export default function DeletePlaylistRow({
	playlist,
}: {
	playlist: BaseItemDto
}): React.JSX.Element {
	return (
		<ListItem
			backgroundColor={'transparent'}
			gap={'$2.5'}
			justifyContent='flex-start'
			onPress={() => {
				navigationRef.dispatch(
					StackActions.push('DeletePlaylist', {
						playlist,
						onDelete: navigationRef.goBack,
					}),
				)
			}}
			pressStyle={{ opacity: 0.5 }}
		>
			<Icon small name='delete' color='$warning' />

			<Text bold>Delete Playlist</Text>
		</ListItem>
	)
}
