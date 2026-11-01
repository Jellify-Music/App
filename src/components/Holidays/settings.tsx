import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, useTheme } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import StatusBar from '../Global/helpers/status-bar'
import { SettingsStackParamList } from '../../screens/Settings/types'
import { useJellifyUser } from '../../stores/auth'
import { usePublicServerInfo } from '../../api/queries/public-server-info'
import HTTPS from '../../constants/protocols'
import getUserImageUrl from '../../api/queries/image/utils/avatar'
import { useJellyfinServer } from '../../hooks/auth/server'
import Snowfall from './snow'
import StringLights from './lights'
import { useHolidayTokens } from './hooks'
import { DESIGN_TOP_INSET, HOLIDAY_TOKENS, LIGHTS_HEIGHT } from './tokens'
import {
	AboutIcon,
	AccountGlyph,
	AppearanceIcon,
	AvatarHat,
	ChevronRightIcon,
	GesturesIcon,
	LockIcon,
	PlaybackIcon,
	PrivacyIcon,
	SignOutIcon,
	StorageIcon,
} from './settings-icons'

type Row = {
	testID: string
	title: string
	route: keyof Pick<
		SettingsStackParamList,
		'Appearance' | 'Gestures' | 'Playback' | 'StorageManagement' | 'PrivacyDeveloper' | 'About'
	>
	Icon: React.ComponentType<{ color: string; cutout: string }>
	color: string
}

/**
 * The Settings screen from the Holidays design: a pine green account band with its own snow
 * (always the dark variant) and lights, a Santa-hatted avatar, and outlined rows. It reads
 * the same user, server and navigation state as the stock settings screen.
 */
export default function HolidaySettings(): React.JSX.Element {
	const theme = useTheme()
	const tokens = useHolidayTokens()
	const { top } = useSafeAreaInsets()
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const [server] = useJellyfinServer()
	const { data: serverInfo } = usePublicServerInfo()
	const [user] = useJellifyUser()

	const isSecure = server?.url?.includes(HTTPS)
	const userAvatarUrl = getUserImageUrl()

	// The design was measured on a device with a 62px top inset
	const shift = top - DESIGN_TOP_INSET
	const headerHeight = 174 + shift

	const rows: Row[] = [
		{
			testID: 'settings-nav-appearance',
			title: 'Appearance',
			route: 'Appearance',
			Icon: AppearanceIcon,
			color: theme.primary.val,
		},
		{
			testID: 'settings-nav-gestures',
			title: 'Gestures',
			route: 'Gestures',
			Icon: GesturesIcon,
			color: tokens.green,
		},
		{
			testID: 'settings-nav-playback',
			title: 'Playback',
			route: 'Playback',
			Icon: PlaybackIcon,
			color: tokens.gold,
		},
		{
			testID: 'settings-nav-storage',
			title: 'Storage',
			route: 'StorageManagement',
			Icon: StorageIcon,
			color: theme.primary.val,
		},
		{
			testID: 'settings-nav-privacy-developer',
			title: 'Privacy & Developer',
			route: 'PrivacyDeveloper',
			Icon: PrivacyIcon,
			color: tokens.green,
		},
		{
			testID: 'settings-nav-about',
			title: 'About',
			route: 'About',
			Icon: AboutIcon,
			color: tokens.gold,
		},
	]

	return (
		<View
			style={[styles.screen, { backgroundColor: theme.background.val }]}
			testID='settings-screen-root'
		>
			<StatusBar invertColors />

			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
				<View style={{ height: headerHeight }}>
					<View
						style={[styles.band, { height: 162 + shift, backgroundColor: tokens.band }]}
					/>

					<Snowfall
						height={150 + shift}
						count={40}
						seed={5}
						color={HOLIDAY_TOKENS.dark.snow}
					/>

					<Pressable
						testID='settings-profile-card'
						accessibilityRole='button'
						accessibilityLabel={`Account: ${user?.name ?? 'Unknown User'} on ${serverInfo?.ServerName ?? 'Unknown Server'}`}
						onPress={() => navigation.navigate('Account')}
						style={[styles.account, { top: 72 + shift }]}
					>
						<View>
							<Avatar circular size={64} backgroundColor={tokens.avatar}>
								<Avatar.Image src={userAvatarUrl} />
								<Avatar.Fallback
									backgroundColor={tokens.avatar}
									alignItems='center'
									justifyContent='center'
								>
									<AccountGlyph />
								</Avatar.Fallback>
							</Avatar>

							<View pointerEvents='none' style={styles.hat}>
								<AvatarHat />
							</View>
						</View>

						<View style={styles.accountText}>
							<Text style={styles.accountName}>{user?.name ?? 'Unknown User'}</Text>
							<View style={styles.serverRow}>
								<LockIcon color={isSecure ? '#7BE0A3' : '#FFB347'} />
								<Text style={styles.serverName}>
									{serverInfo?.ServerName ?? 'Unknown Server'}
								</Text>
							</View>
						</View>

						<ChevronRightIcon color='#FFFFFF' size={26} strokeWidth={2.6} />
					</Pressable>

					<View style={[styles.lights, { top: headerHeight - LIGHTS_HEIGHT }]}>
						<StringLights dark />
					</View>
				</View>

				<View style={styles.rows}>
					{rows.map(({ testID, title, route, Icon, color }) => (
						<Pressable
							key={testID}
							testID={testID}
							accessibilityRole='button'
							onPress={() => navigation.navigate(route)}
							style={[styles.row, { borderColor: tokens.outline }]}
						>
							<Icon color={color} cutout={theme.background.val} />
							<Text style={[styles.rowLabel, { color: theme.color.val }]}>
								{title}
							</Text>
							<ChevronRightIcon color={theme.borderColor.val} />
						</Pressable>
					))}

					<Pressable
						testID='settings-signout-button'
						accessibilityRole='button'
						onPress={() => navigation.navigate('SignOut')}
						style={[styles.signOut, { backgroundColor: tokens.signOut }]}
					>
						<SignOutIcon color='#FFFFFF' />
						<Text style={styles.signOutLabel}>Sign Out</Text>
					</Pressable>
				</View>
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	content: {
		paddingBottom: 160,
	},
	band: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
	},
	account: {
		position: 'absolute',
		left: 14,
		right: 14,
		height: 72,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		paddingHorizontal: 6,
	},
	hat: {
		position: 'absolute',
		left: 24,
		top: -14,
	},
	accountText: {
		flex: 1,
		gap: 4,
	},
	accountName: {
		fontFamily: 'Figtree-Bold',
		fontSize: 18,
		color: '#FFFFFF',
	},
	serverRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	serverName: {
		fontFamily: 'Figtree-Regular',
		fontSize: 17,
		color: '#FFFFFF',
	},
	lights: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: LIGHTS_HEIGHT,
		overflow: 'hidden',
	},
	rows: {
		paddingTop: 8,
		paddingHorizontal: 14,
		gap: 9,
	},
	row: {
		height: 63,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		paddingHorizontal: 18,
		borderWidth: 1.5,
		borderRadius: 12,
	},
	rowLabel: {
		flex: 1,
		fontFamily: 'Figtree-Bold',
		fontSize: 18.5,
	},
	signOut: {
		marginTop: 14,
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		borderRadius: 6,
	},
	signOutLabel: {
		fontFamily: 'Figtree-Bold',
		fontSize: 18.5,
		color: '#FFFFFF',
	},
})
