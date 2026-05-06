import nodemailer from 'nodemailer';

const getTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Use Ethereal for testing if no SMTP is configured
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export const sendPurchaseOrderEmail = async (
  supplierEmail: string, 
  supplierName: string, 
  poData: any
) => {
  try {
    const transporter = await getTransporter();

    const itemsHtml = poData.items.map((i: any) => 
      `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${i.itemName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">${i.quantityOrdered} ${i.unit}</td>
      </tr>`
    ).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #6366f1; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Purchase Order</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">Order #${poData.orderNumber}</p>
        </div>
        <div style="padding: 30px;">
          <p>Dear ${supplierName},</p>
          <p>Please find the details of our recent purchase order below.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left;">Item</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: right;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Estimated Value:</strong> $${poData.totalEstimatedCost.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Expected Delivery:</strong> ${poData.expectedDeliveryDate ? new Date(poData.expectedDeliveryDate).toLocaleDateString() : 'ASAP'}</p>
          </div>
          
          ${poData.notes ? `
            <div style="padding: 15px; border-left: 4px solid #6366f1; background-color: #f5f5ff; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>Notes:</strong> ${poData.notes}</p>
            </div>
          ` : ''}
          
          <p>Thank you,<br/><strong>CafeTrac System</strong></p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: '"CafeTrac PO" <noreply@cafetrac.com>',
      to: supplierEmail,
      subject: `Purchase Order ${poData.orderNumber}`,
      html
    });

    console.log(`[EMAIL] PO sent to ${supplierEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, name: string, resetUrl: string) => {
  try {
    const transporter = await getTransporter();

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #454851; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">CafeTrac Password Reset</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hello ${name || 'there'},</p>
          <p>We received a request to reset your password. Click the button below to continue.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #7BAE7F; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">Reset Password</a>
          </p>
          <p>This link expires in 30 minutes. If you did not request this, you can safely ignore this email.</p>
          <p>Thanks,<br/><strong>CafeTrac Team</strong></p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: '"CafeTrac Security" <noreply@cafetrac.com>',
      to: email,
      subject: 'Reset your CafeTrac password',
      html
    });

    console.log(`[EMAIL] Password reset sent to ${email}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  } catch (error) {
    console.error('[EMAIL ERROR] Password reset email failed', error);
    throw error;
  }
};
