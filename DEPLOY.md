# Pulse MuCMS - Deployment Guide (Windows Server VPS)

## Prerequisites

- Windows Server 2016+ with IIS or Nginx
- Node.js 18+ (LTS) installed
- SQL Server Express installed (localhost)
- MuOnline database already configured
- PM2 installed globally: `npm install -g pm2`

---

## 1. SQL Server Setup

### Enable TCP/IP connections:
1. Open **SQL Server Configuration Manager**
2. Go to **SQL Server Network Configuration > Protocols for MSSQLSERVER**
3. Enable **TCP/IP**
4. Double-click TCP/IP > IP Addresses tab > Set **TCP Port = 1433** for IPAll
5. Restart SQL Server service

### Run the setup script:
1. Open **SQL Server Management Studio (SSMS)**
2. Connect to your MuOnline database
3. Open and run `server/sql/setup.sql`
4. This adds the required columns (Resets, GrandResets, MasterLevel) if they don't exist

---

## 2. Backend Setup

```powershell
# Navigate to server folder
cd server

# Copy and configure environment file
copy .env.example .env

# Edit .env with your settings:
# - DB_SERVER=localhost
# - DB_PASSWORD=your_sa_password
# - DB_DATABASE=MuOnline
# - JWT_SECRET=a-strong-random-secret-key
# - CORS_ORIGIN=http://yourdomain.com

# Install dependencies
npm install

# Test the server
node src/index.js
# You should see: "[Server] GxGA MuCMS API running on port 3001"
```

---

## 3. Frontend Build

```powershell
# Navigate to project root
cd ..

# Create .env for frontend
# Set VITE_API_URL to your backend URL
echo VITE_API_URL=http://yourdomain.com:3001 > .env.production

# Install dependencies and build
npm install
npm run build
# Output goes to dist/ folder
```

---

## 4. PM2 - Keep Backend Running

```powershell
# Start the API with PM2
cd server
pm2 start src/index.js --name "pulse-api"

# Save PM2 process list
pm2 save

# Set PM2 to start on Windows boot
pm2-startup install

# Useful PM2 commands:
pm2 status        # Check status
pm2 logs pulse-api # View logs
pm2 restart pulse-api # Restart
pm2 stop pulse-api    # Stop
```

---

## 5a. IIS Configuration (Recommended for Windows)

### Install URL Rewrite and ARR modules:
1. Download and install **URL Rewrite** from https://www.iis.net/downloads/microsoft/url-rewrite
2. Download and install **Application Request Routing (ARR)**

### Serve the React frontend:
1. Create a new site in IIS pointing to the `dist/` folder
2. Set binding to your domain (port 80/443)
3. Add a `web.config` file to `dist/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- API Proxy to Node.js backend -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
        </rule>
        <!-- React SPA Fallback -->
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

### With this setup, set frontend .env:
```
VITE_API_URL=
```
(Leave empty - IIS will proxy /api/ requests to the backend)

---

## 5b. Nginx Configuration (Alternative)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # React frontend
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to Node.js backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Firewall Configuration

Open these ports in Windows Firewall:

```powershell
# Open port 80 (HTTP)
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80

# Open port 443 (HTTPS) if using SSL
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443

# IMPORTANT: Do NOT open port 1433 (SQL Server) to the internet!
# The API connects to SQL Server on localhost only.
# If you need remote DB access, use VPN or SSH tunnel.
```

---

## 7. Security Checklist

- [ ] SQL Server only accepts connections from localhost (127.0.0.1)
- [ ] Port 1433 is NOT open in the firewall
- [ ] `.env` file is not accessible from the web
- [ ] JWT_SECRET is a strong random string (32+ characters)
- [ ] CORS_ORIGIN only allows your actual domain
- [ ] Rate limiting is enabled (default: 100 requests per 15 minutes)
- [ ] Helmet.js security headers are active
- [ ] HTTPS is configured (use Let's Encrypt or your own certificate)
- [ ] PM2 is running and set to auto-start
- [ ] Regular backups of your SQL Server database

---

## Quick Reference

| Service      | Port | Access          |
|-------------|------|-----------------|
| Frontend    | 80   | Public          |
| Backend API | 3001 | Internal (proxied via IIS/Nginx) |
| SQL Server  | 1433 | Localhost only  |

## API Endpoints

| Method | Path                              | Auth     | Description              |
|--------|-----------------------------------|----------|--------------------------|
| POST   | /api/auth/login                   | No       | Login with username/password |
| POST   | /api/auth/register                | No       | Create new account       |
| GET    | /api/auth/me                      | JWT      | Get current user info    |
| POST   | /api/auth/change-password         | JWT      | Change password          |
| GET    | /api/rankings/players             | No       | Player rankings          |
| GET    | /api/rankings/guilds              | No       | Guild rankings           |
| GET    | /api/rankings/guilds/:name/members| No       | Guild member list        |
| GET    | /api/rankings/top                 | No       | Top 5 players            |
| GET    | /api/rankings/character/:name     | No       | Character detail         |
| GET    | /api/rankings/castle-siege        | No       | Castle siege owner       |
| GET    | /api/rankings/online              | No       | Online player count      |
| GET    | /api/account/characters           | JWT      | My characters            |
| POST   | /api/account/reset                | JWT      | Reset a character        |
| GET    | /api/health                       | No       | Health check             |
