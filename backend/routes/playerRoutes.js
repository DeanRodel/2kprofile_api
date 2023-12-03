import express from 'express';
const router = express.Router();
import {
  authUser,
  registerUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import {
  setProfileInfo,
  searchForPlayerToInvite,
  sendTeamInvite,
  getTeamInvites,
  deleteTeamInvite,
  acceptTeamInvite,
  deleteAccount,
  updateSocialMedia,
  setEmail,
  setUsername,
  setPassword,
  updateBio,
  updateContact,
  contactMe,
  changeTemplate,
  addGravatar,
  removeGravatar,
  updateStore,
  updateStream,
  updateTheme,
  updatePhotos,
  updateVideos,
  deletePhoto,
  deleteVideo,
  updateProfilePicture,
  addInstagram,
  toggleSection,
  upgradeAccount,
  updateSponsors,
  handleSubmitSub,
  updateDivider,
  updateBanner,
  getYoutubePlaylist,
  setDefaultStat,
  removeStat,
  addDiscord,
  createCustomerPortalSession,
  createCheckoutSession,
  updateStripeSubscription,
} from '../controllers/playerController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

// SEARCH ROUTES
router.put('/searchForPlayerToInvite', searchForPlayerToInvite);

//TEAM INVITE ROUTES
router.get('/teamInvite', protect, getTeamInvites);
router.post('/teamInvite', protect, sendTeamInvite);
router.put('/teamInvite', protect, acceptTeamInvite);
router.delete('/teamInvite', protect, deleteTeamInvite);

//AUTHENTICATION ROUTES (Register, login, forgot/reset password)
router.post('/', registerUser);
router.post('/login', authUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

//PLAYER ROUTES (getPlayer, setProfileInfo)
router.put('/profileinfo', protect, setProfileInfo);
router.put('/setEmail', protect, setEmail);
router.put('/setUsername', protect, setUsername);
router.put('/setPassword', protect, setPassword);
router.delete('/deleteAccount', protect, deleteAccount);
router.route('/updateSocialMedia').put(protect, updateSocialMedia);
router.put('/updateBio', protect, updateBio);
router.put('/updateContact', protect, updateContact);
router.put('/contactMe/:id', contactMe);
router.put('/changeTemplate', protect, changeTemplate);
router.put('/addGravatar', protect, addGravatar);
router.put('/removeGravatar', protect, removeGravatar);
router.put('/updateStore', protect, updateStore);
router.put('/updateStream', protect, updateStream);
router.put('/updateTheme', protect, updateTheme);
router.put('/updatePhotos', protect, updatePhotos);
router.put('/deletePhoto', protect, deletePhoto);
router.put('/updateVideos', protect, updateVideos);
router.put('/deleteVideo', protect, deleteVideo);
router.post(
  '/updateProfilePicture',
  protect,
  upload.single('image'),
  updateProfilePicture
);
router.put('/addInstagram', protect, addInstagram);
router.put('/toggleSection', protect, toggleSection);
router.put('/upgradeAccount', protect, upgradeAccount);
router.put('/updateSponsors', protect, updateSponsors);
router.put('/updateDivider', protect, updateDivider);
router.put('/updateBanner', protect, updateBanner);
router.post('/handleSubmitSub', protect, handleSubmitSub);
router.get('/getYoutubePlaylist', protect, getYoutubePlaylist);
router.put('/setDefaultStat', protect, setDefaultStat);
router.put('/removeStat', protect, removeStat);
router.put('/addDiscord', protect, addDiscord);
router.put(
  '/createCustomerPortalSession',
  protect,
  createCustomerPortalSession
);
router.put('/createCheckoutSession', protect, createCheckoutSession);
router.put('/updateStripeSubscription', updateStripeSubscription);

export default router;
