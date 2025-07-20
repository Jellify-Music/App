// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock'

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo)
