import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { useDevices } from 'react-native-google-cast'
import CastDevice from './device'
import { Paragraph, YStack } from 'tamagui'
import Icon from '../Global/components/icon'

export default function CastDialog(): React.JSX.Element {
	const devices = useDevices()

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			data={devices}
			ListHeaderComponent={CastDialogHeader}
			ListEmptyComponent={CastDialogNoDevices}
			renderItem={CastDevice}
		/>
	)
}

function CastDialogHeader() {
	return (
		<Paragraph fontWeight={'$6'} fontSize={'$6'}>
			Cast
		</Paragraph>
	)
}

function CastDialogNoDevices() {
	return (
		<YStack>
			<Icon large name='speaker-off' />
			<Paragraph>No Cast devices discovered</Paragraph>
		</YStack>
	)
}
