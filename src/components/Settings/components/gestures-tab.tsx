import React, { useMemo } from 'react'
import { YStack, XStack, Paragraph, Separator } from 'tamagui'
import SettingsListGroup from './settings-list-group'
import { CheckboxWithLabel } from '../../Global/helpers/checkbox-with-label'
import { useSwipeSettingsStore, SwipeActionType } from '../../../stores/settings/swipe'

const ALL_ACTIONS: { key: SwipeActionType; label: string }[] = [
	{ key: 'AddToQueue', label: 'Add to queue' },
	{ key: 'ToggleFavorite', label: 'Toggle favorite' },
	{ key: 'AddToPlaylist', label: 'Add to playlist' },
]

export default function GesturesTab(): React.JSX.Element {
	const left = useSwipeSettingsStore((s) => s.left)
	const right = useSwipeSettingsStore((s) => s.right)
	const toggleLeft = useSwipeSettingsStore((s) => s.toggleLeft)
	const toggleRight = useSwipeSettingsStore((s) => s.toggleRight)

	const leftSummary = useMemo(() => (left.length ? left.join(', ') : 'None'), [left])
	const rightSummary = useMemo(() => (right.length ? right.join(', ') : 'None'), [right])

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Swipe Left on Track',
					subTitle: `Selected: ${leftSummary}`,
					iconName: 'gesture-swipe-left',
					iconColor: '$borderColor',
					children: (
						<YStack gap={'$2'} paddingVertical={'$2'}>
							<Paragraph color={'$borderColor'}>
								If one action is selected, it will trigger immediately on reveal. If
								multiple are selected, swiping left reveals a menu.
							</Paragraph>
							<Separator />
							{ALL_ACTIONS.map((a) => (
								<XStack key={`left-${a.key}`} paddingVertical={'$1'}>
									<CheckboxWithLabel
										checked={left.includes(a.key)}
										onCheckedChange={() => toggleLeft(a.key)}
										label={a.label}
										size={'$2'}
									/>
								</XStack>
							))}
						</YStack>
					),
				},
				{
					title: 'Swipe Right on Track',
					subTitle: `Selected: ${rightSummary}`,
					iconName: 'gesture-swipe-right',
					iconColor: '$borderColor',
					children: (
						<YStack gap={'$2'} paddingVertical={'$2'}>
							<Paragraph color={'$borderColor'}>
								If one action is selected, it will trigger immediately on reveal. If
								multiple are selected, swiping right reveals a menu.
							</Paragraph>
							<Separator />
							{ALL_ACTIONS.map((a) => (
								<XStack key={`right-${a.key}`} paddingVertical={'$1'}>
									<CheckboxWithLabel
										checked={right.includes(a.key)}
										onCheckedChange={() => toggleRight(a.key)}
										label={a.label}
										size={'$2'}
									/>
								</XStack>
							))}
						</YStack>
					),
				},
			]}
		/>
	)
}
