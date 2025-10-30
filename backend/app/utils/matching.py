"""
Trip matching algorithm using geohash and haversine distance calculation.

This module implements the core matching logic for GoTogether:
1. Geohash encoding for fast spatial indexing (precision 7 ≈ 150m)
2. Haversine distance calculation for exact distance measurement
3. Route similarity scoring based on origin/destination proximity

Time Complexity: O(log n) for geohash prefix matching + O(k) for distance filtering
where n is total trips and k is candidates from geohash match.
"""

import math
import geohash2
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class Location:
    """Represents a geographic location with latitude and longitude."""
    lat: float
    lng: float
    
    def __post_init__(self):
        """Validate coordinates are within valid ranges."""
        if not (-90 <= self.lat <= 90):
            raise ValueError(f"Invalid latitude: {self.lat}. Must be between -90 and 90.")
        if not (-180 <= self.lng <= 180):
            raise ValueError(f"Invalid longitude: {self.lng}. Must be between -180 and 180.")


@dataclass
class TripQuery:
    """Represents a trip search query with origin, destination, and time constraints."""
    origin: Location
    destination: Location
    departure_time: datetime
    max_origin_distance: float = 2.0  # km
    max_dest_distance: float = 3.0    # km
    time_window_minutes: int = 15


@dataclass
class TripCandidate:
    """Represents a candidate trip for matching."""
    id: str
    origin: Location
    destination: Location
    departure_time: datetime
    available_seats: int
    fare_per_person: float
    driver_name: str
    driver_rating: float


@dataclass
class TripMatch:
    """Represents a matched trip with similarity scores."""
    candidate: TripCandidate
    origin_distance: float
    dest_distance: float
    time_difference_minutes: int
    match_score: float


def haversine_distance(loc1: Location, loc2: Location) -> float:
    """
    Calculate the great circle distance between two points on Earth using the Haversine formula.
    
    Args:
        loc1: First location
        loc2: Second location
        
    Returns:
        Distance in kilometers
        
    Time Complexity: O(1)
    Space Complexity: O(1)
    
    Note: This formula assumes Earth is a perfect sphere (radius = 6371 km).
    For more accuracy in production, consider using Vincenty's formula or PostGIS functions.
    """
    # Convert decimal degrees to radians
    lat1, lng1, lat2, lng2 = map(math.radians, [loc1.lat, loc1.lng, loc2.lat, loc2.lng])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Earth's radius in kilometers
    earth_radius_km = 6371.0
    
    return earth_radius_km * c


def encode_geohash(location: Location, precision: int = 7) -> str:
    """
    Encode a location into a geohash string.
    
    Args:
        location: Geographic location
        precision: Geohash precision (7 ≈ 150m, 8 ≈ 38m, 9 ≈ 5m)
        
    Returns:
        Geohash string
        
    Precision levels:
    - 5: ±2.4km
    - 6: ±0.6km  
    - 7: ±0.15km (used for matching)
    - 8: ±0.038km
    - 9: ±0.005km
    """
    return geohash2.encode(location.lat, location.lng, precision)


def get_geohash_neighbors(geohash: str) -> List[str]:
    """
    Get all neighboring geohashes for expanded search coverage.
    
    Args:
        geohash: Base geohash string
        
    Returns:
        List of neighboring geohashes including the original
        
    This ensures we don't miss trips that are close but fall into adjacent geohash cells.
    """
    neighbors = []
    try:
        # Get 8 neighbors + original geohash
        neighbors.append(geohash)
        for direction in ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']:
            neighbor = geohash2.neighbors(geohash, direction)
            if neighbor:
                neighbors.append(neighbor)
    except Exception:
        # Fallback to just the original geohash if neighbor calculation fails
        neighbors = [geohash]
    
    return neighbors


def calculate_match_score(
    query: TripQuery,
    candidate: TripCandidate,
    origin_distance: float,
    dest_distance: float,
    time_diff_minutes: int
) -> float:
    """
    Calculate a match score between 0 and 1 based on multiple factors.
    
    Args:
        query: Search query
        candidate: Candidate trip
        origin_distance: Distance between origins (km)
        dest_distance: Distance between destinations (km)
        time_diff_minutes: Time difference in minutes
        
    Returns:
        Match score (0-1, higher is better)
        
    Scoring factors:
    - Distance proximity (50% weight)
    - Time proximity (30% weight)
    - Driver rating (20% weight)
    """
    # Distance score (closer is better)
    max_total_distance = query.max_origin_distance + query.max_dest_distance
    actual_total_distance = origin_distance + dest_distance
    distance_score = max(0, 1 - (actual_total_distance / max_total_distance))
    
    # Time score (closer departure time is better)
    time_score = max(0, 1 - (abs(time_diff_minutes) / query.time_window_minutes))
    
    # Driver rating score (normalized to 0-1)
    rating_score = candidate.driver_rating / 5.0
    
    # Weighted final score
    final_score = (
        distance_score * 0.5 +
        time_score * 0.3 +
        rating_score * 0.2
    )
    
    return min(1.0, max(0.0, final_score))


def find_matching_trips(
    query: TripQuery,
    candidates: List[TripCandidate]
) -> List[TripMatch]:
    """
    Find and rank matching trips based on the query criteria.
    
    Args:
        query: Trip search query
        candidates: List of candidate trips (pre-filtered by geohash)
        
    Returns:
        List of matching trips, sorted by match score (best first)
        
    Algorithm:
    1. Filter candidates by distance constraints
    2. Filter candidates by time window
    3. Calculate match scores
    4. Sort by score descending
    
    Time Complexity: O(k) where k is number of candidates
    """
    matches = []
    
    for candidate in candidates:
        # Skip if no available seats
        if candidate.available_seats <= 0:
            continue
            
        # Calculate distances
        origin_distance = haversine_distance(query.origin, candidate.origin)
        dest_distance = haversine_distance(query.destination, candidate.destination)
        
        # Filter by distance constraints
        if (origin_distance > query.max_origin_distance or 
            dest_distance > query.max_dest_distance):
            continue
            
        # Calculate time difference
        time_diff = abs((candidate.departure_time - query.departure_time).total_seconds() / 60)
        
        # Filter by time window
        if time_diff > query.time_window_minutes:
            continue
            
        # Calculate match score
        match_score = calculate_match_score(
            query, candidate, origin_distance, dest_distance, int(time_diff)
        )
        
        # Create match object
        match = TripMatch(
            candidate=candidate,
            origin_distance=origin_distance,
            dest_distance=dest_distance,
            time_difference_minutes=int(time_diff),
            match_score=match_score
        )
        
        matches.append(match)
    
    # Sort by match score (highest first)
    matches.sort(key=lambda x: x.match_score, reverse=True)
    
    return matches


def get_search_geohashes(query: TripQuery) -> Tuple[List[str], List[str]]:
    """
    Get geohashes for origin and destination with neighbors for comprehensive search.
    
    Args:
        query: Trip search query
        
    Returns:
        Tuple of (origin_geohashes, destination_geohashes)
    """
    origin_geohash = encode_geohash(query.origin)
    dest_geohash = encode_geohash(query.destination)
    
    origin_geohashes = get_geohash_neighbors(origin_geohash)
    dest_geohashes = get_geohash_neighbors(dest_geohash)
    
    return origin_geohashes, dest_geohashes


# Example usage and test data
if __name__ == "__main__":
    # Test with NIT Rourkela coordinates
    nit_gate = Location(22.253, 84.901)
    railway_station = Location(22.270, 84.900)
    
    print(f"Distance between NIT Gate and Railway Station: {haversine_distance(nit_gate, railway_station):.2f} km")
    print(f"NIT Gate geohash: {encode_geohash(nit_gate)}")
    print(f"Railway Station geohash: {encode_geohash(railway_station)}")
    
    # Test query
    query = TripQuery(
        origin=nit_gate,
        destination=railway_station,
        departure_time=datetime(2025, 11, 5, 8, 0, 0)
    )
    
    # Test candidate
    candidate = TripCandidate(
        id="test-trip-1",
        origin=Location(22.254, 84.902),  # Slightly different
        destination=Location(22.271, 84.901),  # Slightly different
        departure_time=datetime(2025, 11, 5, 8, 5, 0),  # 5 minutes later
        available_seats=2,
        fare_per_person=33.33,
        driver_name="Test Driver",
        driver_rating=4.5
    )
    
    matches = find_matching_trips(query, [candidate])
    if matches:
        match = matches[0]
        print(f"\nMatch found:")
        print(f"  Origin distance: {match.origin_distance:.2f} km")
        print(f"  Destination distance: {match.dest_distance:.2f} km")
        print(f"  Time difference: {match.time_difference_minutes} minutes")
        print(f"  Match score: {match.match_score:.2f}")
    else:
        print("\nNo matches found")
