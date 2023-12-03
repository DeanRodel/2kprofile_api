import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import slugify from 'slugify';
import { kStringMaxLength } from 'buffer';
import { stringify } from 'querystring';

const playerSchema = mongoose.Schema(
  {
    //Authentication
    slug: String,
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    gravatar: {
      type: String,
      default: 'https://i.imgur.com/VoqA9Vs.png',
    },
    password: {
      type: String,
      required: true,
    },
    subscribe: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    templates: {
      type: [
        {
          _id: false,
          section: String, //internal name of section
          template: String, //do not delete, placeholder for compatibility
          order: Number, //to be used later for ordering sections
          customTemplate: String, //do not delete, placeholder for compatibility
          show: Boolean, //is visible in player public profile page
          menu: Boolean, //is visible in menu
          profile: Boolean, //is visible in player profile page
          name: String, //visible name of section
          nameMenu: String, //visible name of section in menu
        },
      ],
      default: [
        {
          section: 'Discord',
          template: '',
          order: 1,
          customTemplate: '',
          show: true,
          menu: false,
          profile: true,
          name: 'My Discord',
          nameMenu: 'Discord',
        },
        {
          section: 'Name',
          template: '',
          order: 2,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: '',
          nameMenu: 'Name',
        },
        {
          section: 'ProfileCard',
          template: '',
          order: 3,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Profile',
          nameMenu: 'Profile',
        },
        {
          section: 'Stream',
          template: '',
          order: 4,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Stream',
          nameMenu: 'Stream',
        },
        {
          section: 'Stats',
          template: '',
          order: 5,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Stats',
          nameMenu: 'Stats',
        },
        {
          section: 'Team',
          template: '',
          order: 6,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Team',
          nameMenu: 'Team',
        },
        {
          section: 'Bio',
          template: '',
          order: 7,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Bio',
          nameMenu: 'Bio',
        },
        {
          section: 'Sponsors',
          template: '',
          order: 8,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Sponsors',
          nameMenu: 'Sponsors',
        },
        {
          section: 'Contact',
          template: '',
          order: 9,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Contact',
          nameMenu: 'Contact',
        },
        {
          section: 'Photos',
          template: '',
          order: 10,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Photos',
          nameMenu: 'Photos',
        },
        {
          section: 'Videos',
          template: '',
          order: 11,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Videos',
          nameMenu: 'Videos',
        },
        {
          section: 'Store',
          template: '',
          order: 12,
          customTemplate: '',
          show: true,
          menu: true,
          profile: true,
          name: 'My Store',
          nameMenu: 'Store',
        },
      ],
    },
    theme: {
      name: { type: String, default: 'Generic' },
      background: [String],
      banner: [String],
    },
    stats: {
      games: [String],
      default: String,
      leagueOfLegends: {
        summonerId: String,
        queueType: String,
        tier: String,
        rank: String,
        summonerName: String,
        region: String,
        leaguePoints: Number,
        wins: Number,
        losses: Number,
        lastUpdated: Date,
        lastModified: Date,
      },
      teamfightTactics: {
        summonerId: String,
        queueType: String,
        tier: String,
        rank: String,
        summonerName: String,
        region: String,
        leaguePoints: Number,
        wins: Number,
        losses: Number,
        lastUpdated: Date,
        lastModified: Date,
      },
      pubg: {
        accountId: String,
        name: String,
        platform: String,
        duo: {
          wins: Number,
          losses: Number,
          kills: Number,
          damageDealt: Number,
          assists: Number,
          revives: Number,
        },
        solo: {
          wins: Number,
          losses: Number,
          kills: Number,
          damageDealt: Number,
          assists: Number,
          revives: Number,
        },
        squad: {
          wins: Number,
          losses: Number,
          kills: Number,
          damageDealt: Number,
          assists: Number,
          revives: Number,
        },
        lastModified: Date,
        lastUpdated: Date,
      },
      fortnite: {
        accountId: String,
        name: String,
        level: Number,
        solo: {
          placetop1: Number,
          placetop10: Number,
          placetop25: Number,
          kills: Number,
          kd: Number,
          matchesplayed: Number,
        },
        duo: {
          placetop1: Number,
          placetop10: Number,
          placetop25: Number,
          kills: Number,
          kd: Number,
          matchesplayed: Number,
        },
        squad: {
          placetop1: Number,
          placetop10: Number,
          placetop25: Number,
          kills: Number,
          kd: Number,
          matchesplayed: Number,
        },
        lastModified: Date,
        lastUpdated: Date,
      },
      apex: {
        name: String,
        platform: String,
        level: Number,
        rankName: String,
        rankScore: Number,
        kills: Number,
        lastModified: Date,
        lastUpdated: Date,
      },
      division: {
        name: String,
        platform: String,
        kills_pvp: Number,
        kills_npc: Number,
        level_pve: Number,
        level_dz: Number,
        lastModified: Date,
        lastUpdated: Date,
      },
      dota: {
        name: String,
        steamId: String,
        competitive_rank: Number,
        rank_tier: Number,
        solo_competitive_rank: Number,
        leaderboard_rank: Number,
        mmr: Number,
        wins: Number,
        loss: Number,
        lastModified: Date,
        lastUpdated: Date,
      },
      warzone: {
        name: String,
        platform: String,
        wins: Number,
        topTen: Number,
        gamesPlayed: Number,
        kills: Number,
        deaths: Number,
        lastModified: Date,
        lastUpdated: Date,
      },
      xboxlive: {
        gamerTag: String,
        xuid: String,
        game: String,
        titleId: Number,
        displayImage: String,
        games: [
          {
            title: String,
            devices: [{ type: String }],
            displayImage: String,
            achievement: {
              _id: false,
              currentAchievements: Number,
              rotalAchievements: Number,
              currentGamerscore: Number,
              totalGamerscore: Number,
              progressPercentage: Number,
              sourceVersion: Number,
            },
          },
        ],
        achievements: [
          {
            name: String,
            gamerscore: String,
            description: String,
            lockedDescription: String,
            timeUnlocked: String,
            imageUnlocked: String,
          },
        ],
        lastModified: Date,
        lastUpdated: Date,
      },
      csgo: {
        steamId: String,
        score: {
          percentile: Number,
          displayValue: String,
        },
        kills: {
          percentile: Number,
          displayValue: String,
        },
        kd: {
          percentile: Number,
          displayValue: String,
        },
        damage: {
          percentile: Number,
          displayValue: String,
        },
        wins: {
          percentile: Number,
          displayValue: String,
        },
      },
    },
    //Account type
    membership: {
      type: {
        tier: String,
        expire: Date,
        trial: String,
        email: Number,
      },
      default: {
        tier: 'Platinum',
        expire: Date.now() + 7 * 24 * 60 * 60000,
        trial: 'available',
        email: 0,
      },
    },
    stripe: {
      type: {
        customer: String,
        subscription: String,
        cancel_at: Number,
      },
      default: {
        customer: '',
        subscription: '',
        cancel_at: '',
      },
    },
    tier: String,
    //Bronze tier
    first_name: String,
    last_name: String,
    profile_image: String,
    background_image: String,
    discordId: String,
    profile_info: {
      _id: false,
      type: {
        game: String,
        team: String,
        gamertag: String,
        league: String,
        position: String,
        console: String,
        country: String,
        category: String,
        gamePosition: String,
      },
      default: {
        game: '',
        team: '',
        gamertag: '',
        league: '',
        position: '',
        console: '',
        country: '',
        category: 'Player',
        gamePosition: 'Player',
      },
    },
    name: {
      type: [String],
      default: ['', '', ''],
    },
    pattern: {
      type: Number,
      default: 0,
    },
    biography: {
      type: {
        section1: String,
        section2: String,
        section3: String,
      },
      default: {
        section1:
          'I began playing esports when I was really young, like most kids do. Soon it became not only my favorite pastime but something I was really good at! With the increase in my skills and the rise in my following I am looking to take the next big step into pro gaming.',
        section2:
          'I have ranked high in amateur leagues over the last few years, and do well to show of my skills every chance I get. Still don’t believe? Check out my stats!',
        section3:
          'This season I am focused on ranking up on the leaderboards and winning more tournaments. I joined the league last season and am hoping to officially join a team this season, check out my best moments and recent stats.',
      },
    },
    stream: {
      type: {
        youtube: '',
        twitch: '',
        selected: '',
      },
      default: {
        youtube: '',
        twitch: '',
        selected: '',
      },
    },
    contact: {
      type: {
        user: { email: String, phone: String },
        coach: { email: String, phone: String },
        manager: { email: String, phone: String },
        agency: { email: String, phone: String },
      },
      default: {
        user: { email: '', phone: '' },
        coach: { email: '', phone: '' },
        manager: { email: '', phone: '' },
        agency: { email: '', phone: '' },
      },
    },
    rosterInvites: [
      {
        team: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Team',
        },
        message: {
          type: String,
        },
        name: {
          type: String,
        },
        teamTag: {
          type: String,
        },
        game: {
          type: String,
        },
        console: {
          type: String,
        },
      },
    ],
    //Silver Tier (will add gameId for stats later)
    social_media: {
      type: {
        tiktokId: String,
        twitterId: String,
        instagramId: String,
        youtubeId: String,
        facebookId: String,
        snapchatId: String,
        discordId: String,
        discordWidget: Number,
        twitchId: String,
      },
      default: {
        tiktokId: '',
        twitterId: '',
        instagramId: '',
        youtubeId: '',
        facebookId: '',
        snapchatId: '',
        discordId: '',
        discordWidget: 0,
        twitchId: '',
      },
    },
    photos: [String],
    videos: [String],
    // Platinum Tier
    sponsors: {
      type: [
        {
          _id: false,
          image: String,
          website: String,
        },
      ],
      default: [{ image: '', website: '' }],
    },
    storeId: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

//Compare encrypted passwords
playerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//Generate and hash password token
playerSchema.methods.getResetPasswordToken = function () {
  //Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  //Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //Expires in 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Sign JWT and return
playerSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//Encrypt password before saving to database
playerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Player = mongoose.model('Player', playerSchema);

export default Player;
