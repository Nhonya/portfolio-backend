// api/index.js ← weka file hii ndani ya folder "api" kwenye repo yako ya Vercel

require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://nhonya.vercel.app/s', // Replace with your actual domain
    '*' // Temporary for testing
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false,
  optionsSuccessStatus: 200
}));

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

// Test route
app.get("/", (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send("Contact API iko live 🚀 - Powered by Resend");
});

// Health check endpoint (muhimu kwa debugging)
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    env: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasMyEmail: !!process.env.MY_EMAIL,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Main contact route
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  // Detailed logging
  console.log("Contact form submission received:", {
    name: name ? "provided" : "missing",
    email: email ? "provided" : "missing",
    message: message ? "provided" : "missing",
    origin: req.headers.origin
  });

  // Basic validation
  if (!name || !email || !message) {
    console.log("Validation failed: missing fields");
    return res.status(400).json({ 
      success: false,
      error: "Jina, email na ujumbe ni lazima" 
    });
  }

  // Simple email validation
  if (!email.includes('@') || !email.includes('.')) {
    console.log("Validation failed: invalid email");
    return res.status(400).json({ 
      success: false,
      error: "Email si sahihi. Tafadhali weka email halisi." 
    });
  }

  // Check if environment variables exist
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set in environment variables");
    return res.status(500).json({
      success: false,
      error: "Server configuration error. Please contact admin."
    });
  }

  if (!process.env.MY_EMAIL) {
    console.error("MY_EMAIL is not set in environment variables");
    return res.status(500).json({
      success: false,
      error: "Server configuration error. Please contact admin."
    });
  }

  try {
    // Nodemailer transporter kwa Resend
    const transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
      // Timeouts
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    // Verify transporter connection (optional but helpful for debugging)
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError.message);
      throw new Error(`SMTP verification failed: ${verifyError.message}`);
    }

    // Prepare email options
    const mailOptions = {
      from: `"Portfolio - ${name}" <onboarding@resend.dev>`,
      replyTo: email,
      to: process.env.MY_EMAIL,
      subject: `Ujumbe Mpya kutoka ${name} - Portfolio`,
      text: `Jina: ${name}\nEmail: ${email}\n\nUjumbe:\n${message}\n\nSent from: ${req.headers.origin || 'unknown'}`,
      html: `
        <h2>📬 Ujumbe Mpya kutoka Portfolio</h2>
        <p><strong>Jina:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Ujumbe:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p><small>Sent from: ${req.headers.origin || 'unknown'}</small></p>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    // Success response
    res.status(200).json({
      success: true,
      message: "Ujumbe wako umetumwa vizuri! Asante 🙏"
    });

  } catch (error) {
    // Detailed error logging
    console.error("❌ Email sending error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });

    // Determine appropriate error message
    let errorMessage = "Tatizo la kutuma ujumbe. Jaribu tena baadaye.";
    
    if (error.code === 'EAUTH') {
      errorMessage = "Hitilafu ya authentication. Tafadhali wasiliana na admin.";
    } else if (error.code === 'ESOCKET') {
      errorMessage = "Hitilafu ya mtandao. Angalia internet yako na ujaribu tena.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "Muda umeisha. Jaribu tena.";
    } else if (error.message.includes('verify')) {
      errorMessage = "Hitilafu ya SMTP connection. Jaribu tena baadaye.";
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      // Include error code for debugging (remove in production)
      debug: process.env.NODE_ENV === 'development' ? error.code : undefined
    });
  }
});

// Export kwa Vercel serverless
module.exports = app;

// Only listen if running directly (not on Vercel)
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log("Environment check:", {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "✓ Set" : "✗ Missing",
      MY_EMAIL: process.env.MY_EMAIL ? "✓ Set" : "✗ Missing"
    });
  });
}