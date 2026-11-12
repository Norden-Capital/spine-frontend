// Server component: profile card + stat tiles (Settings hub and My account).
// Every tile shows real data only; a tile whose data did not load is left out.
import { IconClock, IconFaceId, IconLogin } from "@/components/spine-ui";
import { displayName, type MyAccount } from "@/lib/auth-types";
import { roleLabel } from "@/lib/roles";
import type { DateSettings } from "@/lib/prefs";
import { ProfileHero, StatTiles, type StatTile } from "@/components/spine-ui";
import { seedOf } from "@/lib/avatar";
import { getPasskeys, getSignInsThisMonth, lastLoginParts, monthYear } from "./settings-data";
import { ProfileAvatarButton } from "./avatar-picker";

export const STATUS: Record<string, string> = { ACTIVE: "Active", INVITED: "Invited", DISABLED: "Disabled" };

export async function SettingsProfile({ me, dates }: { me: MyAccount; dates: DateSettings }) {
  const [passkeys, monthSignIns] = await Promise.all([getPasskeys(), getSignInsThisMonth(dates.zone)]);

  const tiles: StatTile[] = [];
  if (monthSignIns !== null) {
    tiles.push({ icon: <IconLogin />, tone: "violet", value: String(monthSignIns), label: "Sign-ins this month" });
  }
  // lastLoginAt is this session's login (about "now"), so show the one before it.
  const lastLogin = me.previousLoginAt !== undefined ? me.previousLoginAt : me.lastLoginAt;
  if (lastLogin) {
    const last = lastLoginParts(lastLogin, dates);
    tiles.push({ icon: <IconClock />, tone: "sun", value: last.day, label: `Last login, ${last.time}` });
  } else {
    tiles.push({ icon: <IconClock />, tone: "sun", value: "First time", label: "Last login" });
  }
  if (passkeys !== null) {
    tiles.push({ icon: <IconFaceId />, tone: "ink", value: String(passkeys.length), label: "Face ID devices" });
  }

  return (
    <>
      {/* The kit card has no picture slot: our face button sits over its initials circle. */}
      <div className="relative">
        <ProfileHero
          name={displayName(me)}
          email={me.email}
          role={roleLabel(me.role)}
          status={STATUS[me.status] ?? me.status}
          since={`Member since ${monthYear(me.createdAt, dates.zone)}`}
        />
        <ProfileAvatarButton seed={seedOf(me)} isDefault={me.avatarIsDefault ?? !me.avatarSeed} name={displayName(me)} />
      </div>
      <StatTiles items={tiles} />
    </>
  );
}
