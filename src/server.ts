import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

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

app.post(
  "/api/files/",
  upload.array("files"),
  (req: Request, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        throw new Error("No files");
      }

      const uploadedFiles = (req.files as Express.Multer.File[]).map(
        (file) => ({
          fileName: file.originalname,
          filePath:
            `${process.env.BASE_URL}:${process.env.PORT}/` + file.filename,
          fileSize: file.size,
          fileExtension: file.originalname.slice(
            file.originalname.lastIndexOf(".") + 1,
          ),
        }),
      );

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
