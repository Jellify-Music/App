import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import { QueryKeys } from '../../../enums/query-keys'
import { useQuery } from '@tanstack/react-query'
import { fetchInstantMixFromItem } from '../../../api/queries/instant-mixes'
import Icon from './icon'
import { Spacer, Spinner } from 'tamagui'
import { useJellifyContext } from '../../../providers'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../screens/types'
export default function InstantMixButton({
	item,
	navigation,
}: {
	item: BaseItemDto
	navigation: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
}): React.JSX.Element {
	const { api, user } = useJellifyContext()

	const { data, isFetching, refetch } = useQuery({
		queryKey: [QueryKeys.InstantMix, item.Id!],
		queryFn: () => fetchInstantMixFromItem(api, user, item),
	})

	return data ? (
		<Icon
			name='compass-outline'
			color={'$success'}
			onPress={() =>
				navigation.navigate('InstantMix', {
					item,
					mix: data,
				})
			}
		/>
	) : isFetching ? (
		<Spinner alignSelf='center' />
	) : (
		<Spacer />
	)
}
