from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from solver import solve_roster

app = FastAPI(title="Who Stays On API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/roster")
def get_roster(data: dict):
    try:
        result = solve_roster(data)
        if result.get("status") == "invalid_input":
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)