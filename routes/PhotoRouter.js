const express = require("express");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Cấu hình multer (giữ nguyên)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép tải lên file ảnh"), false);
    }
  }
});

// POST /photos/new (giữ nguyên)
router.post("/new", upload.single("photo"), async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ message: "Vui lòng chọn ảnh để tải lên" });
    }

    const userId = request.session.user._id;
    
    const newPhoto = new Photo({
      file_name: request.file.filename,
      date_time: new Date(),
      user_id: userId,
      comments: []
    });
    
    await newPhoto.save();
    
    response.status(201).json(newPhoto);
  } catch (error) {
    console.error("Lỗi khi tải lên ảnh:", error);
    response.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
});

// GET /photosOfUser/:id
router.get("/photosOfUser/:id", async (request, response) => {
  try {
    const userId = request.params.id;
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({ message: "Định dạng ID người dùng không hợp lệ" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return response.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const photos = await Photo.find({ user_id: userId });

    const formattedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const comments = await Promise.all(
          photo.comments.map(async (comment) => {
            const commentUser = await User.findById(comment.user_id).select("_id first_name last_name");
            return {
              _id: comment._id,
              comment: comment.comment,
              date_time: comment.date_time,
              user: commentUser ? {
                _id: commentUser._id,
                first_name: commentUser.first_name || "Khách",
                last_name: commentUser.last_name || ""
              } : null
            };
          })
        );

        return {
          _id: photo._id,
          user_id: photo.user_id,
          file_name: photo.file_name,
          date_time: photo.date_time,
          comments
        };
      })
    );

    console.log("Formatted photos:", JSON.stringify(formattedPhotos, null, 2));
    response.status(200).json(formattedPhotos);
  } catch (error) {
    console.error("Lỗi khi lấy ảnh của người dùng:", error);
    response.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
});

module.exports = router;