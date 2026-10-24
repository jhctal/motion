import asyncHandler from "../middleware/async-handler.js";
import User from "../models/user-model.js";
import generateToken from "../utils/generate-token.js";
import pickFields from "../utils/pick-fields.js";

const PREFERENCE_FIELDS = [
  "units",
  "measurement_system",
  "theme",
  "language",
  "week_starts_on",
  "height_unit",
  "orm_formula",
];

// @desc Auth user and get token
// @route POST /api/users/login
// @access Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);

    res.status(200).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc Register user
// @route POST /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, height, first_name, last_name, username, password, weight } =
    req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    throw new Error("User already exists");
  }

  const user = await User.create({
    first_name,
    last_name,
    username,
    email,
    password,
    weight,
    height,
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      height: user.height,
      email: user.email,
      isAdmin: user.isAdmin,
      weight: user.weight,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc Log out user and clear cookie
// @route POST /api/users/logout
// @access Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Successfully logged out" });
});

// @desc Get user profile
// @route GET /api/users/profile
// @access Public
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.status(201).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      height: user.height,
      email: user.email,
      isAdmin: user.isAdmin,
      weight: user.weight,
      preferences: user.preferences,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Update user profile
// @route PUT /api/users/profile
// @access Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.first_name = req.body.first_name || user.first_name;
    user.last_name = req.body.last_name || user.last_name;
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.height = req.body.height || user.height;
    user.weight = req.body.weight || user.weight;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      height: updatedUser.height,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      weight: updatedUser.weight,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Get users
// @route GET /api/users
// @access Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  res.send("get users");
});

// @desc Get user by id
// @route GET /api/users/:id
// @access Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  res.send("get user by id");
});

// @desc Get user preferences
// @route GET /api/users/preferences
// @access Private
const getUserPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json(user.preferences);
});

// @desc Update user preferences
// @route PATCH /api/users/preferences
// @access Private
const updateUserPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  Object.assign(user.preferences, pickFields(req.body, PREFERENCE_FIELDS));
  const updatedUser = await user.save();
  res.status(200).json(updatedUser.preferences);
});

// @desc Delete a user
// @route DELETE /api/users/:id
// @access Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  res.send("delete user");
});

// @desc Update a user
// @route PUT /api/users/:id
// @access Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  res.send("update user");
});

export {
  authUser,
  registerUser,
  logoutUser,
  updateUserProfile,
  getUserProfile,
  getUserById,
  getUsers,
  deleteUser,
  updateUser,
  getUserPreferences,
  updateUserPreferences,
};
