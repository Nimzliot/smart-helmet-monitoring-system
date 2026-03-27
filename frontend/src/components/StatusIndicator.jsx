import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function StatusIndicator({ title, active, danger = true }) {
  let bgColor = 'bg-gray-800';
  let icon = <CheckCircle className="text-gray-500" />;
  let textColor = 'text-gray-500';
  let stateText = 'Normal';

  if (active) {
    if (danger) {
      bgColor = 'bg-red-900/40 border border-red-500/50';
      icon = <XCircle className="text-red-500" />;
      textColor = 'text-red-500';
      stateText = 'Detected';
    } else {
      bgColor = 'bg-yellow-900/40 border border-yellow-500/50';
      icon = <AlertTriangle className="text-yellow-500" />;
      textColor = 'text-yellow-500';
      stateText = 'Warning';
    }
  } else {
    // Normal / Safe state
    bgColor = 'bg-emerald-900/20 border border-emerald-500/20';
    icon = <CheckCircle className="text-emerald-500" />;
    textColor = 'text-emerald-500';
    stateText = 'Safe';
  }

  return (
    <div className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${bgColor}`}>
      <div className="p-4 bg-gray-950/50 rounded-full shadow-inner">
        {icon}
      </div>
      <div className="text-center">
        <h3 className="text-gray-300 font-medium mb-1">{title}</h3>
        <p className={`text-xl font-bold ${textColor}`}>{stateText}</p>
      </div>
    </div>
  );
}
