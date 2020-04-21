var express = require('express')
var logger = require('morgan')
var app = express()

app.use(logger('dev'))
app.use(express.static('views'))

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

app.get("/", function(request, responce) {
	responce.render("home.ejs")
})

var port = 5000

app.listen(port, function() {
	console.log('Server running on port ' + port)
})