import { AnimatePresence, SizableText } from 'tamagui'

export default function OneLibraryMessage(): React.JSX.Element {
	return (
		<AnimatePresence>
			<SizableText fontSize='3' color='borderColor' textAlign='center' transition={'quick'}>
				Only one music library is available
			</SizableText>
		</AnimatePresence>
	)
}
