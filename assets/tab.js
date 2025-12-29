/**
 * @typedef {HTMLElement & { dataset: DOMStringMap }} TabsRoot
 */

class TabsController {
  /**
   * @param {TabsRoot} root
   */
  constructor(root) {
    this.root = root;
    /** @type {HTMLElement|null} */
    this.source = root.querySelector(".tabs-source");
    /** @type {HTMLElement|null} */
    this.header = root.querySelector(".tabs");
    /** @type {HTMLElement|null} */
    this.panels = root.querySelector(".tab-panels");
    /** @type {HTMLElement|null} */
    this.glider = this.header ? this.header.querySelector(".glider") : null;
    /** @type {HTMLElement[]} */
    this.items = Array.from(this.source?.querySelectorAll(".tab-item") || []);
    this.activeIndex = 0;
  }

  init() {
    // If no explicit tab-item children (no _tab child blocks), build groups from direct children split by divider
    if ((!this.items || !this.items.length) && this.source) {
      /** @type {HTMLElement[]} */
      const rawChildren = Array.from(this.source.children).filter(
        (n) => n instanceof HTMLElement
      );

      /**
       * @param {HTMLElement} el
       */
      const isDivider = (el) => {
        if (
          el.matches(
            '[data-block-type="_divider"], .divider, [role="separator"]'
          )
        )
          return true;
        if (el.tagName.toLowerCase() === "hr") return true;
        if (el.querySelector && el.querySelector("hr")) return true;
        const handle = el.getAttribute("data-block-handle") || "";
        if (handle.includes("divider")) return true;
        return false;
      };

      /**
       * Try to extract a label from a group of nodes
       * @param {HTMLElement[]} nodes
       */
      const deriveLabel = (nodes) => {
        for (const node of nodes) {
          /** @type {HTMLElement|null} */
          const headingEl = node.querySelector
            ? node.querySelector("h1, h2, h3, h4, h5, h6")
            : null;
          const headingText = headingEl ? headingEl.textContent || "" : "";
          if (headingText && headingText.trim()) return headingText.trim();

          /** @type {HTMLElement|null} */
          const tbEl = node.querySelector
            ? node.querySelector(".text-block, .rte, [data-text]")
            : null;
          const tbText = tbEl ? tbEl.textContent || "" : "";
          if (tbText && tbText.trim()) {
            const firstLine = tbText.trim().split("\n")[0] || "";
            if (firstLine.trim()) return firstLine.trim();
          }

          const nodeText = node.textContent ? node.textContent : "";
          if (nodeText && nodeText.trim()) {
            const first = nodeText.trim().split("\n")[0] || "";
            if (first.trim()) return first.trim();
          }
        }
        return "";
      };

      /** @type {HTMLElement[][]} */
      const groups = /** @type {HTMLElement[][]} */ ([]);
      /** @type {HTMLElement[]} */
      let current = /** @type {HTMLElement[]} */ ([]);
      rawChildren.forEach((node) => {
        if (isDivider(node)) {
          if (current.length) groups.push(current);
          current = /** @type {HTMLElement[]} */ ([]);
        } else {
          current.push(node);
        }
      });
      if (current.length) groups.push(current);

      if (groups.length) {
        const container = document.createElement("div");
        container.className = "tabs-source";
        groups.forEach((nodes, i) => {
          const wrap = document.createElement("div");
          wrap.className = "tab-item";
          if (i === 0) wrap.setAttribute("data-selected", "true");

          const label = document.createElement("span");
          label.className = "tab-label";
          const text = deriveLabel(nodes) || `Tab ${i + 1}`;
          label.textContent = text;
          wrap.appendChild(label);

          const panel = document.createElement("div");
          panel.className = "tab-panel";
          nodes.forEach((n) => panel.appendChild(n));
          wrap.appendChild(panel);

          container.appendChild(wrap);
        });

        if (this.source && this.source.parentElement) {
          this.source.replaceWith(container);
        }
        this.source = container;
        this.items = Array.from(container.querySelectorAll(".tab-item"));
      }
    }

    if (!this.items.length) return;
    if (!this.header || !this.panels) return;

    const header = this.header;
    const panels = this.panels;

    // Build header buttons & move panels

    this.items.forEach((item, index) => {
      const labelEl = item.querySelector(".tab-label");
      const panelEl = item.querySelector(".tab-panel");
      if (!labelEl || !panelEl) return;

      const tabButton = document.createElement("button");
      tabButton.type = "button";
      tabButton.className = "tab";
      tabButton.setAttribute("role", "tab");
      tabButton.setAttribute("aria-selected", "false");
      tabButton.dataset.index = String(index);
      tabButton.innerHTML = labelEl.innerHTML;
      header.appendChild(tabButton);

      const panelId = `panel-${this.root.dataset.tabsId}-${index}`;
      panelEl.classList.add("panel");
      panelEl.id = panelId;
      panelEl.setAttribute("role", "tabpanel");
      panels.appendChild(panelEl);

      // Determine default active index
      if (item.hasAttribute("data-selected")) {
        this.activeIndex = index;
      }
    });

    // Remove source (not needed)
    if (this.source) this.source.remove();

    // Bind events
    /** @param {MouseEvent} e */
    header.addEventListener("click", (e) => {
      /** @type {HTMLElement|null} */
      const btn = e.target instanceof Element ? e.target.closest(".tab") : null;
      if (!btn) return;
      const i = Number(btn.dataset.index);
      this.activate(i);
    });

    window.addEventListener("resize", () => this.positionGlider());

    // Activate initial
    this.activate(this.activeIndex);
  }

  /**
   * @param {number} index
   */
  activate(index) {
    if (!this.header || !this.panels) return;
    const header = this.header;
    const panelsRoot = this.panels;
    /** @type {HTMLElement[]} */
    const buttons = Array.from(header.querySelectorAll(".tab"));
    const panels = Array.from(panelsRoot.querySelectorAll(".panel"));
    buttons.forEach((btn, i) => {
      const isActive = i === index;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });
    panels.forEach((p, i) => p.classList.toggle("is-active", i === index));
    this.activeIndex = index;
    this.positionGlider();

    // Auto-scroll active button into view if overflowed
    const activeBtn = buttons[index];
    if (activeBtn && header) {
      const headerRect = header.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const overLeft = btnRect.left < headerRect.left;
      const overRight = btnRect.right > headerRect.right;
      if (overLeft || overRight) {
        const delta = overLeft
          ? btnRect.left - headerRect.left
          : btnRect.right - headerRect.right;
        header.scrollBy({ left: delta, behavior: "smooth" });
      }
    }
  }

  positionGlider() {
    if (!this.header || !this.glider) return;
    const header = this.header;
    /** @type {HTMLElement[]} */
    const buttons = Array.from(header.querySelectorAll(".tab"));
    const active = buttons[this.activeIndex];
    if (!active) return;
    const left = active.offsetLeft;
    const width = active.offsetWidth;
    const height = active.offsetHeight;
    this.glider.style.width = `${width}px`;
    this.glider.style.height = `${height}px`;
    this.glider.style.transform = `translate(${left}px, -50%)`;
  }
}

function initTabs() {
  /** @type {NodeListOf<HTMLElement>} */
  const roots = /** @type {any} */ (document.querySelectorAll(".tabs-root"));
  roots.forEach((root) =>
    new TabsController(/** @type {TabsRoot} */ (root)).init()
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTabs);
} else {
  initTabs();
}
