import React, { useEffect, useState } from 'react'
import { getToken, Spinner, ToggleGroup, YStack } from 'tamagui'
import { H2, Text } from '../../Global/helpers/text'
import Button from '../../Global/helpers/button'
import _ from 'lodash'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJellifyContext } from '../../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserViews } from '../../../api/queries/libraries'
import { useQuery } from '@tanstack/react-query'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../../components/types'
import Icon from '../../Global/components/icon'

export default function ServerLibrary({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { api, user, setUser, setLibrary } = useJellifyContext()

	const [libraryId, setLibraryId] = useState<string | undefined>(undefined)
	const [playlistLibrary, setPlaylistLibrary] = useState<BaseItemDto | undefined>(undefined)

	const {
		data: libraries,
		isError,
		isPending,
		isSuccess,
		refetch,
	} = useQuery({
		queryKey: [QueryKeys.UserViews],
		queryFn: () => fetchUserViews(api, user),
	})

	useEffect(() => {
		if (!isPending && isSuccess)
			setPlaylistLibrary(
				libraries?.filter((library) => library.CollectionType === 'playlists')[0],
			)
	}, [isPending, isSuccess])

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<YStack maxHeight={'$19'} flex={1} justifyContent='center'>
				<H2 marginHorizontal={'$2'} textAlign='center'>
					Select Music Library
				</H2>
			</YStack>
			<YStack marginHorizontal={'$4'}>
				{isPending ? (
					<Spinner size='large' />
				) : (
					<ToggleGroup
						orientation='vertical'
						type='single'
						disableDeactivation={true}
						value={libraryId}
						onValueChange={setLibraryId}
					>
						{libraries!
							.filter((library) => library.CollectionType === 'music')
							.map((library) => {
								console.log(library.Id, 'Library ID')
								return (
									<ToggleGroup.Item
										key={library.Id}
										value={library.Id!}
										testID={library.Id!}
										aria-label={library.Name!}
										backgroundColor={
											libraryId == library.Id!
												? getToken('$color.purpleGray')
												: 'unset'
										}
									>
										<Text>{library.Name ?? 'Unnamed Library'}</Text>
									</ToggleGroup.Item>
								)
							})}
					</ToggleGroup>
				)}

				{isError && <Text>Unable to load libraries</Text>}

				<Button
					disabled={!libraryId}
					icon={() => <Icon name='guitar-electric' small />}
					testID='let_s_go_button'
					onPress={() => {
						setLibrary({
							musicLibraryId: libraryId!,
							musicLibraryName:
								libraries?.filter((library) => library.Id == libraryId)[0].Name ??
								'No library name',
							musicLibraryPrimaryImageId: libraries?.filter(
								(library) => library.Id == libraryId,
							)[0].ImageTags!.Primary,
							playlistLibraryId: playlistLibrary?.Id,
							playlistLibraryPrimaryImageId: playlistLibrary?.ImageTags!.Primary,
						})
						navigation.navigate('Tabs', {
							screen: 'Home',
							params: {},
						})
					}}
				>
					{`Let's Go!`}
				</Button>

				<Button
					icon={() => <Icon name='chevron-left' small />}
					onPress={() => {
						setUser(undefined)
						navigation.navigate('ServerAuthentication', undefined, {
							pop: true,
						})
					}}
				>
					Switch User
				</Button>
			</YStack>
		</SafeAreaView>
	)
}
