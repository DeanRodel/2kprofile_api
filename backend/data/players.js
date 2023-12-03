import bcrypt from "bcryptjs";

const players = [
  {
    _id: "60db7bba7fd5ca4564a60f7c",
    email: "kennth@gmail.com",
    username: "kennth",
    password: bcrypt.hashSync("123456", 10),
    tier: "Platinum",
    first_name: "Kennth",
    last_name: "Hailey",
    slug: "kennth",
    theme: {
      name: "Generic",
    },
    profile_info: {
      gamertag: "KennyGot",
      game: "NBA 2K",
      team: "Toronto Raptors Uprising",
      league: "NBA2K League",
      position: "Admin",
      console: "Playstation",
      country: "CA",
    },
    biography: {
      section1:
        "Kenneth Hailey (Kenny Got Work) was the first-round pick of Raptors Uprising GC during the inaugural 2018 season going 11th overall. Hailey was originally drafted as a point guard but moved to small forward as a ball-handling point forward when the season one meta shifted.",
      section2: "RAPTORS UPRISING GC SMALL FORWARD #1",
      section3:
        "Kenny Got Work Wins Player of the Month for July 2020 - August 6, 2020 Kenny Got Works magical season for Raptors Uprising GC continues! He has been awarded the Player of the Month honor for July 2020, his second POM win of the year!",
    },
    contact: {
      user: { email: "kennth@gmail.com", phone: "613-123-4567" },
      coach: { email: "", phone: "" },
      manager: { email: "", phone: "" },
      agency: { email: "", phone: "" },
    },
    rosterInvites: [
      {
        _id: "60db7d66cb64275cb8f9b65d",
        team: "60db7d4ecb64275cb8f9b65c",
        name: "Invite Kennth Team",
        message: "Welcome to my team!",
      },
    ],
    storeId: "61982954",
    stream: {
      youtube: "",
      twitch: "gamesdonequick",
      selected: "twitch",
    },
    sponsors: [
      {
        image: "https://i.imgur.com/el2IrWD.png",
        website: "https://apple.ca",
      },
      {
        image: "https://i.imgur.com/9ZkhIiv.png",
        website: "https://www.epicgames.com/fortnite/en-US/home",
      },
    ],
    photos: [
      "https://i.imgur.com/oXr5LZq.png",
      "https://i.imgur.com/EDDEdYz.png",
    ],
    membership: {
      tier: "Platinum",
      trial: "available",
    },
    videos: [
      "https://www.youtube.com/watch?v=pFliQzPSEWs",
      "https://www.youtube.com/watch?v=gIUN5-_IEX0",
      "https://www.youtube.com/watch?v=1A-EDe6b4YE",
      "https://www.youtube.com/watch?v=_znyZndR2_o",
      "https://www.youtube.com/watch?v=6l8CyGV6mTE",
      "https://www.youtube.com/watch?v=SHBBycLrgCk",
      "https://www.youtube.com/watch?v=9yCX6wJt5-I",
      "https://www.youtube.com/watch?v=YjKphmJySL4",
      "https://www.youtube.com/watch?v=FqU5-gTMLjE",
      "https://www.youtube.com/watch?v=LiYriZuACAc",
    ],
    stats: {
      // game: 'league',
      // leagueOfLegends: {
      //   queueType: 'RANKED_FLEX_SR',
      //   tier: 'GOLD',
      //   rank: 'I',
      //   summonerId: '9ZwJSahvKn_Kp4JewA6hUnBFFuBX0hHWdgqSqLkRY0Dwhzw',
      //   summonerName: 'NoobOwl',
      //   leaguePoints: 90,
      //   wins: 6,
      //   losses: 7,
      //   region: 'na1',
      // },
      // teamfightTactics: {
      //   queueType: 'RANKED_TFT',
      //   tier: 'CHALLENGER',
      //   rank: 'I',
      //   summonerId: '9ZwJSahvKn_Kp4JewA6hUnBFFuBX0hHWdgqSqLkRY0Dwhzw',
      //   summonerName: 'NoobOwl',
      //   leaguePoints: 1479,
      //   wins: 164,
      //   losses: 519,
      //   region: 'na1',
      // },
      // pubg: {
      //   duo: {
      //     assists: 5,
      //     damageDealt: 3412.5437,
      //     kills: 29,
      //     losses: 14,
      //     revives: 0,
      //     wins: 0,
      //   },
      //   solo: {
      //     assists: 0,
      //     damageDealt: 4327.211,
      //     kills: 37,
      //     losses: 5,
      //     revives: 0,
      //     wins: 1,
      //   },
      //   squad: {
      //     assists: 8,
      //     damageDealt: 16701.19,
      //     kills: 125,
      //     losses: 76,
      //     revives: 0,
      //     wins: 0,
      //   },
      //   accountId: 'account.c0e530e9b7244b358def282782f893af',
      //   name: 'WackyJacky101',
      //   platform: 'steam',
      // },
      // fortnite: {
      //   solo: {
      //     placetop1: 2298,
      //     kd: 9.21,
      //     placetop10: 3266,
      //     placetop25: 4136,
      //     kills: 49871,
      //     matchesplayed: 7710,
      //   },
      //   duo: {
      //     placetop1: 2714,
      //     kd: 9.01,
      //     placetop10: 0,
      //     placetop25: 0,
      //     kills: 42897,
      //     matchesplayed: 7475,
      //   },
      //   squad: {
      //     placetop1: 2845,
      //     kd: 9.69,
      //     placetop10: 0,
      //     placetop25: 0,
      //     kills: 45857,
      //     matchesplayed: 7579,
      //   },
      //   accountId: '4735ce9132924caf8a5b17789b40f79c',
      //   name: 'Ninja',
      //   level: 132,
      // },
      // apex: {
      //   name: 'svsful',
      //   platform: 'X1',
      //   level: 1749,
      //   rankName: 'Apex Predator',
      //   rankScore: 31686,
      //   kills: 5493,
      // },
      // division: {
      //   name: 'BaIIer',
      //   platform: 'uplay',
      //   kills_pvp: 0,
      //   kills_npc: 435,
      //   level_pve: 10,
      //   level_dz: 0,
      // },
      // dota: {
      //   name: '0.0',
      //   steamId: '177613346',
      //   competitive_rank: 4340,
      //   solo_competitive_rank: 6669,
      //   leaderboard_rank: 1,
      //   mmr: 6221,
      //   wins: 4424,
      //   loss: 3446,
      // },
      // warzone: {
      //   name: 'FontainesRazor',
      //   platform: 'psn',
      //   wins: 15296,
      //   kills: 47566,
      //   topTen: 15374,
      //   gamesPlayed: 16994,
      //   deaths: 27199,
      // },
    },
  },
  {
    _id: "60db7bba7fd5ca4564a60f7d",
    email: "zion@gmail.com",
    username: "zion",
    password: bcrypt.hashSync("123456", 10),
    first_name: "Zion",
    last_name: "Williamson",
    slug: "zion",
    tier: "Bronze",
    theme: {
      name: "Generic",
    },
  },
  {
    _id: "60db7bba7fd5ca4564a60f7e",
    email: "odin@gmail.com",
    username: "odin",
    password: bcrypt.hashSync("123456", 10),
    first_name: "Odin",
    last_name: "Tate",
    slug: "odin",
    theme: {
      name: "Generic",
    },
  },
  {
    _id: "60db7bba7fd5ca4564a60f7f",
    email: "eliott@gmail.com",
    username: "eliott",
    password: bcrypt.hashSync("123456", 10),
    first_name: "Eliott",
    last_name: "Whyte",
    slug: "eliott",
    theme: {
      name: "Generic",
    },
  },
  {
    _id: "60db7bba7fd5ca4564a60f80",
    email: "louise@gmail.com",
    username: "louise",
    password: bcrypt.hashSync("123456", 10),
    first_name: "Louise",
    last_name: "Mcneil",
    slug: "louise",
    theme: {
      name: "Generic",
    },
  },
  {
    _id: "60db7bba7fd5ca4564a60f81",
    email: "dylan@gmail.com",
    username: "dylan",
    password: bcrypt.hashSync("123456", 10),
    first_name: "Dylan",
    last_name: "Higgs",
    slug: "dylan",
    theme: {
      name: "Generic",
    },
  },
  {
    _id: "60db7bba7fd5ca4564a60f82",
    email: "anna@gmail.com",
    username: "anna",
    password: bcrypt.hashSync("123456", 10),
    first_name: "Anna",
    last_name: "Daniels",
    slug: "anna",
    theme: {
      name: "Generic",
    },
  },
];

export default players;