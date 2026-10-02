# Security Specification - Faculdade Maçônica

## 1. Data Invariants & Authorization Logic

1. **User Identity & Role-Based Access Control (RBAC)**:
   - Users cannot alter their own `role`, `degree`, or `status` fields.
   - Initial registration assigns `role: 'brother'`, `status: 'pending'`, unless the email matches the initial root administrator (`faculdademaconicauniversal@gmail.com`).
   - Only admins and instructors can access admin collections and modify degrees, modules, lessons, questions, and other users' records.
   - PII protection: A user may read their own profile, or an Admin/Instructor can read user profiles to manage authorizations.

2. **Degree-Based Access Control**:
   - Brothers can only view Lessons, Modules, and Questions for degrees they hold access to (e.g. `degree <= user.degree` if `allowPreviousDegrees == true`, or `degree == user.degree`).
   - Draft lessons are only viewable by admins and instructors.

3. **Evaluation & Quiz Invariant**:
   - Brothers can create quiz attempts only for authorized lessons and their own user ID (`userId == request.auth.uid`).
   - A brother cannot self-grade discursive questions or alter instructor feedback fields.

4. **Prancha de Trabalho (Submission) Invariant**:
   - A brother can only submit submissions under their own user ID.
   - A brother cannot modify the `grade`, `status: 'aprovada'`, or instructor feedback once submitted. Only instructors/admins can evaluate pranchas.

## 2. Dirty Dozen Malicious Payloads

1. **Self-Escalation Attack**: User payload setting `role: "admin"` during profile update.
2. **Degree Jump Attack**: User payload updating their degree from `1` to `33` directly.
3. **Status Bypass Attack**: Pending user updating `status` to `"approved"`.
4. **Impersonated Quiz Attempt**: Attempt created with `userId: "victim_brother_uid"`.
5. **Self-Awarded Quiz Grade**: Student attempt payload sending `isPassed: true` with fabricated discursive points.
6. **Malicious Essay Approval**: Brother updating their own submission status to `"aprovada"` and grade to `100`.
7. **Unauthorized Degree Lesson Write**: Brother attempting to create/update/delete lesson documents.
8. **Orphaned Quiz Attempt Injection**: Quiz attempt referencing a non-existent lesson ID.
9. **Junk ID Injection**: Setting 2000-character string document ID.
10. **Denial of Wallet String Bomb**: Submitting 5MB string in comments or title.
11. **Fake Certificate Generation**: Brother creating a degree certificate document for themselves.
12. **Audit Log Tampering**: Deleting or editing audit logs.
