const express = require("express");
const multer = require("multer");
const Jimp = require("jimp");
const uuid = require("uuid");
const authorize = require("../../../middlewares/authorize");
const ImageMedia = require("../../../models/media/ImageMedia");

const s3 = require("../../../services/aws/s3");

const router = express.Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 3,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|)$/)) {
      cb(new Error("Please upload an image file."));
    }
    cb(undefined, true);
  },
});

/* eslint-disable no-unused-vars */
function imageUploadErrorHandler(err, req, res, next) {
  let message = err.message;

  switch (err.message) {
    case "Unexpected field":
      message = "Please upload an image file.";
      break;

    case "File too large":
      message = "Image size too large. please upload an image less than 3mb";
  }
  const responseObject = { error: { message } };

  res.status(400).send(responseObject);
}
router.post(
  "/",
  authorize("", { authentication: false }),
  imageUpload.single("image"),
  async (req, res) => {
    const user = req.authSessoin && req.authSessoin.user;
    const { file } = req;

    const fileName = `${uuid.v4()}.jpeg`;
    const mainFile = await resizeMainImage(file.buffer);
    const mainFileBuffer = await mainFile.getBufferAsync(Jimp.MIME_JPEG);

    const aspectRatio = mainFile.bitmap.width / mainFile.bitmap.height;

    const smallImage = await resizeToSmallImage(file.buffer);
    const smallImageBuffer = await smallImage.getBufferAsync(Jimp.MIME_JPEG);

    //good to upload
    const data = await s3.uploadFile("images/" + fileName, mainFileBuffer);

    let smallImageData = null;
    const smallImageFileName = `${uuid.v4()}.jpeg`;
    if (smallImageBuffer) {
      smallImageData = await s3.uploadFile(
        "images/" + smallImageFileName,
        smallImageBuffer
      );
    }

    const imageMedia = new ImageMedia({
      image: fileName,
      imageUrl: data.Location,
      aspectRatio,
      thumbnail: smallImageFileName,
      thumbnailUrl: smallImageData.Location,
    });

    if (user) {
      imageMedia.createdBy = user._id;
    }

    await imageMedia.save();

    res.send(imageMedia);
  },
  imageUploadErrorHandler
);

async function resizeToSmallImage(imageBuffer) {
  return new Promise((resolve, reject) => {
    Jimp.read(imageBuffer)
      .then((result) => {
        result.resize(200, Jimp.AUTO).quality(100);
        resolve(result);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function resizeMainImage(imageBuffer) {
  return new Promise((resolve, reject) => {
    Jimp.read(imageBuffer)
      .then((result) => {
        const originalWidth = result.bitmap.width;
        const resizeWidth = originalWidth > 1024 ? 1024 : originalWidth;
        result.resize(resizeWidth, Jimp.AUTO).quality(100);
        resolve(result);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

module.exports = router;
