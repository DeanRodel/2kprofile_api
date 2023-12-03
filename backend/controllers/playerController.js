import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';
import gravatar from 'gravatar';
import fetch from 'node-fetch';
import fs from 'fs';
import instatouch from 'instatouch';
import Stripe from 'stripe';
import PlaylistSummary from 'youtube-playlist-summary';
import axios from 'axios';

import Player from '../models/playerModel.js';
import Team from '../models/teamModel.js';
import Game from '../models/gameModel.js';
import ProfileCategory from '../models/profileCategoryModel.js';
import Platform from '../models/platformModel.js';
import { platform } from 'os';

const oneSecond = 1 * 1 * 1 * 1000;
const oneMinute = 1 * 1 * 1 * 60000;
const oneDay = 1 * 24 * 60 * 60000;
const oneWeek = 7 * 24 * 60 * 60000;
const oneMonth = 31 * 24 * 60 * 60000;

const maxLength = 30;

const stripe = new Stripe('sk_test_zzdAejZmaUXNfgb8ODE1KbBG00RKtNgb2G', {
  apiVersion: '2020-08-27',
});

//Checks if a user deleting their account is the only admin of a team with more than 1 member.
async function checkDeleteAdmin(playerId) {
  //Find all teams where the current user is admin
  const allAdminTeams = await Team.find({
    roster: { $elemMatch: { _id: playerId, position: 'Admin' } },
  });

  //Find all teams where the current user is the only admin and contains other players
  let onlyAdminTeams = [];
  allAdminTeams.map((team) => {
    let numAdmins = 0;
    let numPlayers = 0;
    team.roster.map((member) => {
      numPlayers += 1;
      if (member.position === 'Admin') {
        numAdmins += 1;
      }
    });
    if (numAdmins === 1 && numPlayers > 1) {
      onlyAdminTeams.push(team.teamProfile.teamName);
    }
  });

  //Return a parsed error if user is only admin of a team with other players.
  let errorTeams = '';
  if (onlyAdminTeams.length > 0) {
    if (onlyAdminTeams.length > 1) {
      errorTeams = onlyAdminTeams.join(', ');
    } else {
      errorTeams = onlyAdminTeams.join();
    }
  }
  return errorTeams;
}

function containsDuplicates(a) {
  return new Set(a).size !== a.length;
}

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

// @desc   Set single profile_info for a player's game
// @route  PUT /api/players/:id
// @access Protect
const setProfileInfo = asyncHandler(async (req, res) => {
  if (req.body.first_name.length > maxLength) {
    res.status(400);
    throw new Error(`Your first name cannot be over ${maxLength} characters`);
  }
  if (req.body.last_name.length > maxLength) {
    res.status(400);
    throw new Error(`Your last name cannot be over ${maxLength} characters`);
  }

  if (req.body.gamertag.length > maxLength) {
    res.status(400);
    throw new Error(`Your Gamertag cannot be over ${maxLength} characters`);
  }
  if (req.body.league.length > maxLength) {
    res.status(400);
    throw new Error(`Your League cannot be over ${maxLength} characters`);
  }

  if (
    !req.body.first_name.match(/^[a-zA-Z-\s]*$/) ||
    !req.body.last_name.match(/^[a-zA-Z-\s]*$/)
  ) {
    res.status(400);
    throw new Error('Only letters are allowed in your name');
  }

  if (
    (req.body.first_name.match(/ /g) || []).length > 0 ||
    (req.body.last_name.match(/ /g) || []).length > 0
  ) {
    res.status(400);
    throw new Error('Please do not use any spaces in your name');
  }

  if (req.body.console) {
    const entity = await Platform.findOne({ name: req.body.console });
    if (!entity) {
      res.status(400);
      throw new Error(`Selected platform "${req.body.console}" is not valid.`);
    }
  }

  if (req.body.category) {
    const entity = await ProfileCategory.findOne({ name: req.body.category });
    if (!entity) {
      res.status(400);
      throw new Error(`Selected category "${req.body.category}" is not valid.`);
    }
  }

  if (req.body.game) {
    const entity = await Game.findOne({ name: req.body.game });
    if (!entity) {
      res.status(400);
      throw new Error(`Selected game "${req.body.game}" is not valid.`);
    }

    if (req.body.gamePosition) {
      const pos = entity.position.includes(req.body.gamePosition);
      if (!pos) {
        res.status(400);
        throw new Error(
          `Selected game position "${req.body.gamePosition}" is not valid.`
        );
      }
    }
  }

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      $set: {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        gravatar: req.body.gravatar,
        profile_info: {
          ...req.body,
        },
      },
    }
  );

  const player = await Player.findById(req.player._id);

  res.status(200);

  return res.json({
    success: 'Your profile has been successfully updated',
    player: player,
  });
});

// @desc   Set single profile_info for a player's game
// @route  PUT /api/players/:id
// @access Protect
const updateBio = asyncHandler(async (req, res) => {
  //Find profile inside player
  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      $set: {
        biography: {
          ...req.body,
        },
      },
    }
  );

  const player = await Player.findById(req.player._id);

  res.status(200);
  return res.json({
    success: 'Your biography has been successfully updated',
    player: player,
  });
});

// @desc   Set single profile_info for a player's game
// @route  PUT /api/players/:id
// @access Protect
const updateContact = asyncHandler(async (req, res) => {
  //Find profile inside player
  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      $set: {
        contact: {
          ...req.body,
        },
      },
    }
  );

  const player = await Player.findById(req.player._id);

  res.status(200);
  return res.json({
    success: 'Your contact info has been successfully updated',
    player: player,
  });
});

const setUsername = asyncHandler(async (req, res) => {
  if (
    !req.body.username.match(
      /^(?=.{8,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/
    )
  ) {
    res.status(400);
    throw new Error(
      'Please enter a username between 8 - 20 characters with only letters and numbers'
    );
  }

  let pattern = /[^A-Za-z0-9]+/;

  if (req.body.username.match(pattern)) {
    res.status(400);
    throw new Error(
      'Please enter a username between 8 - 20 characters with only letters and numbers'
    );
  }

  const playerExists = await Player.findOne({
    username: { $regex: `^${req.body.username}$`, $options: 'i' },
  });
  if (playerExists) {
    if (playerExists.username === req.player.username) {
      res.status(400);
      throw new Error('Please enter a different username.');
    } else {
      res.status(400);
      throw new Error('Sorry a player with this username already exists.');
    }
  }

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      $set: {
        username: req.body.username,
        slug: req.body.username,
      },
    }
  );

  res.status(200);
  return res.json('Your username has been updated!');
});

const setEmail = asyncHandler(async (req, res) => {
  const validRegex =
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  if (!validRegex.test(req.body.email)) {
    res.status(400);
    throw new Error('Please enter a valid email.');
  }

  const playerExists = await Player.findOne({
    email: { $regex: `^${req.body.email}$`, $options: 'i' },
  });
  if (playerExists) {
    if (playerExists.email === req.player.email) {
      res.status(400);
      throw new Error('Please enter a different email.');
    } else {
      res.status(400);
      throw new Error('Sorry a player with this email already exists.');
    }
  }
  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      $set: {
        email: req.body.email,
      },
    }
  );

  res.status(200);
  return res.json('Your email has been updated!');
});

const setPassword = asyncHandler(async (req, res) => {
  //Find profile inside player

  if (req.body.password.length < 8) {
    res.status(400);
    throw new Error('Please enter at least 8 characters.');
  }

  if (!validRegex.test(req.body.password)) {
    res.status(400);
    throw new Error(
      'Please enter a combination of numbers, alphabets, uppercase characters and symbols.'
    );
  }

  const validRegex = RegExp(
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'
  );

  const salt = await bcrypt.genSalt(10);
  let password = await bcrypt.hash(req.body.password, salt);

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      $set: {
        password: password,
      },
    }
  );

  res.status(200);
  return res.json('Your password has been updated!');
});

const searchForPlayerToInvite = asyncHandler(async (req, res) => {
  if (req.body.search.length < 2) {
    res.status(400);
    throw new Error('Please enter at least 2 characters');
  }

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

  if (players.length === 0) {
    res.status(404);
    throw new Error('Player does not exist.');
  }

  res.status(200);
  res.json({ players: players });
});

const getTeamInvites = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);
  const invites = player.rosterInvites;
  res.status(200);
  return res.json(invites);
});

const sendTeamInvite = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.body.player);
  const team = await Team.findById(req.body.team);

  //Check if player exists
  if (!player) {
    res.status(404);
    throw new Error('Player does not exist.');
  }

  //Check if player has already been invited
  const inviteExists = await Player.findOne(
    { _id: req.body.player },
    { rosterInvites: { $elemMatch: { team: req.body.team } } }
  );
  if (inviteExists.rosterInvites.length > 0) {
    res.status(401);
    throw new Error('Player has already been invited');
  }

  //Check if player is already on the team
  const playerAlreadyOnTeam = await Team.findOne(
    { _id: req.body.team },
    { roster: { $elemMatch: { _id: req.body.player } } }
  );
  if (playerAlreadyOnTeam.roster.length > 0) {
    res.status(401);
    throw new Error('Player is already on the team.');
  }

  //Check if player sending invite is on team and has permission
  const reqPlayer = await Team.findOne(
    { _id: req.body.team },
    { roster: { $elemMatch: { _id: req.player._id } } }
  );
  if (reqPlayer.roster.length === 0) {
    res.status(400);
    throw new Error('You are not part of this team.');
  }
  if (reqPlayer.roster[0].position === 'Player') {
    res.status(400);
    throw new Error('Only managers and higher can invite players.');
  }

  const htmlMessage = await fs.readFileSync(
    './backend/email/emailteaminvitenew.html',
    'binary'
  );

  await sendEmail({
    email: player.email,
    subject: `CHECK IT OUT! Your Team is Calling!`,
    html: htmlMessage,
  });

  await Player.findOneAndUpdate(
    {
      _id: req.body.player,
    },
    {
      $addToSet: {
        rosterInvites: {
          team: req.body.team,
          name: team.teamProfile.teamName,
          teamTag: team.teamProfile.teamTag,
          game: team.teamProfile.game,
          console: team.teamProfile.console,
          message: req.body.message,
        },
      },
    }
  );
  res.status(200).json('Player has been invited');
});

const acceptTeamInvite = asyncHandler(async (req, res) => {
  const player = await Player.findOne({ _id: req.player._id });

  //Check if player has invite
  const inviteExists = await Player.findOne(
    { _id: req.player._id },
    { rosterInvites: { $elemMatch: { team: req.body.team } } }
  );
  if (inviteExists.rosterInvites.length === 0) {
    res.status(401);
    throw new Error('Player has not been invited to this team.');
  }

  await Player.updateOne(
    { _id: req.player._id },
    {
      $pull: { rosterInvites: { team: req.body.team } },
    }
  );

  const name = player.first_name + ' ' + player.last_name;

  await Team.updateOne(
    {
      _id: req.body.team,
    },
    {
      $addToSet: {
        roster: {
          _id: req.player._id,
          name: name,
          position: 'Player',
          slug: player.slug,
          gravatar: player.gravatar,
        },
      },
    }
  );

  const teams = await Team.find({
    roster: { $elemMatch: { _id: req.player._id } },
  });

  const returnPlayer = await Player.findOne({ _id: req.player._id });

  res.status(200);
  return res.json({
    success: 'Invite accepted',
    teams: teams,
    player: returnPlayer,
  });
});

const deleteTeamInvite = asyncHandler(async (req, res) => {
  // Add error handling to check if player deleting invite is req.player
  await Player.updateOne(
    { _id: req.player._id },
    {
      $pull: { rosterInvites: { team: req.body.team } },
    }
  );

  const player = await Player.findOne({ _id: req.player._id });

  res.status(200);
  return res.json({ success: 'Invite removed', player: player });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);

  if (player.stripe.subscription !== '') {
    const subscription = await stripe.subscriptions.retrieve(
      player.stripe.subscription
    );

    if (subscription.cancel_at_period_end === false) {
      res.status(401);
      throw new Error(
        `You are currently still subscribed to a plan. Please cancel your membership before deleting your account.`
      );
    }
  }

  let errorTeams = await checkDeleteAdmin(req.player._id);
  if ((await errorTeams) !== '') {
    res.status(401);
    throw new Error(
      `You are currently the only admin of ${errorTeams}. Please make someone else admin before deleting your account.`
    );
  }

  //Remove user from the roster of all their teams.
  await Team.updateMany(
    { roster: { $elemMatch: { _id: req.player._id } } },
    { $pull: { roster: { _id: req.player._id } } },
    { multi: true }
  );

  //Delete all teams with an empty roster (current user is only member and admin)
  await Team.deleteMany({ roster: { $size: 0 } });

  //Delete player
  await Player.deleteOne({ _id: req.player._id });

  res.status(200);
  return res.json('Player deleted.');
});

const updateSocialMedia = asyncHandler(async (req, res) => {
  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      $set: { social_media: req.body },
    }
  );

  const player = await Player.findById(req.player._id);

  res.status(200);
  res.json({ success: 'Successfully updated.', account: player });
});

const contactMe = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.params.id);
  const message = `${req.body.message} \n\nFrom: \n${req.body.name} \n${req.body.email} `;

  await sendEmail({
    email: player.contact.email,
    subject: `New message from ${req.body.name}!`,
    text: '',
    html: message,
  });

  return res.json('Your message has been sent!');
});

const changeTemplate = asyncHandler(async (req, res) => {
  const player = await Player.findOne(
    {
      _id: req.player._id,
    },
    'templates'
  );

  const sections = req.body;
  let order = [];
  sections.map((section) => {
    order.push(section.order);
  });
  if (containsDuplicates(order)) {
    res.status(401);
    throw new Error(`Oops two (or more) of your sections have the same order`);
  }

  player.templates.map((template) => {
    sections.map((section) => {
      if (template.section === section.section) {
        template.template = section.template;
        template.order = section.order;
        template.customTemplate = section.customTemplate;
      }
    });
  });

  player.save();
  return res.json('Your profile has been successfully changed');
});

const addGravatar = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);
  let url = gravatar.url(player.email);

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      gravatar: url,
    }
  );

  const teams = await Team.find({
    roster: { $elemMatch: { _id: req.player._id } },
  });

  teams.map((team) => {
    team.roster.map((member) => {
      if (member.slug == player.slug) {
        member.gravatar = url;
      }
    });
    team.save();
  });

  res.status(200);
  res.json(url);
});

const removeGravatar = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);
  let url = '//www.gravatar.com/avatar/84aad248e0c12d0d3e4513177a510e0d';

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      gravatar: url,
    }
  );

  const teams = await Team.find({
    roster: { $elemMatch: { _id: req.player._id } },
  });

  teams.map((team) => {
    team.roster.map((member) => {
      if (member.slug == player.slug) {
        member.gravatar = url;
      }
    });
    team.save();
  });

  res.status(200);
  res.json(url);
});

const updateStore = asyncHandler(async (req, res) => {
  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      storeId: req.body.storeId,
    }
  );

  const player = await Player.findById(req.player._id);

  res.status(200);
  res.json({
    success: 'Your store has been successfully updated',
    player: player,
  });
});

const updateStream = asyncHandler(async (req, res) => {
  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      stream: req.body,
    }
  );

  const player = await Player.findById(req.player._id);

  res.status(200);
  res.json({
    success: 'Your stream has been successfully updated',
    player: player,
  });
});

const updateDivider = asyncHandler(async (req, res) => {
  //removed name update from set, images are updated directly now on theme.
  await Player.updateOne(
    { _id: req.player._id },
    {
      $set: { pattern: req.body.divider },
    }
  );
  const player = await Player.findById(req.player._id);

  res.status(200);
  res.json({ success: 'Your profile has been updated', player: player });
});

const updateBanner = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);
  if (req.body.index) {
    player.theme.banner[req.body.index] = '';
    player.markModified('theme');
    player.save();

    res.status(200);
    res.json({ player: player });
  } else {
    res.status(404);
    res.json('failed to delete image');
  }
});

const updateTheme = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);
  if (req.body.customTheme) {
    if (req.body.customTheme.background) {
      player.theme.background = [req.body.customTheme.background];
      player.theme.name = '';
    }
    if (req.body.customTheme.banner) {
      const index = player.theme.banner.indexOf(req.body.customTheme.orgImage);
      player.theme.banner[index] = req.body.customTheme.banner;
      player.theme.name = '';
    }
  } else {
    player.theme = req.body.theme;
  }
  player.markModified('theme');
  player.save();

  res.status(200);
  res.json('Your theme has been changed');
});

const updatePhotos = asyncHandler(async (req, res) => {
  let link = req.body.link;

  if (req.body.link === '') {
    res.status(401);
    throw new Error(
      'There was a problem uploading your photo, please try again.'
    );
  }

  //Fetch link of each photo if imgur gallery/album
  if (link.includes('/a/') || link.includes('/gallery')) {
    let id;
    if (link.includes('/a/')) {
      id = link.split('/a/')[1];
    }
    if (link.includes('/gallery/')) {
      id = link.split('/gallery/')[1];
    }

    var options = {
      method: 'GET',
      url: `https://imgur-apiv3.p.rapidapi.com/3/gallery/album/${id}`,
      headers: {
        authorization: `Bearer ${process.env.IMGUR_AUTH}`,
        'x-rapidapi-host': `${process.env.X_RAPIDAPI_HOST}`,
        'x-rapidapi-key': `${process.env.X_RAPIDAPI_KEY}`,
      },
    };

    const links = await axios
      .request(options)
      .then(function (response) {
        let links = [];
        response.data.data.images.map((image) => {
          links.push(image.link);
        });
        return links;
      })
      .catch(function (error) {
        console.error(error);
      });

    await Player.updateOne(
      {
        _id: req.player._id,
      },
      {
        $push: { photos: links },
      }
    );
  } else {
    //Add .jpg to url if not included (single image)
    if (!link.includes('.jpg') && !link.includes('.png')) {
      link = link.concat('.jpg');
    }
    await Player.updateOne(
      {
        _id: req.player._id,
      },
      {
        $push: { photos: link },
      }
    );
  }

  const player = await Player.findById(req.player._id);

  res.status(200);
  res.json({
    success: 'Your photo(s) have been uploaded!',
    photos: player.photos,
    player: player,
  });
});

const deletePhoto = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);
  let newPhotos = player.photos.filter((photo) => photo !== req.body.photo);
  player.photos = newPhotos;
  player.save();
  res.status(200);
  res.json('Your photo(s) have been deleted!');
});

const updateVideos = asyncHandler(async (req, res) => {
  let { url } = req.body;
  const link = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${url}&key=${process.env.GOOGLE_API_KEY}`;
  let response = await fetch(link);
  const data = await response.json();

  if (data.pageInfo.totalResults === 0) {
    res.status(401);
    throw new Error(
      `There was an issue fetching your videos. Please try again.`
    );
  }

  const PLAY_LIST_ID = data.items[0].contentDetails.relatedPlaylists.uploads;

  const config = {
    GOOGLE_API_KEY: `${process.env.GOOGLE_API_KEY}`, // require
    PLAYLIST_ITEM_KEY: [
      'publishedAt',
      'title',
      'description',
      'videoId',
      'videoUrl',
    ], // option
  };

  const ps = new PlaylistSummary(config);

  let videos = [];
  await ps
    .getPlaylistItems(PLAY_LIST_ID)
    .then((result) => {
      // console.log(result);
      result.items.map((video) => {
        videos.push(video.videoUrl);
      });
    })
    .catch((error) => {
      console.error(error);
    });

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      $set: { videos: videos },
    }
  );

  const player = await Player.findById(req.player._id);

  res.status(200);
  res.json({
    success: 'Your playlist has been added!',
    videos: player.videos,
    player: player,
  });
});

const deleteVideo = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);
  let { video } = req.body;
  const index = player.videos.findIndex((e) => e === video);
  player.videos.splice(index, 1);
  player.save();
  res.status(200);
  res.json('Your video(s) have been deleted!');
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  // setTimeout(()=> console.log(req),10000);
  // console.log(req.body)
  // console.log(req.file)
  const file = req.file;
  try {
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

    const url = await axios.request(options).then(function (response) {
      return response.data.data.lin;
    });

    await Player.updateOne(
      {
        _id: req.player._id,
      },
      {
        gravatar: url,
      }
    );
    res.status(200);
    res.json({ url: url });
  } catch (err) {
    res.status(401);
    throw new Error(
      `There was an issue changing your profile picture. Please try again`
    );
  }
});

const addInstagram = asyncHandler(async (req, res) => {
  const options = {
    count: 50, //How many posts to scrape
    session: 'sessionid=244974324%3A95TH1nsB1ABuF3%3A6',
  };

  let photos = [];
  await instatouch
    .user('javascript.js', options)
    .then((result) => {
      const images = result.collector;
      // images.map((image) => {
      //   console.log(image);
      // });
    })
    .catch((err) => {
      throw new Error(
        `There was an issue fetching your instagram. Please try again`
      );
    });
  // console.log(photos);
  // await Player.updateOne(
  //   {
  //     _id: req.player._id,
  //   },
  //   {
  //     $push: { photos: photos },
  //   }
  // );
  res.status(200);
  res.json('Your photos have been updated!');
});

const toggleSection = asyncHandler(async (req, res) => {
  let section = req.body.section;
  const player = await Player.findOne({ _id: req.player._id });
  let index = player.templates.findIndex(
    (template) => template.section === section
  );
  player.templates[index].show = req.body.value;
  player.save();
  res.status(200);
  res.json('Your section has been updated!');
});

const upgradeAccount = asyncHandler(async (req, res) => {
  var timeObject = new Date();
  timeObject.setTime(timeObject.getTime() + oneMonth);

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      'membership.tier': req.body.tier,
      'membership.expire': timeObject,
    }
  );
  res.status(200);
  res.json('Your account has been upgraded!');
});

const updateSponsors = asyncHandler(async (req, res) => {
  let sponsors = req.body;
  sponsors.map((sponsor) => {
    if (sponsor.website.includes('https://') === false) {
      throw new Error(
        `Please make sure all your URLs contain the full link (including https://)`
      );
    }
  });

  await Player.updateOne(
    { _id: req.player._id },
    {
      sponsors: req.body,
    }
  );

  const player = await Player.findById(req.player._id);

  res.status(200);
  res.json({ success: 'Your sponsors have been updated', player: player });
});

const handleSubmitSub = asyncHandler(async (req, res) => {
  const { email, payment_method, item } = req.body;

  const customer = await stripe.customers.create({
    payment_method: payment_method,
    email: email,
    invoice_settings: {
      default_payment_method: payment_method,
    },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: item }],
    expand: ['latest_invoice.payment_intent'],
  });

  let plan = '';

  if (
    item === 'price_1IiYbiHFO4iy8rqGT0dCycEZ' ||
    item === 'price_1IiYbiHFO4iy8rqGphBwr7Ym'
  ) {
    plan = 'Silver';
  }
  if (
    item === 'price_1IiYblHFO4iy8rqGo1hYgzd6' ||
    item === 'price_1IiYblHFO4iy8rqGmYgmnHWH'
  ) {
    plan = 'Gold';
  }
  if (
    item === 'price_1IiYbtHFO4iy8rqG0kIzrugr' ||
    item === 'price_1IiYbtHFO4iy8rqGf5XO1Qjw'
  ) {
    plan = 'Platinum';
  }

  const status = subscription['latest_invoice']['payment_intent']['status'];
  const client_secret =
    subscription['latest_invoice']['payment_intent']['client_secret'];

  console.log(subscription);

  await Player.updateOne(
    { _id: req.player._id },
    {
      stripe: {
        id: subscription.id,
        customer: subscription.customer,
        current_period_end: subscription.current_period_end,
      },
      'membership.tier': plan,
    }
  );

  res.json({ client_secret: client_secret, status: status });
});

const getYoutubePlaylist = asyncHandler(async (req, res) => {
  let { url } = req.body;
  const link = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername=${url}&key=${process.env.GOOGLE_API_KEY}`;
  let response = await fetch(link);
  const data = await response.json();

  const PLAY_LIST_ID = data.items[0].contentDetails.relatedPlaylists.uploads;

  const config = {
    GOOGLE_API_KEY: `${process.env.GOOGLE_API_KEY}`, // require
    PLAYLIST_ITEM_KEY: [
      'publishedAt',
      'title',
      'description',
      'videoId',
      'videoUrl',
    ], // option
  };

  const ps = new PlaylistSummary(config);

  let videos = [];
  await ps
    .getPlaylistItems(PLAY_LIST_ID)
    .then((result) => {
      // console.log(result);
      result.items.map((video) => {
        videos.push(video.videoUrl);
      });
    })
    .catch((error) => {
      console.error(error);
    });

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      $set: { videos: videos },
    }
  );

  res.status(200);
  res.json('Your playlist has been added!');
});

const setDefaultStat = asyncHandler(async (req, res) => {
  let { game } = req.body;

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      'stats.default': game,
    }
  );

  const player = await Player.findById(req.player._id);
  res.status(200);
  res.json({ player: player });
});

const removeStat = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);
  let removeGame = req.body.game;

  let games = player.stats.games;

  games.splice(
    games.findIndex((game) => game === removeGame),
    1
  );

  let defaultStat = player.stats.default;

  if (defaultStat === removeGame) {
    defaultStat = '';
  }

  await Player.updateOne(
    {
      _id: req.player._id,
    },
    {
      'stats.games': games,
      'stats.default': defaultStat,
    }
  );

  const returnPlayer = await Player.findById(req.player._id);
  res.status(200);
  res.json({ player: returnPlayer });
});

const addDiscord = asyncHandler(async (req, res) => {
  await Player.updateOne(
    { _id: req.player._id },
    {
      'social_media.discordWidget': req.body.discordWidget,
    }
  );

  const player = await Player.findById(req.player._id);
  res.status(200);
  res.json({ success: 'Your discord has been added!', player: player });
});

const createCustomerPortalSession = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player._id);

  const session = await stripe.billingPortal.sessions.create({
    customer: player.stripe.customer,
  });

  res.status(200);
  res.json({ url: session.url });
  // res.redirect(session.url);
});

const createCheckoutSession = asyncHandler(async (req, res) => {
  const { priceId } = req.body;

  console.log(priceId);

  let session;

  const player = await Player.findById(req.player._id);

  if (player.stripe.customer !== '') {
    session = await stripe.billingPortal.sessions.create({
      customer: player.stripe.customer,
    });
  } else {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      client_reference_id: req.player._id.toString(),
      success_url:
        'https://example.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/canceled.html',
    });
  }

  res.status(200);
  res.json({ url: session.url });
  // res.redirect(303, session.url);
});

const updateStripeSubscription = asyncHandler(async (req, res) => {
  const sub_id = req.body.subscription;

  console.log(sub_id);

  let delay = (oneMinute * 5) / 1000;

  let trial_end = Date.now() / 1000 + delay;
  trial_end = Math.round(trial_end);

  const subscription = await stripe.subscriptions.update(sub_id, {
    trial_end: trial_end,
  });

  console.log(subscription);

  res.status(200);
  res.json('success');
});

export {
  setProfileInfo,
  updateBio,
  updateContact,
  setEmail,
  setUsername,
  setPassword,
  searchForPlayerToInvite,
  getTeamInvites,
  sendTeamInvite,
  acceptTeamInvite,
  deleteTeamInvite,
  deleteAccount,
  updateSocialMedia,
  contactMe,
  changeTemplate,
  addGravatar,
  removeGravatar,
  updateStore,
  updateStream,
  updateTheme,
  updatePhotos,
  deletePhoto,
  updateVideos,
  deleteVideo,
  updateProfilePicture,
  addInstagram,
  toggleSection,
  upgradeAccount,
  updateSponsors,
  updateDivider,
  handleSubmitSub,
  getYoutubePlaylist,
  setDefaultStat,
  updateBanner,
  removeStat,
  addDiscord,
  createCustomerPortalSession,
  createCheckoutSession,
  updateStripeSubscription,
};
