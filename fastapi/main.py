from fastapi import FastAPI
from rag import query
from pydantic import BaseModel

app = FastAPI()

class queryData(BaseModel):
    msg: str
    history: list
    

@app.post("/query")
def getQuery(data: queryData):
    if not data.msg:
        return {"status": "error", "reason": "Empty question"}
    
    result = query(data.msg, data.history)
    return {"status": "success", "data": result}