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