import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../services/api';
import { backendBaseUrl } from '../config';

export default function Settings() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    apiRequest('/api/system/health').then(setHealth).catch((error) => console.error(error));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="System settings"
        description="Review environment status, API connectivity, and deployment readiness for the Smart Helmet platform."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-lg font-semibold text-white">Platform configuration</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p>Backend URL: <span className="text-slate-200">{backendBaseUrl}</span></p>
            <p>JWT login enabled for the admin dashboard.</p>
            <p>Supabase is required and is used as the source of truth for runtime data.</p>
            <p>Telemetry pipeline is prepared for Wi-Fi HTTP posting from ESP32, plus GSM/GPS metadata and emergency SMS support.</p>
            <p>Helmet heartbeat is derived from telemetry packets and is marked offline if packets stop for too long.</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-lg font-semibold text-white">Health snapshot</h3>
          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-900 p-4 text-sm text-slate-300">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
