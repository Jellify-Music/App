// Export the main converter utilities
export {
	MediaLibraryConverter,
	createMediaLibrary,
	createSportsCarLibrary,
	createSportsCarItem,
	convertBaseItemDtoToMediaItem,
	type MediaLibraryConverterConfig,
} from './MediaLibraryConverter'

// Export the example functions
export {
	mockBaseItemDtos,
	initializeWithSingleFolder,
	initializeWithMultipleFolders,
	initializeWithConverter,
	updateLibraryWithNewItems,
	playSampleMedia,
	createJellifyMediaLibrary,
	createJellifyMultiFolderLibrary,
	convertSingleItem,
	convertMultipleItems,
} from './MediaLibraryConverterExample'

// Export the original example (commented out due to TypeScript errors)
// export { default as AndroidAutoExample } from './AndroidAutoExample';
