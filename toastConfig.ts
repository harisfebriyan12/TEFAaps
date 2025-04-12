import Toast from 'react-native-toast-message';

export const toastConfig = {
  success: ({ text1, props }: any) => (
    <View
      style={{
        backgroundColor: '#10B981',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Check size={20} color="white" />
      <Text style={{ color: 'white', marginLeft: 10 }}>{text1}</Text>
    </View>
  ),
  error: ({ text1, props }: any) => (
    <View
      style={{
        backgroundColor: '#EF4444',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <X size={20} color="white" />
      <Text style={{ color: 'white', marginLeft: 10 }}>{text1}</Text>
    </View>
  ),
};
