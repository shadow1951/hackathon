import Joi from "joi";
import { User } from "../models/User.mjs";
import path from "path";
import { fileURLToPath } from "url";
import { createAccessToken, createRefreshToken } from "../jsonWebToken.mjs";
import bcrypt from "bcrypt";
import fs from "fs";
import mongoose from "mongoose";
import NodeCache from "node-cache";
import { sendOtp, verifyOtp } from "./otpController.mjs";

const cache = new NodeCache();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userSchema = Joi.object({
  email: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"))
    .required()
    .messages({
      "string.base": "Email must be a string",
      "string.empty": "Email cannot be empty",
      "string.pattern.base": "Email must be a valid email format",
      "any.required": "Email is required",
    }),
  password: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password cannot be empty",
      "string.pattern.base": "Password must be 3 to 30 alphanumeric characters",
      "any.required": "Password is required",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "string.base": "Confirm Password must be a string",
    "any.only": "Confirm Password must match the Password",
    "any.required": "Confirm Password is required",
  }),
});

export const initialSignup = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res
      .status(500)
      .json({ error: "Database connection issue. Please try again later." });
  }
  const { password, confirmPassword, email } = req.body;
  try {
    await userSchema.validateAsync({
      password,
      confirmPassword,
      email,
    });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const otpSent = await sendOtp(email);
    if (!otpSent) {
      return res.status(500).json({ error: "Failed to send OTP" });
    }
    cache.set(email, {
      password,
    });
    return res
      .status(200)
      .json({ message: "OTP sent successfully, please verify." });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    return res.status(500).json({ error: error.message });
  }
};

export const finalSignup = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "missing fields email or otp" });
  }

  const userData = cache.get(email);
  const otpValid = await verifyOtp(email, otp);

  if (!userData) {
    return res.status(400).json({ error: "User data not found or expired" });
  }
  if (otpValid.valid == false) {
    cache.del(email);
    return res.status(400).json({ error: otpValid.message });
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser = new User({
    email: email,
    password: hashedPassword,
  });

  await newUser.save();

  const payload = {
    _id: newUser._id,
    email: newUser.email,
  };

  const accessToken = await createAccessToken(payload);
  const refreshToken = await createRefreshToken(payload, res);

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000 * 8,
  });

  cache.del(email);
  return res.status(201).json({ message: "User registered successfully" });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const payload = {
      _id: user._id,
      email: user.email,
    };

    const accessToken = await createAccessToken(payload);
    const refreshToken = await createRefreshToken(payload, res);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000 * 8,
    });

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const { email } = req.body;
  const userExist = await User.findOne(email);
  if (!userExist) {
    return res.status(200).json({
      message:
        "If this email exists in our system, you will receive a password reset link.",
    });
  }
};
