"use babel";
/* globals atom */

import { CompositeDisposable, Disposable } from "atom";

export default {

	scrollEditor() {
		if (!this.editor) {
			this.running = false;
			return;
		}
		this.running = true;

		const left = this.editor.getScrollLeft();
		const top = this.editor.getScrollTop();
		const right = this.editor.getScrollWidth() - this.editor.getWidth();
		const bottom = this.editor.getScrollHeight() - this.editor.getHeight();

		let nextLeft = left + ((this.currentX - this.x) / this.speed);
		// nextLeft = (nextLeft > right ? right : nextLeft);
		// nextLeft = (nextLeft < 0 ? 0 : nextLeft);

		let nextTop = top + ((this.currentY - this.y) / this.speed);
		// nextTop = (nextTop > bottom ? bottom : nextTop);
		// nextTop = (nextTop < 0 ? 0 : nextTop);

		let dir = "";
		dir += (nextTop < top ? "n" : (nextTop > top ? "s" : ""));
		dir += (nextLeft < left ? "w" : (nextLeft > left ? "e" : ""));
		this.editor.setAttribute("data-dir", dir);

		this.editor.setScrollLeft(nextLeft);
		this.editor.setScrollTop(nextTop);

		requestAnimationFrame(this.scrollEditor);
	},

	startScroll(editor, e) {
		this.editor = editor;
		this.editor.classList.add("scroll-editor-on-middle-click-editor");
		this.dot.style.left = e.pageX + "px";
		this.dot.style.top = e.pageY + "px";
		this.dot.classList.add("show");
		this.x = e.pageX;
		this.y = e.pageY;
		this.currentX = e.pageX;
		this.currentY = e.pageY;
		if (!this.running) {
			window.addEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
			this.scrollEditor();
		}
	},

	stopScroll() {
		window.removeEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
		if (this.dot) {
			this.dot.classList.remove("show");
		}
		if (this.editor) {
			this.editor.removeAttribute("data-dir");
			this.editor.classList.remove("scroll-editor-on-middle-click-editor");
			this.editor = null;
		}
	},

	setCurrent(e) {
		this.currentX = e.pageX;
		this.currentY = e.pageY;
	},

	windowClick(e) {
		if (e.button === 1) {
			const editor = e.target.closest("atom-text-editor:not([mini])");
			if (editor) {
				if (this.editor === editor) {
					this.stopScroll();
				} else {
					if (this.editor) {
						this.editor.classList.remove("scroll-editor-on-middle-click-editor");
					}
					this.startScroll(editor, e);
				}
			} else {
				this.stopScroll();
			}
		} else {
			this.stopScroll();
		}
	},

	createDot() {
		this.dot = document.createElement("div");
		this.dot.classList.add("scroll-editor-on-middle-click-dot");
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
		this.scrollEditor = this.scrollEditor.bind(this);

		this.createDot();
		this.disposables.add(atom.config.observe("scroll-editor-on-middle-click.speed", (value) => {
			this.speed = value;
		}));
		window.addEventListener("click", this.windowClick, { capture: true, passive: true });
		this.disposables.add(new Disposable(() => {
			window.removeEventListener("click", this.windowClick, { capture: true, passive: true });
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
