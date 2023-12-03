import mongoose from 'mongoose';

const teamSchema = mongoose.Schema({
  slug: String,
  roster: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
      },
      name: {
        type: String,
      },
      position: {
        type: String,
        default: 'Player',
      },
      slug: {
        type: String,
      },
      gravatar: {
        type: String,
      },
    },
  ],
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
        name: 'Our Discord',
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
        name: 'Our Profile',
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
        name: 'Our Stream',
        nameMenu: 'Stream',
      },
      {
        section: 'Roster',
        template: '',
        order: 6,
        customTemplate: '',
        show: true,
        menu: true,
        profile: true,
        name: 'Our Roster',
        nameMenu: 'Roster',
      },
      {
        section: 'Bio',
        template: '',
        order: 7,
        customTemplate: '',
        show: true,
        menu: true,
        profile: true,
        name: 'Our Bio',
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
        name: 'Our Sponsors',
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
        name: 'Our Contact',
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
        name: 'Our Photos',
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
        name: 'Our Videos',
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
        name: 'Our Store',
        nameMenu: 'Store',
      },
    ],
  },
  theme: {
    name: { type: String, default: 'Generic' },
    background: [String],
    banner: [String],
  },
  teamProfile: {
    type: {
      teamName: String,
      teamTag: String,
      game: String,
      team: String,
      league: String,
      console: String,
      country: String,
    },
    default: {
      teamName: '',
      teamTag: '',
      game: '',
      team: '',
      league: '',
      console: '',
      country: '',
    },
  },
  gravatar: {
    type: String,
    default: '//www.gravatar.com/avatar/84aad248e0c12d0d3e4513177a510e0d',
  },
  biography: {
    type: { section1: String, section2: String, section3: String },
    default: {
      section1:
        'This Team is awesome! Since we formed a few years ago we have grown into a powerful machine. We focus on each other’s attributes for success and support each other all the way. We are always looking for other teams to battle, check out our Team site to see how you’ll match up.',
      section2:
        'We destroyed at the last tournament, top skills, top numbers! This team conquers every time. World domination is ours for the taking!',
      section3:
        'Looking to join a team? We are always looking to increase our standings with fresh new talent. Come on let’s see what you’ve got! Wanna battle? It’s US vs. YOU and we already know what’s going to happen…BOOM.',
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
  social_media: {
    type: {
      tiktokId: String,
      twitterId: String,
      instagramId: String,
      youtubeId: String,
      facebookId: String,
      snapchatId: String,
      discordId: String,
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
      twitchId: '',
    },
  },
  photos: [String],
  videos: [String],
  storeId: { type: String, default: '' },
  tier: String,
  membership: {
    type: {
      tier: String,
      expire: Date,
      trial: String,
    },
    default: {
      tier: 'Bronze',
      trial: 'available',
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
  name: {
    type: [String],
    default: ['', '', ''],
  },
  pattern: {
    type: Number,
    default: 0,
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
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
