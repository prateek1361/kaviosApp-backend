const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const passport = require("passport");
const { v4: uuid } = require("uuid");

dotenv.config();

require("./config/passport");

const { initializeDatabase } = require("./db.connect");
const User = require("./models/User");
const Album = require("./models/Album");
const Image = require("./models/Image");

const app = express();



app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: "kaviospix_session_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

initializeDatabase();



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});



const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};



app.get("/", (req, res) => {
  res.send("🚀 KaviosPix API running");
});



app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    
    res.redirect(
      `https://2nqhv9.csb.app/auth-success?token=${token}`
    );
  }
);



app.post("/albums", authenticate, async (req, res) => {
  const album = await Album.create({
    albumId: uuid(),
    name: req.body.name,
    description: req.body.description || "",
    ownerId: req.user.userId,
    sharedWith: [],
  });

  res.status(201).json(album);
});

app.get("/albums", authenticate, async (req, res) => {
  const albums = await Album.find({
    $or: [
      { ownerId: req.user.userId },
      { sharedWith: req.user.email },
    ],
  });

  res.json(albums);
});

app.post("/albums/:albumId/share", authenticate, async (req, res) => {
  const album = await Album.findOne({ albumId: req.params.albumId });

  if (!album || album.ownerId !== req.user.userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  album.sharedWith = [...new Set([...album.sharedWith, ...req.body.emails])];
  await album.save();

  res.json(album);
});

app.delete("/albums/:albumId", authenticate, async (req, res) => {
  await Image.deleteMany({ albumId: req.params.albumId });
  await Album.deleteOne({ albumId: req.params.albumId });
  res.json({ message: "Album deleted" });
});



app.post(
  "/albums/:albumId/images",
  authenticate,
  upload.single("image"),
  async (req, res) => {
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      { folder: "kaviospix" }
    );

    const image = await Image.create({
      imageId: uuid(),
      albumId: req.params.albumId,
      name: req.file.originalname,
      tags: [],
      person: "",
      isFavorite: false,
      comments: [],
      size: req.file.size,
      uploadedAt: new Date(),
      imageUrl: result.secure_url,
    });

    res.json(image);
  }
);

app.get("/albums/:albumId/images", authenticate, async (req, res) => {
  const album = await Album.findOne({
    albumId: req.params.albumId,
    $or: [
      { ownerId: req.user.userId },
      { sharedWith: req.user.email },
    ],
  });

  if (!album) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json(await Image.find({ albumId: req.params.albumId }));
});

app.put(
  "/albums/:albumId/images/:imageId/favorite",
  authenticate,
  async (req, res) => {
    const image = await Image.findOne({ imageId: req.params.imageId });
    image.isFavorite = req.body.isFavorite;
    await image.save();
    res.json(image);
  }
);

app.post(
  "/albums/:albumId/images/:imageId/comments",
  authenticate,
  async (req, res) => {
    const image = await Image.findOne({ imageId: req.params.imageId });
    image.comments.push(req.body.comment);
    await image.save();
    res.json(image);
  }
);

app.delete(
  "/albums/:albumId/images/:imageId",
  authenticate,
  async (req, res) => {
    await Image.deleteOne({ imageId: req.params.imageId });
    res.json({ message: "Image deleted" });
  }
);


app.put("/albums/:albumId", authenticate, async (req, res) => {
  try {
    const album = await Album.findOne({ albumId: req.params.albumId });

    if (!album || album.ownerId !== req.user.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.body.name) album.name = req.body.name;
    if (req.body.description !== undefined) album.description = req.body.description;

    await album.save();
    res.json(album);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to edit album" });
  }
});


app.put("/albums/:albumId/images/:imageId/tags", authenticate, async (req, res) => {
  try {
    const image = await Image.findOne({ imageId: req.params.imageId });
    if (!image) return res.status(404).json({ message: "Image not found" });

    image.tags = req.body.tags || [];
    await image.save();
    res.json(image);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update tags" });
  }
});


app.put("/albums/:albumId/images/:imageId/person", authenticate, async (req, res) => {
  try {
    const image = await Image.findOne({ imageId: req.params.imageId });
    if (!image) return res.status(404).json({ message: "Image not found" });

    image.person = req.body.person || "";
    await image.save();
    res.json(image);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update person" });
  }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
