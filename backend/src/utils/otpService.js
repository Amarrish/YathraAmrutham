const crypto = require('crypto');

// Generate 6 digit numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP for secure database storage
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Verify entered OTP against stored hash
const verifyOTP = (enteredOtp, storedHash) => {
  const enteredHash = hashOTP(enteredOtp);
  return enteredHash === storedHash;
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP
};
