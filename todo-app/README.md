# todo-app

A small local todo list web app. Add, check off, and delete tasks from your
browser; tasks persist in a local SQLite database file.

## Step-by-step usage

1. **Open a terminal in this project folder.**

   ```bash
   cd todo-app
   ```

2. **Create a virtual environment** (only needed the first time).

   ```bash
   python3 -m venv .venv
   ```

3. **Install the dependencies.**

   ```bash
   ./.venv/bin/pip install -r requirements.txt
   ```

4. **Run the app.**

   ```bash
   ./.venv/bin/python app.py
   ```

   This starts a local server and creates `todo.db` (in this folder) the
   first time it runs.

5. **Open it in your browser** at [http://127.0.0.1:5000](http://127.0.0.1:5000).

6. **Use it:**
   - Type a task in the box and click **Add**.
   - Click the checkbox (☐/☑) next to a task to mark it done/undone.
   - Click **✕** to delete a task.

7. **Stop the server** with `Ctrl+C` in the terminal when you're done.
   Your tasks stay saved in `todo.db` for next time.

## Notes

- `app.py` runs with Flask's debug reloader on, which is convenient for
  local use but not intended for exposing this beyond your own machine.
- Data lives in `todo.db` (SQLite), ignored by git via the top-level
  `.gitignore`.
