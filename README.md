# Izzat Khatoon Online Shopping

## Run in VS Code (Windows)
1. Install Node.js LTS from https://nodejs.org/
2. Open this folder in VS Code and open Terminal.
3. Set an admin password locally (replace the example with a password you choose):
   ```powershell
   $env:ADMIN_PASSWORD="ChooseYourOwnStrongPassword"; npm start
   ```
4. Open http://localhost:3000

To save the password for future PowerShell sessions:
```powershell
setx ADMIN_PASSWORD "ChooseYourOwnStrongPassword"
```
Then close and reopen VS Code/Terminal. Do not share your password or store it in project files.

## Admin
- URL: http://localhost:3000/admin.html
- Username: `izzatkahtoon110`
- Password: the configured admin password.
- If not set, starter fallback password is `amjadbaba78780`; change it before use.

## Address book
Checkout can save up to 10 delivery addresses in the customer's current browser/device using local storage. They are not synced across devices.

## JazzCash
Manual JazzCash payment option:
- Account name: Izzat Khatoon
- Account number: 03302761265
Customer enters the transaction ID after payment. The order and reference appear in the admin dashboard. The store owner must verify payment independently. This is not automatic payment confirmation; official JazzCash merchant/API integration is needed for that.

## Important
This is a starter project, not production-hardened. Orders are stored in a local JSON file. No online card gateway, email/SMS verification, shipping integration or cloud database is included. Use HTTPS, strong credentials, backups, database hosting and a security review before real launch.


## Admin sign-in note
The requested admin username and password are configured as the local starter defaults in `server.js`.
Anyone who can read the project files can see these defaults. Keep the ZIP and project folder private, and change the credentials before putting the site on a public server.
