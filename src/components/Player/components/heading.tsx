import { useTheme, XStack, YStack, SizableText, Spacer } from 'tamagui'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { useQueueRef } from '../../../stores/player/queue'
import React from 'react'
import { Ticker } from '../../Global/utils/Animated/text'
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../screens/navigation'
import { useTranslation } from 'react-i18next'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../screens/types'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { Queue } from '../../../services/types/queue-item'
import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'

export default function PlayerHeading(): React.JSX.Element {
	const { t } = useTranslation()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const theme = useTheme()

	const queueRef = useQueueRef()

	const queueRefIsItem = typeof queueRef === 'object'

	const playingFrom = !queueRef
		? t('placeholders.untitled')
		: queueRefIsItem
			? (queueRef.Name ?? t('placeholders.untitled'))
			: queueRef

	const onPlayingFromPress = () => {
		handleQueueRefNavigation(queueRef, rootNavigation)
	}

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
					flexShrink: 0,
				}}
			/>

			<YStack flex={1} alignItems='center' gap={'1'}>
				<SizableText fontSize={'2'}>{t('player.playingFrom')}</SizableText>
				<Ticker testID='player-queue-link'>
					<SizableText
						fontWeight='6'
						numberOfLines={1}
						fontSize='3'
						onPress={onPlayingFromPress}
						{...(queueRefIsItem && ICON_PRESS_STYLES)}
					>
						{playingFrom}
					</SizableText>
				</Ticker>
			</YStack>

			<Spacer marginLeft={8} width={22} flexShrink={0} />
		</XStack>
	)
}

/**
 * Handles navigation based on the type of the queue reference.
 *
 * @param queueRef The referring item or title of the currently playing queue
 *
 * @returns void
 */
function handleQueueRefNavigation(
	queueRef: Queue | undefined,
	rootNavigation: NativeStackNavigationProp<RootStackParamList>,
) {
	const action = getQueueRefNavigationAction(queueRef)

	if (!action) return

	rootNavigation.popTo('Tabs')
	navigationRef.dispatch(action)
}

/**
 * Builds the navigation action for a queue reference, if it refers to a navigable item.
 *
 * @param queueRef The referring item or title of the currently playing queue
 *
 * @returns The navigation action, or undefined if the queue reference isn't navigable
 */
function getQueueRefNavigationAction(queueRef: Queue | undefined) {
	if (typeof queueRef !== 'object') return undefined

	switch (queueRef.Type) {
		case BaseItemKind.MusicAlbum:
			return CommonActions.navigate('Album', { album: queueRef })
		case BaseItemKind.MusicArtist:
			return CommonActions.navigate('Artist', { artist: queueRef })
		case BaseItemKind.Playlist:
			return CommonActions.navigate('Playlist', {
				playlist: queueRef,
				canEdit: queueRef.CanDelete ?? false,
			})
		default:
			return undefined
	}
}
