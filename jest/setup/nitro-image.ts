// // Mock for react-native-nitro-image
// import React from 'react'
// import { View, ViewProps } from 'react-native'

// // Mock the useWebImage hook
// const mockUseWebImage = jest.fn(() => ({
// 	imageUri: 'mock://image.jpg',
// 	isLoading: false,
// 	error: null,
// }))

// // Mock the NitroImage component
// const MockNitroImage = (props: ViewProps) => {
// 	// Return a basic View component for testing
// 	return React.createElement(View, props)
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
