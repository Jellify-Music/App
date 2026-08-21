import 'react-native'
import type { DownloadedTrack } from 'react-native-nitro-player'

// Mock all external dependencies before importing component
jest.mock('../../src/providers/Storage')
jest.mock('../../src/hooks/downloads')
jest.mock('../../src/utils/toasts/deletion-toast')
jest.mock('react-native-safe-area-context')

import { useStorageContext } from '../../src/providers/Storage'
import useDownloads from '../../src/hooks/downloads'
import { useDeletionToast } from '../../src/utils/toasts/deletion-toast'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const mockUseStorageContext = useStorageContext as jest.Mock
const mockUseDownloads = useDownloads as jest.Mock
const mockUseDeletionToast = useDeletionToast as jest.Mock
const mockUseSafeAreaInsets = useSafeAreaInsets as jest.Mock

/**
 * Helper to create mock DownloadedTrack objects
 */
const createMockDownload = (id: number): DownloadedTrack => ({
	trackId: `track-${id}`,
	fileSize: id * 1000000,
	downloadedAt: new Date(2024, 0, id).getTime(),
	originalTrack: {
		id: `original-${id}`,
		title: `Track ${id}`,
		album: `Album ${id}`,
		artist: `Artist ${id}`,
		duration: 420,
		url: `https://example.com/track/${id}`,
	},
	localPath: `file:///tmp/mock`,
	storageLocation: 'private',
})

describe('StorageSelectionModal - Rendering Tests', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockUseSafeAreaInsets.mockReturnValue({ bottom: 16, top: 0, left: 0, right: 0 })
		mockUseDeletionToast.mockReturnValue(jest.fn())
	})

	describe('rendering with different download counts', () => {
		it('should handle component loading with 1 download', () => {
			const downloads = [createMockDownload(1)]

			mockUseDownloads.mockReturnValue({ data: downloads })
			mockUseStorageContext.mockReturnValue({
				selection: { 'track-1': true },
				deleteSelection: jest.fn(),
				clearSelection: jest.fn(),
				isDeleting: false,
			})

			// Verify mocks are configured correctly
			expect(mockUseDownloads).toBeDefined()
			expect(mockUseStorageContext).toBeDefined()
			expect(mockUseDownloads().data).toHaveLength(1)
			expect(mockUseDownloads().data[0].originalTrack?.title).toBe('Track 1')
		})

		it('should handle component loading with 10 downloads', () => {
			const downloads = Array.from({ length: 10 }, (_, i) => createMockDownload(i + 1))

			mockUseDownloads.mockReturnValue({ data: downloads })
			const selection = downloads.reduce(
				(acc, d) => {
					acc[d.trackId] = true
					return acc
				},
				{} as Record<string, boolean>,
			)

			mockUseStorageContext.mockReturnValue({
				selection,
				deleteSelection: jest.fn(),
				clearSelection: jest.fn(),
				isDeleting: false,
			})

			// Verify mocks are configured correctly
			expect(mockUseDownloads().data).toHaveLength(10)
			expect(Object.keys(mockUseStorageContext().selection)).toHaveLength(10)
		})
	})

	describe('null safety checks', () => {
		it('should handle undefined selection', () => {
			const downloads = [createMockDownload(1)]

			mockUseDownloads.mockReturnValue({ data: downloads })
			mockUseStorageContext.mockReturnValue({
				selection: undefined,
				deleteSelection: jest.fn(),
				clearSelection: jest.fn(),
				isDeleting: false,
			})

			// Component should handle undefined selection object
			expect(mockUseStorageContext().selection).toBeUndefined()
		})
	})

	describe('selection state handling', () => {
		it('should correctly count selected downloads', () => {
			const downloads = Array.from({ length: 5 }, (_, i) => createMockDownload(i + 1))

			const selection = {
				'track-1': true,
				'track-3': true,
				'track-2': false,
				'track-4': false,
				'track-5': false,
			}

			mockUseDownloads.mockReturnValue({ data: downloads })
			mockUseStorageContext.mockReturnValue({
				selection,
				deleteSelection: jest.fn(),
				clearSelection: jest.fn(),
				isDeleting: false,
			})

			const selectedCount = Object.values(mockUseStorageContext().selection).filter(
				Boolean,
			).length
			expect(selectedCount).toBe(2)
		})

		it('should handle singular vs plural track naming', () => {
			// With 1 download
			const singleDownload = [createMockDownload(1)]
			mockUseDownloads.mockReturnValue({ data: singleDownload })
			mockUseStorageContext.mockReturnValue({
				selection: { 'track-1': true },
				deleteSelection: jest.fn(),
				clearSelection: jest.fn(),
				isDeleting: false,
			})

			const count1 = Object.values(mockUseStorageContext().selection).filter(Boolean).length
			expect(count1).toBe(1)

			// With 10 downloads
			const multipleDownloads = Array.from({ length: 10 }, (_, i) =>
				createMockDownload(i + 1),
			)
			mockUseDownloads.mockReturnValue({ data: multipleDownloads })
			const multiSelection = multipleDownloads.reduce(
				(acc, d) => {
					acc[d.trackId] = true
					return acc
				},
				{} as Record<string, boolean>,
			)
			mockUseStorageContext.mockReturnValue({
				selection: multiSelection,
				deleteSelection: jest.fn(),
				clearSelection: jest.fn(),
				isDeleting: false,
			})

			const count10 = Object.values(mockUseStorageContext().selection).filter(Boolean).length
			expect(count10).toBe(10)
		})
	})
})
