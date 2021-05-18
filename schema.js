const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mapSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
		trim: true,
    },

    content: {
      type: String,
      required: true,
		trim: true,
    },
 
  },
  { timestamps: true }  
  );

mapSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 24 * 60 * 60,
  }
);

module.exports = mongoose.model("linkmap", mapSchema);
