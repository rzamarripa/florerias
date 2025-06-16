import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen"), false);
  }
};

const uploadConfig = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

export const uploadSingle = (fieldName) => uploadConfig.single(fieldName);
export const uploadMultiple = (fieldName, maxCount) =>
  uploadConfig.array(fieldName, maxCount);
export const uploadFields = (fields) => uploadConfig.fields(fields);

export default uploadConfig;
