export function getAccidentSeverity(data) {
  const accelValues = [data?.accel_x, data?.accel_y, data?.accel_z]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const gyroValues = [data?.gyro_x, data?.gyro_y, data?.gyro_z]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const acceleration = accelValues.reduce((sum, value) => sum + Math.abs(value), 0);
  const tiltAngle = gyroValues.length ? Math.max(...gyroValues.map((value) => Math.abs(value))) : 0;
  const impactForce = acceleration * 18;
  const score = acceleration + tiltAngle / 90 + impactForce / 40;

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

  if (score >= 14) {
    return { level: 3, label: 'Severe', color: 'red', score, acceleration, tiltAngle, impactForce };
  }

  if (score >= 8) {
    return { level: 2, label: 'Medium', color: 'yellow', score, acceleration, tiltAngle, impactForce };
  }

  return { level: 1, label: 'Minor', color: 'green', score, acceleration, tiltAngle, impactForce };
}
