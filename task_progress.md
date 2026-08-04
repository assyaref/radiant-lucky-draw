# GO LIVE SPRINT - Task Progress
# DEADLINE: 6 AUGUST 2026

## Priority Order

- [ ] **1. Replace all InMemoryRepository implementations with PostgreSQL repositories**
  - [ ] Create Prisma-backed BaseRepository
  - [ ] Rewrite UserRepository with Prisma
  - [ ] Rewrite SessionRepository with Prisma
  - [ ] Rewrite AuditLogRepository with Prisma
  - [ ] Rewrite ParticipantRepository with Prisma
  - [ ] Rewrite PrizeRepository with Prisma
  - [ ] Rewrite DrawRepository with Prisma
  - [ ] Rewrite QueueRepository with Prisma
  - [ ] Rewrite SettingsRepository with Prisma
  - [ ] Update repositories/index.ts barrel export

- [ ] **2. Remove all fallback JWT secrets and require environment variables**
  - [ ] Update server/src/config/env.ts to require JWT_SECRET and JWT_REFRESH_SECRET
  - [ ] Update server/.env with proper secrets
  - [ ] Update .env.example with required vars

- [ ] **3. Move all winner selection to the server-side DrawEngine**
  - [ ] Create server-side DrawEngine integration in DrawService
  - [ ] Remove client-supplied winnerId/winnerName from updateStatus
  - [ ] Add server-side winner selection logic

- [ ] **4. Prevent duplicate winners and negative prize stock**
  - [ ] Add duplicate winner check in DrawService
  - [ ] Add negative stock prevention in PrizeRepository
  - [ ] Add atomic stock decrement with Prisma transaction

- [ ] **5. Verify end-to-end flow: Registration → Queue → Draw → Winner → Report**
  - [ ] Verify registration creates participant + queue entry
  - [ ] Verify queue operations work with PostgreSQL
  - [ ] Verify draw lifecycle works with PostgreSQL
  - [ ] Verify winner creation works
  - [ ] Verify reports/analytics work

- [ ] **6. Ensure `npm run type-check`, `npm run build`, and server build all pass**
  - [ ] Run frontend type-check
  - [ ] Run frontend build
  - [ ] Run server build

- [ ] **7. Produce a short checklist of remaining critical issues only**
