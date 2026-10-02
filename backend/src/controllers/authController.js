const User = require("../models/User");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    user = new User({
      name,
      email,
      password,
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      require("../config").jwtSecret,
      { expiresIn: require("../config").jwtExpiresIn }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        usedStorage: user.usedStorage,
        storageQuota: user.storageQuota,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      require("../config").jwtSecret,
      { expiresIn: require("../config").jwtExpiresIn }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        usedStorage: user.usedStorage,
        storageQuota: user.storageQuota,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId || req.user.id).select("-password");
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        usedStorage: user.usedStorage,
        storageQuota: user.storageQuota,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const adminTest = async (req, res) => {
  res.json({
    success: true,
    message: "Admin secret area",
    user: {
      id: req.user.userId,
      role: req.user.role,
    },
  });
};

module.exports = { register, login, getMe, adminTest };
