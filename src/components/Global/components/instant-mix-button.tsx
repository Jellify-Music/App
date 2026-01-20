import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import Icon from './icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../screens/types'
import Button from '../helpers/button'
import { CommonActions } from '@react-navigation/native'
import { Text } from '../helpers/text'
import { BUTTON_PRESS_STYLES } from '../../../configs/style.config'

export function InstantMixIconButton({
	item,
	navigation,
}: {
	item: BaseItemDto
	navigation: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
}): React.JSX.Element {
	return (
		<Icon
			name='radio'
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
			borderColor={'$success'}
			borderWidth={'$1'}
			icon={<Icon name='radio' color='$success' small />}
			onPress={() =>
				navigation.dispatch(
					CommonActions.navigate('InstantMix', {
						item,
					}),
				)
			}
			flex={1}
			{...BUTTON_PRESS_STYLES}
		>
			<Text bold color={'$success'}>
				Mix
			</Text>
		</Button>
	)
}
