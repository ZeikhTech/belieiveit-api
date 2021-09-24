const express = require("express");
const multer = require("multer");

const uuid = require("uuid");
const authorize = require("../../../middlewares/authorize");
const AudioMedia = require("../../../models/media/AudioMedia");

const s3 = require("../../../services/aws/s3");

const router = express.Router();

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 20,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(mp3|wav|m4a)$/))
      return cb(new Error("Please upload an audio file."));
    cb(undefined, true);
  },
});

/* eslint-disable no-unused-vars */
function audioUploadErrorHandler(err, req, res, next) {
  let message = err.message;

  switch (err.message) {
    case "Unexpected field":
      message = "Please upload an audio(.mp3 or .wav) file.";
      break;
    case "File too large":
      message = "Image size too large. please upload an image less than 3mb";
  }
  const responseObject = { error: { message, detail: err.message } };

  res.status(400).send(responseObject);
}
router.post(
  "/",
  authorize("", { authentication: false }),
  audioUpload.single("audio"),
  async (req, res) => {
    const user = req.authSessoin && req.authSessoin.user;

    const fileExt = req.file.originalname.split(".").pop();
    const fileName = `${uuid.v4()}.${fileExt}`;

    //good to upload
    const data = await s3.uploadFile("audio/" + fileName, req.file.buffer);

    const audioMedia = new AudioMedia({
      audio: fileName,
      audioUrl: data.Location,
    });

    if (user) {
      audioMedia.createdBy = user._id;
    }

    await audioMedia.save();

    res.send(audioMedia);
  },
  audioUploadErrorHandler
);

module.exports = router;
