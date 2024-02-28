const FILE_TYPES = ["png", "mp3", "doc", "js"];

const trigger = document.querySelector(".pane_trigger"),
    aside = document.querySelector(".aside_pane"),
    main = document.querySelector(".main_pane"),
    breadcrumb = document.querySelector(".breadcrumb"),
    content_container = document.getElementById("content_container"),
    collapse = document.getElementById("collapse"),
    quantity = document.querySelector('.quantity');

let isResizing = false,
    isHover = false,
    startX,
    initialWidth;

document.addEventListener("mouseup", (event) => {
    if (isResizing) {
        isResizing = false;
    }

    if (!isHover) {
        trigger.classList.remove("active");
    }
});

trigger.addEventListener("mousedown", (event) => {
    isResizing = true;
    event.target.classList.add("active");

    startX = event.pageX;
    initialWidth = aside.offsetWidth;
});

trigger.addEventListener("mouseover", (event) => {
    if (!isResizing) {
        event.target.classList.add("active");
    }

    isHover = true;
});

trigger.addEventListener("mouseleave", (event) => {
    if (!isResizing) {
        event.target.classList.remove("active");
    }

    isHover = false;
});

document.addEventListener("mousemove", (event) => {
    event.preventDefault();

    if (isResizing) {
        const newWidth =
            event.pageX <= 50
                ? 0
                : Math.min(
                      Math.max(initialWidth + (event.pageX - startX), 150),
                      500
                  );

        aside.style.width = newWidth + "px";
        trigger.style.left = newWidth - 3 + "px";
        main.style.width = `calc(100% - ${newWidth}px)`;
    }
});

function generateRandomName(prefix = "") {
    let dict = "abcdefghijklmnopqrstuvwxyz1234567890",
        name = "";

    for (let i = 0; i <= 1 + Math.floor(Math.random() * 21); i++) {
        name += dict[Math.floor(Math.random() * 36)];
    }

    return `${prefix}/${name}`;
}

function generateRandomType(...array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateStructure(rootName = "Root", depth = 3, maxChildren = 4) {
    const generateChildren = (folder, currentDepth) => {
        if (currentDepth >= depth) {
            return [];
        }

        const numChildren = Math.floor(Math.random() * maxChildren);
        const children = Array.from({ length: numChildren }, (_, index) => {
            const type = generateRandomType(...FILE_TYPES, "dir"),
                name = generateRandomName(folder),
                child = {
                    name,
                    type,
                };

            if (type === "dir") {
                child.children = generateChildren(name, currentDepth + 1);
            }

            return child;
        });

        children.sort((a, b) => a.name.localeCompare(b.name));

        const folders = children.filter((el) => el.type === "dir"),
            files = children.filter((el) => el.type !== "dir");

        return [...folders, ...files];
    };

    return {
        name: rootName,
        type: "dir",
        children: generateChildren(rootName, 0),
    };
}

function generateBreadcrumb(text, parent) {
    const break_node = document.createElement("li");
    break_node.className = "breadcrumb_item";
    break_node.textContent = text;
    parent.appendChild(break_node);

    return break_node;
}

function attachEvents(breaks) {
    const elements = document.querySelectorAll(".breadcrumb_item");

    elements.forEach((el, index) => {
        el.addEventListener("click", (e) => {
            selectActiveFolder(
                Array.from(document.querySelectorAll(".folder")),
                breaks.slice(0, index + 1).join("/")
            );

            breadcrumb.innerHTML = "";

            breaks.slice(0, index + 1).forEach((el, index) => {
                const event_node = generateBreadcrumb(el, breadcrumb);
            });

            insertContent(
                getContent(el.textContent, structure),
                content_container
            );

            attachEvents(breaks);

        });
    });
}

function selectActiveFolder(nameArray, path) {
    nameArray.forEach((el) => {
        el.classList.remove("active");

        if (el.dataset.path === path) {
            el.classList.add("active");
        }
    });
 
    displayNumberOfFilesInActiveFolder(path);
}

function displayNumberOfFilesInActiveFolder(pathArg){
    let folderContent = getContent(pathArg.split("/").pop(), structure);
    if (folderContent) {
        let numberOfFiles = folderContent.filter(el => el.type !== 'dir').length;
        quantity.innerHTML = `${numberOfFiles} item`;
        quantity.innerHTML += (numberOfFiles > 1) ? 's' : '';
    } else {
        quantity.innerHTML = '';
    }
}

function createFolderView(data, parentElement) {
    const ul = document.createElement("ul");

    if (parentElement !== document.querySelector(".pane_structure")) {
        ul.style.display = "none";
    }

    parentElement.appendChild(ul);

    data.children.forEach((child) => {
        const li = document.createElement("li");
        ul.appendChild(li);

        const folderName = document.createElement("span");

        // if (child?.children?.length > 0) {           //    !!!!!!!!!!!!!!
        if (child.type === "dir") {
            const arrowFolder = document.createElement("i");

            arrowFolder.classList.add("folder_arrow");
            folderName.appendChild(arrowFolder);
        }

        let icon = `<div class="icon" style="background-image:${
            FILE_TYPES.includes(child.type)
                ? `url('./img/${child.type}.png')`
                : `url('./img/folder.png')`
        }"></div>`;

        folderName.innerHTML +=
            icon +
            child.name.split("/").pop() +
            (FILE_TYPES.includes(child.type) ? `.${child.type}` : "");
        folderName.className = "folder";
        folderName.dataset.path = child.name;

        li.appendChild(folderName);

        folderName.addEventListener("dblclick", (event) => {
            if (
                child.type === "dir" &&
                !Array.from(event.target.classList).includes("folder_arrow")
            ) {
                let folderName = child.name.split("/").pop();

                selectActiveFolder(
                    Array.from(document.querySelectorAll(".folder")),
                    child.name
                );

                insertContent(
                    getContent(folderName, structure),
                    content_container
                );

                const breaks = child.name.split("/");
                breadcrumb.innerHTML = "";

                breaks.forEach((el, index) => {
                    const break_node = generateBreadcrumb(el, breadcrumb);
                });

                attachEvents(breaks);
            }
        });

        if (child?.children?.length > 0) {
            createFolderView(child, li);
        }

        li.querySelector("i")?.addEventListener("click", (event) => {
            li.querySelector("i")?.classList.toggle("open");
            const sublist = li.querySelector("ul");

            if (sublist) {
                sublist.style.display =
                    sublist.style.display === "none" ? "flex" : "none";
            }
        });
    });
}

const structure = generateStructure("Root", 5, 20);
createFolderView(structure, document.querySelector(".pane_structure"));

function insertContent(content, parent) {
    const folder_container = parent.querySelector("#content_container-folder"),
        file_container = parent.querySelector("#content_container-file");

    folder_container.innerHTML = "";
    file_container.innerHTML = "";

    if (Array.isArray(content) && content.length > 0) {
        for (let item of content) {
            const el = document.createElement("div");
            el.className = "content_element";

            let folderInfoSpan = "";
            if (item.type === "dir") {
                folderInfoSpan = `<span class="content_element-amount" style="direction: ltr">${
                    item.children.length
                } item${item.children.length > 1 ? "s" : ""}</span>`;
            }

            const contentHtml = `
                <img src="${
                    FILE_TYPES.includes(item.type)
                        ? `./img/${item.type}.png`
                        : "./img/folder.png"
                }" alt="manager_icon" class="content_element-image"/>
                <p class="content_element-name">${
                    item.name.split("/").pop() +
                    (item.type !== "dir" ? "." + item.type : "")
                }
                    ${folderInfoSpan}
                </p>
            `;

            el.innerHTML = contentHtml;

            if (item.type === "dir") {
                el.addEventListener("dblclick", (event) => {
                    selectActiveFolder(
                        Array.from(document.querySelectorAll(".folder")),
                        item.name
                    );

                    insertContent(
                        getContent(item.name.split("/").pop(), structure),
                        content_container
                    );

                    const breaks = item.name.split("/");
                    breadcrumb.innerHTML = "";

                    breaks.forEach((el, index) => {
                        const break_node = generateBreadcrumb(el, breadcrumb);
                    });
                    attachEvents(breaks);
                });
                               
            }

            if (item.type === "dir") folder_container.appendChild(el);
            else file_container.appendChild(el);
        }

        if (content.every((el) => el.type !== "dir")) {
            folder_container.style.display = "none";
            parent.style.gap = "0px";
        } else {
            folder_container.style.display = "flex";
            parent.style.gap = "20px";
        }
    }
}

function getContent(nameArg, obj) {
    const folder = obj.children.find(
        (el) => el.type === "dir" && el.name.split("/").pop() === nameArg
    );

    if (folder) return folder.children;

    for (const el of obj.children) {
        if (el.type === "dir") {
            const content = getContent(nameArg, el);
            if (content) return content;
        }
    }

    return null;
}



collapse.addEventListener("click", () => {
    const openFlexContainer = Array.from(
        document.querySelectorAll('ul ul[style*="display: flex"]')
    );
    const openArrows = Array.from(document.querySelectorAll(".folder i.open"));
    openFlexContainer.forEach((item, index) => {
        item.style.display = "none";
        openArrows[index].classList.remove("open");
    });
});


let timeoutId;

document.querySelector(".pane_structure").addEventListener('wheel', (e) => {

    if(e.deltaX > 0){
        return;
    }

    e.target.closest('.pane_structure').classList.add('scrollable');

    if(timeoutId){
        clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
        e.target.closest('.pane_structure').classList.remove('scrollable');
    }, 1500);
})