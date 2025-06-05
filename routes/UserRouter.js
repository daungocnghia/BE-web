const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
const { isLoggedIn } = require("./AdminRouter");

// Thêm route POST / - Đăng ký người dùng mới
router.post("/", async (request, response) => {
  try {
    const { login_name, password, first_name, last_name, location, description, occupation } = request.body;
    
    // Kiểm tra dữ liệu bắt buộc
    if (!login_name || !password || !first_name || !last_name) {
      return response.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }
    
    // Kiểm tra login_name đã tồn tại chưa
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return response.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    }
    
    // Tạo người dùng mới
    const newUser = new User({
      login_name,
      password, // Trong thực tế nên mã hóa mật khẩu
      first_name,
      last_name,
      location: location || "",
      description: description || "",
      occupation: occupation || ""
    });
    
    await newUser.save();
    
    response.status(201).json({ 
      login_name: newUser.login_name,
      _id: newUser._id,
      first_name: newUser.first_name,
      last_name: newUser.last_name
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký người dùng:", error);
    response.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
});

// Áp dụng middleware isLoggedIn cho các route bên dưới trong UserRouter
router.use(isLoggedIn);

// Các route hiện tại
// GET /list - Trả về danh sách người dùng
router.get("/list", async (request, response) => {
  try {
    const users = await User.find({}).select("_id first_name last_name");
    response.status(200).json(users);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    response.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
});

// GET /:id - Trả về thông tin chi tiết của người dùng
router.get("/:id", async (request, response) => {
  try {
    const userId = request.params.id;
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({ message: "Định dạng ID người dùng không hợp lệ" });
    }
    
    const user = await User.findById(userId).select("_id first_name last_name location description occupation");
    
    if (!user) {
      return response.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    response.status(200).json(user);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    response.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
});
 
module.exports = router;