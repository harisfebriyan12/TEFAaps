import { NavigationContainer } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  return (
    <NavigationContainer independent={true}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="student/course/[id]" options={{ title: 'Detail Kursus' }} />
        <Stack.Screen name="student/task/[id]" options={{ title: 'Detail Tugas' }} />
      </Stack>
    </NavigationContainer>
  );
}