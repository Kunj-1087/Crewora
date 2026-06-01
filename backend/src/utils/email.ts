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

export function welcomeCustomerEmail(name: string, lang: 'en' | 'gu' = 'en'): string {
  const safeName = escapeHtml(name);
  if (lang === 'gu') {
    return `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">Crewora માં આપનું સ્વાગત છે</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>નમસ્તે ${safeName}! 👋</h2>
          <p>તમે હવે <strong>Crewora</strong> પર નોંધણી કરાવી લીધી છે — જે તમારી નજીકના વિશ્વાસુ બ્લુ-કોલર કારીગરો શોધવાનો સૌથી ઝડપી રસ્તો છે.</p>
          <p>તમે હવે તમારી પ્રથમ કામની જરૂરિયાત પોસ્ટ કરી શકો છો અને તમારા વિસ્તારના ચકાસાયેલ કારીગરો સાથે જોડાઈ શકો છો.</p>
          <a href="${env.CLIENT_URL}/customer/dashboard" style="${btnStyle}">ડેશબોર્ડ પર જાઓ</a>
          <p style="color:#555555;font-size:14px;">મદદ જોઈએ છે? આ ઇમેઇલનો જવાબ આપો.</p>
        </div>
      </div>
    `;
  }
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

export function welcomeWorkerEmail(name: string, lang: 'en' | 'gu' = 'en'): string {
  const safeName = escapeHtml(name);
  if (lang === 'gu') {
    return `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">Crewora ના ગ્રૂપમાં આપનું સ્વાગત છે</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>નમસ્તે ${safeName}! 👷</h2>
          <p>તમે Crewora પર <strong>ક્રૂ મેમ્બર</strong> તરીકે સફળતાપૂર્વક નોંધણી કરાવી છે.</p>
          <p>તમારી પ્રોફાઇલ હાલમાં <strong>સમીક્ષા હેઠળ</strong> છે. અમારી ટીમ ૨૪-૪૮ કલાકની અંદર તમારી પ્રોફાઇલની ચકાસણી કરશે.</p>
          <p>એકવાર મંજૂર થયા પછી, તમને તમારા વિસ્તારમાં સીધા પ્લેટફોર્મ પર કામની તકો મળવાનું શરૂ થઈ જશે.</p>
          <p style="color:#555555;font-size:14px;">કોઈ વચેટિયા નહીં. કોઈ કમિશન નહીં. બસ વાસ્તવિક સ્થાનિક કામ.</p>
        </div>
      </div>
    `;
  }
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

export function workerApprovedEmail(name: string, lang: 'en' | 'gu' = 'en'): string {
  const safeName = escapeHtml(name);
  if (lang === 'gu') {
    return `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">પ્રોફાઇલ મંજૂર થઈ ગઈ છે! ✅</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>સારા સમાચાર, ${safeName}!</h2>
          <p>તમારી Crewora પ્રોફાઇલ <strong>મંજૂર</strong> કરવામાં આવી છે. હવે તમે તમારા વેપાર અને વિસ્તારમાં કારીગરો શોધી રહેલા ગ્રાહકોને દેખાશો.</p>
          <a href="${env.CLIENT_URL}/worker/dashboard" style="${btnStyle}">કામની તકો જુઓ</a>
        </div>
      </div>
    `;
  }
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

export function workerRejectedEmail(name: string, reason: string, lang: 'en' | 'gu' = 'en'): string {
  const safeName = escapeHtml(name);
  const safeReason = escapeHtml(reason);
  if (lang === 'gu') {
    return `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">પ્રોફાઇલ અપડેટ જરૂરી છે</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>નમસ્તે ${safeName},</h2>
          <p>અમે આ સમયે તમારી પ્રોફાઇલ ચકાસવામાં અસમર્થ હતા.</p>
          <p><strong>કારણ:</strong> ${safeReason}</p>
          <p>કૃપા કરીને જરૂરી માહિતી સાથે તમારી પ્રોફાઇલ અપડેટ કરો અને સમીક્ષા માટે ફરીથી સબમિટ કરો.</p>
          <a href="${env.CLIENT_URL}/worker/profile" style="${btnStyle}">પ્રોફાઇલ અપડેટ કરો</a>
        </div>
      </div>
    `;
  }
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
  workerName: string,
  lang: 'en' | 'gu' = 'en'
): string {
  const safeCustomerName = escapeHtml(customerName);
  const safeJobTitle = escapeHtml(jobTitle);
  const safeWorkerName = escapeHtml(workerName);
  if (lang === 'gu') {
    return `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">કારીગર મળી ગયા! 🎉</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>નમસ્તે ${safeCustomerName},</h2>
          <p>તમારા કામ માટે એક કારીગર મળી ગયા છે: <strong>${safeJobTitle}</strong></p>
          <p><strong>${safeWorkerName}</strong> એ તમારી કામની વિનંતી સ્વીકારી લીધી છે અને તેઓ તમારો સંપર્ક કરશે.</p>
          <a href="${env.CLIENT_URL}/customer/dashboard" style="${btnStyle}">કામની વિગતો જુઓ</a>
        </div>
      </div>
    `;
  }
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

export function passwordResetEmail(name: string, resetToken: string, lang: 'en' | 'gu' = 'en'): string {
  const safeName = escapeHtml(name);
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
  if (lang === 'gu') {
    return `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">પાસવર્ડ પુનઃસુયોજિત કરવા વિનંતી</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>નમસ્તે ${safeName},</h2>
          <p>અમને તમારો પાસવર્ડ પુનઃસુયોજિત કરવાની વિનંતી મળી છે. નીચેની લિંક પર ક્લિક કરો (<strong>૧ કલાક</strong> માટે માન્ય):</p>
          <a href="${resetUrl}" style="${btnStyle}">પાસવર્ડ પુનઃસુયોજિત કરો</a>
          <p style="color:#555555;font-size:14px;">જો તમે આ વિનંતી નથી કરી, તો આ ઇમેઇલની અવગણના કરો.</p>
        </div>
      </div>
    `;
  }
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
