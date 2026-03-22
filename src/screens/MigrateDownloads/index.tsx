import { Paragraph, XStack, YStack } from 'tamagui'
import { getAudioCache } from '../../utils/legacy/offline-mode-utils'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '../../components/Global/helpers/button'

/**
 *
 * @deprecated This exists to handle downloads from before 1.1 and can be removed at anytime
 */
export default function MigrateDownloadsScreen(): React.JSX.Element {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const audioCache = getAudioCache() as any[]

	const fetchLegacyDownloads = async () => {
		if (!audioCache) return

		const keys = await audioCache.map((download) => download.id)

		console.log('Legacy download keys:', keys)

		// Here you would implement the logic to migrate these downloads to the new system
		// This might involve reading the files, extracting metadata, and adding them to the new cache
	}

	return (
		<SafeAreaView>
			<YStack flex={1} alignItems='center' justifyContent='center'>
				<Paragraph fontSize={'$6'} fontWeight='$6'>
					There are some downloads in an old format, would you like to download them again
					in the new format?
				</Paragraph>

				<XStack marginTop='$4' gap='$4'>
					<Button onPress={fetchLegacyDownloads}>
						<Paragraph fontSize={'$4'} fontWeight={'bold'}>
							Yes
						</Paragraph>
					</Button>

					<Button>
						<Paragraph fontSize={'$4'} fontWeight={'bold'}>
							No
						</Paragraph>
					</Button>
				</XStack>
			</YStack>
		</SafeAreaView>
	)
}
