/** @babel */

import { CompositeDisposable, Disposable } from "atom";

export default {

	scrollPane() {
		let top;
		if (typeof this.pane.getScrollTop === "function") {
			top = this.pane.getScrollTop();
		} else if (typeof this.pane.scrollTop === "number") {
			top = this.pane.scrollTop;
		}

		let left;
		if (typeof this.pane.getScrollLeft === "function") {
			left = this.pane.getScrollLeft();
		} else if (typeof this.pane.scrollLeft === "number") {
			left = this.pane.scrollLeft;
		}

		const diffTop = (this.currentY - this.y);
		let moveTop = 0;
		if (diffTop > this.threshold) {
			moveTop = Math.round((diffTop - this.threshold) / this.speed);
		} else if (diffTop < -this.threshold) {
			moveTop = Math.round((diffTop + this.threshold) / this.speed);
		}
		const diffLeft = (this.currentX - this.x);
		let moveLeft = 0;
		if (diffLeft > this.threshold) {
			moveLeft = Math.round((diffLeft - this.threshold) / this.speed);
		} else if (diffLeft < -this.threshold) {
			moveLeft = Math.round((diffLeft + this.threshold) / this.speed);
		}

		let direction = "";
		direction += (moveTop < 0 ? "n" : (moveTop > 0 ? "s" : ""));
		direction += (moveLeft < 0 ? "w" : (moveLeft > 0 ? "e" : ""));
		if (direction !== "") {
			this.moving = true;
		}
		document.body.setAttribute("data-scroll-direction", direction);

		if (typeof top === "number") {
			const targetTop = top + moveTop;
			if (typeof this.pane.setScrollTop === "function") {
				this.pane.setScrollTop(targetTop);
			} else if (typeof this.pane.scrollTop === "number") {
				this.pane.scrollTop = targetTop;
			}
		}
		if (typeof left === "number") {
			const targetLeft = left + moveLeft;
			if (typeof this.pane.setScrollLeft === "function") {
				this.pane.setScrollLeft(targetLeft);
			} else if (typeof this.pane.scrollLeft === "number") {
				this.pane.scrollLeft = targetLeft;
			}
		}

		this.animationFrameId = requestAnimationFrame(this.scrollPane);
	},

	startScroll(pane, e) {
		if (this.pane) {
			this.stopScroll();
		}
		this.scrolling = true;
		this.moving = false;
		this.pane = pane;
		document.body.classList.add("scroll-editor-on-middle-click-editor");
		this.dot.style.left = e.pageX + "px";
		this.dot.style.top = e.pageY + "px";
		this.dot.classList.remove("hidden");
		this.x = e.pageX;
		this.y = e.pageY;
		this.currentX = e.pageX;
		this.currentY = e.pageY;
		window.addEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
		this.scrollPane();
	},

	stopScroll() {
		this.scrolling = false;
		this.moving = false;
		window.removeEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
		cancelAnimationFrame(this.animationFrameId);
		this.animationFrameId = null;
		if (this.dot) {
			this.dot.classList.add("hidden");
		}
		if (this.pane) {
			document.body.removeAttribute("data-scroll-direction");
			document.body.classList.remove("scroll-editor-on-middle-click-editor");
			this.pane = null;
		}
	},

	setCurrent(e) {
		this.currentX = e.pageX;
		this.currentY = e.pageY;
	},

	windowMouseDown(e) {
		if (this.scrolling) {
			if (e.button === 1) {
				e.stopPropagation();
			}
			this.stopScroll();
		} else {
			const pane = e.target.closest(
				"atom-text-editor:not([mini]), " +
				".results-view-container, " +
				".settings-view .panels-item, " +
				".tree-view"
			);
			if (
				e.button === 1 &&
				pane &&
				this.pane !== pane
			) {
				e.stopPropagation();
				this.startScroll(pane, e);
			}
		}
	},

	windowMouseUp() {
		if (this.moving && this.pane) {
			this.stopScroll();
		}
	},

	createDot() {
		this.dot = document.createElement("div");
		this.dot.classList.add("scroll-editor-on-middle-click-dot", "hidden");
		document.body.append(this.dot);
		this.disposables.add(new Disposable(() => {
			this.dot.remove();
			this.dot = null;
		}));
	},

	/**
	 * Activate package
	 * @return {void}
	 */
	activate() {
		this.disposables = new CompositeDisposable();

		this.setCurrent = this.setCurrent.bind(this);
		this.windowMouseDown = this.windowMouseDown.bind(this);
		this.windowMouseUp = this.windowMouseUp.bind(this);
		this.scrollPane = this.scrollPane.bind(this);
		this.stopScroll = this.stopScroll.bind(this);

		this.createDot();

		this.disposables.add(atom.config.observe("scroll-editor-on-middle-click.speed", (value) => {
			this.speed = value;
		}));

		this.disposables.add(atom.config.observe("scroll-editor-on-middle-click.threshold", (value) => {
			this.threshold = value;
		}));

		window.addEventListener("mousedown", this.windowMouseDown, { capture: true, passive: true });
		window.addEventListener("mouseup", this.windowMouseUp, { capture: true, passive: true });

		this.disposables.add(new Disposable(() => {
			window.removeEventListener("mousedown", this.windowMouseDown, { capture: true, passive: true });
			window.removeEventListener("mouseup", this.windowMouseUp, { capture: true, passive: true });
			this.stopScroll();
		}));

		this.disposables.add(atom.commands.add("atom-workspace", { "core:cancel": this.stopScroll }));
	},

	/**
	 * Deactivate package
	 * @return {void}
	 */
	deactivate() {
		this.disposables.dispose();
	},
};
