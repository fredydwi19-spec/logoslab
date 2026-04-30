import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationUrl = `http://localhost:3000/api/auth/verify?token=${token}`;

  const mailOptions = {
    from: '"Logos LAB" <no-reply@logoslab.com>',
    to,
    subject: 'Verifikasi Akun Logos LAB Anda',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Selamat datang di Logos LAB!</h2>
        <p>Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda dan mengaktifkan akun Anda:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #2563eb; text-decoration: none; border-radius: 5px; margin-top: 15px;">Verifikasi Email</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Atau salin tautan ini ke browser Anda: <br> ${verificationUrl}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};
