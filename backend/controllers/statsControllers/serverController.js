import asyncHandler from 'express-async-handler';
import Player from '../../models/playerModel.js';

import {
  setLeaguePlayerId,
  getLeaguePlayerStats,
  setTeamfightPlayerId,
  getTeamfightPlayerStats,
  setPubgPlayerId,
  getPubgPlayerStats,
  setFortnitePlayerId,
  getFortnitePlayerStats,
  getApexPlayerStats,
  getDivisionPlayerStats,
  getDotaPlayerStats,
  getWarzonePlayerStats,
  setXboxLiveGamerTag,
  getXboxLiveStates,
  getCsgoPlayerStats,
  getXboxLiveAchievements,
} from './apiController.js';

const oneSecond = 1 * 1 * 1 * 1000;
const oneMinute = 1 * 1 * 1 * 60000;
const oneDay = 1 * 24 * 60 * 60000;
const oneMonth = 31 * 24 * 60 * 60000;

//We might be able to just use id to check if player exists instead of name and region, check other APIs
//Note you must setStats before getStats or player won't exist

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

//Returns true if account already exists for another player
async function checkIfPlayerExists(options) {
  let playerExists;

  if (options.game === 'league') {
    playerExists = await Player.findOne({
      $and: [
        {
          'stats.leagueOfLegends.summonerName': {
            $regex: `^${options.summonerName}$`,
            $options: 'i',
          },
        },
        { 'stats.leagueOfLegends.region': options.region },
      ],
    });
  }

  if (options.game === 'teamfight') {
    playerExists = await Player.findOne({
      $and: [
        {
          'stats.teamfightTactics.summonerName': {
            $regex: `^${options.summonerName}$`,
            $options: 'i',
          },
        },
        { 'stats.teamfightTactics.region': options.region },
      ],
    });
  }

  if (options.game === 'pubg') {
    playerExists = await Player.findOne({
      $and: [
        {
          'stats.pubg.name': {
            $regex: `^${options.name}$`,
            $options: 'i',
          },
        },
        { 'stats.pubg.platform': options.platform },
      ],
    });
  }

  if (options.game === 'fortnite') {
    playerExists = await Player.findOne({
      'stats.fortnite.name': options.name,
    });
  }

  if (options.game === 'apex') {
    playerExists = await Player.findOne({
      'stats.apex.name': options.name,
    });
  }

  if (options.game === 'division') {
    playerExists = await Player.findOne({
      'stats.division.name': options.name,
    });
  }

  if (options.game === 'dota') {
    playerExists = await Player.findOne({
      'stats.division.steamId': options.steamId,
    });
  }

  if (options.game === 'warzone') {
    playerExists = await Player.findOne({
      $and: [
        {
          'stats.warzone.name': {
            $regex: `^${options.name}$`,
            $options: 'i',
          },
        },
        { 'stats.warzone.platform': options.platform },
      ],
    });
  }

  if (options.game === 'xboxlive') {
    playerExists = await Player.findOne({
      'stats.xboxlive.gamerTag': options.name,
    });
  }

  if (options.game === 'csgo') {
    playerExists = await Player.findOne({
      'stats.csgo.steamId': options.name,
    });
  }

  if (playerExists) {
    return true;
  } else {
    return false;
  }
}

async function updateLeagueStats(player) {
  const region = player.stats.leagueOfLegends.region;
  const accountId = player.stats.leagueOfLegends.summonerId;

  const data = await getLeaguePlayerStats(accountId, region);

  const leagueData = {
    ...data[0],
    region: region,
    lastUpdated: Date.now(),
    lastModified: player.stats.leagueOfLegends.lastModified,
  };

  await Player.updateOne(
    { _id: player._id },
    {
      'stats.leagueOfLegends': leagueData,
    }
  );
}

async function updateTeamfightStats(player) {
  const region = player.stats.leagueOfLegends.region;
  const accountId = player.stats.leagueOfLegends.summonerId;

  const data = await getTeamfightPlayerStats(accountId, region);

  const teamfightData = {
    ...data[0],
    region: region,
    lastUpdated: Date.now(),
    lastModified: player.stats.teamfightTactics.lastModified,
  };

  await Player.updateOne(
    { _id: player._id },
    {
      'stats.teamfightTactics': teamfightData,
    }
  );
}

async function updatePubgStats(player) {
  const platform = player.stats.pubg.platform;
  const accountId = player.stats.pubg.accountId;
  const name = player.stats.pubg.name;

  const data = await getPubgPlayerStats(accountId, platform); //1 API CALL

  const pubgData = {
    accountId: accountId,
    name: name,
    platform: platform,
    duo: data.data.attributes.gameModeStats.duo,
    solo: data.data.attributes.gameModeStats.solo,
    squad: data.data.attributes.gameModeStats.squad,
    lastUpdated: Date.now(),
    lastModified: player.stats.pubg.lastModified,
  };

  await Player.updateOne(
    { _id: player._id },
    {
      'stats.pubg': pubgData,
    }
  );
}

async function updateFortniteStats(player) {
  const accountId = player.stats.fortnite.accountId;
  const name = player.stats.fortnite.name;

  const data = await getFortnitePlayerStats(accountId); //1 API CALL
  const fortniteData = {
    name: name,
    accountId: accountId,
    level: data.account.level,
    solo: data.global_stats.solo,
    duo: data.global_stats.duo,
    squad: data.global_stats.squad,
    lastUpdated: Date.now(),
    lastModified: player.stats.fortnite.lastModified,
  };
  await Player.updateOne(
    { _id: player._id },
    {
      'stats.fortnite': fortniteData,
    }
  );
}

async function updateApexStats(player) {
  const name = player.stats.apex.name;
  const platform = player.stats.apex.platform;

  const data = await getApexPlayerStats(name, platform); //1 API CALL
  const apexData = {
    name: name,
    platform: platform,
    level: data.global.level,
    rankName: data.global.rank.rankName,
    rankScore: data.global.rank.rankScore,
    kills: data.total.kills.value,
    lastUpdated: Date.now(),
    lastModified: player.stats.apex.lastModified,
  };
  await Player.updateOne(
    { _id: player._id },
    {
      'stats.apex': apexData,
    }
  );
}

async function updateDivisionStats(player) {
  const name = player.stats.division.name;
  const platform = player.stats.division.platform;

  const data = await getDivisionPlayerStats(name, platform); //1 API CALL
  const divisionData = {
    ...data.results[0],
    lastUpdated: Date.now(),
    lastModified: player.stats.division.lastModified,
  };
  await Player.updateOne(
    { _id: player._id },
    {
      'stats.division': divisionData,
    }
  );
}

async function updateDotaStats(player) {
  const steamId = player.stats.dota.steamId;

  const data = await getDotaPlayerStats(steamId); //1 API CALL
  const dotaData = {
    name: data.data1.profile.personaname,
    steamId: steamId,
    competitive_rank: data.data1.competitive_rank,
    solo_competitive_rank: data.data1.solo_competitive_rank,
    leaderboard_rank: data.data1.leaderboard_rank,
    mmr: data.data1.mmr_estimate.estimate,
    wins: data.data2.win,
    loss: data.data2.lose,
    lastUpdated: Date.now(),
    lastModified: player.stats.dota.lastModified,
  };
  await Player.updateOne(
    { _id: player._id },
    {
      'stats.dota': dotaData,
    }
  );
}

async function updateWarzoneStats(player) {
  const name = player.stats.warzone.name;
  const platform = player.stats.warzone.platform;

  const data = await getWarzonePlayerStats(name, platform); //1 API CALL
  const warzoneData = {
    name: name,
    platform: platform,
    ...data.br_all,
    lastUpdated: Date.now(),
    lastModified: player.stats.warzone.lastModified,
  };
  await Player.updateOne(
    { _id: player._id },
    {
      'stats.warzone': warzoneData,
    }
  );
}

async function updateXboxLiveStates(player) {
  const xuid = player.stats.xboxlive.xuid;
  const name = player.stats.xboxlive.gamerTag;
  const game = player.stats.xboxlive.game;

  let data = await getXboxLiveStates(xuid);

  const xboxliveData = {
    gamerTag: name,
    xuid: xuid,
    game: game,
    games: data,
    lastModified: Date.now(),
    lastUpdated: player.stats.xboxlive.lastModified,
  };
  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          xboxlive: xboxliveData,
        },
      },
    }
  );

  await Player.updateOne(
    { _id: player._id },
    {
      'stats.xboxlive': xboxliveData,
    }
  );
}

async function updateCsgoStats(player) {
  const steamId = player.stats.csgo.steamId;

  const data = await getCsgoPlayerStats(steamId); //1 API CALL
  const csgoData = {
    steamId: steamId,
    ...data.data.segments[0].stats,
    lastModified: Date.now(),
    lastUpdated: player.stats.csgo.lastModified,
  };
  await Player.updateOne(
    { _id: player._id },
    {
      'stats.csgo': csgoData,
    }
  );
}

const setLeagueStats = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);
  const { name, region } = req.body;

  // ***ERROR HANDLING***
  // Check if player changed their account within the past month
  if (!update(player.stats.leagueOfLegends.lastModified, oneMonth)) {
    res.status(405); //Not allowed
    throw new Error('You can only change your account once per month.');
  }

  // ***ERROR HANDLING***
  // Check if account already exists
  const playerExists = await checkIfPlayerExists({
    game: 'league',
    summonerName: name,
    region: region,
  });
  if (playerExists) {
    res.status(401); //Unauthorized
    throw new Error('Player with this account already exists.');
  }

  const accountId = await setLeaguePlayerId(name, region); //1 API CALL

  if (!accountId) {
    res.status(404); //Not Found
    throw new Error(`Summoner ${name} does not exist in ${region}.`);
  }

  const data = await getLeaguePlayerStats(accountId, region); //1 API CALL

  let leagueData = {
    ...data[0],
    summonerName: name,
    region: region,
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };

  let games = player.stats.games;
  if (player.stats.games.indexOf('league') === -1) {
    games.push('league');
  }

  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          games: games,
          leagueOfLegends: leagueData,
        },
      },
    }
  );

  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

const setTeamfightStats = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);
  const { name, region } = req.body;

  // ***ERROR HANDLING***
  // Check if player changed their account within the past month
  if (!update(player.stats.teamfightTactics.lastModified, oneMonth)) {
    res.status(405); //Not allowed
    throw new Error('You can only change your account once per month.');
  }

  // ***ERROR HANDLING***
  // Check if account already exists
  const playerExists = await checkIfPlayerExists({
    game: 'teamfight',
    summonerName: name,
    region: region,
  });
  if (playerExists) {
    res.status(401); //Unauthorized
    throw new Error('Player with this account already exists.');
  }

  const accountId = await setTeamfightPlayerId(name, region); //1 API CALL

  if (!accountId) {
    //Add last API call to schema
    res.status(404); //Not Found
    throw new Error(`This account does not exist`);
  }

  const data = await getTeamfightPlayerStats(accountId, region); //1 API CALL

  const teamfightData = {
    ...data[0],
    summonerName: name,
    region: region,
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };

  let games = player.stats.games;
  if (player.stats.games.indexOf('teamfight') === -1) {
    games.push('teamfight');
  }

  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          games: games,
          teamfightTactics: teamfightData,
        },
      },
    }
  );
  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

const setPubgStats = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);
  const { name, platform } = req.body;

  // ***ERROR HANDLING***
  // Check if account already exists
  const playerExists = await checkIfPlayerExists({
    game: 'pubg',
    name: name,
    platform: platform,
  });
  if (playerExists) {
    res.status(401); //Unauthorized
    throw new Error('Player with this account already exists.');
  }

  // ***ERROR HANDLING***
  // Check if player changed their account within the past month
  if (!update(player.stats.pubg.lastModified, oneMonth)) {
    res.status(405); //Not allowed
    throw new Error('You can only change your account once per month.');
  }

  const accountId = await setPubgPlayerId(name, platform); //1 API CALL
  if (accountId === 'error') {
    res.status(404); //Not found
    throw new Error('This account does not exist');
  }
  const data = await getPubgPlayerStats(accountId, platform); //1 API CALL

  const pubgData = {
    accountId: accountId,
    name: name,
    platform: platform,
    duo: data.data.attributes.gameModeStats.duo,
    solo: data.data.attributes.gameModeStats.solo,
    squad: data.data.attributes.gameModeStats.squad,
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };

  let games = player.stats.games;
  if (player.stats.games.indexOf('pubg') === -1) {
    games.push('pubg');
  }

  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          games: games,
          pubg: pubgData,
        },
      },
    }
  );
  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

const setFortniteStats = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);

  const { name } = req.body;

  if (!update(player.stats.fortnite.lastModified, oneMonth)) {
    res.status(405); //Not allowed
    throw new Error('You can only change your account once per month.');
  }

  const playerExists = await checkIfPlayerExists({
    game: 'fortnite',
    name: name,
  });

  if (playerExists) {
    res.status(401); //Unauthorized
    throw new Error('Player with this account already exists.');
  }

  const accountId = await setFortnitePlayerId(name);

  if (!accountId) {
    res.status(404); //Not allowed
    throw new Error('Sorry this account does not exist.');
  }

  const data = await getFortnitePlayerStats(accountId);

  if (data.global_stats === null) {
    res.status(404); //Not allowed
    throw new Error('Sorry this account does not exist.');
  }

  const fortniteData = {
    accountId: accountId,
    name: name,
    level: data.account.level,
    solo: data.global_stats.solo,
    duo: data.global_stats.duo,
    squad: data.global_stats.squad,
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };

  let games = player.stats.games;
  if (player.stats.games.indexOf('fortnite') === -1) {
    games.push('fortnite');
  }

  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          games: games,
          fortnite: fortniteData,
        },
      },
    }
  );
  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

const setApexStats = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);

  const { name, platform } = req.body;

  if (!update(player.stats.apex.lastModified, oneMonth)) {
    res.status(405); //Not allowed
    throw new Error('You can only change your account once per month.');
  }

  const playerExists = await checkIfPlayerExists({
    game: 'apex',
    name: name,
  });

  if (playerExists) {
    res.status(401); //Unauthorized
    throw new Error('Player with this account already exists.');
  }

  const data = await getApexPlayerStats(name, platform);

  if (data.Error) {
    res.status(404); //Unauthorized
    throw new Error('Sorry this player does not exist.');
  }

  const apexData = {
    name: name,
    platform: platform,
    level: data.global.level,
    rankName: data.global.rank.rankName,
    rankScore: data.global.rank.rankScore,
    kills: data.total.kills.value,
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };

  let games = player.stats.games;
  if (player.stats.games.indexOf('apex') === -1) {
    games.push('apex');
  }

  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          games: games,
          apex: apexData,
        },
      },
    }
  );
  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

const setDivisionStats = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);

  const { name, platform } = req.body;

  if (!update(player.stats.division.lastModified, oneMonth)) {
    res.status(405); //Not allowed
    throw new Error('You can only change your account once per month.');
  }

  const playerExists = await checkIfPlayerExists({
    game: 'division',
    name: name,
  });

  if (playerExists) {
    res.status(401); //Unauthorized
    throw new Error('Player with this account already exists.');
  }

  const data = await getDivisionPlayerStats(name, platform);

  if (data.totalresults === 0) {
    res.status(404); //Unauthorized
    throw new Error('Sorry this player does not exist.');
  }

  const divisionData = {
    ...data.results[0],
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };

  let games = player.stats.games;
  if (player.stats.games.indexOf('division') === -1) {
    games.push('division');
  }

  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          games: games,
          division: divisionData,
        },
      },
    }
  );
  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

const setDotaStats = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);

  const { steamId } = req.body;

  if (!update(player.stats.dota.lastModified, oneMonth)) {
    res.status(405); //Not allowed
    throw new Error('You can only change your account once per month.');
  }

  const playerExists = await checkIfPlayerExists({
    game: 'dota',
    steamId: steamId,
  });

  if (playerExists) {
    res.status(401); //Unauthorized
    throw new Error('Player with this account already exists.');
  }

  const data = await getDotaPlayerStats(steamId);

  if (data === 'error') {
    res.status(404); //Not allowed
    throw new Error('This account does not exist.');
  }

  const dotaData = {
    name: data.data1.profile.personaname,
    steamId: steamId,
    competitive_rank: data.data1.competitive_rank,
    solo_competitive_rank: data.data1.solo_competitive_rank,
    leaderboard_rank: data.data1.leaderboard_rank,
    mmr: data.data1.mmr_estimate.estimate,
    wins: data.data2.win,
    loss: data.data2.lose,
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };

  let games = player.stats.games;
  if (player.stats.games.indexOf('dota') === -1) {
    games.push('dota');
  }

  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          games: games,
          dota: dotaData,
        },
      },
    }
  );

  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

const setWarzoneStats = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);

  if (!update(player.stats.warzone.lastModified, oneMonth)) {
    res.status(405); //Not allowed
    throw new Error('You can only change your account once per month.');
  }

  const { name, platform } = req.body;

  const playerExists = await checkIfPlayerExists({
    game: 'warzone',
    platform: platform,
    name: name,
  });

  if (playerExists) {
    res.status(401); //Unauthorized
    throw new Error('Player with this account already exists.');
  }

  let data = await getWarzonePlayerStats(name, platform);

  if (data.br_all === undefined) {
    res.status(404); //Unauthorized
    throw new Error('Sorry this player does not exist.');
  }

  const warzoneData = {
    name: name,
    platform: platform,
    ...data.br_all,
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };
  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          game: 'warzone',
          warzone: warzoneData,
        },
      },
    }
  );
  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

const setXboxLiveGamer = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);

  // if (!update(player.stats.xboxlive.lastModified, oneMonth)) {
  //   res.status(405); //Not allowed
  //   throw new Error('You can only change your account once per month.');
  // }

  const { name, game, gameId, games, xuid, displayImage } = req.body;

  const playerExists = await checkIfPlayerExists({
    game: 'xboxlive',
    name: name,
  });

  // if (playerExists) {
  //   res.status(401); //Unauthorized
  //   throw new Error('Player with this account already exists.');
  // }

  let achievements = await getXboxLiveAchievements(xuid, gameId);

  const xboxliveData = {
    gamerTag: name,
    xuid: xuid,
    game: game,
    games: games,
    displayImage: displayImage,
    titleId: gameId,
    achievements: achievements,
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };

  let allGames = player.stats.games;
  if (player.stats.games.indexOf('xbox') === -1) {
    allGames.push('xbox');
  }

  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          games: allGames,
          xboxlive: xboxliveData,
        },
      },
    }
  );
  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

const getXboxLiveGames = asyncHandler(async (req, res) => {
  const { name } = req.body;

  let xuid = await setXboxLiveGamerTag(name);

  if (isNaN(xuid) || xuid.success === false) {
    res.status(404); //Unauthorized
    throw new Error('Sorry this player does not exist.');
  }

  let data = await getXboxLiveStates(xuid);

  if (data.length < 1) {
    res.status(404); //Unauthorized
    throw new Error('This user is private or has no games.');
  }

  res.status(200); //Success
  return res.json({ games: data, xuid: xuid });
});

const setCsgoStats = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.player.id);
  if (!update(player.stats.csgo.lastModified, oneMonth)) {
    res.status(405); //Not allowed
    throw new Error('You can only change your account once per month.');
  }
  const { steamId } = req.body;
  const playerExists = await checkIfPlayerExists({
    game: 'csgo',
    name: steamId,
  });
  if (playerExists) {
    res.status(401); //Unauthorized
    throw new Error('Player with this account already exists.');
  }
  let data = await getCsgoPlayerStats(steamId);
  if (data.errors) {
    res.status(404); //Unauthorized
    throw new Error('Sorry this player does not exist.');
  }
  const csgoData = {
    steamId: steamId,
    ...data.data.segments[0].stats,
    lastModified: Date.now(),
    lastUpdated: Date.now(),
  };

  let games = player.stats.games;
  if (player.stats.games.indexOf('csgo') === -1) {
    games.push('csgo');
  }

  await Player.updateOne(
    { _id: req.player.id },
    {
      $set: {
        stats: {
          ...player.stats,
          games: games,
          csgo: csgoData,
        },
      },
    }
  );
  const updatedPlayer = await Player.findById(req.player.id);

  res.status(200); //Success
  return res.json({
    success: 'Account successfully set',
    player: updatedPlayer,
  });
});

export {
  setLeagueStats,
  setTeamfightStats,
  setPubgStats,
  setFortniteStats,
  setApexStats,
  setDivisionStats,
  setDotaStats,
  setWarzoneStats,
  setXboxLiveGamer,
  setCsgoStats,
  updateLeagueStats,
  updateTeamfightStats,
  updatePubgStats,
  updateFortniteStats,
  updateApexStats,
  updateDivisionStats,
  updateDotaStats,
  updateWarzoneStats,
  updateXboxLiveStates,
  updateCsgoStats,
  getXboxLiveGames,
};
