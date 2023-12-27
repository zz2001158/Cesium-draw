import * as Cesium from "cesium";
import { getId } from "./ids";
import dataManage from "../../script/dataManage";
import * as turf from "@turf/turf";
import {
  windowPositionConvertCartesin3Fn,
  cartesianToCartographicDegreesFn,
} from "../../script/utils";
class EditLine {
  constructor(viewer) {
    this.viewer = viewer;
    this.initEvent();
    this.tempPoints = [];
    this.entity = {};
    this.selectPoint = {}; //实体中被选中的点
    this.selectPointIndex = -1;
    this.lines = [];
    this.findItemIndex = -1; //选中的实体
    this.auxiliaryPoints = [];
  }

  initEvent() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
  }

  install(entity) {
    this.entity = entity;
    this.initLine(entity);
    this.handler.setInputAction(
      (e) => this.leftDownEvent(e),
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    );
  }
  uninstall() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    this.clearTempEntity();
    this.clearAuxiliaryPoints();
    this.tempPoints = [];
    this.entity = {};
  }
  initLine(entity) {
    this.lines = dataManage.plugins.linesManage.getLines();
    this.findItemIndex = this.lines.findIndex((d) => d.id === entity.id.id);
    // console.log(findItem, entity);
    if (this.findItemIndex !== -1) {
      this.tempPoints = this.lines[this.findItemIndex].positions;
      this.tempPoints.forEach((e) => {
        if (this.drawTempPoint) this.drawTempPoint(e.id, e.position);
      });
      //添加辅助点
      this.addAuxiliaryPointsFn();
    }
  }

  addAuxiliaryPointsFn() {
    this.clearAuxiliaryPoints();
    // console.log(this.tempPoints, "this.tempPoints");
    for (let i = 0; i < this.tempPoints.length - 1; i++) {
      console.log(i, i + 1, "i");
      let point1 = cartesianToCartographicDegreesFn(
        this.tempPoints[i].position
      );

      let point2 = cartesianToCartographicDegreesFn(
        this.tempPoints[i + 1].position
      );
      let midPoint = turf.midpoint(turf.point(point1), turf.point(point2));
      let id = "d_" + getId();
      let insetPoint = Cesium.Cartesian3.fromDegrees(
        midPoint.geometry.coordinates[0],
        midPoint.geometry.coordinates[1]
      );
      this.auxiliaryPoints.push({ id, position: insetPoint });
    }
    this.auxiliaryPoints.forEach((e) => {
      this.drawTempPoint && this.drawTempPoint(e.id, e.position);
    });
  }

  leftDownEvent(e) {
    this.selectPoint = this.viewer.scene.pick(e.position);
    this.selectPointIndex = this.tempPoints.findIndex(
      (i) => i.id === this.selectPoint.id.id
    );
    this.handler.setInputAction(
      (e) => this.mouseMoveEvent(e),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    this.handler.setInputAction(
      (e) => this.leftUpEvent(e),
      Cesium.ScreenSpaceEventType.LEFT_UP
    );
  }
  leftUpEvent(e) {
    console.log("up");
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.lines[this.findItemIndex].positions = this.tempPoints;
    dataManage.plugins.linesManage.saveLines(this.lines);
  }
  mouseMoveEvent(e) {
    if (this.selectPointIndex == -1) return;
    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
    let position = windowPositionConvertCartesin3Fn(this.viewer, e.endPosition);
    this.selectPoint.id.position = position;
    this.tempPoints[this.selectPointIndex].position = position;
    let positions = this.tempPoints.map((d) => d.position);
    this.addAuxiliaryPointsFn();
    this.entity.id.polyline.positions = new Cesium.CallbackProperty(
      (time, result) => {
        return [...positions];
      },
      false
    );
  }

  clearTempEntity() {
    this.tempPoints.forEach((e) => {
      this.viewer.entities.removeById(e.id);
    });
  }

  clearAuxiliaryPoints() {
    this.auxiliaryPoints.forEach((e) => this.viewer.entities.removeById(e.id));
    this.auxiliaryPoints = [];
  }
}

export default EditLine;
