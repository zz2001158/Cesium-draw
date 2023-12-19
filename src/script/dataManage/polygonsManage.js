class PolygonsManage {
  constructor() {
    this.prefix = "polygon";
    this.polygons = [];
  }

  savePolygons(polygons) {
    this.polygons = polygons;
    localStorage.setItem(this.prefix, JSON.stringify(this.polygons));
  }
  getPolygons() {
    return JSON.parse(localStorage.getItem(this.prefix));
  }

  clearPolygons() {
    localStorage.removeItem(this.prefix);
  }
}

export default PolygonsManage;
