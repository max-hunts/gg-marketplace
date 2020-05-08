var express = require('express')
var logger = require('morgan')
var bodyParser = require('body-parser')
var admin = require("firebase-admin");
var serviceAccount = require("./secrets/project-gg-3b754-firebase-adminsdk-4848h-5a5778b77b.json");

var firebaseadmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://project-gg-3b754.firebaseio.com"
})
var database = firebaseadmin.database()
var auth = admin.auth();

var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(logger('dev'))
app.use(express.static('views'))

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

let nodemailer = require('nodemailer')
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.projectgg@gmail.com',
    pass: 'REDACTED'
  }
});


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
		.then(async function(decodedToken) {
			let uid = decodedToken.uid;
			let pid = request.query.productid
			if (await verifyExists(pid)){
					if (await verifyOwner(uid, pid)) {
						var dbRef = database.ref("/products/"+pid)
						dbRef.once('value', function(snapshot){
							data = snapshot.val()
							responce.render('my-product.ejs', {item:data, key:pid})
						})
					}
					else {
						responce.render('404.ejs')
					}
				}
			else {
				responce.render('404.ejs')
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

app.get('/edit-item', function(request, responce){
	if (request.query.uToken && request.query.productid) {
	admin.auth().verifyIdToken(request.query.uToken)
		.then(async function(decodedToken) {
			let uid = decodedToken.uid
			let pid = request.query.productid

			if (await verifyExists(pid)){
					if (await verifyOwner(uid, pid)) {
						let dbRef = database.ref("/products/"+pid)
						dbRef.once('value', function(snapshot){
							data = snapshot.val()
							responce.render('edit-item.ejs', {item:data, key:request.query.productid})
						})
					}
					else {
						responce.render('404.ejs')
					}
				}
				else {
					responce.render('404.ejs')
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

app.get('/product', function(request, responce){
	if (request.query.productid) {
		var dbRef = database.ref("/products/"+request.query.productid)
		dbRef.once('value', function(snapshot){
			data = snapshot.val()
			if (data){
				sellerID = data.owner
				let sellerName = "John Doe (error)"
				let usersRef = database.ref("/users")
				usersRef.orderByChild("UID").equalTo(sellerID).once('value', function(snapshot){
					vals = snapshot.val()
					var keys = Object.keys(vals)
					uData = vals[keys[0]]
					sellerName = uData.fName + " " + uData.lName
					responce.render('product.ejs', {item:data, key:request.query.productid, seller:sellerName})
				})
				.catch(e => {console.log(e)})
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
				productRef.once('value', function(snapshot) {
					var exists = (snapshot.val() !== null)
					if (exists){
						var productRef = database.ref("/products/"+product)
						productRef.update({owner:uid, status:"sold"})
						.then(function(){
							responce.send({success:true, error:null})
						})
						.catch(e => {console.log(e)})
					}
					else {
						responce.send({success:false, error:'Item does not exist'})
					}
				})
				.catch(e => {console.log(e)})				
			})
			.catch(function(err) {
				responce.send({success:false, error:'invalid auth token'})
			});
	}
	else {
		responce.send({success:false, error:'invalid data'})
	}
})

app.post('/place-on-sale-api', function(request, responce){
	if (request.body.item && request.body.user) {
		admin.auth().verifyIdToken(request.body.user)
			.then(function(decodedToken) {
				let uid = decodedToken.uid;
				let productID = request.body.item
				var productRef = database.ref("/products/"+productID)

				productRef.once('value',function(snapshot){
					let item = snapshot.val()
					if (item){
						let itemOwner = item.owner
						if (uid == itemOwner){
							productRef.update({status:"on-sale"})
							.then(function(){
								responce.send({success:true, error:null})
							})
							.catch(e => {console.log(e)})
						}
						else {
							responce.send({success:false, error:'You do not own this item'})
						}
					}
					else {
						responce.send({success:false, error:'Item does not exist'})
					}
				})
				.catch(e=>{
					console.log(e)
					responce.send({success:false, error:'other, ' + e})
				})
			})
			.catch(function(error) {
				responce.send({success:false, error:'invalid auth token'})
			})
		}
	else {
		responce.send({success:false, error:'invalid data'})
	}
})

app.post('/ship-api', function(request, responce){
	if (request.body.item && request.body.user) {
		admin.auth().verifyIdToken(request.body.user)
			.then(async function(decodedToken) {
				let uid = decodedToken.uid;
				let pid = request.body.item

				if (await verifyExists(pid)){
					if (await verifyOwner(uid, pid)) {
						let productRef = database.ref("/products/"+pid)
						productRef.update({status:"shipped"})
						.then(function(){
							processItemShipEmail(pid, uid)
							responce.send({success:true, error:null})
						})
						.catch(e => {console.log(e)})
					}
					else {
						responce.send({success:false, error:'You do not own this item'})
					}
				}
				else {
					responce.send({success:false, error:'Item does not exist'})
				}
			})
			.catch(function(error) {
				responce.send({success:false, error:'invalid auth token'})
			})
		}
	else {
		responce.send({success:false, error:'invalid data'})
	}
})


app.post('/demo-api', function(request, responce){
	if (request.body.item && request.body.user) {
		admin.auth().verifyIdToken(request.body.user)
			.then(async function(decodedToken) {
				if (await verifyExists(request.body.item)){
					if (await verifyOwner(decodedToken.uid, request.body.item)) {
						responce.send({success:true, error:null, data:"x"})
					}
					else {
						responce.send({success:false, error:'You do not own this item'})
					}
				}
				else {
					responce.send({success:false, error:'Item does not exist'})
				}
			})
			.catch(function(error) {
				responce.send({success:false, error:'invalid auth token'})
				console.log(error)
			});
	}
	else {
		responce.send({error: 'invalid data'})
	}
})




async function authorisedToPurchase(uid, pid){
	return true
}

async function verifyExists(pid) {
	let productRef = database.ref("/products/"+pid)
	let snapshot = await productRef.once('value')
	if (snapshot.exists()) {
		return true
	}
	else{
		return false
	}
}

async function verifyOwner(uid, pid) {
	let productRef = database.ref("/products/"+pid)
	let snapshot = await productRef.once('value')
	let item = snapshot.val()
	if (item.owner == uid){
		return true
	}
	else {
		return false
	}
}

function sendEmail(address, content){
	var mailOptions = {
		from: 'noreply.projectgg@gmail.com',
		to: address,
		subject: 'Your Item has been requested',
		text: content
	}
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
	  }
	})
}

function processItemShipEmail(itemID, buyerID){
	let productRef = database.ref("/products/"+itemID)
	productRef.once('value',function(snapshot){
		let item = snapshot.val()
		let itemName = item.name
		let itemHolder = item.holder
		let usersRef = database.ref("/users")
		usersRef.orderByChild("UID").equalTo(itemHolder).once('value', function(snapshot){
			vals = snapshot.val()
			var keys = Object.keys(vals)
			uData = vals[keys[0]]
			let holderEmail = uData.email
			let clientRef = database.ref("/users")
			usersRef.orderByChild("UID").equalTo(buyerID).once('value', function(snapshot){
				cvals = snapshot.val()
				var ckeys = Object.keys(cvals)
				cData = cvals[ckeys[0]]
				let clientAddress = cData.address
				let emailContent = "Please ship Item: " + itemName + " (ItemID: " + itemID + ")\nShipping address: " + clientAddress
				sendEmail(holderEmail, emailContent)
			})
		})
	})
}

app.get('*', function(request, responce){
	responce.render('404.ejs')
})

var port = 5000

app.listen(port, function() {
	console.log('Server running on port ' + port)
})