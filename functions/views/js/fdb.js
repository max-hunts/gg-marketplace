var permissionToLeavePage1 = false
var permissionToLeavePage2 = false

function leavePage(){
	if (permissionToLeavePage1 && permissionToLeavePage2) {
		window.location.replace('home?itemAdded=true')
	}
}

function productSubmitEventHandler(){
	data = {
		id: 1,
		name: "",
		desc: "",
		img: "default.png",
		location: "",
		stock: 1,
		status: "on-sale",
		price: 0,
		owner: "",
		holder: ""
	}

	const nameField = document.getElementById('pName')
	const descField = document.getElementById('pDesc')
	const locField = document.getElementById('pLoc')
	const stockField = document.getElementById('pStock')
	const priceField = document.getElementById('pPrice')

	const imgBtn = document.getElementById('pImg')

	var sessUid = firebase.auth().currentUser.uid

	data.id = 999
	data.name = nameField.value
	data.desc = descField.value
	data.location = locField.value
	if (stockField.value) {
		data.stock = stockField.value
	}
	data.price = priceField.value
	data.owner = sessUid
	data.holder = sessUid

	var productKey = addItem(data)
	console.log(productKey)

	var image = imgBtn.files[0]
	var imgPath = productKey + '/' + image.name
	var storageRef = firebase.storage().ref('/product-img/' + imgPath)

	const submitBtn = document.getElementById('pSend')
	submitBtn.innerHTML = "Uploading..."
	submitBtn.disabled = true

	updateDBImg(productKey, imgPath)

	storageRef.put(image).then(function(){
		permissionToLeavePage2 = true
		leavePage()
	})
}

function productUpdateEventHandler() {
	const submitBtn = document.getElementById('pSend')
	if (submitBtn.innerHTML == "Update") {
		const nameField = document.getElementById('pName')
		const descField = document.getElementById('pDesc')
		const locField = document.getElementById('pLoc')
		const stockField = document.getElementById('pStock')
		const priceField = document.getElementById('pPrice')

		// const imgBtn = document.getElementById('pImg')

		const item_id_element = document.getElementById("productID")
		const item_id = item_id_element.getAttribute("product_id")

		const sessUid = firebase.auth().currentUser.uid

		submitBtn.innerHTML = "Updating..."
		submitBtn.disabled = true

		var database = firebase.database()
		var productRef = database.ref("/products/"+item_id)
		productRef.update({
			name: nameField.value,
			desc: descField.value,
			location: locField.value,
			stock: stockField.value,
			price: priceField.value
		})
		.then(function(){
			submitBtn.setAttribute("style", "width: 300px; background: #00DD00;cursor: pointer;")
			submitBtn.innerHTML = "Done!, Go Home..."
			submitBtn.disabled = false
		})
	}
	else {
		window.location.replace('home')
	}
}

function addItem(item){
	var database = firebase.database()
	var itemRef = database.ref('/products')
	var key = itemRef.push(item)
	return key.key
}

function updateDBImg(key, value){
	console.log("Updating db, key=" + key + " value="+value+" total=" + '/products/' + key)
	var database = firebase.database()
	var itemRef = database.ref('/products/' + key)
	console.log("itemRef")
	console.log(itemRef)	
	itemRef.update({img: value}).then(function(){
		permissionToLeavePage1 = true
		leavePage()
		})
}

function updateImgs() {
	const storage = firebase.storage()
	const rootReference = storage.ref('/product-img')

	var images = document.getElementsByClassName('dyn-img')
	// console.log(images)
	Array.from(images).forEach((image) => {
		var pathReference = rootReference.child(image.title)
		pathReference.getDownloadURL().then(function(url) {image.src = url}).catch(e => {console.log(e.message)})
	})
}

updateImgs();

function purchaseItem() {
	const purchaseBtn = document.getElementById('remember-to-add-auth-verificartion-to-js-handler')
	if (purchaseBtn.innerHTML == "Buy!") {
		if (firebase.auth().currentUser) {
			firebase.auth().currentUser.getIdToken().then(function(idToken) {
				var item_id_element = document.getElementById("productID")
				var item_id = item_id_element.getAttribute("product_id")
				const url = 'purchase-api'
				// The data we are going to send in our request
				let data = {
					item: item_id,
					user: idToken
				}
				// The parameters we are gonna pass to the fetch function
				let postData = { 
					method: 'POST', 
					body: JSON.stringify(data),
					headers: {'Content-Type': 'application/json'}
				}
				fetch(url, postData)
				.then(response => response.json())
				.then(function(result){
					console.log(result)
					if (result.success == true) {
						purchaseBtn.setAttribute("style", "background: #00DD00; width:500px;")
						purchaseBtn.innerHTML = "Item Purchased, Congratulations!"
					}
					else {
						purchaseBtn.setAttribute("style", "background: red;")
						purchaseBtn.disabled = true
						purchaseBtn.innerHTML = "ERROR"
						document.getElementById("api-response").innerHTML = "Error: " + result.error
						document.getElementById("api-response").setAttribute("style", "display: block")
					}
				})
			})
		}
		else {
			purchaseBtn.innerHTML = "Please log in to continue"
			purchaseBtn.setAttribute("style", "width: 500px;");
		}
		
	}
	else if (purchaseBtn.innerHTML == "Item Purchased, Congratulations!") {
		window.location.replace("home")
	}
	else {
		purchaseBtn.disabled = true
	}
	
}

function edit_item() {
	firebase.auth().currentUser.getIdToken().then(function(idToken) {
		var item_id_element = document.getElementById("productID")
		var item_id = item_id_element.getAttribute("product_id")
		window.location.replace("edit-item?uToken=" + idToken + '&productid=' + item_id)
	})
	.catch(e => {console.log(e)})
}

function place_item_on_sale() {
	firebase.auth().currentUser.getIdToken().then(function(idToken) {
		var item_id_element = document.getElementById("productID")
		var item_id = item_id_element.getAttribute("product_id")
		var place_on_sale_button = document.getElementById("sellBtn")
		const url = 'place-on-sale-api'
		let data = {
					item: item_id,
					user: idToken
				}
		let postData = { 
					method: 'POST', 
					body: JSON.stringify(data),
					headers: {'Content-Type': 'application/json'}
				}
		fetch(url, postData)
		.then(response => response.json())
		.then(function(result){
			console.log(result)
			if (result.success == true) {
				place_on_sale_button.setAttribute("style", "background: #00DD00; width:200px;")
				place_on_sale_button.innerHTML = "Item on sale!"
				place_on_sale_button.disabled = true
			}
			else {
				place_on_sale_button.setAttribute("style", "background: red;")
				place_on_sale_button.disabled = true
				place_on_sale_button.innerHTML = "ERROR"
				console.log(result.error)
			}
		})
	})
	.catch(e => {console.log(e)})
}

function ship_item() {
	firebase.auth().currentUser.getIdToken().then(function(idToken) {
		var item_id_element = document.getElementById("productID")
		var item_id = item_id_element.getAttribute("product_id")
		var ship_button = document.getElementById("shipBtn")
		const url = 'ship-api'
		let data = {
					item: item_id,
					user: idToken
				}
		let postData = { 
					method: 'POST', 
					body: JSON.stringify(data),
					headers: {'Content-Type': 'application/json'}
				}
		fetch(url, postData)
		.then(response => response.json())
		.then(function(result){
			console.log(result)
			if (result.success == true) {
				ship_button.setAttribute("style", "background: #00DD00; width:200px;")
				ship_button.innerHTML = "Item shipped!"
				ship_button.disabled = true

				var sell_button = document.getElementById("sellBtn")
				var edit_button = document.getElementById("editBtn")
				sell_button.disabled = true
				edit_button.disabled = true

			}
			else {
				ship_button.setAttribute("style", "background: red;")
				ship_button.disabled = true
				ship_button.innerHTML = "ERROR"
				console.log(result.error)
			}
		})
	})
	.catch(e => {console.log(e)})
}

function my_product(productID) {
	firebase.auth().currentUser.getIdToken().then(function(idToken) {
		window.location.replace("my-product?uToken=" + idToken + '&productid=' + productID)
	})
	.catch(e => {console.log(e)})
}

function my_products() {
	firebase.auth().currentUser.getIdToken().then(function(idToken) {
		window.location.replace("my-products?uToken=" + idToken)
	})
	.catch(e => {console.log(e)})
}

function showShipField(){
	document.getElementById('shippingaddressbutton').setAttribute("style", "display:none;")
	document.getElementById('shippingaddressinput').setAttribute("style", "display:block;")
}

function addShippingAddress(){
	let database = firebase.database()
	var usersRef = database.ref("/users")
	usersRef.orderByChild("UID").equalTo(firebase.auth().currentUser.uid).once('value', function(snapshot){
		vals = snapshot.val()
		var keys = Object.keys(vals)
		userKey = keys[0]
		userRef = database.ref("/users/"+userKey)
		userRef.update({address:document.getElementById('shippingaddressinput').value})
		.then(function(){
			document.getElementById("shippingaddressinput").value = ""
			document.getElementById("shippingaddressinput").placeholder = "Success!"
		})
		.catch(e => {console.log(e)})
	})
}
try {
	var addressField = document.getElementById("shippingaddressinput")
	addressField.addEventListener("keyup", function(event) {
	if (event.keyCode === 13) {
		event.preventDefault()
		if (addressField.value == "Success!" || addressField.value == ""){
			addressField.value = ""
			addressField.blur()
		}
		else {
				addShippingAddress()
				addressField.blur()
			}
		}
	})
}
catch(e=>{console.log(e)}