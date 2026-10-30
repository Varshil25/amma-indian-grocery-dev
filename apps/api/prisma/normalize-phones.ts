/**
 * Converts phone numbers saved before validation existed ("(610) 555-0123", "610.555.0123")
 * to the standard +1XXXXXXXXXX form, so duplicate checks and admin phone search work for them.
 * Numbers that aren't valid US numbers, or that another account already uses, are listed
 * and left unchanged.
 *
 *   npm run db:normalize-phones            # dry run — shows what would change
 *   npm run db:normalize-phones -- --apply # make the changes
 */
import prisma from "../src/config/database.js";
import { normalizeUSPhone } from "../src/utils/phone.js";

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(apply ? "Normalizing phone numbers…" : "Dry run — nothing will change. Re-run with --apply to save.");

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, email: true, phone: true },
    orderBy: { createdAt: "asc" }, // the earliest account keeps a shared number
  });
  const taken = new Set(users.map((u) => u.phone).filter((p): p is string => !!p && /^\+1\d{10}$/.test(p)));
  let changed = 0;

  for (const u of users) {
    const current = u.phone!;
    if (/^\+1\d{10}$/.test(current)) continue;
    const normalized = normalizeUSPhone(current);
    if (!normalized) {
      console.log(`  invalid  ${u.email}: "${current}" — left as is`);
      continue;
    }
    if (taken.has(normalized)) {
      console.log(`  duplicate ${u.email}: "${current}" — another account already uses ${normalized}; left as is`);
      continue;
    }
    taken.add(normalized);
    console.log(`  update   ${u.email}: "${current}" → ${normalized}`);
    if (apply) await prisma.user.update({ where: { id: u.id }, data: { phone: normalized } });
    changed++;
  }
  console.log(changed ? `${changed} number(s) ${apply ? "updated" : "to update"}.` : "Nothing to update.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
