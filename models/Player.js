const mongoose = require("mongoose");

const NAME_REGEX = /^[A-Za-z\s]{1,50}$/;

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      maxlength: [50, "Name must not exceed 50 characters."],
      validate: {
        validator: (v) => NAME_REGEX.test(v),
        message: "Full Name must be 1-50 characters and contain only letters and spaces.",
      },
    },
    sport: {
      type: String,
      required: [true, "Sport Type is required."],
      trim: true,
    },
    team: {
      type: String,
      trim: true,
      default: "Free Agent",
      maxlength: [50, "Team Name must not exceed 50 characters."],
      validate: {
        validator: (v) => !v || NAME_REGEX.test(v),
        message: "Team Name must be 1-50 characters and contain only letters and spaces.",
      },
    },
    gender: {
      type: String,
      trim: true,
      default: "",
    },
    age: {
      type: Number,
      default: 0,
      min: [0, "Age cannot be negative."],
      max: [100, "Age cannot exceed 100."],
    },
    weight: {
      type: Number,
      default: 0,
      min: [0, "Weight cannot be negative."],
      max: [200, "Weight cannot exceed 200 kg."],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Player", playerSchema);
