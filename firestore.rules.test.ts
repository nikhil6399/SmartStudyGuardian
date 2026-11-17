/**
 * Dirty Dozen Security Rule Verification Spec for AI Study Guardian
 * Validates the security boundaries enforced in firestore.rules against
 * the 12 adversarial payloads documented in security_spec.md.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  { id: 1, name: 'Unauthenticated profile write', path: '/users/u1', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Cross-user profile get', path: '/users/victim_uid', operation: 'get', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Identity spoofing uid mismatch', path: '/users/attacker_uid', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow field role injection on create', path: '/users/u1', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Shadow field injection on update', path: '/users/u1', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Unverified email write blocked', path: '/users/u1', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Client timestamp spoofing', path: '/users/u1', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Immutable createdAt mutation', path: '/users/u1', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Document ID poisoning', path: '/users/u1/studyState/invalid.id$', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Oversized displayName string exhaustion', path: '/users/u1', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Unbounded or non-string completedChapterIds', path: '/users/u1/studyState/current', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Orphaned studyState write & cross-user list', path: '/users/u1/studyState/current', operation: 'list', expected: 'PERMISSION_DENIED' },
];
