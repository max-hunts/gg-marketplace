let express = require('express')
let logger = require('morgan')
let bodyParser = require('body-parser')
let admin = require("firebase-admin");
let serviceAccount = require("./secrets/project-gg-3b754-firebase-adminsdk-4848h-5a5778b77b.json");

let firebaseadmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://project-gg-3b754.firebaseio.com"
})
let database = firebaseadmin.database()
let auth = admin.auth();

let app = express()
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json({ limit: '10mb' }));
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

app.post('/login-user-api', function(request, responce){
	if (request.body.uToken && request.body.user) {
		admin.auth().verifyIdToken(request.body.uToken)
			.then(async function(decodedToken) {
				let user = request.body.user
				let uid = decodedToken.uid

				if (uid != user.uid){
					responce.send({success:false, error:'Stop hacking'})
				}
				else {
					let rsp = await checkNewUser(user)
					responce.send(rsp)
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

app.post('/shipping-adress-edit-api', function(request, responce){
	if (request.body.uToken && request.body.address) {
		admin.auth().verifyIdToken(request.body.uToken)
			.then(async function(decodedToken) {
				let newAddress = request.body.address
				let uid = decodedToken.uid

				let snapshot = await checkUserExists(uid)
				if (snapshot){
					let users = snapshot.val()
					var keys = Object.keys(users)
					userKey = keys[0]
					userRef = database.ref("/users/"+userKey)
					userRef.update({address:newAddress})
					.then(function(){
						responce.send({success:true, error:null})
					})
				}
				else {
					responce.send({success:false, error:'user does not exist'})
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

app.post('/new-product-api', function(request, responce){
	if (request.body.uToken && request.body.product && request.body.image) {
		admin.auth().verifyIdToken(request.body.uToken)
			.then(async function(decodedToken) {
				let uid = decodedToken.uid
				let image = request.body.image
				let product = request.body.product

				let imageName = image.name

				let newProductRef = database.ref('/products')
				let key = await newProductRef.push(product).then(key => {
					let productKey = key.key
					let imgPath = productKey + '/' + imageName
					let productRef = database.ref('/products/' + productKey)
					productRef.update({img: imgPath}).then(function(){
						responce.send({success:true, imgRef:'/product-img/'+imgPath, error:null})
					})
					.catch(e=>{
						responce.send({success:false, error:e})
						console.log(error)
					})
				})
				.catch(e=>{
					responce.send({success:false, error:e})
					console.log(error)
				})
				
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

app.post('/update-product-api', function(request, responce){
	if (request.body.uToken && request.body.product && request.body.productID) {
		admin.auth().verifyIdToken(request.body.uToken)
			.then(async function(decodedToken) {
				let uid = decodedToken.uid
				let product = request.body.product
				let productID = request.body.productID

				if (await verifyExists(productID)){
					if (await verifyOwner(uid, productID)) {
						let productRef = database.ref('/products/' + productID)
						productRef.update(product).then(function(){
							responce.send({success:true, error:null})
						})
						.catch(e=>{
							responce.send({success:false, error:e})
							console.log(error)
						})
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
		responce.send({success:false, error: 'invalid data'})
	}
})


async function checkNewUser(user){
	let snapshot = await checkUserExists(user.uid)
	if (snapshot){
		let users = snapshot.val()
		var keys = Object.keys(users)
		uData = users[keys[0]]
		let retData = {success:true, userName:uData.fName + " " + uData.lName, address:uData.address}
		return retData
	}
	else {
		console.log("Creating new user")
		let uData = {
			fName:user.displayName,
			lName:"",
			UID:user.uid,
			email:user.email,
			address:""
		}
		return await createNewUser(uData)
	}
}

async function checkUserExists(uid){
	var dbRef = database.ref("/users")
	let snapshot = await dbRef.orderByChild("UID").equalTo(uid).once('value')
	if (snapshot.exists()){return snapshot}
	else {return false}
}

async function createNewUser(uData){
	let userRef = database.ref('/users')
	let x = await userRef.push(uData)
	return {success:true, userName:uData.fName + " " + uData.lName, address:uData.address}
}


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