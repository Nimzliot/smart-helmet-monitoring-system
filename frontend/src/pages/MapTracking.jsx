import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { useSocket } from '../context/SocketContext';

export default function MapTracking() {
  const { locations, liveData } = useSocket();

  const points = useMemo(() => {
    const values = Object.values(locations);
    if (values.length) return values;
    if (liveData?.latitude != null && liveData?.longitude != null) {
      return [{
        helmet_id: liveData.helmet_id,
        latitude: liveData.latitude,
        longitude: liveData.longitude,
        timestamp: liveData.timestamp,
      }];
    }
    return [];
  }, [liveData, locations]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Location"
        title="Map tracking"
        description="Live GPS updates for connected helmets. Install react-leaflet and leaflet to enable an interactive production map, or use the live coordinate board below."
      />

      <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="rounded-[2rem] border border-dashed border-cyan-400/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_48%),linear-gradient(180deg,_rgba(15,23,42,0.95),_rgba(2,6,23,0.95))] p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Live map layer</p>
          <p className="mt-4 max-w-2xl text-sm text-slate-400">
            The project is prepared for a react-leaflet map integration. In this workspace, the realtime GPS board stays active even if the map package is not installed yet.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {points.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-slate-400">
                No GPS coordinates yet. Start the simulator to stream helmet locations.
              </div>
            ) : (
              points.map((point) => (
                <div key={point.helmet_id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-lg font-semibold text-white">{point.helmet_id}</p>
                  <p className="mt-3 text-sm text-slate-400">Latitude: {point.latitude}</p>
                  <p className="text-sm text-slate-400">Longitude: {point.longitude}</p>
                  <p className="mt-3 text-xs text-slate-500">{new Date(point.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
