import React from 'react';
import { SafeAreaView, ScrollView, Text, View, ActivityIndicator } from 'react-native';

type Module = { id: string; title: string; routes: { path: string; label: string }[] };
type TenantConfig = {
  id: string;
  name: string;
  modules: { id: string; enabled: boolean }[];
};

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_HOST || 'http://localhost:8080';
const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID || 'pilot_children';

export default function App() {
  const [config, setConfig] = React.useState<TenantConfig | null>(null);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${API_BASE}/config/${TENANT_ID}`)
      .then((r) => r.json())
      .then((c: TenantConfig) => {
        setConfig(c);
        const mapped: Module[] = c.modules
          .filter((m) => m.enabled)
          .map((m) => ({
            id: m.id,
            title: m.id[0].toUpperCase() + m.id.slice(1),
            routes: [],
          }));
        setModules(mapped);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>CareMinutes Mobile</Text>
        {config === null && !error && <ActivityIndicator />}
        {error && <Text style={{ color: 'red' }}>Config error: {error}</Text>}
        {modules.map((m) => (
          <View key={m.id} style={{ padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}>
            <Text style={{ fontWeight: '600' }}>{m.title}</Text>
            <Text style={{ color: '#555', marginTop: 4 }}>{m.routes.length || 0} routes</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
