import { Paragraph, XStack, YStack } from 'tamagui'
import { deleteAudioCache, getAudioCache } from '../../utils/legacy/offline-mode-utils'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Button from '../../components/Global/helpers/button'
import useDownloadTracks from '../../hooks/downloads/mutations'
import { MigrateDownloadsProps } from '../types'

/**
 *
 * @deprecated This exists to handle downloads from before 1.1 and can be removed at anytime
 */
export default function MigrateDownloadsScreen({
	navigation,
}: MigrateDownloadsProps): React.JSX.Element {
	const { top, bottom } = useSafeAreaInsets()

	const { mutate: downloadTracks } = useDownloadTracks()

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const audioCache = getAudioCache() as any[]

	const processLegacyDownloads = () => {
		if (!audioCache) return

		const items = audioCache.map((download) => download.item)

		console.log(
			'Legacy download keys:',
			items.map((item) => item.Id),
		)

		downloadTracks(items)
	}

	const handleDownload = () => {
		processLegacyDownloads()

		navigation.pop()
	}

	const handleRemove = () => {
		deleteAudioCache()
			.then(() => {
				navigation.pop()
			})
			.catch((error) => {
				console.error('Error deleting legacy audio cache:', error)
			})
	}

	return (
		<YStack
			alignItems='center'
			justifyContent='center'
			marginTop={'$4'}
			marginVertical={bottom}
			marginHorizontal={'$4'}
			gap={'$4'}
		>
			<Paragraph textAlign='center' fontSize={'$8'} fontWeight='$6'>
				There are some downloads from a previous version of Jellify
			</Paragraph>

			<Paragraph textAlign='center' fontSize={'$6'} fontWeight={'$6'}>
				Would you like to migrate them?
			</Paragraph>

			<Paragraph textAlign='center' fontSize={'$6'} fontStyle='italic'>
				This will start downloading the tracks again in the background.
			</Paragraph>

			<XStack marginTop='$4' gap='$4'>
				<Button
					borderColor={'$warning'}
					borderWidth={'$1'}
					borderRadius={'$4'}
					onPress={handleRemove}
				>
					<Paragraph
						fontSize={'$4'}
						fontWeight={'bold'}
						color={'$warning'}
						fontFamily={'$body'}
					>
						No, remove them
					</Paragraph>
				</Button>

				<Button
					borderColor={'$success'}
					borderWidth={'$1'}
					borderRadius={'$4'}
					onPress={handleDownload}
				>
					<Paragraph
						fontSize={'$4'}
						fontWeight={'bold'}
						color={'$success'}
						fontFamily={'$body'}
					>
						Yes, download them
					</Paragraph>
				</Button>
			</XStack>
		</YStack>
	)
}
