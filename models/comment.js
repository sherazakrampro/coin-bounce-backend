const mongoose = require("mongoose");

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    content: { type: String, required: true },
    blog: { type: mongoose.SchemaTypes.ObjectId, ref: "Blog" },
    author: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// export the model {model name, model schema, collection name in the database}
module.exports = mongoose.model("Comment", commentSchema, "comments");
