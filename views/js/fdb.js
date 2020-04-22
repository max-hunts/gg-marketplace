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
	const imgField = document.getElementById('pImgUrl')
	const locField = document.getElementById('pLoc')
	const stockField = document.getElementById('pStock')
	const publicField = document.getElementById('pPublic')
	const priceField = document.getElementById('pPrice')

	var sessUid = firebase.auth().currentUser.uid

	data.id = 999
	data.name = nameField.value
	data.desc = descField.value
	data.img = imgField.value
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