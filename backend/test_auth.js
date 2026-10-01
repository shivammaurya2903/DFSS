const http = require("http");
const app = require("./src/index");

const PORT = 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  
  // Test registration
  const req = http.request({
    hostname: "localhost",
    port: PORT,
    path: "/api/auth/register",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      console.log("Registration response:", data);
      
      // Test login
      const loginReq = http.request({
        hostname: "localhost",
        port: PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      }, (loginRes) => {
        let loginData = "";
        loginRes.on("data", (chunk) => { loginData += chunk; });
        loginRes.on("end", () => {
          console.log("Login response:", loginData);
          
          // Test me endpoint with token
          const token = JSON.parse(loginData).token;
          const meReq = http.request({
            hostname: "localhost",
            port: PORT,
            path: "/api/auth/me",
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }, (meRes) => {
            let meData = "";
            meRes.on("data", (chunk) => { meData += chunk; });
            meRes.on("end", () => {
              console.log("Me response:", meData);
              server.close();
              process.exit(0);
            });
          });
          meReq.end();
        });
      });
      
      loginReq.write(JSON.stringify({ email: "test@example.com", password: "Password123" }));
      loginReq.end();
    });
  });
  
  req.write(JSON.stringify({ name: "Test User", email: "test@example.com", password: "Password123" }));
  req.end();
});