# Who Stays On? - Shapla Shopping Complex

Generator Load Shedding Roster & Management Dashboard built for the hackathon.

## Project Structure
- `BackEnd/` : FastAPI backend containing the optimization solver logic (`solver.py`) and API endpoints (`main.py`).
- `FrontEnd/` : React & Tailwind CSS dashboard with bi-directional synchronization (sliders, grid toggles, JSON editor, and upload).
- `evidence/` : Contains bug-fix evidence, invalid input handling tests, and boundary condition outputs.
- `sample_output.json` : Generated output for the default sample input scenario.
- `minute150_output.json` : Generated output for the Minute-150 load shedding update scenario.

## Features & Highlights
- **Bi-directional Sync**: UI Controls, Sliders, Outage Toggles, and JSON Editor are fully synchronized.
- **Input Validation**: Backend strictly validates input data (e.g., non-positive kW capacity or loads) and returns HTTP 400 with a detailed error payload.
- **Dark Hour Explanations**: Hovering over turned-off shops reveals exact reasons (Capacity Limit, Fuel Budget Limit, etc.).

## How to Run Locally

### 1. Run Backend
Navigate to the `BackEnd` directory, install dependencies, and start the server:
```bash
cd BackEnd
pip install -r requirements.txt
python main.py