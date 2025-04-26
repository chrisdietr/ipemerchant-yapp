# Merchant Yapp

A modern, open-source point-of-sale (POS) application for merchants who want to accept cryptocurrency payments with a beautiful, mobile-friendly interface. Built with React, Vite, RainbowKit, and Yodl SDK.

---

## 🛍️ What is Merchant Yapp?
Merchant Yapp is a decentralized POS system that enables sellers to list products, accept crypto payments, and manage sales—all from an intuitive web dashboard. It works out-of-the-box for both physical and online shops.

### **Key Use Cases**
- Coffee shops, bars, and retail stores accepting crypto in-person
- Online shops and pop-ups needing fast crypto checkout
- Multi-seller environments (unique payment addresses per product)
- Admins tracking sales and managing inventory

---

## ✨ Features
- **Product Management:** Add, edit, and sell products with emoji and description
- **Seller-Specific Products:** Assign unique payment addresses and Telegram handles per product
- **Crypto Payments:** Accept crypto via Yodl SDK (iframe or redirect)
- **Order Receipts:** Shareable receipts, QR codes, and Telegram integration
- **Inventory Management:** Display in-stock, out-of-stock, or unlimited products
- **Theme Support:** Light/Dark mode, fully responsive UI

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16 or higher
- npm or yarn
- MetaMask or compatible wallet

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/merchant-yapp.git
   cd merchant-yapp
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Configure your environment:**
   - Copy `.env.example` to `.env`
   - Fill in your WalletConnect Project ID, admin wallet, and shop/product details (see below)
4. **Run the app:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Configuration & Environment Variables

All configuration is done via your `.env` file. **Never commit real secrets to source control!**

### Required Variables
- `VITE_WALLETCONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- `VITE_ADMIN_CONFIG`: JSON string for admin wallets (see below)
- `VITE_SHOP_CONFIG`: JSON string for your shop(s) and products (see below)

#### Example `.env` entries
```env
VITE_WALLETCONNECT_PROJECT_ID="your_project_id"
VITE_ADMIN_CONFIG='{"admins":[{"ens":"yourname.eth","address":"0x123..."}]}'
VITE_SHOP_CONFIG='{"shops":[{"name":"Coffee Shop","telegramHandle":"shop_telegram"}],"products":[{"id":"1","name":"Coffee","description":"Freshly brewed","price":0.1,"currency":"USD","emoji":"☕","inStock":true,"paymentAddress":"0xSELLER1","telegramHandle":"seller1_telegram"}]}'
```

#### Product Configuration Fields
| Field         | Description                         | Example                |
|-------------- |------------------------------------ |------------------------|
| id            | Unique product ID                   | "1", "tshirt-001"      |
| name          | Product name                        | "Coffee"               |
| description   | Short description                   | "Freshly brewed"       |
| price         | Product price (decimal, in crypto)  | 0.1, 25, 199.99        |
| currency      | Currency code                       | "USD", "EUR"           |
| emoji         | Emoji for product                   | "☕", "👕"              |
| inStock       | true/false or "infinite"            | true                   |
| paymentAddress| (Optional) Wallet to receive payment | "0xSELLER1", "ENS"     |
| telegramHandle| (Optional) Seller's Telegram        | "seller1_telegram"     |

---

## 🛠️ Advanced Usage

---

## 🏗️ Build & Deploy
- **Build for production:**
  ```bash
  npm run build
  # or
  yarn build
  ```
- **Docker:**
  ```bash
  docker-compose up --build
  ```
- **Deploy:**
  Upload the `dist/` folder to your preferred hosting (Vercel, Netlify, Docker, etc.)
- See `DEPLOYMENT.md` for full instructions

---

## 🧑‍💻 Extending & Customizing
- Add new payment methods via the Yodl SDK
- Integrate with Telegram, WhatsApp, or email for receipts
- Add product images or categories in `VITE_SHOP_CONFIG`
- Fork and PRs welcome!

---

## ❓ Troubleshooting & FAQ
- **App won’t start?** Check Node.js version, dependencies, and .env values
- **Payments not working?** Verify Yodl config
- **More help?** See `DEPLOYMENT.md` or open an issue

---

## 📄 License
MIT — Free for personal and commercial use.
