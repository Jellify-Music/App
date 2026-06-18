import React from 'react'
import { Device, useCastDevice, useDevices } from 'react-native-google-cast'
import CastDevice from './device'
import { Paragraph, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { LegendList, LegendListRenderItemProps } from '@legendapp/list/react-native'

export default function CastDialog(): React.JSX.Element {
	const devices = useDevices()

	const currentDevice = useCastDevice()

	const renderItem = ({ item }: LegendListRenderItemProps<Device>) => (
		<CastDevice device={item} isActive={currentDevice?.deviceId === item.deviceId} />
	)

	return (
		<LegendList
			contentInsetAdjustmentBehavior='automatic'
			data={devices}
			ListEmptyComponent={CastDialogNoDevices}
			renderItem={renderItem}
		/>
	)
}

function CastDialogNoDevices() {
	return (
		<YStack justifyContent='center' alignContent='center'>
			<Icon large name='speaker-off' />
			<Paragraph fontWeight={'$6'}>No Cast devices discovered</Paragraph>
		</YStack>
	)
}
