import { CheckCircle, XCircle } from 'lucide-react';

export default function StatusIndicator({ title, active }) {
  let bgColor = 'bg-gray-800';
  let icon = <CheckCircle className="text-gray-500" />;
  let textColor = 'text-gray-500';
  let stateText = 'Normal';

  if (active) {
    bgColor = 'bg-red-900/40 border border-red-500/50';
    icon = <XCircle className="text-red-500" />;
    textColor = 'text-red-500';
    stateText = 'Detected';
  } else {
    bgColor = 'bg-emerald-900/20 border border-emerald-500/20';
    icon = <CheckCircle className="text-emerald-500" />;
    textColor = 'text-emerald-500';
    stateText = 'Safe';
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl p-6 transition-all duration-300 ${bgColor}`}>
      <div className="rounded-full bg-gray-950/50 p-4 shadow-inner">
        {icon}
      </div>
      <div className="text-center">
        <h3 className="mb-1 font-medium text-gray-300">{title}</h3>
        <p className={`text-xl font-bold ${textColor}`}>{stateText}</p>
      </div>
    </div>
  );
}
