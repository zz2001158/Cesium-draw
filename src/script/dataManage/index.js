import PointsManage from "./pointsManage";
import LinesManage from "./linesManage";
import PolygonsManage from "./polygonsManage";
class DataManage {
  constructor() {
    this.plugins = {};
    this.addPlugins();
  }

  addPlugins() {
    this.plugins.pointsManage = new PointsManage(this);
    this.plugins.linesManage = new LinesManage(this);
    this.plugins.polygonsManage = new PolygonsManage(this);
  }
}

let dataManage = new DataManage();
export default dataManage;
