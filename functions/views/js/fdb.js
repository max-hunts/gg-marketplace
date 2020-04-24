function productSubmutEventHandler(){
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
	updateDBImg(productKey, imgPath)

	storageRef.put(image)
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
			window.location.replace('home?itemAdded=true')
		})
}

function updateImgs() {
	const storage = firebase.storage()
	const rootReference = storage.ref('/product-img')

	var images = document.getElementsByClassName('dyn-img')
	// console.log(images)
	Array.from(images).forEach((image) => {
		var pathReference = rootReference.child(image.title)
    	pathReference.getDownloadURL().then(function(url) {image.src = url})
    })
}
updateImgs();