import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import Icon from './icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../screens/types'
import Button from '../helpers/button'
import { CommonActions } from '@react-navigation/native'
import { BUTTON_PRESS_STYLES } from '../../../configs/style.config'
import { Text } from 'tamagui'

export function InstantMixIconButton({
	item,
	navigation,
}: {
	item: BaseItemDto
	navigation: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
}): React.JSX.Element {
	return (
		<Icon
			name='access-point'
			color={'$success'}
			onPress={() =>
				navigation.navigate('InstantMix', {
					item,
				})
			}
		/>
	)
}

export function InstantMixButton({
	item,
	navigation,
}: {
	item: BaseItemDto
	navigation: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
}): React.JSX.Element {
	return (
		<Button
			borderRadius={'$4'}
			icon={<Icon name='access-point' color='$success' small />}
			onPress={() =>
				navigation.dispatch(
					CommonActions.navigate('InstantMix', {
						item,
					}),
				)
			}
			flex={1}
			borderColor={'$success'}
			borderWidth={'$1'}
			{...BUTTON_PRESS_STYLES}
		>
			<Text fontWeight={'bold'} color={'$success'}>
				Mix
			</Text>
		</Button>
	)
}
