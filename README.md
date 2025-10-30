# GoTogether 🚗

**Share Rides, Split Costs, Travel Smart**

GoTogether is a modern travel-sharing PWA focused on short, local auto/car trips where people share rides and split costs. Built with FastAPI, Next.js, and intelligent route matching algorithms.

[![CI/CD Pipeline](https://github.com/yourusername/GoTogether/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/yourusername/GoTogether/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

## 🌟 Features

### Core Functionality
- **Intelligent Matching**: Geohash + Haversine distance algorithm for precise route matching
- **Real-time Chat**: WebSocket-powered communication between trip participants
- **Payment Integration**: Automated fare splitting with Razorpay (India) and Stripe (Global)
- **Mobile-First Design**: PWA with offline capabilities and responsive UI
- **OTP Authentication**: Secure phone-based authentication with JWT sessions

### Technical Highlights
- **Fast Search**: Sub-second trip matching with geospatial indexing
- **Scalable Architecture**: Microservices-ready with Docker containerization
- **Type Safety**: Full TypeScript frontend with Pydantic backend validation
- **Production Ready**: Comprehensive testing, CI/CD, and monitoring setup

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)
- Make (optional, for convenience commands)

### 1. Clone & Setup
```bash
git clone https://github.com/yourusername/GoTogether.git
cd GoTogether
cp .env.example .env
```

### 2. Start with Docker (Recommended)
```bash
# Start all services
make docker-up

# Or manually
docker-compose up -d

# Run migrations
make migrate

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 3. Local Development
```bash
# Install dependencies
make install

# Start development servers
make dev

# Or start individually
make backend-dev  # Backend on :8000
make frontend-dev # Frontend on :3000
```

## 📁 Project Structure

```
GoTogether/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Configuration, database, auth
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routes/         # API endpoints
│   │   ├── schemas/        # Pydantic schemas
│   │   └── utils/          # Utilities (matching algorithm)
│   ├── tests/              # Backend tests
│   ├── alembic/            # Database migrations
│   └── requirements.txt
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/          # API client, store
│   │   └── types/        # TypeScript definitions
│   └── package.json
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Development environment
├── Makefile               # Development commands
└── README.md
```

## 🔧 Development

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Backend
DATABASE_URL=postgresql://gotogether:password@localhost:5432/gotogether
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-change-in-production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
```

### Available Commands
```bash
# Development
make dev              # Start all development servers
make backend-dev      # Start backend only
make frontend-dev     # Start frontend only

# Database
make migrate          # Run migrations
make migrate-create   # Create new migration
make seed            # Seed with sample data
make db-reset        # Reset database

# Testing
make test            # Run all tests
make test-backend    # Backend tests only
make test-frontend   # Frontend tests only

# Docker
make docker-up       # Start all services
make docker-down     # Stop all services
make docker-logs     # View logs

# Maintenance
make clean           # Clean build artifacts
make lint            # Run linters
make format          # Format code
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
npm run e2e  # End-to-end tests
```

### Test Coverage
- Backend: Unit tests for matching algorithm, API endpoints, and business logic
- Frontend: Component tests and integration tests
- E2E: Critical user flows (search, create trip, join, payment)

## 🔍 API Documentation

### Core Endpoints
- `POST /api/auth/otp` - Send OTP for authentication
- `POST /api/auth/verify` - Verify OTP and get JWT token
- `POST /api/trips` - Create a new trip
- `GET /api/trips/search` - Search for matching trips
- `POST /api/trips/{id}/join` - Join a trip
- `POST /api/payment/split` - Create payment split
- `WS /ws/trips/{id}/chat` - WebSocket chat

### Interactive API Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI Spec: [api-spec.yaml](./api-spec.yaml)

## 🧮 Matching Algorithm

GoTogether uses a sophisticated 2-step matching algorithm:

### Step 1: Geohash Filtering
```python
# Encode locations to geohash (precision 7 ≈ 150m)
origin_hash = geohash.encode(lat, lng, precision=7)
dest_hash = geohash.encode(lat, lng, precision=7)

# Fast prefix matching in database
candidates = trips.filter(
    origin_geohash.startswith(origin_hash[:6])
)
```

### Step 2: Haversine Distance
```python
def haversine_distance(loc1, loc2):
    # Calculate great circle distance
    # Accept if:
    # - Origin distance ≤ 2km
    # - Destination distance ≤ 3km  
    # - Time difference ≤ 15 minutes
```

**Performance**: O(log n) for geohash lookup + O(k) for distance filtering
**Accuracy**: Sub-meter precision with configurable tolerance

## 💳 Payment Integration

### Razorpay (India)
```javascript
// Automatic fare splitting
const totalFare = 100; // INR
const participants = 4;
const sharePerPerson = totalFare / participants; // ₹25 each
```

### Stripe (Global)
```javascript
// Multi-currency support
const payment = await stripe.paymentIntents.create({
  amount: sharePerPerson * 100, // cents
  currency: 'usd',
  automatic_payment_methods: { enabled: true }
});
```

## 🚀 Deployment

### Production Environment Variables
```bash
# Security
SECRET_KEY=your-256-bit-secret-key
OTP_MOCK_ENABLED=false

# Database (managed service recommended)
DATABASE_URL=postgresql://user:pass@host:5432/gotogether
REDIS_URL=redis://user:pass@host:6379

# Payment Gateways
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
STRIPE_SECRET_KEY=sk_live_...

# Maps
GOOGLE_MAPS_API_KEY=...
MAPBOX_ACCESS_TOKEN=...
```

### Deployment Options

#### 1. Vercel + Railway (Recommended for MVP)
```bash
# Frontend to Vercel
cd frontend && vercel --prod

# Backend to Railway
cd backend && railway up
```

#### 2. Docker Swarm
```bash
docker stack deploy -c docker-compose.prod.yml gotogether
```

#### 3. Kubernetes
```bash
kubectl apply -f k8s/
```

#### 4. Manual VPS
```bash
# Build and deploy
make build
scp -r . user@server:/app/
ssh user@server "cd /app && docker-compose -f docker-compose.prod.yml up -d"
```

## 📊 Monitoring & Analytics

### Health Checks
- Backend: `GET /health`
- Database: Connection pooling with health checks
- Redis: Memory usage and connection monitoring

### Metrics (Production Setup)
- **Performance**: Response times, throughput
- **Business**: Trip completion rate, user retention
- **Technical**: Error rates, database performance

### Logging
```python
# Structured logging with correlation IDs
logger.info("Trip created", extra={
    "trip_id": trip.id,
    "user_id": user.id,
    "route": f"{origin} -> {destination}"
})
```

## 🔒 Security

### Authentication
- OTP-based phone verification
- JWT tokens with configurable expiration
- Rate limiting on sensitive endpoints

### Data Protection
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- XSS protection with Content Security Policy

### Production Hardening
```python
# Rate limiting
@limiter.limit("5 per minute")
def send_otp():
    pass

# Input sanitization
class TripCreate(BaseModel):
    origin_lat: float = Field(..., ge=-90, le=90)
    fare_per_person: float = Field(..., gt=0)
```

## 🌍 Localization

### India-First Approach
- Default currency: INR (₹)
- Phone format: +91 country code
- Payment gateway: Razorpay
- Map defaults: Indian cities

### Global Configuration
```python
# Multi-region support
SUPPORTED_COUNTRIES = ["IN", "US", "UK", "CA"]
DEFAULT_CURRENCY = "INR"
PAYMENT_GATEWAYS = {
    "IN": "razorpay",
    "default": "stripe"
}
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run tests: `make test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Create Pull Request

### Code Standards
- **Backend**: Black formatting, isort imports, type hints
- **Frontend**: ESLint, Prettier, TypeScript strict mode
- **Tests**: Minimum 80% coverage required
- **Documentation**: Update README for new features

### Commit Convention
```
feat: add trip rating system
fix: resolve payment webhook timeout
docs: update API documentation
test: add matching algorithm edge cases
```

## 📈 Roadmap

### Phase 1 (MVP) ✅
- [x] Core trip CRUD operations
- [x] Matching algorithm implementation
- [x] Basic payment integration
- [x] WebSocket chat
- [x] Mobile-responsive UI

### Phase 2 (Enhanced Features)
- [ ] Push notifications
- [ ] Advanced filters (vehicle type, rating)
- [ ] Trip history and analytics
- [ ] Driver verification system
- [ ] Multi-language support

### Phase 3 (Scale & Optimize)
- [ ] Machine learning for better matching
- [ ] Real-time location tracking
- [ ] Integration with public transport
- [ ] Carbon footprint tracking
- [ ] Social features and gamification

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Reset database
make db-reset
```

#### Frontend Build Errors
```bash
# Clear Next.js cache
cd frontend && rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### WebSocket Connection Issues
```bash
# Check Redis connection
docker-compose logs redis

# Verify WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:8000/ws/trips/test/chat
```

### Performance Optimization

#### Database
```sql
-- Add indexes for better query performance
CREATE INDEX idx_trips_geohash ON trips (origin_geohash, dest_geohash);
CREATE INDEX idx_trips_departure ON trips (departure_time);
```

#### Caching
```python
# Redis caching for frequent queries
@cache.cached(timeout=300)
def get_popular_routes():
    return db.query(Trip).filter(...).all()
```

## 📞 Support

### Documentation
- [API Documentation](./api-spec.yaml)
- [Architecture Guide](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)

### Community
- GitHub Issues: Bug reports and feature requests
- Discussions: Architecture and implementation questions
- Wiki: Community-contributed guides and tutorials

### Commercial Support
For enterprise deployments and custom features:
- Email: support@gotogether.app
- Documentation: [Enterprise Guide](./docs/enterprise.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI**: Modern, fast web framework for building APIs
- **Next.js**: React framework for production-grade applications
- **Mapbox/Google Maps**: Geospatial services and mapping
- **Razorpay/Stripe**: Payment processing infrastructure
- **PostgreSQL**: Reliable, feature-rich database
- **Redis**: High-performance caching and pub/sub

---

**Built with ❤️ for sustainable urban mobility**

*GoTogether - Making shared transportation accessible, affordable, and social.*
