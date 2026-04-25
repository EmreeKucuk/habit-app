const emailService = require('./services/emailService');

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  console.log('📧 Email service:', process.env.EMAIL_SERVICE || 'gmail');
  
  const testResult = await emailService.testConnection();
  if (testResult.success) {
    console.log('✅ Email service connected successfully');
    
    // Prompt for test email
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Enter email address to send test email to: ', async (testEmail) => {
      if (testEmail && testEmail.includes('@')) {
        console.log(`📤 Sending test email to: ${testEmail}`);
        
        const result = await emailService.sendEmail(
          testEmail,
          '🎯 Test Email from Habit Tracker',
          'This is a test email to verify your email configuration is working correctly!\n\nIf you received this email, your setup is successful! 🎉'
        );
        
        if (result.success) {
          console.log('✅ Test email sent successfully!');
          console.log('📨 Message ID:', result.messageId);
        } else {
          console.log('❌ Failed to send test email:', result.error);
        }
      } else {
        console.log('❌ Invalid email address provided');
      }
      
      rl.close();
    });
    
  } else {
    console.log('❌ Email service connection failed:', testResult.error);
    console.log('\n🔧 Check your .env file configuration:');
    console.log('- EMAIL_SERVICE');
    console.log('- EMAIL_USER');
    console.log('- EMAIL_PASS');
  }
}

testEmail().catch(console.error);
