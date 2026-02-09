require("dotenv").config();
const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  // Vercel ina-allow methods zote, lakini restrict kwa POST tu
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed – Use POST" });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Portfolio" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `New message from ${name}`,
      text: `From: ${email}\n\nMessage:\n${message}`,
    });

    return res.status(200).json({ message: "Your message sent successfully" });
  } catch (error) {
    console.error("Nodemailer error:", error.message);
    return res.status(500).json({ error: "Failed to send email", details: error.message });
  }
};