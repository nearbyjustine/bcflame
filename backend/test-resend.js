// Quick test script to verify Resend email sending
require('dotenv').config({ path: './.env' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Testing Resend email service...');
  console.log('API Key:', process.env.RESEND_API_KEY ? 'Configured' : 'Missing');
  console.log('From Email:', process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev');
  console.log('');

  try {
    const result = await resend.emails.send({
      from: `BC Flame <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: 'bcflamedev@atomicmail.io',
      subject: 'Test Email from BC Flame',
      html: '<p>This is a test email to verify Resend integration.</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.json());
    }
  }
}

testEmail();
