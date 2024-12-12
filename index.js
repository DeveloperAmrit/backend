const fs = require('fs').promises; // Using fs.promises for async/await handling
const express = require('express');
const { spawn } = require('child_process');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());


app.post("*", async (req, res) => {
    const { to_email, cc_emails, bcc_emails, subject, body, send_datetime } = req.body;

    // Prepare the email schedule data
    const scheduleData = {
        to_email,
        cc_emails,
        bcc_emails,
        subject,
        body,
        send_datetime
    };

    try {
        // Read the existing schedule data
        let emails = [];
        try {
            const data = await fs.readFile('scheduled_emails.json', 'utf-8');
            emails = JSON.parse(data); // Parse the existing email data
        } catch (err) {
            // If no existing file or any error reading, just start with an empty array
            console.log('No existing data found or error reading file, starting fresh');
        }

        // Append the new email schedule to the list
        emails.push(scheduleData);

        // Write the updated list back to the JSON file
        await fs.writeFile('scheduled_emails.json', JSON.stringify(emails, null, 2));
        res.status(200).json({ message: 'Email scheduled successfully!' });

    } catch (error) {
        console.error('Error processing the email schedule:', error);
        res.status(500).json({ message: 'Failed to save schedule.' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startEmailSender();
    console.log("Email sender started");
});

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
