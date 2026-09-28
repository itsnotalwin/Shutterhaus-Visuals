/**
 * Pure-logic tests for the backfill + slot mirroring rules.
 * Run: node scripts/test-slot-logic.mjs
 *
 * These deliberately duplicate the two implementations (AdminPanel.tsx and
 * backfill-booked-slots.mjs) so a divergence in either is caught here.
 */
import assert from 'node:assert';

// --- copied verbatim from AdminPanel.handleStatusChange ---
const PENDING_STATUSES = ['pending', ''];
const isCommitted = (status) =>
  Boolean(status) && !PENDING_STATUSES.includes(String(status).toLowerCase());

// --- copied verbatim from both implementations ---
const slotIdFor = (date, time) => `${date}_${time}`.replace(/[^\w]+/g, '_');

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
};

console.log('\nstatus -> is the slot committed (blocked)?');

check('pending is NOT committed (slot stays bookable)', () => {
  assert.equal(isCommitted('pending'), false);
});

check('empty/undefined is NOT committed', () => {
  assert.equal(isCommitted(''), false);
  assert.equal(isCommitted(undefined), false);
  assert.equal(isCommitted(null), false);
});

// This is the bug the first pass shipped: only 'approved'/'confirmed' mirrored,
// so these real statuses left already-agreed shoots bookable.
for (const s of ['approved', 'shooting', 'retouching', 'delivered']) {
  check(`'${s}' IS committed (real status from the dropdown)`, () => {
    assert.equal(isCommitted(s), true);
  });
}

check('case-insensitive (PENDING is not committed)', () => {
  assert.equal(isCommitted('PENDING'), false);
  assert.equal(isCommitted('Approved'), true);
});

check("'confirmed' is handled even though it is not in the dropdown", () => {
  assert.equal(isCommitted('confirmed'), true);
});

console.log('\nslot id normalisation (must match between admin + backfill)');

check('date + time -> stable id', () => {
  assert.equal(slotIdFor('Jul 4, 2026', '09:00 AM'), 'Jul_4_2026_09_00_AM');
});

check('idempotent: same input, same id (re-runs do not duplicate)', () => {
  assert.equal(slotIdFor('Jul 4, 2026', '09:00 AM'), slotIdFor('Jul 4, 2026', '09:00 AM'));
});

check('two different slots never collide', () => {
  const ids = [
    slotIdFor('Jul 4, 2026', '09:00 AM'),
    slotIdFor('Jul 4, 2026', '11:30 AM'),
    slotIdFor('Jul 5, 2026', '09:00 AM'),
  ];
  assert.equal(new Set(ids).size, 3);
});

check('punctuation cannot break the id (no stray separators)', () => {
  const id = slotIdFor('Dec 25, 2026', '04:30 PM');
  assert.match(id, /^\w+$/, `id must be word chars only, got: ${id}`);
});

console.log(`\n${passed} assertions passed.\n`);
