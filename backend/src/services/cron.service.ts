import cron from 'node-cron';
import { ScheduledReport } from '../modules/scheduled-reports/scheduledReport.model';
import { WasteLog } from '../modules/waste-logs/wasteLog.model';
import { InventoryItem } from '../modules/inventory/inventory.model';
import nodemailer from 'nodemailer';

// Helper to get transporter (reusing logic or simplified)
const getTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
};

export const initCronJobs = () => {
  // Run every hour to check for due reports
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Checking scheduled reports...');
    const now = new Date();
    const reports = await ScheduledReport.find({ isActive: true });

    for (const report of reports) {
      let shouldRun = false;
      const lastRun = report.lastRunAt || new Date(0);

      if (report.frequency === 'daily') {
        shouldRun = now.getTime() - lastRun.getTime() > 23 * 60 * 60 * 1000;
      } else if (report.frequency === 'weekly') {
        shouldRun = now.getTime() - lastRun.getTime() > 6 * 24 * 60 * 60 * 1000;
      } else if (report.frequency === 'monthly') {
        shouldRun = now.getTime() - lastRun.getTime() > 27 * 24 * 60 * 60 * 1000;
      }

      if (shouldRun) {
        await executeReport(report);
      }
    }
  });
};

const executeReport = async (report: any) => {
  try {
    console.log(`[CRON] Executing ${report.reportType} report for user ${report.userId}`);
    const transporter = await getTransporter();
    
    let contentHtml = '';
    if (report.reportType === 'waste') {
      const logs = await WasteLog.find({ locationId: report.locationId }).limit(50).sort({ createdAt: -1 });
      contentHtml = `<h3>Recent Waste Logs</h3><ul>${logs.map(l => `<li>${l.itemName}: ${l.quantity} ${l.unit} (${l.reason})</li>`).join('')}</ul>`;
    } else {
      const items = await InventoryItem.find({ locationId: report.locationId, currentStock: { $lte: 10 } });
      contentHtml = `<h3>Low Stock Alert</h3><ul>${items.map(i => `<li>${i.name}: ${i.currentStock} ${i.unit} left</li>`).join('')}</ul>`;
    }

    await transporter.sendMail({
      from: '"CafeTrac Automated" <reports@cafetrac.com>',
      to: report.recipients.join(','),
      subject: `Scheduled ${report.reportType} Report`,
      html: `<h2>Automated CafeTrac Report</h2>${contentHtml}<p>Manage your schedules in the CafeTrac dashboard.</p>`
    });

    report.lastRunAt = new Date();
    await report.save();
    console.log(`[CRON] Successfully sent report to ${report.recipients.length} recipients`);
  } catch (error) {
    console.error('[CRON ERROR]', error);
  }
};
