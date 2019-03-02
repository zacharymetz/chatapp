const gcsHelpers = require('@google-cloud/storage');
  
const { storage } = gcsHelpers;

const DEFAULT_BUCKET_NAME = 'gcs-bucket-demo'; // Replace with the name of your bucket

/**
 * Middleware for uploading file to GCS.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @return {*}
 */
exports.sendUploadToGCS = (file, next) => {
  console.log(file);
  if (!file) {
    console.log("skipped");
    return next();
  }

  const bucketName =  DEFAULT_BUCKET_NAME;
  const bucket = storage.bucket(bucketName);
  const gcsFileName = `${Date.now()}-${file.originalname}`;
  const uploaded_file = bucket.file(gcsFileName);

  const stream = uploaded_file.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  stream.on('error', (err) => {
    console.log(err);
    file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    file.cloudStorageObject = gcsFileName;

    return uploaded_file.makePublic()
      .then(() => {
        file.gcsUrl = gcsHelpers.getPublicUrl(bucketName, gcsFileName);
        next(file);
      });
  });

  stream.end(file.buffer);
};