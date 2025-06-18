import cron from 'node-cron';
import UserInvestment from '../models/userInvestmentModel.js';
import Wallet from '../models/walletModel.js';
import InvestmentPlan from '../models/investmentPlanModel.js';
import Notification from '../models/notificationModel.js';

// Runs every minute
cron.schedule('*/1 * * * *', async () => {
  console.log('🔁 Running Auto Payout Job...');

  try {
    // Only pick investments that are active and not already being processed
    const activeInvestments = await UserInvestment.find({ status: 'active', isProcessing: { $ne: true } });

    for (let investment of activeInvestments) {
      const plan = await InvestmentPlan.findById(investment.planId);
      const userWallet = await Wallet.findOne({ userId: investment.userId });

      if (!plan || !userWallet) continue;

      const today = new Date();
      const endDate = new Date(investment.endDate);

      if (today >= endDate) {

        // ✅ Mark as processing immediately to avoid double processing
        investment.isProcessing = true;
        await investment.save();

        const roiAmount = (investment.amount * plan.roiPercent * plan.durationDays) / 100;
        // console.log(investment.amount)
        // console.log(plan.roiPercent)
        // console.log(plan.durationDays)

       if (userWallet.lockedBalance < investment.amount) {
  console.error(`Locked balance inconsistency for user ${investment.userId}`);

  // Mark this investment as 'failed' to skip it in future runs
  investment.status = 'cancelled';
  investment.isProcessing = false;
  await investment.save();

  // Send notification to user
  await Notification.create({
    userId: investment.userId,
    message: `Your investment could not be processed due to a wallet inconsistency. Please contact support.`
  });

  continue; // Skip this investment
}


        userWallet.balance += roiAmount;
        userWallet.lockedBalance -= investment.amount;
        userWallet.balance += investment.amount;
        await userWallet.save();

        investment.status = 'completed';
        investment.lastPayoutDate = today;
        investment.isProcessing = false; // ✅ Mark done
        await investment.save();

        console.log(`✅ Credited ROI of $${roiAmount} and unlocked funds for user ${investment.userId}`);

        // ✅ Save notification
        await Notification.create({
          userId: investment.userId,
          message: `Your investment plan has completed. ROI of $${roiAmount} and your locked funds of $${investment.amount} have been credited.`
        });
      }
    }

    console.log('✅ Auto payout job finished.');
  } catch (error) {
    console.error('❌ Error in auto payout job:', error.message);
  }
});
