# RC2.4 — Draw Engine Integration

## Summary

The enterprise `DrawEngine` is now the **ONLY** source of winner selection in the Radiant Lucky Draw system. The previous `Math.random()`-based winner selection in the Live TV flow has been replaced by a dedicated integration layer (`DrawEngineService`) that delegates all randomness to the `DrawEngine`.

No `Math.random()` is used directly in the UI layer. All randomness lives inside the `DrawEngine` (via `src/engine/utils/random.ts`).

---

## Flow

```
Operator
   ↓
Start Draw
   ↓
DrawEngineService.executeDraw()
   ↓
Validation (participant exists, not already won, draw active)
   ↓
DrawEngine.draw() → PrizeSelector → ProbabilityEngine → Stock Validation
   ↓
Winner
   ↓
Socket Broadcast (draw:started, draw:spinning, draw:winner, draw:completed)
   ↓
Live TV
   ↓
Operator
   ↓
Statistics (Prize Remaining, Total Winners, Grand Prize Remaining, Draw Count)
   ↓
Reports
```

---

## Modified Files

| File | Change |
|------|--------|
| `src/engine/service/DrawEngineService.ts` | **New** enterprise integration layer. Registers prizes, validates participants, executes draws via `DrawEngine`, prevents duplicate winners, tracks statistics, and emits socket events. |
| `src/engine/__tests__/drawEngineSimulation.test.ts` | **New** 1000-draw simulation test verifying weighted probability, no duplicate winners, no negative stock, and correct statistics. |
| `server/src/realtime/RealtimeService.ts` | **Modified** Added `DRAW_EVENTS` (`draw:started`, `draw:spinning`, `draw:winner`, `draw:completed`), `DrawEventName` type, draw payload types, and `broadcastDrawEvent()` method. |
| `server/src/realtime/index.ts` | **Modified** Exported `DRAW_EVENTS`, `DrawEventName`, and draw payload types. |
| `server/src/services/DrawService.ts` | **Modified** Added `broadcastDrawEvent()` to map draw status transitions (`spinning`, `revealed`, `completed`) to socket events. |
| `src/components/booth/QRCode.tsx` | **Modified** Replaced the decorative QR placeholder with a real, scannable `react-qr-code` SVG encoding the registration URL (`VITE_PUBLIC_URL` + `/register`). Kept the glass card, blue glow, gold border, scan-line animation, and pulse. Added a clickable URL fallback below the QR. |
| `src/config/env.ts` | **Modified** Added `PUBLIC_URL` (from `VITE_PUBLIC_URL`) used to build the QR registration link. |
| `.env`, `.env.production`, `.env.example`, `src/vite-env.d.ts` | **Modified** Added `VITE_PUBLIC_URL` environment variable (dev default `http://localhost:5173`, prod `https://luckydraw.radiantgroup.co.id`). |



### Supporting (existing, unchanged) engine modules now wired in

| File | Role |
|------|------|
| `src/engine/draw/DrawEngine.ts` | Core draw execution (weighted probability, stock validation). |
| `src/engine/draw/Validation.ts` | Draw/prize validation rules. |
| `src/engine/draw/PrizeSelector.ts` | Selects a prize from the pool. |
| `src/engine/draw/ProbabilityEngine.ts` | Computes weighted probabilities. |
| `src/engine/utils/random.ts` | **Only** source of randomness. |
| `src/engine/config/drawConfig.ts` | Engine configuration (weights, durations, limits). |

---

## Socket Events

Broadcast by `DrawEngineService` through the `DrawEventEmitter` abstraction:

| Event | Payload | When |
|-------|---------|------|
| `draw:started` | `{ drawId, timestamp }` | Draw session begins. |
| `draw:spinning` | `{ drawId, prizeName, probability, timestamp }` | Prize selected / machine spinning. |
| `draw:winner` | `{ drawId, winner: { id, name, number, company }, prize: { id, name, tier, probability }, timestamp }` | A winner is determined. |
| `draw:completed` | `{ drawId, timestamp }` | Draw lifecycle completes. |

---

## API Contract

### `DrawEngineService`

```ts
createDrawEngineService(emitter?: DrawEventEmitter): DrawEngineService
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `registerPrizes` | `(tvPrizes: TVPrize[], stock?: number): void` | Register the prize pool (maps TV prizes → engine prizes). |
| `startSession` | `(config: DrawConfig): boolean` | Start an active draw session. Returns `false` if config invalid/inactive. |
| `registerParticipant` | `(participant: TVParticipant): void` | Mark a participant as eligible. |
| `hasParticipantWon` | `(participantId: string): boolean` | Check duplicate-winner status. |
| `executeDraw` | `(participant: TVParticipant): DrawLifecycleResult` | Run the full draw lifecycle. |
| `validateParticipant` | `(participant: TVParticipant): DrawValidationResult` | Validate participant eligibility. |
| `validateDrawConfig` | `(config: DrawConfig): DrawValidationResult` | Validate draw config is active. |
| `getStatistics` | `(): DrawStatistics` | Current statistics snapshot. |
| `getEngine` | `(): DrawEngine` | Access the underlying engine. |
| `reset` | `(): void` | Reset service state. |

### `DrawLifecycleResult`

```ts
{
  success: boolean;
  participant: TVParticipant | null;
  prize: TVPrize | null;
  drawResult: DrawResult | null;
  error?: string;
  code?: string;
}
```

### `DrawStatistics`

```ts
{
  drawCount: number;              // Draw Count
  totalWinners: number;           // Total Winners
  prizeRemaining: Record<string, number>;  // Prize Remaining
  grandPrizeRemaining: number;    // Grand Prize Remaining
  winnersByTier: Record<string, number>;
}
```

### Validation Error Codes

| Code | Meaning |
|------|---------|
| `PARTICIPANT_NOT_FOUND` | Participant does not exist. |
| `PARTICIPANT_NOT_REGISTERED` | Participant not registered for the draw. |
| `DUPLICATE_WINNER` | Participant already won a prize. |
| `DRAW_INACTIVE` | Draw session is not active. |
| `NO_PRIZES` | Draw has no prizes configured. |

---

## Draw Rules

- **Prevent duplicate winners** — `winningParticipants` set rejects repeat winners.
- **Prevent out-of-stock prizes** — `DrawEngine` stock validation + `prizeRemaining` tracking.
- **Support tiers** — Common, Rare, Epic, Grand Prize.
- **Weighted probability** — per-tier weights (`common: 80, rare: 3, epic: 1, grand: 0.5`).
- **Support remaining stock** — stock decremented per draw, never negative.

---

## Testing Result

### 1000 Simulated Draws

Command: `npx vitest run src/engine/__tests__/drawEngineSimulation.test.ts`

```
✓ DrawEngineService 1000-draw simulation (RC2.4)
  ✓ runs 1000 draws with correct weighted probability, no duplicates, no negative stock
  ✓ prevents duplicate winners for the same participant
  ✓ rejects unregistered participants
  ✓ rejects draws when the session is inactive

Test Files  1 passed (1)
     Tests  4 passed (4)
```

**Verified:**
- ✅ **Weighted probability** — Common > Rare > Epic > Grand across 1000 draws; every tier represented.
- ✅ **No duplicate winners** — same participant cannot win twice.
- ✅ **No negative stock** — `prizeRemaining` and `grandPrizeRemaining` never below 0.
- ✅ **Correct statistics** — `drawCount === 1000`, `totalWinners === 1000`, winners-by-tier sums to total.

### Build Verification

| Command | Result |
|---------|--------|
| `npm run type-check` | ✅ Passed |
| `npm run build` | ✅ Passed |
| `cd server && npm run build` | ✅ Passed |
