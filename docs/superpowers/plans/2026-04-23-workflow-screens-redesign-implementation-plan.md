# Workflow Screens Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `Workflow Screens` in `ui.pen` so the five workflow mockups match the five supplied reference PNGs while leaving `Eng Copilot Landing` untouched.

**Architecture:** Modify only `ui.pen`. Keep top-level frame `2q1F1` (`Eng Copilot Landing`) unchanged, replace the current children of `O9PRB` (`Workflow Screens`) with five new 1448x1086 artboards, then rebuild each screen directly from its paired reference image. Validation is visual, using Pencil screenshots and layout snapshots instead of automated tests.

**Tech Stack:** Pencil `.pen` document editing, Pencil MCP read/write/screenshot tools, git, macOS reference PNGs in `/Users/erpang/Downloads`

---

## File Structure And Responsibilities

- Modify: `ui.pen`
  - top-level frame `2q1F1` = protected landing page; do not edit
  - top-level frame `O9PRB` = workflow container to rebuild
  - current workflow children `WMirH` and `cpDSQ` = old layout rows to delete
- Reference only: `docs/superpowers/specs/2026-04-23-workflow-screens-redesign-design.md`
- Reference only: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_45 PM (1).png`
- Reference only: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_45 PM (2).png`
- Reference only: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_46 PM (3).png`
- Reference only: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_46 PM (4).png`
- Reference only: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_46 PM (5).png`

## Reference Mapping

- `(1).png` → `Reader`
- `(2).png` → `Reader - Comments Open`
- `(3).png` → `Documents`
- `(4).png` → `Shared Reader`
- `(5).png` → `Word Lists`

All five PNGs are `1448x1086`. Build each workflow artboard to that exact size.

## Implementation Notes

- Prefer direct frame/text/rectangle composition over reusable component instances.
- Use the screenshot as the source of truth for copy, spacing, and hierarchy.
- Before each screen task, resolve the current target frame by name with `pencil-batch_get`; do not assume IDs from a previous run.
- After each screen task, capture a Pencil screenshot of the changed frame and compare it to the paired PNG before committing.
- Do not commit the PNGs or any exported comparison images.

### Task 1: Replace The Workflow Scaffold

**Files:**
- Modify: `ui.pen`
- Reference: `docs/superpowers/specs/2026-04-23-workflow-screens-redesign-design.md`

- [ ] **Step 1: Read the protected and editable top-level frames**

```json
{
  "tool": "pencil-batch_get",
  "filePath": "/Users/erpang/GitHubProjects/eng-copilot/ui.pen",
  "nodeIds": ["2q1F1", "O9PRB"],
  "readDepth": 2,
  "resolveVariables": true
}
```

Expected: `2q1F1` is `Eng Copilot Landing`, `O9PRB` is `Workflow Screens`, and the old workflow rows `WMirH` and `cpDSQ` still exist under `O9PRB`.

- [ ] **Step 2: Replace the old rows with five empty 1448x1086 artboards**

```javascript
U("O9PRB",{layout:"horizontal",gap:80,width:7560,height:1086})
D("WMirH")
D("cpDSQ")
reader=I("O9PRB",{type:"frame",name:"Reader",width:1448,height:1086,fill:"#F6F6F3",stroke:{fill:"#D9DDD4",thickness:1}})
comments=I("O9PRB",{type:"frame",name:"Reader - Comments Open",width:1448,height:1086,fill:"#F6F6F3",stroke:{fill:"#D9DDD4",thickness:1}})
documents=I("O9PRB",{type:"frame",name:"Documents",width:1448,height:1086,fill:"#F6F6F3",stroke:{fill:"#D9DDD4",thickness:1}})
shared=I("O9PRB",{type:"frame",name:"Shared Reader",width:1448,height:1086,fill:"#F6F6F3",stroke:{fill:"#D9DDD4",thickness:1}})
words=I("O9PRB",{type:"frame",name:"Word Lists",width:1448,height:1086,fill:"#F6F6F3",stroke:{fill:"#D9DDD4",thickness:1}})
```

- [ ] **Step 3: Verify the scaffold and the protected landing frame**

```json
{
  "tool": "pencil-batch_get",
  "filePath": "/Users/erpang/GitHubProjects/eng-copilot/ui.pen",
  "nodeIds": ["2q1F1", "O9PRB"],
  "readDepth": 2,
  "resolveVariables": true
}
```

Expected: `2q1F1` is unchanged and `O9PRB` contains exactly five direct children named `Reader`, `Reader - Comments Open`, `Documents`, `Shared Reader`, and `Word Lists`.

- [ ] **Step 4: Commit the scaffold**

```bash
git add ui.pen
git commit -m "design: rebuild workflow screen scaffold" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 2: Build The Reader Screen

**Files:**
- Modify: `ui.pen`
- Reference: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_45 PM (1).png`

- [ ] **Step 1: Resolve the `Reader` frame by name**

```json
{
  "tool": "pencil-batch_get",
  "filePath": "/Users/erpang/GitHubProjects/eng-copilot/ui.pen",
  "parentId": "O9PRB",
  "patterns": [{ "name": "^Reader$" }],
  "searchDepth": 1,
  "readDepth": 1,
  "resolveVariables": true
}
```

Expected: one direct child frame named `Reader`.
Record its `id` as `readerId` for the rest of this task.

- [ ] **Step 2: Build the Reader layout from the screenshot**

```javascript
U(readerId,{layout:"vertical",gap:20,padding:[24,24,24,24],fill:"#F6F6F3"})
pageChrome=I(readerId,{type:"frame",name:"pageChrome",layout:"vertical",gap:20,width:"fill_container",height:"fill_container"})
topBar=I(pageChrome,{type:"frame",name:"topBar",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:64,padding:[14,18,14,18],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:18})
workspace=I(pageChrome,{type:"frame",name:"workspace",layout:"horizontal",gap:20,width:"fill_container",height:"fill_container"})
leftRail=I(workspace,{type:"frame",name:"leftRail",layout:"vertical",gap:16,width:276,height:"fill_container"})
uploadCard=I(leftRail,{type:"frame",name:"uploadCard",layout:"vertical",gap:10,width:"fill_container",height:124,padding:[18,18,18,18],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
libraryCard=I(leftRail,{type:"frame",name:"libraryCard",layout:"vertical",gap:12,width:"fill_container",height:"fill_container",padding:[18,18,18,18],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
centerColumn=I(workspace,{type:"frame",name:"centerColumn",layout:"vertical",gap:16,width:"fill_container",height:"fill_container"})
docHeader=I(centerColumn,{type:"frame",name:"docHeader",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:72,padding:[18,22,18,22],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
docCanvas=I(centerColumn,{type:"frame",name:"docCanvas",layout:"vertical",alignItems:"center",justifyContent:"center",width:"fill_container",height:"fill_container",padding:[28,28,28,28],fill:"#ECEFE5",stroke:{fill:"#D8DDD2",thickness:1},cornerRadius:24})
paper=I(docCanvas,{type:"frame",name:"paper",width:760,height:860,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:12})
```

Use that scaffold to transcribe the exact visible copy, icons-as-shapes, list rows, PDF-page blocks, and action buttons from `(1).png`. Keep the left rail narrow, the reading surface dominant, and the overall spacing screenshot-first.

- [ ] **Step 3: Capture and compare the Reader screenshot**

Run `pencil-get_screenshot` for `readerId`.

Expected: the rebuilt frame reads as the same layout as `(1).png`, with the left navigation/upload rail, top utility row, and central document view in the same proportions.

- [ ] **Step 4: Commit the Reader screen**

```bash
git add ui.pen
git commit -m "design: add reader workflow screen" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 3: Build The Reader - Comments Open Screen

**Files:**
- Modify: `ui.pen`
- Reference: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_45 PM (2).png`

- [ ] **Step 1: Resolve the `Reader - Comments Open` frame by name**

```json
{
  "tool": "pencil-batch_get",
  "filePath": "/Users/erpang/GitHubProjects/eng-copilot/ui.pen",
  "parentId": "O9PRB",
  "patterns": [{ "name": "^Reader - Comments Open$" }],
  "searchDepth": 1,
  "readDepth": 1,
  "resolveVariables": true
}
```

Expected: one direct child frame named `Reader - Comments Open`.
Record its `id` as `commentsId` for the rest of this task.

- [ ] **Step 2: Build the open-comments variant**

```javascript
U(commentsId,{layout:"vertical",gap:20,padding:[24,24,24,24],fill:"#F6F6F3"})
pageChrome=I(commentsId,{type:"frame",name:"pageChrome",layout:"vertical",gap:20,width:"fill_container",height:"fill_container"})
topBar=I(pageChrome,{type:"frame",name:"topBar",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:64,padding:[14,18,14,18],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:18})
workspace=I(pageChrome,{type:"frame",name:"workspace",layout:"horizontal",gap:20,width:"fill_container",height:"fill_container"})
leftRail=I(workspace,{type:"frame",name:"leftRail",layout:"vertical",gap:16,width:276,height:"fill_container"})
centerColumn=I(workspace,{type:"frame",name:"centerColumn",layout:"vertical",gap:16,width:760,height:"fill_container"})
commentsPanel=I(workspace,{type:"frame",name:"commentsPanel",layout:"vertical",gap:14,width:332,height:"fill_container",padding:[18,18,18,18],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
docHeader=I(centerColumn,{type:"frame",name:"docHeader",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:72,padding:[18,22,18,22],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
docCanvas=I(centerColumn,{type:"frame",name:"docCanvas",layout:"vertical",alignItems:"center",justifyContent:"center",width:"fill_container",height:"fill_container",padding:[28,28,28,28],fill:"#ECEFE5",stroke:{fill:"#D8DDD2",thickness:1},cornerRadius:24})
paper=I(docCanvas,{type:"frame",name:"paper",width:632,height:860,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:12})
```

After the scaffold is in place, populate the panel with the exact visible thread, active composer, badges, and contextual note state from `(2).png`. Match the narrower document area and the weight of the right panel rather than reusing the proportions from Task 2.

- [ ] **Step 3: Capture and compare the comments-open screenshot**

Run `pencil-get_screenshot` for `commentsId`.

Expected: the frame clearly reads as the Reader screen with the comments panel open, and the panel occupies the same visual weight as in `(2).png`.

- [ ] **Step 4: Commit the comments-open screen**

```bash
git add ui.pen
git commit -m "design: add reader comments workflow screen" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 4: Build The Documents Screen

**Files:**
- Modify: `ui.pen`
- Reference: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_46 PM (3).png`

- [ ] **Step 1: Resolve the `Documents` frame by name**

```json
{
  "tool": "pencil-batch_get",
  "filePath": "/Users/erpang/GitHubProjects/eng-copilot/ui.pen",
  "parentId": "O9PRB",
  "patterns": [{ "name": "^Documents$" }],
  "searchDepth": 1,
  "readDepth": 1,
  "resolveVariables": true
}
```

Expected: one direct child frame named `Documents`.
Record its `id` as `documentsId` for the rest of this task.

- [ ] **Step 2: Build the documents index layout**

```javascript
U(documentsId,{layout:"vertical",gap:20,padding:[24,24,24,24],fill:"#F6F6F3"})
pageChrome=I(documentsId,{type:"frame",name:"pageChrome",layout:"vertical",gap:20,width:"fill_container",height:"fill_container"})
topBar=I(pageChrome,{type:"frame",name:"topBar",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:64,padding:[14,18,14,18],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:18})
content=I(pageChrome,{type:"frame",name:"content",layout:"vertical",gap:18,width:"fill_container",height:"fill_container"})
titleCard=I(content,{type:"frame",name:"titleCard",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:88,padding:[22,24,22,24],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
filtersCard=I(content,{type:"frame",name:"filtersCard",layout:"horizontal",gap:12,alignItems:"center",width:"fill_container",height:56,padding:[10,16,10,16],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:18})
tableCard=I(content,{type:"frame",name:"tableCard",layout:"vertical",gap:0,width:"fill_container",height:"fill_container",padding:[0,0,0,0],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
tableHeader=I(tableCard,{type:"frame",name:"tableHeader",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:56,padding:[0,20,0,20],fill:"#F9FAF7"})
rows=I(tableCard,{type:"frame",name:"rows",layout:"vertical",gap:0,width:"fill_container",height:"fill_container"})
```

Populate the title, tabs, search, upload action, column labels, row content, and per-row actions by transcribing `(3).png` exactly. Use row dividers and badge treatments that match the screenshot instead of the current app mockup style.

- [ ] **Step 3: Capture and compare the Documents screenshot**

Run `pencil-get_screenshot` for `documentsId`.

Expected: the screen reads as a polished documents table view, with the top title/controls and the table body aligned to `(3).png`.

- [ ] **Step 4: Commit the Documents screen**

```bash
git add ui.pen
git commit -m "design: add documents workflow screen" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 5: Build The Shared Reader Screen

**Files:**
- Modify: `ui.pen`
- Reference: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_46 PM (4).png`

- [ ] **Step 1: Resolve the `Shared Reader` frame by name**

```json
{
  "tool": "pencil-batch_get",
  "filePath": "/Users/erpang/GitHubProjects/eng-copilot/ui.pen",
  "parentId": "O9PRB",
  "patterns": [{ "name": "^Shared Reader$" }],
  "searchDepth": 1,
  "readDepth": 1,
  "resolveVariables": true
}
```

Expected: one direct child frame named `Shared Reader`.
Record its `id` as `sharedId` for the rest of this task.

- [ ] **Step 2: Build the shared read-only layout**

```javascript
U(sharedId,{layout:"vertical",gap:20,padding:[24,24,24,24],fill:"#F6F6F3"})
pageChrome=I(sharedId,{type:"frame",name:"pageChrome",layout:"vertical",gap:20,width:"fill_container",height:"fill_container"})
shareHeader=I(pageChrome,{type:"frame",name:"shareHeader",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:72,padding:[16,20,16,20],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:20})
workspace=I(pageChrome,{type:"frame",name:"workspace",layout:"horizontal",gap:20,width:"fill_container",height:"fill_container"})
readerColumn=I(workspace,{type:"frame",name:"readerColumn",layout:"vertical",gap:16,width:"fill_container",height:"fill_container"})
docCanvas=I(readerColumn,{type:"frame",name:"docCanvas",layout:"vertical",alignItems:"center",justifyContent:"center",width:"fill_container",height:"fill_container",padding:[28,28,28,28],fill:"#ECEFE5",stroke:{fill:"#D8DDD2",thickness:1},cornerRadius:24})
paper=I(docCanvas,{type:"frame",name:"paper",width:760,height:860,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:12})
sideInfo=I(workspace,{type:"frame",name:"sideInfo",layout:"vertical",gap:14,width:300,height:"fill_container",padding:[18,18,18,18],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
```

Populate the shared-reader header copy, read-only affordances, page metadata, and supporting side panel exactly from `(4).png`. This screen must feel intentionally read-only, not like the owner reader with buttons removed.

- [ ] **Step 3: Capture and compare the Shared Reader screenshot**

Run `pencil-get_screenshot` for `sharedId`.

Expected: the screen has the same read-only framing, dominant document canvas, and supporting side content as `(4).png`.

- [ ] **Step 4: Commit the Shared Reader screen**

```bash
git add ui.pen
git commit -m "design: add shared reader workflow screen" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 6: Build The Word Lists Screen

**Files:**
- Modify: `ui.pen`
- Reference: `/Users/erpang/Downloads/ChatGPT Image Apr 23, 2026, 08_47_46 PM (5).png`

- [ ] **Step 1: Resolve the `Word Lists` frame by name**

```json
{
  "tool": "pencil-batch_get",
  "filePath": "/Users/erpang/GitHubProjects/eng-copilot/ui.pen",
  "parentId": "O9PRB",
  "patterns": [{ "name": "^Word Lists$" }],
  "searchDepth": 1,
  "readDepth": 1,
  "resolveVariables": true
}
```

Expected: one direct child frame named `Word Lists`.
Record its `id` as `wordsId` for the rest of this task.

- [ ] **Step 2: Build the vocabulary-management layout**

```javascript
U(wordsId,{layout:"vertical",gap:20,padding:[24,24,24,24],fill:"#F6F6F3"})
pageChrome=I(wordsId,{type:"frame",name:"pageChrome",layout:"vertical",gap:20,width:"fill_container",height:"fill_container"})
topBar=I(pageChrome,{type:"frame",name:"topBar",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:64,padding:[14,18,14,18],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:18})
workspace=I(pageChrome,{type:"frame",name:"workspace",layout:"horizontal",gap:20,width:"fill_container",height:"fill_container"})
leftNav=I(workspace,{type:"frame",name:"leftNav",layout:"vertical",gap:14,width:260,height:"fill_container",padding:[18,18,18,18],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
mainColumn=I(workspace,{type:"frame",name:"mainColumn",layout:"vertical",gap:18,width:"fill_container",height:"fill_container"})
titleCard=I(mainColumn,{type:"frame",name:"titleCard",layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container",height:88,padding:[22,24,22,24],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
filterBar=I(mainColumn,{type:"frame",name:"filterBar",layout:"horizontal",gap:12,alignItems:"center",width:"fill_container",height:56,padding:[10,16,10,16],fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:18})
listCard=I(mainColumn,{type:"frame",name:"listCard",layout:"vertical",gap:0,width:"fill_container",height:"fill_container",fill:"#FFFFFF",stroke:{fill:"#E3E7DD",thickness:1},cornerRadius:24})
```

Populate the navigation, title, filters, word rows, tags, explanations, and supporting metadata from `(5).png` exactly. Keep the density high and the content legible; do not simplify the list into generic cards if the screenshot uses a richer row structure.

- [ ] **Step 3: Capture and compare the Word Lists screenshot**

Run `pencil-get_screenshot` for `wordsId`.

Expected: the screen reads as the same word-list management page as `(5).png`, including the denser list content and utility controls.

- [ ] **Step 4: Commit the Word Lists screen**

```bash
git add ui.pen
git commit -m "design: add word lists workflow screen" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Task 7: Run Visual QA And Final Polish

**Files:**
- Modify: `ui.pen`
- Reference: `docs/superpowers/specs/2026-04-23-workflow-screens-redesign-design.md`
- Reference: all five PNGs in `/Users/erpang/Downloads`

- [ ] **Step 1: Capture the protected landing frame and all five workflow frames**

```json
{
  "tool": "pencil-batch_get",
  "filePath": "/Users/erpang/GitHubProjects/eng-copilot/ui.pen",
  "nodeIds": ["2q1F1", "O9PRB"],
  "readDepth": 2,
  "resolveVariables": true
}
```

Then capture screenshots for `2q1F1` plus each workflow frame returned under `O9PRB`.

Expected: `2q1F1` still matches the original landing layout, and `O9PRB` contains only the five new workflow frames.

- [ ] **Step 2: Check for layout problems before polish**

```json
{
  "tool": "pencil-snapshot_layout",
  "filePath": "/Users/erpang/GitHubProjects/eng-copilot/ui.pen",
  "parentId": "O9PRB",
  "maxDepth": 3,
  "problemsOnly": true
}
```

Expected: no clipped, overlapping, or malformed nodes in the workflow frames. If the tool reports issues, fix them before moving on.

- [ ] **Step 3: Apply only the deltas that close visible gaps**

```text
Compare each Pencil screenshot to its paired PNG and make only targeted fixes:
- spacing or padding mismatches
- incorrect column widths
- missing dividers, tags, or buttons
- wrong border radius, stroke weight, or panel depth
- copy that does not materially match the source image
```

Expected: each workflow frame now reads as the same design as its paired PNG, and the landing page remains untouched.

- [ ] **Step 4: Commit the final polish**

```bash
git add ui.pen
git commit -m "design: finalize workflow screens redesign" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
