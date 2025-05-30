class DragScroll {
  constructor(element, options = {}) {
    // 默认配置
    this.config = {
      scrollMultiplier: 1.5, // 滚动倍数
      momentumMultiplier: 15, // 惯性系数
      frictionFactor: 0.95, // 减速因子
      threshold: 0.1, // 停止阈值
      ...options,
    };

    // 元素和状态
    this.element =
      typeof element === "string" ? document.querySelector(element) : element;
    this.isDown = false;
    this.startX = 0;
    this.scrollLeft = 0;
    this.momentum = 0;
    this.rafId = null;
    this.lastX = 0;
    this.velocity = 0;
    this.timestamp = 0;

    // 绑定方法到实例
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);

    // 初始化
    this.init();
  }

  init() {
    // 设置初始样式
    this.element.style.cursor = "grab";

    // 添加事件监听器
    // 鼠标事件
    this.element.addEventListener("mousedown", this.handleMouseDown);
    this.element.addEventListener("mouseup", this.handleMouseUp);
    this.element.addEventListener("mouseleave", this.handleMouseLeave);
    this.element.addEventListener("mousemove", this.handleMouseMove);

    // 触摸事件
    this.element.addEventListener("touchstart", this.handleTouchStart);
    this.element.addEventListener("touchend", this.handleTouchEnd);
    this.element.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
  }

  // 鼠标事件处理
  handleMouseDown(e) {
    this.isDown = true;
    this.element.style.cursor = "grabbing";
    this.startX = e.pageX - this.element.offsetLeft;
    this.scrollLeft = this.element.scrollLeft;
    this.cancelMomentumTracking();
    this.timestamp = Date.now();
    this.lastX = e.pageX;
    e.preventDefault();
  }

  handleMouseUp() {
    this.isDown = false;
    this.element.style.cursor = "grab";
    this.beginMomentumTracking();
  }

  handleMouseLeave() {
    if (this.isDown) {
      this.isDown = false;
      this.element.style.cursor = "grab";
      this.beginMomentumTracking();
    }
  }

  handleMouseMove(e) {
    if (!this.isDown) return;
    e.preventDefault();
    const x = e.pageX - this.element.offsetLeft;
    const walk = (x - this.startX) * this.config.scrollMultiplier;
    this.element.scrollLeft = this.scrollLeft - walk;

    this.updateVelocity(e.pageX);
  }

  // 触摸事件处理
  handleTouchStart(e) {
    this.isDown = true;
    this.startX = e.touches[0].pageX - this.element.offsetLeft;
    this.scrollLeft = this.element.scrollLeft;
    this.cancelMomentumTracking();
    this.timestamp = Date.now();
    this.lastX = e.touches[0].pageX;
  }

  handleTouchEnd() {
    this.isDown = false;
    this.beginMomentumTracking();
  }

  handleTouchMove(e) {
    if (!this.isDown) return;
    const x = e.touches[0].pageX - this.element.offsetLeft;
    const walk = (x - this.startX) * this.config.scrollMultiplier;
    this.element.scrollLeft = this.scrollLeft - walk;

    this.updateVelocity(e.touches[0].pageX);
    e.preventDefault(); // 防止页面滚动
  }

  // 速度计算
  updateVelocity(currentX) {
    const now = Date.now();
    const dt = now - this.timestamp;
    if (dt > 0) {
      const dx = currentX - this.lastX;
      this.velocity = dx / dt;
    }
    this.timestamp = now;
    this.lastX = currentX;
  }

  // 惯性滚动
  beginMomentumTracking() {
    this.cancelMomentumTracking();
    this.momentum = this.velocity * this.config.momentumMultiplier;

    const momentumLoop = () => {
      if (Math.abs(this.momentum) > this.config.threshold) {
        this.element.scrollLeft -= this.momentum;
        this.momentum *= this.config.frictionFactor;
        this.rafId = requestAnimationFrame(momentumLoop);
      }
    };

    if (Math.abs(this.velocity) > this.config.threshold) {
      this.rafId = requestAnimationFrame(momentumLoop);
    }
  }

  cancelMomentumTracking() {
    this.velocity = 0;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // 销毁方法，移除所有事件监听器
  destroy() {
    this.cancelMomentumTracking();

    // 移除鼠标事件
    this.element.removeEventListener("mousedown", this.handleMouseDown);
    this.element.removeEventListener("mouseup", this.handleMouseUp);
    this.element.removeEventListener("mouseleave", this.handleMouseLeave);
    this.element.removeEventListener("mousemove", this.handleMouseMove);

    // 移除触摸事件
    this.element.removeEventListener("touchstart", this.handleTouchStart);
    this.element.removeEventListener("touchend", this.handleTouchEnd);
    this.element.removeEventListener("touchmove", this.handleTouchMove);

    // 重置样式
    this.element.style.cursor = "";
  }
}


// 使用
/**
 * 
 * document.addEventListener('DOMContentLoaded', function() {
      // 创建拖拽滚动实例
      const dragScroll = new DragScroll('.products-container-grey', {
        scrollMultiplier: 1.5,    // 滚动灵敏度
        momentumMultiplier: 20,   // 惯性系数
        frictionFactor: 0.92      // 摩擦系数，越小减速越快
      });
      
      // 可以在window对象上存储实例，以便需要时访问
      window.dragScroll = dragScroll;
    });
 * 
 * 
 * 
*/
