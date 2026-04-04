# Security Policy

## 🔐 Supported Versions

This project is actively maintained. Please use the latest version available on the main branch.

---

## 🚨 Reporting a Vulnerability
T
If you discover a security vulnerability, please report it responsibly:

- Do NOT create a public issue
- Contact: [panja.tushar15@zohomail.in]

I will respond as soon as possible and work on a fix.

---

## 🔒 Security Measures Implemented

This project includes:

- API rate limiting to prevent abuse
- Input validation for user prompts
- Secure handling of API tokens (Google, Gemini)
- Tool access control in MCP layer

---

## ⚠️ Known Limitations

- This is an MVP project and may not cover all edge cases
- OAuth tokens should be rotated regularly
- Avoid exposing this API publicly without authentication

---

## 🛡️ Best Practices for Users

If you fork or use this project:

- Never commit your `.env` file
- Use your own API keys
- Add authentication before production use