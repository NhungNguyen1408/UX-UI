# BeautyGlow - Technical verification record

Date: 2026-11-05

## Scope delivered

- Frontend React/Vite: introductory splash, 3 onboarding slides, welcome, login/register, home, search/filter, categories, product detail, cart, checkout, order success, orders, account, favorites, addresses, reviews.
- Node.js backend/MySQL API: auth, products, categories, cart, addresses, order transaction, favorites, reviews, pending-order cancellation.
- Data: existing 12-table schema, seed SQL, example orders and ERD.
- Local Windows setup: CAU_HINH_XAMPP_WINDOWS.bat, CAI_THU_VIEN_WINDOWS.bat, CHAY_BEAUTYGLOW_WINDOWS.bat, BAT_DAU_XAMPP.txt.

## Checks performed in project packaging environment

- Node syntax check passed for server/src/index.js and server/src/seed-demo.js.
- TypeScript JSX parser/transpileModule reported 0 diagnostics for web/src/main.jsx.
- `npm test` in server: 3/3 passed (schema/route/transaction static checks).
- `npm test` in web: 3/3 passed (API header/token/data/error unit checks).
- Original 12-table SQL and ERD included.
- No server/.env, node_modules, or MySQL passwords included in delivery.

## Not verified here

- Full frontend `npm run build` cannot be executed until npm dependencies are installed on an Internet-connected machine.
- Cannot reach XAMPP running on the user's Windows computer from this environment. Health endpoint, registration, cart persistence and order checkout require real runtime verification there.
- Not a 1:1 conversion of every Figma page. Screens for secondary flows such as OTP, refund, loyalty and customer support are not implemented with real services. Cosmetic product SVGs are demonstration replacements for Figma source imagery.
- Simulated MoMo payment does not process real money.

## Local acceptance walkthrough

1. Start XAMPP MySQL. In phpMyAdmin, check `beautyglow_db`, 12 tables and products rows.
2. Run `CAU_HINH_XAMPP_WINDOWS.bat` without overwriting an existing .env.
3. Run `CAI_THU_VIEN_WINDOWS.bat`, then in server run `npm run seed:demo`.
4. Run `CHAY_BEAUTYGLOW_WINDOWS.bat` and open http://localhost:5173.
5. Open http://localhost:4000/api/health. Must show `database:connected`.
6. Go through Splash, onboarding, login using demo user.
7. Search for serum; filter 200k-500k, add Vitamin C to cart.
8. Set address if absent; checkout COD and verify order in orders table.
9. Open order, cancel if still PENDING. Verify cancellation in phpMyAdmin.
10. Add a product review and toggle favorites; verify in database.
11. Run `npm test` in both server and web for static/unit checks.
