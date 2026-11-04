// Native: the real MapLibre components. Web gets maplibre.web.js instead
// (Metro picks the .web.js file automatically), because
// @maplibre/maplibre-react-native has no browser implementation.
export { Map, Camera, GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
