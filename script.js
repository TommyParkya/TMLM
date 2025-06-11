var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function UpdateBackgroundBasedOnScrollPosition() {
    if (!document.scrollingElement) return;
    var classes = document.getElementsByClassName("transition-header");
    for (var i = 0; i < classes.length; i++) {
        let delta = document.scrollingElement.scrollTop / 400;
        if (delta > 1)
            delta = 1;
        let opacity = 1 - delta;
        opacity *= 1;
        if (opacity < 0.1)
            opacity = 0.1;
        if (opacity > 1)
            opacity = 1;
        let element = classes[i];
        element.style.opacity = opacity.toString();
        element.style.filter = "blur( " + (delta * 30) + "px )";
    }
}
document.addEventListener("scroll", () => UpdateBackgroundBasedOnScrollPosition());
UpdateBackgroundBasedOnScrollPosition();
class Blocks {
    static ConvertToBlocks(root) {
        var c = root.firstElementChild;
        var replace = [];
        Blocks.CreateTextDivs(root);
        for (var c of root.childNodes) {
            if (c.tagName == "CENTER") {
                for (var child of c.childNodes) {
                    c.parentElement.insertBefore(child, c);
                }
                c.remove();
            }
            Blocks.ClearStyles(c);
        }
        while (true) {
            if (Blocks.CleanupEmptyElement(root.firstElementChild))
                continue;
            if (Blocks.CleanupEmptyElement(root.lastElementChild))
                continue;
            break;
        }
        for (var c = root.firstElementChild; c != null; c = c.nextElementSibling) {
            if (c.tagName == "BR")
                continue;
            if (c.tagName == "H1")
                continue;
            if (c.tagName == "H2")
                continue;
            if (c.tagName == "H3")
                continue;
            if (c.tagName == "UL")
                continue;
            if (c.tagName == "LI")
                continue;
            if (c.tagName == "DIV")
                continue;
            if (c.tagName == "A" && (c.childElementCount != 1 || c.firstElementChild.tagName != "IMG"))
                continue;
            replace.push(c);
        }
        for (let element of replace) {
            let interest = element;
            if (element.tagName == "A")
                interest = element.firstElementChild;
            var block = document.createElement("div");
            block.classList.add("edit-block");
            block.contentEditable = "false";
            if (interest.tagName == "IMG") {
                block.setAttribute("blocktype", "image");
            }
            else if (interest.tagName == "VIDEO") {
                block.setAttribute("blocktype", "video");
            }
            else if (interest.tagName == "GALLERY") {
                block.setAttribute("blocktype", "gallery");
            }
            else {
                block.setAttribute("blocktype", "html");
            }
            root.replaceChild(block, element);
            block.append(element);
        }
    }
    static CreateDivFromNodes(nodes) {
        var div = document.createElement("div");
        div.classList.add("autodiv");
        for (var n of nodes) {
            if (n.nodeType == n.TEXT_NODE) {
                var text = n.textContent;
                text = text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/\n/g, '<br>');
                div.innerHTML += text;
                n.textContent = "";
                continue;
            }
            div.append(n);
        }
        var html = div.innerHTML.trim();
        while (true) {
            if (html.endsWith("<br>")) {
                html = html.substring(0, html.length - 4).trim();
                continue;
            }
            if (html.startsWith("<br>")) {
                html = html.substring(4).trim();
                continue;
            }
            break;
        }
        div.innerHTML = html;
        return div;
    }
    static CreateTextDivs(root) {
        var take = [];
        for (var i = 0; i < root.childNodes.length; i++) {
            var node = root.childNodes[i];
            var element = node;
            if (node.nodeType == node.TEXT_NODE || (node.nodeType == node.ELEMENT_NODE && element.tagName == "A")) {
                take.push(node);
                continue;
            }
            if (take.length > 0) {
                var div = Blocks.CreateDivFromNodes(take);
                node.before(div);
                i--;
            }
            take = [];
        }
        if (take.length > 0) {
            var div = Blocks.CreateDivFromNodes(take);
            root.appendChild(div);
        }
    }
    static CleanupEmptyElement(element) {
        if (element == null)
            return false;
        if (element.tagName == "DIV") {
            if (element.innerHTML.trim() == "" || element.innerHTML.trim() == "<br>") {
                element.remove();
                return true;
            }
        }
        return false;
    }
    static DeactivateIn(element, editor) {
        for (let e of element.getElementsByClassName("edit-block")) {
            let block = e;
            block.onmousedown = null;
            block.onclick = null;
        }
    }
    static ActivateIn(element, editor) {
        for (let e of element.getElementsByClassName("edit-block")) {
            let block = e;
            block.onmousedown = (event) => { editor.ToggleBlock(e); };
            block.onclick = (event) => { event.preventDefault(); event.stopPropagation(); };
        }
    }
    static ClearStyles(e) {
        if (e.removeAttribute == undefined)
            return;
        e.removeAttribute("style");
        for (var child of e.childNodes) {
            Blocks.ClearStyles(child);
        }
    }
}
class EditMode {
    constructor(e) {
        this.plugins = [];
        this.editing = false;
        this.element = e;
        this.element.classList.add("editmode");
        this.element.setAttribute("editmode-active", "true");
        this.targetobject = this.element.getAttribute("targetobject");
        for (let i of this.element.querySelectorAll("[editname]")) {
            Blocks.ConvertToBlocks(i);
            i.style.position = "relative";
            i.addEventListener('input', () => EditMode.PositionFloater());
            if (this.targetobject != null)
                i.setAttribute("editname", this.targetobject + "." + i.getAttribute("editname"));
        }
        for (let c of EditorPlugin.All) {
            var plugin = new c();
            plugin.editor = this;
            plugin.Init();
            this.plugins.push(plugin);
        }
        this.CreateToolbar();
        document.addEventListener('selectionchange', () => this.SelectionChanged());
        window.addEventListener('resize', () => EditMode.PositionFloater());
        this.element.addEventListener("paste", (p) => this.OnPaste(p));
    }
    CreateToolbar() {
        this.toolbar = document.createElement("div");
        this.toolbar.appendChild(document.createElement("div"));
        this.toolbar.appendChild(document.createElement("div"));
        this.toolbar.appendChild(document.createElement("div"));
        this.element.prepend(this.toolbar);
        this.toolbar.classList.add("editmode-toolbar");
        for (let plugin of this.plugins) {
            plugin.BuildToolbar();
        }
    }
    UpdateFields() {
        for (let i of this.element.querySelectorAll("[editname]")) {
            let name = i.getAttribute("editname");
            let type = i.getAttribute("type");
            this.CleanUp(i);
            var input = this.element.querySelector("input[name='" + name + "']");
            if (input == null) {
                input = document.createElement("input");
                input.type = "hidden";
                input.name = name;
                this.element.appendChild(input);
            }
            if (type == "text") {
                input.value = i.textContent;
            }
            else {
                input.value = i.innerHTML.trim();
            }
        }
    }
    SetEditing(editmode) {
        this.editing = editmode;
        this.element.classList.toggle("editmode-editing", this.editing);
        if (this.observer == null) {
            this.observer = new MutationObserver(x => this.UpdateFields());
        }
        for (let i of this.element.querySelectorAll("a.editmode-link")) {
            let a = i;
            if (editmode) {
                a.setAttribute("data-href", a.href);
                a.removeAttribute("href");
            }
            else {
                a.href = a.getAttribute("data-href");
            }
        }
        for (let i of this.element.querySelectorAll("[editname]")) {
            let e = i;
            let name = e.getAttribute("editname");
            if (editmode) {
                e.contentEditable = "true";
                e.onmousedown = event => {
                    this.TryStartEditingAt(e, event.offsetY);
                    event.stopPropagation();
                };
                this.observer.observe(e, { childList: true, subtree: true, characterData: true, attributes: true });
            }
            else {
                e.contentEditable = "false";
                e.onmousedown = null;
            }
        }
        if (this.editing) {
            this.ActivateBlocks();
            this.UpdateFields();
        }
        else {
            EditMode.CloseFloater();
            this.DeactivateBlocks();
            this.observer.disconnect();
        }
    }
    CleanUp(parent) {
        if (parent.hasAttribute("type") && parent.getAttribute("type") == "text")
            return;
        for (let i of parent.querySelectorAll("img")) {
            if (i.src.startsWith("data:")) {
                i.src = "https://files.facepunch.com/garry/087ff6a9-c9ac-45f8-bf8d-270b37482ef4.png";
            }
        }
        for (let i of parent.querySelectorAll(".edit-block")) {
            if (i.parentElement != parent) {
                i.parentElement.before(i);
            }
        }
        for (let i of parent.childNodes) {
            if (i.nodeType == Node.TEXT_NODE && i.innerText != undefined) {
                var sibling = i.nextSibling;
                var container = document.createElement("div");
                i.replaceWith(container);
                container.append(i);
                while (sibling != null && (sibling.nodeType == Node.TEXT_NODE || sibling.nodeName == "A" || sibling.nodeName == "SPAN" || sibling.nodeName == "B" || sibling.nodeName == "I")) {
                    var self = sibling;
                    sibling = sibling.nextSibling;
                    container.append(self);
                }
            }
            if (i.nodeType == Node.ELEMENT_NODE && i.tagName == "P") {
                var container = document.createElement("div");
                i.replaceWith(container);
                container.innerHTML = i.innerHTML;
            }
        }
    }
    TryStartEditingAt(parent, ypos) {
        if (event.target != parent)
            return;
        if (parent.hasAttribute("type") && parent.getAttribute("type") == "text")
            return;
        this.CleanUp(parent);
        var lastAbove = null;
        for (let child of parent.children) {
            var top = child.offsetTop;
            if (top + child.clientHeight * 0.5 < ypos)
                lastAbove = child;
        }
        if (lastAbove != null && lastAbove.isContentEditable) {
            if (lastAbove.innerHTML.trim() == "")
                lastAbove.innerHTML = "<br>";
            this.SelectionChanged(true);
            return;
        }
        if (lastAbove != null && lastAbove.nextSibling != null && lastAbove.nextSibling.isContentEditable) {
            var next = lastAbove.nextSibling;
            if (next.innerHTML.trim() == "")
                next.innerHTML = "<br>";
            this.SelectionChanged(true);
            return;
        }
        if (lastAbove == null) {
            if (parent.firstElementChild != null && parent.firstElementChild.isContentEditable)
                return;
            var input = document.createElement("div");
            input.innerHTML = "<br>";
            parent.prepend(input);
            this.SelectionChanged(true);
            return;
        }
        var input = document.createElement("div");
        input.innerHTML = "<br>";
        lastAbove.after(input);
        this.SelectionChanged(true);
    }
    AddButton(icon, location = 0) {
        var button = document.createElement("a");
        button.classList.add("button");
        button.innerHTML = "<i>" + icon + "</i>";
        this.toolbar.childNodes[location].appendChild(button);
        return button;
    }
    ActivateBlocks() {
        Blocks.ActivateIn(this.element, this);
    }
    DeactivateBlocks() {
        Blocks.DeactivateIn(this.element, this);
    }
    static CloseFloater() {
        if (EditMode.floater != null) {
            EditMode.floater.remove();
            EditMode.floater = null;
        }
        if (EditMode.floaterElement != null) {
            EditMode.floaterElement.classList.remove("selected");
            EditMode.floaterElement = null;
        }
    }
    static PositionFloater() {
        if (EditMode.floater == null)
            return;
        if (EditMode.floaterElement == null)
            return;
        var edRect = EditMode.floaterElement.closest(".editmode").getClientRects();
        var rect = EditMode.floaterElement.getClientRects();
        if(!document.scrollingElement) return;
        var top = document.scrollingElement.scrollTop + rect[0].top - 15;
        var left = document.scrollingElement.scrollLeft + edRect[0].right;
        left = Math.min(left, window.innerWidth - 400 - 32);
        EditMode.floater.style.top = top + "px";
        EditMode.floater.style.left = left + "px";
        EditMode.floater.style.width = (window.innerWidth - left - 40) + "px";
    }
    static CreateFloater(element) {
        EditMode.CloseFloater();
        EditMode.floater = document.createElement("div");
        EditMode.floater.classList.add("editmode-floater");
        if (EditMode.floaterElement == element)
            EditMode.floater.classList.add("open");
        document.body.appendChild(EditMode.floater);
        if (EditMode.floaterElement != element) {
            setTimeout(() => EditMode.floater.classList.add("open"), 5);
        }
        EditMode.floaterElement = element;
        EditMode.PositionFloater();
    }
    ToggleBlock(element) {
        if (EditMode.floaterElement == element) {
            EditMode.CloseFloater();
            return;
        }
        this.OpenBlock(element);
    }
    static FloaterHeader() {
        var container = document.createElement("div");
        container.classList.add("header");
        EditMode.floater.appendChild(container);
    }
    static FloaterHeaderAdd(element) {
        EditMode.floater.firstChild.appendChild(element);
    }
    static FloaterHeaderGrow() {
        var spacer = document.createElement("div");
        spacer.classList.add("grow");
        EditMode.FloaterHeaderAdd(spacer);
    }
    static FloaterHeaderButton(icon, text, func) {
        var button = document.createElement("button");
        button.innerHTML = "<i>" + icon + "</i>";
        button.title = text;
        button.onclick = () => func();
        EditMode.FloaterHeaderAdd(button);
        return button;
    }
    OpenBlock(element) {
        EditMode.CreateFloater(element);
        EditMode.FloaterHeader();
        EditMode.FloaterHeaderButton("delete", "Delete This Block", () => { element.remove(); EditMode.CloseFloater(); });
        EditMode.FloaterHeaderGrow();
        EditMode.FloaterHeaderButton("arrow_upward", "Move Up", () => { this.MoveUp(element); });
        EditMode.FloaterHeaderButton("arrow_downward", "Move Down", () => { this.MoveDown(element); });
        EditMode.FloaterHeaderButton("close", "Close Editor", () => { EditMode.CloseFloater(); });
        element.classList.add("selected");
        for (let plugin of this.plugins) {
            plugin.BlockProperties(element, EditMode.floater);
        }
    }
    SelectionChanged(forced = false) {
        var oldSelection = this.Selected;
        this.Selected = [];
        if (this.editing != true)
            return;
        if (!this.UpdateSelection() && !forced)
            return;
        if (oldSelection != null && oldSelection.length == this.Selected.length && !forced) {
            var same = true;
            for (var i = 0; i < oldSelection.length; i++) {
                same = same && oldSelection[i] == this.Selected[i];
            }
            if (same)
                return;
        }
        for (let plugin of this.plugins) {
            plugin.SelectionChanged();
        }
    }
    MoveUp(element) {
        if (!element.previousElementSibling)
            return;
        element.parentNode.insertBefore(element, element.previousElementSibling);
        EditMode.PositionFloater();
    }
    MoveDown(element) {
        if (!element.nextElementSibling)
            return;
        element.parentNode.insertBefore(element.nextElementSibling, element);
        EditMode.PositionFloater();
    }
    UpdateSelection() {
        var selection = window.getSelection();
        if (selection.rangeCount == 0)
            return false;
        var range = selection.getRangeAt(0);
        if (!this.element.contains(range.commonAncestorContainer))
            return false;
        if (range.commonAncestorContainer.nodeType == 1) {
            var element = range.commonAncestorContainer;
            var allWithinRangeParent = element.getElementsByTagName("*");
            for (let el of allWithinRangeParent) {
                if (el.tagName == "BR")
                    continue;
                if (selection.containsNode(el, true)) {
                    this.Selected.push(el);
                }
            }
        }
        if (this.Selected.length == 0) {
            var node = range.commonAncestorContainer;
            while (node.nodeType != 1)
                node = node.parentNode;
            this.Selected.push(node);
        }
        return true;
    }
    OnPaste(p) {
        if (!p.target.isContentEditable)
            return;
        for (let plugin of this.plugins) {
            if (plugin.OnPaste(p)) {
                p.preventDefault();
                return;
            }
        }
    }
    static Bind() {
        for (let i of document.querySelectorAll("[editmode]")) {
            if (i.getAttribute("editmode-active"))
                continue;
            new EditMode(i);
        }
        if(typeof hljs !== 'undefined') {
            for (let i of document.querySelectorAll("[blocktype=\"code\"]")) {
                var code = i.getAttribute("data-code");
                var language = i.getAttribute("data-language");
                if (language == null)
                    language = "csharp";
                var result = hljs.highlight(code, { language: language });
                i.innerHTML = result.value;
            }
        }
    }
    InSelection(tag) {
        for (let element of this.Selected) {
            if (element.tagName == tag)
                return true;
        }
        return false;
    }
    NextNode(node, skipChildren, endNode) {
        if (endNode == node)
            return null;
        if (node.firstChild && !skipChildren)
            return node.firstChild;
        if (!node.parentNode)
            return null;
        return node.nextSibling || this.NextNode(node.parentNode, true, endNode);
    }
    ;
}
EditorPlugin = { All: [] }; 
document.addEventListener("DOMContentLoaded", EditMode.Bind);
class Lightbox {
    constructor(element) {
        for (let img of element.querySelectorAll("img")) {
            if (!img.complete) {
                img.onload = () => this.BindImage(img);
            }
            else {
                this.BindImage(img);
            }
        }
        for (let video of element.querySelectorAll("video")) {
            this.BindVideo(video);
        }
    }
    BindImage(img) {
        if ((img.naturalWidth - img.width) < 30 && (img.naturalHeight - img.height) < 30)
            return;
        if (img.parentElement.tagName == "A" && img.parentElement.href != img.src)
            return;
        img.classList.add("lightbox-thumbnail");
        img.onclick = e => {
            e.preventDefault();
            this.ViewImage(img);
        };
    }
    BindVideo(video) {
        if (!video.autoplay)
            return;
        video.classList.add("lightbox-thumbnail");
        video.onclick = e => {
            e.preventDefault();
            this.ViewVideo(video);
        };
    }
    ViewImage(img) {
        Lightbox.DeleteViewElement();
        Lightbox.DragX = 0;
        Lightbox.DragY = 0;
        Lightbox.Zoom = 1;
        Lightbox.ViewingElement.style.left = 0 + "px";
        Lightbox.ViewingElement.style.top = 0 + "px";
        Lightbox.ViewingElement.style.transform = null;
        Lightbox.ViewingElement.style.transition = null;
        Lightbox.OverlayImage.classList.add("hidden");
        Lightbox.OverlayImage.src = img.src;
        Lightbox.OverlayImage.onload = () => {
            Lightbox.Overlay.classList.remove("hidden");
            setTimeout(() => Lightbox.OverlayImage.classList.remove("hidden"), 10);
        };
    }
    ViewVideo(img) {
        Lightbox.DeleteViewElement();
        Lightbox.DragX = 0;
        Lightbox.DragY = 0;
        Lightbox.Zoom = 1;
        Lightbox.ViewingElement.style.left = 0 + "px";
        Lightbox.ViewingElement.style.top = 0 + "px";
        Lightbox.ViewingElement.style.transform = null;
        Lightbox.ViewingElement.style.transition = null;
        Lightbox.ClonedElement = img.cloneNode(true);
        Lightbox.ClonedElement.classList.remove("lightbox-thumbnail");
        Lightbox.ClonedElement.style.pointerEvents = "none";
        Lightbox.ViewingElement.appendChild(Lightbox.ClonedElement);
        Lightbox.Overlay.classList.remove("hidden");
    }
    static DeleteViewElement() {
        if (Lightbox.ClonedElement) {
            Lightbox.ClonedElement.remove();
            Lightbox.ClonedElement = null;
        }
        if(Lightbox.OverlayImage) Lightbox.OverlayImage.classList.add("hidden");
    }
    static Bind(element) {
        if (Lightbox.Overlay == null) {
            Lightbox.Overlay = document.createElement("div");
            Lightbox.Overlay.classList.add("hidden");
            Lightbox.Overlay.id = "lightbox";
            Lightbox.Overlay.onclick = () => Lightbox.Overlay.classList.add("hidden");
            Lightbox.Overlay.style.touchAction = "none";
            Lightbox.ViewingElement = document.createElement("div");
            Lightbox.ViewingElement.draggable = false;
            Lightbox.ViewingElement.style.position = "relative";
            Lightbox.OverlayImage = document.createElement("img");
            Lightbox.OverlayImage.draggable = false;
            var dragging = false;
            var dragged = false;
            var touchstart = null;
            Lightbox.ViewingElement.onmousedown = e => { dragging = true; dragged = false; e.preventDefault(); e.stopPropagation(); };
            Lightbox.ViewingElement.ontouchstart = e => { dragging = true; dragged = false; touchstart = e.targetTouches[0]; e.preventDefault(); e.stopPropagation(); };
            Lightbox.ViewingElement.onmouseup = e => { dragging = false; e.preventDefault(); e.stopPropagation(); };
            Lightbox.ViewingElement.onclick = e => { if (dragged) {
                e.preventDefault();
                e.stopPropagation();
            } };
            Lightbox.ViewingElement.append(Lightbox.OverlayImage);
            Lightbox.Overlay.append(Lightbox.ViewingElement);
            document.addEventListener("mousemove", e => {
                if (!dragging) return;
                if (Lightbox.Overlay.classList.contains("hidden")) return;
                Lightbox.DragX += e.movementX;
                Lightbox.DragY += e.movementY;
                Lightbox.ViewingElement.style.left = Lightbox.DragX + "px";
                Lightbox.ViewingElement.style.top = Lightbox.DragY + "px";
                dragged = true;
            });
            document.addEventListener("touchmove", e => {
                if (!dragging) return;
                if (Lightbox.Overlay.classList.contains("hidden")) return;
                if (e.targetTouches.length == 1) {
                    Lightbox.DragX += e.targetTouches[0].clientX - touchstart.clientX;
                    Lightbox.DragY += e.targetTouches[0].clientY - touchstart.clientY;
                    if (Lightbox.DragX != 0 || Lightbox.DragY != 0) {
                        Lightbox.ViewingElement.style.left = Lightbox.DragX + "px";
                        Lightbox.ViewingElement.style.top = Lightbox.DragY + "px";
                        touchstart = e.targetTouches[0];
                        dragged = true;
                    }
                }
                e.preventDefault();
                e.stopPropagation();
            });
            Lightbox.ViewingElement.ontouchend = e => {
                if (!dragged) {
                    Lightbox.Overlay.classList.add("hidden");
                    Lightbox.DeleteViewElement();
                }
                dragging = false;
                e.preventDefault();
                e.stopPropagation();
            };
            document.addEventListener("keydown", e => {
                if (e.key != "Escape") return;
                if (Lightbox.Overlay.classList.contains("hidden")) return;
                Lightbox.Overlay.classList.add("hidden");
                e.preventDefault();
            }, { passive: false });
            document.addEventListener("wheel", e => {
                if (Lightbox.Overlay.classList.contains("hidden")) return;
                e.preventDefault();
                e.stopPropagation();
                Lightbox.Zoom -= e.deltaY * 0.0015 * Lightbox.Zoom;
                if (Lightbox.Zoom < 0.5) Lightbox.Zoom = 0.5;
                if (Lightbox.Zoom > 5) Lightbox.Zoom = 5;
                Lightbox.ViewingElement.style.transition = "transform 0.1s ease-out";
                Lightbox.ViewingElement.style.transform = "scale( " + Lightbox.Zoom + ")";
            }, { passive: false });
            document.body.append(Lightbox.Overlay);
        }
        for (var e of element.querySelectorAll("[using-lightbox], .lightbox-thumbnail")) {
            new Lightbox(e);
        }
    }
}
Lightbox.DragX = 0;
Lightbox.DragY = 0;
Lightbox.Zoom = 1;
document.addEventListener("DOMContentLoaded", () => Lightbox.Bind(document.body));

// --- DYNAMIC MOD BROWSER LOGIC ---

let allModsData = [];
let currentPage = 1;
const MODS_PER_PAGE = 9;

async function getMods() {
    if (allModsData.length > 0) return allModsData;
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    allModsData = await response.json();
    return allModsData;
}

function createPagination(filteredMods, page) {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(filteredMods.length / MODS_PER_PAGE);
    if (totalPages <= 1) return;

    const nav = document.createElement('nav');
    nav.className = 'pagination';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'pagination');

    const prevButton = document.createElement('a');
    prevButton.className = 'pagination-previous';
    prevButton.innerHTML = '<i>arrow_left</i>';
    if (page === 1) {
        prevButton.setAttribute('disabled', true);
    } else {
        prevButton.onclick = () => {
            currentPage--;
            renderPage();
        };
    }

    const nextButton = document.createElement('a');
    nextButton.className = 'pagination-next';
    nextButton.innerHTML = '<i>arrow_right</i>';
    if (page === totalPages) {
        nextButton.setAttribute('disabled', true);
    } else {
        nextButton.onclick = () => {
            currentPage++;
            renderPage();
        };
    }

    const ul = document.createElement('ul');
    ul.className = 'pagination-list';

    // Pagination logic with ellipsis (...)
    const pageLinks = [];
    if (totalPages <= 7) { // Show all pages if 7 or less
        for (let i = 1; i <= totalPages; i++) {
            pageLinks.push(i);
        }
    } else {
        pageLinks.push(1);
        if (page > 3) {
            pageLinks.push('...');
        }
        if (page === 1) {
            pageLinks.push(2, 3);
        } else if (page === totalPages) {
            pageLinks.push(totalPages - 2, totalPages - 1);
        } else {
            pageLinks.push(page - 1, page, page + 1);
        }
        if (page < totalPages - 2) {
            pageLinks.push('...');
        }
        pageLinks.push(totalPages);
    }

    const uniquePageLinks = [...new Set(pageLinks)];

    uniquePageLinks.forEach(p => {
        const li = document.createElement('li');
        if (p === '...') {
            const span = document.createElement('a');
            span.className = 'pagination-link disabled';
            span.textContent = '...';
            li.appendChild(span);
        } else {
            const a = document.createElement('a');
            a.className = 'pagination-link';
            a.textContent = p;
            if (p === page) {
                a.classList.add('is-current');
            }
            a.onclick = () => {
                currentPage = p;
                renderPage();
            };
            li.appendChild(a);
        }
        ul.appendChild(li);
    });

    nav.appendChild(prevButton);
    nav.appendChild(nextButton);
    nav.appendChild(ul);
    paginationContainer.appendChild(nav);
}

function renderMods(mods) {
    const container = document.querySelector('.blog-posts-container');
    container.innerHTML = '';
    
    if (mods.length === 0) {
        container.innerHTML = `<p style="color: #000; text-align: center;">No mods match your search.</p>`;
        return;
    }

    mods.forEach(mod => {
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        
        const date = new Date(mod.uploadDate);
        const displayDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        postElement.innerHTML = `
            <a href="mod.html?id=${mod.id}" class="blog-post-image">
                <img src="${mod.thumbnailUrl}" alt="Mod Thumbnail" onerror="this.onerror=null;this.src='https://files.facepunch.com/lewis/1b1911b115/placeholder2.jpg';">
            </a>
            <div class="blog-post-body">
                <div class="date">
                    <span class="icon"><i>schedule</i></span>
                    <span>${displayDate}</span>
                </div>
                <a href="mod.html?id=${mod.id}">
                    <h1 class="title is-size-4">${mod.title}</h1>
                </a>
                <p class="subtitle is-size-6">${mod.description}</p>
            </div>
        `;
        container.appendChild(postElement);
    });
}

async function renderPage() {
    const allMods = await getMods();
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const gameFilter = document.getElementById('game-filter').value;
    const versionFilter = document.getElementById('version-filter').value;

    let filteredMods = allMods.filter(mod => {
        const title = mod.title.toLowerCase();
        const matchesSearch = title.includes(searchInput);
        const matchesGame = (gameFilter === 'all') || title.includes(gameFilter.toLowerCase());
        const matchesVersion = (versionFilter === 'all') || title.includes(versionFilter.toLowerCase());
        return matchesSearch && matchesGame && matchesVersion;
    });

    const paginatedMods = filteredMods.slice((currentPage - 1) * MODS_PER_PAGE, currentPage * MODS_PER_PAGE);
    
    renderMods(paginatedMods);
    createPagination(filteredMods, currentPage);
    window.scrollTo(0, 0);
}

async function loadIndexPage() {
    const container = document.querySelector('.blog-posts-container');
    if (!container) return;
    
    try {
        await getMods();
        document.getElementById('search-input').addEventListener('input', () => { currentPage = 1; renderPage(); });
        document.getElementById('game-filter').addEventListener('change', () => { currentPage = 1; renderPage(); });
        document.getElementById('version-filter').addEventListener('change', () => { currentPage = 1; renderPage(); });
        renderPage();
    } catch (error) {
        console.error('Failed to load mods:', error);
        container.innerHTML = '<p style="color: #f00; text-align: center;">Failed to load mods. Run the scraper and ensure data.json exists.</p>';
    }
}

async function loadModPage() {
    try {
        const params = new URLSearchParams(window.location.search);
        const modId = params.get('id');
        if (!modId) throw new Error('Mod ID not specified.');

        const mods = await getMods();
        const mod = mods.find(m => m.id === modId);
        if (!mod) throw new Error('Mod not found.');

        document.title = `${mod.title} - Mod Details`;
        document.getElementById('mod-hero-image').style.backgroundImage = `url(${mod.thumbnailUrl})`;
        const date = new Date(mod.uploadDate);
        const displayDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.querySelector('#mod-date').innerHTML = `<span class="icon"><i>schedule</i></span> ${displayDate}`;
        document.getElementById('mod-title').textContent = mod.title;
        document.getElementById('mod-description').textContent = mod.description;
        
        const downloadsContainer = document.getElementById('mod-downloads');
        downloadsContainer.innerHTML = '';
        if (mod.downloadLinks && mod.downloadLinks.length > 0) {
            mod.downloadLinks.forEach(link => {
                const button = document.createElement('a');
                button.href = link.url;
                button.className = 'button is-primary is-medium';
                button.target = '_blank';
                button.rel = 'noopener noreferrer';
                button.textContent = link.displayText;
                downloadsContainer.appendChild(button);
            });
        } else {
            downloadsContainer.innerHTML = '<p>No download links were found for this mod.</p>';
        }
        Lightbox.Bind(document.body);
    } catch (error) {
        console.error('Failed to load mod details:', error);
        document.getElementById('mod-content-container').innerHTML = `<h1>${error.message}</h1>`;
    }
}

function initializeStaticSite() {
    const path = window.location.pathname.split('/').pop();
    if (path === '' || path === 'index.html' || path.startsWith('index.html?')) {
        loadIndexPage();
    } else if (path === 'mod.html' || path.startsWith('mod.html?')) {
        loadModPage();
    }
}

document.addEventListener("DOMContentLoaded", initializeStaticSite);
