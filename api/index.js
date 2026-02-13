require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

app.use(cors({ origin: true })); // or specify your frontend domain
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Contact API iko live 🚀 - Powered by Resend");
});

app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: process.env.RESEND_API_KEY },
    });

    await transporter.sendMail({
      from: `"${name}" <onboarding@resend.dev>`,
      replyTo: email,
      to: process.env.MY_EMAIL || "your-own-email@gmail.com",
      subject: `New Portfolio Message from ${name}`,
      text: `From: ${name} <${email}>\n\nMessage:\n${message}`,
    });

    res.status(200).json({ message: "Your message sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

// Export for Vercel
module.exports = app;