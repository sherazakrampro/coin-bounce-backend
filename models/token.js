const mongoose = require("mongoose");

const { Schema } = mongoose;

const refreshTokenSchema = Schema(
  {
    token: { type: String, required: true },
    userId: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// export the model {model name, model schema, collection name in the database}
module.exports = mongoose.model("RefreshToken", refreshTokenSchema, "tokens");
