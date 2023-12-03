import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
import {
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
  getXboxLiveGames,
} from '../controllers/statsControllers/serverController.js';

router.route('/setLeagueStats').post(protect, setLeagueStats);
router.route('/setTeamfightStats').post(protect, setTeamfightStats);
router.route('/setPubgStats').post(protect, setPubgStats);
router.route('/setFortniteStats').post(protect, setFortniteStats);
router.route('/setApexStats').post(protect, setApexStats);
router.route('/setDivisionStats').post(protect, setDivisionStats);
router.route('/setDotaStats').post(protect, setDotaStats);
router.route('/setWarzoneStats').post(protect, setWarzoneStats);
router.route('/setXboxLiveGamer').post(protect, setXboxLiveGamer);
router.route('/setCsgoStats').post(protect, setCsgoStats);
router.route('/getXboxLiveGames').post(protect, getXboxLiveGames);

export default router;
