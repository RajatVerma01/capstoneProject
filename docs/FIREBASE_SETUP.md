# Firebase Setup Guide — Career Accelerator

This guide walks you through everything you need to do in Firebase so the **Career Accelerator** backend can store and read roadmaps in Firestore.

---

## What This Project Uses

- **Firestore** only (no Auth, Realtime DB, or Storage in this guide).
- **Backend only**: the Node.js server uses the **Firebase Admin SDK** with a **service account**. The frontend never talks to Firebase directly.
- **Collection**: `roadmaps` (created automatically when the first document is added).
- **Operations**: create a roadmap (add document), get a roadmap by ID (read one document). No queries or indexes are required.

---

## Step 1: Create a Firebase Project

1. Go to **[Firebase Console](https://console.firebase.google.com/)** and sign in with your Google account.
2. Click **“Create a project”** (or **“Add project”** if you already have projects).
3. Enter a **project name** (e.g. `career-accelerator`).
4. (Optional) Turn off Google Analytics if you don’t need it.
5. Click **“Create project”** and wait until it’s ready, then **“Continue”**.

You now have a Firebase project. All following steps are done inside this project.

---

## Step 2: Enable Firestore Database

1. In the left sidebar, open **“Build”** → **“Firestore Database”**.
2. Click **“Create database”**.
3. **Choose a location** for the database (e.g. `us-central1` or the region closest to your users).  
   - You cannot change the region later, so pick carefully.
4. **Security rules** — choose one:
   - **“Start in production mode”** (recommended): rules default to “deny all” for client access. Your backend will still work because it uses the Admin SDK (service account), which bypasses these rules.  
   - **“Start in test mode”**: allows read/write for 30 days from any client. Only use for quick local testing; switch to production rules before going live.
5. Click **“Enable”** and wait for Firestore to be created.

Firestore is now enabled. The `roadmaps` collection will appear automatically when your backend creates the first document.

---

## Step 3: Set Firestore Security Rules

Because **only your backend** (Node.js with Admin SDK) writes and reads data, you should **deny all client access**. That way, even if someone gets a Firebase client config, they cannot read or write Firestore from the browser or a mobile app.

1. In Firestore, open the **“Rules”** tab.
2. Replace the rules with the following (you can also copy from the project’s **`firestore.rules`** file at the repo root):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only the backend (Admin SDK with service account) can access data.
    // Deny all client (web/mobile) access.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **“Publish”**.

**Why this is safe for our project**

- The backend uses the **Firebase Admin SDK** with a **service account**. That access **does not go through** these rules.
- These rules apply only to **client SDKs** (e.g. web or mobile apps using an API key). So `allow read, write: if false` blocks all client access while leaving your server fully able to create and read `roadmaps`.

**If you later add a web/mobile client** that talks to Firestore directly, you would change these rules (e.g. allow read for authenticated users, or for specific document IDs). For the current setup, the above is correct.

---

## Step 4: Get the Service Account Key (for the Backend)

The backend needs a **service account private key** to connect to Firestore.

1. In Firebase Console, click the **gear icon** next to “Project overview” → **“Project settings”**.
2. Open the **“Service accounts”** tab.
3. Click **“Generate new private key”** at the bottom → **“Generate key”**.  
   - A JSON file will download (e.g. `career-accelerator-firebase-adminsdk-xxxxx.json`).
4. **Keep this file secret.** Do not commit it to Git (it’s already in `.gitignore` as `*-service-account*.json`).

---

## Step 5: Put the Key Where the Backend Can Use It

**Option A — File path (typical for local or a VPS)**

1. Move or copy the downloaded JSON file into your project, e.g.:
   - `backend/firebase-service-account.json`  
   or  
   - `backend/config/my-firebase-sa.json`
2. Open `backend/.env` and set the **absolute or relative path** to that file:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

If you put the file in `backend/`, the path above is correct when you run the app from `backend/`. If you run from project root, use e.g. `backend/firebase-service-account.json`.

**Option B — JSON string (e.g. for Vercel, Railway, or other serverless)**

1. Open the downloaded JSON file in a text editor and copy its **entire** content (one JSON object).
2. In your hosting provider’s environment variables, add one variable, e.g.:
   - Name: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Value: paste the full JSON (one line is fine).
3. In `backend/.env` (or in the host’s env), **do not** set `FIREBASE_SERVICE_ACCOUNT_PATH`; the code will use `FIREBASE_SERVICE_ACCOUNT_JSON` if the path is not set.

**Use only one:** either `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`, not both.

---

## Step 6: Confirm Your `.env` (Backend)

Your `backend/.env` should look like this (with your real values):

```env
PORT=4000
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
SCRAPE_DO_TOKEN=your_scrape_do_token_if_you_have_one
FRONTEND_URL=http://localhost:5173
```

- If you use the JSON string instead of a file, remove `FIREBASE_SERVICE_ACCOUNT_PATH` and set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full JSON string.

---

## Step 7: Run the Backend and Test

1. From the project root:
   ```bash
   npm run dev
   ```
   Or run only the backend from `backend/`:
   ```bash
   npm run dev
   ```
2. Open the frontend (e.g. http://localhost:5173), submit a resume and a target job, and click **“Analyze & build roadmap”**.
3. If everything is correct:
   - The backend will create a document in the `roadmaps` collection.
   - You’ll get a roadmap and an `id` in the response.
4. In Firebase Console → **Firestore Database** → **“Data”** tab, you should see a collection **`roadmaps`** and one document (with the same `id` as in the response).

If you see the document in Firestore, Firebase is set up correctly for this project.

---

## Checklist

- [ ] Firebase project created  
- [ ] Firestore enabled (with your chosen region)  
- [ ] Firestore rules set to **deny all** client access (production mode)  
- [ ] Service account key downloaded  
- [ ] Key placed in `backend/` (or elsewhere) and **not** committed to Git  
- [ ] `FIREBASE_SERVICE_ACCOUNT_PATH` (or `FIREBASE_SERVICE_ACCOUNT_JSON`) set in `backend/.env`  
- [ ] Backend starts without errors  
- [ ] One roadmap created from the UI and visible under `roadmaps` in Firestore  

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| “Firebase not initialized” or “Failed to start server” | Backend could not load the service account. Ensure `FIREBASE_SERVICE_ACCOUNT_PATH` points to the correct file (from the directory you run `node` in) or `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON. |
| “Permission denied” when writing from backend | You’re not using the Admin SDK or the key is wrong. This project does **not** use the client SDK for Firestore; only the backend with the service account key should connect. |
| Collection `roadmaps` not showing in Console | Create at least one roadmap from the app; the collection is created on first write. |
| Rules “rejected” in browser | Expected. Client access is denied by design. The app uses your backend API, not direct Firestore from the browser. |

---

## Summary

- **Firebase**: one project, Firestore enabled, region chosen.  
- **Rules**: deny all client read/write; backend uses Admin SDK and is not affected by these rules.  
- **Backend**: one service account key (file path or JSON in env); backend creates and reads documents in the `roadmaps` collection.  
- **No indexes or extra setup** are required for the current “add document” and “get by ID” usage.

Once the checklist is done, Firebase is configured correctly for this project.
