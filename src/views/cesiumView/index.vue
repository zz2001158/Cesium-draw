<template>
  <div class="draw-box">
    <div class="overlay" v-if="overlay">
     <span>放大地图以编辑</span>
    </div>
    <div class="flex operate-box">
      <el-dropdown v-if="!startDraw && !startEdit" @command="handleCommand">
        <el-button type="primary">绘制</el-button>
        <template #dropdown>
          <el-dropdown-item type="primary" command="drawPoint">绘制点</el-dropdown-item>
          <el-dropdown-item type="primary" command="drawLine">绘制线</el-dropdown-item>
          <el-dropdown-item type="primary" command="drawPolygon">绘制面</el-dropdown-item>
        </template>
      </el-dropdown>
      <el-button type="primary" @click="stopDraw" v-if="startDraw">停止绘制</el-button>
      <el-button type="primary" @click="startEditFn" style="margin-left: 30px"
        v-if="!startEdit && !startDraw">编辑</el-button>
      <el-button type="primary" style="margin-left: 30px" @click="stopEdit" v-if="startEdit">停止编辑</el-button>
    </div>
    <div class="cesium-view" id="cesiumContainer" ref="cesiumMap"></div>
  </div>
</template>

<script>
import * as Cesium from "cesium";
import dataManage from "../../script/dataManage";
import { ElMessage, ElMessageBox } from "element-plus";
import DrawPoint from "./drawPoint";
import EditPoint from "./editPoint";
import DrawLine from "./drawLine";
import EditLine from "./editLine";
import DrawPloygon from "./drawPloygon";
import EditPloygon from "./editPolygon";
export default {
  data() {
    return {
      viewer: null,
      handler: null,
      startDraw: false,
      startEdit: false,
      selectEntity: null,
      tooltip: null,
      cesiumMap: {},
      viewHeight: null,
      overlay: true,
    };
  },
  components: {},
  created() { },
  methods: {
    init() {
      this.viewer = new Cesium.Viewer("cesiumContainer", {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        // infoBox: false, // 解决默认的控制台报错
        baseLayerPicker: false, // 去掉底图选择器
        // sceneModePicker: false, // 去掉场景模式选择器 （3D，2D）
        // homeButton: false, // 去掉起始点按钮
        geocoder: false, // 去掉地理代码搜索
        // navigationHelpButton: false, // 去掉导航帮助按钮
        animation: false, // 取消动画按钮
        timeline: false, // 去掉时间线
        fullscreenButton: false, // 去掉全屏按钮
        // selectionIndicator: false, // 去掉选择指示器,
        selectionIndicator: false, //去掉选中效果
      });
      this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

      this.getViewerHeight();

      this.cesiumMap.drawPoint = new DrawPoint(this.viewer);
      this.cesiumMap.drawPoint.initPoint();
      this.cesiumMap.editPoint = new EditPoint(this.viewer);

      this.cesiumMap.drawLine = new DrawLine(this.viewer);
      this.cesiumMap.drawLine.initLine();
      this.cesiumMap.drawLine.drawTempPoint =
        this.cesiumMap.drawPoint.drawPoint;
      this.cesiumMap.drawLine.drawLineSuccessFn = this.stopDraw;

      this.cesiumMap.editLine = new EditLine(this.viewer);
      this.cesiumMap.editLine.drawTempPoint =
        this.cesiumMap.drawPoint.drawPoint;

      this.cesiumMap.drawPolygon = new DrawPloygon(this.viewer);
      this.cesiumMap.drawPolygon.initPolygon();
      this.cesiumMap.drawPolygon.drawTempPoint =
        this.cesiumMap.drawPoint.drawPoint;
      this.cesiumMap.drawPolygon.drawLine = this.cesiumMap.drawLine.drawLine;
      this.cesiumMap.drawPolygon.drawSuccessFn = this.stopDraw;

      this.cesiumMap.editPolygon = new EditPloygon(this.viewer);
      this.cesiumMap.editPolygon.drawTempPoint =
        this.cesiumMap.drawPoint.drawPoint;

      this.tooltip && this.tooltip.remove();
    },
    getViewerHeight(){
      this.handler.setInputAction((wheelment) => {
        this.viewHeight = this.viewer.camera.positionCartographic.height;
        if(this.viewHeight > 47611.538969769725  ){
          this.overlay = true;
        }else{
          this.overlay = false;
        }
      }, Cesium.ScreenSpaceEventType.WHEEL)
    },
    handleCommand(command) {
      this.startDraw = true;
      this.viewer.scene.screenSpaceCameraController.enableZoom = false;
      this.cesiumMap[command].install();
    },
    stopEdit() {
      this.startEdit = false;
      this.viewer.scene.screenSpaceCameraController.enableZoom = true;
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      this.removeAllEdit();
      this.removeAllEdit();
      this.tooltip && this.tooltip.remove();
    },
    stopDraw() {
      this.startDraw = false;
      this.viewer.scene.screenSpaceCameraController.enableZoom = true;
      this.getViewerHeight();
      this.removeAllDraw();
    },
    removeAllEdit() {
      this.cesiumMap.editPoint.uninstall();
      this.cesiumMap.editLine.uninstall();
      this.cesiumMap.editPolygon.uninstall();
    },
    removeAllDraw() {
      this.cesiumMap.drawPoint.uninstall();
      this.cesiumMap.drawLine.uninstall();
      this.cesiumMap.drawPolygon.uninstall();
    },

    startEditFn() {
      this.startEdit = true;
      this.handler.setInputAction((e) => {
        this.tooltip && this.tooltip.remove();
        this.selectEntity = this.viewer.scene.pick(e.position);
        this.removeAllEdit();
        this.viewer.scene.screenSpaceCameraController.enableZoom = false;
        if (this.selectEntity) {
          let name = this.selectEntity.id.name;
          if (name === "点") {
            this.cesiumMap.editPoint.install();
          } else if (name === "线") {
            this.cesiumMap.editLine.install(this.selectEntity);
          } else {
            this.cesiumMap.editPolygon.install(this.selectEntity);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this.handler.setInputAction((e) => {
        this.selectEntity = this.viewer.scene.pick(e.position);
        if (this.selectEntity) {
          console.log(e.position.x, "屏幕坐标", this.tooltip);
          this.tooltip && this.tooltip.remove();
          document.oncontextmenu = function (event) {
            event.preventDefault();
          };
          this.tooltip = document.createElement("div");
          (this.tooltip.style.cssText = `
            display: inline-block;
            position: absolute;
            top: ${e.position.y + 10}px;
            left: ${e.position.x + 10}px;
            padding: 10px;
            font-size: 15px;
            color: #fff;
            background: rgba(0, 0 , 0, .6);
            border-radius: 5px;
            cursor: pointer,
            `),
            this.tooltip.setAttribute("id", "tooltip");
          document.body.appendChild(this.tooltip);
          document.getElementById("tooltip").innerHTML = "删除";
          this.tooltip.addEventListener("click", () => {
            this.deleteEntity(this.selectEntity);
          });
        }
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    },

    deleteEntity(entity) {
      // this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      console.log(`output->entityId`, entity);
      ElMessageBox.confirm("是否删除实体?", "警告", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          let entityId = entity.id.id;
          let entityName = entity.id.name;
          if (entityName === "点") {
            let dataList = dataManage.plugins.pointsManage.getPoints();
            dataList = dataList.filter((d) => d.id !== entityId);
            dataManage.plugins.pointsManage.savePoint(dataList);
          } else if (entityName === "线") {
            let dataList = dataManage.plugins.linesManage.getLines();
            dataList = dataList.filter((d) => d.id !== entityId);
            dataManage.plugins.linesManage.saveLines(dataList);
          } else {
            let dataList = dataManage.plugins.polygonsManage.getPolygons();
            dataList = dataList.filter((d) => d.id !== entityId);
            dataManage.plugins.polygonsManage.savePolygons(dataList);
          }
          this.tooltip.remove();
          this.removeEntityById(entityId);
          this.removeAllEdit();
        })
        .catch((e) => this.tooltip.remove());
    },
    removeEntityById(id) {
      this.viewer.entities.removeById(id);
    },
  },
  mounted() {
    this.init();
  },
  unmounted(){
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.WHEEL);
  }
};
</script>
<style scoped lang="scss">
.draw-box {
  position: relative;
  .overlay{
    position: absolute;
    top: 20;
    left: 0;
    right: 0;
    height: 60px;
    // bottom: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center ;
    >span{
      color: #fff;
      font-size: 25px;
    }
  }

  .flex {
    display: flex;
  }

  .operate-box {
    position: absolute;
    top: 20px;
    left: 50px;
    z-index: 10;
  }

  .cesium-view {
    height: 100%;
    width: 100%;
  }
}

.tooltip {
  color: #fff;
  display: none;
  font-size: 15px;
  padding: 5px 10px;
  background-color: rgba(0, 0, 0, 0.5);
  position: absolute;
  cursor: pointer;
}
</style>
