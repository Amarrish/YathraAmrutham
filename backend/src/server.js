require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 [Server Running]: WanderWise Tours & Travels API on port ${PORT}`);
    console.log(`📡 [API URL]: http://localhost:${PORT}/api/health`);
  });
}).catch((err) => {
  console.error('[Fatal Server Startup Error]:', err);
});
