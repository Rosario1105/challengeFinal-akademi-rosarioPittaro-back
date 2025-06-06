const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.exportsMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Soporte AKADEMI VORTEX" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
