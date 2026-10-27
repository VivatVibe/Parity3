# How to Deploy to Cloudflare Pages

This guide walks you through building and deploying this application to Cloudflare Pages.

---

## Prerequisites

* A Cloudflare account ([dash.cloudflare.com](https://dash.cloudflare.com/))
* Node.js v20 or higher installed locally
* Git repository containing the project files

---

## Method 1: Git Integration (Recommended)

Use this method for continuous deployment whenever you push commits to GitHub or GitLab.

### Step 1: Push Code to Your Git Provider

If you have not created a remote repository yet, run:

```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

### Step 2: Connect Repository in Cloudflare Dashboard

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left sidebar, navigate to **Compute (Workers) > Pages**.
3. Click **Create application > Pages > Connect to Git**.
4. Select your GitHub or GitLab repository and click **Begin setup**.

### Step 3: Configure Build Settings

Fill in the build configuration:

| Setting | Value |
|---|---|
| **Project name** | `thai-freelancer-billing` (or your choice) |
| **Production branch** | `main` |
| **Framework preset** | `Vite` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (leave empty or default) |

### Step 4: Environment Variables (Node.js Version)

Under **Environment variables (advanced)**, add:

| Variable Name | Value |
|---|---|
| `NODE_VERSION` | `22` |

Click **Save and Deploy**. Cloudflare builds the site and serves it on your assigned `*.pages.dev` domain in under 60 seconds.

---

## Method 2: Direct Upload via Wrangler CLI

Use this method to deploy directly from your local terminal without connecting a Git repository.

### Step 1: Install Wrangler and Authenticate

Run in your project root:

```bash
npx wrangler login
```

Your browser opens to authorize the Cloudflare CLI.

### Step 2: Build the Application

Build the static output into the `dist/` folder:

```bash
npm run build
```

Verify that the `dist/` directory contains `index.html` and `assets/`.

### Step 3: Deploy to Cloudflare Pages

Run:

```bash
npx wrangler pages deploy dist --project-name thai-freelancer-billing
```

* If prompted to create a new project, choose **Create a new project** and select **Production**.
* Wrangler uploads the static files and outputs your live deployment URL:
  `https://thai-freelancer-billing.pages.dev`

---

## Custom Domain Configuration

To connect your own domain (e.g., `billing.yourdomain.com`):

1. Go to your Cloudflare Pages project.
2. Click **Custom domains**.
3. Click **Set up a custom domain**.
4. Enter your domain name and follow the DNS verification steps. Cloudflare provisions SSL certificates automatically.
