import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const staticDir = path.join(__dirname, "..", "static");
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

app.use(cors());
app.use(express.static(staticDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, staticDir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      String(Date.now()) +
        "." +
        file.originalname.slice(file.originalname.lastIndexOf(".") + 1),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 20 MB
  },
});

app.use(morgan("dev"));

const imageExtensions = [
  "jpg",
  "jpeg",
  "webp",
  "png",
  "heic",
  "JPG",
  "JPEG",
  "WEBP",
  "PNG",
  "HEIC",
];

app.post(
  "/api/files/",
  upload.array("files"),
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    try {
      if (!files || files.length === 0) {
        throw new Error("No files");
      }

      let uploadedFiles = [];

      for (let i in files) {
        const originalName = Buffer.from(
          files[i].originalname,
          "latin1",
        ).toString("utf8");
        const fileNameWithoutExtension = files[i].originalname.slice(
          0,
          files[i].originalname.lastIndexOf("."),
        );

        const fileExtension = files[i].originalname.slice(
          files[i].originalname.lastIndexOf(".") + 1,
        );

        let compressedPath;

        if (imageExtensions.includes(fileExtension)) {
          compressedPath = staticDir + "/" + `${fileNameWithoutExtension}.webp`;

          await sharp(files[i].path)
            .withMetadata()
            .webp({ quality: 10 })
            .toFile(compressedPath);
        }

        uploadedFiles.push({
          fileName: originalName,
          filePath:
            `${process.env.BASE_URL}:${process.env.PORT}/` + files[i].filename,
          compressedFilePath: compressedPath
            ? `${process.env.BASE_URL}:${process.env.PORT}/` +
              `${fileNameWithoutExtension}.webp`
            : null,
          compressedFileName: compressedPath
            ? `${fileNameWithoutExtension}.webp`
            : null,
          fileSize: files[i].size,
          fileExtension,
        });
      }

      res.status(200).json({
        message: "Файл загружен",
        files: uploadedFiles,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  },
);

// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
