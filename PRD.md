# GoTogether - Product Requirements Document

## Overview

**GoTogether** is a travel-sharing PWA that connects users for short, local auto/car trips, enabling cost-effective ride sharing within cities and college campuses. The platform focuses on matching users with overlapping routes for trips ≤30km.

### Vision
Enable seamless, affordable local transportation by connecting travelers with similar routes, reducing individual travel costs and environmental impact.

### Marketing Pitch
"Split the ride, split the cost! GoTogether connects you with fellow travelers on similar routes, making your daily commute or city trips more affordable and social. Simply set your route, find matches, and travel together."

## User Stories & Acceptance Criteria

### Core User Stories

**US1: Route Matching**
- As a traveler, I want to find rides with similar origin/destination so I can share costs
- **AC**: Search returns matches within 2km origin, 3km destination, 15min time window
- **AC**: Results appear within 1 minute of search

**US2: Trip Creation**
- As a driver, I want to create a trip posting so others can join my ride
- **AC**: Can set origin, destination, departure time, fare, and available seats
- **AC**: Trip is immediately searchable by other users

**US3: Trip Joining**
- As a passenger, I want to join available trips so I can share the ride
- **AC**: Can request to join trips with available seats
- **AC**: Driver can approve/reject join requests

**US4: Payment Splitting**
- As a user, I want automated fare splitting so payment is transparent
- **AC**: Total fare divided equally among confirmed participants
- **AC**: Payment ledger shows consistent calculations

**US5: Real-time Communication**
- As a trip participant, I want to chat with other members for coordination
- **AC**: WebSocket chat works for all trip participants
- **AC**: Last 100 messages are persisted and retrievable

**US6: Secure Authentication**
- As a user, I want secure phone-based login so my account is protected
- **AC**: OTP verification works end-to-end (mocked in dev)
- **AC**: JWT sessions maintain login state

## Metrics & Success Criteria

### Key Metrics
- **Matching Success Rate**: >70% of searches return ≥1 relevant match
- **Trip Completion Rate**: >80% of joined trips are completed
- **User Retention**: >40% weekly active users return
- **Payment Success**: >95% of payment splits process without errors

### Technical Performance
- Search response time: <1 second
- WebSocket message delivery: <500ms
- App load time: <3 seconds on 3G
- Uptime: >99.5%

## Technical Architecture

### Core Components
1. **Matching Engine**: Geohash + Haversine distance calculation
2. **Real-time Layer**: WebSocket chat with Redis pub/sub
3. **Payment System**: Razorpay (India) + Stripe (global) integration
4. **Authentication**: OTP + JWT token management
5. **Geospatial**: PostGIS for location queries (optional)

### Matching Algorithm
```
1. Encode origin/destination to geohash (precision 7)
2. Query candidates by geohash prefix match
3. Filter by Haversine distance:
   - Origin distance ≤ 2km
   - Destination distance ≤ 3km
   - Time difference ≤ 15 minutes
```

## Timeline & Milestones

### Phase 1 (Weeks 1-2): MVP
- [ ] Core trip CRUD operations
- [ ] Basic matching algorithm
- [ ] Simple map interface
- [ ] OTP authentication
- [ ] Local development setup

### Phase 2 (Weeks 3-4): Enhanced Features
- [ ] WebSocket chat
- [ ] Payment integration
- [ ] Rating system
- [ ] Mobile-optimized UI
- [ ] Basic deployment

### Phase 3 (Weeks 5-6): Production Ready
- [ ] Performance optimization
- [ ] Security hardening
- [ ] CI/CD pipeline
- [ ] Monitoring & analytics
- [ ] Production deployment

## Non-Goals (v1)

- Integration with Uber/Ola/third-party platforms
- Long-distance intercity trips
- Driver verification/background checks
- Advanced fraud detection
- Multi-language support
- iOS/Android native apps

## Regional Considerations

### India-First Approach
- Default payment: Razorpay integration
- Currency: INR with ₹ symbol
- Phone format: +91 country code
- Map defaults: Indian cities
- Time zone: IST (UTC+5:30)

### Global Configurability
- Stripe payment fallback
- Multi-currency support
- Configurable country codes
- Localized map providers

## Risk Mitigation

### Technical Risks
- **Geolocation accuracy**: Implement fallback to manual address entry
- **Real-time scaling**: Use Redis clustering for high concurrency
- **Payment failures**: Implement retry logic and manual reconciliation

### Business Risks
- **Low adoption**: Start with college campuses for concentrated user base
- **Safety concerns**: Implement basic rating system and trip history
- **Regulatory compliance**: Research local transportation regulations

## App Store Descriptions

### Variant 1 (Functional)
"GoTogether - Share rides, split costs! Find travelers with similar routes for your daily commute or city trips. Create or join rides, chat with fellow passengers, and save money on transportation. Perfect for college students and city commuters."

### Variant 2 (Social)
"Turn your daily travel into a social experience! GoTogether connects you with like-minded travelers heading your way. Share the journey, share the cost, and make new connections while reducing your carbon footprint."

### Variant 3 (Economic)
"Smart travel, smart savings! GoTogether helps you find ride-sharing opportunities on your regular routes. Split fuel costs, reduce traffic, and travel affordably with our intelligent matching system."
