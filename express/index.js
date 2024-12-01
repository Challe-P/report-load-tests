const express = require('express')
const app = express()
const port = 8001

items = {"1": "David Bowie", "2": "Queen"}

app.use(express.json()); 

app.get('/', (req, res) => {
  res.json({"Message": "Hello World!"});
})

app.get('/items/:id', (req, res) => {
    res.json({"item": items[req.params.id]});
})

app.post('/items', (req, res) => {
    id = req.body.index;
    items[id] = req.body.name;
    res.status(201);
    res.json({"Added": items[id]}) 
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
