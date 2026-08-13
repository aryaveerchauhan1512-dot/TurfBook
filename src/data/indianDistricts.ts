export interface StateDistricts {
  state: string;
  code: string;
  districts: string[];
}

export const INDIAN_STATES_DISTRICTS: StateDistricts[] = [
  {
    state: "Andhra Pradesh",
    code: "AP",
    districts: [
      "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla",
      "Chittoor", "East Godavari", "Eluru", "Guntur", "Kakinada",
      "Konaseema", "Sri Potti Sriramulu Nellore", "Kurnool", "Nandyal", "NTR",
      "Palnadu", "Parvathipuram Manyam", "Prakasam", "Tirupati", "Sri Sathya Sai",
      "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"
    ]
  },
  {
    state: "Arunachal Pradesh",
    code: "AR",
    districts: [
      "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang",
      "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lhit",
      "Longding", "Lower Dibang Valley", "Lower Subansiri", "Namsai", "Pakke Kessang",
      "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap",
      "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang", "Itanagar"
    ]
  },
  {
    state: "Assam",
    code: "AS",
    districts: [
      "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar",
      "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri",
      "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi",
      "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong",
      "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon",
      "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar",
      "Tinsukia", "Udalguri", "West Karbi Anglong"
    ]
  },
  {
    state: "Bihar",
    code: "BR",
    districts: [
      "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai",
      "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran",
      "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur",
      "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura",
      "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada",
      "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur",
      "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan",
      "Supaul", "Vaishali", "West Champaran"
    ]
  },
  {
    state: "Chhattisgarh",
    code: "CG",
    districts: [
      "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara",
      "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg",
      "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham",
      "Kanker", "Khairagarh-Chhuikhadan-Gandai", "Kondagaon", "Korba", "Koriya",
      "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur",
      "Raigarh", "Raipur", "Rajnandgaon", "Sarangarh-Bilaigarh", "Sukma",
      "Surajpur", "Surguja", "Sakti"
    ]
  },
  {
    state: "Goa",
    code: "GA",
    districts: [
      "North Goa", "South Goa"
    ]
  },
  {
    state: "Gujarat",
    code: "GJ",
    districts: [
      "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha",
      "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod",
      "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar",
      "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana",
      "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan",
      "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar",
      "Tapi", "Vadodara", "Valsad"
    ]
  },
  {
    state: "Haryana",
    code: "HR",
    districts: [
      "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad",
      "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal",
      "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal",
      "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa",
      "Sonipat", "Yamunanagar"
    ]
  },
  {
    state: "Himachal Pradesh",
    code: "HP",
    districts: [
      "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur",
      "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur",
      "Solan", "Una"
    ]
  },
  {
    state: "Jharkhand",
    code: "JH",
    districts: [
      "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka",
      "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla",
      "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar",
      "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi",
      "Sahebganj", "Saraikela Kharsawan", "Simdega", "West Singhbhum"
    ]
  },
  {
    state: "Karnataka",
    code: "KA",
    districts: [
      "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
      "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga",
      "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan",
      "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal",
      "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga",
      "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"
    ]
  },
  {
    state: "Kerala",
    code: "KL",
    districts: [
      "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod",
      "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad",
      "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
    ]
  },
  {
    state: "Madhya Pradesh",
    code: "MP",
    districts: [
      "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat",
      "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur",
      "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas",
      "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram",
      "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa",
      "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur",
      "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh",
      "Ratlam", "Rewa", "Sagar", "Satna", "Sehore",
      "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri",
      "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria",
      "Vidisha", "Mauganj", "Maihar", "Pandhurna"
    ]
  },
  {
    state: "Maharashtra",
    code: "MH",
    districts: [
      "Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Beed",
      "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli",
      "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
      "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded",
      "Nandurbar", "Nashik", "Dharashiv", "Palghar", "Parbhani",
      "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
      "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
    ]
  },
  {
    state: "Manipur",
    code: "MN",
    districts: [
      "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West",
      "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney",
      "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"
    ]
  },
  {
    state: "Meghalaya",
    code: "ML",
    districts: [
      "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills",
      "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills",
      "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"
    ]
  },
  {
    state: "Mizoram",
    code: "MZ",
    districts: [
      "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib",
      "Lawngtlai", "Lunglei", "Mamit", "Saitual", "Siaha", "Serchhip"
    ]
  },
  {
    state: "Nagaland",
    code: "NL",
    districts: [
      "Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng",
      "Mokokchung", "Mon", "Niuland", "Noklak", "Peren",
      "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto"
    ]
  },
  {
    state: "Odisha",
    code: "OR",
    districts: [
      "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak",
      "Baudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati",
      "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi",
      "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput",
      "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada",
      "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"
    ]
  },
  {
    state: "Punjab",
    code: "PB",
    districts: [
      "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
      "Fazilka", "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
      "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga",
      "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur",
      "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"
    ]
  },
  {
    state: "Rajasthan",
    code: "RJ",
    districts: [
      "Ajmer", "Alwar", "Anupgarh", "Balotra", "Banswara",
      "Baran", "Barmer", "Beawar", "Bharatpur", "Bhilwara",
      "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa",
      "Deeg", "Didwana-Kuchaman", "Dholpur", "Dudu", "Dungarpur",
      "Gangapur City", "Hanumangarh", "Jaipur", "Jaipur Rural", "Jaisalmer",
      "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Jodhpur Rural",
      "Karauli", "Kekri", "Kota", "Kotputli-Behror", "Nagaur",
      "Neem Ka Thana", "Pali", "Phalodi", "Pratapgarh", "Rajsamand",
      "Salumbar", "Sanchi", "Sawai Madhopur", "Shahpura", "Sikar",
      "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur", "Khairthal-Tijara"
    ]
  },
  {
    state: "Sikkim",
    code: "SK",
    districts: [
      "Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"
    ]
  },
  {
    state: "Tamil Nadu",
    code: "TN",
    districts: [
      "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
      "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
      "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
      "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
      "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
      "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
      "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
      "Vellore", "Viluppuram", "Virudhunagar"
    ]
  },
  {
    state: "Telangana",
    code: "TG",
    districts: [
      "Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad", "Jagtial",
      "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar",
      "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial",
      "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda",
      "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla",
      "Ranga Reddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad",
      "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"
    ]
  },
  {
    state: "Tripura",
    code: "TR",
    districts: [
      "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala",
      "South Tripura", "Unakoti", "West Tripura"
    ]
  },
  {
    state: "Uttar Pradesh",
    code: "UP",
    districts: [
      "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha",
      "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich",
      "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly",
      "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr",
      "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah",
      "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad",
      "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur",
      "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi",
      "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi",
      "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj",
      "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut",
      "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh",
      "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal",
      "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar",
      "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"
    ]
  },
  {
    state: "Uttarakhand",
    code: "UK",
    districts: [
      "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun",
      "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag",
      "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"
    ]
  },
  {
    state: "West Bengal",
    code: "WB",
    districts: [
      "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
      "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram",
      "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia",
      "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur",
      "Purulia", "South 24 Parganas", "Uttar Dinajpur"
    ]
  },
  {
    state: "Andaman and Nicobar Islands",
    code: "AN",
    districts: ["Nicobar", "North and Middle Andaman", "South Andaman"]
  },
  {
    state: "Chandigarh",
    code: "CH",
    districts: ["Chandigarh"]
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DN",
    districts: ["Dadra and Nagar Haveli", "Daman", "Diu"]
  },
  {
    state: "Delhi",
    code: "DL",
    districts: [
      "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
      "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
    ]
  },
  {
    state: "Jammu and Kashmir",
    code: "JK",
    districts: [
      "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda",
      "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam",
      "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban",
      "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"
    ]
  },
  {
    state: "Ladakh",
    code: "LA",
    districts: ["Kargil", "Leh"]
  },
  {
    state: "Lakshadweep",
    code: "LD",
    districts: ["Lakshadweep"]
  },
  {
    state: "Puducherry",
    code: "PY",
    districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"]
  }
];

// Flat array of formatted district names with State code, e.g. "Adilabad, TG" sorted in ascending alphabetical order (A to Z)
export const ALL_INDIAN_DISTRICTS_FORMATTED: string[] = INDIAN_STATES_DISTRICTS.flatMap(st =>
  st.districts.map(d => `${d}, ${st.code}`)
).sort((a, b) => a.localeCompare(b));

// Map of district name to full display text
export const DISTRICT_TO_STATE_MAP = new Map<string, { state: string; code: string }>();
INDIAN_STATES_DISTRICTS.forEach(st => {
  st.districts.forEach(d => {
    DISTRICT_TO_STATE_MAP.set(d.toLowerCase(), { state: st.state, code: st.code });
    DISTRICT_TO_STATE_MAP.set(`${d.toLowerCase()}, ${st.code.toLowerCase()}`, { state: st.state, code: st.code });
  });
});

// Levenshtein edit distance for typo and misspelling tolerance
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

// Common Indian district synonyms, historic names & common typos
const LOCATION_ALIASES: Record<string, string[]> = {
  khori: ['kheri'],
  lakhimpur: ['kheri', 'lakhimpur'],
  'lakhimpur kheri': ['kheri'],
  gurgaon: ['gurugram'],
  bangalore: ['bengaluru'],
  bombay: ['mumbai'],
  calcutta: ['kolkata'],
  banaras: ['varanasi'],
  prayagraj: ['allahabad', 'prayagraj'],
  allahabad: ['prayagraj'],
  orissa: ['odisha'],
  vizag: ['visakhapatnam'],
  trichy: ['tiruchirappalli'],
  calicut: ['kozhikode'],
  cochin: ['kochi', 'ernakulam'],
  pondicherry: ['puducherry'],
  madras: ['chennai'],
  baroda: ['vadodara'],
  shimla: ['simla'],
  simla: ['shimla'],
  gauhati: ['guwahati'],
  trivandrum: ['thiruvananthapuram'],
  dilli: ['delhi'],
  dehli: ['delhi'],
  jaipoor: ['jaipur'],
  ajmere: ['ajmer'],
  mumbay: ['mumbai'],
  puna: ['pune'],
  poona: ['pune'],
  hydrabad: ['hyderabad'],
  gurgram: ['gurugram'],
  noida: ['gautam buddha nagar'],
  'greater noida': ['gautam buddha nagar'],
  ghaziabad: ['ghaziabad'],
  faridabad: ['faridabad'],
};

/**
 * Checks if a search input matches a target district string with support for:
 * 1. Multi-term search (e.g. "Jaipur Ajmer" matches both Jaipur and Ajmer)
 * 2. Aliases/variations (e.g. "Lakhimpur Kheri" or "Lakhimpur" -> "Kheri, UP")
 * 3. Misspelling & typo tolerance via Levenshtein distance (e.g. "Khori" -> "Kheri")
 */
export function smartMatchDistrict(districtFormatted: string, searchInput: string): boolean {
  if (!searchInput || !searchInput.trim()) return true;

  const targetLower = districtFormatted.toLowerCase();
  const rawInput = searchInput.toLowerCase().trim();

  // Direct substring check
  if (targetLower.includes(rawInput)) return true;

  // Split query into tokens by spaces, commas, slashes
  const queryTokens = rawInput.split(/[\s,+/]+/).filter(t => t.length > 0);
  if (queryTokens.length === 0) return true;

  // Split target district into tokens (e.g. ["kheri", "up"])
  const targetTokens = targetLower.split(/[\s,+/]+/).filter(t => t.length > 0);

  // Check if ANY query token matches the target district (Multi-term OR logic)
  return queryTokens.some(qToken => {
    // 1. Direct substring in target
    if (targetLower.includes(qToken)) return true;

    // 2. Expand aliases for query token or full query
    const expandedTokens: string[] = [qToken];
    if (LOCATION_ALIASES[qToken]) {
      expandedTokens.push(...LOCATION_ALIASES[qToken]);
    }
    if (LOCATION_ALIASES[rawInput]) {
      expandedTokens.push(...LOCATION_ALIASES[rawInput]);
    }

    for (const expToken of expandedTokens) {
      if (targetLower.includes(expToken)) return true;

      // 3. Fuzzy match against each target token
      for (const tToken of targetTokens) {
        if (tToken.includes(expToken) || expToken.includes(tToken)) return true;

        const maxDist = expToken.length <= 4 ? 1 : 2;
        if (levenshteinDistance(expToken, tToken) <= maxDist) {
          return true;
        }
      }
    }

    return false;
  });
}

/**
 * Filter and rank districts using smart matching
 */
export function smartFilterDistricts(
  districts: string[],
  query: string,
  maxResults = 50
): string[] {
  if (!query || !query.trim()) {
    return districts.slice(0, maxResults);
  }

  const normalizedQuery = query.toLowerCase().trim();

  const matched = districts.filter(d => smartMatchDistrict(d, normalizedQuery));

  // Sort exact/prefix matches first, then fuzzy
  matched.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    const aExact = aLower.startsWith(normalizedQuery);
    const bExact = bLower.startsWith(normalizedQuery);

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aSub = aLower.includes(normalizedQuery);
    const bSub = bLower.includes(normalizedQuery);

    if (aSub && !bSub) return -1;
    if (!aSub && bSub) return 1;

    return a.localeCompare(b);
  });

  return matched.slice(0, maxResults);
}

/**
 * Checks if a turf matches search query or city selection with smart fuzzy & multi-term matching
 */
export function smartMatchTurf(
  turf: { name: string; address: string; city: string; sports?: string[] },
  query: string
): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.toLowerCase().trim();

  // Combine turf text fields for comprehensive matching
  const searchableText = `${turf.name} ${turf.address} ${turf.city} ${(turf.sports || []).join(' ')}`.toLowerCase();

  // Direct substring match
  if (searchableText.includes(rawQuery)) return true;

  // Split query into tokens (e.g. "Jaipur Ajmer" -> ["jaipur", "ajmer"])
  const queryTokens = rawQuery.split(/[\s,+/]+/).filter(t => t.length > 0);

  // If ANY token matches the turf (e.g. "Jaipur Ajmer" matches turfs in Jaipur OR Ajmer)
  return queryTokens.some(qToken => {
    if (searchableText.includes(qToken)) return true;

    // Check city specifically with smartMatchDistrict
    if (smartMatchDistrict(turf.city, qToken)) return true;

    // Check address and name with aliases and fuzzy distance
    const expandedTokens = [qToken, ...(LOCATION_ALIASES[qToken] || [])];
    for (const expToken of expandedTokens) {
      if (searchableText.includes(expToken)) return true;

      // Fuzzy check against words in address/name/city
      const words = searchableText.split(/[\s,+/]+/).filter(w => w.length > 2);
      for (const word of words) {
        const maxDist = expToken.length <= 4 ? 1 : 2;
        if (levenshteinDistance(expToken, word) <= maxDist) {
          return true;
        }
      }
    }

    return false;
  });
}

