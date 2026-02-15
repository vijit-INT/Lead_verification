// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     // In a real application, you would calculate these stats from your database.
//     // For now, we return the specified mock data.
//     const stats = {
//       totalLeads: 13,
//       enrichedProfiles: 3,
//       conversionRate: "23.08%",
//     };

//     return NextResponse.json({
//       status: 200,
//       success: true,
//       data: stats,
//     });
//   } catch (error) {
//     console.error("Error fetching dashboard stats:", error);
//     return NextResponse.json(
//       { success: false, message: "Internal Server Error" },
//       { status: 500 },
//     );
//   }
// }
