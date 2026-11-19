import { AnimatePresence, SizableText } from 'tamagui'
import { useTranslation } from 'react-i18next'

export default function OneLibraryMessage(): React.JSX.Element {
	const { t } = useTranslation()

	return (
		<AnimatePresence>
			<SizableText fontSize='3' color='borderColor' textAlign='center' transition={'quick'}>
				{t('librarySelector.oneLibrary')}
			</SizableText>
		</AnimatePresence>
	)
}
