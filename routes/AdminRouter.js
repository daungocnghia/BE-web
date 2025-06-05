const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
const session = require("express-session");

// Middleware kiểm tra đăng nhập
const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: "Chưa đăng nhập" });
};
 
// POST /login - Đăng nhập người dùng
router.post("/login", async (req, res) => {
  try {
    const { login_name, password } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!login_name || !password) {
      return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập và mật khẩu" });
    }
    
    // Tìm người dùng theo login_name
    const user = await User.findOne({ login_name });
    
    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }
    
    // Lưu thông tin người dùng vào session
    req.session.user = {
      _id: user._id,
      login_name: user.login_name,
      first_name: user.first_name,
      last_name: user.last_name
    };
    
    // Trả về thông tin người dùng (không bao gồm mật khẩu)
    return res.status(200).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      login_name: user.login_name
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
});

// POST /logout - Đăng xuất người dùng
router.post("/logout", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(400).json({ message: "Chưa đăng nhập" });
  }
  
  req.session.destroy();
  return res.status(200).json({ message: "Đăng xuất thành công" });
});

// GET /current - Kiểm tra người dùng hiện tại
router.get("/current", isLoggedIn, (req, res) => {
  return res.status(200).json(req.session.user);
});

module.exports = { router, isLoggedIn };