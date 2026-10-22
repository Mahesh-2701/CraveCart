const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const hasSmtpConfig = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development / Test in-memory transporter
    transporter = {
      sendMail: async (mailOptions) => {
        if (process.env.NODE_ENV !== "test") {
          console.log(`[EMAIL LOG] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
        }
        return { messageId: `mock_${Date.now()}`, envelope: mailOptions };
      },
    };
  }

  return transporter;
}

const EMAIL_FROM = process.env.EMAIL_FROM || "CraveCart <orders@cravecart.local>";

// Email layout wrapper
function wrapEmailTemplate(title, contentHtml) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #FF5200 0%, #FF7A00 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; opacity: 0.9; font-size: 14px; }
        .body { padding: 32px 24px; font-size: 15px; line-height: 1.6; }
        .order-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-warning { background: #fef9c3; color: #a16207; }
        .badge-info { background: #e0f2fe; color: #0369a1; }
        .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CraveCart</h1>
          <p>${title}</p>
        </div>
        <div class="body">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} CraveCart Technologies Pvt Ltd. All rights reserved.</p>
          <p>Delivered fresh, hot, and fast to your doorstep.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send Order Confirmation Email
 */
async function sendOrderConfirmation(order, user) {
  try {
    const t = getTransporter();
    const recipient = user?.email || order?.userid?.email;
    if (!recipient) return null;

    const htmlContent = `
      <h3>Thank you for your order! 🎉</h3>
      <p>Hi <b>${user?.name || "Foodie"}</b>, your food order has been placed successfully and is being prepared.</p>
      
      <div class="order-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <strong>Order #${order._id.toString().slice(-6).toUpperCase()}</strong>
          <span class="badge badge-warning">${order.status}</span>
        </div>
        <p style="margin: 4px 0;"><strong>Delivery Address:</strong> ${order.address}</p>
        <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${order.paymentmethod} (${order.paymentStatus || "Completed"})</p>
        <p style="margin: 4px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount || order.price}</p>
      </div>

      <p>You can track your live order delivery in real-time from the CraveCart application.</p>
    `;

    return await t.sendMail({
      from: EMAIL_FROM,
      to: recipient,
      subject: `Order Placed Successfully! #${order._id.toString().slice(-6).toUpperCase()} - CraveCart`,
      text: `Thank you for your order #${order._id}! Total: ₹${order.totalAmount || order.price}. Address: ${order.address}.`,
      html: wrapEmailTemplate("Order Confirmation", htmlContent),
    });
  } catch (err) {
    console.error("Failed to send order confirmation email:", err.message);
    return null;
  }
}

/**
 * Send Status Update Email
 */
async function sendStatusUpdate(order, user, newStatus) {
  try {
    const t = getTransporter();
    const recipient = user?.email || order?.userid?.email;
    if (!recipient) return null;

    const htmlContent = `
      <h3>Your order status has been updated! 🛵</h3>
      <p>Hi <b>${user?.name || "Customer"}</b>, your order status is now: <strong style="color: #FF5200;">${newStatus}</strong>.</p>
      
      <div class="order-card">
        <p style="margin: 4px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> <span class="badge badge-info">${newStatus}</span></p>
        <p style="margin: 4px 0;"><strong>Delivery Address:</strong> ${order.address}</p>
      </div>

      <p>Open CraveCart to view the interactive live tracking map!</p>
    `;

    return await t.sendMail({
      from: EMAIL_FROM,
      to: recipient,
      subject: `Order #${order._id.toString().slice(-6).toUpperCase()} Status Update: ${newStatus}`,
      text: `Your order #${order._id} status is now ${newStatus}.`,
      html: wrapEmailTemplate("Order Update", htmlContent),
    });
  } catch (err) {
    console.error("Failed to send status update email:", err.message);
    return null;
  }
}

module.exports = {
  sendOrderConfirmation,
  sendStatusUpdate,
  wrapEmailTemplate,
};
