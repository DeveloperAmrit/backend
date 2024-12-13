// Function to send an email
const nodemailer = require('nodemailer');
require('dotenv').config();
const mongoose = require('mongoose');

async function connectToMongoDB() {
    try {
        await mongoose.connect(process.env.URI, { serverSelectionTimeoutMS: 30000 });
        console.log('Connected to MongoDB');
        isMongoDBConnected = true;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        isMongoDBConnected = false;
        setTimeout(connectToMongoDB, 5000); // Retry after 5 seconds
    }
}






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
    
    // Define a Mongoose schema and model for email schedules
    const emailScheduleSchema = new mongoose.Schema({
        to_email: { type: String, required: true },
        cc_emails: { type: [String], default: '' },
        bcc_emails: { type: [String], default: '' },
        subject: { type: String, required: true },
        body: { type: String, required: true },
        send_datetime: { type: Date, required: true },
    }, { timestamps: true });

    const EmailSchedule = mongoose.model('EmailSchedule', emailScheduleSchema);

    console.log("checkAndSendEmails function : Checking for scheduled emails...")
    try {
            
        let currentTime = new Date();
        currentTime.setHours(currentTime.getHours() + 5); // Add 5 hours
        currentTime.setMinutes(currentTime.getMinutes() + 30); // Add 30 minutes

        // Fetch emails that need to be sent
        if(mongoose.connection.readyState === 1){
            const emailsToSend = await EmailSchedule.find({ send_datetime: { $lte: currentTime } });
    
            console.log("checkAndSendEmails function : ",emailsToSend);
            for (const email of emailsToSend) {
                console.log("Triggering sendEmail function");
                await sendEmail(email.to_email, email.cc_emails, email.bcc_emails, email.subject, email.body);
    
                // Remove the email from the database after sending
                await EmailSchedule.findByIdAndDelete(email._id);
            }
        }
        else if(mongoose.connection.readyState === 2){
            console.log("checkAndSendEmails function : MongoDB is yet connecting")
        }
        else{
            console.log("checkAndSendEmails function : MongoDB is not yet connected")
        }
    } catch (error) {
        console.log('checkAndSendEmails function : Error checking and sending emails:', error);
    }
    console.log("checkAndSendEmails function : Check complete");
}


export default function handler(req, res) {
    console.log("Cron job invoked at:", new Date());
    console.log("Processing function logic...");
    
    // Function logic here...
    async function trigger() {
        await connectToMongoDB();
        await checkAndSendEmails();
    }

    trigger();

    res.status(200).json({ message: "Function executed successfully!" });
}