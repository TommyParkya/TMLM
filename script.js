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
                text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>');
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
        for (let i of document.querySelectorAll("[blocktype=\"code\"]")) {
            var code = i.getAttribute("data-code");
            var language = i.getAttribute("data-language");
            if (language == null)
                language = "csharp";
            var result = hljs.highlight(code, { language: language });
            i.innerHTML = result.value;
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
document.addEventListener("DOMContentLoaded", EditMode.Bind);
class EditorPlugin {
    static Register(f) {
        EditorPlugin.All.push(f);
    }
    Init() {
    }
    InitFloater() {
    }
    BuildToolbar() {
    }
    SelectionChanged() {
    }
    BlockProperties(element, floater) {
    }
    CreateInput(name, field) {
        var container = document.createElement("div");
        var label = document.createElement("div");
        label.classList.add("label");
        label.innerText = name;
        container.appendChild(label);
        container.appendChild(field);
        EditMode.floater.appendChild(container);
    }
    CreateTextField(name, type = "text", value, onchange) {
        var input = document.createElement("input");
        input.type = type;
        input.value = value;
        input.oninput = () => onchange(input.value);
        this.CreateInput(name, input);
        return input;
    }
    CreateCheckbox(name, value, onchange) {
        var input = document.createElement("input");
        input.type = "checkbox";
        input.checked = value;
        input.oninput = () => onchange(input.checked);
        var label = document.createElement("label");
        label.innerText = name;
        label.prepend(input);
        var container = document.createElement("div");
        container.append(label);
        EditMode.floater.appendChild(container);
        return input;
    }
    CreateTextArea(name, value, onchange) {
        var input = document.createElement("textarea");
        input.value = value;
        input.oninput = () => onchange(input.value);
        this.CreateInput(name, input);
        return input;
    }
    CreateSelect(name, args, value, onchange) {
        var input = document.createElement("select");
        for (let v in args) {
            var option = document.createElement("option");
            option.text = args[v];
            option.value = v;
            input.add(option);
        }
        if (value != null)
            input.value = value;
        input.onchange = () => onchange(input.value);
        this.CreateInput(name, input);
        return input;
    }
    CreateFields(element) {
        for (let node of element.querySelectorAll("[editname]")) {
            let e = node;
            if (e.hasAttribute("editmode"))
                continue;
            var name = e.getAttribute("editname");
            var type = e.getAttribute("type");
            if (type == null)
                type = "text";
            var value = e.getAttribute("value");
            var set;
            if (value == null) {
                value = e.innerText;
                set = (v) => e.innerText = v;
                ;
            }
            else {
                set = (v) => e.setAttribute("value", v);
            }
            if (type == "bool") {
                this.CreateCheckbox(name, value.length > 0, set);
            }
            else if (type == "textarea") {
                this.CreateTextArea(name, value, set);
            }
            else if (type == "select") {
                this.CreateSelect(name, JSON.parse(e.getAttribute("options")), value, set);
            }
            else {
                this.CreateTextField(name, type, value, set);
            }
        }
    }
    OnPaste(p) {
        return false;
    }
}
EditorPlugin.All = [];
let StandardEditorPlugin = class StandardEditorPlugin extends EditorPlugin {
    BuildToolbar() {
        this.bold = this.editor.AddButton("format_bold");
        this.bold.title = "Bold (ctrl + b)";
        this.bold.onclick = () => {
            document.execCommand("bold", false);
        };
        this.code = this.editor.AddButton("format_quote");
        this.code.title = "Quote";
        this.code.onclick = () => {
            document.execCommand("underline");
        };
        this.title = this.editor.AddButton("title");
        this.title.title = "Title";
        this.title.onclick = () => {
            if (this.editor.InSelection("H2")) {
                document.execCommand("formatBlock", false, "p");
            }
            else {
                document.execCommand("formatBlock", false, "h2");
            }
        };
        this.clean = this.editor.AddButton("format_clear");
        this.clean.title = "Clear Formatting";
        this.clean.onclick = () => {
            document.execCommand("removeFormat", false);
            document.execCommand("formatBlock", false, "p");
        };
        this.unorderedList = this.editor.AddButton("format_list_bulleted");
        this.unorderedList.title = "Unordered List";
        this.unorderedList.onclick = () => {
            document.execCommand("insertUnorderedList", false);
        };
    }
    SelectionChanged() {
        if (this.bold == null)
            return;
        if (this.editor.InSelection("H1") || this.editor.InSelection("H2")) {
        }
    }
};
StandardEditorPlugin = __decorate([
    EditorPlugin.Register
], StandardEditorPlugin);
let LinksEditorPlugin = class LinksEditorPlugin extends EditorPlugin {
    Init() {
    }
    BuildToolbar() {
        this.link = this.editor.AddButton("insert_link");
        this.link.title = "Create Link";
        this.link.onclick = () => {
            if (this.editor.InSelection("A")) {
                document.execCommand("unlink", false);
            }
            else {
                if (window.getSelection().type == "Caret")
                    return;
                document.execCommand("createLink", false, "https://google.com/");
            }
        };
    }
    SelectionChanged() {
        if (this.link == null)
            return;
        for (let element of this.editor.Selected) {
            if (element.tagName != "A")
                continue;
            this.editor.OpenBlock(element);
            return;
        }
    }
    BlockProperties(element, floater) {
        this.href = this.CreateTextField("link", "url", element.href, v => element.href = v);
        this.target = this.CreateTextField("target", "target", element.target, v => element.target = v);
    }
};
LinksEditorPlugin = __decorate([
    EditorPlugin.Register
], LinksEditorPlugin);
let EditTogglePlugin = class EditTogglePlugin extends EditorPlugin {
    BuildToolbar() {
        var button = this.editor.AddButton("edit", 2);
        button.onclick = () => this.editor.SetEditing(true);
        button.classList.add("visible-when-not-editing");
        button.classList.add("hidden-when-editing");
        var button = this.editor.AddButton("close", 1);
        button.onclick = () => this.editor.SetEditing(false);
    }
};
EditTogglePlugin = __decorate([
    EditorPlugin.Register
], EditTogglePlugin);
let CodeBlockPlugin = class CodeBlockPlugin extends EditorPlugin {
    BuildToolbar() {
        var button = this.editor.AddButton("code");
        button.title = "Code Block";
        button.onclick = () => {
            document.execCommand("insertHTML", false, "<div data-code=\"\" data-language=\"csharp\" class=\"edit-block\" contenteditable=\"false\" blocktype=\"code\"></div>");
            this.editor.ActivateBlocks();
        };
    }
    BlockProperties(element, floater) {
        if (!element.hasAttribute("blocktype"))
            return;
        if (element.attributes["blocktype"].value != "code")
            return;
        this.CreateTextField("Language", "string", element.getAttribute("data-language"), v => {
            element.setAttribute("class", "edit-block hljs language-" + v);
            element.setAttribute("data-language", v);
        });
        this.CreateTextArea("Raw Code", element.getAttribute("data-code"), v => {
            element.setAttribute("data-code", v);
            element.innerText = v;
        });
    }
};
CodeBlockPlugin = __decorate([
    EditorPlugin.Register
], CodeBlockPlugin);
let GalleryBlockPlugin = class GalleryBlockPlugin extends EditorPlugin {
    BuildToolbar() {
        var button = this.editor.AddButton("photo_library");
        button.title = "Gallery Block";
        button.onclick = () => {
            document.execCommand("insertHTML", false, "<div class=\"edit-block\" contenteditable=\"false\" blocktype=\"gallery\"><gallery><img src=\"https://files.facepunch.com/garry/d7f953f0-4bb4-40fd-b583-d1ebc5d049cd.png\"><img src=\"https://files.facepunch.com/garry/d7f953f0-4bb4-40fd-b583-d1ebc5d049cd.png\"><img src=\"https://files.facepunch.com/garry/6f553c19-f4c4-4b3e-9191-12e1a690bf08.png\"><img src=\"https://files.facepunch.com/garry/d7f953f0-4bb4-40fd-b583-d1ebc5d049cd.png\"></gallery></div>");
            this.editor.ActivateBlocks();
        };
    }
    BlockProperties(element, floater) {
        if (!element.hasAttribute("blocktype"))
            return;
        if (element.attributes["blocktype"].value != "gallery")
            return;
        var img = element.querySelectorAll("img");
        var gallery = element.querySelector("gallery");
        var images = "";
        for (let i of img) {
            images += i.src + "\n";
        }
        this.CreateTextArea("Images", images, (v) => this.SetImages(gallery, v));
        this.CreateSelect("Style", { default: "Default", columns: "Columns", rows: "Rows", small: "Small", medium: "Medium", smallgrid: "Small Grid", grid: " Grid" }, gallery.getAttribute("data-gallery-style"), val => {
            gallery.setAttribute("data-gallery-style", val);
        });
        this.CreateSelect("Image Alignment", { default: "Center", top: "Top", bottom: "Bottom" }, gallery.getAttribute("data-gallery-alignment"), val => {
            gallery.setAttribute("data-gallery-alignment", val);
        });
    }
    SetImages(element, v) {
        var img = element.querySelectorAll("img");
        for (let i of img)
            i.remove();
        var lines = v.split("\n");
        for (let line of lines) {
            if (line.length < 5)
                continue;
            line = line.trim();
            var image = document.createElement("img");
            image.src = line;
            element.append(image);
        }
    }
};
GalleryBlockPlugin = __decorate([
    EditorPlugin.Register
], GalleryBlockPlugin);
let HtmlBlockPlugin = class HtmlBlockPlugin extends EditorPlugin {
    BuildToolbar() {
        var button = this.editor.AddButton("integration_instructions");
        button.title = "Html Block";
        button.onclick = () => {
            document.execCommand("insertHTML", false, "<div class=\"edit-block\" contenteditable=\"false\" blocktype=\"html\"><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div></div>");
            this.editor.ActivateBlocks();
        };
    }
    BlockProperties(element, floater) {
        if (!element.hasAttribute("blocktype"))
            return;
        if (element.attributes["blocktype"].value != "html")
            return;
        this.CreateTextArea("Raw Html", element.innerHTML, v => element.innerHTML = v);
    }
};
HtmlBlockPlugin = __decorate([
    EditorPlugin.Register
], HtmlBlockPlugin);
let ImageBlockPlugin = class ImageBlockPlugin extends EditorPlugin {
    BuildToolbar() {
        var button = this.editor.AddButton("image");
        button.title = "Image Block";
        button.onclick = () => {
            document.execCommand("insertHTML", false, "<div class=\"edit-block\" contenteditable=\"false\" blocktype=\"image\" data-image-style=\"none\"><img src=\"https://files.facepunch.com/lewis/1b1911b115/placeholder2.jpg\"></div>");
            this.editor.ActivateBlocks();
        };
    }
    BlockProperties(element, floater) {
        if (!element.hasAttribute("blocktype"))
            return;
        if (element.attributes["blocktype"].value != "image")
            return;
        var img = element.querySelector("img");
        var a = element.querySelector("a");
        this.CreateTextField("Image Url", "url", img.src, (v) => img.src = v);
        this.CreateTextField("Link (optional)", "url", a == null ? "" : a.href, (v) => this.SetLink(element, v));
        this.CreateTextField("Caption (optional)", "caption", element.title, (v) => element.title = v);
        this.CreateSelect("Style", { none: "None", slim: "Slim", fullwidth: "Full Width", floatl: "Float Left", floatr: "Float Right" }, element.getAttribute("data-image-style"), val => {
            if (val == null || val == "") {
                element.setAttribute("data-image-style", "None");
            }
            else {
                element.setAttribute("data-image-style", val);
            }
        });
    }
    SetLink(element, v) {
        var a = element.querySelector("a");
        var img = element.querySelector("img");
        if (v == null || v == "") {
            if (img.parentElement == a)
                element.append(img);
            if (a != null)
                a.remove();
        }
        else {
            if (a == null) {
                a = document.createElement("a");
                element.append(a);
                a.append(img);
            }
            a.href = v;
        }
    }
    OnPaste(p) {
        var data = p.clipboardData.getData("text");
        if (data == null)
            return false;
        if (!data.startsWith("http"))
            return false;
        if (!data.endsWith(".png") && !data.endsWith(".gif") && !data.endsWith(".jpg") && !data.endsWith(".jpeg"))
            return false;
        if (data.includes("\n") || data.includes("\""))
            return false;
        document.execCommand("insertHTML", false, "<div class=\"edit-block\" contenteditable=\"false\" blocktype=\"image\"><img src=\"" + data + "\"></div>");
        this.editor.ActivateBlocks();
        return true;
    }
};
ImageBlockPlugin = __decorate([
    EditorPlugin.Register
], ImageBlockPlugin);
let TextBlockPlugin = class TextBlockPlugin extends EditorPlugin {
    BuildToolbar() {
        var button = this.editor.AddButton("notes");
        button.title = "Append Text Block";
        button.onclick = () => {
            const content = this.editor.element.querySelector(".content");
            if (!content)
                return;
            const div = document.createElement("div");
            div.innerHTML = "<div>New Text Block</div>";
            content.appendChild(div);
            this.editor.ActivateBlocks();
        };
    }
    SelectionChanged() {
        if (this.editor.Selected == null)
            return;
        if (this.editor.Selected.length != 1)
            return;
        return;
        var element = this.editor.Selected[0];
        if (element.tagName != "DIV")
            return;
        if (element.hasAttribute("blocktype"))
            return;
        if (element.getAttribute("type") == "text")
            return;
        console.log(element);
        EditMode.CreateFloater(element);
        EditMode.FloaterHeader();
        EditMode.FloaterHeaderButton("delete", "Delete This Block", () => { element.remove(); EditMode.CloseFloater(); });
        EditMode.FloaterHeaderGrow();
        EditMode.FloaterHeaderButton("close", "Close Editor", () => { EditMode.CloseFloater(); });
    }
};
TextBlockPlugin = __decorate([
    EditorPlugin.Register
], TextBlockPlugin);
let VideoBlockPlugin = class VideoBlockPlugin extends EditorPlugin {
    BuildToolbar() {
        var button = this.editor.AddButton("videocam");
        button.title = "Video Block";
        button.onclick = () => {
            document.execCommand("insertHTML", false, "<div class=\"edit-block\" contenteditable=\"false\" blocktype=\"video\"><video autoplay muted loop playsinline><source src=\"https://files.facepunch.com/garry/08ad9e5a-f7f3-4e54-bd6e-b23434ba4f5e.mp4\" type=\"video/mp4\"></video></div>");
            this.editor.ActivateBlocks();
        };
    }
    BlockProperties(element, floater) {
        if (!element.hasAttribute("blocktype"))
            return;
        if (element.attributes["blocktype"].value != "video")
            return;
        var video = element.querySelector("video");
        this.CreateTextField("Video Url", "url", video.src, (v) => video.src = v);
        this.CreateTextField("Caption (optional)", "caption", element.title, (v) => element.title = v);
        this.CreateTextField("Poster (optional)", "poster", video.poster, (v) => video.poster = v);
        this.CreateCheckbox("Autoplay", video.autoplay, x => {
            if (!x) {
                video.removeAttribute("muted");
                video.pause();
                video.currentTime = 0;
            }
            else {
                video.setAttribute("muted", "true");
                video.muted = true;
                video.play();
            }
            video.autoplay = x;
            video.loop = x;
            video.muted = x;
            video.controls = !x;
        });
    }
    OnPaste(p) {
        var data = p.clipboardData.getData("text");
        if (data == null)
            return false;
        if (!data.startsWith("http"))
            return false;
        if (!data.endsWith(".mp4"))
            return false;
        if (data.includes("\n") || data.includes("\""))
            return false;
        document.execCommand("insertHTML", false, "<div class=\"edit-block\" contenteditable=\"false\" blocktype=\"video\"><video autoplay muted loop playsinline><source src=\"" + data + "\" type=\"video/mp4\"></video></div>");
        this.editor.ActivateBlocks();
        return true;
    }
};
VideoBlockPlugin = __decorate([
    EditorPlugin.Register
], VideoBlockPlugin);
class Likes {
    constructor(host, element) {
        this.Handler = "AddLike";
        this.Element = element;
        this.Id = parseInt(host.getAttribute("like-id"));
        if (host.hasAttribute("like-handler"))
            this.Handler = host.getAttribute("like-handler");
        this.BindButtons();
    }
    BindButtons() {
        var currentVote = localStorage.getItem('vote_' + this.Id + '_' + this.Handler);
        for (let button of this.Element.querySelectorAll("[like-type]")) {
            let id = button.getAttribute("like-type");
            button.onclick = e => this.HandleClick(parseInt(id));
            if (currentVote == id) {
                button.classList.add("current");
            }
        }
    }
    HandleClick(likeType) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Element.classList.add("loading");
            var data = new URLSearchParams();
            data.set("id", this.Id.toString());
            data.set("like", likeType.toString());
            var response = yield fetch("?handler=" + this.Handler, {
                method: "POST",
                body: data,
                headers: { "RequestVerificationToken": window["RequestToken"] }
            });
            this.Element.classList.remove("loading");
            this.Element.classList.remove("justvoted");
            if (response.ok) {
                localStorage.setItem('vote_' + this.Id + '_' + this.Handler, likeType.toString());
                var html = yield response.text();
                this.Element.innerHTML = html;
                this.BindButtons();
                this.Element.classList.add("justvoted");
            }
            else {
                this.Element.innerHTML = "<div class=\"message\">error :(</div>";
            }
        });
    }
    static Bind() {
        for (let element of document.querySelectorAll(".likes")) {
            var host = element.closest("[like-id]");
            if (host == null)
                continue;
            new Likes(host, element);
        }
    }
}
document.addEventListener("DOMContentLoaded", Likes.Bind);
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
        Lightbox.OverlayImage.classList.add("hidden");
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
                if (!dragging)
                    return;
                if (Lightbox.Overlay.classList.contains("hidden"))
                    return;
                Lightbox.DragX += e.movementX;
                Lightbox.DragY += e.movementY;
                Lightbox.ViewingElement.style.left = Lightbox.DragX + "px";
                Lightbox.ViewingElement.style.top = Lightbox.DragY + "px";
                dragged = true;
            });
            document.addEventListener("touchmove", e => {
                if (!dragging)
                    return;
                if (Lightbox.Overlay.classList.contains("hidden"))
                    return;
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
                if (e.key != "Escape")
                    return;
                if (Lightbox.Overlay.classList.contains("hidden"))
                    return;
                Lightbox.Overlay.classList.add("hidden");
                e.preventDefault();
            }, { passive: false });
            document.addEventListener("wheel", e => {
                if (Lightbox.Overlay.classList.contains("hidden"))
                    return;
                e.preventDefault();
                e.stopPropagation();
                Lightbox.Zoom -= e.deltaY * 0.0015 * Lightbox.Zoom;
                if (Lightbox.Zoom < 0.5)
                    Lightbox.Zoom = 0.5;
                if (Lightbox.Zoom > 5)
                    Lightbox.Zoom = 5;
                Lightbox.ViewingElement.style.transition = "transform 0.1s ease-out";
                Lightbox.ViewingElement.style.transform = "scale( " + Lightbox.Zoom + ")";
            }, { passive: false });
            document.body.append(Lightbox.Overlay);
        }
        for (var e of element.querySelectorAll("[using-lightbox]")) {
            new Lightbox(e);
        }
    }
}
Lightbox.DragX = 0;
Lightbox.DragY = 0;
Lightbox.Zoom = 1;
document.addEventListener("DOMContentLoaded", () => Lightbox.Bind(document.body));
console.log("LightBox 1.0");
function FixTextAreaSize(ta) {
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
}
var allTextareas = document.getElementsByTagName("textarea");
for (var i = 0; i < allTextareas.length; i++) {
    let ta = allTextareas[i];
    if (!ta.hasAttribute("autoheight"))
        continue;
    if (ta.getAttribute("autoheight") == "")
        continue;
    if (ta.getAttribute("autoheight") == "False")
        continue;
    ta.addEventListener("input", function () { FixTextAreaSize(ta); });
    FixTextAreaSize(ta);
}

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
