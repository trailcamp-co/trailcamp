const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

export function hapticLight() {
  if (canVibrate) navigator.vibrate(10);
}

export function hapticMedium() {
  if (canVibrate) navigator.vibrate(20);
}

export function hapticSuccess() {
  if (canVibrate) navigator.vibrate([10, 50, 20]);
}
