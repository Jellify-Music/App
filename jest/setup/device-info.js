// https://github.com/react-native-device-info/react-native-device-info/issues/1360
import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'

jest.mock('react-native-device-info', () => mockRNDeviceInfo)
