/**
 * Email Utility using Nodemailer
 * Handles transactional emails: welcome, job match, password reset, verification
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ─── HTML Escaping ────────────────────────────────────────────────────────────
// Prevents HTML/CSS injection through user-controlled strings in email templates

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info('Email sent', { to: options.to, subject: options.subject });
  } catch (error) {
    logger.error('Email sending failed', { error, to: options.to });
    // Don't throw — email failures shouldn't crash the request
  }
}


// ─── Email Templates ─────────────────────────────────────────────────────────

const baseStyle = `
  font-family: Inter, system-ui, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #C5D9F8;
  border-radius: 8px;
  overflow: hidden;
`;

const headerStyle = `
  background: #266DD3;
  padding: 24px 32px;
  text-align: center;
`;

const bodyStyle = `
  padding: 32px;
  color: #1A2A4A;
`;

const btnStyle = `
  display: inline-block;
  background: #266DD3;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  margin: 16px 0;
`;

export function welcomeCustomerEmail(name: string): string {
  const safeName = escapeHtml(name);
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Welcome to Crewora</h1>
      </div>
      <div style="${bodyStyle}">
        <h2>Hi ${safeName}! 👋</h2>
        <p>You're now registered on <strong>Crewora</strong> — the fastest way to find trusted blue-collar workers near you.</p>
        <p>You can now post your first job requirement and get matched with verified workers in your area.</p>
        <a href="${env.CLIENT_URL}/customer/dashboard" style="${btnStyle}">Go to Dashboard</a>
        <p style="color:#555555;font-size:14px;">Need help? Reply to this email.</p>
      </div>
    </div>
  `;
}

export function welcomeWorkerEmail(name: string): string {
  const safeName = escapeHtml(name);
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Welcome to Crewora's Crew</h1>
      </div>
      <div style="${bodyStyle}">
        <h2>Hi ${safeName}! 👷</h2>
        <p>You've successfully registered as a <strong>Crew Member</strong> on Crewora.</p>
        <p>Your profile is currently <strong>under review</strong>. Our team will verify your profile within 24–48 hours.</p>
        <p>Once approved, you'll start receiving job opportunities in your area directly on the platform.</p>
        <p style="color:#555555;font-size:14px;">No middlemen. No commissions. Just real local work.</p>
      </div>
    </div>
  `;
}

export function workerApprovedEmail(name: string): string {
  const safeName = escapeHtml(name);
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Profile Approved! ✅</h1>
      </div>
      <div style="${bodyStyle}">
        <h2>Great news, ${safeName}!</h2>
        <p>Your Crewora profile has been <strong>approved</strong>. You're now visible to customers looking for workers in your trade and area.</p>
        <a href="${env.CLIENT_URL}/worker/dashboard" style="${btnStyle}">View Job Opportunities</a>
      </div>
    </div>
  `;
}

export function workerRejectedEmail(name: string, reason: string): string {
  const safeName = escapeHtml(name);
  const safeReason = escapeHtml(reason);
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Profile Update Required</h1>
      </div>
      <div style="${bodyStyle}">
        <h2>Hi ${safeName},</h2>
        <p>We were unable to verify your profile at this time.</p>
        <p><strong>Reason:</strong> ${safeReason}</p>
        <p>Please update your profile with the required information and resubmit for review.</p>
        <a href="${env.CLIENT_URL}/worker/profile" style="${btnStyle}">Update Profile</a>
      </div>
    </div>
  `;
}

export function jobMatchedEmail(
  customerName: string,
  jobTitle: string,
  workerName: string
): string {
  const safeCustomerName = escapeHtml(customerName);
  const safeJobTitle = escapeHtml(jobTitle);
  const safeWorkerName = escapeHtml(workerName);
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Worker Matched! 🎉</h1>
      </div>
      <div style="${bodyStyle}">
        <h2>Hi ${safeCustomerName},</h2>
        <p>A worker has been matched to your job: <strong>${safeJobTitle}</strong></p>
        <p><strong>${safeWorkerName}</strong> has accepted your job request and will be in touch.</p>
        <a href="${env.CLIENT_URL}/customer/dashboard" style="${btnStyle}">View Job Details</a>
      </div>
    </div>
  `;
}

export function passwordResetEmail(name: string, resetToken: string): string {
  const safeName = escapeHtml(name);
  // resetToken is a crypto random hex string — safe to use directly in URL
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Password Reset Request</h1>
      </div>
      <div style="${bodyStyle}">
        <h2>Hi ${safeName},</h2>
        <p>We received a request to reset your password. Click the link below (valid for <strong>1 hour</strong>):</p>
        <a href="${resetUrl}" style="${btnStyle}">Reset Password</a>
        <p style="color:#555555;font-size:14px;">If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `;
}
