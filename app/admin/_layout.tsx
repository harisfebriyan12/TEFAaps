import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { router } from 'expo-router';

export default function AdminLayout() {
  useEffect(() => {
    const checkAdminAccess = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        router.replace('/');
      }
    };

    checkAdminAccess();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: 'black',
        headerTitleStyle: {
          fontFamily: 'Poppins_600SemiBold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'ADMIN PANEL',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Kelola Pengguna',
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: 'Kelola Pesanan',
        }}
      />
      <Stack.Screen
        name="products"
        options={{
          title: 'Kelola Produk',
        }}
      />
    </Stack>
  );
}
