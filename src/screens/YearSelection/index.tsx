import React, { useCallback, useMemo, useState } from 'react'
import { YStack, XStack, Button, Spinner } from 'tamagui'
import { Modal, ScrollView, Pressable } from 'react-native'
import { Text } from '../../components/Global/helpers/text'
import Icon from '../../components/Global/components/icon'
import { triggerHaptic } from '../../hooks/use-haptic-feedback'
import { YearSelectionProps } from '../types'
import useLibraryStore from '../../stores/library'
import { useLibraryYears } from '../../api/queries/years'

const ANY = 'any'
type Picking = 'min' | 'max' | null

export default function YearSelectionScreen({
	navigation,
	route,
}: YearSelectionProps): React.JSX.Element {
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

	const handleOpenMin = useCallback(() => {
		triggerHaptic('impactLight')
		setPicking('min')
	}, [])

	const handleOpenMax = useCallback(() => {
		triggerHaptic('impactLight')
		setPicking('max')
	}, [])

	const handleSelectMin = useCallback(
		(year: number | typeof ANY) => {
			triggerHaptic('impactLight')
			setMinYear(year)
			setPicking(null)
			if (year !== ANY && typeof maxYear === 'number' && year > maxYear) {
				setMaxYear(year)
			}
		},
		[maxYear],
	)

	const handleSelectMax = useCallback(
		(year: number | typeof ANY) => {
			triggerHaptic('impactLight')
			setMaxYear(year)
			setPicking(null)
			if (year !== ANY && typeof minYear === 'number' && year < minYear) {
				setMinYear(year)
			}
		},
		[minYear],
	)

	const handleSave = useCallback(() => {
		triggerHaptic('impactLight')
		const payload = {
			yearMin: minYear === ANY ? undefined : minYear,
			yearMax: maxYear === ANY ? undefined : maxYear,
		}
		if (tab === 'Albums') {
			useLibraryStore.getState().setAlbumsFilters(payload)
		} else {
			useLibraryStore.getState().setTracksFilters(payload)
		}
		navigation.goBack()
	}, [minYear, maxYear, navigation, tab])

	const handleClear = useCallback(() => {
		triggerHaptic('impactLight')
		setMinYear(ANY)
		setMaxYear(ANY)
		const payload = { yearMin: undefined, yearMax: undefined }
		if (tab === 'Albums') {
			useLibraryStore.getState().setAlbumsFilters(payload)
		} else {
			useLibraryStore.getState().setTracksFilters(payload)
		}
	}, [tab])

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
			<YStack flex={1} alignItems='center' justifyContent='center' padding='$4'>
				<Text color='$borderColor'>Could not load years</Text>
				<Button marginTop='$4' onPress={() => navigation.goBack()}>
					Go back
				</Button>
			</YStack>
		)
	}

	const pickerOptions = picking === 'min' ? minYearOptions : maxYearOptions
	const onSelectOption = picking === 'min' ? handleSelectMin : handleSelectMax
	const currentValue = picking === 'min' ? minYear : maxYear

	return (
		<YStack flex={1} backgroundColor='$background'>
			<XStack
				justifyContent='space-between'
				alignItems='center'
				padding='$4'
				borderBottomWidth={1}
				borderBottomColor='$borderColor'
			>
				<Button variant='outlined' size='$3' onPress={() => navigation.goBack()}>
					Cancel
				</Button>
				<Text bold fontSize='$6'>
					Year range
				</Text>
				<Button variant='outlined' size='$3' onPress={handleClear} disabled={!hasSelection}>
					Clear
				</Button>
			</XStack>

			<YStack flex={1} padding='$4' gap='$2'>
				<Text bold fontSize='$5' marginBottom='$2'>
					Min year
				</Text>
				<Pressable onPress={handleOpenMin}>
					<XStack
						alignItems='center'
						justifyContent='space-between'
						padding='$3'
						backgroundColor='$backgroundHover'
						borderRadius='$2'
						borderWidth={1}
						borderColor='$borderColor'
					>
						<Text>{minLabel}</Text>
						<Icon name='chevron-down' color='$borderColor' />
					</XStack>
				</Pressable>

				<Text bold fontSize='$5' marginBottom='$2' marginTop='$3'>
					Max year
				</Text>
				<Pressable onPress={handleOpenMax}>
					<XStack
						alignItems='center'
						justifyContent='space-between'
						padding='$3'
						backgroundColor='$backgroundHover'
						borderRadius='$2'
						borderWidth={1}
						borderColor='$borderColor'
					>
						<Text>{maxLabel}</Text>
						<Icon name='chevron-down' color='$borderColor' />
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
							backgroundColor='$background'
							borderTopLeftRadius='$4'
							borderTopRightRadius='$4'
							padding='$4'
							maxHeight='100%'
						>
							<Text bold fontSize='$5' marginBottom='$3'>
								{picking === 'min' ? 'Select min year' : 'Select max year'}
							</Text>
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
										padding='$3'
										alignItems='center'
										backgroundColor={
											currentValue === ANY
												? '$backgroundHover'
												: 'transparent'
										}
										borderRadius='$2'
									>
										<Text
											fontWeight={currentValue === ANY ? 'bold' : undefined}
										>
											Any
										</Text>
									</XStack>
								</Pressable>
								{pickerOptions.map((y) => (
									<Pressable
										key={y}
										onPress={() => onSelectOption(y)}
										style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
									>
										<XStack
											padding='$3'
											alignItems='center'
											backgroundColor={
												currentValue === y
													? '$backgroundHover'
													: 'transparent'
											}
											borderRadius='$2'
										>
											<Text
												fontWeight={currentValue === y ? 'bold' : undefined}
											>
												{String(y)}
											</Text>
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
					padding='$4'
					borderTopWidth={1}
					borderTopColor='$borderColor'
				>
					<Text fontSize='$3' bold color='$primary'>
						{rangeLabel ?? ''}
					</Text>
					<Button
						variant='outlined'
						borderColor='$primary'
						color='$primary'
						size='$3'
						onPress={handleSave}
					>
						Apply
					</Button>
				</XStack>
			)}
		</YStack>
	)
}
