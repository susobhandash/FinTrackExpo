# BottomSheet Implementation — Expo / React Native

A self-contained, gesture-driven bottom sheet built with **React Native Reanimated 3** and
**React-Native Gesture Handler 2**. It is exposed as a React Context so any screen can open
an arbitrary sheet without prop-drilling.

---

## Package Versions (tested)

| Package | Version |
|---|---|
| `expo` | ~51.0.0 |
| `react-native-reanimated` | ~3.10.0 |
| `react-native-gesture-handler` | ~2.16.0 |
| `react-native-safe-area-context` | 4.10.5 |

Install:

```bash
npx expo install react-native-reanimated react-native-gesture-handler react-native-safe-area-context
```

---

## Architecture Overview

```
RootLayout (app/_layout.tsx)
└── GestureHandlerRootView          ← required root wrapper for gesture handler
    └── SafeAreaProvider            ← required for safe-area insets
        └── BottomSheetProvider     ← owns all sheet state + animations
            └── <screen content>   ← any screen can call openSheet()
```

The sheet itself is rendered **inside** `BottomSheetProvider`, overlaid on top of all
children via `position: absolute / StyleSheet.absoluteFill`. This means:

- **Zero prop drilling** — any deeply nested component just calls `useBottomSheet()`.
- **One sheet at a time** — state is centralized; the last `openSheet()` wins.
- **No portal / modal needed** — the overlay sits at the provider level, always on top.

---

## File: `src/context/BottomSheetContext.tsx`

Full source (copy verbatim):

```tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import {
  StyleSheet, View, TouchableWithoutFeedback, Dimensions, ScrollView,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_H = Dimensions.get("window").height;
const SNAP_THRESHOLD = 80; // px dragged down before the sheet dismisses

// ── Types ──────────────────────────────────────────────────────────────────────

interface SheetOptions {
  children: React.ReactNode;
  isDark?: boolean;      // drives handle / background colours
  scrollable?: boolean;  // wrap children in ScrollView? default true
}

interface BottomSheetContextValue {
  openSheet: (opts: SheetOptions) => void;
  closeSheet: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function useBottomSheet() {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) throw new Error("useBottomSheet must be used inside BottomSheetProvider");
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function BottomSheetProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<SheetOptions | null>(null);
  const [visible, setVisible] = useState(false);

  // Shared values live outside React state so animations run on the UI thread
  const translateY = useSharedValue(SCREEN_H);   // starts off-screen below
  const overlayOpacity = useSharedValue(0);

  // ── Open ────────────────────────────────────────────────────────────────────
  const openSheet = useCallback((opts: SheetOptions) => {
    setSheet(opts);
    setVisible(true);
    // Spring in from below
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    overlayOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  // ── Dismiss (internal) ───────────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    translateY.value = withTiming(SCREEN_H, { duration: 220 });
    // Hide the React view only after the fade finishes (runOnJS bridges UI → JS)
    overlayOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) runOnJS(setVisible)(false);
    });
  }, []);

  const closeSheet = useCallback(() => dismiss(), [dismiss]);

  // ── Pan gesture ─────────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow dragging downward
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const shouldDismiss =
        e.translationY > SNAP_THRESHOLD || e.velocityY > 800;
      if (shouldDismiss) {
        runOnJS(dismiss)();
      } else {
        // Snap back
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  // ── Animated styles ──────────────────────────────────────────────────────────
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // ── Theme colours ────────────────────────────────────────────────────────────
  const insets = useSafeAreaInsets();
  const isDark = sheet?.isDark ?? false;
  const sheetBg    = isDark ? "#1e1b4b" : "#ffffff";
  const handleColor = isDark ? "#3d3a7a" : "#d1d5db";

  return (
    <BottomSheetContext.Provider value={{ openSheet, closeSheet }}>
      {children}

      {visible && sheet && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>

          {/* ── Backdrop tap-to-dismiss ── */}
          <TouchableWithoutFeedback onPress={closeSheet}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          {/* ── Sheet ── */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.sheet,
                { backgroundColor: sheetBg, paddingBottom: insets.bottom + 12 },
                sheetStyle,
              ]}
            >
              {/* Drag handle */}
              <View style={styles.handleBar}>
                <View style={[styles.handle, { backgroundColor: handleColor }]} />
              </View>

              {/* Content — scrollable by default, capped at 88 % of screen height */}
              {sheet.scrollable !== false ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  style={{ maxHeight: SCREEN_H * 0.88 }}
                  contentContainerStyle={{ flexGrow: 1 }}
                >
                  {sheet.children}
                </ScrollView>
              ) : (
                sheet.children
              )}
            </Animated.View>
          </GestureDetector>

        </Animated.View>
      )}
    </BottomSheetContext.Provider>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.50)",
    zIndex: 9999,
    elevation: 9999,  // Android — must be very high to appear above tabs
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 24,
  },
  handleBar: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 44, height: 4, borderRadius: 2 },
});
```

---

## Root Layout Wiring — `app/_layout.tsx`

Three things **must** appear in this order around the app tree:

1. `GestureHandlerRootView` — must be the outermost component (gesture handler requirement).
2. `SafeAreaProvider` — required by `useSafeAreaInsets()` inside the provider.
3. `BottomSheetProvider` — wraps all screen content so any screen can call `openSheet`.

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetProvider } from "@/context/BottomSheetContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* other providers (AppProvider, ThemeProvider, etc.) */}
        <BottomSheetProvider>
          {/* Stack / Tabs navigator goes here */}
          <Stack screenOptions={{ headerShown: false }} />
        </BottomSheetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

> **Android gotcha**: `GestureHandlerRootView` must literally be the top-level component.
> Wrapping it inside another `View` or provider breaks gesture recognition on Android.

---

## Usage in a Screen

### 1 — Import the hook

```tsx
import { useBottomSheet } from "@/context/BottomSheetContext";
```

### 2 — Destructure `openSheet` / `closeSheet`

```tsx
const { openSheet, closeSheet } = useBottomSheet();
```

### 3 — Pass children to `openSheet`

```tsx
openSheet({
  isDark,          // boolean — matches your app's current theme
  children: (
    <MyFormComponent onClose={closeSheet} isDark={isDark} />
  ),
});
```

`closeSheet()` animates the sheet away. Pass it down as a prop to the form so the
form can close itself after saving.

---

## Complete Real-World Example

Below is a simplified version of how a "Add Category" form sheet is opened from
the Settings screen in FinTrack.

### The form component

```tsx
// Receives onClose and isDark as props.
// It knows nothing about the sheet — it's a plain View.

function AddCategoryForm({
  onClose,
  isDark,
}: {
  onClose: () => void;
  isDark: boolean;
}) {
  const [name, setName] = useState("");

  const cardBg    = isDark ? "#1e1b4b" : "#ffffff";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";

  const handleSave = () => {
    if (!name.trim()) return;
    // ... persist the category ...
    onClose(); // closes the sheet
  };

  return (
    <View style={{ padding: 20, backgroundColor: cardBg, borderRadius: 22 }}>
      <Text style={{ color: textColor, fontSize: 18, marginBottom: 12 }}>
        Add Category
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Dining Out"
        placeholderTextColor="#94a3b8"
        style={{
          borderWidth: 1,
          borderColor: "#2d2b5e",
          borderRadius: 14,
          padding: 12,
          color: textColor,
          marginBottom: 16,
        }}
      />
      <TouchableOpacity
        onPress={handleSave}
        style={{ backgroundColor: "#34d399", borderRadius: 14, padding: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#0f172a", fontWeight: "600" }}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### The screen that opens the sheet

```tsx
export default function SettingsScreen() {
  const { openSheet, closeSheet } = useBottomSheet();
  const isDark = true; // from your theme context

  const openAddCategory = () => {
    openSheet({
      isDark,
      children: <AddCategoryForm onClose={closeSheet} isDark={isDark} />,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={openAddCategory}>
        <Text>+ Add Category</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## `SheetOptions` Reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `React.ReactNode` | — | **Required.** The content rendered inside the sheet. |
| `isDark` | `boolean` | `false` | Controls sheet background (`#1e1b4b` dark / `#ffffff` light) and handle colour. |
| `scrollable` | `boolean` | `true` | Wraps children in a `ScrollView` capped at 88 % of screen height. Set `false` for non-scrolling content. |

---

## Animation Details

| Action | API | Config |
|---|---|---|
| Open (slide up) | `withSpring` | `damping: 20, stiffness: 200` |
| Open (fade backdrop in) | `withTiming` | `duration: 200 ms` |
| Dismiss (slide down) | `withTiming` | `duration: 220 ms` |
| Dismiss (fade backdrop out) | `withTiming` | `duration: 180 ms` |
| Snap-back (pan released early) | `withSpring` | same as open |

### Why `runOnJS` for `setVisible`

Reanimated callbacks run on the UI thread. React state setters (`setVisible`) must run
on the JS thread. `runOnJS(setVisible)(false)` safely bridges between the two — it is
called only after the fade animation completes so the React tree unmounts cleanly.

```tsx
overlayOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
  if (finished) runOnJS(setVisible)(false);
  //            ^^^^^^^^^^^^^^^^^^^^^^^^^^ UI thread → JS thread
});
```

---

## Gesture Dismiss Logic

```
User drags down
│
├── translationY > 80px  →  dismiss()
├── velocityY    > 800   →  dismiss()  (fast flick, even if < 80px)
└── neither              →  snap back to translateY = 0
```

```tsx
const panGesture = Gesture.Pan()
  .onUpdate((e) => {
    if (e.translationY > 0) translateY.value = e.translationY; // drag down only
  })
  .onEnd((e) => {
    if (e.translationY > SNAP_THRESHOLD || e.velocityY > 800) {
      runOnJS(dismiss)();
    } else {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    }
  });
```

---

## Common Pitfalls

### 1. Backdrop tap conflicts with sheet drag

The backdrop is a `TouchableWithoutFeedback` that fills `absoluteFill`. The sheet sits
below it in the tree (rendered after), so it receives touches first — no conflict.

### 2. Android `elevation` must be very high

The overlay needs `elevation: 9999` on Android to appear above the bottom tab bar.
Without this the sheet appears behind the navigation bar.

### 3. Keyboard pushes content up unexpectedly

The `ScrollView` inside the sheet uses `keyboardShouldPersistTaps="handled"` to allow
pressing buttons inside the sheet while the keyboard is open. Pair this with
`KeyboardAvoidingView` inside the form component if you need the input to scroll into
view.

### 4. `GestureHandlerRootView` placement

Must be the outermost component in the tree — before `SafeAreaProvider`, before any
navigation container. Moving it anywhere else silently breaks swipe gestures on Android.

### 5. Sheet content re-renders

`openSheet` stores `children` in React state. Passing inline JSX like
`<Form onClose={closeSheet} />` is fine — the sheet re-renders only when `openSheet`
is called again.

---

## Extending the Sheet

### Fixed-height (non-scrollable) sheet

```tsx
openSheet({
  isDark,
  scrollable: false,   // children render directly without ScrollView wrapper
  children: <ConfirmDialog onClose={closeSheet} />,
});
```

### Opening a different sheet from inside a sheet

Just call `openSheet` again — it replaces the existing `sheet` state and re-runs
the spring animation. If you want a back-stack you'd need to add that yourself
(e.g., a stack in context state).

### Listening to dismiss from outside

Pass a callback through the form props:

```tsx
openSheet({
  isDark,
  children: (
    <MyForm
      onClose={closeSheet}
      onSaved={() => {
        closeSheet();
        refetchData();
      }}
    />
  ),
});
```
