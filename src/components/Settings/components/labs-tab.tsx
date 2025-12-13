import SettingsListGroup from './settings-list-group'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import Button from '../../Global/helpers/button'
import { storage } from '../../../constants/storage'

export default function LabsTab(): React.JSX.Element {
	const queryClient = useQueryClient()

	return (
		<SettingsListGroup
			borderColor={'$danger'}
			settingsList={[
				{
					title: 'Clear Artists Cache',
					subTitle: 'Invalidates the artists in the library',
					iconName: 'test-tube-off',
					iconColor: '$danger',
					children: (
						<Button
							onPress={() => {
								storage.remove(QueryKeys.InfiniteArtists)
								queryClient.invalidateQueries({
									queryKey: [QueryKeys.InfiniteArtists],
								})
							}}
						>
							Clear Cache
						</Button>
					),
				},
			]}
		/>
	)
}
