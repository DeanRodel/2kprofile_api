import asyncHandler from 'express-async-handler';
import Player from '../models/playerModel.js';
import sendEmail from './sendEmail.js';
import { promises as fs } from 'fs';

const fourDays = 4 * 24 * 60 * 60000; //After 3 day trial (7 - 4)
const twoDays = 2 * 24 * 60 * 60000; //After 5 days trial (7 - 2)
const oneDay = 1 * 24 * 60 * 60000; //After 6 days trial (7 - 1)

const sendTrialEmail = asyncHandler(async (req, res) => {
  const trialPlayers = await Player.find({ 'membership.trial': 'available' });
  trialPlayers.map(async (player) => {
    // Send email after 4 days of trial
    if (
      Date.now() + fourDays > player.membership.expire &&
      player.membership.email === 1
    ) {
      const message = await fs.readFile(
        './backend/email/email4day.html',
        'binary'
      );
      await sendEmail({
        email: player.email,
        subject: `How’s it going? 72 hrs. left in your free ePLEYER Platinum Profile`,
        text: 'Hey! How’s it going? You have 72 hours left in your free trail offer of the ePLEYER Platinum Profile. Happy with what you’ve created? Why wait? Subscribe now and share your profile with the eSports community.',
        html: message,
      });
      await Player.updateOne({ _id: player._id }, { 'membership.email': 2 });
    }
    // Send email after 5 days of trial
    if (
      Date.now() + twoDays > player.membership.expire &&
      player.membership.email === 2
    ) {
      const message = await fs.readFile(
        './backend/email/email6day.html',
        'binary'
      );
      await sendEmail({
        email: player.email,
        subject: `24 hrs. Left In Your Free ePLEYER Platinum Profile. Subscribe Now!`,
        text: 'Your 7-day Platinum Profile free trial is coming to an end in 24 hours. We know you’ve been busy making your ePLEYER Platinum Profile perfect so subscribe now to save what you’ve built.',
        html: message,
      });
      await Player.updateOne({ _id: player._id }, { 'membership.email': 3 });
    }
    // Send email after 6 days of trial
    if (
      Date.now() + oneDay > player.membership.expire &&
      player.membership.email === 3
    ) {
      const message = await fs.readFile(
        './backend/email/email7day.html',
        'binary'
      );
      await sendEmail({
        email: player.email,
        subject: `Last Day for your free ePLEYER Platinum Profile`,
        text: 'Your 7-day free trial of the ePLEYER Platinum Profile ends today! We hope you’ve enjoyed building out what your gaming greatness can look like. Don’t lose what you’ve built, just subscribe now.',
        html: message,
      });
      await Player.updateOne({ _id: player._id }, { 'membership.email': 4 });
    }
  });
});

const sendFirstDayTrialEmail = asyncHandler(async (player) => {
  const message = await fs.readFile('./backend/email/email1day.html', 'binary');
  await sendEmail({
    email: player.email,
    subject: `Congratulations! 7-Day Free Trial ePLEYER Platinum Profile`,
    text: 'Customizing is super easy so get started now, it’s time to show off your profile with friends and the entire eSports community. We’ll remind you when your trial is coming to an end to make sure you have time to subscribe and save your profile.',
    html: message,
  });
  if (player._id)
    await Player.updateOne({ _id: player._id }, { 'membership.email': 1 });
});

const testEmails = asyncHandler(async () => {
  const message = await fs.readFile('./backend/email/email1day.html', 'binary');
  await sendEmail({
    email: 'shariar@dnsnetworks.com',
    subject: `Congratulations! 7-Day Free Trial ePLEYER Platinum Profile`,
    text: 'Customizing is super easy so get started now, it’s time to show off your profile with friends and the entire eSports community. We’ll remind you when your trial is coming to an end to make sure you have time to subscribe and save your profile.',
    html: message,
  });

  const message1 = await fs.readFile(
    './backend/email/email4day.html',
    'binary'
  );
  await sendEmail({
    email: 'shariar@dnsnetworks.com',
    subject: `How’s it going? 72 hrs. left in your free ePLEYER Platinum Profile`,
    text: 'Hey! How’s it going? You have 72 hours left in your free trail offer of the ePLEYER Platinum Profile. Happy with what you’ve created? Why wait? Subscribe now and share your profile with the eSports community.',
    html: message1,
  });

  const message2 = await fs.readFile(
    './backend/email/email6day.html',
    'binary'
  );
  await sendEmail({
    email: 'shariar@dnsnetworks.com',
    subject: `24 hrs. Left In Your Free ePLEYER Platinum Profile. Subscribe Now!`,
    text: 'Your 7-day Platinum Profile free trial is coming to an end in 24 hours. We know you’ve been busy making your ePLEYER Platinum Profile perfect so subscribe now to save what you’ve built.',
    html: message2,
  });

  const message3 = await fs.readFile(
    './backend/email/email7day.html',
    'binary'
  );
  await sendEmail({
    email: 'shariar@dnsnetworks.com',
    subject: `Last Day for your free ePLEYER Platinum Profile`,
    text: 'Your 7-day free trial of the ePLEYER Platinum Profile ends today! We hope you’ve enjoyed building out what your gaming greatness can look like. Don’t lose what you’ve built, just subscribe now.',
    html: message3,
  });

  const message4 = await fs.readFile(
    './backend/email/emailteaminvite.html',
    'binary'
  );
  await sendEmail({
    email: 'shariar@dnsnetworks.com',
    subject: `Get Your FREE ePleyer Profile, Your Team is Waiting!`,
    text: 'GUESS WHAT?! You’ve been asked to join a team on the ePleyer Platform! Your gaming career is taking shape and now is your chance to take the next steps in your eSports journey.  ',
    html: message4,
  });

  const message5 = await fs.readFile(
    './backend/email/emailteaminvitenew.html',
    'binary'
  );
  await sendEmail({
    email: 'shariar@dnsnetworks.com',
    subject: `Get Your FREE ePleyer Profile, Your Team is Waiting!`,
    text: 'CHECK IT OUT! You’ve been asked to join a team on the ePleyer Platform! Your gaming career is taking shape and now is your chance to take the next steps in your eSports journey.  ',
    html: message5,
  });
});

export { sendTrialEmail, sendFirstDayTrialEmail, testEmails };
