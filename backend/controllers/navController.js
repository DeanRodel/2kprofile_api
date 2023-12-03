import asyncHandler from 'express-async-handler';
import Team from '../models/teamModel.js';
import Player from '../models/playerModel.js';
import Theme from '../models/themeModel.js';
import ProfileCategory from '../models/profileCategoryModel.js';
import Platform from '../models/platformModel.js';
import Game from '../models/gameModel.js';
import fs from 'fs';
import Stripe from 'stripe';
import sendEmail from '../utils/sendEmail.js';
import imageToBase64 from 'image-to-base64';
import fetch from 'node-fetch';
import axios from 'axios';

import {
  updateLeagueStats,
  updateTeamfightStats,
  updatePubgStats,
  updateFortniteStats,
  updateApexStats,
  updateDivisionStats,
  updateDotaStats,
  updateWarzoneStats,
  updateCsgoStats,
} from './statsControllers/serverController.js';

const oneSecond = 1 * 1 * 1 * 1000;
const oneMinute = 1 * 1 * 1 * 60000;
const oneDay = 1 * 24 * 60 * 60000;
const oneWeek = 7 * 24 * 60 * 60000;
const oneMonth = 31 * 24 * 60 * 60000;

const stripe = new Stripe('sk_test_zzdAejZmaUXNfgb8ODE1KbBG00RKtNgb2G', {
  apiVersion: '2020-08-27',
});

//Returns true if data should be updated (enough time has passed)
const update = (field, time) => {
  if (field) {
    if (Date.now() < field.getTime() + time) {
      return false;
    } else {
      return true;
    }
  } else {
    return true;
  }
};

const getTeam = asyncHandler(async (req, res) => {
  let team = await Team.findOne({
    slug: req.params.slug,
  });

  if (!team) {
    res.status(404);
    throw new Error('Team does not exist');
  }
  await updateTeamTheme(team);
  await checkTeamMembership(team);
  await updateTeamMembership(team);

  team = await Team.findById(team._id);
  res.status(200);
  res.json({ team: team });
});

const checkIfPlayerOnTeam = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);
  const team = await Team.findOne({
    slug: req.params.slug,
    roster: { $elemMatch: { _id: req.player._id } },
  });
  if (team !== null) {
    res.status(200);
    res.json('true');
  } else {
    res.status(200);
    res.json({ player: player });
  }
});

async function updatePlayerTheme(player) {
  if (player.theme.name) {
    const theme = await Theme.findOne({
      name: player.theme.name,
    });
    if (theme) {
      await Player.updateOne(
        { _id: player._id },
        {
          theme: {
            name: theme.name,
            background: theme.background,
            banner: theme.banner,
          },
        }
      );
    }
  }
}

async function updateTeamTheme(team) {
  if (team.theme.name) {
    const theme = await Theme.findOne({
      name: team.theme.name,
    });
    if (theme) {
      await Team.updateOne(
        { _id: team._id },
        {
          theme: {
            name: theme.name,
            background: theme.background,
            banner: theme.banner,
          },
        }
      );
    }
  }
}

async function updateStats(player) {
  if (player.stats !== undefined) {
    if (player.stats.games.includes('league')) {
      if (update(player.stats.leagueOfLegends.lastUpdated, oneDay)) {
        await updateLeagueStats(player);
      }
    }
    if (player.stats.games.includes('teamfight')) {
      if (update(player.stats.teamfightTactics.lastUpdated, oneDay)) {
        await updateTeamfightStats(player);
      }
    }
    if (player.stats.games.includes('pubg')) {
      if (update(player.stats.pubg.lastUpdated, oneDay)) {
        await updatePubgStats(player);
      }
    }
    if (player.stats.games.includes('fortnite')) {
      if (update(player.stats.fortnite.lastUpdated, oneDay)) {
        await updateFortniteStats(player);
      }
    }
    if (player.stats.games.includes('apex')) {
      if (update(player.stats.apex.lastUpdated, oneDay)) {
        await updateApexStats(player);
      }
    }
    if (player.stats.games.includes('division')) {
      if (update(player.stats.division.lastUpdated, oneDay)) {
        await updateDivisionStats(player);
      }
    }
    if (player.stats.games.includes('dota')) {
      if (update(player.stats.dota.lastUpdated, oneDay)) {
        await updateDotaStats(player);
      }
    }
    if (player.stats.games.includes('warzone')) {
      if (update(player.stats.warzone.lastUpdated, oneDay)) {
        await updateWarzoneStats(player);
      }
    }
    if (player.stats.games.includes('csgo')) {
      if (update(player.stats.csgo.lastUpdated, oneDay)) {
        await updateCsgoStats(player);
      }
    }
    // if (player.stats.games.includes('xbox')) {
    //   if (update(player.stats.xboxlive.lastUpdated, oneDay)) {
    //     await updateXboxLiveStates(player);
    //   }
    // }
  }
}

// Change player back to bronze
async function resetMembership(player) {
  let templates = player.templates;
  templates[3].show = false;
  templates[7].show = false;
  templates[9].show = false;
  templates[10].show = false;
  templates[11].show = false;

  await Player.updateOne(
    {
      _id: player._id,
    },
    {
      'membership.tier': 'Bronze',
      'membership.trial': 'used',
      templates: templates,
    }
  );
}

async function updateMembership(player) {
  let templates = player.templates;
  if (player.membership.tier === 'Bronze') {
    templates[3].show = false;
    templates[7].show = false;
    templates[9].show = false;
    templates[10].show = false;
    templates[11].show = false;
  }
  if (player.membership.tier === 'Silver') {
    templates[3].show = false;
    templates[7].show = false;
    templates[11].show = false;
  }
  if (player.membership.tier === 'Gold') {
    templates[7].show = false;
    templates[11].show = false;
  }
  player.markModified('player.templates');
  player.save();
}

async function updateTeamMembership(team) {
  let templates = team.templates;
  if (team.membership.tier === 'Bronze') {
    templates[3].show = false;
    templates[6].show = false;
    templates[8].show = false;
    templates[9].show = false;
    templates[10].show = false;
  }
  if (team.membership.tier === 'Silver') {
    templates[3].show = false;
    templates[6].show = false;
    templates[10].show = false;
  }
  if (team.membership.tier === 'Gold') {
    templates[6].show = false;
    templates[10].show = false;
  }
  team.markModified('team.templates');
  team.save();
}

async function checkTrial(player) {
  if (player.stripe.customer === '' && update(player.createdAt, oneWeek)) {
    await resetMembership(player);
  }
}

async function checkMembership(player) {
  if (player.stripe.cancel_at !== '' && Date.now() > player.stripe.cancel_at) {
    let templates = player.templates;
    templates[3].show = false;
    templates[7].show = false;
    templates[9].show = false;
    templates[10].show = false;
    templates[11].show = false;

    await Player.updateOne(
      {
        _id: player._id,
      },
      {
        'membership.tier': 'Bronze',
        templates: templates,
      }
    );
  }
}

async function checkTeamMembership(team) {
  if (team.stripe.cancel_at !== '' && Date.now() > team.stripe.cancel_at) {
    let templates = team.templates;
    templates[3].show = false;
    templates[6].show = false;
    templates[8].show = false;
    templates[9].show = false;
    templates[10].show = false;

    await Team.updateOne(
      {
        _id: team._id,
      },
      {
        'membership.tier': 'Bronze',
        templates: templates,
      }
    );
  }
}

// @desc   Get a logged in player's profile page NOT COMPLETED
// @route  GET /api/players/profile
// @access Public
const getLoggedInProfile = asyncHandler(async (req, res) => {
  await updateStats(player);
  await checkTrial(player);
  await checkMembership(player);
  await updateMembership(player);
  const player = await Player.findOne({ _id: req.player._id });
  res.status(200);
  return res.json(player);
});

const getPlayer = asyncHandler(async (req, res) => {
  let player = await Player.findOne({ slug: req.params.slug });
  if (player) {
    await updateStats(player);
    await checkMembership(player);
    await updatePlayerTheme(player);
    await updateMembership(player);
    player = await Player.findById(player._id);
    res.json(player);
  } else {
    res.status(404);
    throw new Error('Player not found');
  }
});

const getTeamDashboard = asyncHandler(async (req, res) => {
  // console.log('test');
  // console.log(req.params.slug);
  let team = await Team.findOne({
    slug: req.params.slug,
  });

  if (!team) {
    res.status(404);
    throw new Error(`Does not exist`);
  }

  const reqPlayer = await Team.findOne(
    { slug: req.params.slug },
    { roster: { $elemMatch: { _id: req.player._id } } }
  );

  let role = '';
  if (reqPlayer.roster.length === 0) {
    res.status(401);
    throw new Error(`Not on team`);
  } else {
    role = reqPlayer.roster[0].position;
  }
  await updateTeamTheme(team);
  await updateTeamMembership(team);
  await checkTeamMembership(team);

  team = await Team.findById(team._id);
  res.status(200);
  res.json({ team: team, role: role });
});

const getPlayerDashboard = asyncHandler(async (req, res) => {
  const player = await Player.findOne({ _id: req.player._id });
  await checkTrial(player);
  await updateMembership(player);
  await checkMembership(player);

  let updatedPlayer = await Player.findById(req.player._id);

  const teams = await Team.find({
    roster: { $elemMatch: { _id: req.player._id } },
  });

  if (updatedPlayer) {
    await updatePlayerTheme(updatedPlayer);
    updatedPlayer = await Player.findById(updatedPlayer._id);
    res.json({ player: updatedPlayer, teams: teams });
  } else {
    res.status(404);
    throw new Error('Player not found');
  }
});

const getMyTeams = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);
  if (!player) {
    res.status(404);
    throw new Error('Player not found');
  }

  const teams = await Team.find({
    roster: { $elemMatch: { _id: req.player.id } },
  });
  if (!teams) {
    res.status(404);
    throw new Error('You currently do not belong to any teams');
  }
  res.status(200);
  res.json({ teams: teams, player: player });
});

const search = asyncHandler(async (req, res) => {
  const testTeams = await Team.find({
    'teamProfile.teamName': { $regex: req.body.search, $options: 'i' },
  });

  if (req.body.search.length < 2) {
    res.status(401);
    throw new Error(`Please enter at least 2 characters`);
  }

  const teams = await Team.find({
    $or: [
      {
        'teamProfile.teamName': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'teamProfile.teamTag': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'teamProfile.game': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'teamProfile.team': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'teamProfile.league': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'teamProfile.console': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'teamProfile.country': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
    ],
  });
  const players = await Player.find({
    $or: [
      {
        first_name: {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        last_name: {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'profile_info.gamertag': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'profile_info.game': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'profile_info.team': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'profile_info.league': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'profile_info.position': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'profile_info.console': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
      {
        'profile_info.country': {
          $regex: req.body.search,
          $options: 'i',
        },
      },
    ],
  });

  if (teams.length === 0 && players.length === 0) {
    res.status(404);
    throw new Error(`No results found`);
  }
  res.status(200);
  res.json({ teams: teams, players: players });
});

const uploadPicture = asyncHandler(async (req, res) => {
  const file = req.file;
  const base64 = await imageToBase64(`./uploads/${file.filename}`) // Path to the image
    .then((response) => {
      // console.log(response); // "cGF0aC90by9maWxlLmpwZw=="
      fs.unlinkSync(`./uploads/${file.filename}`);
      return response;
    })
    .catch((error) => {
      console.error('err', err); // Logs an error if there was one
    });

  var options = {
    method: 'POST',
    url: 'https://imgur-apiv3.p.rapidapi.com/3/image',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Bearer ${process.env.IMGUR_AUTH}`,
      'x-rapidapi-host': `${process.env.X_RAPIDAPI_HOST}`,
      'x-rapidapi-key': `${process.env.X_RAPIDAPI_KEY}`,
    },
    data: `image=${encodeURIComponent(base64)}`,
  };

  await axios
    .request(options)
    .then(function (response) {
      res.status(200);
      console.log(response.data.data.link)
      res.json({ url: response.data.data.link });
    })
    .catch(function (error) {
      res.status(500);
      res.send(`image failed to upload, recommended size is 1.5MB`);
    });
});

const moveSection = asyncHandler(async (req, res) => {
  let { direction, section } = req.body;

  const player = await Player.findById(req.player._id);

  if (direction === 'up') {
    let currentTemplateIndex = player.templates.findIndex(
      (template) => template.section === section
    );
    let currentTemplateOrder = player.templates[currentTemplateIndex].order;
    // console.log(currentTemplateOrder);
    // let prevTemplateIndex = player.templates.findIndex(
    //   (template) =>
    //     template.order === player.templates[currentTemplateIndex].order - 1 &&
    //     template.show
    // );
    // for (var i = currentTemplateOrder; i < 0; i--)
    // player.templates.map((template) => {
    //   if (template.section === )
    // })
    // player.templates[currentTemplateIndex].order -= 1;
    // player.templates[prevTemplateIndex].order += 1;
    // player.save();
  }
  if (direction === 'down') {
    let currentTemplateIndex = player.templates.findIndex(
      (template) => template.section === section
    );
    let nextTemplateIndex = player.templates.findIndex(
      (template) =>
        template.order === player.templates[currentTemplateIndex].order + 1
    );
    player.templates[currentTemplateIndex].order += 1;
    player.templates[nextTemplateIndex].order -= 1;
    player.save();
  }
  res.status(200);
  res.json('success');
});

const findContact = asyncHandler(async (req, res) => {
  console.log('test');
  const player = await Player.find(
    {
      first_name: {
        $regex: req.body.search,
        $options: 'i',
      },
    },
    {
      last_name: {
        $regex: req.body.search,
        $options: 'i',
      },
    },
    {
      email: {
        $regex: req.body.search,
        $options: 'i',
      },
    }
  );

  console.log(player);
});

const getAllThemes = asyncHandler(async (req, res) => {
  const themes = await Theme.find({});
  if (themes) {
    res.status(200);
    res.json(themes);
  } else {
    res.status(404);
    res.json('no themes found');
  }
});

const getPlatforms = asyncHandler(async (req, res) => {
  const platforms = await Platform.find({});
  if (platforms) {
    res.status(200);
    res.json(platforms);
  } else {
    res.status(404);
    res.json('no platforms found');
  }
});

const getProfileCartegories = asyncHandler(async (req, res) => {
  const profileCategories = await ProfileCategory.find({});
  if (profileCategories) {
    res.status(200);
    res.json(profileCategories);
  } else {
    res.status(404);
    res.json('no profile categories found');
  }
});

const getGames = asyncHandler(async (req, res) => {
  const games = await Game.find({});
  if (games) {
    res.status(200);
    res.json(games);
  } else {
    res.status(404);
    res.json('no games found');
  }
});

const getGamePositions = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id);
  if (game) {
    res.status(200);
    res.json(game.position);
  } else {
    res.status(404);
    res.json('no game found with given id');
  }
});

export {
  getTeam,
  getPlayer,
  getLoggedInProfile,
  getTeamDashboard,
  getPlayerDashboard,
  getMyTeams,
  search,
  checkIfPlayerOnTeam,
  uploadPicture,
  moveSection,
  findContact,
  getAllThemes,
  getPlatforms,
  getProfileCartegories,
  getGames,
  getGamePositions,
};
