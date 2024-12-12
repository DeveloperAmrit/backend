// Import necessary modules
const mongoose = require('mongoose');
const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const username = "kittyamrit005";
const password = "tmRNI8sLgU8qs1Gf";
const uri = `mongodb+srv://${username}:${password}@cluster0.ckqo2.mongodb.net/?retryWrites=true&w=majority`;

// MongoDB connection
const mongoURI = uri;
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
    startEmailSender();
    console.log("Email sender started");
});

// Function to start the email sender process
const startEmailSender = () => {
    const emailSenderProcess = spawn('node', ['email_sender.js']); // Adjust path if necessary

    emailSenderProcess.stdout.on('data', (data) => {
        console.log(`Email Sender Output: ${data}`);
    });

    emailSenderProcess.stderr.on('data', (data) => {
        console.error(`Email Sender Error: ${data}`);
    });

    emailSenderProcess.on('close', (code) => {
        console.log(`Email Sender process exited with code ${code}`);
    });
};
