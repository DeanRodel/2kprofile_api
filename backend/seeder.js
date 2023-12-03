import dotenv from "dotenv";
import players from "./data/players.js";
import teams from "./data/teams.js";
import themes from "./data/themes.js";
import games from "./data/games.js";
import platforms from "./data/platforms.js";
import profileCategories from "./data/profileCategories.js";
import Player from "./models/playerModel.js";
import Team from "./models/teamModel.js";
import Theme from "./models/themeModel.js";
import Game from "./models/gameModel.js";
import Platform from "./models/platformModel.js";
import ProfileCategory from "./models/profileCategoryModel.js";
import connectDB from "./config/db.js";

dotenv.config();

await connectDB();

const _updateInsert = async (model, data, callback) => {
  for (const entity of data) {
    await model.findOneAndUpdate(
      { _id: entity._id },
      entity,
      { upsert: true },
      callback
    );
  }
};

const updateData = async () => {
  const callback = (err, doc) => {
    if (err) console.log(err);
  };
  try {
    await _updateInsert(Game, games, callback);
    await _updateInsert(Platform, platforms, callback);
    await _updateInsert(Player, players, callback);
    await _updateInsert(ProfileCategory, profileCategories, callback);
    await _updateInsert(Team, teams, callback);
    await _updateInsert(Theme, themes, callback);

    console.log("Data Updated!");
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await Player.deleteMany();
    await Team.deleteMany();
    await Theme.deleteMany();
    await Game.deleteMany();
    await Platform.deleteMany();
    await ProfileCategory.deleteMany();

    // Load sample data for games and players
    await Player.insertMany(players);
    await Team.insertMany(teams);
    await Theme.insertMany(themes);
    await Game.insertMany(games);
    await Platform.insertMany(platforms);
    await ProfileCategory.insertMany(profileCategories);

    console.log("Data Imported!");
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Player.deleteMany();
    await Team.deleteMany();
    await Theme.deleteMany();
    await Game.deleteMany();
    await Platform.deleteMany();
    await ProfileCategory.deleteMany();

    console.log("Data Destroyed!");
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-u") {
  updateData();
} else if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
