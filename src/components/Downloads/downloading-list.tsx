import React from 'react'
import { SizableText, XStack, YStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import ItemImage from '../Global/components/image'
import CircularProgressIndicator from '../Global/components/DownloadIndicator/circular-progress-indicator'
import { DownloadGroup } from '../../utils/download-groups'

/** What the cover needs to be shown, from what the track says about its album */
const coverOf = ({ albumId, imageTag }: DownloadGroup): BaseItemDto => ({
	Id: albumId,
	ImageTags: imageTag ? { Primary: imageTag } : undefined,
})

function DownloadingRow({ group }: { group: DownloadGroup }) {
	const { t } = useTranslation()

	const percent = Math.round(group.progress * 100)

	return (
		<XStack
			alignItems='center'
			gap='$3'
			testID={`downloading-${group.key}`}
			role='progressbar'
			aria-label={t('downloads.rowLabel', {
				title: group.title,
				done: group.done,
				total: group.total,
			})}
			aria-valuenow={percent}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<ItemImage item={coverOf(group)} width={48} height={48} />

			<YStack flex={1} gap='$1'>
				{/* the circle a track shows while it downloads, at the same size, here for the album */}
				<XStack alignItems='center' gap='$1'>
					<CircularProgressIndicator
						progress={group.progress}
						size={12}
						strokeWidth={4}
					/>

					<SizableText flexShrink={1} fontWeight='700' numberOfLines={1}>
						{group.title}
					</SizableText>
				</XStack>

				{group.artist ? (
					<SizableText fontSize={12} color='$neutral' numberOfLines={1}>
						{group.artist}
					</SizableText>
				) : null}

				<SizableText fontSize={12} color='$neutral'>
					{t('downloads.progress', { done: group.done, total: group.total })}
				</SizableText>
			</YStack>
		</XStack>
	)
}

/** The albums that are downloading, each with how far along it is */
export default function DownloadingList({
	groups,
}: {
	groups: DownloadGroup[]
}): React.JSX.Element | null {
	if (groups.length === 0) return null

	return (
		<YStack gap='$3' testID='downloading-list'>
			{groups.map((group) => (
				<DownloadingRow key={group.key} group={group} />
			))}
		</YStack>
	)
}
