/**
 * Backfill the PII-free `bookedSlots` collection from existing `bookings`.
 *
 * WHY THIS EXISTS
 * ---------------
 * The booking-data fix moved the public calendar's availability source from
 * `bookings` (which holds client PII) to a new `bookedSlots` collection that
 * only carries date + time. Any booking that ALREADY exists in Firestore has
 * no matching `bookedSlots` doc, so until this runs, every already-agreed shoot
 * still shows as bookable to the public and can be double-booked.
 *
 * This script mirrors the same logic the admin panel uses on status change:
 * a slot is "taken" for any status other than `pending`.
 *
 * WHAT IT COPIES:  date, time, status only.
 * WHAT IT NEVER COPIES: clientName, clientEmail, clientPhone, vision, company.
 *
 * USAGE
 *   npx firebase-tools login
 *   node scripts/backfill-booked-slots.mjs
 *   node scripts/backfill-booked-slots.mjs --dry-run
 *
 * Requires: firebase-admin (installed on demand via npx -y).
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'home-75c8e';

// Must match the `bookedSlots` allow-list in firestore.rules.
// Keep in sync if that rule's hasOnly() list ever changes.
const SLOT_FIELDS = ['date', 'time', 'status', 'updatedAt'];

const DRY_RUN = process.argv.includes('--dry-run');

// A slot is committed for every status except `pending`/empty. Mirrors
// PENDING_STATUSES in AdminPanel.handleStatusChange.
const isCommitted = (status) =>
  Boolean(status) && !['pending', ''].includes(String(status).toLowerCase());

// Same normalisation the admin panel uses, so ids match and re-runs are idempotent.
const slotIdFor = (date, time) => `${date}_${time}`.replace(/[^\w]+/g, '_');

async function main() {
  const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore(app);

  console.log(`Project: ${PROJECT_ID}`);
  console.log(DRY_RUN ? 'MODE: DRY RUN (no writes)' : 'MODE: LIVE — will write to Firestore\n');

  const snap = await db.collection('bookings').get();
  console.log(`Found ${snap.size} existing booking(s).\n`);

  const existingSlots = await db.collection('bookedSlots').get();
  const alreadyThere = new Set(existingSlots.docs.map((d) => d.id));
  console.log(`bookedSlots currently holds ${existingSlots.size} doc(s).\n`);

  let mirrored = 0;
  let skippedPending = 0;
  let skippedExisting = 0;
  let skippedNoDate = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const { date, time, status } = data;

    if (!isCommitted(status)) {
      skippedPending++;
      console.log(`  SKIP (pending)  ${doc.id}  ${date || '?'} ${time || ''}`);
      continue;
    }
    if (!date || !time) {
      skippedNoDate++;
      console.log(`  SKIP (no date)  ${doc.id}  status=${status} — needs a date/time before it can block a slot`);
      continue;
    }

    const slotId = slotIdFor(date, time);
    if (alreadyThere.has(slotId)) {
      skippedExisting++;
      console.log(`  SKIP (exists)   ${slotId}  already mirrored`);
      continue;
    }

    // PII-free payload ONLY. Never spread `data` here.
    const payload = {
      date,
      time,
      status: String(status),
      updatedAt: new Date().toISOString(),
    };

    if (DRY_RUN) {
      console.log(`  WOULD WRITE     ${slotId}  status=${status}`);
    } else {
      await db.collection('bookedSlots').doc(slotId).set(payload, { merge: true });
      console.log(`  WROTE           ${slotId}  status=${status}`);
    }
    mirrored++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`${DRY_RUN ? 'Would mirror' : 'Mirrored'}: ${mirrored}`);
  console.log(`Skipped (pending):    ${skippedPending}`);
  console.log(`Skipped (exists):     ${skippedExisting}`);
  console.log(`Skipped (no date):    ${skippedNoDate}`);

  if (skippedNoDate > 0) {
    console.log(
      `\nNOTE: ${skippedNoDate} committed booking(s) have no date/time, so they cannot block a calendar slot. Fix those in the admin panel.`,
    );
  }
  if (DRY_RUN) {
    console.log('\nRe-run without --dry-run to apply.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nFAILED:', err.message);
    console.error('\nIf this is an auth error, run: npx firebase-tools login');
    process.exit(1);
  });
