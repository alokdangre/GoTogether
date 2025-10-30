"""
Unit tests for the trip matching algorithm.

Tests cover:
- Haversine distance calculation (including edge cases)
- Geohash encoding and neighbor generation
- Trip matching logic with various scenarios
- Performance characteristics
"""

import pytest
import math
from datetime import datetime, timedelta
from app.utils.matching import (
    Location, TripQuery, TripCandidate, TripMatch,
    haversine_distance, encode_geohash, get_geohash_neighbors,
    find_matching_trips, calculate_match_score
)


class TestLocation:
    """Test Location dataclass validation"""
    
    def test_valid_location(self):
        loc = Location(22.253, 84.901)
        assert loc.lat == 22.253
        assert loc.lng == 84.901
    
    def test_invalid_latitude(self):
        with pytest.raises(ValueError, match="Invalid latitude"):
            Location(91.0, 84.901)
        
        with pytest.raises(ValueError, match="Invalid latitude"):
            Location(-91.0, 84.901)
    
    def test_invalid_longitude(self):
        with pytest.raises(ValueError, match="Invalid longitude"):
            Location(22.253, 181.0)
        
        with pytest.raises(ValueError, match="Invalid longitude"):
            Location(22.253, -181.0)


class TestHaversineDistance:
    """Test Haversine distance calculation"""
    
    def test_same_location(self):
        """Distance between same location should be 0"""
        loc = Location(22.253, 84.901)
        distance = haversine_distance(loc, loc)
        assert distance == 0.0
    
    def test_known_distance(self):
        """Test with known distance between NIT Rourkela locations"""
        nit_gate = Location(22.253, 84.901)
        railway_station = Location(22.270, 84.900)
        distance = haversine_distance(nit_gate, railway_station)
        
        # Expected distance is approximately 1.9 km
        assert 1.8 <= distance <= 2.0
    
    def test_antipodal_points(self):
        """Test with points on opposite sides of Earth"""
        loc1 = Location(0.0, 0.0)  # Equator, Prime Meridian
        loc2 = Location(0.0, 180.0)  # Equator, International Date Line
        distance = haversine_distance(loc1, loc2)
        
        # Half of Earth's circumference ≈ 20,015 km
        assert 20000 <= distance <= 20100
    
    def test_north_south_distance(self):
        """Test distance along meridian"""
        north = Location(1.0, 0.0)
        south = Location(0.0, 0.0)
        distance = haversine_distance(north, south)
        
        # 1 degree latitude ≈ 111 km
        assert 110 <= distance <= 112
    
    def test_east_west_distance_at_equator(self):
        """Test distance along equator"""
        west = Location(0.0, 0.0)
        east = Location(0.0, 1.0)
        distance = haversine_distance(west, east)
        
        # 1 degree longitude at equator ≈ 111 km
        assert 110 <= distance <= 112


class TestGeohash:
    """Test geohash encoding and operations"""
    
    def test_encode_geohash(self):
        """Test geohash encoding"""
        loc = Location(22.253, 84.901)
        geohash = encode_geohash(loc, precision=7)
        
        assert isinstance(geohash, str)
        assert len(geohash) == 7
    
    def test_geohash_precision(self):
        """Test different precision levels"""
        loc = Location(22.253, 84.901)
        
        hash5 = encode_geohash(loc, precision=5)
        hash6 = encode_geohash(loc, precision=6)
        hash7 = encode_geohash(loc, precision=7)
        
        assert len(hash5) == 5
        assert len(hash6) == 6
        assert len(hash7) == 7
        
        # Higher precision should be prefix of lower precision
        assert hash7.startswith(hash6)
        assert hash6.startswith(hash5)
    
    def test_nearby_locations_similar_geohash(self):
        """Nearby locations should have similar geohashes"""
        loc1 = Location(22.253, 84.901)
        loc2 = Location(22.254, 84.902)  # Very close
        
        hash1 = encode_geohash(loc1, precision=6)
        hash2 = encode_geohash(loc2, precision=6)
        
        # Should share at least first 4-5 characters
        common_prefix = 0
        for i in range(min(len(hash1), len(hash2))):
            if hash1[i] == hash2[i]:
                common_prefix += 1
            else:
                break
        
        assert common_prefix >= 4
    
    def test_get_geohash_neighbors(self):
        """Test geohash neighbor generation"""
        geohash = "tuvz15k"
        neighbors = get_geohash_neighbors(geohash)
        
        assert isinstance(neighbors, list)
        assert len(neighbors) >= 1  # At least the original
        assert geohash in neighbors
        
        # Should have up to 9 neighbors (8 + original)
        assert len(neighbors) <= 9


class TestMatchingAlgorithm:
    """Test trip matching algorithm"""
    
    def setup_method(self):
        """Set up test data"""
        self.base_time = datetime(2025, 11, 5, 8, 0, 0)
        
        # Base locations (NIT Rourkela area)
        self.nit_gate = Location(22.253, 84.901)
        self.railway_station = Location(22.270, 84.900)
        
        # Test query
        self.query = TripQuery(
            origin=self.nit_gate,
            destination=self.railway_station,
            departure_time=self.base_time,
            max_origin_distance=2.0,
            max_dest_distance=3.0,
            time_window_minutes=15
        )
    
    def test_perfect_match(self):
        """Test perfect match scenario"""
        candidate = TripCandidate(
            id="perfect-match",
            origin=self.nit_gate,  # Exact same origin
            destination=self.railway_station,  # Exact same destination
            departure_time=self.base_time,  # Exact same time
            available_seats=2,
            fare_per_person=50.0,
            driver_name="Perfect Driver",
            driver_rating=5.0
        )
        
        matches = find_matching_trips(self.query, [candidate])
        
        assert len(matches) == 1
        match = matches[0]
        assert match.origin_distance == 0.0
        assert match.dest_distance == 0.0
        assert match.time_difference_minutes == 0
        assert match.match_score > 0.9  # Should be very high score
    
    def test_good_match(self):
        """Test good match within acceptable ranges"""
        candidate = TripCandidate(
            id="good-match",
            origin=Location(22.254, 84.902),  # ~150m away
            destination=Location(22.271, 84.901),  # ~150m away
            departure_time=self.base_time + timedelta(minutes=5),  # 5 min later
            available_seats=3,
            fare_per_person=45.0,
            driver_name="Good Driver",
            driver_rating=4.5
        )
        
        matches = find_matching_trips(self.query, [candidate])
        
        assert len(matches) == 1
        match = matches[0]
        assert match.origin_distance < 2.0
        assert match.dest_distance < 3.0
        assert match.time_difference_minutes == 5
        assert 0.5 <= match.match_score <= 1.0
    
    def test_no_match_too_far(self):
        """Test no match when locations are too far"""
        candidate = TripCandidate(
            id="too-far",
            origin=Location(22.300, 84.950),  # Too far from origin
            destination=self.railway_station,
            departure_time=self.base_time,
            available_seats=2,
            fare_per_person=50.0,
            driver_name="Far Driver",
            driver_rating=4.0
        )
        
        matches = find_matching_trips(self.query, [candidate])
        assert len(matches) == 0
    
    def test_no_match_wrong_time(self):
        """Test no match when time is outside window"""
        candidate = TripCandidate(
            id="wrong-time",
            origin=self.nit_gate,
            destination=self.railway_station,
            departure_time=self.base_time + timedelta(minutes=30),  # Too late
            available_seats=2,
            fare_per_person=50.0,
            driver_name="Late Driver",
            driver_rating=4.0
        )
        
        matches = find_matching_trips(self.query, [candidate])
        assert len(matches) == 0
    
    def test_no_match_no_seats(self):
        """Test no match when no available seats"""
        candidate = TripCandidate(
            id="no-seats",
            origin=self.nit_gate,
            destination=self.railway_station,
            departure_time=self.base_time,
            available_seats=0,  # No seats available
            fare_per_person=50.0,
            driver_name="Full Driver",
            driver_rating=4.0
        )
        
        matches = find_matching_trips(self.query, [candidate])
        assert len(matches) == 0
    
    def test_multiple_matches_sorted_by_score(self):
        """Test multiple matches are sorted by score"""
        candidates = [
            TripCandidate(
                id="average-match",
                origin=Location(22.255, 84.903),  # Further away
                destination=Location(22.272, 84.902),  # Further away
                departure_time=self.base_time + timedelta(minutes=10),
                available_seats=2,
                fare_per_person=60.0,
                driver_name="Average Driver",
                driver_rating=3.5
            ),
            TripCandidate(
                id="best-match",
                origin=Location(22.253, 84.901),  # Exact match
                destination=Location(22.270, 84.900),  # Exact match
                departure_time=self.base_time,
                available_seats=3,
                fare_per_person=50.0,
                driver_name="Best Driver",
                driver_rating=5.0
            ),
            TripCandidate(
                id="good-match",
                origin=Location(22.254, 84.902),
                destination=Location(22.271, 84.901),
                departure_time=self.base_time + timedelta(minutes=5),
                available_seats=2,
                fare_per_person=55.0,
                driver_name="Good Driver",
                driver_rating=4.0
            )
        ]
        
        matches = find_matching_trips(self.query, candidates)
        
        assert len(matches) == 3
        
        # Should be sorted by match score (highest first)
        assert matches[0].match_score >= matches[1].match_score
        assert matches[1].match_score >= matches[2].match_score
        
        # Best match should be first
        assert matches[0].candidate.id == "best-match"


class TestMatchScore:
    """Test match score calculation"""
    
    def test_score_range(self):
        """Match score should always be between 0 and 1"""
        query = TripQuery(
            origin=Location(22.253, 84.901),
            destination=Location(22.270, 84.900),
            departure_time=datetime(2025, 11, 5, 8, 0, 0)
        )
        
        candidate = TripCandidate(
            id="test",
            origin=Location(22.254, 84.902),
            destination=Location(22.271, 84.901),
            departure_time=datetime(2025, 11, 5, 8, 5, 0),
            available_seats=2,
            fare_per_person=50.0,
            driver_name="Test Driver",
            driver_rating=4.0
        )
        
        score = calculate_match_score(query, candidate, 0.15, 0.12, 5)
        
        assert 0.0 <= score <= 1.0
    
    def test_perfect_score(self):
        """Perfect match should have high score"""
        query = TripQuery(
            origin=Location(22.253, 84.901),
            destination=Location(22.270, 84.900),
            departure_time=datetime(2025, 11, 5, 8, 0, 0)
        )
        
        candidate = TripCandidate(
            id="perfect",
            origin=Location(22.253, 84.901),  # Same
            destination=Location(22.270, 84.900),  # Same
            departure_time=datetime(2025, 11, 5, 8, 0, 0),  # Same
            available_seats=2,
            fare_per_person=50.0,
            driver_name="Perfect Driver",
            driver_rating=5.0  # Perfect rating
        )
        
        score = calculate_match_score(query, candidate, 0.0, 0.0, 0)
        
        assert score > 0.95  # Should be very high


class TestPerformance:
    """Test performance characteristics"""
    
    def test_large_candidate_list_performance(self):
        """Test performance with large number of candidates"""
        import time
        
        query = TripQuery(
            origin=Location(22.253, 84.901),
            destination=Location(22.270, 84.900),
            departure_time=datetime(2025, 11, 5, 8, 0, 0)
        )
        
        # Generate 1000 candidates
        candidates = []
        for i in range(1000):
            candidate = TripCandidate(
                id=f"candidate-{i}",
                origin=Location(22.253 + (i * 0.001), 84.901 + (i * 0.001)),
                destination=Location(22.270 + (i * 0.001), 84.900 + (i * 0.001)),
                departure_time=datetime(2025, 11, 5, 8, i % 30, 0),
                available_seats=2,
                fare_per_person=50.0 + i,
                driver_name=f"Driver {i}",
                driver_rating=3.0 + (i % 3)
            )
            candidates.append(candidate)
        
        start_time = time.time()
        matches = find_matching_trips(query, candidates)
        end_time = time.time()
        
        # Should complete within reasonable time (< 1 second for 1000 candidates)
        assert end_time - start_time < 1.0
        
        # Should find some matches
        assert len(matches) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
