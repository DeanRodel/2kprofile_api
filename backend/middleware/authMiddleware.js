import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Player from '../models/playerModel.js';
import Team from '../models/teamModel.js';

//Get player id from req.header using Bearer authtoken token
const protect = asyncHandler(async (req, res, next) => {
  let token;
  // console.log(req.headers);
  if (
    req.headers.authtoken &&
    (req.headers.authtoken.startsWith('Bearer'))
  ) {
    try {
      token = req.headers.authtoken.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.player = await Player.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const admin = asyncHandler(async (req, res, next) => {
  const reqPlayer = await Team.findOne(
    { _id: req.params.id },
    { roster: { $elemMatch: { _id: req.player._id } } }
  );
  if (reqPlayer.roster.length === 0) {
    res.status(401);
    throw new Error('You are not part of this team.');
  }
  if (reqPlayer.roster[0].position !== 'Admin') {
    res.status(401);
    throw new Error('Only the admin is allowed to do that.');
  }
  next();
});

const manager = asyncHandler(async (req, res, next) => {
  const reqPlayer = await Team.findOne(
    { _id: req.params.id },
    { roster: { $elemMatch: { _id: req.player._id } } }
  );
  if (reqPlayer.roster.length === 0) {
    res.status(400);
    throw new Error('You are not part of this team.');
  }
  if (
    reqPlayer.roster[0].position !== 'Admin' &&
    reqPlayer.roster[0].position !== 'Manager'
  ) {
    res.status(400);
    throw new Error('Only the admin or manager is allowed to do that.');
  }
  next();
});

const coach = asyncHandler(async (req, res, next) => {
  const reqPlayer = await Team.findOne(
    { _id: req.params.id },
    { roster: { $elemMatch: { _id: req.player._id } } }
  );
  if (reqPlayer.roster.length === 0) {
    res.status(400);
    throw new Error('You are not part of this team.');
  }
  if (
    reqPlayer.roster[0].position !== 'Admin' &&
    reqPlayer.roster[0].position !== 'Manager' &&
    reqPlayer.roster[0].position !== 'Coach'
  ) {
    res.status(400);
    throw new Error('Only the admin, manager or coach is allowed to do that.');
  }
  next();
});

const silver = asyncHandler(async (req, res, next) => {
  const player = await Player.findOne({ _id: req.player._id });
  if (
    player.membership.tier !== 'Silver' ||
    player.membership.tier !== 'Gold' ||
    player.membership.tier !== 'Platinum'
  ) {
    res.status(400);
    throw new Error('Please upgrade your account to do this');
  }
  next();
});

const gold = asyncHandler(async (req, res, next) => {
  const player = await Player.findOne({ _id: req.player._id });
  if (
    player.membership.tier !== 'Gold' ||
    player.membership.tier !== 'Platinum'
  ) {
    res.status(400);
    throw new Error('Please upgrade your account to do this');
  }
  next();
});

const platinum = asyncHandler(async (req, res, next) => {
  const player = await Player.findOne({ _id: req.player._id });
  if (player.membership.tier !== 'Platinum') {
    res.status(400);
    throw new Error('Please upgrade your account to do this');
  }
  next();
});

export { protect, admin, manager, coach, silver, gold, platinum };
