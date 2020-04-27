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
	homePage(request, responce)
})

app.get("/home", function(request, responce) {
	homePage(request, responce)
})

function homePage(request, responce) {
	var dbRef = database.ref("/products")
	dbRef.orderByChild("status").equalTo("on-sale").limitToLast(5).once('value', function(snapshot){
		var data = {}
		if (snapshot.val()) {data = snapshot.val()}
		var x = "none"
		if (request.query.itemAdded == "true") {
			x = 'block'
		}
		responce.render('home.ejs', {products: data, message: x})
	})
}

app.get('/additmpage', function(request, responce){
	responce.render('add-item.ejs')
})

app.get('/my-products', function(request, responce){
	if (request.query.uToken) {
	admin.auth().verifyIdToken(request.query.uToken)
		.then(function(decodedToken) {
			let uid = decodedToken.uid;
			var dbRef = database.ref("/products")

			if (uid == "If84zSzRvlcCqRs0ZPJRpAcY1He2") {
				dbRef.orderByChild('owner').once('value', function(snapshot){
					var data = snapshot.val()
					responce.render('my-products.ejs', {products: data})
				})
			}
			else {
				dbRef.orderByChild('owner').equalTo(uid).once('value', function(snapshot){
					var data = {
						  'x': {
								desc: '',
								holder: '',
								id: 999,
								img: '',
								location: '',
								name: 'No products listed 😢',
								owner: '',
								price: '',
								public: '',
								stock: ''
							  },
					}
					if (snapshot.val()) {data = snapshot.val()}
					responce.render('my-products.ejs', {products: data})
				})
			}


		})
		.catch(function(error) {
			console.log(error)
			responce.send("<h1>Bad Auth Token</h1><a href='home'>Home</a>")
		});
	}
	else {
		responce.send("<h1>No Auth Token Provided</h1><a href='home'>Home</a>")
	}
})

app.get('/my-product', function(request, responce){
	if (request.query.uToken && request.query.productid) {
	admin.auth().verifyIdToken(request.query.uToken)
		.then(function(decodedToken) {
			let uid = decodedToken.uid;
			var dbRef = database.ref("/products/"+request.query.productid)
			dbRef.once('value', function(snapshot){
				data = snapshot.val()
				responce.render('my-product.ejs', {item:data, key:request.query.productid})
			})
		})
		.catch(function(error) {
			console.log(error)
			responce.send("<h1>Bad Auth Token</h1><a href='home'>Home</a>")
		});
	}
	else {
		responce.send("<h1>No Auth Token Provided</h1><a href='home'>Home</a>")
	}
})

app.get('/edit-item', function(request, responce){
	if (request.query.uToken && request.query.productid) {
	admin.auth().verifyIdToken(request.query.uToken)
		.then(function(decodedToken) {
			let uid = decodedToken.uid;
			var dbRef = database.ref("/products/"+request.query.productid)
			dbRef.once('value', function(snapshot){
				data = snapshot.val()
				if (data.owner == uid) {
					responce.render('edit-item.ejs', {item:data, key:request.query.productid})
				}
				else {
					responce.send('<h1 style="color:red;" >Unauthorized user</h1><a href="home">Home</a>')
				}
			})
		})
		.catch(function(error) {
			console.log(error)
			responce.send("<h1>Bad Auth Token</h1><a href='home'>Home</a>")
		});
	}
	else {
		responce.send("<h1>No Auth Token Provided</h1><a href='home'>Home</a>")
	}
})

app.get('/product', function(request, responce){
	if (request.query.productid) {
		var dbRef = database.ref("/products/"+request.query.productid)
		dbRef.once('value', function(snapshot){
			data = snapshot.val()
			if (data){
				responce.render('product.ejs', {item:data, key:request.query.productid})
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

app.post('/purchase-api', function(request, responce){
	if (request.body.item && request.body.user) {
		admin.auth().verifyIdToken(request.body.user)
			.then(function(decodedToken) {
				let uid = decodedToken.uid;
				let product = request.body.item
				var productRef = database.ref("/products/"+product)
				productRef.update({owner:uid, status:"sold"})
				responce.send({success:true, error:null})
			})
			.catch(function(error) {
				responce.send({ error: 'invalid auth token' })
			});
	}
	else {
		responce.send({ error: 'invalid data' })
	}
})

var port = 5000

app.listen(port, function() {
	console.log('Server running on port ' + port)
})