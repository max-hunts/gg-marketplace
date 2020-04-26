var express = require('express')
var logger = require('morgan')
var bodyParser = require('body-parser')
var admin = require("firebase-admin");
var serviceAccount = require("./secrets/project-gg-3b754-firebase-adminsdk-4848h-5a5778b77b.json");

var firebaseadmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://project-gg-3b754.firebaseio.com"
});
var database = firebaseadmin.database()
var auth = admin.auth();

var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(logger('dev'))
app.use(express.static('views'))

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')



app.get("/", function(request, responce) {
	var dbRef = database.ref("/products")
	dbRef.limitToLast(5).once('value', function(snapshot){
		var data = {}
		data = snapshot.val()
		var x = "none"
		if (request.query.itemAdded == "true") {
			x = 'block'
		}
		responce.render('home.ejs', {products: data, message: x})
	})

	// responce.render("home.ejs")
})

app.get("/home", function(request, responce) {
	var dbRef = database.ref("/products")
	dbRef.limitToLast(5).once('value', function(snapshot){
		var data = {}
		data = snapshot.val()
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

app.post('/my-products', function(request, responce){
	admin.auth().verifyIdToken(request.body.uToken)
		.then(function(decodedToken) {
			let uid = decodedToken.uid;
			var dbRef = database.ref("/products")
			dbRef.orderByChild('owner').equalTo(uid).once('value', function(snapshot){
				var data = {}
				data = snapshot.val()
				console.log(data)
				responce.render('my-products.ejs', {products: data})
			})
		})
		.catch(function(error) {
			console.log(error)
		});
})





app.get('/product', function(request, responce){
	if (request.query.productid) {
		var dbRef = database.ref("/products/"+request.query.productid)
		dbRef.once('value', function(snapshot){
			data = snapshot.val()
			if (data){
				responce.render('product.ejs', {item:data})
			}
			else {
				responce.render('404.ejs')
			}
		})
	}
	else {
		responce.render('404.ejs')
	}
})

var port = 5000

app.listen(port, function() {
	console.log('Server running on port ' + port)
})