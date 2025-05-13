import 'leaflet';
import 'leaflet-draw';

declare module 'leaflet' {
  namespace Control {
    class Draw extends Control {
      constructor(options?: any);
    }
  }

  namespace Draw {
    namespace Event {
      const CREATED: string;
    }
  }
}
