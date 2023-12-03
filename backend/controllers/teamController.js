import asyncHandler from 'express-async-handler';
import slugify from 'slugify';
import gravatar from 'gravatar';
import fs from 'fs';
import sendEmail from '../utils/sendEmail.js';
import fetch from 'node-fetch';
import Stripe from 'stripe';
import PlaylistSummary from 'youtube-playlist-summary';
import axios from 'axios';

import Team from '../models/teamModel.js';
import Player from '../models/playerModel.js';

const maxLength = 30;

const stripe = new Stripe('sk_test_zzdAejZmaUXNfgb8ODE1KbBG00RKtNgb2G', {
  apiVersion: '2020-08-27',
});

function containsDuplicates(a) {
  return new Set(a).size !== a.length;
}

// @desc   Create new team
// @route  POST /api/teams
// @access Private
const createTeam = asyncHandler(async (req, res) => {
  const teamExists = await Team.findOne({
    'teamProfile.teamName': { $regex: `^${req.body.teamName}$`, $options: 'i' },
  });

  let pattern = /[^A-Za-z0-9 ]+/;

  if (req.body.teamName.match(pattern)) {
    res.status(400);
    throw new Error(`Your team name can only contain numbers and letters.`);
  }

  if (req.body.teamTag.length > maxLength) {
    res.status(400);
    throw new Error(`Your Team Tag cannot be over ${maxLength} characters`);
  }
  if (req.body.team.length > maxLength) {
    res.status(400);
    throw new Error(`Your Team cannot be over ${maxLength} characters`);
  }
  if (req.body.league.length > maxLength) {
    res.status(400);
    throw new Error(`Your League cannot be over ${maxLength} characters`);
  }
  if (req.body.console.length > maxLength) {
    res.status(400);
    throw new Error(`Your Console cannot be over ${maxLength} characters`);
  }

  if (teamExists) {
    res.status(401);
    throw new Error(
      `${req.body.teamName} already exists. Please pick a different name. `
    );
  }

  const player = await Player.findOne({ _id: req.player._id });
  const name = player.first_name + ' ' + player.last_name;

  const team = await Team.create({
    roster: [
      {
        _id: req.player._id,
        name: name,
        position: 'Admin',
        slug: player.slug,
        gravatar: player.gravatar,
      },
    ],
    teamProfile: req.body,
    slug: slugify(req.body.teamName, { lower: true }),
  });
  res.status(200);
  res.json({ slug: team.slug });
});

const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id });

  if (team.stripe.subscription !== '') {
    const subscription = await stripe.subscriptions.retrieve(
      team.stripe.subscription
    );
    if (subscription.cancel_at_period_end === false) {
      res.status(401);
      throw new Error(
        `You are currently still subscribed to a plan. Please cancel your membership before deleting your team.`
      );
    }
  }

  // Remove all roster invites from players
  const invitePlayers = await Player.find({
    'rosterInvites.team': req.params.id,
  });

  invitePlayers.map((player) => {
    let index = 0;
    player.rosterInvites.map((invite) => {
      if (req.params.id == invite.team) {
        player.rosterInvites.splice(index, 1);
      }
      index += 1;
    });
    player.save();
  });

  // Remove team and position from profile info of players
  await Player.updateMany(
    {
      'profile_info.team': team.teamProfile.teamName,
    },
    { $set: { 'profile_info.team': '', 'profile_info.position': '' } }
  );

  await Team.deleteOne({ _id: req.params.id });

  res.status(200);
  res.json('success');
});

const isAdmin = asyncHandler(async (req, res) => {
  const player = await Player.findOne({ _id: req.player._id });
  const team = await Team.findOne({
    slug: req.params.slug,
  });
  const pos = team.roster.filter((r) => r._id.equals(player._id));
  if (pos[0].position === 'Admin') {
    res.status(200);
  } else {
    res.status(401);
  }
  res.json(pos.position);
});

const updateTeam = asyncHandler(async (req, res) => {
  if (req.body.teamProfile.teamName === '') {
    res.status(401);
    throw new Error(`Please enter a field in team name `);
  }

  if (req.body.teamProfile.teamTag.length > maxLength) {
    res.status(400);
    throw new Error(`Your Team Tag cannot be over ${maxLength} characters`);
  }
  if (req.body.teamProfile.team.length > maxLength) {
    res.status(400);
    throw new Error(`Your Team cannot be over ${maxLength} characters`);
  }
  if (req.body.teamProfile.league.length > maxLength) {
    res.status(400);
    throw new Error(`Your League cannot be over ${maxLength} characters`);
  }
  if (req.body.teamProfile.console.length > maxLength) {
    res.status(400);
    throw new Error(`Your Console cannot be over ${maxLength} characters`);
  }

  const teamExists = await Team.findOne({
    'teamProfile.teamName': {
      $regex: `^${req.body.teamProfile.teamName}$`,
      $options: 'i',
    },
  });

  if (
    teamExists &&
    teamExists.teamProfile.teamName !== req.body.teamProfile.teamName
  ) {
    res.status(401);
    throw new Error(
      `${req.body.teamProfile.teamName} already exists. Please pick a different name. `
    );
  }

  const reqPlayer = await Team.findOne(
    { _id: req.params.id },
    { roster: { $elemMatch: { _id: req.player._id } } }
  );

  const team = await Team.findOne({ _id: req.params.id });

  let reqPlayerPosition = reqPlayer.roster[0].position;
  if (
    team.teamProfile.teamName !== req.body.teamProfile.teamName &&
    reqPlayerPosition !== 'Admin'
  ) {
    res.status(401);
    throw new Error(`Only the admin can change the team name.`);
  }

  await Team.updateOne(
    { _id: req.params.id },
    {
      $set: {
        teamProfile: req.body.teamProfile,
        gravatar: req.body.gravatar,
      },
    }
  );

  const team2 = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Team successfully updated', team: team2 });
});

const updateBio = asyncHandler(async (req, res) => {
  await Team.updateOne(
    { _id: req.params.id },
    {
      $set: {
        biography: {
          ...req.body,
        },
      },
    }
  );

  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Biography successfully updated', team: team });
});

const updateContact = asyncHandler(async (req, res) => {
  await Team.updateOne(
    { _id: req.params.id },
    {
      $set: {
        contact: {
          ...req.body,
        },
      },
    }
  );
  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Contact successfully updated', team: team });
});

const removePlayerFromTeam = asyncHandler(async (req, res) => {
  const reqPlayer = await Team.findOne(
    { _id: req.params.id },
    { roster: { $elemMatch: { _id: req.player._id } } }
  );

  const delPlayer = await Team.findOne(
    { _id: req.params.id },
    { roster: { $elemMatch: { _id: req.body.player } } }
  );

  //Check if user is removing themselves
  if (req.player._id == req.body.player) {
    res.status(401);
    throw new Error(
      'You cannot delete yourself. Please use the leave team option instead.'
    );
  }

  let reqPlayerPosition = reqPlayer.roster[0].position;
  let delPlayerPosition = delPlayer.roster[0].position;

  // Check if coach is removing an admin, manager or coach
  if (
    (reqPlayerPosition === 'Coach' && delPlayerPosition === 'Admin') ||
    (reqPlayerPosition === 'Coach' && delPlayerPosition === 'Manager') ||
    (reqPlayerPosition === 'Coach' && delPlayerPosition === 'Coach')
  ) {
    res.status(401);
    throw new Error('You cannot delete coaches, managers or admins.');
  }

  // Check if manager is removing an admin or manager
  if (
    (reqPlayerPosition === 'Manager' && delPlayerPosition === 'Admin') ||
    (reqPlayerPosition === 'Manager' && delPlayerPosition === 'Manager')
  ) {
    res.status(401);
    throw new Error('You cannot delete managers or admins.');
  }

  // Check if admin is removing an admin
  if (reqPlayerPosition === 'Admin' && delPlayerPosition === 'Admin') {
    res.status(401);
    throw new Error('You cannot delete admins.');
  }

  await Team.updateOne(
    {
      _id: req.params.id,
    },
    {
      $pull: { roster: { _id: req.body.player } },
    }
  );

  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Player has been removed from the team', team: team });
});

const leaveTeam = asyncHandler(async (req, res) => {
  // Check if user is only admin in a team with more than 1 players.
  const adminTeam = await Team.findOne({
    _id: req.params.id,
    roster: { $elemMatch: { _id: req.player._id, position: 'Admin' } },
  });

  if (adminTeam !== null) {
    let numAdmins = 0;
    let numPlayers = 0;
    adminTeam.roster.map((member) => {
      numPlayers += 1;
      if (member.position === 'Admin') {
        numAdmins += 1;
      }
    });
    if (numAdmins < 2 && numPlayers > 1) {
      res.status(401);
      throw new Error(
        `You are currently the only admin. Please make someone else admin before leaving the team.`
      );
    }
  }

  // Remove team and position from profile info if current team
  const team = await Team.findOne({ _id: req.params.id });
  await Player.updateOne(
    {
      'profile_info.team': team.teamProfile.teamName,
    },
    { $set: { 'profile_info.team': '', 'profile_info.position': '' } }
  );

  // Remove user from the roster
  await Team.updateOne(
    {
      _id: req.params.id,
    },
    {
      $pull: { roster: { _id: req.player._id } },
    }
  );
  res.status(200);
  res.json('You have successfully left the team');
});

const updateSocialMedia = asyncHandler(async (req, res) => {
  await Team.updateOne(
    {
      _id: req.params.id,
    },
    {
      $set: { social_media: req.body },
    }
  );

  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Successfully updated.', account: team });
});

const changeRole = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id });

  const reqPlayer = await Team.findOne(
    { _id: req.params.id },
    { roster: { $elemMatch: { _id: req.player._id } } }
  );
  const changePlayer = await Team.findOne(
    { _id: req.params.id },
    { roster: { $elemMatch: { _id: req.body.player } } }
  );

  let reqPlayerPosition = reqPlayer.roster[0].position;
  let changePlayerPosition = changePlayer.roster[0].position;

  // Check if coach is changing the role of a coach, manager or admin
  if (
    reqPlayerPosition === 'Coach' &&
    (changePlayerPosition === 'Admin' ||
      changePlayerPosition === 'Manager' ||
      changePlayerPosition === 'Coach')
  ) {
    // Only let coaches change their own role to a lower position
    if (req.player._id != req.body.player) {
      res.status(401);
      throw new Error(
        'You cannot change the position of other coaches, managers or admins.'
      );
    }
  }

  // Check if coach is making another player manager or admin
  if (
    reqPlayerPosition === 'Coach' &&
    (req.body.role === 'Admin' || req.body.role === 'Manager')
  ) {
    res.status(401);
    throw new Error('You cannot make players managers or admins.');
  }

  // Check if manager is changing the role of a manager or admin
  if (
    reqPlayerPosition === 'Manager' &&
    (changePlayerPosition === 'Admin' || changePlayerPosition === 'Manager')
  ) {
    // Only let managers change their own role to a lower position
    if (req.player._id != req.body.player) {
      res.status(401);
      throw new Error(
        'You cannot change the position of other managers or admins.'
      );
    }
  }

  // Check if manager is making another player admin
  if (reqPlayerPosition === 'Manager' && req.body.role === 'Admin') {
    res.status(401);
    throw new Error('You cannot make players admins.');
  }

  // Check if admin is changing the role of another admin
  if (reqPlayerPosition === 'Admin' && changePlayerPosition === 'Admin') {
    // Only let admins change their own role to a lower position
    if (req.player._id != req.body.player) {
      res.status(401);
      throw new Error('You cannot change the position of other admins.');
    }
  }

  // Check if user is the only admin and changing their own role.
  if (
    reqPlayerPosition === 'Admin' &&
    req.body.role !== 'Admin' &&
    req.player._id == req.body.player
  ) {
    let numAdmins = 0;
    team.roster.map((member) => {
      if (member.position === 'Admin') {
        numAdmins += 1;
      }
    });
    if (numAdmins < 2) {
      res.status(401);
      throw new Error(
        `You are currently the only admin. Please make someone else admin before changing your role.`
      );
    }
  }

  // Change player's position in profile info if their profile info is set to current team
  await Player.updateOne(
    {
      'profile_info.team': team.teamProfile.teamName,
    },
    { $set: { 'profile_info.position': req.body.role } }
  );

  await Team.updateOne(
    { _id: req.params.id, 'roster._id': req.body.player },
    { 'roster.$.position': req.body.role }
  );

  const updatedTeam = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Player role has been updated.', team: updatedTeam });
});

const contactUs = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  const message = `${req.body.message} \n\nFrom: \n${req.body.name} \n${req.body.email} `;

  await sendEmail({
    email: team.contact.email,
    subject: `New message from ${req.body.name}!`,
    text: '',
    html: message,
  });

  return res.json('Your message has been sent!');
});

const changeTemplate = asyncHandler(async (req, res) => {
  const team = await Team.findOne(
    {
      _id: req.params.id,
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
    throw new Error(`Oops two of your sections have the same order`);
  }

  team.templates.map((template) => {
    sections.map((section) => {
      if (template.section === section.section) {
        template.template = section.template;
        template.order = section.order;
        template.customTemplate = section.customTemplate;
      }
    });
  });

  team.save();
  return res.json('Your profile has been successfully changed');
});

const addGravatar = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  let url = gravatar.url(team.contact.email);

  await Team.updateOne(
    {
      _id: req.params.id,
    },
    {
      gravatar: url,
    }
  );

  res.status(200);
  res.json(url);
});

const removeGravatar = asyncHandler(async (req, res) => {
  let url = '//www.gravatar.com/avatar/84aad248e0c12d0d3e4513177a510e0d';

  await Team.updateOne(
    {
      _id: req.params.id,
    },
    {
      gravatar: url,
    }
  );

  res.status(200);
  res.json(url);
});

const updateStore = asyncHandler(async (req, res) => {
  await Team.updateOne(
    {
      _id: req.params.id,
    },
    {
      storeId: req.body.storeId,
    }
  );

  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Your store has been successfully updated', team: team });
});

const updateStream = asyncHandler(async (req, res) => {
  await Team.updateOne(
    {
      _id: req.params.id,
    },
    {
      stream: req.body,
    }
  );

  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({
    success: 'Your stream has been successfully updated',
    team: team,
  });
});

const updateDivider = asyncHandler(async (req, res) => {
  //removed name update from set, images are updated directly now on theme.
  await Team.updateOne(
    { _id: req.params.id },
    {
      $set: { pattern: req.body.divider },
    }
  );
  const player = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Your profile has been updated', player: player });
});

const updateBanner = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (req.body.index) {
    team.theme.banner[req.body.index] = '';
    team.markModified('theme');
    team.save();

    res.status(200);
    res.json({ team: team });
  } else {
    res.status(404);
    res.json('failed to delete image');
  }
});

const updateTheme = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (req.body.customTheme) {
    if (req.body.customTheme.background) {
      team.theme.background = [req.body.customTheme.background];
      team.theme.name = '';
    }
    if (req.body.customTheme.banner) {
      const index = team.theme.banner.indexOf(req.body.customTheme.orgImage);
      team.theme.banner[index] = req.body.customTheme.banner;
      team.theme.name = '';
    }
  } else {
    team.theme = req.body.theme;
  }
  team.markModified('theme');
  team.save();

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
    await Team.updateOne(
      {
        _id: req.params.id,
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
    await Team.updateOne(
      {
        _id: req.params.id,
      },
      {
        $push: { photos: link },
      }
    );
  }

  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({
    success: 'Your photo(s) have been uploaded!',
    photos: team.photos,
    team: team,
  });
});

const deletePhoto = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  team.photos.filter((photo) => photo !== req.body.photo);

  let index = team.photos.indexOf(req.body.photo);
  team.photos.splice(index, 1);

  team.save();
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

  await Team.updateOne(
    {
      _id: req.params.id,
    },
    {
      $set: { videos: videos },
    }
  );

  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({
    success: 'Your playlist has been added!',
    videos: team.videos,
    team: team,
  });
});

const deleteVideo = asyncHandler(async (req, res) => {
  // const team = await Team.findById(req.params.id);

  // team.videos.filter((video) => video !== req.body.video);

  // let index = team.videos.indexOf(req.body.video);
  // team.videos.splice(index, 1);

  // team.save();
  // res.status(200);
  // res.json('Your video(s) have been deleted!');
  const team = await Team.findById(req.params.id);
  let { video } = req.body;
  const index = team.videos.findIndex((e) => e === video);
  team.videos.splice(index, 1);
  team.save();
  res.status(200);
  res.json('Your video(s) have been deleted!');
});

const updateName = asyncHandler(async (req, res) => {
  await Team.updateOne(
    { _id: req.params.id },
    {
      name: req.body.images,
      pattern: req.body.divider,
    }
  );
  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Your profile has been updated', team: team });
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  const file = req.files[0];
  // console.log(file);
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
    await Team.updateOne(
      {
        _id: req.params.id,
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

const toggleSection = asyncHandler(async (req, res) => {
  let section = req.body.section;
  const team = await Team.findOne({ _id: req.params.id });
  let index = team.templates.findIndex(
    (template) => template.section === section
  );
  team.templates[index].show = req.body.value;
  // console.log(team);
  team.save();
  res.status(200);
  res.json('Your section has been updated!');
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

  await Team.updateOne(
    { _id: req.params.id },
    {
      sponsors: req.body,
    }
  );

  const team = await Team.findById(req.params.id);

  res.status(200);
  res.json({ success: 'Your sponsors have been updated', team: team });
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

  await Team.updateOne(
    { _id: req.params.id },
    {
      stripe: subscription,
      'membership.tier': plan,
    }
  );

  res.json({ client_secret: client_secret, status: status });
});

const previewProration = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  // Set proration date to this moment:
  const proration_date = Math.floor(Date.now() / 1000);

  const subscription = await stripe.subscriptions.retrieve(team.stripe.id);

  // See what the next invoice would look like with a price switch
  // and proration set:
  const items = [
    {
      id: subscription.items.data[0].id,
      price: req.body.price, // Switch to new price
    },
  ];

  const invoice = await stripe.invoices.retrieveUpcoming({
    customer: team.stripe.customer,
    subscription: team.stripe.id,
    subscription_items: items,
    subscription_proration_date: proration_date,
  });

  res.json(invoice);
});

const changeSubscription = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  const proration_date = Math.floor(Date.now() / 1000);

  const subscription = await stripe.subscriptions.retrieve(team.stripe.id);

  // See what the next invoice would look like with a price switch
  // and proration set:

  const { price } = req.body;

  const invoice = await stripe.subscriptions.update(team.stripe.id, {
    proration_behavior: 'create_prorations',
    items: [
      {
        id: subscription.items.data[0].id,
        price: price,
      },
    ],
    proration_date: proration_date,
  });

  let plan = '';

  if (
    price === 'price_1IiYbiHFO4iy8rqGT0dCycEZ' ||
    price === 'price_1IiYbiHFO4iy8rqGphBwr7Ym'
  ) {
    plan = 'Silver';
  }
  if (
    price === 'price_1IiYblHFO4iy8rqGo1hYgzd6' ||
    price === 'price_1IiYblHFO4iy8rqGmYgmnHWH'
  ) {
    plan = 'Gold';
  }
  if (
    price === 'price_1IiYbtHFO4iy8rqG0kIzrugr' ||
    price === 'price_1IiYbtHFO4iy8rqGf5XO1Qjw'
  ) {
    plan = 'Platinum';
  }

  await Team.updateOne(
    { _id: req.params.id },
    {
      stripe: invoice,
      'membership.tier': plan,
    }
  );

  res.json('Success');
});

const cancelSubscription = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  try {
    const deletedSubscription = await stripe.subscriptions.update(
      team.stripe.id,
      { cancel_at_period_end: true }
    );
    await Team.updateOne(
      { _id: req.params.id },
      {
        stripe: deletedSubscription,
      }
    );
    res.send({ subscription: deletedSubscription });
  } catch (error) {
    return res.status(400).send({ error: { message: error.message } });
  }
});

const resumeSubscription = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  try {
    const resumedSubscription = await stripe.subscriptions.update(
      team.stripe.id,
      { cancel_at_period_end: false }
    );
    await Player.updateOne(
      { _id: req.params.id },
      {
        stripe: resumedSubscription,
      }
    );
    res.send({ subscription: resumedSubscription });
  } catch (error) {
    return res.status(400).send({ error: { message: error.message } });
  }
});

const addDiscord = asyncHandler(async (req, res) => {
  await Team.updateOne(
    { _id: req.params.id },
    {
      'social_media.discordWidget': req.body.discordWidget,
    }
  );

  const team = await Team.findById(req.params.id);
  res.status(200);
  res.json({ success: 'Your discord has been added!', team: team });
});

const createCustomerPortalSession = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  const session = await stripe.billingPortal.sessions.create({
    customer: team.stripe.customer,
  });

  res.status(200);
  res.json({ url: session.url });
});

const createCheckoutSession = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  console.log(team);

  const { priceId } = req.body;

  let session;

  if (team.stripe.customer !== '') {
    session = await stripe.billingPortal.sessions.create({
      customer: team.stripe.customer,
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
      client_reference_id: team._id.toString(),
      success_url:
        'https://example.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/canceled.html',
    });
  }

  res.status(200);
  res.json({ url: session.url });
  // res.redirect(303, session.url);
});

export {
  createTeam,
  deleteTeam,
  updateTeam,
  updateBio,
  updateContact,
  removePlayerFromTeam,
  leaveTeam,
  updateSocialMedia,
  changeRole,
  contactUs,
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
  updateName,
  updateProfilePicture,
  toggleSection,
  updateSponsors,
  handleSubmitSub,
  previewProration,
  cancelSubscription,
  resumeSubscription,
  changeSubscription,
  addDiscord,
  isAdmin,
  updateBanner,
  updateDivider,
  createCustomerPortalSession,
  createCheckoutSession,
};
