// Import necessary modules
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();
const moment = require('moment-timezone');


// MongoDB connection
const mongoURI = process.env.URI;
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define a Mongoose schema and model for email schedules
const emailScheduleSchema = new mongoose.Schema({
    to_email: { type: String, required: true },
    cc_emails: { type: [String], default: [] },
    bcc_emails: { type: [String], default: [] },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    send_datetime: { type: Date, required: true },
}, { timestamps: true });

const EmailSchedule = mongoose.model('EmailSchedule', emailScheduleSchema);

// Function to send an email
async function sendEmail(toEmail, ccEmails, bccEmails, subject, body) {
    console.log("Triggered");

    const loginEmail = process.env.EMAIL;
    const password = process.env.PASSWORD;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: loginEmail,
            pass: password,
        },
    });

    const mailOptions = {
        from: loginEmail,
        to: toEmail,
        cc: ccEmails,
        bcc: bccEmails,
        subject: subject,
        text: body,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${toEmail}`);
    } catch (error) {
        console.error(`Error sending email to ${toEmail}:`, error);
    }
}

// Function to check and send emails
async function checkAndSendEmails() {
    try {
            
        let currentTime = new Date();
        currentTime.setHours(currentTime.getHours() + 5); // Add 5 hours
        currentTime.setMinutes(currentTime.getMinutes() + 30); // Add 30 minutes
        let currentTime_ = currentTime.toISOString().slice(0, 16); // Format to 'YYYY-MM-DDTHH:MM'

        // Fetch emails that need to be sent
        const emailsToSend = await EmailSchedule.find({ send_datetime: { $lte: currentTime_ } });

        for (const email of emailsToSend) {
            await sendEmail(email.to_email, email.cc_emails, email.bcc_emails, email.subject, email.body);

            // Remove the email from the database after sending
            await EmailSchedule.findByIdAndDelete(email._id);
        }
    } catch (error) {
        console.error('Error checking and sending emails:', error);
    }
}

// Schedule the job to run every minute (adjustable interval)
cron.schedule('*/30 * * * * *', checkAndSendEmails); // Runs every 30 seconds