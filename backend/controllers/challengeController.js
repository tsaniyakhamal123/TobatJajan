import Challenge from "../models/Challenge.js";
import User from "../models/User.js";

// Ambil semua challenge user
export const getMyChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.user._id });
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tandai challenge selesai & tambah XP
export const completeChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: "Challenge not found" });

    challenge.isCompleted = true;
    await challenge.save();

    const user = await User.findById(challenge.userId);
    user.xp += challenge.xpReward;
    await user.save();

    res.json({ message: "Challenge completed!", xpReward: challenge.xpReward });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
