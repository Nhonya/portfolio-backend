// api/index.js   ← weka file hii ndani ya folder "api" kwenye repo yako ya Vercel

require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());

// CORS configuration - inaruhusu frontend yako (local na production)
app.use(cors({
  origin: [
    'http://localhost:3000',              // local development
    'http://localhost:5173',              // kama unatumia Vite/React
    'https://your-portfolio-frontend.vercel.app', // badilisha na domain yako halisi
    '*'                                   // ← temporary kwa testing (ondoa baadaye kwa security)
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false,
  optionsSuccessStatus: 200  // muhimu kwa baadhi ya browsers
}));

// Handle preflight OPTIONS requests explicitly (very important for Vercel!)
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400'); // cache preflight for 24 hours
  res.status(204).end(); // 204 No Content ni bora kwa OPTIONS
});

// Simple test route - ili uone server ina-run
app.get("/", (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send("Contact API iko live 🚀 - Powered by Resend (Richard 2025)");
});

// Main contact route
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false,
      error: "Jina, email na ujumbe ni lazima" 
    });
  }

  // Simple email validation (basic)
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ 
      success: false,
      error: "Email si sahihi" 
    });
  }

  try {
    // Nodemailer transporter kwa Resend
    const transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,                // true kwa 465 (SSL)
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
      // Timeouts ili kuepuka Vercel timeout issues
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    // Tuma email
    await transporter.sendMail({
      from: `"Portfolio - ${name}" <onboarding@resend.dev>`, // default Resend sender
      // Kama umeverify domain yako, tumia hii badala yake:
      // from: `"${name}" <hello@yourdomain.com>`,

      replyTo: email,              // muhimu sana - reply inaenda kwa sender
      to: process.env.MY_EMAIL,    // email yako (set kwenye Vercel env vars)
      subject: `Ujumbe Mpya kutoka ${name} - Portfolio`,
      text: `Jina: ${name}\nEmail: ${email}\n\nUjumbe:\n${message}\n\nSent from: ${req.headers.origin || 'unknown'}`,
      
      // Optional: HTML version (uncomment kama unataka)
      // html: `
      //   <h2>Ujumbe Mpya kutoka Portfolio</h2>
      //   <p><strong>Jina:</strong> ${name}</p>
      //   <p><strong>Email:</strong> ${email}</p>
      //   <p><strong>Ujumbe:</strong></p>
      //   <p>${message.replace(/\n/g, '<br>')}</p>
      // `
    });

    // Success
    res.status(200).json({
      success: true,
      message: "Ujumbe wako umetumwa vizuri! Asante 🙏"
    });

  } catch (error) {
    console.error("Email sending error:", error.message || error);

    // Rudisha error rahisi kwa frontend (usitoe full stack trace)
    res.status(500).json({
      success: false,
      error: "Tatizo la kutuma ujumbe. Jaribu tena baadaye au tuma barua pepe moja kwa moja."
    });
  }
});

// Export kwa Vercel serverless
module.exports = app;