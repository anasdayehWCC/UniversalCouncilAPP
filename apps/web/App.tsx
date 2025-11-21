import React from 'react';
import { getModules } from '../../packages/core/plugins/registry';

export default function WebApp() {
  const modules = getModules();
  return (
    <main style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h1>Universal Council App (Web)</h1>
      <ul>
        {modules.map((m) => (
          <li key={m.meta.id}>{m.meta.title}</li>
        ))}
      </ul>
    </main>
  );
}

