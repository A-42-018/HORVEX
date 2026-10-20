// The 64 districts of Bangladesh (checkout district field, roadmap §6.7 #5).
export const DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria", "Chandpur",
  "Chapainawabganj", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla", "Dhaka", "Dinajpur", "Faridpur",
  "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokathi",
  "Jhenaidah", "Joypurhat", "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
  "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh",
  "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali",
  "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
  "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon",
];

/** Case-insensitive match → the canonical district name, or null. */
const byKey = new Map(DISTRICTS.map((d) => [d.toLowerCase(), d]));
export const findDistrict = (input) => byKey.get(String(input ?? "").trim().toLowerCase()) ?? null;

// Zones are admin-editable rows with no flag for "needs a district", so the
// zone named "Outside Dhaka" (seeded) is the one that asks for it. Every other
// zone is inside the Dhaka region and the engine defaults its district to Dhaka.
export const isOutsideDhaka = (zone) => /outside/i.test(zone?.name ?? "");
