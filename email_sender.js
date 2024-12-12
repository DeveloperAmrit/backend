const nodemailer = require('nodemailer');
const fs = require('fs');
const cron = require('node-cron');
const path = './scheduled_emails.json'; // Path to the JSON file where scheduled emails are stored
require('dotenv').config();

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
function checkAndSendEmails() {
    try{
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading scheduled emails:', err);
                return;
            }
    
            const emails = JSON.parse(data);
    
            let currentTime = new Date();
            currentTime.setHours(currentTime.getHours() + 5); // Add 5 hours
            currentTime.setMinutes(currentTime.getMinutes() + 30); // Add 30 minutes
            let currentTime_ = currentTime.toISOString().slice(0, 16); // Format to 'YYYY-MM-DDTHH:MM'
            
            const emailsToKeep = emails.filter((email) => {
                if (email.send_datetime === currentTime_) {
                    sendEmail(email.to_email, email.cc_emails, email.bcc_emails, email.subject, email.body);
                    return false; // Exclude this email from the new array
                }
                return true; // Keep other emails
            });

            fs.writeFile(path, JSON.stringify(emailsToKeep, null, 2), (err) => {
                if (err) console.error('Error updating scheduled emails:', err);
            });

        });
    }
    catch(err){
        console.log("Json file is busy");
        setTimeout(checkAndSendEmails,10000);
    }
    
}

// Schedule the job to run every minute
cron.schedule('*/30 * * * * *', checkAndSendEmails); // Runs every 30 seconds