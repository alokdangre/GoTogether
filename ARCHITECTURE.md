# GoTogether Architecture

## System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Browser   │    │   PWA Client    │
│                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (Nginx/ALB)   │
                    └─────────┬───────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼───────┐ ┌─────────▼───────┐ ┌─────────▼───────┐
│  Frontend       │ │  Backend API    │ │  WebSocket      │
│  (Next.js)      │ │  (FastAPI)      │ │  Server         │
│  Port: 3000     │ │  Port: 8000     │ │  Port: 8000/ws  │
└─────────────────┘ └─────────┬───────┘ └─────────┬───────┘
                              │                   │
                    ┌─────────▼───────┐          │
                    │   Redis Cache   │◄─────────┘
                    │   & Pub/Sub     │
                    │   Port: 6379    │
                    └─────────────────┘
                              │
                    ┌─────────▼───────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │   Port: 5432    │
                    └─────────────────┘
```

## Component Architecture

### Frontend (Next.js)
```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── page.tsx           # Home page with map & search
│   ├── auth/signin/       # Authentication flow
│   ├── trips/create/      # Trip creation form
│   └── trips/[id]/        # Trip details & chat
├── components/            # Reusable UI components
│   ├── Map.tsx           # Interactive map component
│   ├── TripCard.tsx      # Trip display component
│   ├── SearchForm.tsx    # Trip search interface
│   └── Chat.tsx          # Real-time chat component
├── lib/                  # Core utilities
│   ├── api.ts           # API client with axios
│   ├── store.ts         # Zustand state management
│   └── websocket.ts     # WebSocket connection manager
└── types/               # TypeScript definitions
    └── index.ts         # Shared type definitions
```

### Backend (FastAPI)
```
app/
├── main.py              # FastAPI application & WebSocket
├── core/                # Core configuration
│   ├── config.py       # Environment settings
│   ├── database.py     # Database connection
│   ├── redis.py        # Redis connection
│   └── auth.py         # Authentication utilities
├── models/              # SQLAlchemy ORM models
│   ├── user.py         # User model
│   ├── trip.py         # Trip & TripMember models
│   ├── payment.py      # Payment & PaymentSplit models
│   ├── rating.py       # Rating model
│   └── chat.py         # ChatMessage model
├── routes/              # API endpoints
│   ├── auth.py         # OTP authentication
│   ├── trips.py        # Trip CRUD & search
│   ├── payment.py      # Payment processing
│   └── ratings.py      # Trip ratings
├── schemas/             # Pydantic models
│   └── *.py            # Request/response schemas
└── utils/               # Business logic utilities
    └── matching.py     # Trip matching algorithm
```

## Data Flow

### 1. Trip Search Flow
```
User Input → Frontend → API Request → Geohash Filter → Distance Calculation → Results
    ↓            ↓           ↓             ↓               ↓                ↓
Location    SearchForm   GET /trips/   Database      Haversine        TripMatch[]
Picker      Component    search        Query         Algorithm        Component
```

### 2. Trip Creation Flow
```
User Form → Validation → API Call → Geohash Encoding → Database → WebSocket Notification
    ↓           ↓           ↓            ↓                ↓           ↓
TripForm    Pydantic    POST /trips   Location         Trip        Real-time
Component   Schema      Endpoint      Processing       Creation    Updates
```

### 3. Real-time Chat Flow
```
Message Input → WebSocket → Redis Pub/Sub → Database → Broadcast → UI Update
      ↓             ↓           ↓             ↓           ↓          ↓
Chat Component   Connection   Message       Message     All Trip   Message
                Manager      Queue         Storage     Members    Display
```

## Database Schema

### Core Tables
```sql
-- Users table
users (
    id UUID PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    avatar_url VARCHAR(500),
    rating FLOAT DEFAULT 0.0,
    total_trips INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
trips (
    id UUID PRIMARY KEY,
    driver_id UUID REFERENCES users(id),
    origin_lat FLOAT NOT NULL,
    origin_lng FLOAT NOT NULL,
    origin_geohash VARCHAR(12) NOT NULL, -- Indexed for fast search
    dest_lat FLOAT NOT NULL,
    dest_lng FLOAT NOT NULL,
    dest_geohash VARCHAR(12) NOT NULL,   -- Indexed for fast search
    departure_time TIMESTAMP NOT NULL,   -- Indexed for time queries
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    fare_per_person FLOAT NOT NULL,
    vehicle_type VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trip members table
trip_members (
    id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(id),
    user_id UUID REFERENCES users(id),
    seats_requested INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending',
    joined_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance
```sql
-- Geospatial search indexes
CREATE INDEX idx_trips_origin_geohash ON trips (origin_geohash);
CREATE INDEX idx_trips_dest_geohash ON trips (dest_geohash);

-- Time-based search indexes
CREATE INDEX idx_trips_departure ON trips (departure_time);
CREATE INDEX idx_trips_status ON trips (status);

-- User lookup indexes
CREATE INDEX idx_users_phone ON users (phone);
CREATE INDEX idx_trip_members_trip_user ON trip_members (trip_id, user_id);
```

## Matching Algorithm Details

### Step 1: Geohash Filtering
```python
def get_candidate_trips(origin_lat, origin_lng, dest_lat, dest_lng):
    """
    Fast geospatial filtering using geohash prefix matching
    Time Complexity: O(log n) where n is total trips
    """
    origin_hash = geohash.encode(origin_lat, origin_lng, precision=7)
    dest_hash = geohash.encode(dest_lat, dest_lng, precision=7)
    
    # Get neighboring geohashes to avoid edge cases
    origin_neighbors = get_geohash_neighbors(origin_hash)
    dest_neighbors = get_geohash_neighbors(dest_hash)
    
    # Database query with geohash prefix matching
    candidates = db.query(Trip).filter(
        or_(
            Trip.origin_geohash.like(f"{prefix}%") 
            for prefix in origin_neighbors[:3]  # Limit for performance
        )
    ).all()
    
    return candidates
```

### Step 2: Haversine Distance Calculation
```python
def haversine_distance(lat1, lng1, lat2, lng2):
    """
    Calculate great circle distance between two points
    Time Complexity: O(1)
    Accuracy: ±0.5% for distances < 1000km
    """
    R = 6371  # Earth's radius in kilometers
    
    # Convert to radians
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c
```

### Step 3: Match Scoring
```python
def calculate_match_score(query, candidate):
    """
    Multi-factor scoring algorithm
    Factors: Distance (50%), Time (30%), Driver Rating (20%)
    """
    # Distance score (closer is better)
    max_distance = query.max_origin_distance + query.max_dest_distance
    actual_distance = candidate.origin_distance + candidate.dest_distance
    distance_score = max(0, 1 - (actual_distance / max_distance))
    
    # Time score (closer departure time is better)
    time_score = max(0, 1 - (abs(candidate.time_diff) / query.time_window))
    
    # Driver rating score (higher rating is better)
    rating_score = candidate.driver_rating / 5.0
    
    # Weighted final score
    return (distance_score * 0.5 + time_score * 0.3 + rating_score * 0.2)
```

## Security Architecture

### Authentication Flow
```
1. User enters phone number
2. Backend generates OTP and stores in Redis (5min TTL)
3. OTP sent via SMS (mocked in development)
4. User enters OTP for verification
5. Backend validates OTP and generates JWT token
6. JWT token used for subsequent API requests
7. Token refresh handled automatically by frontend
```

### Security Measures
- **Rate Limiting**: 5 OTP requests per phone per hour
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CORS**: Configured allowed origins
- **JWT Security**: Short-lived tokens with secure signing

## Scalability Considerations

### Horizontal Scaling
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Frontend 1  │    │ Frontend 2  │    │ Frontend N  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
              ┌─────────────────┐
              │ Load Balancer   │
              └─────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Backend 1   │    │ Backend 2   │    │ Backend N   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
              ┌─────────────────┐
              │ Redis Cluster   │
              └─────────────────┘
                           │
              ┌─────────────────┐
              │ PostgreSQL      │
              │ (Read Replicas) │
              └─────────────────┘
```

### Performance Optimizations
1. **Database Indexing**: Geohash and time-based indexes
2. **Redis Caching**: Frequent queries cached for 5 minutes
3. **Connection Pooling**: Database connection reuse
4. **CDN**: Static assets served from edge locations
5. **Image Optimization**: Next.js automatic image optimization
6. **Code Splitting**: Dynamic imports for large components

### Monitoring & Observability
```
Application Metrics → Prometheus → Grafana Dashboard
                 ↓
Error Tracking → Sentry → Alert Manager
                 ↓
Logs → ELK Stack → Kibana Visualization
                 ↓
Traces → Jaeger → Distributed Tracing
```

## Deployment Architecture

### Development Environment
```
Developer Machine
├── Docker Compose
│   ├── PostgreSQL (5432)
│   ├── Redis (6379)
│   ├── Backend (8000)
│   └── Frontend (3000)
└── Local Development
    ├── Hot Reload
    ├── Debug Mode
    └── Mock Services
```

### Production Environment
```
Cloud Provider (AWS/GCP/Azure)
├── Container Orchestration (Kubernetes/ECS)
│   ├── Frontend Pods (3 replicas)
│   ├── Backend Pods (5 replicas)
│   └── WebSocket Pods (3 replicas)
├── Managed Database (RDS/Cloud SQL)
├── Managed Cache (ElastiCache/MemoryStore)
├── Load Balancer (ALB/Cloud Load Balancer)
├── CDN (CloudFront/Cloud CDN)
└── Monitoring (CloudWatch/Stackdriver)
```

## API Design Principles

### RESTful Design
- **Resource-based URLs**: `/api/trips/{id}`
- **HTTP Methods**: GET, POST, PATCH, DELETE
- **Status Codes**: Proper HTTP status codes
- **Pagination**: Cursor-based pagination for large datasets
- **Versioning**: URL versioning (`/api/v1/`)

### Error Handling
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid trip data provided",
  "details": {
    "field": "departure_time",
    "code": "FUTURE_TIME_REQUIRED"
  },
  "timestamp": "2025-11-05T08:00:00Z"
}
```

### Response Format
```json
{
  "data": {
    "trips": [...],
    "total": 25,
    "has_more": true
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_pages": 3
  }
}
```

This architecture provides a solid foundation for a scalable, maintainable, and performant ride-sharing application with room for future enhancements and optimizations.
