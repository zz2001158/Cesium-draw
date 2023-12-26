import * as Cesium from "cesium";
import { getId } from "./ids";
import dataManage from "../../script/dataManage";
import { windowPositionConvertCartesin3Fn } from "../../script/utils";
class DrawPoint {
  constructor(viewer) {
    this.viewer = viewer;
    this.initEvent();
    this.points = [];
  }

  initEvent() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
  }

  install() {
    this.handler.setInputAction(
      (e) => this.savePoint(e),
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
  }
  uninstall() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }
  savePoint(e) {
    let position = windowPositionConvertCartesin3Fn(this.viewer, e.position);
    let id = "d_" + getId();
    this.points.push({ id, position });
    dataManage.plugins.pointsManage.savePoint(this.points);
    this.drawPoint(id, position);
  }

  drawPoint(id, position) {
    let viewer = this.viewer;
    return viewer.entities.add({
      id,
      name: "点",
      position: position,
      point: {
        color: Cesium.Color.WHEAT,
        pixelSize: 20,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 规定贴地
      },
    });
  }

  initPoint() {
    this.points = dataManage.plugins.pointsManage.getPoints() || [];
    if (this.points && this.points.length) {
      for (let i = 0; i < this.points.length; i++) {
        this.drawPoint(this.points[i].id, this.points[i].position);
      }
    }
  }
}

export default DrawPoint;
