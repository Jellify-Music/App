import React from 'react'
import Button from '../../Global/helpers/button'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SettingsStackParamList } from '../../../screens/Settings/types'
import { Text } from '../../Global/helpers/text'
import Icon from '../../Global/components/icon'
export default function SignOut({
	navigation,
}: {
	navigation: NativeStackNavigationProp<SettingsStackParamList>
}): React.JSX.Element {
	return (
		<Button
			color={'$warning'}
			icon={() => <Icon name='hand-peace' small color={'$warning'} />}
			borderColor={'$warning'}
			marginHorizontal={'$6'}
			onPress={() => {
				navigation.navigate('SignOut')
			}}
		>
			<Text bold color={'$warning'}>
				Sign Out
			</Text>
		</Button>
	)
}
