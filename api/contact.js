require("dotenv").config();
const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed – Tumia POST tu" });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Jina, email na message zote zinahitajika" });
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
      from: `"Portfolio Contact" <${process.env.GMAIL_USER}>`,  // au tumia nhonyarichard22@gmail.com direct kama unataka
      to: process.env.GMAIL_USER || "nhonyarichard22@gmail.com",  // email yako hapa
      replyTo: email,  // ili ujibu kwa urahisi
      subject: `Ujumbe mpya kutoka ${name}`,
      text: `Kutoka: ${email}\n\nUjumbe:\n${message}`,
    });

    return res.status(200).json({ message: "Ujumbe wako umetumwa kwa mafanikio" });
  } catch (error) {
    console.error("Email error:", error.message);
    return res.status(500).json({ error: "Tatizo la kutuma email", details: error.message });
  }
};