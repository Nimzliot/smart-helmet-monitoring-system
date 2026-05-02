export const formatCoordinate = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(6) : '--';
};

export const formatSpeed = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(1)} km/h` : '--';
};

export const formatAltitude = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(1)} m` : '--';
};

export const formatSignalDbm = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(0)} dBm` : '--';
};

export const buildMapLink = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return `https://www.google.com/maps?q=${lat},${lng}`;
};
