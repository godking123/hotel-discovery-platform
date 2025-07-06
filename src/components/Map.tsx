import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "../config/mapbox";
import {
  seattleHotels,
  filterHotelsByArea,
  filterHotelsByPrice,
  filterHotelsByRating,
} from "../data/hotels";
import type { Hotel } from "../data/hotels";

// Set the access token
mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapProps {
  mapView: string;
  selectedArea?: string;
  activeFilter?: string;
  onMapLoad?: () => void;
  onHotelClick?: (hotel: Hotel) => void;
}

const Map: React.FC<MapProps> = ({
  mapView,
  selectedArea,
  activeFilter,
  onMapLoad,
  onHotelClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng] = useState(-122.3321); // Seattle coordinates
  const [lat] = useState(47.6062);
  const [zoom] = useState(12);
  const [hotels, setHotels] = useState<Hotel[]>(seattleHotels);

  // Filter hotels based on selected area and active filter
  useEffect(() => {
    let filteredHotels = seattleHotels;

    if (selectedArea) {
      filteredHotels = filterHotelsByArea(filteredHotels, selectedArea);
    }

    if (activeFilter && activeFilter !== "all") {
      if (activeFilter === "rating") {
        filteredHotels = filterHotelsByRating(filteredHotels);
      } else if (activeFilter === "amenities") {
        // Show hotels with more than 5 amenities
        filteredHotels = filteredHotels.filter(
          (hotel) => hotel.amenities.length > 5
        );
      } else {
        filteredHotels = filterHotelsByPrice(filteredHotels, activeFilter);
      }
    }

    setHotels(filteredHotels);
  }, [selectedArea, activeFilter]);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: getMapStyle(mapView),
        center: [lng, lat],
        zoom: zoom,
        pitch: mapView === "map" ? 60 : 0, // Increased pitch for better 3D effect
        bearing: 0,
      });

      map.current.on("load", () => {
        if (onMapLoad) {
          onMapLoad();
        }

        // Add 3D terrain and buildings for street view
        if (map.current && mapView === "map") {
          // Add terrain
          map.current.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });

          map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });

          // Add 3D buildings layer with proper syntax
          map.current.addLayer({
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 12,
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.8,
            },
          } as mapboxgl.FillExtrusionLayerSpecification);
        }

        // Add hotel markers
        addHotelMarkers();
      });
    }
  }, []);

  // Update map style when mapView changes
  useEffect(() => {
    if (map.current) {
      const newStyle = getMapStyle(mapView);
      map.current.setStyle(newStyle);

      // Re-add terrain, buildings, and markers after style change
      map.current.on("style.load", () => {
        if (mapView === "map" && map.current) {
          // Add terrain
          map.current.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });

          map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });

          // Add 3D buildings layer with proper syntax
          map.current.addLayer({
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 12,
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.8,
            },
          } as mapboxgl.FillExtrusionLayerSpecification);
        }

        // Re-add hotel markers after style change
        addHotelMarkers();
      });
    }
  }, [mapView]);

  // Update markers when hotels change
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      addHotelMarkers();
    }
  }, [hotels]);

  // Navigate to selected area or reset view
  useEffect(() => {
    if (map.current) {
      if (selectedArea) {
        const areaCoordinates = getAreaCoordinates(selectedArea);
        if (areaCoordinates) {
          map.current.flyTo({
            center: areaCoordinates,
            zoom: 16, // Closer zoom for better 3D view
            pitch: mapView === "map" ? 60 : 0,
            duration: 2000,
          });
        }
      } else {
        // If no area is selected, reset to the default view
        map.current.flyTo({
          center: [lng, lat],
          zoom: zoom,
          pitch: mapView === "map" ? 60 : 0,
          duration: 2000,
        });
      }
    }
  }, [selectedArea, mapView, lng, lat, zoom]);

  

  const addHotelMarkers = () => {
    if (!map.current) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll(".hotel-marker");
    existingMarkers.forEach((marker) => marker.remove());

    // Add new markers
    hotels.forEach((hotel) => {
      // Create marker element
      const markerEl = document.createElement("div");
      markerEl.className = "hotel-marker";
      markerEl.style.width = "30px";
      markerEl.style.height = "30px";
      markerEl.style.backgroundImage =
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ef4444'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E\")";
      markerEl.style.backgroundSize = "contain";
      markerEl.style.cursor = "pointer";
      markerEl.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";

      // Format price
      const price =
        typeof hotel.price_per_night === "string"
          ? parseInt(hotel.price_per_night)
          : hotel.price_per_night;

      // Create popup with all amenities and no close button
      const popup = new mapboxgl.Popup({
        offset: 25,
        className: "hotel-popup",
        closeButton: false, // Remove the X button
      }).setHTML(`
        <div class="p-4 bg-gray-900 text-white rounded-lg shadow-xl max-w-sm border border-gray-700">
          <h3 class="font-bold text-lg mb-2 text-blue-400">${hotel.name}</h3>
          <p class="text-sm text-gray-300 mb-3">${hotel.address}</p>
          <div class="flex justify-between items-center mb-3">
            <span class="text-green-400 font-semibold">$${price.toLocaleString()}/night</span>
            <span class="text-yellow-400 font-semibold">${hotel.rating}★</span>
          </div>
          <p class="text-xs text-gray-400 mb-3">${hotel.room_type}</p>
          <div class="mb-3">
            <h4 class="text-sm font-semibold text-gray-200 mb-2">All Amenities (${
              hotel.amenities.length
            }):</h4>
            <div class="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              ${hotel.amenities
                .map(
                  (amenity) =>
                    `<span class="px-2 py-1 bg-blue-600 text-xs rounded-full text-white">${amenity}</span>`
                )
                .join("")}
            </div>
          </div>
          <div class="flex justify-between items-center text-xs text-gray-400">
            <span>${hotel.star_rating}★ Hotel</span>
            <span>${hotel.review_count} reviews</span>
          </div>
        </div>
      `);

      // Add marker to map
      if (map.current) {
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([hotel.longitude, hotel.latitude])
          .setPopup(popup);

        marker.addTo(map.current);

        // Add click handler
        markerEl.addEventListener("click", () => {
          if (onHotelClick) {
            onHotelClick(hotel);
          }
        });
      }
    });
  };

  const getMapStyle = (view: string) => {
    switch (view) {
      case "satellite":
        return "mapbox://styles/mapbox/satellite-v9";
      case "terrain":
        return "mapbox://styles/mapbox/outdoors-v11";
      default:
        return "mapbox://styles/mapbox/dark-v11"; // Dark mode street view
    }
  };

  const getAreaCoordinates = (area: string) => {
    const coordinates: { [key: string]: [number, number] } = {
      "Pike Place Market": [-122.3421, 47.6097],
      Belltown: [-122.35, 47.615],
      "South Lake Union": [-122.33, 47.62],
      "Capitol Hill": [-122.32, 47.615],
      Downtown: [-122.3321, 47.6062],
    };
    return coordinates[area];
  };

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ background: "#1a1a1a", width: "100%", height: "100%" }}
    />
  );
};

export default Map;
