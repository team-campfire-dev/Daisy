declare global {
    interface Window {
        naver: any;
    }
}

declare namespace naver {
    namespace maps {
        class Map {
            constructor(element: HTMLElement | string, options: any);
            fitBounds(bounds: any, margin?: any): void;
            setCenter(center: any): void;
            setZoom(zoom: number): void;
        }
        class LatLng {
            constructor(lat: number, lng: number);
            lat(): number;
            lng(): number;
        }
        class Point {
            constructor(x: number, y: number);
        }
        class LatLngBounds {
            constructor(sw: any, ne: any);
            extend(latlng: any): void;
        }
        class Marker {
            constructor(options: any);
            setMap(map: Map | null): void;
        }
        class Polyline {
            constructor(options: any);
            setMap(map: Map | null): void;
        }
        namespace Event {
            function addListener(target: any, event: string, handler: (e: any) => void): void;
        }
        namespace PointingIcon {
            const CIRCLE: any;
            const OPEN_ARROW: any;
        }
        namespace TransCoord {
            function fromTM128ToLatLng(tm128: Point): LatLng;
        }
    }
}
