# Security Specification — AI Study Guardian Firestore Rules

## 1. Data Invariants
1. Every document under `/users/{userId}` is strictly owned by `request.auth.uid == userId`, with `uid` matching `{userId}` and verified authentication (`request.auth.token.email_verified == true`) for writes.
2. Every document under `/users/{userId}/studyState/{docId}` requires the parent `/users/{userId}` document to exist and belong to `request.auth.uid` (Master Gate), and enforces `ownerId == request.auth.uid`.
3. `createdAt` and `uid` / `ownerId` are immutable after creation; `createdAt` and `updatedAt` must equal `request.time`.
4. No shadow/ghost keys are permitted (`keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update).
5. All strings enforce bounded `.size()` limits, IDs match `^[a-zA-Z0-9_\-]+$`, numbers enforce non-negative upper bounds, and `completedChapterIds` is bounded to `<= 200` entries with first-element type/size verification.
6. No blanket `isSignedIn()` reads or client-delegated `list` queries exist anywhere; `/test/connection` health check is explicitly scoped to allow read-only `get` without leaking user data.

## 2. "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: Read or write `/users/user_123` with `auth == null`.
2. **Cross-User Read**: Authenticated as `attacker_uid` reading `/users/victim_uid`.
3. **Cross-User Identity Spoofing**: Authenticated as `attacker_uid` creating `/users/attacker_uid` with `{ uid: "victim_uid" }`.
4. **Shadow Field Injection (Create)**: Creating `/users/u1` with extra `{ isAdmin: true, role: "admin" }`.
5. **Shadow Field Injection (Update)**: Updating `/users/u1` with `{ xpPoints: 9999999, role: "superadmin" }`.
6. **Unverified Email Write**: Authenticated with `email_verified: false` attempting `create` or `update`.
7. **Timestamp Forgery**: Sending client-supplied past/future timestamp instead of `serverTimestamp()` (`request.time`).
8. **Immortal Field Mutation**: Attempting to alter `createdAt` or `uid` / `ownerId` during an update.
9. **ID Poisoning**: Writing to `/users/u1/studyState/../../evil` or 500-character document ID.
10. **1MB String Exhaustion**: Writing a 2000-character `displayName` or `selectedExamTrack`.
11. **Unbounded Array / Wrong-Type Array**: Writing `completedChapterIds` with 250 elements or non-string first element `[123]`.
12. **Orphaned Subcollection Write & Blanket List Scrape**: Creating `/users/u1/studyState/current` without parent `/users/u1` existing, or executing a collection `list` query on `/users` as another user.
