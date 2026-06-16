require('dotenv').config({ path: './backend/.env' });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('User:', process.env.EMAIL_USER);
  console.log('Pass length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to self for testing
      subject: 'Test Email from Habit Tracker',
      text: 'If you are reading this, your email configuration is working!',
    });
    console.log('SUCCESS! Email sent:', info.messageId);
  } catch (error) {
    console.error('FAILED to send email.');
    console.error(error);
  }
}

testEmail();
