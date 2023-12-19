class PointsManage {
  constructor() {
    this.prefix = "points";
    this.points = [];
  }

  savePoint(points) {
    this.points = points;
    localStorage.setItem(this.prefix, JSON.stringify(this.points));
  }
  getPoints() {
    return JSON.parse(localStorage.getItem(this.prefix));
  }

  clearPoints() {
    localStorage.removeItem(this.prefix);
  }
}

export default PointsManage;
