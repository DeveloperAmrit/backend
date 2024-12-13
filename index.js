// Import necessary modules
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const nodemailer = require('nodemailer');


// Middleware
app.use(cors());
app.use(express.json());


const uri =  process.env.URI;

if(!uri){
    console.log("index.js : uri not found");
}

// MongoDB connection
const mongoURI = uri;
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('MongoDB connection error:', err));

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

// Endpoint to schedule emails
app.post("/schedule-email", async (req, res) => {
    const { to_email, cc_emails, bcc_emails, subject, body, send_datetime } = req.body;

    // Prepare the email schedule data
    const scheduleData = {
        to_email,
        cc_emails,
        bcc_emails,
        subject,
        body,
        send_datetime,
    };

    try {
        // Save the new email schedule to the database
        const newEmailSchedule = new EmailSchedule(scheduleData);
        await newEmailSchedule.save();

        res.status(200).json({ message: 'Email scheduled successfully!' });
    } catch (error) {
        console.error('Error processing the email schedule:', error);
        res.status(500).json({ message: 'Failed to save schedule.', error: `${error}` });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}/`);
});





// Function to send an email
async function sendEmail(toEmail, ccEmails, bccEmails, subject, body) {
    console.log("sendEmail function : Triggered sendEmail function");


    const loginEmail = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if(!loginEmail || !password){
        console.log("sendEmail function : Login email and password not found.");
        return;
    }

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
        console.log(`sendEmail function : Sending mail to ${toEmail}`);
        await transporter.sendMail(mailOptions);
        console.log(`sendEmail function : Email sent to ${toEmail}`);
    } catch (error) {
        console.log(`sendEmail function : Error sending email to ${toEmail}:`, error);
    }
}

// Function to check and send emails
async function checkAndSendEmails() {
    console.log("checkAndSendEmails function : Checking for scheduled emails...")
    try {
            
        let currentTime = new Date();
        currentTime.setHours(currentTime.getHours() + 5); // Add 5 hours
        currentTime.setMinutes(currentTime.getMinutes() + 30); // Add 30 minutes
        let currentTime_ = currentTime.toISOString().slice(0, 16); // Format to 'YYYY-MM-DDTHH:MM'

        // Fetch emails that need to be sent
        const emailsToSend = await EmailSchedule.find({ send_datetime: { $lte: currentTime_ } });

        for (const email of emailsToSend) {
            console.log("Triggering sendEmail function");
            await sendEmail(email.to_email, email.cc_emails, email.bcc_emails, email.subject, email.body);

            // Remove the email from the database after sending
            await EmailSchedule.findByIdAndDelete(email._id);
        }
    } catch (error) {
        console.log('checkAndSendEmails function : Error checking and sending emails:', error);
    }
    console.log("checkAndSendEmails function : Check complete");
}

setInterval(checkAndSendEmails,15000);
