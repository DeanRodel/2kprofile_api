import express from 'express';
const router = express.Router();

import {
  getPlayer,
  getTeam,
  getTeamDashboard,
  getPlayerDashboard,
  getMyTeams,
  search,
  checkIfPlayerOnTeam,
  getLoggedInProfile,
  uploadPicture,
  moveSection,
  findContact,
  getAllThemes,
  getPlatforms,
  getProfileCartegories,
  getGames,
  getGamePositions,
} from '../controllers/navController.js';

import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { nextTick } from 'process';

const TYPE_IMAGE = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const filter = (req, file, cb) => {
  let size = req.headers['content-length'];
  let isValid = false;
  if (!!TYPE_IMAGE[file.mimetype] && size < 1.5 * 1024 * 1024) {
    isValid = true;
  }
  let error = isValid
    ? null
    : 'Image must be smaller than 1.5MB and of type jpg/jpeg/png';
  cb(error, isValid);
};

const upload = multer({ storage: storage, fileFilter: filter }).single('image');

router.get('/player/:slug', getPlayer);
router.get('/team/:slug', getTeam);

router.get('/platform', getPlatforms);
router.get('/profileCategory', getProfileCartegories);
router.get('/game', getGames);
router.get('/game/:id/position', getGamePositions);

router.get('/checkIfPlayerOnTeam/:slug', protect, checkIfPlayerOnTeam);
router.get('/playerDashboard', protect, getPlayerDashboard);
router.get('/teamDashboard/:slug', protect, getTeamDashboard);
router.get('/profile', protect, getLoggedInProfile);
router.get('/myteams', protect, getMyTeams);
router.put('/search', search);
router.post('/uploadPicture', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      res.status(500);
      res.json({ message: err });
    }else
    uploadPicture(req, res);
  });
});
router.put('/moveSection', protect, moveSection);
router.get('/findContact', protect, findContact);
router.get('/theme', protect, getAllThemes);

export default router;
