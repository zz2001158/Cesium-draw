class Tooltip {
  constructor(position) {
    this.position = position;
    this.tooltip = null;
  }
  onLoad() {
    if (this.tooltip) this.unInstall();
    this.tooltip = document.createElement("div");
    (this.tooltip.style.cssText = `
        display: inline-block;
        position: absolute;
        top: ${this.position.y + 10}px;
        left: ${this.position.x + 10}px;
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
      if (this.deleteEntity) this.deleteEntity();
    });
  }
  onRemove() {
    let element = document.getElementById("tooltip");
    element.remove();

    this.tooltip.remove();
  }
}

export default Tooltip;
