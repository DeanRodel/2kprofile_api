import mongoose from "mongoose";

const gameSchema = mongoose.Schema({
  _id: Number,
  name: String,
  position: [String],
  cover: String,
});

const Game = mongoose.model("Game", gameSchema);

export default Game;
