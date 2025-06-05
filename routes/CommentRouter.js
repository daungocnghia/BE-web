const express = require("express");
const Photo = require("../db/photoModel");
const router = express.Router();

// POST /commentsOfPhoto/:photo_id - Thêm bình luận vào ảnh
router.post("/commentsOfPhoto/:photo_id", async (request, response) => {
  try {
    const photoId = request.params.photo_id;
    const { comment } = request.body;
    const userId = request.session.user._id;
    
    // Kiểm tra định dạng ID ảnh
    if (!photoId.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({ message: "Định dạng ID ảnh không hợp lệ" });
    }
    
    // Kiểm tra nội dung bình luận
    if (!comment || comment.trim() === "") {
      return response.status(400).json({ message: "Nội dung bình luận không được để trống" });
    }
    
    // Tìm ảnh cần thêm bình luận
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return response.status(404).json({ message: "Không tìm thấy ảnh" });
    }
    
    // Thêm bình luận mới
    const newComment = {
      comment: comment,
      date_time: new Date(),
      user_id: userId
    };
    
    photo.comments.push(newComment);
    await photo.save();
    
    // Lấy thông tin đầy đủ của bình luận vừa thêm
    const updatedPhoto = await Photo.findById(photoId).populate({
      path: "comments.user_id",
      select: "_id first_name last_name"
    });


    const addedComment = updatedPhoto.comments[updatedPhoto.comments.length - 1];
    
    // Định dạng dữ liệu trả về
    const formattedComment = {
      _id: addedComment._id,
      comment: addedComment.comment,
      date_time: addedComment.date_time,
      user: {
        _id: addedComment.user_id._id,
        first_name: addedComment.user_id.first_name,
        last_name: addedComment.user_id.last_name
      }
    };
    
    response.status(201).json(formattedComment);
  } catch (error) {
    console.error("Lỗi khi thêm bình luận:", error);
    response.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
});

module.exports = router;