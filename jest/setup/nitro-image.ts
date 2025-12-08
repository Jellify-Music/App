// // Mock for react-native-nitro-image
// import React from 'react'
// import { Image, ImageProps } from 'react-native'

// // Mock the useWebImage hook
// const mockUseWebImage = jest.fn(() => ({
// 	imageUri: 'mock://image.jpg',
// 	isLoading: false,
// 	error: null,
// }))

// // Define types for NitroImage props
// interface NitroImageProps extends Omit<ImageProps, 'source'> {
// 	image?: {
// 		url: string
// 	}
// }

// // Mock the NitroImage component to behave like a regular Image
// const MockNitroImage = (props: NitroImageProps) => {
// 	// Extract the URL from the image prop if it exists
// 	const source = props.image?.url ? { uri: props.image.url } : undefined

// 	// Destructure to separate the custom image prop from standard Image props
// 	const { image, ...restProps } = props

// 	// Pass through other props while converting to Image component props
// 	const imageProps: ImageProps = {
// 		...restProps,
// 		source,
// 	}

// 	return React.createElement(Image, imageProps)
// }

// // Mock the entire react-native-nitro-image module
// jest.mock('react-native-nitro-image', () => ({
// 	useWebImage: mockUseWebImage,
// 	NitroImage: MockNitroImage,
// 	// Add other exports that might be used
// 	createImageFactory: jest.fn(),
// 	ImageFactory: jest.fn(),
// }))

// // Mock the underlying native module that causes the error
// jest.mock('react-native-nitro-modules', () => ({
// 	NitroModules: {
// 		createModule: jest.fn(),
// 		install: jest.fn(),
// 	},
// 	createNitroModule: jest.fn(),
// }))

// // Additional mock for the TurboModule spec that's failing
// jest.mock('react-native-nitro-modules/src/turbomodule/NativeNitroModules', () => ({
// 	default: {
// 		installModule: jest.fn(),
// 		uninstallModule: jest.fn(),
// 	},
// }))
