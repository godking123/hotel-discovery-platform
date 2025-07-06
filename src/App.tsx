import "./index.css";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import Map from "./components/Map";
import { seattleHotels, calculateQuickStats } from "./data/hotels";

// Tooltip component
const Tooltip = ({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap -top-10 left-1/2 transform -translate-x-1/2"
        >
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </motion.div>
      )}
    </div>
  );
};

function App() {
  const [mapView, setMapView] = useState("map"); // map, satellite, terrain
  const [activeFilter, setActiveFilter] = useState("all"); // all, budget, luxury
  const [selectedArea, setSelectedArea] = useState("");
  const [maxPrice, setMaxPrice] = useState(2000); // Max price for filter

  // Filter hotels based on current filters
  const filteredHotels = useMemo(() => {
    let currentHotels = seattleHotels;

    if (selectedArea) {
      // Filter by area (simplified for now)
      currentHotels = seattleHotels.filter((hotel) => {
        // Simple area filtering based on coordinates
        const areaBounds = {
          "Pike Place Market": {
            lat: [47.608, 47.611],
            lng: [-122.345, -122.335],
          },
          Belltown: { lat: [47.612, 47.618], lng: [-122.35, -122.34] },
          "South Lake Union": { lat: [47.615, 47.62], lng: [-122.34, -122.33] },
          "Capitol Hill": { lat: [47.61, 47.615], lng: [-122.325, -122.315] },
          Downtown: { lat: [47.605, 47.615], lng: [-122.345, -122.33] },
        };

        const bounds = areaBounds[selectedArea as keyof typeof areaBounds];
        if (!bounds) return true;

        return (
          hotel.latitude >= bounds.lat[0] &&
          hotel.latitude <= bounds.lat[1] &&
          hotel.longitude >= bounds.lng[0] &&
          hotel.longitude <= bounds.lng[1]
        );
      });
    }

    if (activeFilter && activeFilter !== "all") {
      if (activeFilter === "rating") {
        currentHotels = currentHotels.filter((hotel) => hotel.rating >= 8.5);
      } else if (activeFilter === "amenities") {
        currentHotels = currentHotels.filter(
          (hotel) => hotel.amenities.length > 5
        );
      } else if (activeFilter === "budget") {
        currentHotels = currentHotels.filter((hotel) => {
          const price =
            typeof hotel.price_per_night === "string"
              ? parseInt(hotel.price_per_night)
              : hotel.price_per_night;
          return price <= 800;
        });
      } else if (activeFilter === "cancellation") {
        currentHotels = currentHotels.filter(
          (hotel) => hotel.free_cancellation === true
        );
      }
    }

    // Apply max price filter
    currentHotels = currentHotels.filter((hotel) => {
      const price =
        typeof hotel.price_per_night === "string"
          ? parseInt(hotel.price_per_night)
          : hotel.price_per_night;
      return price <= maxPrice;
    });

    return currentHotels;
  }, [selectedArea, activeFilter, maxPrice]);

  // Calculate quick stats based on filtered hotels
  const quickStats = useMemo(() => {
    return calculateQuickStats(filteredHotels);
  }, [filteredHotels]);

  const handleMapViewChange = (view: string) => {
    setMapView(view);
    console.log(`Switched to ${view} view`);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    console.log(`Applied ${filter} filter`);
  };

  const handleAreaSelect = (area: string) => {
    // Toggle area selection - if same area is clicked, deselect it
    if (selectedArea === area) {
      setSelectedArea("");
      console.log(`Deselected ${area}`);
    } else {
      setSelectedArea(area);
      console.log(`Navigating to ${area}`);
    }
  };

  const handleMapLoad = () => {
    console.log("Map loaded successfully");
    // You can add custom map initialization here
  };

  return (
    <div className="w-screen h-screen flex bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 h-full bg-gray-800 border-r border-gray-700 shadow-lg flex flex-col overflow-y-auto overflow-x-hidden relative flex-shrink-0">
        {/* Map View Buttons */}
        <div className="p-6 border-b border-gray-700 text-center">
  <h3 className="text-lg font-semibold text-gray-300 mb-4">Map View</h3>
  <div className="flex justify-center space-x-3">
            {/* Map */}
            <Tooltip text="Street map view">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleMapViewChange("map")}
                className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-100 ${
                  mapView === "map"
                    ? "bg-blue-600 border-blue-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    mapView === "map" ? "text-white" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                  />
                </svg>
              </motion.button>
            </Tooltip>
            {/* Satellite */}
            <Tooltip text="Satellite view">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleMapViewChange("satellite")}
                className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-100 ${
                  mapView === "satellite"
                    ? "bg-blue-600 border-blue-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    mapView === "satellite" ? "text-white" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                  />
                </svg>
              </motion.button>
            </Tooltip>
            {/* Terrain */}
            <Tooltip text="Terrain view">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleMapViewChange("terrain")}
                className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-100 ${
                  mapView === "terrain"
                    ? "bg-blue-600 border-blue-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    mapView === "terrain" ? "text-white" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5v14"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 5v14"
                  />
                </svg>
              </motion.button>
            </Tooltip>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-700 text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Filters</h3>
          <div className="flex justify-center space-x-3 mb-3">
            {/* All */}
            <Tooltip text="Show all hotels">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleFilterChange("all")}
                className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-100 ${
                  activeFilter === "all"
                    ? "bg-green-600 border-green-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}>
                <svg
                  className={`w-5 h-5 ${
                    activeFilter === "all" ? "text-white" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </motion.button>
            </Tooltip>
            {/* Budget */}
            <Tooltip text="Budget hotels ($800 or less)">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleFilterChange("budget")}
                className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-100 ${
                  activeFilter === "budget"
                    ? "bg-green-600 border-green-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}>
                <svg
                  className={`w-5 h-5 ${
                    activeFilter === "budget" ? "text-white" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </motion.button>
            </Tooltip>
            {/* Luxury */}
            <Tooltip text="Luxury hotels ($1000+)">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleFilterChange("luxury")}
                className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-100 ${
                  activeFilter === "luxury"
                    ? "bg-green-600 border-green-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}>
                <svg
                  className={`w-5 h-5 ${
                    activeFilter === "luxury" ? "text-white" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.143L13 21l-2.286-6.857L5 12l5.714-3.143L13 3z"
                  />
                </svg>
              </motion.button>
            </Tooltip>
          </div>
          <div className="flex justify-center space-x-3">
            {/* Rating */}
            <Tooltip text="Top rated hotels (8.5+ stars)">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleFilterChange("rating")}
                className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-100 ${
                  activeFilter === "rating"
                    ? "bg-green-600 border-green-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}>
                <svg
                  className={`w-5 h-5 ${
                    activeFilter === "rating" ? "text-white" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </motion.button>
            </Tooltip>
            {/* Amenities */}
            <Tooltip text="Hotels with 6+ amenities">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleFilterChange("amenities")}
                className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-100 ${
                  activeFilter === "amenities"
                    ? "bg-green-600 border-green-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}>
                <svg
                  className={`w-5 h-5 ${
                    activeFilter === "amenities"
                      ? "text-white"
                      : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </motion.button>
            </Tooltip>
            {/* Free Cancellation */}
            <Tooltip text="Free cancellation available">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => handleFilterChange("cancellation")}
                className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-100 ${
                  activeFilter === "cancellation"
                    ? "bg-green-600 border-green-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}>
                <svg
                  className={`w-5 h-5 ${
                    activeFilter === "cancellation"
                      ? "text-white"
                      : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </motion.button>
            </Tooltip>
          </div>
          <div className="mt-4">
            <input
              type="range"
              min="0"
              max="2000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <h4 className="text-sm font-semibold text-gray-300 mt-2 text-center">
              Max Price: ${maxPrice}
            </h4>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Hotels</span>
              <span className="text-sm font-medium text-gray-200">
                {quickStats.totalHotels}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Avg. Price</span>
              <span className="text-sm font-medium text-gray-200">
                {quickStats.avgPrice === "N/A"
                  ? "N/A"
                  : `$${quickStats.avgPrice}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Top Rated</span>
              <span className="text-sm font-medium text-gray-200">
                {quickStats.topRated === "N/A"
                  ? "N/A"
                  : `${quickStats.topRated}★`}
              </span>
            </div>
          </div>
        </div>

        {/* Popular Areas */}
        <div className="p-6 flex-1 text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">
            Popular Areas
          </h3>
          <div className="space-y-3 flex flex-col items-center">
            {[
              "Pike Place Market",
              "Belltown",
              "South Lake Union",
              "Capitol Hill",
              "Downtown",
            ].map((area) => (
              <Tooltip key={area} text={`Navigate to ${area}`}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleAreaSelect(area)}
                  className={`w-48 text-center px-4 py-3 text-sm font-medium rounded-xl border transition-all duration-100 cursor-pointer ${                    selectedArea === area
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}>
                  {area}
                </motion.button>
              </Tooltip>
            ))}
          </div>
        </div>
      </aside>

      {/* Map Area */}
      <main className="flex-1 h-full bg-gray-900">
        <Map
          mapView={mapView}
          selectedArea={selectedArea}
          filteredHotels={filteredHotels}
          onMapLoad={handleMapLoad}
          onHotelClick={(hotel) => {
            console.log("Hotel clicked:", hotel.name);
            // You can add more functionality here like opening a hotel details modal
          }}
        />
      </main>
    </div>
  );
}

export default App;
