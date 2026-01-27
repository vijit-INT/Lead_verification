This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **LinkedIn Profile & Company Search**: Integrated with Google Gemini AI to search for LinkedIn profiles and company information based on user details (name, role, email).
- **Web Search Capability**: Uses Gemini AI's reasoning and knowledge to search for LinkedIn profiles and company data.

**Note**: For real-time web search results, you may want to integrate Google Custom Search API or SerpAPI. The current implementation uses Gemini AI's knowledge base to find LinkedIn information.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory and add your Google Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get your Gemini API key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and paste it in your `.env.local` file

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Using the LinkedIn Search Feature

1. Navigate to the Agents component (or add it to your page)
2. Enter user details:
   - **Name** (required): Full name of the person
   - **Role** (optional): Current job title/role
   - **Email** (required): Email address (used to identify company domain)
3. Click "Search LinkedIn" to get comprehensive profile and company information

The system will return:
- **User Profile**: LinkedIn profile ID, URL, experience, education, skills, etc.
- **Company Profile**: Company name, website, employee count, revenue, funding, technologies, competitors, etc.
- **Additional Information**: Verification status, data sources, and notes

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
