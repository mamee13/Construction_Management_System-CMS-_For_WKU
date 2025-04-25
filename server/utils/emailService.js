const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    debug: true, // Enable debug logs
    logger: true  // Enable logger
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log('SMTP connection error:', error);
    } else {
        console.log('Server is ready to send emails');
    }
});

const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP - WKU CMS',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">WKU CMS Password Reset</h2>
                    <p>Your one-time password (OTP) for resetting your password is:</p>
                    <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
};

module.exports = { sendOTPEmail };