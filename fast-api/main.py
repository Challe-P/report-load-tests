""" FastAPI server for load test report """
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

items = {"1": "David Bowie", "2": "Queen"}

class Item(BaseModel):
    index: str
    name: str

@app.get("/", status_code=200)
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}", status_code=200)
def read_item(item_id):
    return {"item": items[item_id]}

@app.post("/items", status_code=201)
def add_item(item: Item):
    items.update({item.index: item.name})
    return item
