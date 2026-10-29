import { AnimatePresence, H3 } from 'tamagui'

interface HeadingProps {
	title: string
}

export default function Heading({ title }: HeadingProps): React.JSX.Element {
	return (
		<AnimatePresence>
			<H3
				textAlign='center'
				marginBottom='2'
				testID='library_selection_title'
				transition={'quick'}
			>
				{title}
			</H3>
		</AnimatePresence>
	)
}
