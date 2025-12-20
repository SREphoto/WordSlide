<!-- AGENT_INSTRUCTIONS_START
### 🤖 Agent Protocol: Port Management & Registry Sync

**Objective**: Maintain a conflict-free registry of ports for all applications in the user's workspace.

**When you encounter this file in a project:**
1.  **Identify the Project**: Read `package.json` to get the `name` of the current project. If no `package.json`, use the folder name.
2.  **Scan Registry**: Read the "Port Registry" table below.
3.  **Determine Action**:
    *   **Project IS listed with a valid port**: Verify local config matches. If not, update local config.
    *   **Project IS listed but Port is "Pending"**:
        1.  Find the **highest numeric port** currently assigned in the table (ignore Pending/Blank).
        2.  Assign the **next available port** (Highest + 1) to this project.
        3.  **Update the table** with the new port.
        4.  **Update local config** files (`vite.config.js`, `index.js`, `.env`) to use this new port.
    *   **Project is NOT listed (New App)**:
        1.  Find the **highest numeric port** currently assigned in the table.
        2.  Assign the **next available port** (Highest + 1).
        3.  **Add to Registry**: Append a new row to the **bottom** of the table with the Project Name, New Port, and Description.
        4.  **Configure App**: Update the local configuration files to use this new port.

**Configuration Update Guide**:
*   **Vite (`vite.config.js`)**: Update `server: { port: <PORT> }`.
*   **Express/Node (`index.js` / `server.js`)**: Update `const port = <PORT>;` or `app.listen(<PORT>)`.
*   **Environment (`.env`)**: Update `PORT=<PORT>`.

AGENT_INSTRUCTIONS_END -->

# 🌐 Application Access & Port Registry

## 🚀 Current Context: WellNest
*   **Local URL**: [http://localhost:3000](http://localhost:3000)
*   **Assigned Port**: `3000`

---

## 📒 Master Port Registry

| Application Name | Assigned Port | Description |
|------------------|---------------|-------------|
| **WellNest** | 3000 | Mental health tracking app (Full Stack) |
| **WordSlide** | 3001 | Word Puzzle Game |
| **HomePlanner** | Pending | *Reserved* |
| **Word-Music-Game** | Pending | *Reserved* |
| **AI-Sprite-Forge-Playground-2** | Pending | *Reserved* |

*(Agent: Add new projects above this line. Keep table sorted by Port if possible.)*

---

### 🛠️ How to Run This App
1.  Ensure you are in the project root.
2.  Run `npm start` (or `npm run dev` depending on `package.json`).
3.  Access via the **Local URL** defined at the top.
