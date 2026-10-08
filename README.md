# ? IronDesk — Gym Management App

> **The Digital Register for Indian Gyms** — A production-grade React Native application powered by Firebase Firestore, Zustand, and React Navigation.

---

## ?? Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (TypeScript) |
| Backend / DB | Firebase Firestore (with offline persistence) |
| Auth | Firebase Phone OTP (`@react-native-firebase/auth`) |
| State Management | Zustand |
| Navigation | React Navigation v6 (Native Stack + Bottom Tabs) |
| Animations | React Native Reanimated v3 |
| Gestures | React Native Gesture Handler |
| Local Storage | MMKV (`react-native-mmkv`) |
| List Rendering | FlashList (`@shopify/flash-list`) |
| Font | Bebas Neue (Athletic Display) + System fonts |
| Date Utils | `date-fns` |
| Safe Area | `react-native-safe-area-context` |
| Icons | `lucide-react-native` |

---

## ??? Project Structure

```
src/
+-- app/
¦   +-- App.tsx                      ? Root component, providers
¦   +-- navigation/
¦       +-- types.ts                 ? Navigation param types
¦       +-- RootNavigator.tsx        ? Stack Navigator (full app)
¦       +-- MainTabNavigator.tsx     ? Bottom Tab Navigator (main app)
¦
+-- screens/
¦   +-- splash/        SplashScreen.tsx          ? Boot routing logic
¦   +-- welcome/       WelcomeScreen.tsx          ? Onboarding intro
¦   +-- auth/          LoginScreen.tsx            ? Phone OTP login
¦   +-- setup/         GymSetupScreen.tsx         ? First-time gym registration
¦   +-- subscription/
¦   ¦   +-- ChoosePlanScreen.tsx                 ? Trial / paid plan selection
¦   ¦   +-- SubscriptionLockScreen.tsx           ? Expired subscription gate
¦   +-- home/          HomeScreen.tsx             ? Main dashboard tab
¦   +-- members/
¦   ¦   +-- MembersScreen.tsx                    ? Paginated members list
¦   ¦   +-- AddMemberScreen.tsx                  ? Add / Edit member form
¦   ¦   +-- MemberDetailScreen.tsx               ? Member profile + actions
¦   +-- payments/
¦   ¦   +-- PaymentsScreen.tsx                   ? Payments history list
¦   ¦   +-- CollectFeeScreen.tsx                 ? Fee collection / renewal
¦   +-- attendance/    AttendanceScreen.tsx       ? Daily check-in
¦   +-- notifications/ NotificationsScreen.tsx    ? Expiry reminder WA blasts
¦   +-- plans/         ManagePlansScreen.tsx      ? CRUD membership plans
¦   +-- dashboard/     DashboardScreen.tsx        ? Analytics overview
¦   +-- settings/
¦       +-- SettingsScreen.tsx                   ? Profile, logout, tools
¦       +-- WhatsAppTemplateScreen.tsx           ? Custom WA message editor
¦
+-- components/
¦   +-- AnimatedTabBar.tsx    ? Custom animated bottom navigation bar
¦   +-- Button.tsx            ? Reusable button (primary/outline/ghost)
¦   +-- Card.tsx              ? Reusable surface card wrapper
¦   +-- Chip.tsx              ? Filter chip / tag
¦   +-- ConfirmDialog.tsx     ? Modal confirmation dialog
¦   +-- EmptyState.tsx        ? Empty list / zero state UI
¦   +-- Input.tsx             ? Styled text input field
¦   +-- MemberCard.tsx        ? Memoized member list row
¦   +-- OTPInput.tsx          ? 6-digit OTP input boxes
¦   +-- Skeleton.tsx          ? Loading placeholder shimmer
¦   +-- StatCard.tsx          ? Animated stat counter card
¦
+-- services/
¦   +-- firebase.ts           ? Firebase app init (auth + firestore)
¦   +-- auth.ts               ? OTP send/confirm, sign out, get user
¦   +-- gym.ts                ? Gym CRUD, trial activation, UTR submit
¦   +-- members.ts            ? Member CRUD, paginated queries
¦   +-- payments.ts           ? Payment collection, paginated history
¦   +-- attendance.ts         ? Attendance toggle, real-time listener
¦   +-- plans.ts              ? Membership plan CRUD
¦   +-- stats.ts              ? Stats summary fetch + real-time listener
¦
+-- store/
¦   +-- useAuthStore.ts       ? Zustand: Firebase user + auth status
¦   +-- useGymStore.ts        ? Zustand: gym doc, plans, stats summary
¦
+-- hooks/
¦   +-- useAccessGuard.ts     ? Guards tab screens from expired plans
¦   +-- useDebounce.ts        ? Generic debounce hook
¦
+-- utils/
¦   +-- dates.ts              ? Date formatting + monthKey helpers
¦   +-- haptics.ts            ? Haptic feedback wrappers
¦   +-- memberStatus.ts       ? Status calculation + expiry countdown
¦   +-- money.ts              ? Currency formatting (Rs.)
¦   +-- storage.ts            ? MMKV wrapper (onboarding seen flag)
¦   +-- upi.ts                ? UPI URL generation + deep-link opener
¦   +-- validators.ts         ? Phone / form field validators
¦   +-- whatsapp.ts           ? WA message builder + Linking opener
¦
+-- theme/
¦   +-- colors.ts             ? Color palette tokens
¦   +-- typography.ts         ? Font families + text style scale
¦   +-- spacing.ts            ? Spacing scale (xs to xxl)
¦   +-- radius.ts             ? Border radius tokens
¦   +-- shadows.ts            ? Platform shadow utilities
¦   +-- index.ts              ? Re-exports all theme tokens
¦
+-- types/
¦   +-- models.ts             ? Core Firestore document interfaces
¦   +-- declarations.d.ts     ? Module declarations
¦
+-- config/
¦   +-- app.ts                ? App-wide constants (plans, pricing, templates)
¦
+-- assets/
    +-- fonts/
        +-- BebasNeue-Regular.ttf   ? Athletic display font (Android)
```

---

## ?? Firestore Data Model

Each gym owner gets their own isolated document tree under `gyms/{gymId}`:

```
gyms/
+-- {gymId}  (ownerUid = Firebase Auth UID)
    +-- GymDoc fields: gymName, ownerName, phone, city, upiId,
    ¦                  planStatus, trialEndsAt, planExpiry,
    ¦                  subscriptionPlan, utr, reminderTemplate,
    ¦                  createdAt, updatedAt
    ¦
    +-- members/{memberId}
    ¦     name, phone, planId, planName, planPrice,
    ¦     startDate, expiryDate, status, notes,
    ¦     lastPaymentAt, createdAt, updatedAt
    ¦
    +-- payments/{paymentId}
    ¦     memberId, memberName, amount, mode,
    ¦     status, planId, paidAt, monthKey, createdAt
    ¦
    +-- attendance/{dateKey}/entries/{memberId}
    ¦     memberId, memberName, present, checkedInAt
    ¦
    +-- plans/{planId}
    ¦     name, durationDays, price, isActive, createdAt
    ¦
    +-- stats/summary
          totalMembers, activeMembers, expiringCount, expiredCount,
          collected{ "2026-10": 38400 },
          pending{ "2026-10": 9600 },
          presentToday{ "2026-10-08": 37 }
```

> **Key design:** `stats/summary` is a **denormalized counter document** — all member/payment/attendance writes are **batched** alongside increments/decrements on this document for instant dashboard reads without full collection scans.

---

## ?? Data Flow Architecture

```
Firebase Firestore (gyms/{uid}/members, payments, attendance, plans, stats/summary)
         |
         |  services/ (async functions)
         |
    gym.ts  members.ts  payments.ts  attendance.ts  plans.ts  stats.ts  auth.ts
         |
         |
    Zustand Stores
    useAuthStore.ts  ? Firebase user, auth status
    useGymStore.ts   ? gym doc, plans[], statsSummary
         |
         |
    Screens
    (read from store, call services for mutations)
         |
         |
    Components
    AnimatedTabBar, MemberCard, StatCard, Button, Input, etc.
```

---

## ?? Navigation Flow

### Boot Sequence (SplashScreen)

```
App Start
    |
    v
SplashScreen --- (animation plays 600ms) ---> checkInitialRouting()
    |
    +-- hasSeenOnboarding() == false  --------> WelcomeScreen
    |
    +-- getCurrentUser() == null  -----------> LoginScreen
    |
    +-- getGymDocument() == null  -----------> GymSetupScreen
    |
    +-- gymDoc.planStatus == 'expired'  ------> SubscriptionLockScreen
    |
    +-- trial expired (trialEndsAt in past)  -> SubscriptionLockScreen
    |
    +-- trial not started (!trialEndsAt)  ----> ChoosePlanScreen
    |
    +-- valid trial / pending / active  ------> Main (HomeTab)
```

### Navigation Stack (RootNavigator)

```
RootNavigator (NativeStack)
  Splash              -- fade, 350ms
  Welcome             -- fade, 300ms
  Login               -- slide_from_right
  GymSetup            -- slide_from_right
  ChoosePlan          -- slide_from_bottom (modal)
  SubscriptionLock    -- fade, gesture disabled
  Main                -- fade, 250ms
    MainTabNavigator (Bottom Tabs)
      HomeTab        <- HomeScreen
      MembersTab     <- MembersScreen
      PaymentsTab    <- PaymentsScreen
      DashboardTab   <- DashboardScreen
      SettingsTab    <- SettingsScreen
  AddMember           -- slide_from_bottom (modal)
  MemberDetail        -- slide_from_right
  CollectFee          -- slide_from_bottom (modal)
  Notifications       -- slide_from_bottom (modal)
  ManagePlans         -- slide_from_right
  WhatsAppTemplateEditor -- slide_from_right
```

---

## ?? File-by-File Reference

### `src/app/App.tsx`
Root entry point. Wraps the entire application in:
1. `GestureHandlerRootView` — enables swipe gestures globally
2. `SafeAreaProvider` — injects device insets for all child screens
3. `RootErrorBoundary` — class component catches any unhandled render errors
4. `NavigationContainer` — React Navigation context with custom dark theme
5. `RootNavigator` — renders the actual screen stack

---

### `src/app/navigation/types.ts`
Navigation type definitions. Exports:
- `MainTabParamList` — 5 tab routes (HomeTab, MembersTab, PaymentsTab, DashboardTab, SettingsTab)
- `RootStackParamList` — all stack routes with their route params

---

### `src/app/navigation/RootNavigator.tsx`
Main navigation stack. Creates a `NativeStackNavigator` with global options: `slide_from_right` transition (280ms), gesture enabled, full-screen swipe. Per-screen animation overrides: fade for Splash/Welcome/Main, bottom-sheet modal for AddMember/CollectFee/Notifications/ChoosePlan.

---

### `src/app/navigation/MainTabNavigator.tsx`
Bottom tab navigator. Uses a custom `tabBar` render prop pointing to `AnimatedTabBar`. Five tabs map to the five main screens with `headerShown: false`.

---

### `src/screens/splash/SplashScreen.tsx`
Boot router. Plays a spring logo animation ? fade text ? calls `checkInitialRouting()` which reads:
1. MMKV flag (onboarding seen?)
2. Firebase Auth current user
3. Firestore gym document
4. Plan status checks

Navigates via `navigation.replace()` to the correct destination.

---

### `src/screens/welcome/WelcomeScreen.tsx`
Onboarding screen. Shows app branding + "Get Started" button. On press, sets MMKV `has_seen_onboarding` flag and navigates to `Login`.

---

### `src/screens/auth/LoginScreen.tsx`
Phone OTP authentication.
- Input: Indian phone number (validated via `validators.ts`)
- Step 1: Calls `sendPhoneOtp()` ? stores `ConfirmationResult` in `useAuthStore`
- Step 2: OTP entry via `OTPInput` ? calls `confirmOtpCode()` ? on success navigates to GymSetup or Main
- Resend timer: 60s countdown with proper `setInterval` cleanup on unmount (fixed: functional updater `prev => prev - 1`)

---

### `src/screens/setup/GymSetupScreen.tsx`
First-time gym registration. Multi-field form. On submit calls `createGymWithPlans()` — a single atomic Firestore batch that creates:
1. The `gyms/{uid}` document
2. Default membership plan documents
3. An empty `stats/summary` document

After success ? navigates to `ChoosePlan`.

---

### `src/screens/subscription/ChoosePlanScreen.tsx`
Subscription plan selection. Offers:
- Free 30-day Trial ? calls `activateFreeTrial()` (updates `trialEndsAt` + `planStatus: 'trial'`)
- Monthly (Rs.499) or Yearly/Founder (Rs.4,999) ? opens UPI deep-link, then calls `submitFounderSubscriptionUtr()` (sets `planStatus: 'pending_verification'`)

---

### `src/screens/subscription/SubscriptionLockScreen.tsx`
Paywall gate. Displayed when subscription is expired or trial has ended. Shows upgrade CTA. `gestureEnabled: false` prevents back navigation.

---

### `src/screens/home/HomeScreen.tsx`
Main home dashboard tab. Displays:
- Today's attendance count (from `statsSummary.presentToday`)
- Active / Expiring / Expired member quick stats (from `useGymStore`)
- Quick action buttons ? AddMember, CollectFee, Notifications
- Expiring soon section (calls `getExpiringMembers()`)

Uses `useSafeAreaInsets` for dynamic padding below floating tab bar.

---

### `src/screens/members/MembersScreen.tsx`
Paginated member list with filter chips: All / Active / Expiring / Expired. Calls `getMembersPaginated()` with cursor-based pagination (20 per page). Renders via `FlashList` with memoized `MemberCard` rows. FAB navigates to `AddMember`.

---

### `src/screens/members/AddMemberScreen.tsx`
Add or Edit member form. Route param `memberId?`:
- If `memberId` provided ? edit mode (pre-fills from Firestore)
- If no `memberId` ? add mode
- Validates phone uniqueness via `checkPhoneExists()`
- On add: calls `addMemberWithStats()` (batched member + optional payment + stats)
- On edit: calls `updateMember()`

---

### `src/screens/members/MemberDetailScreen.tsx`
Member profile screen. Route param `memberId: string`. Displays member info, plan, status badge, expiry countdown, full payment history (`getMemberPaymentHistory()`), and action buttons: Collect Fee, Edit, WhatsApp, Call, Delete.

---

### `src/screens/payments/PaymentsScreen.tsx`
Payment history with optional month filter (`monthKey`). Calls `getPaymentsPaginated()` with cursor pagination.

---

### `src/screens/payments/CollectFeeScreen.tsx`
Fee collection / membership renewal. Route params: `memberId?` or `member?`. Plan selector from `useGymStore.plans`. On submit calls `collectFeeWithStats()` (batched: payment doc + member update + stats increment). UPI mode opens UPI deep-link. Shows success screen after collection.

---

### `src/screens/attendance/AttendanceScreen.tsx`
Daily check-in register. Real-time listener via `subscribeToAttendance()`. Toggle check-in per member ? calls `toggleAttendanceWithStats()` (batched entry + stats counter). Supports date navigation.

---

### `src/screens/notifications/NotificationsScreen.tsx`
WhatsApp reminder blaster. Fetches members expiring in =7 days. Formats message using `formatWhatsAppMessage()` with gym's `reminderTemplate`. Opens WhatsApp via `openWhatsApp()`.

---

### `src/screens/plans/ManagePlansScreen.tsx`
Membership plan manager. Full CRUD: list from `useGymStore.plans`, add via `addGymPlan()`, edit via `updateGymPlan()`, delete via `deleteGymPlan()` (guarded: throws if any member is assigned).

---

### `src/screens/dashboard/DashboardScreen.tsx`
Analytics overview tab. Live stat cards from `statsSummary` via `subscribeToStatsSummary()`. Monthly revenue collected vs pending. Overdue members list via `getOverdueMembers()`.

---

### `src/screens/settings/SettingsScreen.tsx`
Settings and profile tab. Gym profile editing via `updateGymProfile()`. Navigate to Manage Plans, WhatsApp Template, Attendance. Logout via `useAuthStore.logout()` + `useGymStore.resetGym()`.

---

### `src/screens/settings/WhatsAppTemplateScreen.tsx`
WhatsApp message template editor. Edits `gym.reminderTemplate` with placeholders: `{name}`, `{gym}`, `{expiry}`, `{amount}`, `{upi_link}`. Saves via `updateGymProfile({ reminderTemplate })`.

---

## ?? Components

### `AnimatedTabBar.tsx`
Custom bottom tab bar using Reanimated. Each tab item scales icon with `withSpring` on focus, fades label with `withTiming`, triggers `haptics.light()` on press, and uses `useSafeAreaInsets()` to float above device gesture bar.

### `MemberCard.tsx`
Memoized (`React.memo`) member list row. Displays name, phone, plan badge, status chip with color coding, expiry countdown text, and WhatsApp/call quick action buttons.

### `StatCard.tsx`
Animated counter card. Smooth number animation from 0 to target on mount. Wrapped in `React.memo`. Interval cleared on unmount. Handles NaN/negative edge cases safely.

### `Button.tsx`
Variant-based button: `primary` (Electric Lime filled), `outline` (bordered), `ghost` (transparent). Supports loading state with ActivityIndicator, disabled state, and icon slots.

### `Input.tsx`
Styled text input with label, error message slot, left/right icon, and focus border animation.

### `OTPInput.tsx`
6-cell OTP input. Auto-focuses next cell on digit entry, auto-submits when all 6 digits are filled.

### `Card.tsx`
Dark surface container with border and optional shadow.

### `Chip.tsx`
Selectable filter tag. Active state uses Electric Lime border + background tint.

### `ConfirmDialog.tsx`
Modal dialog with title, message, confirm (danger) and cancel buttons. Used for destructive actions.

### `EmptyState.tsx`
Zero-state placeholder with title, subtitle, and optional CTA button.

### `Skeleton.tsx`
Animated shimmer placeholder for loading states via `withRepeat` + `withTiming`.

---

## ??? Services

### `firebase.ts`
Initializes Firebase and configures Firestore with offline persistence (`persistence: true`, `CACHE_SIZE_UNLIMITED`). Exports `auth`, `firestore`, and their type namespaces.

### `auth.ts`

| Function | Description |
|---|---|
| `sendPhoneOtp(phone)` | Normalizes Indian phone ? +91XXXXXXXXXX, calls signInWithPhoneNumber |
| `confirmOtpCode(confirmation, code)` | Verifies OTP code |
| `signOutUser()` | Firebase sign out |
| `getCurrentUser()` | Returns auth().currentUser synchronously |
| `subscribeToAuthState(cb)` | Real-time auth state listener, returns unsubscribe fn |

### `gym.ts`

| Function | Description |
|---|---|
| `getGymDocument(gymId)` | Fetch gym doc |
| `createGymWithPlans(gymId, input, plans)` | Atomic batch: gym doc + default plans + empty stats |
| `activateFreeTrial(gymId)` | Sets trialEndsAt = now + 30 days, planStatus = 'trial' |
| `submitFounderSubscriptionUtr(gymId, plan, utr)` | Sets planStatus = 'pending_verification', saves UTR |
| `updateGymProfile(gymId, data)` | Partial update of gym profile fields |

### `members.ts`

| Function | Description |
|---|---|
| `checkPhoneExists(gymId, phone, excludeId?)` | Duplicate phone guard |
| `addMemberWithStats(gymId, input)` | Batch: member doc + optional payment + stats increment |
| `getMemberById(gymId, memberId)` | Fetch single member |
| `updateMember(gymId, memberId, data)` | Partial member update |
| `deleteMemberWithStats(gymId, member)` | Batch: delete member + stats decrement |
| `getMembersPaginated(gymId, filter, cursor, size)` | Cursor-based paginated query with filter + fallback |
| `getExpiringMembers(gymId, limit)` | Top N members expiring in =7 days |
| `getOverdueMembers(gymId, limit)` | Top N expired members |

### `payments.ts`

| Function | Description |
|---|---|
| `collectFeeWithStats(gymId, input)` | Batch: payment doc + member renewal + stats update |
| `getPaymentsPaginated(gymId, monthKey?, cursor, size)` | Paginated payments, optionally by month |
| `getMemberPaymentHistory(gymId, memberId)` | All payments for a member |

### `attendance.ts`

| Function | Description |
|---|---|
| `toggleAttendanceWithStats(gymId, dateKey, memberId, name, present)` | Batch: set/delete entry + increment/decrement daily count |
| `getAttendanceForDate(gymId, dateKey)` | Fetch all entries for a date |
| `subscribeToAttendance(gymId, dateKey, onUpdate)` | Real-time listener, returns unsubscribe fn |

### `plans.ts`

| Function | Description |
|---|---|
| `getGymPlans(gymId)` | Fetch all plans ordered by createdAt |
| `addGymPlan(gymId, plan)` | Create new plan |
| `updateGymPlan(gymId, planId, data)` | Partial plan update |
| `deleteGymPlan(gymId, planId)` | Guarded delete (throws if members assigned) |

### `stats.ts`

| Function | Description |
|---|---|
| `getStatsSummary(gymId)` | One-time fetch of stats summary doc |
| `subscribeToStatsSummary(gymId, onUpdate)` | Real-time listener for live dashboard updates |

---

## ?? Global State (Zustand Stores)

### `useAuthStore.ts`
```ts
{
  user: FirebaseAuthTypes.User | null,
  confirmation: ConfirmationResult | null,
  status: 'initializing' | 'authenticated' | 'unauthenticated',
  setUser(user),
  setConfirmation(confirmation),
  setStatus(status),
  logout(),    // calls signOutUser() then resets state
}
```
Consumers: SplashScreen, LoginScreen, SettingsScreen, useAccessGuard

### `useGymStore.ts`
```ts
{
  gym: GymDoc | null,
  plans: MembershipPlan[],
  statsSummary: StatsSummary | null,
  isLoadingGym: boolean,
  setGym(gym),
  setPlans(plans),
  setStatsSummary(stats),
  loadGymData(gymId),   // parallel fetch: gym + plans + statsSummary
  resetGym(),
}
```
Consumers: All main screens and the useAccessGuard hook

---

## ?? Access Control

### `useAccessGuard.ts`
Called in all main tab screens. On every render, checks `useGymStore.gym.planStatus` and `trialEndsAt` / `planExpiry`. If the subscription is expired, **resets navigation** to `SubscriptionLock` screen, preventing back-navigation workarounds.

---

## ?? Theme System

### `colors.ts`
Curated dark palette tokens:
- Background layers: `background` (#0B0B0F) ? `surface` ? `elevated`
- Primary accent: Electric Lime `#C6FF00`
- Secondary accent: Hot Orange `#FF5A1F` (for expiring states)
- Status colors: `statusActive`, `statusExpiring`, `statusExpired`
- Special: `founderGold`, `whatsapp`

### `typography.ts`
Two font families:
- Heading / Display: `BebasNeue-Regular` (Android), `BebasNeue` (iOS) — for stat numbers, screen titles, brand text
- Body: System font with weight variants — Regular, Medium, SemiBold, Bold

Type scale: `hero` (48px) ? `h1` ? `h2` ? `h3` ? `h4` ? `subtitle` ? `bodyLarge` ? `body` ? `caption` ? `badge`

### `spacing.ts`
Spacing scale: xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, xxxl=32

### `radius.ts`
Border radius tokens: sm, md, lg, card, pill

### `shadows.ts`
Platform-specific shadow utilities (iOS shadow props + Android elevation)

---

## ??? Safe Area Implementation

All screens use `SafeAreaView` from `react-native-safe-area-context`:

| Screen type | Edges |
|---|---|
| Tab screens (Home, Members, Payments, Dashboard, Settings) | ['top', 'left', 'right'] — bottom handled by AnimatedTabBar |
| Stack / Modal screens | ['top', 'bottom', 'left', 'right'] |
| AnimatedTabBar | useSafeAreaInsets() ? bottom: Math.max(insets.bottom, 14) |
| List containers | Dynamic paddingBottom: 110 + insets.bottom |
| FAB buttons | Dynamic bottom: 92 + insets.bottom |

---

## ? Performance Optimizations

| Optimization | Where | How |
|---|---|---|
| List memoization | MemberCard | React.memo() prevents re-render on unchanged rows |
| Stat animation cleanup | StatCard | clearInterval() in useEffect cleanup |
| Login timer fix | LoginScreen | Functional updater prev => prev - 1 avoids interval thrashing |
| Cursor pagination | Members, Payments | startAfter() cursor — never re-fetches previous pages |
| Offline cache | Firestore | persistence: true with unlimited cache size |
| Batch writes | All mutations | Firestore batch() ensures atomic member + stats updates |
| Debounce | Search inputs | useDebounce hook (400ms) |

---

## ?? Config (`src/config/app.ts`)

Central constants file:
- `TRIAL_DAYS: 30` — free trial duration
- `SUBSCRIPTION.MONTHLY` / `SUBSCRIPTION.YEARLY` — pricing, duration, labels
- `DEFAULT_REMINDER_TEMPLATE` — WhatsApp message template with placeholders
- `DEFAULT_PLANS` — 3 default plans seeded on gym registration
- `PAGINATION_LIMIT: 20` — page size for members and payments queries
- `UPCOMING_EXPIRY_DAYS: 7` — threshold for "expiring" member status
- `DEVELOPER_UPI_ID` — UPI ID for receiving founder subscription payments

---

## ?? Utils

### `memberStatus.ts`

| Function | Logic |
|---|---|
| `calculateMemberStatus(expiryDate)` | diff < 0 ? expired, diff = 7 ? expiring, else ? active |
| `calculateNewExpiry(currentExpiry, days, isRenewal)` | Renewal: extends from current expiry if valid, else from today |
| `getExpiryCountdownText(expiryDate)` | "Expires in X days" / "Expires today" / "Expired X days ago" |

### `whatsapp.ts`

| Function | Description |
|---|---|
| `formatWhatsAppMessage(params)` | Replaces {name}, {gym}, {expiry}, {amount}, {upi_link} in template |
| `openWhatsApp(phone, text)` | Opens https://wa.me/91{phone}?text={encoded} |
| `makePhoneCall(phone)` | Opens tel: URL |
| `cleanIndianPhoneNumber(phone)` | Strips country code / leading zero |

### `upi.ts`

| Function | Description |
|---|---|
| `isValidUpiId(id)` | Validates user@bank format |
| `generateUpiUrl(params)` | Builds upi://pay?pa=...&pn=...&am=...&cu=INR |
| `openUpiPayment(url)` | Deep-links into Google Pay / PhonePe / Paytm / BHIM |

### `storage.ts`
MMKV wrapper with instance ID `irondesk-storage`. Key: `has_seen_onboarding` ? boolean

### `dates.ts`
Date formatting helpers and `monthKey` generator (e.g. "2026-10") for Firestore stats map keys.

### `validators.ts`
Phone number and form field validators returning `string | null` (error message or null if valid).

### `haptics.ts`
Wrapper around react-native-haptic-feedback with presets: `light`, `medium`, `heavy`. Graceful no-op on unsupported devices.

### `money.ts`
Indian Rupee formatter: `formatMoney(1000)` ? "Rs. 1,000"

---

## ?? Running the App

```bash
# Install dependencies
npm install

# Android (development)
npx react-native run-android

# iOS
npx react-native run-ios

# TypeScript check (zero errors expected)
npx tsc --noEmit

# Metro bundler
npx react-native start
```

### Font linking (Android)
`BebasNeue-Regular.ttf` is placed in:
```
android/app/src/main/assets/fonts/BebasNeue-Regular.ttf
```
No additional linking step needed for React Native 0.60+.

---

## ?? Key User Journeys

### 1. New Gym Owner
```
Install ? Splash ? Welcome ? Login (OTP) ? GymSetup ? ChoosePlan ? Main (HomeTab)
```

### 2. Add a Member
```
HomeTab ? FAB (+) ? AddMemberScreen ? fill form ? (optional: collect fee now) ? Members list updates
```

### 3. Collect Fee / Renew
```
MemberCard ? Collect Fee ? CollectFeeScreen ? select plan + amount + mode ? UPI deep-link ? success screen
```

### 4. Send WhatsApp Reminder
```
NotificationsScreen ? expiring member list ? tap WA icon ? WhatsApp opens with pre-filled message
```

### 5. Mark Attendance
```
SettingsTab ? Attendance ? toggle member check-in ? real-time counter updates
```

---

*Built with for Indian Gym Owners — IronDesk v1.0*
