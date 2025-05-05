module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@': './', // Ganti './' kalau kamu punya folder src, misalnya './src'
        },
      },
    ],
    'react-native-reanimated/plugin', // Penting untuk Reanimated
  ],
};
