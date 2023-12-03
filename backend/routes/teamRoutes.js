import express from 'express';
const router = express.Router();
import {
  createTeam,
  updateTeam,
  deleteTeam,
  removePlayerFromTeam,
  updateSocialMedia,
  leaveTeam,
  changeRole,
  updateBio,
  updateContact,
  contactUs,
  changeTemplate,
  addGravatar,
  removeGravatar,
  updateStore,
  updateStream,
  updateTheme,
  updatePhotos,
  deletePhoto,
  updateVideos,
  deleteVideo,
  updateProfilePicture,
  toggleSection,
  updateSponsors,
  updateName,
  handleSubmitSub,
  previewProration,
  cancelSubscription,
  resumeSubscription,
  changeSubscription,
  addDiscord,
  isAdmin,
  createCheckoutSession,
  updateBanner,
  updateDivider,
  createCustomerPortalSession,
} from '../controllers/teamController.js';

import {
  protect,
  admin,
  manager,
  coach,
} from '../middleware/authMiddleware.js';

// Unique Routes
router.route('/').post(protect, createTeam); //Replaced by register in players

router.route('/:slug/isAdmin').get(protect, isAdmin); //Replaced by register in players

router.route('/:id').put(protect, manager, updateTeam); //MANAGER (Except for renaming)
router.route('/:id').delete(protect, admin, deleteTeam); //ADMIN
router.route('/:id/updateSocialMedia').put(protect, manager, updateSocialMedia); //MANAGER
router.route('/:id/updateBio').put(protect, manager, updateBio); //MANAGER
router.route('/:id/updateContact').put(protect, manager, updateContact); //MANAGER
router.route('/:id/contactUs').put(contactUs); //MANAGER
router.route('/:id/changeTemplate').put(protect, manager, changeTemplate);
router.route('/:id/addGravatar').put(protect, manager, addGravatar);
router.route('/:id/removeGravatar').put(protect, manager, removeGravatar);
router.route('/:id/updateStore').put(protect, manager, updateStore);
router.route('/:id/updateStream').put(protect, manager, updateStream);
router.route('/:id/updateTheme').put(protect, manager, updateTheme);
router.route('/:id/updateBanner').put(protect, manager, updateBanner);
router.route('/:id/updateDivider').put(protect, manager, updateDivider);
router.route('/:id/updatePhotos').put(protect, manager, updatePhotos);
router.route('/:id/deletePhoto').put(protect, manager, deletePhoto);
router.route('/:id/updateVideos').put(protect, manager, updateVideos);
router.route('/:id/deleteVideo').put(protect, manager, deleteVideo);
router
  .route('/:id/updateProfilePicture')
  .post(protect, manager, updateProfilePicture);
router.route('/:id/toggleSection').put(protect, manager, toggleSection);
router.route('/:id/updateSponsors').put(protect, manager, updateSponsors);
router.route('/:id/updateName').put(protect, manager, updateName);
// Unique Routes
router.route('/:id/leaveTeam').delete(protect, leaveTeam); //PLAYER
router.route('/:id/removePlayer').put(protect, coach, removePlayerFromTeam); //COACH
router.route('/:id/changeRole').put(protect, coach, changeRole); //COACH
router.post('/:id/handleSubmitSub', protect, admin, handleSubmitSub);
router.post('/:id/previewProration', protect, admin, previewProration);
router.post('/:id/cancelSubscription', protect, admin, cancelSubscription);
router.post('/:id/resumeSubscription', protect, admin, resumeSubscription);
router.put('/:id/changeSubscription', protect, admin, changeSubscription);
router.put('/:id/addDiscord', protect, admin, addDiscord);
router.put(
  '/:id/createCustomerPortalSession',
  protect,
  admin,
  createCustomerPortalSession
);
router.put('/:id/createCheckoutSession', protect, admin, createCheckoutSession);

export default router;
