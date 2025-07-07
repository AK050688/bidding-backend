import nodemailer from "nodemailer";
import config from "config";
import jwt from "jsonwebtoken";
import cron  from "node-cron"



export default {
  getOTP() {
    const otp = Math.floor(10000 + Math.random() * 90000);
    return otp;
  },
  
getOTPEmailTemplate(otp) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: #007bff;
      color: #ffffff;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      text-align: center;
    }
    .otp {
      font-size: 32px;
      font-weight: bold;
      color: #007bff;
      letter-spacing: 5px;
      margin: 20px 0;
    }
    .content p {
      font-size: 16px;
      color: #333333;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      padding: 10px;
      font-size: 12px;
      color: #777777;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        margin: 10px;
      }
      .otp {
        font-size: 24px;
        letter-spacing: 3px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset OTP</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have requested to reset your password. Your one-time password (OTP) is:</p>
      <div class="otp">${otp}</div>
      <p>Please use this OTP to complete your password reset. This code is valid for the next 3 minutes.</p>
      <p>If you did not request this, please ignore this email or contact support.</p>
    </div>
    <div class="footer">
      <p>© 2025 Your Company Name. All rights reserved.</p>
      <p>Contact us at <a href="mailto:support@sandbox.com">mailto:support@sandbox.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
},


  async sendMail(email, subject, html) {
    try {
      var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: config.get("nodemailer.email"),
          pass: config.get("nodemailer.password"),
        },
      });

      var mailOptions = {
        from: "abhijeetrai415@gmail.com",
        to: email,
        subject: subject,
        html: html,
      };
      let send = await transporter.sendMail(mailOptions);
      return send;
    } catch (error) {
      return error;
    }
  },
  getToken: async (payload) => {
    try {
      const token = jwt.sign(payload, config.get("jwtsecret"), {
        expiresIn: "24h",
      });
      return token;
    } catch (error) {
      return error;
    }
  },
  expireBid: async (payload) => {
    try {
     
      return token;
    } catch (error) {
      return error;
    }
  },

};

