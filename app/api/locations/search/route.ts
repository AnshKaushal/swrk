import { NextRequest, NextResponse } from "next/server"

const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
  "Indore",
  "Bhopal",
  "Visakhapatnam",
  "Surat",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Kochi",
  "Coimbatore",
  "Aurangabad",
  "Nashik",
  "Nagpur",
  "Agra",
  "Srinagar",
  "Varanasi",
  "Patna",
  "Ranchi",
]

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
]

const COUNTRIES = [
  "India",
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Singapore",
  "Japan",
  "China",
  "UAE",
  "Saudi Arabia",
  "Sweden",
  "Netherlands",
  "Ireland",
  "New Zealand",
  "South Korea",
  "Malaysia",
  "Thailand",
  "Indonesia",
  "Philippines",
  "Vietnam",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Brazil",
  "Mexico",
  "Argentina",
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get("q") || ""
    const type = searchParams.get("type") as "city" | "state" | "country" | null

    if (!q.trim()) {
      return NextResponse.json({ results: [] })
    }

    const query = q.toLowerCase().trim()
    let results: Array<{ type: "city" | "state" | "country"; name: string }> =
      []

    if (!type || type === "city") {
      const cities = INDIAN_CITIES.filter((city) =>
        city.toLowerCase().startsWith(query),
      ).slice(0, 5)
      results.push(
        ...cities.map((city) => ({ type: "city" as const, name: city })),
      )
    }

    if (!type || type === "state") {
      const states = INDIAN_STATES.filter((state) =>
        state.toLowerCase().startsWith(query),
      ).slice(0, 5)
      results.push(
        ...states.map((state) => ({ type: "state" as const, name: state })),
      )
    }

    if (!type || type === "country") {
      const countries = COUNTRIES.filter((country) =>
        country.toLowerCase().startsWith(query),
      ).slice(0, 5)
      results.push(
        ...countries.map((country) => ({
          type: "country" as const,
          name: country,
        })),
      )
    }

    return NextResponse.json({
      results: results.slice(0, 10),
    })
  } catch (error) {
    console.error("Location search error:", error)
    return NextResponse.json(
      { error: "Failed to search locations" },
      { status: 500 },
    )
  }
}
