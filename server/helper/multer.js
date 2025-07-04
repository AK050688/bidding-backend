
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const FILE_SIZE_LIMIT = 15 * 1024 * 1024; // 15MB

function multerMiddleware(destFolder, allowedFileTypes) {
  // Ensure destination folder exists
  const filePath = path.join(process.cwd(), destFolder);
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
  }

  // Configure storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, filePath);
    },
    filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  // Configure file filter
  const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Only ${allowedFileTypes.join(', ')} files are allowed.`
        )
      );
    }
  };

  // Create multer instance
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: FILE_SIZE_LIMIT },
  });
}

export { multerMiddleware };
