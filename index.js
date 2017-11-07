"use babel";
/* globals atom */

import { CompositeDisposable, Disposable } from "atom";

export default {

	scrollEditor() {
		const top = this.editor.getScrollTop();
		const bottom = this.editor.getScrollHeight() - this.editor.getHeight();
		const left = this.editor.getScrollLeft();
		const right = this.editor.getScrollWidth() - this.editor.getWidth();

		const diffTop = (this.currentY - this.y);
		let moveTop = 0;
		if (diffTop > this.threshold) {
			moveTop = (diffTop - this.threshold) / this.speed;
		} else if (diffTop < -this.threshold) {
			moveTop = (diffTop + this.threshold) / this.speed;
		}
		const diffLeft = (this.currentX - this.x);
		let moveLeft = 0;
		if (diffLeft > this.threshold) {
			moveLeft = (diffLeft - this.threshold) / this.speed;
		} else if (diffLeft < -this.threshold) {
			moveLeft = (diffLeft + this.threshold) / this.speed;
		}

		let direction = "";
		direction += (moveTop < 0 ? "n" : (moveTop > 0 ? "s" : ""));
		direction += (moveLeft < 0 ? "w" : (moveLeft > 0 ? "e" : ""));
		document.body.setAttribute("data-scroll-direction", direction);

		this.editor.setScrollTop(top + moveTop);
		this.editor.setScrollLeft(left + moveLeft);

		this.animationFrameId = requestAnimationFrame(this.scrollEditor);
	},

	startScroll(editor, e) {
		if (this.editor) {
			this.stopScroll();
		}
		this.editor = editor;
		document.body.classList.add("scroll-editor-on-middle-click-editor");
		this.dot.style.left = e.pageX + "px";
		this.dot.style.top = e.pageY + "px";
		this.dot.classList.remove("hidden");
		this.x = e.pageX;
		this.y = e.pageY;
		this.currentX = e.pageX;
		this.currentY = e.pageY;
		window.addEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
		this.scrollEditor();
	},

	stopScroll() {
		window.removeEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
		cancelAnimationFrame(this.animationFrameId);
		this.animationFrameId = null;
		if (this.dot) {
			this.dot.classList.add("hidden");
		}
		if (this.editor) {
			document.body.removeAttribute("data-scroll-direction");
			document.body.classList.remove("scroll-editor-on-middle-click-editor");
			this.editor = null;
		}
	},

	setCurrent(e) {
		this.currentX = e.pageX;
		this.currentY = e.pageY;
	},

	windowClick(e) {
		let editor;
		if (e.button === 1 && (editor = e.target.closest("atom-text-editor:not([mini])")) && this.editor !== editor) {
			this.startScroll(editor, e);
		} else if (this.editor) {
			this.stopScroll();
		}
	},

	windowMouseDown(e) {
		let editor;
		if (e.button === 1 && (editor = e.target.closest("atom-text-editor:not([mini])")) && this.editor !== editor) {
			this.startScroll(editor, e);
		}
	},

	windowMouseUp(e) {
		if (this.editor) {
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
		this.windowClick = this.windowClick.bind(this);
		this.windowMouseDown = this.windowMouseDown.bind(this);
		this.windowMouseUp = this.windowMouseUp.bind(this);
		this.scrollEditor = this.scrollEditor.bind(this);

		this.createDot();

		this.disposables.add(atom.config.observe("scroll-editor-on-middle-click.speed", (value) => {
			this.speed = value;
		}));

		this.disposables.add(atom.config.observe("scroll-editor-on-middle-click.threshold", (value) => {
			this.threshold = value;
		}));

		this.disposables.add(atom.config.observe("scroll-editor-on-middle-click.holdDown", (value) => {
			if (value) {
				window.removeEventListener("click", this.windowClick, { capture: true, passive: true });
				window.addEventListener("mousedown", this.windowMouseDown, { capture: true, passive: true });
				window.addEventListener("mouseup", this.windowMouseUp, { capture: true, passive: true });
			} else {
				window.addEventListener("click", this.windowClick, { capture: true, passive: true });
				window.removeEventListener("mousedown", this.windowMouseDown, { capture: true, passive: true });
				window.removeEventListener("mouseup", this.windowMouseUp, { capture: true, passive: true });
			}
		}));

		this.disposables.add(new Disposable(() => {
			window.removeEventListener("click", this.windowClick, { capture: true, passive: true });
			window.removeEventListener("mousedown", this.windowMouseDown, { capture: true, passive: true });
			window.removeEventListener("mouseup", this.windowMouseUp, { capture: true, passive: true });
			this.stopScroll();
		}));
	},

	/**
	 * Deactivate package
	 * @return {void}
	 */
	deactivate() {
		this.disposables.dispose();
	},
};
