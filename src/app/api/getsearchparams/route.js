// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     // Mock data provided by the user
//     const data = [
//       {
//         search_id: 12,
//         name: "tapash dutta",
//         companyName: "indusnet technologies",
//         role: "software engineer",
//         email: "tapash.dutta@intglobal.com",
//         responce_results:
//           '{"userProfile":{"fullName":"Tapash Dutta","currentRole":"Tech Lead","linkedinProfileUrl":"https://in.linkedin.com/in/tapashdutta","linkedinProfileId":"tapashdutta","location":"Kolkata","connections":"Not explicitly available in snippets","summary":"Tapash Dutta is a Tech Lead at Indus Net Technologies (INT.), having recently been promoted from Senior Software Engineer in January 2024. With over 7 years of experience in the IT industry, commencing in April 2015, he is a dedicated Tech Enthusiast focused on IT Strategy, Digital Engineering, and Product Engineering. He is recognized for his positive, professional, and efficient approach to development and problem-solving, and actively engages in initiatives such as hackathons, demonstrating a keen interest in AI and SalesTech trends.","skills":["Software Engineering","Tech Leadership","IT Strategy","Digital Engineering","Product Engineering","Web Development","Problem Solving","System Design","Technical Communication","Agile Methodologies","Hackathon Participation","AI Concepts","SalesTech Concepts"],"education":[],"experience":[{"title":"Tech Lead","company":"Indus Net Technologies (INT.)","duration":"January 2024 - Present","description":"Leading technical initiatives and teams, driving digital and product engineering strategies. Spearheaded development and ensured efficient problem-solving within project lifecycles. Promoted internally from Senior Software Engineer."},{"title":"Senior Software Engineer","company":"Indus Net Technologies (INT.)","duration":"October 2020 - January 2024 (3 years 4 months)","description":"Developed and maintained software solutions within the IT industry, contributing significantly to projects focused on digital and product engineering. Applied professional and efficient development practices across various assignments. This role contributed to a total of over 7 years of experience in the IT sector since April 2015."}]},"companyProfile":{"companyName":"Indus Net Technologies (INT.)","linkedinCompanyUrl":"https://in.linkedin.com/company/indus-net-technologies","linkedinCompanyId":"indus-net-technologies","companyWebsite":"https://intglobal.com/","industry":"IT Services and IT Consulting, Software Development, Digital Transformation","companyType":"Private Limited","companySize":"1000+ professionals","employeeCount":"1000+","headquarters":"Kolkata, West Bengal, India","founded":"Circa 1995-1998 (operating for nearly three decades)","revenue":"Reported USD 120,000 (approx. Rs 1 Cr) in an old \'Startup Pedia\' snippet (highly suspect for a company of this size and likely outdated/miscontextualized). No recent, reliable revenue figures available.","valuation":"Not available","description":"Indus Net Technologies (INT.) is a global full-cycle product engineering and digitalization partner based in Kolkata, India, with a presence across 6 international locations. Operating for nearly three decades, INT empowers global enterprises to build intelligent, secure, and scalable digital ecosystems. The company specializes in Cloud-Native Digital Modernization, AI-Ready Data Platforms, Generative AI, Cybersecurity, and Digital Experience Engineering. Their service portfolio includes UX/UI services, custom software development, ERP solutions, digital marketing, web applications, and cloud services, serving diverse sectors such as Banking, Insurance, Life Sciences, FMCG, Manufacturing, Education, and government (e.g., CSIR-NML).","specialties":["Full-Cycle Product Engineering","Digital Modernization","AI-Ready Data Platforms","Generative AI","Cybersecurity","Digital Experience Engineering","UX/UI Services","Custom Software Development","ERP Software","Digital Marketing","Cloud Services","Web Applications","IT Strategy","Analytics","Consulting"],"technologies":["Cloud-Native Architectures","Artificial Intelligence (Generative AI, AI-Ready Data Platforms)","Big Data","Analytics Platforms","Cyber Security Solutions","ERP Software","Web Technologies"],"funding":{"totalFunding":"Not explicitly available for INT. itself.","latestRound":"N/A","investors":[]},"competitors":[],"recentNews":["Tapash Dutta promoted to Tech Lead (January 2024)","Participation in Global Fintech Awards 2023","Continues to bid on IT Software Developer tenders (Last bid on Dec 22, 2025)","Director Abhishek Rungta involved in pre-series funding round for Ideal Insurance (undated, implied recent)","Ongoing provision of customized websites, web applications, ERP software, cloud services, and digital marketing (from recent LinkedIn posts by INT.)"]},"additionalInfo":{"confidenceScore":0.95,"verificationStatus":"VERIFIED","dataSource":"LinkedIn (user & company profiles), GoodFirms, DesignRush, Kolkata Central, JustDial, Glassdoor, various financial documents (PDFs), Startup Pedia, Outlook Business, Facebook, G2, Tracxn, Bengal Chamber newsletters, NIT/JIS College reports, GitHub (potential personal projects).","lastUpdated":"2024-07-29T10:30:00Z","notes":"1. The reported company revenue of USD 120,000 (approx. Rs 1 Cr) from a \'Startup Pedia\' snippet is highly suspect and likely very outdated or miscontextualized, as it is inconsistent with a company employing over 1000 professionals. \\n2. Tapash Dutta\'s LinkedIn profile indicates \'7+ years of experience in IT Industry (Apr 2015 - to date)\', but only employment at Indus Net Technologies from October 2020 is detailed. His previous 5.5 years of experience (Apr 2015 - Sep 2020) are not specified in the provided raw intelligence.\\n3. No direct educational background details for Tapash Dutta were found in the provided snippets.\\n4. Careful entity resolution was required due to multiple individuals named \'Tapash Dutta\' appearing in the search results; only information directly linked to our target\'s company/role was included.\\n5. The company\'s primary corporate website is inferred as `intglobal.com`, though other domains like `indusnettechnologies.com` (for government projects) and `indusnet.co.in` (for investor relations) are also active.\\n6. The LinkedIn duration \'Oct 2020 - Nov 2025\' for Senior Software Engineer was overridden by the confirmed promotion to Tech Lead in Jan 2024."}}',
//       },
//       {
//         search_id: 11,
//         name: "tapash dutta",
//         companyName: "indusnet technologies",
//         role: "software engineer",
//         email: "tapash.dutta@intglobal.com",
//         responce_results: null,
//       },
//       {
//         search_id: 10,
//         name: "tapash dutta",
//         companyName: "indusnet technologies",
//         role: "software engineer",
//         email: "tapash.dutta@intglobal.com",
//         responce_results: null,
//       },
//       {
//         search_id: 9,
//         name: "tapash dutta",
//         companyName: "indusnet technologies",
//         role: "software engineer",
//         email: "tapash.dutta@intglobal.com",
//         responce_results: null,
//       },
//       {
//         search_id: 8,
//         name: "tapash dutta",
//         companyName: "indusnet technologies",
//         role: "software engineer",
//         email: "tapash.dutta@intglobal.com",
//         responce_results: null,
//       },
//       {
//         search_id: 7,
//         name: "Vijit Singh8",
//         companyName: "IntGlobal8",
//         role: "developer",
//         email: "vijit@example.com",
//         responce_results: null,
//       },
//       {
//         search_id: 6,
//         name: "Vijit Singh6",
//         companyName: "IntGlobal6",
//         role: "developer",
//         email: "vijit@example.com",
//         responce_results: null,
//       },
//       {
//         search_id: 5,
//         name: "Vijit Singh6",
//         companyName: "IntGlobal6",
//         role: "developer",
//         email: "vijit@example.com",
//         responce_results: null,
//       },
//       {
//         search_id: 4,
//         name: "Vijit Singh6",
//         companyName: "IntGlobal6",
//         role: "developer",
//         email: "vijit@example.com",
//         responce_results: null,
//       },
//       {
//         search_id: 3,
//         name: "Vijit Singh2",
//         companyName: "IntGlobal2",
//         role: "developer",
//         email: "vijit@example.com",
//         responce_results: null,
//       },
//       {
//         search_id: 2,
//         name: "Vijit Singh2",
//         companyName: "IntGlobal2",
//         role: "developer",
//         email: "vijit@example.com",
//         responce_results: null,
//       },
//       {
//         search_id: 1,
//         name: "Vijit Singh",
//         companyName: "IntGlobal",
//         role: "Director",
//         email: "vijit@example.com",
//         responce_results: null,
//       },
//     ];

//     return NextResponse.json({
//       status: 200,
//       success: true,
//       data: data,
//     });
//   } catch (error) {
//     console.error("Error in getsearchparams API:", error);
//     return NextResponse.json(
//       { success: false, message: "Internal Server Error" },
//       { status: 500 },
//     );
//   }
// }
