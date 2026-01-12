import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(), // ✅ IMPORTANT
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files allowed"))
    }
  }
});
