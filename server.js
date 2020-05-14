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
})


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
		console.log(data)
		responce.render('home.ejs', {products: data, message: x})
	})
}

app.get('/search', function(request, responce){
	var dbRef = database.ref("/products")
	if (request.query.search) {
		let sQuery = request.query.search.toLowerCase()
		dbRef.orderByChild("status").equalTo("on-sale").once('value', function(snapshot){
			var data = {
					'x': {desc: '',holder: '',id: 999,img: '',location: '',name: 'Nothing found 😢',owner: '',price: '',public: '',stock: ''},
			}
			if (snapshot.val()) {
				data = snapshot.val()
				var sResults = [{desc: '',holder: '',id: 999,img: '',location: '',name: 'Nothing found 😢',owner: '',price: '',public: '',stock: ''}]

				var keys = Object.keys(data)

				keys.forEach(key => {
					if (data[key].name.toLowerCase().includes(sQuery) || data[key].desc.toLowerCase().includes(sQuery)) {
						sResults[key] = data[key]
						console.log(sResults)
					}
				})
				if (Object.keys(sResults).length > 1) {
					delete sResults[0]
				}
				console.log(sResults)
				responce.render('search.ejs', {products: sResults})
			}
			else {responce.render('search.ejs', {products: data})}
		})
	}
	else {
		dbRef.orderByChild("status").equalTo("on-sale").once('value', function(snapshot){
			var data = {
					'x': {desc: '',holder: '',id: 999,img: '',location: '',name: 'Nothing found 😢',owner: '',price: '',public: '',stock: ''},
			}
			if (snapshot.val()) {data = snapshot.val()}
			responce.render('search.ejs', {products: data})
		})
	}
})

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
					var data = {'x': {holder: '',id: 999,img: '',location: '',name: 'No products listed 😢',owner: '',price: '',stock: ''}}
					if (snapshot.val()) {data = snapshot.val()}
					responce.render('my-products.ejs', {products: data})
				})
			}
		})
		.catch(function(error) {
			console.log(error)
			responce.send("<h1>Bad Auth Token</h1><a href='home'>Home</a>")
		})
	}
	else {
		responce.send("<h1>No Auth Token Provided</h1><a href='home'>Home</a>")
	}
})

app.get('/my-product', function(request, responce){
	if (request.query.uToken && request.query.productid) {
	admin.auth().verifyIdToken(request.query.uToken)
		.then(async function(decodedToken) {
			let uid = decodedToken.uid
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


app.post('/request-api', async function(request, responce){
	if (request.body.prodID && request.body.authToken && request.body.usrMsg) {
		let bMsg = request.body.usrMsg
		let uid = await authCheck(request.body.authToken)
		if (uid) {
			let pid = request.body.prodID
			let productRef = database.ref("/products/"+ pid)
			var snapshot = await productRef.once('value')
			if (snapshot.exists()) {
				let product = snapshot.val()
				let productName = product.name
				let productSeller  = product.owner
				let usersRef = database.ref("/users")
				snapshot = await usersRef.orderByChild("UID").equalTo(productSeller).once('value')
				if (snapshot.exists()) {
					let vals = snapshot.val()
					let keys = Object.keys(vals)
					let seller = vals[keys[0]]
					let sellerName = seller.fName
					let sellerEmail = seller.email
					snapshot = await usersRef.orderByChild("UID").equalTo(uid).once('value')
					if (snapshot.exists()) {
						let vals = snapshot.val()
						let keys = Object.keys(vals)
						let buyer = vals[keys[0]]
						let buyerName = buyer.fName + ' ' + buyer.lName
						let buyerEmail = buyer.email
						let content = contentMaker(sellerName, buyerName, buyerEmail, productName, pid, bMsg)
						let rsp = sendEmail(sellerEmail, content)
						console.log(rsp)
						responce.send({success:true, error:null})
					} else {
						responce.send({success:false, error:'Something very bad has happened..... Item buyer apparantly doesn\'t exist in the database'})
					}
				} else {
					responce.send({success:false, error:'Something very bad has happened..... Item owner apparantly doesn\'t exist in the database'})
				}
			} else {
				responce.send({success:false, error:'Item does not exist'})
			}
		} else {
			responce.send({success:false, error:'invalid auth token'})
		}
	} else {
		responce.send({success:false, error:'invalid data'})
	}
})

app.post('/toggle-sale-api', async function(request, responce){
	if (request.body.prodID && request.body.authToken && (request.body.targetState != null)) {
		let uid = await authCheck(request.body.authToken)
		if (uid) {
			let pid = request.body.prodID
			let targetState = request.body.targetState
			let productRef = database.ref("/products/"+ pid)
			var snapshot = await productRef.once('value')
			if (snapshot.exists()) {
				let product = snapshot.val()
				if (product.owner == uid && product.status != "sold") {
					let status = "x"
					if (targetState == true) {
						status = "on-sale"
					} else {
						status = "off-sale"
					}
					productRef.update({status:status})
					.then(responce.send({success:true, error:null}))
					.catch(e => {responce.send({success:false, error:e})})
				} else {
					responce.send({success:false, error:'Unauthorized'})
				}
			} else {
				responce.send({success:false, error:'Item does not exist'})
			}
		} else {
			responce.send({success:false, error:'invalid auth token'})
		}
	} else {
		responce.send({success:false, error:'invalid data'})
	}
})

app.post('/sold-api', async function(request, responce){
	if (request.body.prodID && request.body.authToken) {
		let uid = await authCheck(request.body.authToken)
		if (uid) {
			let pid = request.body.prodID
			let productRef = database.ref("/products/"+ pid)
			var snapshot = await productRef.once('value')
			if (snapshot.exists()) {
				let product = snapshot.val()
				if (product.owner == uid) {
					productRef.update({status:"sold"})
					.then(responce.send({success:true, error:null}))
					.catch(e => {responce.send({success:false, error:e})})
				} else {
					responce.send({success:false, error:'Unauthorized'})
				}
			} else {
				responce.send({success:false, error:'Item does not exist'})
			}
		} else {
			responce.send({success:false, error:'invalid auth token'})
		}
	} else {
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
		responce.send({success:false, error: 'invalid data'})
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

function contentMaker(sName, bName, bEmail, pName, pid, bMsg){
	let text = "Hi " + sName + "\n \n" + bName + " is interested in your product " + pName + " (ID: " + pid + ")\n\nUser email: " + bEmail +"\n\nUser message:\n" + bMsg
	return text
}

async function authCheck(token) {
	let uid = false
	decodedToken = await admin.auth().verifyIdToken(token).catch(e=>{console.log(e)})
	uid = decodedToken.uid
	return uid
}

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
	if (item.owner == uid || uid == "If84zSzRvlcCqRs0ZPJRpAcY1He2"){
		return true
	}
	else {
		return false
	}
}

function sendEmail(address, content){
	var mailOptions = {
		from: 'Project GG',
		to: address,
		subject: 'Someone\'s interested!',
		text: content
	}
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		}
	})
}


app.get('*', function(request, responce){
	responce.status(404).render('404.ejs')
})

app.post('*', function(request, responce){
	responce.status(404).send({success:false, error:"404"})
})

var port = 5000

app.listen(port, function() {
	console.log('Server running on port ' + port)
})