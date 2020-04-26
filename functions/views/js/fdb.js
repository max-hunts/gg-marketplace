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
		img: "",
		location: "",
		stock: 0,
		public: true,
		price: 0,
		owner: "",
		holder: ""
	}

	const nameField = document.getElementById('pName')
	const descField = document.getElementById('pDesc')
	const locField = document.getElementById('pLoc')
	const stockField = document.getElementById('pStock')
	const publicField = document.getElementById('pPublic')
	const priceField = document.getElementById('pPrice')

	const imgBtn = document.getElementById('pImg')

	var sessUid = firebase.auth().currentUser.uid

	data.id = 999
	data.name = nameField.value
	data.desc = descField.value
	data.img = "default.png"
	data.location = locField.value
	data.stock = stockField.value
	data.public = publicField.value
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
				const url = 'purchase-api';
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
						document.getElementById("api-response").setAttribute("style", "display: block")
					}
					else {
						document.getElementById("api-response").innerHTML = "Error: " + result.error
						document.getElementById("api-response").setAttribute("style", "display: block")
						document.getElementById("api-response").setAttribute("style", "color: #DD0000")
					}
					//check return value
					//update element accordingly
				})
			})
		}
		else {
			purchaseBtn.innerHTML = "Please log in to continue"
			purchaseBtn.setAttribute("style", "width: 500px;");
		}
		
	}
	else {
		purchaseBtn.disabled = true
	}
	
}

function my_product(productID) {
	firebase.auth().currentUser.getIdToken().then(function(idToken) {
		console.log("my-products?uToken=" + idToken + '&productid=' + productID)
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