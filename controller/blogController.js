const Joi = require("joi");
const fs = require("fs");
const Blog = require("../models/blog");
const { BACKEND_SERVER_PATH } = require("../config/index");
const BlogDTO = require("../dto/blog");
const BlogDetailsDTO = require("../dto/blog-details");

// regular expression to match the string pattern against mongodb id pattern
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const blogController = {
  // create blog method
  async create(req, res, next) {
    // 1. validate req.body

    // blog Schema
    const createBlogSchema = Joi.object({
      title: Joi.string().required(),
      author: Joi.string().regex(mongodbIdPattern).required(),
      content: Joi.string().required(),
      photo: Joi.string().required(),
    });

    // validation
    const { error } = createBlogSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const { title, author, content, photo } = req.body;

    // 2. handling photo naming, storage
    // photo from client side -> base64 encoded string -> decode -> store -> save photo's path in database

    // read as buffer
    const buffer = Buffer.from(
      photo.replace(/^data:image\/(png|jpg|jpeg); base64,/, ""),
      "base64"
    );

    // allot a random name
    const imagePath = `${Date.now()}-${author}.png`;

    // save locally
    try {
      fs.writeFileSync(`storage/${imagePath}`, buffer);
    } catch (error) {
      return next(error);
    }

    // 3. save blog in database
    let newBlog;

    try {
      newBlog = new Blog({
        title,
        author,
        content,
        photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`,
      });

      await newBlog.save();
    } catch (error) {
      return next(error);
    }

    // 4. return response
    const blogDto = new BlogDTO(newBlog);

    return res.status(201).json({ blog: blogDto });
  },

  // get all blogs method
  async getAll(req, res, next) {
    try {
      const blogs = await Blog.find({});

      const blogsDto = [];

      for (let i = 0; i < blogs.length; i++) {
        const dto = new BlogDTO(blogs[i]);
        blogsDto.push(dto);
      }

      return res.status(200).json({ blogs: blogsDto });
    } catch (error) {
      return next(error);
    }
  },

  // get blog by id method
  async getById(req, res, next) {
    // schema
    const getByIdSchema = Joi.object({
      id: Joi.string().regex(mongodbIdPattern).required(),
    });

    // validation of id
    const { error } = getByIdSchema.validate(req.params);

    if (error) {
      return next(error);
    }

    let blog;

    // destructuring id from request parameters
    const { id } = req.params;

    try {
      blog = await Blog.findOne({ _id: id }).populate("author");
    } catch (error) {
      return next(error);
    }

    // blog DTO
    const blogDto = new BlogDetailsDTO(blog);

    // response
    return res.status(200).json({ blog: blogDto });
  },

  async update(req, res, next) {},
  async delete(req, res, next) {},
};

module.exports = blogController;
