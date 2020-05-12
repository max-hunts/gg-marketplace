const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
})

async function productSubmitEventHandler(){
	let newProduct = {
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

	let sessUid = firebase.auth().currentUser.uid

	newProduct.id = 999
	newProduct.name = nameField.value
	newProduct.desc = descField.value
	newProduct.location = locField.value
	if (stockField.value) {
		newProduct.stock = stockField.value
	}
	newProduct.price = priceField.value
	newProduct.owner = sessUid
	newProduct.holder = sessUid

	let image = imgBtn.files[0]
	imageName = image.name
	// imageB64 = await toBase64(image)
	let imagePackage = {name:imageName, b64:null}

	const submitBtn = document.getElementById('pSend')
	submitBtn.innerHTML = "Uploading..."
	submitBtn.disabled = true

	firebase.auth().currentUser.getIdToken().then(function(idToken){
		let url = 'new-product-api'
		let data = {uToken: idToken, product: newProduct, image: imagePackage}
		let postData = {method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}}
		fetch(url, postData)
		.then(response => response.json())
		.then(function(result){
			if (result.success) {
				let imageRef = firebase.storage().ref(result.imgRef)
				imageRef.put(image).then(function(){
					window.location.replace('home?itemAdded=true')
				})
				.catch(e=>{
					console.log(e)
					submitBtn.innerHTML = "Error..."
				})
			}
			else {
				submitBtn.innerHTML = "Error..."
				console.log(result.error)
			}
		})
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

		updates = {
			name: nameField.value,
			desc: descField.value,
			location: locField.value,
			stock: stockField.value,
			price: priceField.value
		}

		firebase.auth().currentUser.getIdToken().then(function(idToken){
			let url = 'update-product-api'
			let data = {uToken: idToken, product: updates, productID: item_id}
			let postData = {method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}}
			fetch(url, postData)
			.then(response => response.json())
			.then(function(result){
				if (result.success) {
					submitBtn.setAttribute("style", "width: 300px; background: #00DD00;cursor: pointer;")
					submitBtn.innerHTML = "Done!, Go Home..."
					submitBtn.disabled = false
				}
				else {
					console.log(result.error)
					submitBtn.innerHTML = "Error..."
				}
			})
		})
	}
	else {
		window.location.replace('home')
	}
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
		purchaseBtn.setAttribute("style", "background: #ff813d; width:300px;")
		purchaseBtn.innerHTML = "Confirm?"
	}
	else if (purchaseBtn.innerHTML == "Confirm?") {
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
						purchaseBtn.setAttribute("style", "background: #00DD00; width:500px; transition: 0.7s;")
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
	let newAddress = document.getElementById('shippingaddressinput').value
	firebase.auth().currentUser.getIdToken().then(function(idToken){
		let url = 'shipping-adress-edit-api'
		let data = {uToken: idToken, address: newAddress}
		let postData = {method: 'POST', body: JSON.stringify(data),headers: {'Content-Type': 'application/json'}}
		fetch(url, postData)
		.then(response => response.json())
		.then(function(result){
			if (result.success) {
				document.getElementById("shippingaddressinput").value = ""
				document.getElementById("shippingaddressinput").placeholder = "Success!"
			}
			else {
				document.getElementById("shippingaddressinput").value = ""
				document.getElementById("shippingaddressinput").placeholder = "FAIL, " + esult.error
			}
		})
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
catch(error) {console.log(error)}