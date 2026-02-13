
require("dotenv").config();
const express = require ("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());                  
app.use(express.json());           

// Optional: Test route ili ujue server ina-run
app.get("/", (req, res) => {
  res.send("Contact API iko live 🚀 - Powered by Resend");
});

// Main POST route kwa contact form
app.post("/contact", async (req, res) => {   
  const { name, email, message } = req.body;

  // Simple validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Create Nodemailer transporter kwa Resend SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,                     
      auth: {
        user: "resend",                 
        pass: process.env.RESEND_API_KEY,  
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"${name}" <onboarding@resend.dev>`,  

      replyTo: email,                   
      to: process.env.MY_EMAIL || "your-own-email@gmail.com", 
      subject: `New Portfolio Message from ${name}`,
      text: `From: ${name} <${email}>\n\nMessage:\n${message}`,
      
      // Optional: Ongeza HTML version ili email iwe nzuri zaidi (uncomment kama unataka)
      // html: `
      //   <h2>New Message from Portfolio</h2>
      //   <p><strong>Name:</strong> ${name}</p>
      //   <p><strong>Email:</strong> ${email}</p>
      //   <p><strong>Message:</strong></p>
      //   <p>${message.replace(/\n/g, '<br>')}</p>
      // `,
    });

    // Success response kwa frontend
    res.status(200).json({ message: "Your message sent successfully!" });
  } catch (error) {
    console.error("Email sending error:", error.message || error);
    res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

// Export app kwa Vercel (serverless)
module.exports = app;
