import RewardWallet  from "../models/rewardWalletModel.js";

// GET /api/reward
export const getRewardWallet = async (req, res) => {
  try {
    const userId = req.userId;
    let wallet = await RewardWallet.findOne({ userId });

    if (!wallet) {
      // Create if not exist
      wallet = await RewardWallet.create({ userId });
    }

    res.status(200).json({
      success: true,
      message: "Reward wallet fetched",
      rewardBalance: wallet.rewardBalance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


