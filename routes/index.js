const express = require("express");
const authController = require("../controller/authController");
const auth = require("../middlewares/auth");
const blogController = require("../controller/blogController");

const router = express.Router();

// User
// 1. register
router.post("/register", authController.register);

// 2. login
router.post("/login", authController.login);

// 3. logout
router.post("/logout", auth, authController.logout);

// 4. refresh
router.get("/refresh", authController.refresh);

// Blog
// 1. create blog
router.post("/blog", auth, blogController.create);

// 2. get all blogs
router.get("/blog/all", auth, blogController.getAll);

// 3. get blog by id
router.get("/blog/:id", auth, blogController.getById);

// 4. update blog
router.put("/blog", auth, blogController.update);

// 5. delete blog
router.delete("/blog/:id", auth, blogController.delete);

// Comment
// create comment
// read comments by blog id

module.exports = router;
