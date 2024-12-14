// Import necessary modules
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();


// Middleware
app.use(cors());
app.use(express.json());
mongoose.set('debug', true);
// MongoDB connection

const emailScheduleSchema = new mongoose.Schema({
    to_email: { type: String, required: true },
    cc_emails: { type: [String], default: '' },
    bcc_emails: { type: [String], default: '' },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    send_datetime: { type: Date, required: true },
}, { timestamps: true });

const EmailSchedule = mongoose.model('EmailSchedule', emailScheduleSchema);


async function connectToMongoDB() {
    console.log("Trying to connect to mongoDB")
    try {
        await mongoose.connect(process.env.URI, { serverSelectionTimeoutMS: 30000 });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        setTimeout(connectToMongoDB, 15000); // Retry after 5 seconds
    }
}

connectToMongoDB();


// Endpoint to schedule emails
app.post("/schedule-email", async (req, res) => {
    console.log("app.post : Request recieved");
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

    console.log("app.log : ",scheduleData);

    try {
        console.log("app.post : Scheduling email")
        // Save the new email schedule to the database
        const newEmailSchedule = new EmailSchedule(scheduleData);
        await newEmailSchedule.save();
        console.log("app.post : Email scheduled successfully!")
        res.status(200).json({ message: 'Email scheduled successfully!' });
    } catch (error) {
        console.log('Error processing the email schedule:', error);
        res.status(500).json({ message: 'Failed to save schedule.', error: `${error}` });
    }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}/`);

});








