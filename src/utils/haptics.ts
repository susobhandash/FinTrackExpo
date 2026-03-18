import * as Haptics from "expo-haptics";

/** Subtle tap — navigation, chip selection */
export function hapticSelection() {
  Haptics.selectionAsync().catch(() => {});
}

/** Light press — toggles, minor confirmations */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Success notification — saved records, import complete */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Error notification — validation failures */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
