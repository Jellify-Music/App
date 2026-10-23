import React, { useMemo, useState } from 'react'
import { YStack, XStack, Button, Spinner, Paragraph, SizableText } from 'tamagui'
import { Modal, ScrollView, Pressable } from 'react-native'
import Icon from '../../components/Global/components/icon'
import useLibraryStore from '../../stores/library'
import { useLibraryYears } from '../../api/queries/years'
import LibraryStackParamList, { YearSelectionProps } from '../Library/types'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { applyHapticFeedback } from '../../utils/haptics'

const ANY = 'any'
type Picking = 'min' | 'max' | null

export default function YearSelectionScreen({ route }: YearSelectionProps): React.JSX.Element {
	const libraryStackNavigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const tab = route.params?.tab ?? 'Tracks'
	const { years: availableYears, isPending, isError } = useLibraryYears()
	const storeFilters = useLibraryStore.getState().filters[tab === 'Albums' ? 'albums' : 'tracks']
	const [minYear, setMinYear] = useState<number | typeof ANY>(storeFilters.yearMin ?? ANY)
	const [maxYear, setMaxYear] = useState<number | typeof ANY>(storeFilters.yearMax ?? ANY)
	const [picking, setPicking] = useState<Picking>(null)

	// Min year options: if maxYear is set, only years <= maxYear
	const minYearOptions = useMemo(() => {
		if (availableYears.length === 0) return []
		const max = typeof maxYear === 'number' ? maxYear : Math.max(...availableYears)
		return availableYears.filter((y) => y <= max)
	}, [availableYears, maxYear])

	// Max year options: if minYear is set, only years >= minYear
	const maxYearOptions = useMemo(() => {
		if (availableYears.length === 0) return []
		const min = typeof minYear === 'number' ? minYear : Math.min(...availableYears)
		return availableYears.filter((y) => y >= min)
	}, [availableYears, minYear])

	const handleOpenMin = () => {
		applyHapticFeedback('info')
		setPicking('min')
	}

	const handleOpenMax = () => {
		applyHapticFeedback('info')
		setPicking('max')
	}

	const handleSelectMin = (year: number | typeof ANY) => {
		applyHapticFeedback('info')
		setMinYear(year)
		setPicking(null)
		if (year !== ANY && typeof maxYear === 'number' && year > maxYear) {
			setMaxYear(year)
		}
	}

	const handleSelectMax = (year: number | typeof ANY) => {
		applyHapticFeedback('info')
		setMaxYear(year)
		setPicking(null)
		if (year !== ANY && typeof minYear === 'number' && year < minYear) {
			setMinYear(year)
		}
	}

	const handleSave = () => {
		applyHapticFeedback('info')
		const payload = {
			yearMin: minYear === ANY ? undefined : minYear,
			yearMax: maxYear === ANY ? undefined : maxYear,
		}
		if (tab === 'Albums') {
			useLibraryStore.getState().setAlbumsFilters(payload)
		} else {
			useLibraryStore.getState().setTracksFilters(payload)
		}
		libraryStackNavigation.goBack()
	}

	const handleClear = () => {
		applyHapticFeedback('info')
		setMinYear(ANY)
		setMaxYear(ANY)
		const payload = { yearMin: undefined, yearMax: undefined }
		if (tab === 'Albums') {
			useLibraryStore.getState().setAlbumsFilters(payload)
		} else {
			useLibraryStore.getState().setTracksFilters(payload)
		}
	}

	const hasSelection = minYear !== ANY || maxYear !== ANY
	const rangeLabel =
		minYear !== ANY || maxYear !== ANY
			? `${minYear === ANY ? '…' : minYear} – ${maxYear === ANY ? '…' : maxYear}`
			: null

	const minLabel = minYear === ANY ? 'Any' : String(minYear)
	const maxLabel = maxYear === ANY ? 'Any' : String(maxYear)

	if (isPending && availableYears.length === 0) {
		return (
			<YStack flex={1} alignItems='center' justifyContent='center'>
				<Spinner size='large' />
			</YStack>
		)
	}

	if (isError) {
		return (
			<YStack flex={1} alignItems='center' justifyContent='center' padding='4'>
				<SizableText color='borderColor'>Could not load years</SizableText>
				<Button marginTop='4' onPress={libraryStackNavigation.goBack}>
					Go back
				</Button>
			</YStack>
		)
	}

	const pickerOptions = picking === 'min' ? minYearOptions : maxYearOptions
	const onSelectOption = picking === 'min' ? handleSelectMin : handleSelectMax
	const currentValue = picking === 'min' ? minYear : maxYear

	return (
		<YStack flex={1} backgroundColor='background'>
			<XStack
				justifyContent='space-between'
				alignItems='center'
				padding='4'
				borderBottomWidth={1}
				borderBottomColor='borderColor'
			>
				<Button variant='outlined' size='md' onPress={libraryStackNavigation.goBack}>
					Cancel
				</Button>
				<SizableText size='6' fontWeight='8'>
					Year range
				</SizableText>
				<Button variant='outlined' size='md' onPress={handleClear} disabled={!hasSelection}>
					Clear
				</Button>
			</XStack>

			<YStack flex={1} padding='4' gap='2'>
				<SizableText size='5' fontWeight='6' marginBottom='2'>
					Min year
				</SizableText>
				<Pressable onPress={handleOpenMin}>
					<XStack
						alignItems='center'
						justifyContent='space-between'
						padding='3'
						backgroundColor='background75'
						borderRadius='2'
						borderWidth={1}
						borderColor='borderColor'
					>
						<SizableText>{minLabel}</SizableText>
						<Icon name='chevron-down' color='borderColor' />
					</XStack>
				</Pressable>

				<SizableText size='5' fontWeight='6' marginBottom='2' marginTop='3'>
					Max year
				</SizableText>
				<Pressable onPress={handleOpenMax}>
					<XStack
						alignItems='center'
						justifyContent='space-between'
						padding='3'
						backgroundColor='background75'
						borderRadius='2'
						borderWidth={1}
						borderColor='borderColor'
					>
						<SizableText>{maxLabel}</SizableText>
						<Icon name='chevron-down' color='borderColor' />
					</XStack>
				</Pressable>
			</YStack>

			{/* Dropdown picker modal */}
			<Modal
				visible={picking !== null}
				transparent
				animationType='fade'
				onRequestClose={() => setPicking(null)}
			>
				<Pressable
					style={{
						flex: 1,
						justifyContent: 'flex-end',
						backgroundColor: 'rgba(0,0,0,0.5)',
					}}
					onPress={() => setPicking(null)}
				>
					<Pressable style={{ maxHeight: '100%' }} onPress={(e) => e.stopPropagation()}>
						<YStack
							backgroundColor='background'
							borderTopLeftRadius='4'
							borderTopRightRadius='4'
							padding='4'
							maxHeight='100%'
						>
							<SizableText size='5' fontWeight='6' marginBottom='3'>
								{picking === 'min' ? 'Select min year' : 'Select max year'}
							</SizableText>
							<ScrollView
								style={{ maxHeight: 330 }}
								showsVerticalScrollIndicator
								keyboardShouldPersistTaps='handled'
							>
								<Pressable
									onPress={() => onSelectOption(ANY)}
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<XStack
										padding='3'
										alignItems='center'
										backgroundColor={`${currentValue === ANY ? 'background75' : 'transparent'}`}
										borderRadius='2'
									>
										<SizableText
											fontWeight={currentValue === ANY ? 'bold' : undefined}
										>
											Any
										</SizableText>
									</XStack>
								</Pressable>
								{pickerOptions.map((y) => (
									<Pressable
										key={y}
										onPress={() => onSelectOption(y)}
										style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
									>
										<XStack
											padding='3'
											alignItems='center'
											backgroundColor={`${currentValue === y ? 'background75' : 'transparent'}`}
											borderRadius='2'
										>
											<SizableText
												fontWeight={currentValue === y ? 'bold' : undefined}
											>
												{String(y)}
											</SizableText>
										</XStack>
									</Pressable>
								))}
							</ScrollView>
						</YStack>
					</Pressable>
				</Pressable>
			</Modal>

			{hasSelection && (
				<XStack
					justifyContent='space-evenly'
					alignItems='center'
					padding='4'
					borderTopWidth={1}
					borderTopColor='borderColor'
				>
					<SizableText size='3' fontWeight='8' color='primary'>
						{rangeLabel ?? ''}
					</SizableText>
					<Button variant='outlined' borderColor='primary' size='md' onPress={handleSave}>
						<Paragraph color='primary' fontWeight='6'>
							Apply
						</Paragraph>
					</Button>
				</XStack>
			)}
		</YStack>
	)
}
