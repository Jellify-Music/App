import { createImage, styled } from 'tamagui'
import TurboImage, { Source } from 'react-native-turbo-image'

const Image = createImage({
	Component: TurboImage,
	transformSource: ({ src }) => ({ uri: src }),
})

export default Image
