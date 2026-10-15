// Headline features per game. Each feature carries the YouTube search queries used for
// video recommendations when it is selected.

export const FEATURES = {
  fc26: [
    {
      id: 'presets', name: 'Competitive vs Authentic Gameplay', modes: ['All modes'], tag: 'Gameplay',
      summary: 'Two gameplay presets: a faster, responsive Competitive setting for online play and a slower, more realistic Authentic setting for offline modes like Career.',
      points: ['Competitive is the default for Ultimate Team, Clubs and online play', 'Authentic tunes pace and AI for realistic offline matches', 'Separate tuning lets EA balance online play without changing Career'],
      videos: ['FC 26 competitive vs authentic gameplay explained', 'FC 26 gameplay tips'],
    },
    {
      id: 'archetypes', name: 'Clubs Archetypes', modes: ['Clubs'], tag: 'Clubs',
      summary: 'A class-based progression system for your Pro, with archetypes inspired by football legends that unlock signature attributes and PlayStyles as you level up.',
      points: ['Pick an archetype that fits how you play', 'Level up to unlock perks and PlayStyles', 'Encourages role-based teamwork in Clubs'],
      videos: ['FC 26 clubs archetypes explained', 'FC 26 best clubs archetype build'],
    },
    {
      id: 'manager-live', name: 'Manager Live & Live Events', modes: ['Career'], tag: 'Career',
      summary: 'Career Mode adds live, time-limited challenges and scenarios plus unexpected in-season events that change your save.',
      points: ['Scenario-based challenges refreshed during the season', 'Unexpected events: injuries, board changes, transfer twists', 'Rewards for completing challenges'],
      videos: ['FC 26 manager live challenges', 'FC 26 career mode new features'],
    },
    {
      id: 'ut-tournaments', name: 'Ultimate Team Tournaments & Live Events', modes: ['Ultimate Team'], tag: 'Ultimate Team',
      summary: 'New competitive structures in Ultimate Team with knockout-style tournaments and rotating live events alongside Rivals and Champions.',
      points: ['Knockout tournaments with rewards for deep runs', 'Rotating live events with special rules', 'Reworked Champions qualification'],
      videos: ['FC 26 ultimate team tournaments explained', 'FC 26 ultimate team beginners guide'],
    },
    {
      id: 'gk', name: 'Goalkeeping Overhaul', modes: ['All modes'], tag: 'Gameplay',
      summary: 'Reworked goalkeeper positioning and animations aimed at more believable saves and fewer cheap goals.',
      points: ['Improved positioning on near-post shots', 'New save animations', 'Better reaction to deflections'],
      videos: ['FC 26 goalkeeper tips', 'FC 26 best goalkeepers'],
    },
    {
      id: 'evolutions26', name: 'Evolutions', modes: ['Ultimate Team'], tag: 'Ultimate Team',
      summary: 'Upgrade eligible cards by completing objectives — boost stats, add PlayStyles and new positions.',
      points: ['Plan evo paths for your favourite players', 'Stack multiple evolutions on one card', 'Time-limited evo releases each week'],
      videos: ['FC 26 best evolutions', 'FC 26 evolutions guide'],
    },
  ],
  fc25: [
    {
      id: 'rush', name: 'Rush (5v5)', modes: ['Ultimate Team', 'Clubs', 'Kick-Off', 'Career'], tag: 'Mode',
      summary: 'A fast 5v5 format (four outfield players plus an AI keeper) that replaced VOLTA and plugged into most modes.',
      points: ['Smaller pitch, blue-card penalties, faster games', 'Play with friends in Ultimate Team Rush', 'Rewards feed into your main progression'],
      videos: ['FC 25 rush tips', 'FC 25 rush explained'],
    },
    {
      id: 'fciq', name: 'FC IQ & Player Roles', modes: ['All modes'], tag: 'Tactics',
      summary: 'A tactical overhaul built around Player Roles (Role, Role+ and Role++) that define how each player behaves on and off the ball.',
      points: ['Roles like Inverted Wingback, Box-to-Box, False 9', 'Role familiarity boosts AI behaviour', 'Simplified team tactics with role focus'],
      videos: ['FC 25 FC IQ player roles explained', 'FC 25 best custom tactics'],
    },
    {
      id: 'live-start', name: 'Live Start Points', modes: ['Career'], tag: 'Career',
      summary: 'Start a Career save from real-world scenarios that reflect the current football season.',
      points: ['Scenario starts based on real storylines', 'Updated through the season', 'Great for challenge saves'],
      videos: ['FC 25 career mode live start points', 'FC 25 career mode tips'],
    },
    {
      id: 'evolutions25', name: 'Evolutions', modes: ['Ultimate Team'], tag: 'Ultimate Team',
      summary: 'Evolutions continued with more paths, including Rush-specific objectives.',
      points: ['Wider eligibility pools', 'Rush objectives count toward evos', 'Some evos add Role+ familiarity'],
      videos: ['FC 25 best evolutions', 'FC 25 evolutions guide'],
    },
  ],
  fc24: [
    {
      id: 'playstyles', name: 'PlayStyles', modes: ['All modes'], tag: 'Gameplay',
      summary: 'Signature abilities powered by real-world data that give players unique traits; PlayStyle+ versions are the elite tier.',
      points: ['Finesse Shot+, Quick Step+, Trivela+ and more', 'PlayStyle+ is capped for most cards', 'Massive factor in card value'],
      videos: ['FC 24 playstyles explained', 'FC 24 best playstyles'],
    },
    {
      id: 'evolutions24', name: 'Evolutions (debut)', modes: ['Ultimate Team'], tag: 'Ultimate Team',
      summary: 'Ultimate Team introduced Evolutions: upgrade your existing cards by completing in-game objectives.',
      points: ['Free and coin/point-unlocked evo paths', 'Stat, PlayStyle and position upgrades', 'Turns low-rated favourites into playable cards'],
      videos: ['FC 24 evolutions explained'],
    },
    {
      id: 'hypermotionv', name: 'HyperMotionV', modes: ['All modes'], tag: 'Gameplay',
      summary: 'Animation tech built from volumetric capture of real matches for more authentic movement.',
      points: ['Captured from 180+ real matches', 'More natural running styles', 'Players move like their real counterparts'],
      videos: ['FC 24 hypermotionv'],
    },
    {
      id: 'women-ut', name: 'Women in Ultimate Team', modes: ['Ultimate Team'], tag: 'Ultimate Team',
      summary: 'Women footballers became playable in mixed Ultimate Team squads for the first time.',
      points: ['Liga F, WSL, NWSL, D1 Arkema and more', 'Full chemistry links with men’s cards', 'New promos and SBC options'],
      videos: ['FC 24 best women players ultimate team'],
    },
    {
      id: 'precision', name: 'Precision Passing & Controlled Sprint', modes: ['All modes'], tag: 'Gameplay',
      summary: 'New controls for manually aimed, power-adjusted passes and a sprint that keeps close control.',
      points: ['Trivela and lob precision passes', 'Controlled sprint for tight dribbling', 'Higher skill ceiling'],
      videos: ['FC 24 precision passing tutorial', 'FC 24 controlled sprint tutorial'],
    },
  ],
  fifa23: [
    {
      id: 'chemistry', name: 'New Chemistry System', modes: ['Ultimate Team'], tag: 'Ultimate Team',
      summary: 'A rebuilt chemistry model: each player earns 0–3 chemistry from club, league and nation links across the starting XI.',
      points: ['Positions no longer need direct links', 'Icons and Heroes give extra chem', 'Max team chemistry is 33'],
      videos: ['FIFA 23 chemistry explained'],
    },
    {
      id: 'power-shots', name: 'Power Shots', modes: ['All modes'], tag: 'Gameplay',
      summary: 'A high-risk, high-reward manually aimed shot triggered with both bumpers.',
      points: ['Long wind-up animation', 'Devastating from the edge of the box', 'Manual aim'],
      videos: ['FIFA 23 power shot tutorial'],
    },
    {
      id: 'hypermotion2', name: 'HyperMotion2 & AcceleRATE', modes: ['All modes'], tag: 'Gameplay',
      summary: 'Machine-learning animation plus AcceleRATE types (Explosive, Controlled, Lengthy) that change how players reach top speed.',
      points: ['6000+ new animations', 'Explosive players win short races', 'Lengthy players catch up over distance'],
      videos: ['FIFA 23 accelerate explained'],
    },
    {
      id: 'cross-play', name: 'Cross-Play', modes: ['Online'], tag: 'Online',
      summary: 'Players on the same console generation could play together across platforms for the first time.',
      points: ['Applies to most online 1v1 modes', 'Faster matchmaking', 'Optional toggle'],
      videos: ['FIFA 23 cross play explained'],
    },
  ],
};
