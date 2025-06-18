import InvestmentPlan from "../models/investmentPlanModel.js";
import UserInvestment from "../models/userInvestmentModel.js";
import Wallet from "../models/walletModel.js";
import Referral from "../models/referralModel.js";
import RewardWallet from "../models/rewardWalletModel.js";
import Transaction from "../models/transactionModel.js";
import Notification from "../models/notificationModel.js"
export const getInvestmentPlans = async (req, res) => {
  try {
    const plans = await InvestmentPlan.find();
    if (!plans || plans.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No investment plans found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Plans fetched successfully", plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};








export const subscribeInvestment = async (req, res) => {
  try {
    const { id } = req.params; // Investment plan ID
    const userId = req.userId; // Logged-in user ID
    const { amount, paymentSource } = req.body; // amount and source from frontend

    // Basic validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    if (paymentSource !== 'wallet' && paymentSource !== 'reward') {
      return res.status(400).json({ success: false, message: "Invalid payment source" });
    }

    // Get user wallet and reward wallet
    const userWallet = await Wallet.findOne({ userId });
    const rewardWallet = await RewardWallet.findOne({ userId });

    if (!userWallet || !rewardWallet) {
      return res.status(404).json({ success: false, message: "User wallet or reward wallet not found" });
    }

    // Get investment plan
    const plan = await InvestmentPlan.findById(id);
    if (!plan || amount < plan.minAmount) {
      return res.status(400).json({ success: false, message: "Invalid plan or amount less than minimum" });
    }

    // Balance check
    if (paymentSource === 'wallet' && userWallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    if (paymentSource === 'reward' && rewardWallet.rewardBalance < amount && (rewardWallet.rewardBalance + userWallet.balance) < amount) {
      return res.status(400).json({ success: false, message: "Insufficient total balance" });
    }

    // Deduct the amount
    // Deduct the amount
if (paymentSource === 'wallet') {
  userWallet.balance -= amount;
  userWallet.lockedBalance += amount;
  await userWallet.save();
}

if (paymentSource === 'reward') {
  if (rewardWallet.rewardBalance >= amount) {
    rewardWallet.rewardBalance -= amount;

    // 🔐 Lock full investment amount
    userWallet.lockedBalance += amount;

    await userWallet.save();
  } else {
    const remainingAmount = amount - rewardWallet.rewardBalance;

    rewardWallet.rewardBalance = 0;

    userWallet.balance -= remainingAmount;

    // 🔐 You MUST lock full investment amount here
    userWallet.lockedBalance += amount;

    await userWallet.save();
  }

  await rewardWallet.save();
}


    // Create investment
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    const userInvestment = await UserInvestment.create({
      userId,
      planId: id,
      amount,
      startDate,
      endDate,
      status: "active",
      lastPayoutDate: null,
    });

    // 💸 Referral reward logic - 10% reward
    const referral = await Referral.findOne({
      referredUser: userId
      
    });

    if (referral && referral.isCommissionGiven === false)  { 
      const referrerId = referral.referredBy;
      const rewardAmount = amount * 0.1;
       console.log("Referral Found For User:", userId);
  console.log("Referrer ID:", referrerId);
  console.log("Reward Amount:", rewardAmount);



  // jo reffer kiya hai usko mila 10%
      let refRewardWallet = await RewardWallet.findOne({ userId: referrerId }).populate('userId', 'name email');

if (!refRewardWallet) {
  console.log("No wallet found. Creating new wallet.");
  refRewardWallet = new RewardWallet({ userId: referrerId, rewardBalance: rewardAmount });
} else {
  console.log("Existing wallet found for referrer. Adding reward.");
  refRewardWallet.rewardBalance += rewardAmount;
}
await refRewardWallet.save();
await Transaction.create({
  userId: referrerId,
  amount: rewardAmount,
  type: "referralReward",
   status:"completed",
  description: `Reward received from referral of user ${userId}`,
});

await Notification.create({
  userId:referrerId,
  amount:rewardAmount,
  message: `Reward received from referral of ${refRewardWallet.userId.name} `,

})

console.log(`Reward added for Referrer: ${refRewardWallet.userId.name}, New Balance: ${refRewardWallet.rewardBalance}`);

// jo kiya hai
let userRewardWallet = await RewardWallet.findOne({ userId: userId }).populate('userId', 'name email');

if (!userRewardWallet) {
  console.log("No wallet found for referred user. Creating new wallet.");
  userRewardWallet = new RewardWallet({ userId: userId, rewardBalance: rewardAmount });
} else {
  console.log("Existing wallet found for referred user. Adding reward.");
  userRewardWallet.rewardBalance += rewardAmount;
}
await userRewardWallet.save();

await Transaction.create({
  userId: userId,
  amount: rewardAmount,
  type: "referralReward",
  status:"completed",
  description: `Reward received for being referred by user ${referrerId}`,
});

await Notification.create({
  userId:userId,
  amount:rewardAmount,
  message: `Reward received for being referred to ${userRewardWallet.userId.name}`,

})



console.log(`Reward added for Referred User: ${userRewardWallet.userId.name}, New Balance: ${userRewardWallet.rewardBalance}`);

      referral.isCommissionGiven = true;
      await referral.save();

       console.log("Reward updated successfully.");
    }

    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
      investment: userInvestment,
      userWallet,
      rewardWallet,
      
    });
    console.log("Subscribed successfully")
  } catch (error) {
    console.error("Error in subscribeInvestment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


export const getSubscriptionsbyId = async (req, res) => {
  try {
   const user = await UserInvestment.findById(id)
  .populate("userId", "name email role status")
  .populate("planId", "name roiPercent minAmount durationDays autoPayout");

if (!user) {
  return res.status(404).json({ success: false, message: "Investment plan not found" });
}

const userWallet = await Wallet.findOne({ userId: user.userId });

    res
      .status(201)
      .json({
        success: true,
        message: "User retrived successfully",
        userDetails: user,
        userWallet,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getActiveInvestments = async (req, res) => {
  try {
    const userId = req.userId;
    const investments = await UserInvestment.find({ userId, status: "active" })
      .populate("planId", "name roiPercent minAmount durationDays autoPayout")
      .exec();
    res
      .status(200)
      .json({
        success: true,
        message: "Active investments fetched",
        investments,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInvestmentHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const investments = await UserInvestment.find({ userId })
      .populate("planId", "name roiPercent minAmount durationDays autoPayout")
      .exec();
    res
      .status(200)
      .json({
        success: true,
        message: "Investment history fetched",
        investments,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
