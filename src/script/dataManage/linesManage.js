class LinesManage {
  constructor() {
    this.prefix = "lines";
    this.lines = [];
  }

  saveLines(lines) {
    this.lines = lines;
    localStorage.setItem(this.prefix, JSON.stringify(this.lines));
  }
  getLines() {
    return JSON.parse(localStorage.getItem(this.prefix));
  }

  clearLines() {
    localStorage.removeItem(this.prefix);
  }
}

export default LinesManage;
