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
		if (nextLeft < 0) {
			nextLeft = 0;
		} else if (nextLeft > right) {
			nextLeft = right;
		}
		let nextTop = top + ((this.currentY - this.y) / this.speed);
		if (nextTop < 0) {
			nextTop = 0;
		} else if (nextTop > bottom) {
			nextTop = bottom;
		}
		this.editor.setScrollLeft(nextLeft);
		this.editor.setScrollTop(nextTop);
		requestAnimationFrame(this.scrollEditor);
	},

	setCurrent(e) {
		this.currentX = e.pageX;
		this.currentY = e.pageY;
	},

	windowClick(e) {
		if (e.button === 1) {
			const editor = e.target.closest("atom-text-editor");
			if (editor) {
				if (this.editor === editor) {
					editor.style = "";
					this.dot.style.display = "none";
					this.editor = null;
					window.removeEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
				} else {
					editor.style = "cursor: move !important;";
					this.dot.style.left = (e.pageX - this.dotRadius) + "px";
					this.dot.style.top = (e.pageY - this.dotRadius) + "px";
					this.dot.style.display = "";
					this.x = e.pageX;
					this.y = e.pageY;
					this.currentX = e.pageX;
					this.currentY = e.pageY;
					if (this.editor) {
						this.editor.style = "";
						this.editor = editor;
					}
					this.editor = editor;
					if (!this.running) {
						window.addEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
						this.scrollEditor();
					}
				}
			} else if (this.editor) {
				window.removeEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
				this.editor.style = "";
				this.dot.style.display = "none";
				this.editor = null;
			}
		}
	},

	createDot() {
		this.dot = document.createElement("div");
		this.dot.style = "cursor: move; display: none; position: absolute; background-color: #fff; width: " + (this.dotRadius * 2 + 1) + "px; height: " + (this.dotRadius * 2 + 1) + "px; border-radius: 50%;";
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

		this.disposables.add(atom.config.observe("scroll-editor-on-middle-click.speed", (value) => {
			this.speed = value;
		}));
		this.disposables.add(atom.config.observe("scroll-editor-on-middle-click.dotRadius", (value) => {
			this.dotRadius = value;
		}));
		this.createDot();
		this.setCurrent = this.setCurrent.bind(this);
		this.windowClick = this.windowClick.bind(this);
		this.scrollEditor = this.scrollEditor.bind(this);
		window.addEventListener("click", this.windowClick, { capture: true, passive: true });
		this.disposables.add(new Disposable(() => {
			window.removeEventListener("click", this.windowClick, { capture: true, passive: true });
			window.removeEventListener("mousemove", this.setCurrent, { capture: true, passive: true });
			this.editor = null;
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
