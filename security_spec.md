# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Master Admin Authority**: Only the verified bootstrap admin (`ryanmuhammad992@gmail.com` with `email_verified == true`) or UIDs present in `/admins/{uid}` may grant/revoke admin roles, verify/reject `/schools/{schoolId}`, or toggle system maintenance in `/settings/maintenance`.
2. **No Self-Escalation**: Users creating or updating `/users/{userId}` can choose only `'student'` or `'teacher'` for `accountType`; they cannot create `/admins/{uid}` or change `/schools/{schoolId}.status` to `'verified'`.
3. **Class & Assignment Ownership**: A `/classes/{classId}` document is bound immutably to `teacherUid == request.auth.uid`. Creating `/assignments/{assignmentId}` or `/classMembers/{memberId}` requires `exists()` and relational matching against the parent `/classes/{classId}` document.
4. **PII Isolation**: `/users/{userId}` is readable only by its owner (`request.auth.uid == userId`) or an Admin. `/leaderboard/{userId}` and `/classes/{classId}` contain zero email addresses or private identifiers.
5. **Temporal & Volumetric Integrity**: All `createdAt` and `updatedAt` timestamps must equal `request.time`. Every string and list field enforces explicit `.size()` bounds.

## 2. "Dirty Dozen" Attack Payloads (Expected: `PERMISSION_DENIED`)
1. **Unverified Admin Email Spoof**: Token has `email: "ryanmuhammad992@gmail.com"` and `email_verified: false` attempting admin write to `/settings/maintenance`.
2. **Self-Admin Escalation**: Student writes `/admins/{ownUid}` directly.
3. **Shadow Field Injection on User Profile**: Payload to `/users/{uid}` includes extra key `isAdmin: true` or `verified: true`.
4. **Cross-User Profile Hijack**: Authenticated user A attempts `get` or `update` on `/users/{userB}`.
5. **Teacher Self-Verifying School**: Non-admin user creates `/schools/{id}` with `status: "verified"`.
6. **Student Hijacking Class Ownership**: Student updates `/classes/{id}` attempting to overwrite `teacherUid` to own UID.
7. **Orphaned Assignment Creation**: User creates `/assignments/{id}` referencing a non-existent `classId` or another teacher's `classId`.
8. **Orphaned Class Enrollment**: Student creates `/classMembers/{id}` referencing a non-existent `classId` or mismatched `teacherUid`.
9. **Client Timestamp Forgery**: Payload submits a backdated client timestamp instead of `serverTimestamp()` (`request.time`).
10. **ID Poisoning**: Single-document read/write uses invalid characters or >128 char document ID (`../../etc/passwd`).
11. **Array Exhaustion**: User writes 500 elements into `badges` array on `/users/{uid}` (exceeding `<= 8` bound).
12. **Blanket User Scraping**: Non-admin attempts `list` on `/users` collection.
