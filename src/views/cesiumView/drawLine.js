import * as Cesium from "cesium";
import { getId } from "./ids";
import dataManage from "../../script/dataManage";
import { windowPositionConvertCartesin3Fn } from "../../script/utils";
class DrawLine {
  constructor(viewer) {
    this.viewer = viewer;
    this.initEvent();
    this.tempPoints = [];
    this.guideLines = null;
    this.tempLines = [];
    this.lines = [];
  }

  initEvent() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
  }

  install() {
    this.tempPoints = [];
    this.handler.setInputAction(
      (e) => this.startDrawLine(e),
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    this.handler.setInputAction(
      (e) => this.mouseMoveEvent(e),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    this.handler.setInputAction(
      (e) => this.endDrawLine(e),
      Cesium.ScreenSpaceEventType.RIGHT_CLICK
    );
  }
  uninstall() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }
  drawLine(id, position) {
    console.log(id, position);
    let viewer = this.viewer;
    return viewer.entities.add({
      id,
      name: "线",
      polyline: {
        positions: position,
        width: 5.0,
        material: Cesium.Color.RED,
        depthFailMaterial: Cesium.Color.RED,
        clampToGround: true,
      },
    });
  }

  initLine() {
    this.lines = dataManage.plugins.linesManage.getLines() || [];
    if (this.lines && this.lines.length) {
      for (let i = 0; i < this.lines.length; i++) {
        let positions = this.lines[i].positions.map((p) => p.position);
        this.drawLine(this.lines[i].id, positions);
      }
    }
  }
  startDrawLine(e) {
    console.log("点击");
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
      this.tempLines.push("tl_" + id);
    }
  }
  removeEntityById(id) {
    this.viewer.entities.removeById(id);
  }
  mouseMoveEvent(e) {
    console.log("移动");
    if (this.tempPoints.length > 0) {
      if (this.guideLines) this.removeEntityById(this.guideLines);
      let end = windowPositionConvertCartesin3Fn(this.viewer, e.endPosition);
      this.guideLines = getId();
      this.drawLine(
        this.guideLines,
        new Cesium.CallbackProperty((time, result) => {
          return [end, this.tempPoints[this.tempPoints.length - 1].position];
        }, false)
      );
    }
  }
  endDrawLine(e) {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    let lineId = "l_" + getId();
    let linePositions = this.tempPoints.map((d) => d.position);
    this.lines.push({ id: lineId, positions: this.tempPoints });
    this.drawLine(lineId, linePositions);
    dataManage.plugins.linesManage.saveLines(this.lines);
    this.clearTempEntity();
    if (this.drawLineSuccessFn) this.drawLineSuccessFn();
  }

  clearTempEntity() {
    this.tempPoints.forEach((e) => {
      this.removeEntityById(e.id);
    });
    this.tempLines.forEach((e) => this.removeEntityById(e));
  }
}

export default DrawLine;
