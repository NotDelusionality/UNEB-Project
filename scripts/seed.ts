/**
 * Deterministic demo data (§13): fixed literals, no randomness, so every
 * demonstration is identical. Day offsets are relative to the run date so
 * the 30-day charts and "upcoming meetings" always have data.
 *
 * Run through `npm run db:reset` (or `npm run db:seed` on an empty database).
 */
import { count } from "drizzle-orm";
import { db } from "../src/db/client";
import {
  announcements,
  meetings,
  notifications,
  reportComments,
  reports,
  reportStatusHistory,
  users,
} from "../src/db/schema";
import {
  STATUS_META,
  type ReportCategory,
  type ReportStatus,
} from "../src/lib/constants";
import { caseNumber } from "../src/lib/format";
import { hashPassword } from "../src/lib/passwords";

const NOW = new Date();

/** A fixed moment `daysAgo` days before the run, at the given local time. */
function at(daysAgo: number, hour: number, minute = 0): Date {
  const date = new Date(NOW);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/** A fixed moment `daysAhead` days after the run. */
function inDays(daysAhead: number, hour: number, minute = 0): Date {
  return at(-daysAhead, hour, minute);
}

type MemberKey =
  | "amina"
  | "okello"
  | "betty"
  | "david"
  | "florence"
  | "peter";

const MEMBER_SEEDS: Array<{
  key: MemberKey;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  joinedDaysAgo: number;
}> = [
  {
    key: "amina",
    fullName: "Amina Kintu",
    email: "amina.k@example.com",
    phone: "+256 701 234 567",
    isActive: true,
    joinedDaysAgo: 70,
  },
  {
    key: "okello",
    fullName: "Okello James",
    email: "okello.j@example.com",
    phone: "+256 702 345 678",
    isActive: true,
    joinedDaysAgo: 68,
  },
  {
    key: "betty",
    fullName: "Betty Namusoke",
    email: "betty.n@example.com",
    phone: null,
    isActive: true,
    joinedDaysAgo: 66,
  },
  {
    key: "david",
    fullName: "David Ssemwanga",
    email: "david.s@example.com",
    phone: "+256 704 456 789",
    isActive: true,
    joinedDaysAgo: 64,
  },
  {
    key: "florence",
    fullName: "Florence Achieng",
    email: "florence.a@example.com",
    phone: "+256 705 567 890",
    isActive: true,
    joinedDaysAgo: 62,
  },
  // Deactivated to demonstrate §5.6: reports stay, login is refused.
  {
    key: "peter",
    fullName: "Peter Wasswa",
    email: "peter.w@example.com",
    phone: "+256 706 678 901",
    isActive: false,
    joinedDaysAgo: 61,
  },
];

type CommentSeed = {
  author: MemberKey | "admin";
  daysAgo: number;
  hour: number;
  body: string;
};

type ReportSeed = {
  author: MemberKey;
  category: ReportCategory;
  title: string;
  location: string;
  description: string;
  submittedDaysAgo: number;
  /** Transitions in chronological order; actor is always the admin. */
  history: Array<{ to: ReportStatus; daysAgo: number; hour: number }>;
  comments: CommentSeed[];
};

const REPORT_SEEDS: ReportSeed[] = [
  {
    author: "amina",
    category: "water_supply",
    title: "Borehole pump broken at Kansanga trading centre",
    location: "Kansanga trading centre",
    description:
      "The hand pump at the community borehole has produced no water for over a week. Residents are drawing from an unprotected spring instead, which is unsafe for children.",
    submittedDaysAgo: 58,
    history: [
      { to: "under_review", daysAgo: 56, hour: 10 },
      { to: "in_progress", daysAgo: 54, hour: 10 },
      { to: "resolved", daysAgo: 49, hour: 16 },
    ],
    comments: [
      {
        author: "admin",
        daysAgo: 54,
        hour: 11,
        body: "The water committee has been asked to open the pump head and check the seals.",
      },
      {
        author: "amina",
        daysAgo: 54,
        hour: 14,
        body: "Thank you. The spring water is making children sick, so please treat this as urgent.",
      },
    ],
  },
  {
    author: "okello",
    category: "infrastructure",
    title: "Collapsed culvert on Ggaba Road",
    location: "Ggaba Road, near the fuel station",
    description:
      "The culvert crossing at the fuel station collapsed after the heavy rains. Water now cuts across the road and vehicles are forced onto the pedestrian side.",
    submittedDaysAgo: 55,
    history: [
      { to: "under_review", daysAgo: 53, hour: 10 },
      { to: "in_progress", daysAgo: 50, hour: 11 },
      { to: "resolved", daysAgo: 44, hour: 15 },
    ],
    comments: [
      {
        author: "okello",
        daysAgo: 52,
        hour: 9,
        body: "Heavy trucks are now diverting through the residential lane and cracking the paving.",
      },
      {
        author: "admin",
        daysAgo: 51,
        hour: 12,
        body: "A contractor has been engaged; works start this week.",
      },
    ],
  },
  {
    author: "betty",
    category: "electricity",
    title: "Streetlights out along the school approach road",
    location: "School approach road, Kansanga",
    description:
      "Three streetlights between the junction and the school gate have been dark for two weeks. Learners walking home after evening preps use the road in complete darkness.",
    submittedDaysAgo: 52,
    history: [
      { to: "under_review", daysAgo: 50, hour: 10 },
      { to: "in_progress", daysAgo: 47, hour: 11 },
      { to: "resolved", daysAgo: 42, hour: 16 },
      { to: "closed", daysAgo: 38, hour: 12 },
    ],
    comments: [],
  },
  {
    author: "david",
    category: "sanitation",
    title: "Garbage heap growing behind Namuwongo market",
    location: "Namuwongo market, rear entrance",
    description:
      "Waste has not been collected from the rear of the market for three weeks. The heap now blocks the drainage channel and the smell reaches the nearby homes.",
    submittedDaysAgo: 50,
    history: [
      { to: "under_review", daysAgo: 48, hour: 10 },
      { to: "in_progress", daysAgo: 45, hour: 9 },
      { to: "resolved", daysAgo: 39, hour: 15 },
    ],
    comments: [
      {
        author: "admin",
        daysAgo: 45,
        hour: 11,
        body: "The collection truck will pass on Thursday; please keep the access road clear.",
      },
      {
        author: "david",
        daysAgo: 44,
        hour: 8,
        body: "Noted. The heap has been cleared from the access road side.",
      },
    ],
  },
  {
    author: "florence",
    category: "health",
    title: "Stagnant water breeding mosquitoes near the clinic",
    location: "Kansanga health post",
    description:
      "A pool of stagnant water has formed in the ditch beside the health post. Mosquitoes breed there and patients wait on benches directly next to it.",
    submittedDaysAgo: 47,
    history: [
      { to: "under_review", daysAgo: 45, hour: 10 },
      { to: "in_progress", daysAgo: 41, hour: 11 },
      { to: "resolved", daysAgo: 36, hour: 15 },
      { to: "closed", daysAgo: 30, hour: 12 },
    ],
    comments: [],
  },
  {
    author: "peter",
    category: "security",
    title: "Broken fence at the school playground",
    location: "Light Academy playground perimeter",
    description:
      "A section of the playground fence has fallen and outsiders cross the grounds after classes. The gap is wide enough for a motorcycle to pass through.",
    submittedDaysAgo: 45,
    history: [
      { to: "under_review", daysAgo: 43, hour: 10 },
      { to: "in_progress", daysAgo: 40, hour: 11 },
      { to: "resolved", daysAgo: 35, hour: 16 },
    ],
    comments: [],
  },
  {
    author: "amina",
    category: "environment",
    title: "Tree fell across the drainage channel",
    location: "Kirombe lane, off Ggaba Road",
    description:
      "A large tree came down in the storm and now lies across the open drainage channel. Water backs up behind it whenever it rains and floods the lane.",
    submittedDaysAgo: 40,
    history: [
      { to: "under_review", daysAgo: 38, hour: 10 },
      { to: "in_progress", daysAgo: 33, hour: 11 },
    ],
    comments: [
      {
        author: "amina",
        daysAgo: 37,
        hour: 8,
        body: "The channel overflowed again last night and reached two doorsteps.",
      },
      {
        author: "admin",
        daysAgo: 33,
        hour: 12,
        body: "The environment officer will supervise removal of the tree this week.",
      },
    ],
  },
  {
    author: "okello",
    category: "education",
    title: "Leaking roof in the community reading room",
    location: "Kansanga community reading room",
    description:
      "Rainwater comes through the iron sheets above the bookshelf corner. Several donated textbooks were soaked during the last downpour.",
    submittedDaysAgo: 38,
    history: [
      { to: "under_review", daysAgo: 36, hour: 10 },
      { to: "in_progress", daysAgo: 31, hour: 11 },
      { to: "resolved", daysAgo: 24, hour: 15 },
    ],
    comments: [],
  },
  {
    author: "betty",
    category: "other",
    title: "Abandoned kiosk used as a dumping ground",
    location: "Kabalagala junction",
    description:
      "The abandoned kiosk at the junction has become a dumping point and a hiding place at night. The owner has not been seen for months.",
    submittedDaysAgo: 36,
    history: [
      { to: "under_review", daysAgo: 34, hour: 10 },
      { to: "closed", daysAgo: 28, hour: 12 },
    ],
    comments: [],
  },
  {
    author: "david",
    category: "infrastructure",
    title: "Deep potholes at the taxi stage",
    location: "Kansanga taxi stage",
    description:
      "Potholes at the taxi stage entrance fill with water and passengers step off directly into them. Two boda riders have fallen there this month.",
    submittedDaysAgo: 33,
    history: [
      { to: "under_review", daysAgo: 31, hour: 10 },
      { to: "in_progress", daysAgo: 26, hour: 11 },
    ],
    comments: [],
  },
  {
    author: "florence",
    category: "water_supply",
    title: "Burst pipe flooding the footpath",
    location: "Muyenga hill footpath",
    description:
      "A supply pipe burst beside the footpath and clean water has been running to waste for days. The path itself is now slippery mud.",
    submittedDaysAgo: 30,
    history: [{ to: "under_review", daysAgo: 28, hour: 10 }],
    comments: [
      {
        author: "florence",
        daysAgo: 29,
        hour: 9,
        body: "The leak has worsened since I reported it; the path is barely passable.",
      },
      {
        author: "admin",
        daysAgo: 28,
        hour: 12,
        body: "The utility has been notified and a plumber is scheduled.",
      },
    ],
  },
  {
    author: "peter",
    category: "sanitation",
    title: "Blocked drainage behind the butcher's row",
    location: "Namuwongo market, butcher's row",
    description:
      "The drainage channel behind the butcher's row is blocked with packaging waste. Waste water pools behind the stalls where food is handled.",
    submittedDaysAgo: 28,
    history: [
      { to: "under_review", daysAgo: 26, hour: 10 },
      { to: "in_progress", daysAgo: 22, hour: 11 },
      { to: "resolved", daysAgo: 15, hour: 15 },
    ],
    comments: [],
  },
  {
    author: "amina",
    category: "security",
    title: "Dark corner at the boda stage worries residents",
    location: "Kansanga boda stage",
    description:
      "The corner behind the boda stage has no lighting at all. Residents returning from evening market hours avoid it and take a long detour instead.",
    submittedDaysAgo: 25,
    history: [{ to: "under_review", daysAgo: 23, hour: 10 }],
    comments: [],
  },
  {
    author: "okello",
    category: "electricity",
    title: "Transformer sparks during evening hours",
    location: "Kirombe lane transformer",
    description:
      "The transformer on Kirombe lane sparks visibly most evenings, usually around eight o'clock. Homes nearby report flickering lights at the same time.",
    submittedDaysAgo: 22,
    history: [
      { to: "under_review", daysAgo: 20, hour: 10 },
      { to: "in_progress", daysAgo: 16, hour: 11 },
    ],
    comments: [
      {
        author: "admin",
        daysAgo: 16,
        hour: 12,
        body: "The utility confirmed a faulty bushing; the replacement part is on order.",
      },
      {
        author: "okello",
        daysAgo: 15,
        hour: 9,
        body: "The sparking is now visible even in daytime, please hurry.",
      },
    ],
  },
  {
    author: "betty",
    category: "health",
    title: "Health post has run out of malaria test kits",
    location: "Kansanga health post",
    description:
      "The health post has had no malaria test kits for a week. Patients with fever are being sent to town for testing, which many cannot afford.",
    submittedDaysAgo: 20,
    history: [{ to: "under_review", daysAgo: 18, hour: 10 }],
    comments: [
      {
        author: "admin",
        daysAgo: 18,
        hour: 12,
        body: "The district health office has been asked to restock this week.",
      },
      {
        author: "betty",
        daysAgo: 17,
        hour: 9,
        body: "Patients are still being sent away in the meantime.",
      },
    ],
  },
  {
    author: "david",
    category: "environment",
    title: "Rubbish burning next to the nursery school",
    location: "St. Jude nursery school fence",
    description:
      "Traders burn rubbish against the nursery school fence in the afternoons. Smoke blows straight into the classrooms while children are still in.",
    submittedDaysAgo: 18,
    history: [
      { to: "under_review", daysAgo: 16, hour: 10 },
      { to: "in_progress", daysAgo: 13, hour: 11 },
      { to: "resolved", daysAgo: 8, hour: 15 },
    ],
    comments: [],
  },
  {
    author: "florence",
    category: "education",
    title: "Community notice board vandalised",
    location: "Light Academy front gate",
    description:
      "The glass on the community notice board at the front gate was smashed over the weekend. Meeting notices no longer stay up in the rain.",
    submittedDaysAgo: 15,
    history: [{ to: "under_review", daysAgo: 13, hour: 10 }],
    comments: [],
  },
  {
    author: "peter",
    category: "other",
    title: "Stray dogs gathering near the market gate",
    location: "Namuwongo market gate",
    description:
      "A pack of stray dogs has settled near the market gate and follows people carrying food. Parents are worried about children passing on the way to school.",
    submittedDaysAgo: 13,
    history: [],
    comments: [],
  },
  {
    author: "amina",
    category: "infrastructure",
    title: "Footbridge planks rotting at the wetland crossing",
    location: "Namuwongo wetland crossing",
    description:
      "Several planks on the wetland footbridge have rotted through and one has already given way. The bridge is the only dry route to the main road.",
    submittedDaysAgo: 10,
    history: [],
    comments: [],
  },
  {
    author: "okello",
    category: "water_supply",
    title: "Public tap leaking through the night",
    location: "Kabalagala public tap",
    description:
      "The public tap does not close fully and runs all night. The queue in the morning is long while water is wasted for hours before it.",
    submittedDaysAgo: 8,
    history: [],
    comments: [],
  },
  {
    author: "betty",
    category: "sanitation",
    title: "Overflowing public latrine at the trading centre",
    location: "Kansanga trading centre",
    description:
      "The public latrine at the trading centre is full and has started overflowing after rain. Market vendors have nowhere else to go during the day.",
    submittedDaysAgo: 7,
    history: [{ to: "under_review", daysAgo: 5, hour: 10 }],
    comments: [],
  },
  {
    author: "david",
    category: "security",
    title: "Motorcycle thefts reported on market days",
    location: "Namuwongo market",
    description:
      "Two motorcycles were stolen from outside the market on the last two market days. Riders now refuse to park there, which slows deliveries.",
    submittedDaysAgo: 5,
    history: [],
    comments: [],
  },
  {
    author: "florence",
    category: "electricity",
    title: "Low-hanging power line over the footpath",
    location: "Muyenga hill footpath",
    description:
      "A power line sags low over the footpath after a pole tilted in the rains. Taller adults can nearly touch it when walking past.",
    submittedDaysAgo: 3,
    history: [],
    comments: [],
  },
  {
    author: "amina",
    category: "environment",
    title: "Blocked storm drain filling with silt",
    location: "Ggaba Road, opposite the bakery",
    description:
      "The storm drain opposite the bakery is completely silted up. Even light rain now sends water across the road instead of down the drain.",
    submittedDaysAgo: 2,
    history: [],
    comments: [],
  },
];

async function main() {
  const [{ n: existingUsers }] = await db
    .select({ n: count() })
    .from(users);
  if (existingUsers > 0) {
    console.error(
      "The database already contains data. Run `npm run db:reset` for a clean, deterministic seed.",
    );
    process.exit(1);
  }

  // --- Users -------------------------------------------------------------
  const [admin] = await db
    .insert(users)
    .values({
      fullName: "Grace Nakato",
      email: "admin@lightacademy.ac.ug",
      passwordHash: await hashPassword("Admin#2026"),
      phone: "+256 700 100 200",
      role: "admin",
      isActive: true,
      createdAt: at(75, 9),
    })
    .returning();

  const memberByKey = new Map<MemberKey, { id: number; fullName: string }>();
  for (const seed of MEMBER_SEEDS) {
    const [row] = await db
      .insert(users)
      .values({
        fullName: seed.fullName,
        email: seed.email,
        passwordHash: await hashPassword("Member#2026"),
        phone: seed.phone,
        role: "member",
        isActive: seed.isActive,
        createdAt: at(seed.joinedDaysAgo, 9),
      })
      .returning();
    memberByKey.set(seed.key, { id: row.id, fullName: row.fullName });
  }

  // --- Reports, history, comments -----------------------------------------
  const reportIds: number[] = [];
  for (const seed of REPORT_SEEDS) {
    const author = memberByKey.get(seed.author)!;
    const status: ReportStatus =
      seed.history.length > 0
        ? seed.history[seed.history.length - 1].to
        : "pending";

    // updated_at mirrors the report's most recent event.
    const eventTimes = [
      at(seed.submittedDaysAgo, 9),
      ...seed.history.map((entry) => at(entry.daysAgo, entry.hour)),
      ...seed.comments.map((entry) => at(entry.daysAgo, entry.hour)),
    ];
    const updatedAt = new Date(
      Math.max(...eventTimes.map((time) => time.getTime())),
    );

    const [report] = await db
      .insert(reports)
      .values({
        title: seed.title,
        description: seed.description,
        category: seed.category,
        location: seed.location,
        imagePath: null, // uploads are exercised live during the demo (§13)
        status,
        userId: author.id,
        createdAt: at(seed.submittedDaysAgo, 9),
        updatedAt,
      })
      .returning();
    reportIds.push(report.id);

    let fromStatus: ReportStatus = "pending";
    for (const entry of seed.history) {
      await db.insert(reportStatusHistory).values({
        reportId: report.id,
        changedBy: admin.id,
        fromStatus,
        toStatus: entry.to,
        createdAt: at(entry.daysAgo, entry.hour),
      });
      fromStatus = entry.to;
    }

    for (const entry of seed.comments) {
      const commentAuthorId =
        entry.author === "admin"
          ? admin.id
          : memberByKey.get(entry.author)!.id;
      await db.insert(reportComments).values({
        reportId: report.id,
        authorId: commentAuthorId,
        body: entry.body,
        createdAt: at(entry.daysAgo, entry.hour),
      });
    }
  }

  // --- Announcements -------------------------------------------------------
  await db.insert(announcements).values([
    {
      title: "Water supply maintenance in Kansanga",
      body: "The utility will carry out maintenance on the Kansanga supply line on Thursday between 09:00 and 15:00. Store enough water for the day. Taps in the trading centre and along the approach road are affected.",
      authorId: admin.id,
      createdAt: at(40, 9),
    },
    {
      title: "Community clean-up day this Saturday",
      body: "The council is organising a clean-up of the market surroundings and the main drainage channels this Saturday. Assemble at the Namuwongo market gate at 08:00. Tools are provided; bring gloves if you have them.",
      authorId: admin.id,
      createdAt: at(25, 10),
    },
    {
      title: "How your reports are handled",
      body: "Every report received through this desk is reviewed by the administration, given a case number, and tracked until it is resolved. Photos help us assess problems faster — attach one where you can.",
      authorId: admin.id,
      createdAt: at(12, 9),
    },
    {
      title: "New security patrols along the approach road",
      body: "Following several reports about poor lighting, evening patrols now cover the school approach road and the boda stage between 19:00 and 23:00. Report any incident through this desk.",
      authorId: admin.id,
      createdAt: at(3, 17),
    },
  ]);

  // --- Meetings ------------------------------------------------------------
  await db.insert(meetings).values([
    {
      title: "Quarterly community council meeting",
      venue: "Light Academy main hall",
      description:
        "Review of resolved cases this quarter and the plan for the drainage works along Ggaba Road.",
      meetingDate: at(18, 17, 30),
      authorId: admin.id,
      createdAt: at(30, 9),
    },
    {
      title: "Drainage and roads working group",
      venue: "Light Academy main hall",
      description:
        "Progress on the culvert repair and the taxi stage potholes, with the contractor in attendance.",
      meetingDate: inDays(9, 17, 30),
      authorId: admin.id,
      createdAt: at(10, 9),
    },
    {
      title: "Community council open forum",
      venue: "Kansanga community grounds",
      description:
        "Open session for residents to raise issues directly with the council and the school administration.",
      meetingDate: inDays(23, 10, 0),
      authorId: admin.id,
      createdAt: at(4, 9),
    },
  ]);

  // --- Notifications (consistent with the events above) --------------------
  const amina = memberByKey.get("amina")!;
  const betty = memberByKey.get("betty")!;
  const okello = memberByKey.get("okello")!;

  // REPORT_SEEDS indexes: 6 = Amina's fallen tree, 13 = Okello's transformer,
  // 20 = Betty's latrine, 21–23 = the three newest submissions.
  await db.insert(notifications).values([
    {
      userId: amina.id,
      reportId: reportIds[6],
      message: `Status of report ${caseNumber(reportIds[6])} changed to ${STATUS_META.in_progress.label}.`,
      isRead: false,
      createdAt: at(33, 11),
    },
    {
      userId: amina.id,
      reportId: reportIds[6],
      message: `New comment on report ${caseNumber(reportIds[6])}.`,
      isRead: false,
      createdAt: at(33, 12),
    },
    {
      userId: betty.id,
      reportId: reportIds[20],
      message: `Status of report ${caseNumber(reportIds[20])} changed to ${STATUS_META.under_review.label}.`,
      isRead: false,
      createdAt: at(5, 10),
    },
    {
      userId: okello.id,
      reportId: reportIds[13],
      message: `Status of report ${caseNumber(reportIds[13])} changed to ${STATUS_META.in_progress.label}.`,
      isRead: true,
      createdAt: at(16, 11),
    },
    {
      userId: okello.id,
      reportId: reportIds[13],
      message: `New comment on report ${caseNumber(reportIds[13])}.`,
      isRead: true,
      createdAt: at(16, 12),
    },
    {
      userId: admin.id,
      reportId: reportIds[21],
      message: `New report ${caseNumber(reportIds[21])} submitted.`,
      isRead: true,
      createdAt: at(5, 9),
    },
    {
      userId: admin.id,
      reportId: reportIds[22],
      message: `New report ${caseNumber(reportIds[22])} submitted.`,
      isRead: false,
      createdAt: at(3, 9),
    },
    {
      userId: admin.id,
      reportId: reportIds[23],
      message: `New report ${caseNumber(reportIds[23])} submitted.`,
      isRead: false,
      createdAt: at(2, 9),
    },
  ]);

  console.log("Seed complete.");
  console.log(`  1 administrator, ${MEMBER_SEEDS.length} members (1 deactivated)`);
  console.log(`  ${REPORT_SEEDS.length} reports with history and comments`);
  console.log("  4 announcements, 3 meetings, 8 notifications");
  console.log("");
  console.log("Credentials:");
  console.log("  admin@lightacademy.ac.ug / Admin#2026");
  console.log("  amina.k@example.com (and the other members) / Member#2026");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
