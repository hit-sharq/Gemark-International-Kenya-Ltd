// Email Service for notifications
import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"ArtAfrik" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Email Templates
export const emailTemplates = {
  orderConfirmation: (order: {
    orderNumber: string;
    total: number;
    items: { title: string; price: number; quantity: number }[];
    customerName: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #c9a227;">ArtAfrik</h1>
        <p style="color: #666;">African Art & Handcrafts</p>
      </div>
      
      <div style="background: #fafafa; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Order Confirmed! 🎉</h2>
        <p>Hi ${order.customerName},</p>
        <p>Thank you for your order! We've received your order and are processing it now.</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>Order Number:</strong> #${order.orderNumber}</p>
          <p style="margin: 0;"><strong>Total:</strong> $${order.total.toLocaleString()}</p>
        </div>
        
        <h3 style="color: #1a1a1a;">Order Details</h3>
        ${order.items.map(item => `
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
            <span>${item.title} × ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>Questions? Reply to this email or contact us at support@artafrik.com</p>
        <p>© ${new Date().getFullYear()} ArtAfrik. All rights reserved.</p>
      </div>
    </body>
    </html>
  `,

  orderShipped: (order: {
    orderNumber: string;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: Date;
    customerName: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #c9a227;">ArtAfrik</h1>
      </div>
      
      <div style="background: #fafafa; border-radius: 12px; padding: 30px;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Your Order is on its Way! 📦</h2>
        <p>Hi ${order.customerName},</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>Order Number:</strong> #${order.orderNumber}</p>
          ${order.trackingNumber ? `<p style="margin: 0 0 10px;"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
          ${order.carrier ? `<p style="margin: 0 0 10px;"><strong>Carrier:</strong> ${order.carrier}</p>` : ''}
          ${order.estimatedDelivery ? `<p style="margin: 0;"><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>` : ''}
        </div>
        
        <p>Track your package using the tracking number above.</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>© ${new Date().getFullYear()} ArtAfrik. All rights reserved.</p>
      </div>
    </body>
    </html>
  `,

  paymentReceipt: (payment: {
    orderNumber: string;
    amount: number;
    customerName: string;
    transactionId: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #c9a227;">ArtAfrik</h1>
      </div>
      
      <div style="background: #fafafa; border-radius: 12px; padding: 30px;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Payment Received ✅</h2>
        <p>Hi ${payment.customerName},</p>
        <p>We've received your payment. Thank you for your purchase!</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0 0 5px;">Amount Paid</p>
          <p style="font-size: 32px; font-weight: bold; color: #16a34a; margin: 0;">$${payment.amount.toLocaleString()}</p>
          <p style="font-size: 12px; color: #666; margin: 10px 0 0;">Transaction ID: ${payment.transactionId}</p>
        </div>
        
        <p>Order Number: #${payment.orderNumber}</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>© ${new Date().getFullYear()} ArtAfrik. All rights reserved.</p>
      </div>
    </body>
    </html>
  `,

  reviewRequest: (artwork: {
    title: string;
    imageUrl: string;
    customerName: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #c9a227;">ArtAfrik</h1>
      </div>
      
      <div style="background: #fafafa; border-radius: 12px; padding: 30px;">
        <h2 style="color: #1a1a1a; margin-top: 0;">How was your purchase? ⭐</h2>
        <p>Hi ${artwork.customerName},</p>
        <p>We'd love to hear about your experience with "${artwork.title}".</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="${artwork.imageUrl}" alt="${artwork.title}" style="max-width: 200px; border-radius: 8px;">
        </div>
        
        <p>Your feedback helps other customers and helps us improve our service.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/gallery" style="display: inline-block; padding: 12px 30px; background: #c9a227; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Leave a Review</a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>© ${new Date().getFullYear()} ArtAfrik. All rights reserved.</p>
      </div>
    </body>
    </html>
  `,

  // Artisan Registration Templates
  artisanRegistrationReceived: (artisan: {
    fullName: string;
    specialty: string;
    region: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #c9a227;">ArtAfrik</h1>
        <p style="color: #666;">African Art & Handcrafts Marketplace</p>
      </div>
      
      <div style="background: #fafafa; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Application Received! ⏳</h2>
        <p>Hi ${artisan.fullName},</p>
        <p>Thank you for applying to become an artisan on ArtAfrik!</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Specialty:</strong> ${artisan.specialty}</p>
          <p style="margin: 0 0 8px;"><strong>Region:</strong> ${artisan.region}</p>
          <p style="margin: 0;"><strong>Status:</strong> Pending Review</p>
        </div>
        
        <p>Our team will review your application within 2-3 business days. You'll receive an email once your application has been approved or if we need any additional information.</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>Questions? Reply to this email or contact us at support@artafrik.com</p>
        <p>© ${new Date().getFullYear()} ArtAfrik. All rights reserved.</p>
      </div>
    </body>
    </html>
  `,

  artisanApproved: (artisan: {
    fullName: string;
    shopName: string;
    shopUrl: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #c9a227;">ArtAfrik</h1>
        <p style="color: #666;">African Art & Handcrafts Marketplace</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <div style="text-align: center; font-size: 48px; margin-bottom: 15px;">🎉</div>
        <h2 style="color: #166534; margin-top: 0;">Congratulations! You're Approved!</h2>
        <p>Hi ${artisan.fullName},</p>
        <p>Great news! Your artisan application has been approved. You can now set up your shop and start selling your beautiful handcrafts!</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px; color: #666;">Your Shop Name</p>
          <p style="font-size: 24px; font-weight: bold; color: #c9a227; margin: 0;">${artisan.shopName}</p>
        </div>
        
        <div style="text-align: center; margin-top: 25px;">
          <a href="${artisan.shopUrl}" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #c9a227 0%, #b8911f 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Open Your Dashboard</a>
        </div>
      </div>
      
      <div style="background: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #1a1a1a; margin-top: 0;">Next Steps:</h3>
        <ol style="margin: 0; padding-left: 20px; color: #555;">
          <li style="margin-bottom: 8px;">Customize your shop profile (logo, banner, bio)</li>
          <li style="margin-bottom: 8px;">Add your first product listing</li>
          <li style="margin-bottom: 8px;">Set up your shipping preferences</li>
          <li>Share your shop with your network!</li>
        </ol>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>Questions? Reply to this email or contact us at support@artafrik.com</p>
        <p>© ${new Date().getFullYear()} ArtAfrik. All rights reserved.</p>
      </div>
    </body>
    </html>
  `,

  artisanRejected: (artisan: {
    fullName: string;
    reason?: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #c9a227;">ArtAfrik</h1>
        <p style="color: #666;">African Art & Handcrafts Marketplace</p>
      </div>
      
      <div style="background: #fef2f2; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <div style="text-align: center; font-size: 48px; margin-bottom: 15px;">🙏</div>
        <h2 style="color: #991b1b; margin-top: 0;">Application Update</h2>
        <p>Hi ${artisan.fullName},</p>
        <p>Thank you for your interest in becoming an artisan on ArtAfrik.</p>
        
        <p>After careful review, we're unable to approve your application at this time.</p>
        
        ${artisan.reason ? `
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #c9a227;">
          <p style="margin: 0 0 10px; color: #666;"><strong>Reason:</strong></p>
          <p style="margin: 0; color: #555;">${artisan.reason}</p>
        </div>
        ` : ''}
        
        <p>If you believe this is a mistake or would like to provide additional information, please reply to this email and we'll be happy to reconsider your application.</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p>Questions? Reply to this email or contact us at support@artafrik.com</p>
        <p>© ${new Date().getFullYear()} ArtAfrik. All rights reserved.</p>
      </div>
    </body>
    </html>
  `,
};

// Helper functions
export async function sendOrderConfirmationEmail(
  email: string,
  orderData: Parameters<typeof emailTemplates.orderConfirmation>[0]
) {
  const html = emailTemplates.orderConfirmation(orderData);
  return sendEmail({
    to: email,
    subject: `Order Confirmed - #${orderData.orderNumber} | ArtAfrik`,
    html,
  });
}

export async function sendOrderShippedEmail(
  email: string,
  orderData: Parameters<typeof emailTemplates.orderShipped>[0]
) {
  const html = emailTemplates.orderShipped(orderData);
  return sendEmail({
    to: email,
    subject: `Your Order is Shipped! #${orderData.orderNumber} | ArtAfrik`,
    html,
  });
}

export async function sendPaymentReceiptEmail(
  email: string,
  paymentData: Parameters<typeof emailTemplates.paymentReceipt>[0]
) {
  const html = emailTemplates.paymentReceipt(paymentData);
  return sendEmail({
    to: email,
    subject: `Payment Receipt - #${paymentData.orderNumber} | ArtAfrik`,
    html,
  });
}

export async function sendReviewRequestEmail(
  email: string,
  artworkData: Parameters<typeof emailTemplates.reviewRequest>[0]
) {
  const html = emailTemplates.reviewRequest(artworkData);
  return sendEmail({
    to: email,
    subject: `How was your purchase? | ArtAfrik`,
    html,
  });
}

// Artisan Registration Email Functions
export async function sendArtisanRegistrationReceivedEmail(
  email: string,
  artisanData: Parameters<typeof emailTemplates.artisanRegistrationReceived>[0]
) {
  const html = emailTemplates.artisanRegistrationReceived(artisanData);
  return sendEmail({
    to: email,
    subject: `Application Received - ArtAfrik Artisan Registration`,
    html,
  });
}

export async function sendArtisanApprovedEmail(
  email: string,
  artisanData: Parameters<typeof emailTemplates.artisanApproved>[0]
) {
  const html = emailTemplates.artisanApproved(artisanData);
  return sendEmail({
    to: email,
    subject: `Congratulations! Your ArtAfrik Artisan Application is Approved! 🎉`,
    html,
  });
}

export async function sendArtisanRejectedEmail(
  email: string,
  artisanData: Parameters<typeof emailTemplates.artisanRejected>[0]
) {
  const html = emailTemplates.artisanRejected(artisanData);
  return sendEmail({
    to: email,
    subject: `Update on Your ArtAfrik Artisan Application`,
    html,
  });
}

