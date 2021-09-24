const express = require("express");
const authorize = require("../../middlewares/authorize");

const _ = require("lodash");
const User = require("../../models/User");
const ImageMedia = require("../../models/media/ImageMedia");

const requestValidator = require("../../middlewares/requestValidator");
const {
  updateProfilePicSchema,
  updateLocationSchema,
  updateUserDetails,
  updateUserNotificationsSchema,
} = require("../../validators/users");
const reScheduleNotifications = require("../../helpers/reScheduleNotifications");

const sanitizeUser = require("../../sanitizers/user");

const router = express.Router();

router.put(
  "/update_profile_pic",
  requestValidator(updateProfilePicSchema),
  authorize(),
  async (req, res) => {
    const { image } = _.pick(req.body, ["image"]);

    const { user } = req.authSession;

    //making previous image unused
    if (user.image && user.image._id) {
      const previousImage = await ImageMedia.findByIdAndUpdate(
        user.image._id,
        {
          isUsed: false,
        },
        { new: true }
      );
    }

    const newImage = await ImageMedia.findByIdAndUpdate(
      image,
      { isUsed: true },
      { new: true }
    );
    if (!newImage)
      return res.status(404).send({
        error: {
          message: "Invalid image id",
        },
      });

    user.image = newImage;
    await user.save();

    res.send(sanitizeUser(user));
  }
);

router.put(
  "/update_profile_details",
  requestValidator(updateUserDetails),
  authorize(),
  async (req, res) => {
    const body = _.pick(req.body, [
      "firstname",
      "lastname",
      "gender",
      "relationshipStatus",
      "employmentStatus",
      "numberOfchildrens",
      "topHobbies",
      "ethnicity",
      "dateOfBirth",
    ]);

    const { user } = req.authSession;

    const updatedUser = await User.findByIdAndUpdate(user._id, body, {
      new: true,
    });

    res.send(sanitizeUser(updatedUser));
  }
);

router.put(
  "/update_location",
  requestValidator(updateLocationSchema),
  authorize(),
  async (req, res) => {
    const { latitude, longitude } = _.pick(req.body, ["latitude", "longitude"]);

    const { user } = req.authSession;

    user.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    await user.save();

    res.send({
      message: "Location Updated!",
    });
  }
);

router.put("/reset_chat_count", authorize(), async (req, res) => {
  const { user } = req.authSession;

  await User.findByIdAndUpdate(user._id, {
    chatCount: 0,
  });

  res.send({ message: "Chat Count updated", count: 0 });
});

router.put("/reset_notification_count", authorize(), async (req, res) => {
  const { user } = req.authSession;

  await User.findByIdAndUpdate(user._id, {
    notificationCount: 0,
  });

  res.send({ message: "Notification Count updated", count: 0 });
});

router.put(
  "/update_notification_settings",
  requestValidator(updateUserNotificationsSchema),
  authorize(),
  async (req, res) => {
    const { user } = req.authSession;

    const body = _.pick(req.body, [
      "emailChatNotifications",
      "textChatNotifications",
      "emailMilestoneNotifications",
      "textMilestoneNotifications",
      "affirmationReminderTime",
      "goalPlan",
      "eCoaching",
      "prayers",
      "motivationalQoutes",
      "extraAffirmations",
    ]);

    user.notificationSettings = body;
    await user.save();
    reScheduleNotifications(user);
    res.send(user.notificationSettings);
  }
);

module.exports = router;
