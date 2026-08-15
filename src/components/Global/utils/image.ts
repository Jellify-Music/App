import { createImage } from 'tamagui'
import TurboImage from 'react-native-turbo-image'

const Image = createImage({
	Component: TurboImage,
	transformSource: ({ src }) => ({ uri: src }),
})

export default Image
