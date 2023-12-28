import * as Cesium from "cesium";
import { getId } from "./ids";
import dataManage from "../../script/dataManage";
import { windowPositionConvertCartesin3Fn } from "../../script/utils";
import { ElMessage, ElMessageBox } from "element-plus";
class DrawPloygon {
  constructor(viewer) {
    this.viewer = viewer;
    this.initEvent();
    this.tempPoints = [];
    this.guideLine = null;
    this.guidPolygon = null;
    this.polygons = [];
  }

  initEvent() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
  }

  install() {
    this.tempPoints = [];
    this.handler.setInputAction(
      (e) => this.startDraw(e),
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    this.handler.setInputAction(
      (e) => this.mouseMoveEvent(e),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    this.handler.setInputAction(
      (e) => this.endDraw(e),
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
  }
  uninstall() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
  }
  drawPolygon(id, position) {
    let viewer = this.viewer;
    return viewer.entities.add({
      id,
      name: "面",
      polygon: {
        hierarchy: position,
        material: Cesium.Color.YELLOW.withAlpha(0.8),
        clampToGround: true,
      },
    });
  }

  initPolygon() {
    this.polygons = dataManage.plugins.polygonsManage.getPolygons() || [];
    if (this.polygons && this.polygons.length) {
      for (let i = 0; i < this.polygons.length; i++) {
        let positions = this.polygons[i].positions.map((d) => d.position);
        this.drawPolygon(this.polygons[i].id, positions);
      }
    }
  }
  startDraw(e) {
    // console.log("点击");
    let position = windowPositionConvertCartesin3Fn(this.viewer, e.position);
    let id = getId();
    if (!this.guideLine) this.guideLine = "tl_" + id;
    if (!this.guidPolygon) this.guidPolygon = "p_" + id;
    this.tempPoints.push({ id: "d_" + id, position: position });
    if (this.drawTempPoint) this.drawTempPoint("d_" + id, position);
  }
  removeEntityById(id) {
    this.viewer.entities.removeById(id);
  }
  mouseMoveEvent(e) {
    // console.log("移动");
    if (this.tempPoints.length > 0) {
      if (this.guideLine) this.removeEntityById(this.guideLine);
      let end = windowPositionConvertCartesin3Fn(this.viewer, e.endPosition);
      let linePositions = this.tempPoints.map((d) => d.position);
      this.drawLine(
        this.guideLine,
        new Cesium.CallbackProperty((time, result) => {
          return [...linePositions.concat(end)];
        }, false)
      );
    }
    if (this.tempPoints.length > 1) {
      if (this.guidPolygon) this.removeEntityById(this.guidPolygon);
      let end = windowPositionConvertCartesin3Fn(this.viewer, e.endPosition);
      let positions = this.tempPoints.map((d) => d.position);
      this.drawPolygon(
        this.guidPolygon,
        new Cesium.CallbackProperty((time, result) => {
          return new Cesium.PolygonHierarchy(positions.concat(end));
        }, false)
      );
    }
  }
  endDraw(e) {
    if (this.tempPoints.length < 3) {
      this.$message.error("请至少绘制三个点");
    } else {
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      if (this.guideLine) this.removeEntityById(this.guideLine);
      this.removeEntityById(this.tempPoints[this.tempPoints.length - 1].id);
      this.tempPoints.splice(this.tempPoints.length - 1, 1);
      this.polygons.push({ id: this.guidPolygon, positions: this.tempPoints });
      dataManage.plugins.polygonsManage.savePolygons(this.polygons);
      this.clearTempEntity();
      if (this.drawSuccessFn) this.drawSuccessFn();
    }
  }

  clearTempEntity() {
    this.tempPoints.forEach((e) => {
      this.removeEntityById(e.id);
    });
  }
}

export default DrawPloygon;
