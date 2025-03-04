import User from "../models/UserSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "15d" }
  );
};

export const register = async (req, res) => {
  const { email, password, username } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exists" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashPassword
    });

    await newUser.save();

    res.status(201).json({ 
      success: true, 
      message: "User created successfully" 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Internal server error, try again" 
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const { password: userPassword, ...rest } = user._doc;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: rest
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to login"
    });
  }
};