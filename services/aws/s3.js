const AWS = require("aws-sdk");

exports.uploadFile = async (filePath, fileData) => {
  try {
    var params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Body: fileData,
      Key: "believe-it/" + filePath,
    };
    const s3 = new AWS.S3();
    upload = await s3.upload(params).promise();
    return upload;
  } catch (err) {
    throw err;
  }
};

exports.streamUpload = ({ filePath, fileData, onComplete, onError }) => {
  var params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Body: fileData,
    Key: "believe-it/" + filePath,
  };

  const options = { partSize: 5 * 1024 * 1024, queueSize: 10 };
  var s3 = new AWS.S3();
  s3.upload(params, options, function (err, data) {
    if (err) {
      if (onError) {
        onError(err);
      } else {
        throw err;
      }
    }
    if (onComplete) onComplete(data);
  })
    .on("httpUploadProgress", function (evt) {})
    .on("end", function () {});
};
