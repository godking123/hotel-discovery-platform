// Real Seattle hotel data from JSON
export interface Hotel {
  hotel_id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  star_rating: number;
  price_per_night: number | string;
  currency: string;
  rating: number;
  review_count: number;
  image_url: string;
  room_type: string;
  amenities: string[];
  free_cancellation?: boolean;
}

// Import the real hotel data
import hotelData from "./seattle_hotel_data.json";

export const seattleHotels: Hotel[] = hotelData;

// Helper functions for filtering hotels
export const filterHotelsByArea = (hotels: Hotel[], area: string): Hotel[] => {
  if (!area) return hotels;

  // Map areas to approximate coordinates
  const areaCoordinates: {
    [key: string]: { lat: [number, number]; lng: [number, number] };
  } = {
    "Pike Place Market": { lat: [47.608, 47.611], lng: [-122.345, -122.335] },
    Belltown: { lat: [47.612, 47.618], lng: [-122.35, -122.34] },
    "South Lake Union": { lat: [47.615, 47.62], lng: [-122.34, -122.33] },
    "Capitol Hill": { lat: [47.61, 47.615], lng: [-122.325, -122.315] },
    Downtown: { lat: [47.605, 47.615], lng: [-122.345, -122.33] },
  };

  const areaBounds = areaCoordinates[area];
  if (!areaBounds) return hotels;

  return hotels.filter(
    (hotel) =>
      hotel.latitude >= areaBounds.lat[0] &&
      hotel.latitude <= areaBounds.lat[1] &&
      hotel.longitude >= areaBounds.lng[0] &&
      hotel.longitude <= areaBounds.lng[1]
  );
};

export const filterHotelsByPrice = (
  hotels: Hotel[],
  filter: string
): Hotel[] => {
  switch (filter) {
    case "budget":
      return hotels.filter((hotel) => {
        const price =
          typeof hotel.price_per_night === "string"
            ? parseInt(hotel.price_per_night)
            : hotel.price_per_night;
        return price <= 800;
      });
    case "luxury":
      return hotels.filter((hotel) => {
        const price =
          typeof hotel.price_per_night === "string"
            ? parseInt(hotel.price_per_night)
            : hotel.price_per_night;
        return price >= 1000;
      });
    default:
      return hotels;
  }
};

export const filterHotelsByRating = (hotels: Hotel[]): Hotel[] => {
  return hotels.filter((hotel) => hotel.rating >= 8.5);
};

export const filterHotelsByAmenities = (
  hotels: Hotel[],
  amenities: string[]
): Hotel[] => {
  if (!amenities.length) return hotels;
  return hotels.filter((hotel) =>
    amenities.some((amenity) => hotel.amenities.includes(amenity))
  );
};

// Calculate quick stats from real data
export const calculateQuickStats = (hotels: Hotel[]) => {
  const totalHotels = hotels.length;

  // Handle empty hotels array
  if (totalHotels === 0) {
    return {
      totalHotels: 0,
      avgPrice: "N/A",
      topRated: "N/A",
    };
  }

  const prices = hotels.map((hotel) =>
    typeof hotel.price_per_night === "string"
      ? parseInt(hotel.price_per_night)
      : hotel.price_per_night
  );
  const avgPrice = Math.round(
    prices.reduce((sum, price) => sum + price, 0) / totalHotels
  );

  const ratings = hotels.map((hotel) => hotel.rating);
  const topRated = Math.max(...ratings);

  return {
    totalHotels,
    avgPrice: avgPrice.toString(),
    topRated: topRated.toFixed(1),
  };
};
