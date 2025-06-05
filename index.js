const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const dbConnect = require("./db/dbConnect");
const { router: AdminRouter, isLoggedIn } = require("./routes/AdminRouter");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const CommentRouter = require("./routes/CommentRouter");

dbConnect();

// Cấu hình CORS
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// Cấu hình session
app.use(session({
  secret: "photo-sharing-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(express.json());

// Thêm route mới cho đăng nhập/đăng xuất
app.use("/api/admin", AdminRouter);

// Áp dụng middleware kiểm tra đăng nhập cho các route khác
app.use("/api/user", UserRouter);
app.use("/api/photo", isLoggedIn, PhotoRouter);
app.use("/api/comment", isLoggedIn, CommentRouter);

// Để phục vụ hình ảnh
app.use("/images", express.static("images"));

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
