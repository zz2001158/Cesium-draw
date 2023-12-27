import * as Cesium from "cesium";
import { getId } from "./ids";
import dataManage from "../../script/dataManage";
import { windowPositionConvertCartesin3Fn } from "../../script/utils";
class DrawPloygon {
  constructor(viewer) {
    this.viewer = viewer;
    this.initEvent();
    this.tempPoints = [];
    this.guideLines = null;
    this.guidPolygon = null;
    this.tempLines = [];
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
      Cesium.ScreenSpaceEventType.RIGHT_CLICK
    );
  }
  uninstall() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
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
    this.tempPoints.push({ id: "d_" + id, position: position });
    if (this.drawTempPoint) this.drawTempPoint("d_" + id, position);
    if (this.tempPoints.length > 1) {
      this.tempLines.push("tl_" + id);
      this.drawLine("tl_" + id, [
        this.tempPoints[this.tempPoints.length - 2].position,
        this.tempPoints[this.tempPoints.length - 1].position,
      ]);
    }
  }
  removeEntityById(id) {
    this.viewer.entities.removeById(id);
  }
  mouseMoveEvent(e) {
    // console.log("移动");
    if (this.tempPoints.length > 0) {
      if (this.guideLines) this.removeEntityById(this.guideLines);
      let end = windowPositionConvertCartesin3Fn(this.viewer, e.endPosition);
      this.guideLines = "l" + getId();
      this.drawLine(
        this.guideLines,
        new Cesium.CallbackProperty((time, result) => {
          return [end, this.tempPoints[this.tempPoints.length - 1].position];
        }, false)
      );
    }
    if (this.tempPoints.length > 1) {
      if (this.guidPolygon) this.removeEntityById(this.guidPolygon);
      let end = windowPositionConvertCartesin3Fn(this.viewer, e.endPosition);
      this.guidPolygon = "temp" + getId();
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
      let id = "p_" + getId();
      let ploygonPositions = this.tempPoints.map((d) => d.position);
      this.polygons.push({ id: id, positions: this.tempPoints });
      this.drawPolygon(id, ploygonPositions);
      dataManage.plugins.polygonsManage.savePolygons(this.polygons);
      this.clearTempEntity();
      if (this.drawSuccessFn) this.drawSuccessFn();
    }
  }

  clearTempEntity() {
    this.tempPoints.forEach((e) => {
      this.removeEntityById(e.id);
    });
    this.tempLines.forEach((e) => this.removeEntityById(e));
  }
}

export default DrawPloygon;
