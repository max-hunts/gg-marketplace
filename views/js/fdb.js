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
	var image = imgBtn.files[0]
	var storageRef = firebase.storage().ref('/product-img/' + image.name)
	storageRef.put(image)

	var sessUid = firebase.auth().currentUser.uid

	data.id = 999
	data.name = nameField.value
	data.desc = descField.value
	data.img = image.name
	data.location = locField.value
	data.stock = stockField.value
	data.public = publicField.value
	data.price = priceField.value
	data.owner = sessUid
	data.holder = sessUid

	addItem(data)
}

function addItem(item){
	var database = firebase.database()
	var itemRef = database.ref('/products')

	itemRef.push(item)
		.then(function(){
			window.location.replace('/?itemAdded=true')
		})
		.catch(function(error){
			console.log(error)
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