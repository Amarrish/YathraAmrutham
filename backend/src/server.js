require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP Server
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 [Server Running]: WanderWise Tours & Travels API on port ${PORT}`);
    console.log(`📡 [API URL]: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server Startup Error]: Port ${PORT} is already in use. Stop the other process or set PORT to a free port.`);
    } else {
      console.error('[Server Startup Error]:', err);
    }
    process.exit(1);
  });
}).catch((err) => {
  console.error('[Fatal Server Startup Error]:', err);
});
