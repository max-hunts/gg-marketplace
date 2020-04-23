var express = require('express')
var logger = require('morgan')
var admin = require("firebase-admin");
var serviceAccount = require("./secrets/project-gg-3b754-firebase-adminsdk-4848h-5a5778b77b.json");

var firebaseadmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://project-gg-3b754.firebaseio.com"
});
var database = firebaseadmin.database()

var app = express()

app.use(logger('dev'))
app.use(express.static('views'))

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')



app.get("/", function(request, responce) {
	dbRef = database.ref("/products")
	dbRef.limitToFirst(5).once('value', function(snapshot){
		var data = snapshot.val()
		if (!data) {
			data = {}
		}
		var x = "none"
		if (request.query.itemAdded == "true") {
			x = 'block'
		}
		responce.render('home.ejs', {products: data, message: x})
	})

	// responce.render("home.ejs")
})

app.get('/additmpage', function(request, responce){
	responce.render('add-item.ejs')
})

app.get('/product', function(request, responce){
	if (request.query.productid) {
		console.log(request.query.productid)
	}
	responce.render('product.ejs')
})

var port = 5000

app.listen(port, function() {
	console.log('Server running on port ' + port)
})