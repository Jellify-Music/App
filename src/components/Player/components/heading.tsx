import { useTheme, XStack, YStack, SizableText, Spacer } from 'tamagui'
import { useQueueRef } from '../../../stores/player/queue'
import React from 'react'
import { Ticker } from '../../Global/utils/Animated/text'
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../screens/navigation'
import { useTranslation } from 'react-i18next'

export default function PlayerHeading(): React.JSX.Element {
	const { t } = useTranslation()

	const theme = useTheme()

	const queueRef = useQueueRef()

	const playingFrom = !queueRef
		? t('placeholders.untitled')
		: typeof queueRef === 'object'
			? (queueRef.Name ?? t('placeholders.untitled'))
			: queueRef

	return (
		<XStack
			alignContent='flex-start'
			flexShrink={1}
			justifyContent='center'
			marginHorizontal='4'
		>
			<MaterialDesignIcons
				color={theme.color.val}
				name={'chevron-down'}
				size={22}
				onPress={() => navigationRef.goBack()}
				testID='player-close-button'
				accessibilityLabel={t('player.close')}
				style={{
					marginVertical: 'auto',
					width: 22,
					marginRight: 8,
				}}
			/>

			<YStack alignItems='center' flexGrow={1}>
				<SizableText fontSize={'2'}>{t('player.playingFrom')}</SizableText>
				<Ticker>
					<SizableText fontWeight='6' numberOfLines={1} fontSize='2'>
						{playingFrom}
					</SizableText>
				</Ticker>
			</YStack>

			<Spacer marginLeft={8} width={22} />
		</XStack>
	)
}
