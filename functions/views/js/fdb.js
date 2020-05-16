function checkFields() {
	if (document.getElementById('pName').value && document.getElementById('pDesc').value 
	&& document.getElementById('pLoc').value && document.getElementById('pPrice').value 
	&& document.getElementById('pImg').files[0].name) {
		return true
	}
	return false
}

async function productSubmitEventHandler(){
	const submitBtn = document.getElementById('pSend')
	if (submitBtn.innerHTML == "Submit!") {
		if (checkFields()) {
			submitBtn.innerHTML = "Uploading..."
			submitBtn.disabled = true

			let newProduct = {id: 1,name: "",desc: "",img: "default.png",location: "",stock: 1,status: "on-sale",price: 0,owner: "",holder: ""}

			const nameField = document.getElementById('pName')
			const descField = document.getElementById('pDesc')
			const locField = document.getElementById('pLoc')
			const stockField = document.getElementById('pStock')
			const priceField = document.getElementById('pPrice')
			const imgBtn = document.getElementById('pImg')

			let uid = firebase.auth().currentUser.uid

			newProduct.id = 999
			newProduct.name = nameField.value
			newProduct.desc = descField.value
			newProduct.location = locField.value
			if (stockField.value) {newProduct.stock = stockField.value}
			newProduct.price = priceField.value
			newProduct.owner = uid
			newProduct.holder = uid

			let image = imgBtn.files[0]
			imageName = image.name
			let imagePackage = {name:imageName, b64:null}

			firebase.auth().currentUser.getIdToken().then(function(idToken){
				let url = 'new-product-api'
				let data = {authToken: idToken, product: newProduct, image: imagePackage}
				let postData = {method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}}
				fetch(url, postData)
				.then(response => response.json())
				.then(function(result){
					if (result.success) {
						let imageRef = firebase.storage().ref(result.imgRef)
						imageRef.put(image).then(function(){
							submitBtn.innerHTML = "Done! Go Home..."
							submitBtn.disabled = false
							submitBtn.setAttribute('style', 'background:#00FF55; transition:0.5s; width:500px;')
						})
						.catch(e=>{
							submitBtn.innerHTML = "Error..."
							submitBtn.setAttribute('style', 'color:red;')
							document.getElementById("api-response").innerHTML = "Error: " + e
							document.getElementById("api-response").setAttribute("style", "display: block")
						})
					}
					else {
						submitBtn.innerHTML = "Error..."
						submitBtn.setAttribute('style', 'color:red;')
						document.getElementById("api-response").innerHTML = "Error: " + result.error
						document.getElementById("api-response").setAttribute("style", "display: block")
					}
				})
			})
		} else {
			document.getElementById("api-response").innerHTML = "Fill in all required fields!"
			document.getElementById("api-response").setAttribute("style", "display: block")
		}
	} else {
		window.location.replace('home')
	}
}

function productUpdateEventHandler() {
	const submitBtn = document.getElementById('pSend')
	if (submitBtn.innerHTML == "Update") {
		const nameField = document.getElementById('pName')
		const descField = document.getElementById('pDesc')
		const locField = document.getElementById('pLoc')
		const stockField = document.getElementById('pStock')
		const priceField = document.getElementById('pPrice')

		const item_id_element = document.getElementById("productID")
		const item_id = item_id_element.getAttribute("product_id")

		submitBtn.innerHTML = "Updating..."
		submitBtn.disabled = true

		updates = {name: nameField.value, desc: descField.value, location: locField.value, stock: stockField.value, price: priceField.value}

		firebase.auth().currentUser.getIdToken().then(function(idToken){
			let url = 'update-product-api'
			let data = {authToken: idToken, product: updates, productID: item_id}
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
					submitBtn.innerHTML = "Error..."
					submitBtn.setAttribute('style', 'color:red;')
					document.getElementById("api-response").innerHTML = "Error: " + result.error
					document.getElementById("api-response").setAttribute("style", "display: block")
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
	const imgRef = storage.ref()

	var images = document.getElementsByClassName('dyn-img')
	// console.log(images)
	Array.from(images).forEach((image) => {
		var pathReference = imgRef.child(image.title)
		pathReference.getDownloadURL().then(function(url) {image.src = url}).catch(e => {console.log(e.message)})
	})
}
updateImgs()

function requestItem(){
	const reqBtn = document.getElementById('req-btn')
	const bMessage = document.getElementById('bMsg')
	if (reqBtn.innerHTML == "Request!") {
		if (firebase.auth().currentUser) {
			reqBtn.setAttribute("style", "background: #87e5ff; width:300px;")
			reqBtn.innerHTML = "Send?"
			bMessage.setAttribute('style', 'display: block;')
		} else {
			reqBtn.innerHTML = "Please sign in"
			reqBtn.setAttribute("style", "background: #FFa5af; width:300px;")
		}
	}
	else if (reqBtn.innerHTML == "Send?") {
		if (firebase.auth().currentUser) {
			firebase.auth().currentUser.getIdToken().then(function(idToken) {
				reqBtn.innerHTML = "Sending..."
				reqBtn.disabled = true
				let userMessage = bMessage.value
				let item_id = document.getElementById("productID").getAttribute("product_id")
				const url = 'request-api'
				let data = {prodID: item_id, authToken: idToken, usrMsg: userMessage}
				let postData = {method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}}
				fetch(url, postData)
				.then(response => response.json())
				.then(function(result){
					console.log(result)
					if (result.success == true) {
						reqBtn.setAttribute("style", "background: #00DD00; width:520px; transition: 0.7s;")
						reqBtn.innerHTML = "Done! Go Home"
						reqBtn.disabled = false
					}
					else {
						reqBtn.setAttribute("style", "background: red;")
						reqBtn.disabled = true
						reqBtn.innerHTML = "ERROR"
						document.getElementById("api-response").innerHTML = "Error: " + result.error
						document.getElementById("api-response").setAttribute("style", "display: block")
					}
				})
			})
		} else {
			reqBtn.innerHTML = "Please sign in"
		}
	}
	else {
		window.location.replace('home')
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

function toggle_sale() {
	firebase.auth().currentUser.getIdToken().then(function(idToken) {
		let item_id = document.getElementById("productID").getAttribute("product_id")
		let item_status = document.getElementById("productID").getAttribute("product_status")
		let toggle_sale_btn = document.getElementById("toggleSaleBtn")
		toggle_sale_btn.disabled = true
		var toggle_status = true
		if (item_status == 'on-sale') {toggle_status = false}
		const url = 'toggle-sale-api'
		let data = {prodID: item_id, authToken: idToken, targetState: toggle_status}
		let postData = { method: 'POST', body: JSON.stringify(data),headers: {'Content-Type': 'application/json'}}
		fetch(url, postData)
		.then(response => response.json())
		.then(function(result){
			console.log(result)
			if (result.success == true) {
				toggle_sale_btn.setAttribute("style", "background: #00DD00; transition: 0.5s;")
				toggle_sale_btn.innerHTML = "Done!"
				let sold_btn = document.getElementById("soldBtn")
				let edit_button = document.getElementById("editBtn")
				sold_btn.disabled = true
				edit_button.disabled = true
			} else {
				toggle_sale_btn.setAttribute("style", "background: red;")
				toggle_sale_btn.innerHTML = "ERROR"
				document.getElementById("api-response").innerHTML = "Error: " + result.error
				document.getElementById("api-response").setAttribute("style", "display: block")
			}
		})
		.catch (e=>{
			toggle_sale_btn.setAttribute("style", "background: red;")
			toggle_sale_btn.innerHTML = "ERROR"
			document.getElementById("api-response").innerHTML = "Error: " + e
			document.getElementById("api-response").setAttribute("style", "display: block")
		})
	})
}

function mark_as_sold(){
	firebase.auth().currentUser.getIdToken().then(function(idToken) {
		let item_id = document.getElementById("productID").getAttribute("product_id")
		let sold_btn = document.getElementById("soldBtn")
		const url = 'sold-api'
		let data = {prodID: item_id, authToken: idToken}
		let postData = { method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}}
		fetch(url, postData)
		.then(response => response.json())
		.then(function(result){
			if (result.success == true) {
				sold_btn.setAttribute("style", "background: #00DD00; width:200px;")
				sold_btn.innerHTML = "Sold!"
				sold_btn.disabled = true
				let sale_button = document.getElementById("toggleSaleBtn")
				let edit_button = document.getElementById("editBtn")
				sale_button.disabled = true
				edit_button.disabled = true
			}
			else {
				sold_btn.setAttribute("style", "background: red;")
				sold_btn.innerHTML = "ERROR"
				document.getElementById("api-response").innerHTML = "Error: " + e
				document.getElementById("api-response").setAttribute("style", "display: block")
			}
		})
		.catch (e=>{
			sold_btn.setAttribute("style", "background: red;")
			sold_btn.innerHTML = "ERROR"
			document.getElementById("api-response").innerHTML = "Error: " + e
			document.getElementById("api-response").setAttribute("style", "display: block")
		})
	})
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
	showUserShippingAddress()
}

function showUserShippingAddress(){
	firebase.auth().currentUser.getIdToken().then(function(idToken){
		let url = 'shipping-adress-get-api'
		let data = {authToken: idToken}
		let postData = {method: 'POST', body: JSON.stringify(data),headers: {'Content-Type': 'application/json'}}
		fetch(url, postData)
		.then(response => response.json())
		.then(function(result){
			if (result.success) {
				document.getElementById("shippingaddressinput").value = result.address
			}
			else {
				document.getElementById("api-response").innerHTML = "Error: " + result.error
				document.getElementById("api-response").setAttribute("style", "display: block")
				document.getElementById("shippingaddressinput").value = ""
				document.getElementById("shippingaddressinput").placeholder = "Can't retrieve current shipping address"
			}
		})
	})
}

function addShippingAddress(){
	let newAddress = document.getElementById('shippingaddressinput').value
	firebase.auth().currentUser.getIdToken().then(function(idToken){
		let url = 'shipping-adress-edit-api'
		let data = {authToken: idToken, address: newAddress}
		let postData = {method: 'POST', body: JSON.stringify(data),headers: {'Content-Type': 'application/json'}}
		fetch(url, postData)
		.then(response => response.json())
		.then(function(result){
			if (result.success) {
				document.getElementById("shippingaddressinput").value = ""
				document.getElementById("shippingaddressinput").placeholder = "Success!"
			}
			else {
				document.getElementById("api-response").innerHTML = "Error: " + result.error
				document.getElementById("api-response").setAttribute("style", "display: block")
				document.getElementById("shippingaddressinput").value = ""
				document.getElementById("shippingaddressinput").placeholder = "ERROR!"
			}
		})
	})
}

function search(keywords){
	window.location.replace('search?search='+keywords)
}

function u_r_submit(){
	let submitBtn = document.getElementById('u-r-btn')
	if (submitBtn.innerHTML == "Submit!") {
		submitBtn.disabled = true
		if (firebase.auth().currentUser) {
			firebase.auth().currentUser.getIdToken().then(function(idToken){
				let firstNameField = document.getElementById('f-name')
				let lastNameField = document.getElementById('l-name')
				let addressField = document.getElementById('u-address')
				let fName = firstNameField.value
				let lName = lastNameField.value
				let address = addressField.value
				let picName = "todo.png"
				let userData = {fName:fName, lName:lName, address:address, pPic:picName}
				let url = 'register-new-user-api'
				let data = {authToken: idToken, data: userData}
				let postData = {method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}}
				fetch(url, postData)
				.then(response => response.json())
				.then(function(result){
					if (result.success) {
						submitBtn.setAttribute("style", "background: #00FF00; width: 100%; transition: 0.5s;")
						submitBtn.innerHTML = "Success! Go Home..."
						submitBtn.disabled = false
					}
					else {
						submitBtn.setAttribute("style", "background: red;")
						submitBtn.innerHTML = "ERROR"
						submitBtn.disabled = false
						document.getElementById("api-response").innerHTML = "Error: " + result.error
						document.getElementById("api-response").setAttribute("style", "display: block")
					}
				})
			})
			.catch(e=>{
				submitBtn.setAttribute("style", "background: red;")
				submitBtn.innerHTML = "AUTH!!!"
				document.getElementById("api-response").innerHTML = "Error: " + e
				document.getElementById("api-response").setAttribute("style", "display: block")
			})
		} else {
			submitBtn.setAttribute("style", "background: red;")
			submitBtn.disabled = false
			submitBtn.innerHTML = "ERROR!"
			document.getElementById("api-response").innerHTML = "Error: Please log in"
			document.getElementById("api-response").setAttribute("style", "display: block")
		}
	} else {
		window.location.replace('home')
	}
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

function bSearch(){
	let searchField = document.getElementById("sfield")
	if (searchField.value == ""){
		searchField.blur()
	}
	else {
		search(searchField.value)
		}
}


try {
	let searchField = document.getElementById("sfield")
	searchField.addEventListener("keyup", function(event) {
	if (event.keyCode === 13) {
		event.preventDefault()
		if (searchField.value == ""){
			searchField.blur()
		}
		else {
			search(searchField.value)
			}
		}
	})
}
catch(error) {}

try {
	let regAddressField = document.getElementById("u-address")
	regAddressField.addEventListener("keyup", function(event) {
	if (event.keyCode === 13) {
		event.preventDefault()
		document.getElementById("u-r-btn").click()
		}
	})
}
catch(error) {}