export interface DemoTurfSeed {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerPaymentQrUrl?: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  distanceKm: number;
  sports: string[];
  isIndoor: boolean;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  images: string[];
  facilities: string[];
  isUnposted: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  isTopRated?: boolean;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export const DEMO_OWNERS = [
  {
    id: 'owner-kickoff',
    name: 'Vikram Malhotra',
    email: 'vikram@kickoffturfs.com',
    role: 'owner' as const,
    businessName: 'KickOff Sports Arena Ltd.',
    phone: '+91 98200 12345',
    isVerified: true,
  },
  {
    id: 'owner-skyline',
    name: 'Rahul Sharma',
    email: 'rahul@skylineturfs.com',
    role: 'owner' as const,
    businessName: 'Skyline Turf & Sports Club',
    phone: '+91 98450 67890',
    isVerified: true,
  },
  {
    id: 'owner-smashpoint',
    name: 'Ananya Desai',
    email: 'ananya@smashpoint.com',
    role: 'owner' as const,
    businessName: 'SmashPoint Racquet Sports',
    phone: '+91 98110 54321',
    isVerified: true,
  },
  {
    id: 'owner-ace',
    name: 'Suresh Reddy',
    email: 'suresh@acetennis.com',
    role: 'owner' as const,
    businessName: 'Ace Sports Academy',
    phone: '+91 99490 11223',
    isVerified: true,
  }
];

export const DEMO_TURFS: DemoTurfSeed[] = [
  {
    id: 'turf-kickoff-mumbai',
    ownerId: 'owner-kickoff',
    ownerName: 'Vikram Malhotra',
    ownerPhone: '+91 98200 12345',
    name: 'KickOff Arena & Sports Hub',
    tagline: 'FIFA-grade 5G synthetic turf for Football & Box Cricket',
    description: 'Premier rooftop sports arena in the heart of Bandra. Features ultra-cushioned FIFA-certified synthetic turf, high-intensity LED floodlights, professional dugout seating, and changing rooms with hot showers. Ideal for corporate tournaments and weekend matches.',
    address: '4th Floor, Skyline Mall, Linking Road, Bandra West',
    city: 'Mumbai',
    distanceKm: 2.4,
    sports: ['Football', 'Cricket', 'Futsal'],
    isIndoor: false,
    rating: 4.9,
    reviewCount: 142,
    pricePerHour: 1400,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529900245534-47fbf565131e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'
    ],
    facilities: ['Floodlights', 'Parking', 'Washrooms', 'Cafeteria', 'Changing Rooms'],
    isUnposted: false,
    isFeatured: true,
    isPopular: true,
    isTopRated: true,
    latitude: 19.0596,
    longitude: 72.8295,
    createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'turf-skyline-bengaluru',
    ownerId: 'owner-skyline',
    ownerName: 'Rahul Sharma',
    ownerPhone: '+91 98450 67890',
    name: 'Skyline Box Cricket & Football Turf',
    tagline: 'High-netted box cricket arena with dual-color boundary marking',
    description: 'Spacious dual-pitch arena tailored for fast-paced 7v7 Box Cricket and 6v6 Futsal. Equipped with stadium-grade perimeter netting, live scoring digital display, hydration coolers, and an on-site cafe serving post-game smoothies.',
    address: '80 Feet Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    distanceKm: 3.1,
    sports: ['Cricket', 'Football', 'Futsal'],
    isIndoor: false,
    rating: 4.8,
    reviewCount: 98,
    pricePerHour: 1600,
    images: [
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563299796-17596ed6b017?w=800&auto=format&fit=crop&q=80'
    ],
    facilities: ['Floodlights', 'Parking', 'Washrooms', 'Cafeteria', 'Changing Rooms'],
    isUnposted: false,
    isFeatured: true,
    isPopular: true,
    isTopRated: true,
    latitude: 12.9352,
    longitude: 77.6245,
    createdAt: '2026-01-15T12:30:00.000Z'
  },
  {
    id: 'turf-smashpoint-delhi',
    ownerId: 'owner-smashpoint',
    ownerName: 'Ananya Desai',
    ownerPhone: '+91 98110 54321',
    name: 'SmashPoint Indoor Badminton & Pickleball Arena',
    tagline: 'BWF-standard synthetic wooden courts with central AC',
    description: 'Delhi’s premier indoor racquet hub offering 4 BWF-approved badminton courts and 2 dedicated USA Pickleball-regulation courts. Fully climate-controlled with glare-free overhead LED diffusers and professional racket stringing desk.',
    address: 'Near Metro Pillar 140, South Extension Part II',
    city: 'Delhi',
    distanceKm: 4.5,
    sports: ['Badminton', 'Pickleball', 'Table Tennis'],
    isIndoor: true,
    rating: 4.9,
    reviewCount: 115,
    pricePerHour: 950,
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=80'
    ],
    facilities: ['AC', 'Washrooms', 'Changing Rooms', 'Parking', 'Cafeteria'],
    isUnposted: false,
    isFeatured: true,
    isPopular: true,
    isTopRated: true,
    latitude: 28.5684,
    longitude: 77.2217,
    createdAt: '2026-02-01T09:00:00.000Z'
  },
  {
    id: 'turf-ace-hyderabad',
    ownerId: 'owner-ace',
    ownerName: 'Suresh Reddy',
    ownerPhone: '+91 99490 11223',
    name: 'Ace Tennis & Basketball Multi-Arena',
    tagline: 'Cushioned 8-layer acrylic courts for Tennis & Basketball',
    description: 'Olympic-grade multi-sport facility in Gachibowli with 3 synthetic tennis courts and 2 FIBA-certified basketball courts. Features automated ball machines for tennis practice and spectator bleachers.',
    address: 'Financial District, Near Wave Rock, Gachibowli',
    city: 'Hyderabad',
    distanceKm: 5.2,
    sports: ['Tennis', 'Basketball', 'Pickleball'],
    isIndoor: false,
    rating: 4.8,
    reviewCount: 88,
    pricePerHour: 1200,
    images: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=80'
    ],
    facilities: ['Floodlights', 'Parking', 'Washrooms', 'Cafeteria', 'Changing Rooms'],
    isUnposted: false,
    isFeatured: false,
    isPopular: true,
    isTopRated: true,
    latitude: 17.4198,
    longitude: 78.3489,
    createdAt: '2026-02-10T14:15:00.000Z'
  },
  {
    id: 'turf-greenfield-pune',
    ownerId: 'owner-kickoff',
    ownerName: 'Vikram Malhotra',
    ownerPhone: '+91 98200 12345',
    name: 'GreenField Sports Park & Turf',
    tagline: 'All-weather monofilament turf with 360-degree rebound netting',
    description: 'Sprawling outdoor turf complex offering 8-a-side football and multi-wicket box cricket. Premium rubber infill ensures maximum joint protection and natural ball bounce. Complete with a covered spectators lounge.',
    address: 'Near Gandhi National Memorial, Paud Road, Kothrud',
    city: 'Pune',
    distanceKm: 3.8,
    sports: ['Football', 'Cricket', 'Futsal'],
    isIndoor: false,
    rating: 4.7,
    reviewCount: 64,
    pricePerHour: 1100,
    images: [
      'https://images.unsplash.com/photo-1529900245534-47fbf565131e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80'
    ],
    facilities: ['Floodlights', 'Parking', 'Washrooms', 'Changing Rooms'],
    isUnposted: false,
    isFeatured: false,
    isPopular: true,
    isTopRated: false,
    latitude: 18.5074,
    longitude: 73.8077,
    createdAt: '2026-02-18T16:00:00.000Z'
  },
  {
    id: 'turf-hoopnation-chennai',
    ownerId: 'owner-ace',
    ownerName: 'Suresh Reddy',
    ownerPhone: '+91 99490 11223',
    name: 'The Hoop Nation Arena',
    tagline: 'Outdoor acrylic basketball & pro volleyball court',
    description: 'High-energy outdoor court designed specifically for basketball and volleyball leagues. Features breakout zones, spring-loaded basketball hoops, volleyball net tensioners, and shaded dugouts.',
    address: 'Rajiv Gandhi Salai, Sholinganallur, OMR',
    city: 'Chennai',
    distanceKm: 6.0,
    sports: ['Basketball', 'Volleyball'],
    isIndoor: false,
    rating: 4.7,
    reviewCount: 52,
    pricePerHour: 1000,
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80'
    ],
    facilities: ['Floodlights', 'Parking', 'Washrooms', 'Cafeteria'],
    isUnposted: false,
    isFeatured: false,
    isPopular: false,
    isTopRated: false,
    latitude: 12.9010,
    longitude: 80.2279,
    createdAt: '2026-03-01T11:00:00.000Z'
  },
  {
    id: 'turf-proshuttle-ahmedabad',
    ownerId: 'owner-smashpoint',
    ownerName: 'Ananya Desai',
    ownerPhone: '+91 98110 54321',
    name: 'ProShuttle Badminton & Squash Club',
    tagline: 'Air-conditioned wooden badminton & WSF certified squash arena',
    description: 'State-of-the-art climate-controlled racquet club with 5 hardwood badminton courts and 2 glass-backed squash courts. Professional coaching programs and equipment rentals available on-site.',
    address: 'Near Iscon Cross Road, SG Highway, Bodakdev',
    city: 'Ahmedabad',
    distanceKm: 4.1,
    sports: ['Badminton', 'Squash', 'Table Tennis'],
    isIndoor: true,
    rating: 4.9,
    reviewCount: 94,
    pricePerHour: 850,
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=80'
    ],
    facilities: ['AC', 'Washrooms', 'Changing Rooms', 'Parking', 'Cafeteria'],
    isUnposted: false,
    isFeatured: true,
    isPopular: true,
    isTopRated: true,
    latitude: 23.0338,
    longitude: 72.5089,
    createdAt: '2026-03-10T10:00:00.000Z'
  },
  {
    id: 'turf-champions-kolkata',
    ownerId: 'owner-skyline',
    ownerName: 'Rahul Sharma',
    ownerPhone: '+91 98450 67890',
    name: 'Champions Arena & Turf Ground',
    tagline: 'Floodlit artificial turf for 7-a-side Football & Cricket',
    description: 'Premier sports destination in Salt Lake Sector V featuring 2 interconnected pitches suitable for large corporate matches or individual team practice. High-wattage LED lights make evening and night games crystal clear.',
    address: 'Block EP & GP, Sector V, Bidhannagar',
    city: 'Kolkata',
    distanceKm: 3.5,
    sports: ['Football', 'Cricket', 'Futsal'],
    isIndoor: false,
    rating: 4.8,
    reviewCount: 76,
    pricePerHour: 1300,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529900245534-47fbf565131e?w=800&auto=format&fit=crop&q=80'
    ],
    facilities: ['Floodlights', 'Parking', 'Washrooms', 'Cafeteria', 'Changing Rooms'],
    isUnposted: false,
    isFeatured: false,
    isPopular: true,
    isTopRated: true,
    latitude: 22.5804,
    longitude: 88.4378,
    createdAt: '2026-03-15T15:00:00.000Z'
  }
];

export const DEMO_REVIEWS = [
  {
    id: 'rev-1',
    turfId: 'turf-kickoff-mumbai',
    userId: 'usr-1786809352844',
    userName: 'Karan Patel',
    rating: 5,
    comment: 'Top notch turf quality! The grip on the 5G grass is unreal and floodlights make night games effortless.',
    createdAt: '2026-07-20T18:30:00.000Z'
  },
  {
    id: 'rev-2',
    turfId: 'turf-kickoff-mumbai',
    userId: 'usr-admin',
    userName: 'Rohan Sen',
    rating: 5,
    comment: 'Great management and very clean changing rooms. Will definitely book again for our weekend football club.',
    createdAt: '2026-08-01T20:15:00.000Z'
  },
  {
    id: 'rev-3',
    turfId: 'turf-skyline-bengaluru',
    userId: 'usr-1786809352844',
    userName: 'Pranav Nair',
    rating: 5,
    comment: 'Best box cricket experience in Koramangala! Perfect net height and the boundary ropes are well padded.',
    createdAt: '2026-08-05T19:00:00.000Z'
  },
  {
    id: 'rev-4',
    turfId: 'turf-smashpoint-delhi',
    userId: 'usr-1786809352844',
    userName: 'Megha Singhania',
    rating: 5,
    comment: 'Clean courts, cold AC, and great lighting. Perfect for summer badminton sessions in Delhi.',
    createdAt: '2026-08-10T17:45:00.000Z'
  }
];
