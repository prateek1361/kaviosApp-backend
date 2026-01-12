const express = require("express")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
const dotenv = require("dotenv")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const { v4: uuid } = require("uuid")

const { initializeDatabase } = require("./db.connect")
const User = require("./models/User")
const Album = require("./models/Album")
const Image = require("./models/Image")

dotenv.config()


const app = express()
app.use(cors())
app.use(express.json())


initializeDatabase()


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})


const storage = multer.diskStorage({})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files allowed"))
    }
  }
})


const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ message: "No token" })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: "Invalid token" })
  }
}


app.post("/login", async (req, res) => {
  const { email } = req.body

  let user = await User.findOne({ email })
  if (!user) {
    user = await User.create({ userId: uuid(), email })
  }

  const token = jwt.sign(user.toObject(), process.env.JWT_SECRET)
  res.json({ token })
})


app.post("/albums", authenticate, async (req, res) => {
  const album = await Album.create({
    albumId: uuid(),
    name: req.body.name,
    description: req.body.description,
    ownerId: req.user.userId,
    sharedWith: []
  })
  res.status(201).json(album)
})

app.get("/albums", authenticate, async (req, res) => {
  const albums = await Album.find({
    $or: [
      { ownerId: req.user.userId },
      { sharedWith: req.user.email }
    ]
  })
  res.json(albums)
})

app.post("/albums/:albumId/share", authenticate, async (req, res) => {
  const album = await Album.findOne({ albumId: req.params.albumId })
  album.sharedWith.push(...req.body.emails)
  album.sharedWith = [...new Set(album.sharedWith)]
  await album.save()
  res.json(album)
})

app.delete("/albums/:albumId", authenticate, async (req, res) => {
  await Image.deleteMany({ albumId: req.params.albumId })
  await Album.deleteOne({ albumId: req.params.albumId })
  res.json({ message: "Album deleted" })
})


app.post(
  "/albums/:albumId/images",
  authenticate,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" })
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "kaviospix"
      })

      fs.unlinkSync(req.file.path)

      const image = await Image.create({
        imageId: uuid(),
        albumId: req.params.albumId,
        name: req.file.originalname,
        tags: req.body.tags || [],
        person: req.body.person,
        isFavorite: false,
        comments: [],
        size: req.file.size,
        uploadedAt: new Date(),
        imageUrl: result.secure_url
      })

      res.status(200).json({
        message: "Image uploaded successfully",
        image
      })
    } catch (error) {
      res.status(500).json({ message: "Image upload failed", error })
    }
  }
)

app.get("/albums/:albumId/images", authenticate, async (req, res) => {
  const images = await Image.find({ albumId: req.params.albumId })
  res.json(images)
})

app.put(
  "/albums/:albumId/images/:imageId/favorite",
  authenticate,
  async (req, res) => {
    const image = await Image.findOne({ imageId: req.params.imageId })
    image.isFavorite = req.body.isFavorite
    await image.save()
    res.json(image)
  }
)

app.post(
  "/albums/:albumId/images/:imageId/comments",
  authenticate,
  async (req, res) => {
    const image = await Image.findOne({ imageId: req.params.imageId })
    image.comments.push(req.body.comment)
    await image.save()
    res.json(image)
  }
)

app.delete(
  "/albums/:albumId/images/:imageId",
  authenticate,
  async (req, res) => {
    await Image.deleteOne({ imageId: req.params.imageId })
    res.json({ message: "Image deleted" })
  }
)


const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
