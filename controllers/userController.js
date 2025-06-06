const User = require("../models/User");

// Get all users with subscription status
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "username email isSubscribed subscribedAt createdAt")
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// Toggle subscription status
const toggleSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isSubscribed = !user.isSubscribed;
    user.subscribedAt = user.isSubscribed ? new Date() : null;
    await user.save();
    
    res.status(200).json({ 
      message: "Subscription status updated",
      isSubscribed: user.isSubscribed
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating subscription", error: error.message });
  }
};

module.exports = { getAllUsers, deleteUser, toggleSubscription };