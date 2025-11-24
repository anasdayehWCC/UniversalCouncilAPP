import React from 'react';
import { View, Text } from 'react-native';
import { getModules } from '../../packages/core/plugins/registry';

export default function App() {
  const modules = getModules();
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Universal Council App (Mobile)</Text>
      {modules.map((m) => (
        <Text key={m.meta.id}>• {m.meta.title}</Text>
      ))}
    </View>
  );
}

