import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import slugify from 'slugify';
import fetch from 'node-fetch';

import sendEmail from '../utils/sendEmail.js';
import { sendFirstDayTrialEmail } from '../utils/sendTrialEmail.js';
import generateToken from '../utils/generateToken.js';
import Player from '../models/playerModel.js';

async function validateHuman(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
    {
      method: 'POST',
    }
  );
  const data = await response.json();
  // console.log(data);
  // return true;
  return data.success;
}

// @desc   Auth user & get token
// @route  POST /api/players/login
// @access Public
const authUser = asyncHandler(async (req, res, next) => {
  const { email, password, recaptchaToken } = req.body;
  // console.log(recaptchaToken);
  const human = await validateHuman(recaptchaToken);
  // if (!human) {
  //   res.status(400);
  //   throw new Error('Failed reCAPTCHA');
  // }

  const player = await Player.findOne({
    $or: [{ email: email }, { username: email }],
  });
  if (player && (await player.matchPassword(password))) {
    res.json({
      _id: player._id,
      email: player.email,
      token: generateToken(player._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email/username or password');
  }
});

// @desc   Register a new user
// @route  POST /api/players
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, name, username, updatesCheck } = req.body;

  const emailRegex =
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Invalid email address!');
  }

  if (
    (name.match(/ /g) || []).length > 1 ||
    (name.match(/ /g) || []).length === 0
  ) {
    res.status(400);
    throw new Error('Please enter only one first name and last name.');
  }

  if (!name.match(/^[a-zA-Z-\s]*$/)) {
    res.status(400);
    throw new Error('Please do not enter any numbers of symbols.');
  }

  let pattern = /[^A-Za-z0-9]+/;

  if (username.match(pattern)) {
    res.status(400);
    throw new Error(
      'Please enter a username between 8 - 20 characters with only letters and numbers'
    );
  }

  if (!username.match(/^(?=.{8,20}$)[a-zA-Z0-9 _]/)) {
    res.status(400);
    throw new Error(
      'Please enter a username between 8 - 20 characters with only letters and numbers'
    );
  }

  const passwordRegex = RegExp(
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'
  );
  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error(
      'Password should be combination of numbers, alphabets, upper case character and symbol.'
    );
  }

  const emailExists = await Player.findOne({
    email: { $regex: `^${email}$`, $options: 'i' },
  });

  if (emailExists) {
    res.status(400);
    throw new Error('A user with this email already exists.');
  }

  const usernameExists = await Player.findOne({
    username: { $regex: `^${username}$`, $options: 'i' },
  });

  if (usernameExists) {
    res.status(400);
    throw new Error('Sorry, this username has already been taken.');
  }

  const parseName = name.split(' ');
  const player = await Player.create({
    email,
    password,
    username,
    slug: slugify(username),
    first_name: parseName[0],
    last_name: parseName[1],
    subscribe: updatesCheck,
  });

  if (player) {
    sendFirstDayTrialEmail(player);
    res.status(201).json({
      _id: player._id,
      email: player.email,
      username: player.username,
      token: generateToken(player._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc   Forgot password
// @route  POST /api/players/forgotpassword
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  // console.log(req.body);
  const player = await Player.findOne({ email: req.body.email });

  if (!player) {
    res.status(404);
    throw new Error('No user exists with that email');
  }

  //Get reset token
  const resetToken = player.getResetPasswordToken();

  await player.save({ validateBeforeSave: false });

  // Create reset url
  // const resetUrl = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/players/resetpassword/${resetToken}`;

  const resetUrl = `${req.protocol}://${process.env.HOST}/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please visit the following URL: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: player.email,
      subject: 'Password reset token',
      text: '',
      html: message,
    });

    res.status(200).json(`An email has been sent to ${player.email}`);
  } catch (err) {
    console.log(err);
    console.log('not working');
    player.resetPasswordToken = undefined;
    player.resetPasswordExpire = undefined;

    await player.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error('Email could not be sent');
  }
});

// @desc   Reset password
// @route  PUT /api/players/resetpassword/:resettoken
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const passwordRegex = RegExp(
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'
  );
  if (!passwordRegex.test(req.body.password)) {
    res.status(400);
    throw new Error(
      'Password should be combination of numbers, alphabets, upper case character and symbol.'
    );
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const player = await Player.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!player) {
    res.status(400);
    throw new Error('Invalid token');
  }

  // Set new password
  player.password = req.body.password;
  player.resetPasswordToken = undefined;
  player.resetPasswordExpire = undefined;
  await player.save();

  sendTokenResponse(player, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (player, statusCode, res) => {
  // Create token
  const token = player.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};

export { authUser, registerUser, forgotPassword, resetPassword };
