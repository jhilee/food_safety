const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('./'));

// req = info about the request
// res = manipulate the response the express server makes to http request
app.get('*', (req, res) => {
    res.sendFile('./food.html');
});

app.listen(port, () => {
    console.log('Server is up');
});
