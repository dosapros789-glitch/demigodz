import REAL_CLAN_JSON from './realClanData.json';

export interface ClanMember {
  tag: string;
  name: string;
  role: 'leader' | 'coLeader' | 'admin' | 'member';
  expLevel: number;
  townHallLevel: number;
  trophies: number;
  clanRank: number;
  donations: number;
  donationsReceived: number;
  warStars?: number;
  league?: {
    id: number;
    name: string;
    iconUrls?: { small: string; tiny: string; medium?: string };
  };
}

export interface ClanAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'CWL' | 'War' | 'Raid' | 'General';
  isPinned: boolean;
  author: string;
}

export interface WarRule {
  id: string;
  title: string;
  category: 'CWL' | 'Classic War' | 'General' | 'Demotion Policy';
  description: string;
  highlight?: string;
}

export interface ClanInfo {
  tag: string;
  name: string;
  type: string;
  description: string;
  clanLevel: number;
  clanPoints: number;
  clanVersusPoints?: number;
  requiredTrophies: number;
  requiredTownhallLevel: number;
  warFrequency: string;
  warWinStreak: number;
  warWins: number;
  warTies: number;
  warLosses: number;
  isWarLogPublic: boolean;
  warLeague?: { id: number; name: string };
  members: number;
  badgeUrls?: {
    small: string;
    medium: string;
    large: string;
  };
  memberList: ClanMember[];
}

export const INITIAL_CLAN_INFO: ClanInfo = REAL_CLAN_JSON as unknown as ClanInfo;

export const INITIAL_ANNOUNCEMENTS: ClanAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'CWL Master League I Guidelines & Mirror Assignments',
    content: 'We are competing in Master League I. Make sure all heroes are up and war bases are anti-3 star. Strict 1 attack per day. Check our Facebook Group Chat / Clan Chat for mirror callouts and strategy before attacking.',
    date: '2026-10-10',
    category: 'CWL',
    isPinned: true,
    author: '♣♠MaC.SmurF♠♣ (Leader)',
  },
  {
    id: 'ann-2',
    title: 'Raid Weekend: Target 1.5k Raid Medals',
    content: 'Full 6/6 attacks required for all active members. Attack the designated high-priority capital districts. Raid medals will be used to level up equipment ores and troop reinforcements!',
    date: '2026-10-08',
    category: 'Raid',
    isPinned: false,
    author: '♠♠✨MaC✨♣♣ (Co-Leader)',
  },
  {
    id: 'ann-3',
    title: 'Clan War Win Streak Milestone: 26 Wins in a Row!',
    content: 'Huge congratulations to all Demi GoDz PH clashers on hitting a 26-war win streak! Keep up the discipline, double attacks in classic wars, and communication in GC.',
    date: '2026-10-06',
    category: 'War',
    isPinned: false,
    author: 'jiro (Co-Leader)',
  },
];

export const INITIAL_WAR_RULES: WarRule[] = [
  {
    id: 'rule-1',
    category: 'CWL',
    title: 'Mandatory 1 Attack Per Round (Master I)',
    description: 'In CWL, every member in the active roster must use their single attack every round. Missed attacks without prior notice result in immediate replacement and benching for the rest of the week.',
    highlight: 'Zero tolerance for missed CWL attacks',
  },
  {
    id: 'rule-2',
    category: 'CWL',
    title: 'Mirror & Target Strategy via GC',
    description: 'Attack your assigned mirror unless instructed by Co-Leaders on Clan Chat or FB Group Chat. If you cannot 2-star or 3-star your mirror, notify leadership in chat at least 6 hours before war ends so targets can be swapped.',
    highlight: 'Communicate target switches early',
  },
  {
    id: 'rule-3',
    category: 'Classic War',
    title: 'Both Attacks Mandatory (26 Win Streak)',
    description: 'Both attacks must be used in all regular 24h clan wars. First attack must be used within the first 14 hours against your mirror or clean-up targets. Second attack is reserved for maximum stars cleanup.',
    highlight: 'Attack 1: First 14 hours | Attack 2: Clean up',
  },
  {
    id: 'rule-4',
    category: 'Classic War',
    title: 'Hero Availability Rule',
    description: 'Your Clan War preference must be set to RED if your Archer Queen, Barbarian King, or Grand Warden is upgrading. Only green-badged members with available heroes are put into war.',
    highlight: 'Heroes down = Badge Red',
  },
  {
    id: 'rule-5',
    category: 'General',
    title: 'Donation Etiquette & CC Troops',
    description: 'Always request specific troops for war attacks and mention "FOR WAR". Clan mates must only donate max-level troops for war requests. Keep a reasonable donation ratio (at least 1:2).',
    highlight: 'Max troops only for war CC',
  },
  {
    id: 'rule-6',
    category: 'Demotion Policy',
    title: 'Strike & Promotion System',
    description: '1 missed war attack = 1 Strike & warning. 2 missed attacks in a month = Demotion to Member or Kick. Promotion to Elder requires active donations (1,000+), solid war performance, and reliable activity.',
    highlight: 'Active + 1,000 donations = Elder eligible',
  },
];
