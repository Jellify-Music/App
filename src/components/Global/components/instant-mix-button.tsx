import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import Icon from './icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../screens/base-types'
import Button from '../utils/button'
import { CommonActions } from '@react-navigation/native'
import { BUTTON_PRESS_STYLES } from '../../../configs/styling/elements'
import { SizableText } from 'tamagui'
import { useTranslation } from 'react-i18next'

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
			color={'success'}
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
	const { t } = useTranslation()

	return (
		<Button
			borderRadius={'2'}
			icon={<Icon name='access-point' color='success' size={'7'} />}
			onPress={() =>
				navigation.dispatch(
					CommonActions.navigate('InstantMix', {
						item,
					}),
				)
			}
			flex={1}
			borderColor={'success'}
			borderWidth={'1'}
			{...BUTTON_PRESS_STYLES}
		>
			<SizableText fontSize={'2'} fontWeight='6' color='success'>
				{t('common.mix')}
			</SizableText>
		</Button>
	)
}
