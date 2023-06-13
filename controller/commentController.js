const Joi = require("joi");
const Comment = require("../models/comment");

// regular expression to match the string pattern against mongodb id pattern
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const commentController = {
  // create comment method
  async create(req, res, next) {
    // schema
    const createCommentSchema = Joi.object({
      content: Joi.string().required(),
      author: Joi.string().regex(mongodbIdPattern).required(),
      blog: Joi.string().regex(mongodbIdPattern).required(),
    });

    // validation
    const { error } = createCommentSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    // destructuring
    const { content, author, blog } = req.body;

    try {
      const newComment = new Comment({
        content,
        author,
        blog,
      });

      // save the comment in the database
      await newComment.save();
    } catch (error) {
      return next(error);
    }

    // response
    res.status(201).json({
      message: "Comment created successfully",
    });
  },

  // get all comments by blog id method
  async getById(req, res, next) {},
};

module.exports = commentController;
