export function getAccidentSeverity(data) {
  const accelValues = [data?.accel_x, data?.accel_y, data?.accel_z]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const gyroValues = [data?.gyro_x, data?.gyro_y, data?.gyro_z]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const normalizedAccel = accelValues.map((value) => (Math.abs(value) > 32 ? value / 16384 : value));
  const acceleration = normalizedAccel.length === 3
    ? Math.sqrt(normalizedAccel.reduce((sum, value) => sum + value * value, 0))
    : 0;
  const accelDelta = Math.abs(acceleration - 1);
  const tiltAngle = gyroValues.length ? Math.max(...gyroValues.map((value) => Math.abs(value))) : 0;
  const impactForce = accelDelta * 10;
  const score = impactForce + tiltAngle / 120;

  if (!data?.fall_detected) {
    return {
      level: 0,
      label: 'No accident',
      color: 'slate',
      score,
      acceleration,
      tiltAngle,
      impactForce,
    };
  }

  if (score >= 10) {
    return { level: 3, label: 'Severe', color: 'red', score, acceleration, tiltAngle, impactForce };
  }

  if (score >= 5) {
    return { level: 2, label: 'Medium', color: 'yellow', score, acceleration, tiltAngle, impactForce };
  }

  return { level: 1, label: 'Minor', color: 'green', score, acceleration, tiltAngle, impactForce };
}
