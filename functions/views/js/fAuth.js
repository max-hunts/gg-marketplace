function checkAuth(){
	firebase.auth().onAuthStateChanged(function(user){
		if (user) {
			document.getElementById('uname-dom').innerHTML = "Loading..."
			let database = firebase.database()
			var uid = user.uid
			var dbRef = database.ref("/users")
			dbRef.orderByChild("UID").equalTo(uid).once('value', function(snapshot){
				vals = snapshot.val()
				var keys = Object.keys(vals)
				uData = vals[keys[0]]
				document.getElementById('uname-dom').innerHTML = "Hello, " + uData.fName

				if (!uData.address) {
					document.getElementsByClassName("notifications")[0].innerHTML = "🔔 | Update shipping address"
					document.getElementsByClassName("notifications")[0].setAttribute("style", "color: red;")
				}
			})

			document.getElementById('uname-field').setAttribute("style", "display: block;")
			document.getElementById('login-field').setAttribute("style", "display: none;")
			
			document.getElementById('uname-field').setAttribute("style", "display: block;")
			document.getElementById('login-field').setAttribute("style", "display: none;")
			try {document.getElementById('uAuthMsg').setAttribute("style", "display: none;")}
			catch(error) {console.log(error)}
			try{document.getElementById('npf').setAttribute("style", "display: block;")}
			catch(error) {console.log(error)}
		}
		else {
			document.getElementById('uname-field').setAttribute("style", "display: none;")
			document.getElementById('login-field').setAttribute("style", "display: block;")
			document.getElementById('uname-dom').innerHTML = "Unregistered"
			try{document.getElementById('uAuthMsg').setAttribute("style", "display: block;")}
			catch(error) {console.log(error)}
			try{document.getElementById('npf').setAttribute("style", "display: none;")}
			catch(error) {console.log(error)}
		}
	})
}

checkAuth()


function signinwithgoogle(){
	var googleAuthProvider = new firebase.auth.GoogleAuthProvider()
	firebase.auth().signInWithPopup(googleAuthProvider)
		.then(function(data){
			checkNewUser(data)
			console.log('User signed in...')
		})
		.catch(function(error){
			console.log(error)
		})
}

function checkNewUser(credential){
	let database = firebase.database()
	var uid = credential.user.uid
	var dbRef = database.ref("/users")
	dbRef.orderByChild("UID").equalTo(uid).once('value', function(snapshot){
		if (snapshot.exists()){
			let uData = snapshot.val()
			console.log(uData)
			console.log("Logged in User: " + uData.fName + " " + uData.lName)
		}
		else {
			console.log("Creating new user")
			let uData = {
				fName:credential.user.displayName,
				lName:"",
				UID:credential.user.uid,
				email:credential.user.email,
				address:""
			}
			let itemRef = database.ref('/users')
			itemRef.push(uData)
			.then(function(){
				console.log("Added "+credential.displayName+" to user database")
				window.location.replace('home')
			})
			.catch(function(error){console.log(error)})
		}
	})
}

function signinwithfb(){
	var fbAuthProvider = new firebase.auth.FacebookAuthProvider()
	firebase.auth().signInWithPopup(fbAuthProvider)
		.then(function(data){
			checkNewUser(data)
			console.log('User signed in...')
		})
		.catch(function(error){
			console.log(error)
		})
}

function signinwithemail(){
	const txtEmail = document.getElementById('fuid')
	const txtPassword = document.getElementById('fpwd')

	var email = txtEmail.value
	var pass = txtPassword.value
	var auth = firebase.auth()

	auth.signInWithEmailAndPassword(email, pass)
		.catch(e => console.log(e.message))
		.then(function(data){
			checkNewUser(data)
			txtPassword.value = ''
			txtEmail.value = ''
		})


}

function signout(){
	firebase.auth().signOut()
	window.location.replace('home')
	// window.location.replace(window.location.href.split("?")[0])
}


var pwField = document.getElementById("fpwd");
pwField.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
   event.preventDefault();
   document.getElementById("blogin").click();
  }
});
