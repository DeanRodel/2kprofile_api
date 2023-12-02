import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './backend/config/db.js';
import playerRoutes from './backend/routes/playerRoutes.js';
import teamRoutes from './backend/routes/teamRoutes.js';
import serverRoutes from './backend/routes/serverRoutes.js';
import { sendTrialEmail, testEmails } from './backend/utils/sendTrialEmail.js';
import navRoutes from './backend/routes/navRoutes.js';
import Player from './backend/models/playerModel.js';
import cron from 'node-cron';
import path from 'path';
import jwt from 'jsonwebtoken';
import Team from './backend/models/teamModel.js';

const __dirname = path.resolve();

console.log(__dirname);

dotenv.config();

// connectDB();

const app = express();

var allowedOrigins = [
  'http://127.0.0.1:5000',
  'https://127.0.0.1:5000',
  'http://localhost:3000',
  'https://localhost:3000',
  'https://dev.epleyer.gg',
  'https://staging.epleyer.gg',
  'https://www.epleyer.gg',
  'https://epleyer.gg',
  'https://billing.stripe.com',
];

// app.use(morgan('combined'));
// app.use(express.json());
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // allow requests with no origin
//       // (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         var msg =
//           'The CORS policy for this site does not ' +
//           'allow access from the specified Origin.';
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//   })
// );

//Schedule every hour at minute 0
// cron.schedule('* * * * *', () => {
//   sendTrialEmail();
// });

app.get('/api', (req, res) => {
  res.send('API is running...');
});

// app.use('/api/players', playerRoutes);
// app.use('/api/teams', teamRoutes);
// app.use('/api/server', serverRoutes);
// app.use('/api/nav', navRoutes);
// app.use(
//   '/api/stripe/webhook',
//   express.json({ type: 'application/json' }),
//   async (req, res) => {
//     console.log(JSON.stringify(req.body, null, 2));
//     let type = req.body.type;
//     let data = req.body.data;
//     let tier = {
//       997: 'Silver',
//       9970: 'Silver',
//       1497: 'Gold',
//       14970: 'Gold',
//       1997: 'Platinum',
//       19970: 'Platinum',
//     };

//     if (type === 'checkout.session.completed') {
//       let accountId = data.object.client_reference_id;
//       console.log('checkout.session.completed');
//       const player = await Player.findById(accountId);
//       const team = await Team.findById(accountId);
//       // const account = (player ?  player : team)
//       console.log(JSON.stringify(req.body, null, 2));
//       if (player) {
//         console.log(player.membership, player.stripe);
//         player.stripe.customer = data.object.customer;
//         player.stripe.subscription = data.object.subscription;
//         player.membership.tier = tier[data.object.amount_total.toString()];
//         player.markModified('stripe.customer');
//         player.markModified('stripe.subscription');
//         player.markModified('membership.tier');
//         player.save();
//         console.log(player.membership, player.stripe);
//       }
//       if (team) {
//         console.log(team.membership, team.stripe);
//         team.stripe.customer = data.object.customer;
//         team.stripe.subscription = data.object.subscription;
//         team.membership.tier = tier[data.object.amount_total.toString()];
//         team.markModified('stripe.customer');
//         team.markModified('stripe.subscription');
//         team.markModified('membership.tier');
//         team.save();
//         console.log(team.membership, team.stripe);
//       }
//     }

//     if (type === 'invoice.paid') {
//       console.log('invoice.paid');
//       const player = await Player.findOne({
//         'stripe.customer': data.object.customer,
//       });
//       const team = await Team.findOne({
//         'stripe.customer': data.object.customer,
//       });

//       if (player) {
//         console.log(player.membership, player.stripe);
//         await Player.updateOne(
//           { 'stripe.customer': data.object.customer },
//           {
//             'membership.tier': tier[data.object.amount_paid.toString()],
//           }
//         );
//         console.log(player.membership, player.stripe);
//       }
//       if (team) {
//         console.log(team.membership, team.stripe);
//         await Team.updateOne(
//           { 'stripe.customer': data.object.customer },
//           {
//             'membership.tier': tier[data.object.amount_paid.toString()],
//           }
//         );
//         console.log(team.membership, team.stripe);
//       }
//     }

//     if (type === 'invoice.payment_failed') {
//       console.log('invoice.payment_failed');
//       const player = await Player.findOne({
//         'stripe.customer': data.object.customer,
//       });
//       const team = await Team.findOne({
//         'stripe.customer': data.object.customer,
//       });

//       if (player) {
//         console.log(player.membership, player.stripe);
//         await Player.updateOne(
//           { 'stripe.customer': data.object.customer },
//           {
//             'membership.tier': 'Bronze',
//           }
//         );
//         console.log(player.membership, player.stripe);
//       }
//       if (team) {
//         console.log(team.membership, team.stripe);
//         await Team.updateOne(
//           { 'stripe.customer': data.object.customer },
//           {
//             'membership.tier': 'Bronze',
//           }
//         );
//         console.log(team.membership, team.stripe);
//       }
//     }

//     if (type === 'customer.subscription.updated') {
//       // Customer is upgrading/downgrading subscription (also add hide templates, for each tier?)
//       console.log('customer.subscription.updated');
//       const player = await Player.findOne({
//         'stripe.customer': data.object.customer,
//       });
//       const team = await Team.findOne({
//         'stripe.customer': data.object.customer,
//       });

//       let previous_attributes = req.body.data.previous_attributes;

//       if (player) {
//         console.log(player.membership, player.stripe);
//         console.log('sub updated');
//         // If customer upgrades/downgrades their subscription
//         if (previous_attributes.items) {
//           await Player.updateOne(
//             { 'stripe.customer': data.object.customer },
//             {
//               'membership.tier': tier[data.object.plan.amount.toString()],
//             }
//           );
//           console.log(player.membership, player.stripe);
//         }
//         // If customer cancels their subscription
//         if (previous_attributes.cancel_at_period_end === false) {
//           console.log('sub cancelled');
//           console.log(data.object.cancel_at);
//           await Player.updateOne(
//             {
//               'stripe.customer': data.object.customer,
//             },
//             {
//               'stripe.cancel_at': data.object.cancel_at * 1000,
//             }
//           );
//         }
//         // If customer renews their subscription
//         if (previous_attributes.cancel_at_period_end === true) {
//           console.log('sub resumed');
//           await Player.updateOne(
//             {
//               'stripe.customer': data.object.customer,
//             },
//             {
//               'stripe.cancel_at': '',
//               'membership.tier': tier[data.object.plan.amount.toString()],
//             }
//           );
//         }
//       }

//       if (team) {
//         console.log(team.membership, team.stripe);
//         // If customer upgrades/downgrades their subscription
//         if (previous_attributes.items) {
//           console.log('subscription updated');
//           await Team.updateOne(
//             { 'stripe.customer': data.object.customer },
//             {
//               'membership.tier': tier[data.object.plan.amount.toString()],
//             }
//           );
//           console.log(team.membership, team.stripe);
//         }
//         // If customer cancels their subscription
//         if (previous_attributes.cancel_at_period_end === false) {
//           console.log('sub cancelled');
//           console.log(data.object.cancel_at);
//           await Team.updateOne(
//             {
//               'stripe.customer': data.object.customer,
//             },
//             {
//               'stripe.cancel_at': data.object.cancel_at * 1000,
//             }
//           );
//         }
//         // If customer renews their subscription
//         if (previous_attributes.cancel_at_period_end === true) {
//           console.log('sub resumed');
//           await Team.updateOne(
//             {
//               'stripe.customer': data.object.customer,
//             },
//             {
//               'stripe.cancel_at': '',
//               'membership.tier': tier[data.object.plan.amount.toString()],
//             }
//           );
//         }
//       }
//     }
//     res.send();
//   }
// );

// app.listen(5000, console.log('Server running on port 5000'));
app.listen(process.env.PORT, () => {
	console.log(`API is now on port ${process.env.PORT}`)
})


//testEmails();
