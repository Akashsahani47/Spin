import User from "../models/userModel.js";
import Wallet from "../models/walletModel.js";
import Spin from "../models/spinModel.js";
import Transaction from "../models/transactionModel.js";
import RewardWallet from "../models/rewardWalletModel.js";

const SPIN_PRICE = 1;

export const purchaseSpin = async (req, res) => {
    try {
        const userId = req.userId;
        let { spinCount } = req.body;

        spinCount = Number(spinCount);

        if (!spinCount || spinCount <= 0) {
            return res.status(400).json({ success: false, message: "Spin count must be at least 1." });
        }

        const totalAmount = spinCount * SPIN_PRICE;

        const userWallet = await Wallet.findOne({ userId });
        if (!userWallet || userWallet.balance < totalAmount) {
            return res.status(400).json({ success: false, message: "Insufficient balance." });
        }

        userWallet.balance -= totalAmount;
        await userWallet.save();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.spinCount += spinCount;
        await user.save();

    

        res.status(200).json({
            success: true,
            message: `Successfully purchased ${spinCount} spin(s).`,
            updatedSpinCount: user.spinCount,
            remainingBalance: userWallet.balance
        });
    } catch (error) {
        console.error('❌ Error in purchaseSpin:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};




export const playSpin = async (req, res) => {
  try {
    const userId = req.userId;
    const { spinType } = req.body;

    const user = await User.findById(userId);
    if (!user || user.spinCount <= 0) {
      return res.status(400).json({ success: false, message: "No spins available" });
    }

    let spinValue = 0;

    if (!user.hasClaimedFirstSpin) {
      
      spinValue = 0.11;
      user.hasClaimedFirstSpin = true;
    } else {
      
      if (user.cycleSpinCounter === 2) {
        spinValue = 1;
        user.cycleSpinCounter = 0; 
      } else {
        spinValue = 0;
        user.cycleSpinCounter += 1; 
      }
    }

    // Create spin log
    const spin = await Spin.create({
      userId,
      resultValue: spinValue,
      type: spinType || "free",
    });

    // Update user spins
    user.spinCount -= 1;
    user.totalSpinPlayed += 1;
    await user.save();

    // Update Rewardwallet
    const UserReward = await RewardWallet.findOne({ userId });
    if (!UserReward) {
      return res.status(404).json({ success: false, message: "User wallet not found" });
    }

    UserReward.rewardBalance += spinValue;
    await UserReward.save();

    // Create transaction only if spinValue > 0
    if (spinValue > 0) {
      await Transaction.create({
        userId,
        type: "bonus",
        amount: spinValue,
        status: "completed",
      });
    }

    const { password, ...userData } = user._doc;

    res.status(200).json({
      success: true,
      message: "Spin played successfully",
      spin,
     UserReward,
      
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};




export const getSpinLogs = async (req, res) => {
  try {
    const userId = req.userId;
    const spins = await Spin.find({ userId }).sort({ createdAt: -1 }); 
    if (spins.length === 0)
      return res.json({message:"No spin log found"})
    res.status(200).json({ success: true, spins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};