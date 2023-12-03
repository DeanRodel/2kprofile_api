import fetch from 'node-fetch';

async function setLeaguePlayerId(name, region) {
  const link = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${process.env.RIOT_API_KEY}`;
  const response = await fetch(link);
  const data = await response.json();
  return data.id;
}

async function getLeaguePlayerStats(accountId, region) {
  const link = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${accountId}?api_key=${process.env.RIOT_API_KEY}`;
  const response = await fetch(link);
  const data = await response.json();
  return data;
}

async function setTeamfightPlayerId(name, region) {
  const link = `https://${region}.api.riotgames.com/tft/summoner/v1/summoners/by-name/${name}?api_key=${process.env.RIOT_API_KEY}`;
  const response = await fetch(link);
  const data = await response.json();
  return data.id;
}

async function getTeamfightPlayerStats(accountId, region) {
  const link = `https://${region}.api.riotgames.com/tft/league/v1/entries/by-summoner/${accountId}?api_key=${process.env.RIOT_API_KEY}`;
  const response = await fetch(link);
  const data = await response.json();
  return data;
}

async function setPubgPlayerId(name, platform) {
  const link = `https://api.pubg.com/shards/${platform}/players?filter[playerNames]=${name}`;
  const response = await fetch(link, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + process.env.PUBG_API_KEY,
      accept: 'application/vnd.api+json',
    },
  });
  const data = await response.json();
  if (data.errors) {
    return 'error';
  } else {
    return data.data[0].id;
  }
}

//Stadia players must have gamePad=true
async function getPubgPlayerStats(accountId, platform) {
  let link = `https://api.pubg.com/shards/${platform}/players/${accountId}/seasons/lifetime`;
  if (platform === 'stadia') {
    link.concat('?filter[gamepad]=true');
  }
  const response = await fetch(link, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + process.env.PUBG_API_KEY,
      accept: 'application/vnd.api+json',
    },
  });

  const data = await response.json();
  return data;
}

async function setFortnitePlayerId(name) {
  const link = `https://fortniteapi.io/v1/lookup?username=${name}`;
  const data = await fetch(link, {
    method: 'GET',
    headers: {
      Authorization: process.env.FORTNITE_API_KEY,
    },
  })
    .then((response) => {
      if (!response.ok) {
        return Promise.reject(response);
      }
      return response.json();
    })
    .catch((error) => {
      console.log('Fetch error');
      console.log(error);
    });
  console.log(data);
  return data.account_id;
}

async function getFortnitePlayerStats(accountId) {
  const link = `https://fortniteapi.io/v1/stats?account=${accountId}`;
  const data = await fetch(link, {
    method: 'GET',
    headers: {
      Authorization: process.env.FORTNITE_API_KEY,
    },
  })
    .then((response) => {
      if (!response.ok) {
        return Promise.reject(response);
      }
      return response.json();
    })
    .catch((error) => {
      console.log('Fetch error');
      console.log(error);
    });
    console.log(data)
  return data;
}

async function getApexPlayerStats(name, platform) {
  const link = `https://api.mozambiquehe.re/bridge?version=5&platform=${platform}&player=${name}&auth=${process.env.APEX_API_KEY}`;
  const response = await fetch(link, {
    method: 'GET',
  });
  const data = await response.json();
  return data;
}

async function getDivisionPlayerStats(name, platform) {
  const link = `https://thedivisiontab.com/api/search.php?name=${name}&platform=${platform}`;
  const response = await fetch(link);
  const data = await response.json();
  return data;
}

async function getDotaPlayerStats(steamId) {
  const link1 = `https://api.opendota.com/api/players/${steamId}`;
  const link2 = `https://api.opendota.com/api/players/${steamId}/wl`;
  const response1 = await fetch(link1);
  const response2 = await fetch(link2);
  const data1 = await response1.json();
  const data2 = await response2.json();
  if (data1.error || data2.error) {
    return 'error';
  } else {
    const result = { data1, data2 };
    return result;
  }
}

async function getWarzonePlayerStats(name, platform) {
  const nameCleaned = name.replace(/\s/g, '%20');
  const link = `https://call-of-duty-modern-warfare.p.rapidapi.com/warzone/${nameCleaned}/${platform}`;
  const response = await fetch(link, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': `${process.env.WARZONE_API_KEY}`,
      'x-rapidapi-host': 'call-of-duty-modern-warfare.p.rapidapi.com',
      useQueryString: true,
    },
  });
  const data = await response.json();
  return data;
}

async function setXboxLiveGamerTag(gamerTag) {
  const nameCleaned = gamerTag.replace(/\s/g, '%20');
  const link = `https://xapi.us/v2/xuid/${nameCleaned}`;
  const response = await fetch(link, {
    method: 'GET',
    headers: {
      'X-AUTH': `${process.env.XBOX_LIVE_X_AUTH}`,
    },
  });
  const data = await response.json();
  return data;
}

async function getXboxLiveStates(xuid) {
  const link = `https://xapi.us/v2/${xuid}/titlehub-achievement-list`;
  const response = await fetch(link, {
    method: 'GET',
    headers: {
      'X-AUTH': `${process.env.XBOX_LIVE_X_AUTH}`,
    },
  });
  const data = await response.json();

  var games = [];

  data.titles.forEach((game) => {
    games.push({
      title: game.name,
      titleId: game.titleId,
      devices: game.devices,
      displayImage: game.displayImage,
      achievement: game.achievement,
    });
  });

  return games;
}

async function getXboxLiveAchievements(xuid, titleId) {
  const link = `https://xapi.us/v2/${xuid}/achievements/${titleId}`;

  const response = await fetch(link, {
    method: 'GET',
    headers: {
      'X-AUTH': `${process.env.XBOX_LIVE_X_AUTH}`,
    },
  });
  const data = await response.json();

  console.log(data);

  var achievements = [];

  data
    .filter((achievement) => achievement.progressState === 'Achieved')
    .forEach((achievement) => {
      achievements.push({
        name: achievement.name,
        gamerscore: '0',
        description: achievement.description,
        lockedDescription: achievement.lockedDescription,
        timeUnlocked: achievement.progression.timeUnlocked,
        imageUnlocked: achievement.mediaAssets[0].url,
      });
    });

  console.log(achievements);

  return achievements;
}

async function getCsgoPlayerStats(steamId) {
  let link = `https://public-api.tracker.gg/v2/csgo/standard/profile/steam/${steamId}`;
  const response = await fetch(link, {
    method: 'GET',
    headers: {
      'TRN-Api-Key': '15a56c1f-fb33-4607-bfda-b21fb220b6bf',
    },
  });
  const data = await response.json();
  return data;
}

export {
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
  getXboxLiveAchievements,
  getCsgoPlayerStats,
};
