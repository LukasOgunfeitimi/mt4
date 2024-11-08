const https = require('https');
const fs = require('fs');

// Read the SSL certificate and key
const options = {
    key: fs.readFileSync('/etc/ssl/araxy_key.key'),
    cert: fs.readFileSync('/etc/ssl/araxy_cert.cer'),
};

// Create the HTTPS server
const server = https.createServer(options, (req, res) => {
  // Check if the request is a POST request to a specific path (e.g., /submit)
  if (req.method === 'POST' && req.url === '/submit') {
    let body = '';

    // Listen for data chunks
    req.on('data', (chunk) => {
      body += chunk.toString(); // Convert Buffer to string
    });

    // End event is fired when the whole body has been received
    req.on('end', () => {
      console.log('Received body:', body);

      // Process the data (e.g., parse JSON if needed)
      try {
        const data = JSON.parse(body); // Assuming JSON input
        console.log('Parsed data:', data);

        // Send a response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Data received', received: data }));
      } catch (error) {
        // Handle parsing error
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    // Handle other requests (e.g., GET)
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start the server on port 443 for HTTPS
server.listen(3500, () => {
  console.log('Server is running on https://localhost');
});
